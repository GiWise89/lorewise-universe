import { env } from "@/lib/netlifyRuntime";
import { netlifyDatabaseIsConfigured } from "@/lib/localAccountFallback";
import { isFamiglioRequestOriginAllowed, readBoundedJson } from "@/lib/famiglioRequestOrigin";
import { sanitizeFamiglioRebuildCloudSave } from "@/lib/famiglioRebuildCloud";
import { authoritativeHouseCombat, readFamiglioRebuildSave, submitFamiglioCombatReport, verifyFamiglioCombatReport } from "@/lib/famiglioCombatServer";
import { FAMILIAR_COMBAT_REPLAY_MAX_BYTES } from "@/lib/famiglioCombatVerification";
import { purchasedPremiumFamiliarIds } from "@/lib/nexusFamiliarCommerce";
import { getLoreWiseUser, isLocalLoreWiseRequest } from "@/lib/supabase/server";
import { getFamiglioUser, saveLocalGameData } from "@/lib/localPreviewGameStore";

export const dynamic = "force-dynamic";
type RuntimeEnv = { DB?: D1Database };
const headers = { "Cache-Control": "private, no-store" };
const json = (body: Record<string, unknown>, status = 200) => Response.json(body, { status, headers });

function readMetadata(user: Awaited<ReturnType<typeof getLoreWiseUser>>) {
  const checked = sanitizeFamiglioRebuildCloudSave(user?.user_metadata?.nexus_pet_rebuild_save);
  return { save: checked.ok ? checked.save : null, revision: Math.max(0, Math.floor(Number(user?.user_metadata?.nexus_pet_rebuild_revision) || 0)) };
}

const NOT_SYNCED = "La Casa non è ancora sincronizzata: la battaglia verrà verificata a breve.";

/**
 * Verifica di una battaglia conclusa. Corpo: { houseIndex, replay } oppure
 * { houseIndex, resync: true } per rileggere soltanto i progressi autorevoli.
 * Il server rigioca il replay sul proprio salvataggio: esito, premi, progressi di
 * Campagna e Torre non vengono mai presi dal client.
 *   200 → verificata (o già verificata: duplicate), con premio e progressi autorevoli
 *   422 → replay rifiutato: nessun premio, progressi del server da riadottare
 *   409 → Casa non ancora sul server o conflitto persistente: riprovare più tardi
 */
export async function POST(request: Request) {
  try {
    if (!isFamiglioRequestOriginAllowed(request)) return json({ error: "Origine non valida." }, 403);
    const user = await getFamiglioUser();
    if (!user) return json({ error: "Accedi al LoreWise ID per registrare le battaglie." }, 401);
    const parsed = await readBoundedJson(request, FAMILIAR_COMBAT_REPLAY_MAX_BYTES);
    if (!parsed.ok) return json({ error: parsed.status === 413 ? "Resoconto della battaglia troppo grande." : "Richiesta non valida." }, parsed.status);
    const body = (parsed.value && typeof parsed.value === "object" ? parsed.value : {}) as { houseIndex?: unknown; replay?: unknown; resync?: unknown };
    const houseIndex = Number(body.houseIndex);
    if (!Number.isInteger(houseIndex) || houseIndex < 0 || houseIndex > 2) return json({ error: "Casa non valida." }, 400);

    if (await isLocalLoreWiseRequest() && !netlifyDatabaseIsConfigured()) {
      // Anteprima locale senza database: stesso motore e stessa verifica, archivio in .tmp.
      const current = readMetadata(user);
      if (!current.save) return json({ error: NOT_SYNCED, code: "not-synced", revision: current.revision }, 409);
      if (body.resync === true) return json({ combat: authoritativeHouseCombat(current.save, houseIndex), revision: current.revision, localPreview: true });
      const verification = verifyFamiglioCombatReport(current.save, houseIndex, body.replay, { ownedFamiliarIds: null });
      if (verification.status === "rejected") {
        if (verification.code === "house") return json({ error: NOT_SYNCED, code: "not-synced", revision: current.revision }, 409);
        return json({ error: verification.error, code: verification.code, combat: verification.combat, revision: current.revision, localPreview: true }, 422);
      }
      if (verification.status === "duplicate") {
        return json({ duplicate: true, result: verification.result, combat: verification.combat, revision: current.revision, localPreview: true });
      }
      const revision = current.revision + 1;
      const { error } = await saveLocalGameData(user, { ...user.user_metadata, nexus_pet_rebuild_save: verification.save, nexus_pet_rebuild_revision: revision });
      if (error) return json({ error: "Verifica non salvata: riprova." }, 503);
      return json({ result: verification.result, combat: verification.combat, revision, localPreview: true });
    }

    const database = (env as unknown as RuntimeEnv).DB;
    if (!database) return json({ error: "Archivio Nexus Pet temporaneamente non disponibile." }, 503);
    if (body.resync === true) {
      const current = await readFamiglioRebuildSave(database, user.id);
      return json({ combat: authoritativeHouseCombat(current.save, houseIndex), revision: current.revision });
    }
    const submission = await submitFamiglioCombatReport(database, user.id, houseIndex, body.replay, await purchasedPremiumFamiliarIds(database, user.id));
    if (submission.status === "not-synced") return json({ error: NOT_SYNCED, code: "not-synced", revision: submission.revision }, 409);
    if (submission.status === "conflict") return json({ error: "Casa aggiornata in contemporanea: riprova.", code: "conflict", revision: submission.revision }, 409);
    if (submission.status === "rejected") {
      return json({ error: submission.error, code: submission.code, combat: submission.combat, revision: submission.revision }, 422);
    }
    return json({ duplicate: submission.status === "duplicate", result: submission.result, combat: submission.combat, revision: submission.revision });
  } catch {
    return json({ error: "Verifica della battaglia non riuscita: riprova, il premio non è stato perso." }, 503);
  }
}
