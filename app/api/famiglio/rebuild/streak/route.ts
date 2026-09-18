import { env } from "@/lib/netlifyRuntime";
import { netlifyDatabaseIsConfigured } from "@/lib/localAccountFallback";
import { restoreFamiliarHome } from "@/lib/famiglioHome";
import { isFamiglioRequestOriginAllowed } from "@/lib/famiglioRequestOrigin";
import { claimFamiliarStreakMilestone } from "@/lib/famiglioStreak";
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

/**
 * Riscatta un traguardo della serie di presenze. La serie è calcolata sul
 * server dal Registro presenze salvato, con l'orologio del server (fuso
 * Europe/Rome): il client indica soltanto quale traguardo vuole riscattare.
 * L'aggiornamento è condizionato alla revisione, quindi due richieste
 * simultanee non possono pagare due volte lo stesso traguardo.
 */
export async function POST(request: Request) {
  try {
    if (!isFamiglioRequestOriginAllowed(request)) return json({ error: "Origine non valida." }, 403);
    const user = await getLoreWiseUser();
    if (!user) return json({ error: "Accedi al LoreWise ID per riscattare i traguardi della serie." }, 401);
    const body = await request.json().catch(() => ({})) as { houseIndex?: unknown; baseRevision?: unknown; days?: unknown };
    const houseIndex = Math.max(0, Math.min(2, Math.floor(Number(body.houseIndex) || 0)));
    const baseRevision = Math.max(0, Math.floor(Number(body.baseRevision) || 0));
    const days = Math.floor(Number(body.days) || 0);
    const local = await isLocalLoreWiseRequest() && !netlifyDatabaseIsConfigured();
    const database = (env as unknown as RuntimeEnv).DB;
    const current = local ? readMetadata(user) : database ? await readDatabase(database, user.id) : null;
    if (!current?.save) return json({ error: "Prima completa la schiusa del Famiglio." }, 409);
    if (current.revision !== baseRevision) return json({ error: "La Casa è stata aggiornata su un altro dispositivo.", revision: current.revision }, 409);
    const house = current.save.houses[houseIndex];
    if (!house || typeof house !== "object") return json({ error: "Casa del Famiglio non disponibile." }, 409);
    const home = restoreFamiliarHome((house as Record<string, unknown>).home);
    const claimed = claimFamiliarStreakMilestone(home, days);
    if (claimed.status === "unknown") return json({ error: "Traguardo della serie non riconosciuto." }, 400);
    if (claimed.status === "duplicate") return json({ error: "Questo traguardo è già stato riscattato per la serie in corso." }, 409);
    if (claimed.status === "locked") return json({ error: "La serie non ha ancora raggiunto questo traguardo." }, 409);
    const houses = [...current.save.houses];
    houses[houseIndex] = { ...house, home: claimed.state };
    const save = { ...current.save, houses, updatedAt: new Date().toISOString() };
    const revision = current.revision + 1;
    if (local) {
      const client = await createLoreWiseServerClient();
      if (!client) return json({ error: "Servizio LoreWise ID non disponibile." }, 503);
      const { error } = await client.auth.updateUser({ data: { ...user.user_metadata, nexus_pet_rebuild_save: save, nexus_pet_rebuild_revision: revision } });
      if (error) return json({ error: "Riscatto non completato: riprova, il premio non è stato consumato." }, 503);
    } else {
      if (!database) return json({ error: "Archivio Nexus Pet temporaneamente non disponibile." }, 503);
      const updated = await database.prepare("UPDATE nexus_pet_rebuild_saves SET save_json = ?, revision = ?, updated_at = CURRENT_TIMESTAMP WHERE customer_id = ? AND revision = ?")
        .bind(JSON.stringify(save), revision, user.id, current.revision).run();
      if (!updated.meta.changes) return json({ error: "Riscatto in conflitto: riprova, il premio non è stato consumato." }, 409);
    }
    return json({ home: claimed.state, milestone: claimed.milestone, coins: claimed.coins, coverGranted: claimed.coverGranted, revision });
  } catch {
    return json({ error: "Riscatto non completato: riprova, il premio non è stato consumato." }, 503);
  }
}
