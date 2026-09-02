import { env } from "@/lib/netlifyRuntime";
import { dailyFamiliarMissionsForCount, romeDateKey } from "@/lib/nexusFamiliarMissionCatalog";
import { claimFamiliarMission, familiarMissionPayload } from "@/lib/nexusFamiliarMissionServer";
import { sanitizeFamiliarCloudState } from "@/lib/nexusFamiliarCloud";
import { applyFamiliarTimePassage, grantFamiliarProgress, type FamiliarItemKey } from "@/lib/nexusFamiliar";
import { familiarDailyMissionCount } from "@/lib/nexusFamiliarProgression";
import { recordFamiliarEconomyEvent, recordFamiliarSyncEvent } from "@/lib/nexusFamiliarEconomyServer";
import { netlifyDatabaseIsConfigured } from "@/lib/localAccountFallback";
import { syncLoreWiseCustomer } from "@/lib/supabase/customer";
import { getLoreWiseUser, isLocalLoreWiseRequest } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RuntimeEnv = { DB?: D1Database };
const headers = { "Cache-Control": "private, no-store" };

function json(body: Record<string, unknown>, status = 200) {
  return Response.json(body, { status, headers });
}

function metadataLevel(user: Awaited<ReturnType<typeof getLoreWiseUser>>) {
  if (!user) return 1;
  const checked = sanitizeFamiliarCloudState(user.user_metadata?.nexus_familiar_state);
  return checked.ok ? checked.state.level : 1;
}

async function databaseLevel(database: D1Database, customerId: string) {
  const row = await database.prepare("SELECT state_json FROM nexus_familiars WHERE customer_id = ?")
    .bind(customerId).first<{ state_json: string }>();
  if (!row) return 1;
  try {
    const checked = sanitizeFamiliarCloudState(JSON.parse(row.state_json));
    return checked.ok ? checked.state.level : 1;
  } catch {
    return 1;
  }
}

async function grantMissionRewardToFamiliar(database: D1Database, customerId: string, missionId: string, reward: { item: string; quantity: number; coins: number; experience: number }) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const row = await database.prepare("SELECT state_json, revision FROM nexus_familiars WHERE customer_id = ?")
      .bind(customerId).first<{ state_json: string; revision: number }>();
    if (!row) return null;
    const checked = sanitizeFamiliarCloudState(JSON.parse(row.state_json));
    if (!checked.ok || !["food", "soap", "medicine", "toy"].includes(reward.item)) return null;
    const item = reward.item as FamiliarItemKey;
    const now = new Date();
    const next = grantFamiliarProgress(applyFamiliarTimePassage(checked.state, now), {
      items: { [item]: reward.quantity },
      coins: reward.coins,
      experience: reward.experience,
    }, now);
    const revision = Math.max(0, Math.floor(Number(row.revision) || 0)) + 1;
    const updated = await database.prepare(`UPDATE nexus_familiars SET state_json = ?, revision = ?, updated_at = CURRENT_TIMESTAMP
      WHERE customer_id = ? AND revision = ?`)
      .bind(JSON.stringify(next), revision, customerId, row.revision).run();
    if (updated.meta.changes) {
      await Promise.all([
        recordFamiliarEconomyEvent(database, { customerId, eventType: "mission", sourceKey: `mission:${romeDateKey(now)}:${missionId}`, before: checked.state, after: next, metadata: { reward } }),
        recordFamiliarSyncEvent(database, { customerId, familiarId: next.familiarId, action: "mission", revisionBefore: row.revision, revisionAfter: revision }),
      ]).catch(() => undefined);
      return { familiar: next, revision };
    }
  }
  return null;
}

export async function GET() {
  try {
    const user = await getLoreWiseUser();
    if (!user) return json({ error: "Accedi al LoreWise ID per attivare le missioni." }, 401);
    const date = romeDateKey();
    if (await isLocalLoreWiseRequest() && !netlifyDatabaseIsConfigured()) {
      const missionCount = familiarDailyMissionCount(metadataLevel(user));
      return json({
        date,
        missions: dailyFamiliarMissionsForCount(user.id, date, [], missionCount).map((mission) => ({
          ...mission,
          progress: 0,
          complete: false,
          claimed: false,
        })),
        localPreview: true,
      });
    }
    const database = (env as unknown as RuntimeEnv).DB;
    if (!database) return json({ error: "Missioni non disponibili." }, 503);
    await syncLoreWiseCustomer(user);
    const missionCount = familiarDailyMissionCount(await databaseLevel(database, user.id));
    return json(await familiarMissionPayload(database, user.id, date, missionCount));
  } catch {
    return json({ error: "Non è stato possibile caricare le missioni." }, 503);
  }
}

export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) return json({ error: "Origine non valida." }, 403);
    const user = await getLoreWiseUser();
    if (!user) return json({ error: "Accedi al LoreWise ID per riscuotere le ricompense." }, 401);
    if (await isLocalLoreWiseRequest() && !netlifyDatabaseIsConfigured()) {
      return json({ error: "Nella preview le missioni sono dimostrative." }, 409);
    }
    const database = (env as unknown as RuntimeEnv).DB;
    if (!database) return json({ error: "Missioni non disponibili." }, 503);
    await syncLoreWiseCustomer(user);
    const body = await request.json().catch(() => null) as { missionId?: unknown } | null;
    const missionId = typeof body?.missionId === "string" ? body.missionId.slice(0, 80) : "";
    if (!missionId) return json({ error: "Missione non valida." }, 400);
    const result = await claimFamiliarMission(database, user.id, missionId);
    if (!result.ok) return json({ error: result.error }, result.status);
    const saved = await grantMissionRewardToFamiliar(database, user.id, missionId, result.reward);
    if (!saved) {
      await database.prepare("UPDATE nexus_familiar_daily_missions SET claimed_at = NULL WHERE customer_id = ? AND mission_date = ? AND mission_id = ?")
        .bind(user.id, romeDateKey(), missionId).run();
      return json({ error: "Ricompensa non salvata: puoi riprovare." }, 503);
    }
    const missionCount = familiarDailyMissionCount(await databaseLevel(database, user.id));
    return json({ reward: result.reward, familiar: saved.familiar, revision: saved.revision, missions: (await familiarMissionPayload(database, user.id, romeDateKey(), missionCount)).missions });
  } catch {
    return json({ error: "Non è stato possibile riscuotere la ricompensa." }, 503);
  }
}
