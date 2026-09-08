import { env } from "@/lib/netlifyRuntime";
import { netlifyDatabaseIsConfigured } from "@/lib/localAccountFallback";
import { restoreFamiliarHome } from "@/lib/famiglioHome";
import { claimFamiliarAttendanceReward } from "@/lib/famiglioAttendanceYear";
import { sanitizeFamiglioRebuildCloudSave } from "@/lib/famiglioRebuildCloud";
import { createLoreWiseServerClient, getLoreWiseUser, isLocalLoreWiseRequest } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
type RuntimeEnv = { DB?: D1Database };
type SaveRow = { save_json: string; revision: number };
const headers = { "Cache-Control": "private, no-store" };
const json = (body: Record<string, unknown>, status = 200) => Response.json(body, { status, headers });

function readMetadata(user: Awaited<ReturnType<typeof getLoreWiseUser>>) {
  const checked = sanitizeFamiglioRebuildCloudSave(user?.user_metadata?.nexus_pet_rebuild_save);
  return { save: checked.ok ? checked.save : null, revision: Math.max(0, Math.floor(Number(user?.user_metadata?.nexus_pet_rebuild_revision) || 0)) };
}

async function readDatabase(database: D1Database, customerId: string) {
  const row = await database.prepare("SELECT save_json, revision FROM nexus_pet_rebuild_saves WHERE customer_id = ?").bind(customerId).first<SaveRow>();
  if (!row) return { save: null, revision: 0 };
  try { const checked = sanitizeFamiglioRebuildCloudSave(JSON.parse(row.save_json)); return { save: checked.ok ? checked.save : null, revision: Math.max(0, Number(row.revision) || 0) }; }
  catch { return { save: null, revision: Math.max(0, Number(row.revision) || 0) }; }
}

export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) return json({ error: "Origine non valida." }, 403);
    const user = await getLoreWiseUser();
    if (!user) return json({ error: "Accedi al LoreWise ID per registrare la presenza." }, 401);
    const body = await request.json().catch(() => ({})) as { houseIndex?: unknown; baseRevision?: unknown };
    const houseIndex = Math.max(0, Math.min(2, Math.floor(Number(body.houseIndex) || 0)));
    const baseRevision = Math.max(0, Math.floor(Number(body.baseRevision) || 0));
    const local = await isLocalLoreWiseRequest() && !netlifyDatabaseIsConfigured();
    const database = (env as unknown as RuntimeEnv).DB;
    const current = local ? readMetadata(user) : database ? await readDatabase(database, user.id) : null;
    if (!current?.save) return json({ error: "Prima completa la schiusa del Famiglio." }, 409);
    if (current.revision !== baseRevision) return json({ error: "La Casa \u00e8 stata aggiornata su un altro dispositivo.", revision: current.revision }, 409);
    const house = current.save.houses[houseIndex];
    if (!house || typeof house !== "object") return json({ error: "Casa del Famiglio non disponibile." }, 409);
    const home = restoreFamiliarHome((house as Record<string, unknown>).home);
    const claimed = claimFamiliarAttendanceReward(home);
    if (!claimed.reward) return json({ error: claimed.duplicate ? "La presenza di oggi \u00e8 gi\u00e0 stata riscossa." : "Il calendario annuale non \u00e8 attivo." }, 409);
    const houses = [...current.save.houses];
    houses[houseIndex] = { ...house, home: claimed.state };
    const save = { ...current.save, houses, updatedAt: new Date().toISOString() };
    const revision = current.revision + 1;
    if (local) {
      const client = await createLoreWiseServerClient();
      if (!client) return json({ error: "Servizio LoreWise ID non disponibile." }, 503);
      const { error } = await client.auth.updateUser({ data: { ...user.user_metadata, nexus_pet_rebuild_save: save, nexus_pet_rebuild_revision: revision } });
      if (error) return json({ error: "Riscatto non completato: riprova, il premio non \u00e8 stato consumato." }, 503);
    } else {
      if (!database) return json({ error: "Archivio Nexus Pet temporaneamente non disponibile." }, 503);
      const updated = await database.prepare("UPDATE nexus_pet_rebuild_saves SET save_json = ?, revision = ?, updated_at = CURRENT_TIMESTAMP WHERE customer_id = ? AND revision = ?")
        .bind(JSON.stringify(save), revision, user.id, current.revision).run();
      if (!updated.meta.changes) return json({ error: "Riscatto in conflitto: riprova, il premio non \u00e8 stato consumato." }, 409);
    }
    return json({ home: claimed.state, reward: claimed.reward, revision });
  } catch {
    return json({ error: "Riscatto non completato: riprova, il premio non \u00e8 stato consumato." }, 503);
  }
}
