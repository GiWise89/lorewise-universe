import { env } from "@/lib/netlifyRuntime";
import { netlifyDatabaseIsConfigured } from "@/lib/localAccountFallback";
import {
  FAMIGLIO_REBUILD_CLOUD_MAX_BYTES,
  sanitizeFamiglioRebuildCloudSave,
} from "@/lib/famiglioRebuildCloud";
import { syncLoreWiseCustomer } from "@/lib/supabase/customer";
import { createLoreWiseServerClient, getLoreWiseUser, isLocalLoreWiseRequest } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RuntimeEnv = { DB?: D1Database };
type SaveRow = { save_json: string; revision: number };
const privateHeaders = { "Cache-Control": "private, no-store" };

function json(body: Record<string, unknown>, status = 200) {
  return Response.json(body, { status, headers: privateHeaders });
}

function metadataSave(user: Awaited<ReturnType<typeof getLoreWiseUser>>) {
  if (!user) return { save: null, revision: 0 };
  const checked = sanitizeFamiglioRebuildCloudSave(user.user_metadata?.nexus_pet_rebuild_save);
  return {
    save: checked.ok ? checked.save : null,
    revision: Math.max(0, Math.floor(Number(user.user_metadata?.nexus_pet_rebuild_revision) || 0)),
  };
}

async function databaseSave(database: D1Database, customerId: string) {
  const row = await database.prepare("SELECT save_json, revision FROM nexus_pet_rebuild_saves WHERE customer_id = ?")
    .bind(customerId).first<SaveRow>();
  if (!row) return { save: null, revision: 0 };
  try {
    const checked = sanitizeFamiglioRebuildCloudSave(JSON.parse(row.save_json));
    return { save: checked.ok ? checked.save : null, revision: Math.max(0, Number(row.revision) || 0) };
  } catch {
    return { save: null, revision: Math.max(0, Number(row.revision) || 0) };
  }
}

export async function GET() {
  try {
    const user = await getLoreWiseUser();
    if (!user) return json({ authenticated: false, save: null, revision: 0 }, 401);
    if (await isLocalLoreWiseRequest() && !netlifyDatabaseIsConfigured()) {
      return json({ authenticated: true, ...metadataSave(user), localPreview: true });
    }
    const database = (env as unknown as RuntimeEnv).DB;
    if (!database) return json({ error: "Archivio Nexus Pet temporaneamente non disponibile." }, 503);
    await syncLoreWiseCustomer(user);
    return json({ authenticated: true, ...await databaseSave(database, user.id) });
  } catch {
    return json({ error: "Non è stato possibile recuperare le Case del Nexus Pet." }, 503);
  }
}

export async function PUT(request: Request) {
  try {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) return json({ error: "Origine non valida." }, 403);
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > FAMIGLIO_REBUILD_CLOUD_MAX_BYTES * 2) return json({ error: "Salvataggio troppo grande." }, 413);
    const user = await getLoreWiseUser();
    if (!user) return json({ error: "Accedi al LoreWise ID per sincronizzare le Case." }, 401);
    const body = await request.json() as { save?: unknown; baseRevision?: unknown };
    const checked = sanitizeFamiglioRebuildCloudSave(body.save);
    if (!checked.ok) return json({ error: checked.error }, 400);
    const baseRevision = Math.max(0, Math.floor(Number(body.baseRevision) || 0));

    if (await isLocalLoreWiseRequest() && !netlifyDatabaseIsConfigured()) {
      const current = metadataSave(user);
      if (current.revision !== baseRevision) return json({ error: "Le Case sono state aggiornate su un altro dispositivo.", ...current }, 409);
      const revision = current.revision + 1;
      const client = await createLoreWiseServerClient();
      if (!client) return json({ error: "Servizio LoreWise ID non disponibile." }, 503);
      const { error } = await client.auth.updateUser({ data: {
        ...user.user_metadata,
        nexus_pet_rebuild_save: checked.save,
        nexus_pet_rebuild_revision: revision,
      } });
      if (error) return json({ error: "Sincronizzazione delle Case non riuscita." }, 503);
      return json({ save: checked.save, revision, localPreview: true });
    }

    const database = (env as unknown as RuntimeEnv).DB;
    if (!database) return json({ error: "Archivio Nexus Pet temporaneamente non disponibile." }, 503);
    await syncLoreWiseCustomer(user);
    const current = await databaseSave(database, user.id);
    if (current.revision !== baseRevision) return json({ error: "Le Case sono state aggiornate su un altro dispositivo.", ...current }, 409);
    const revision = current.revision + 1;
    if (current.revision === 0) {
      const inserted = await database.prepare(`INSERT INTO nexus_pet_rebuild_saves (customer_id, save_json, revision)
        VALUES (?, ?, ?) ON CONFLICT(customer_id) DO NOTHING`).bind(user.id, JSON.stringify(checked.save), revision).run();
      if (!inserted.meta.changes) return json({ error: "Le Case sono state aggiornate su un altro dispositivo.", ...await databaseSave(database, user.id) }, 409);
    } else {
      const updated = await database.prepare(`UPDATE nexus_pet_rebuild_saves SET save_json = ?, revision = ?, updated_at = CURRENT_TIMESTAMP
        WHERE customer_id = ? AND revision = ?`).bind(JSON.stringify(checked.save), revision, user.id, current.revision).run();
      if (!updated.meta.changes) return json({ error: "Le Case sono state aggiornate su un altro dispositivo.", ...await databaseSave(database, user.id) }, 409);
    }
    return json({ save: checked.save, revision });
  } catch {
    return json({ error: "Non è stato possibile sincronizzare le Case del Nexus Pet." }, 503);
  }
}
