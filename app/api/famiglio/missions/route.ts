import { env } from "@/lib/netlifyRuntime";
import { dailyFamiliarMissionsForCount, romeDateKey } from "@/lib/nexusFamiliarMissionCatalog";
import { familiarMissionPayload, markFamiliarMissionClaimed, prepareFamiliarMissionClaim, refreshDailyFamiliarMissions } from "@/lib/nexusFamiliarMissionServer";
import { sanitizeFamiglioRebuildCloudSave } from "@/lib/famiglioRebuildCloud";
import { grantFamiliarHomeMissionReward, restoreFamiliarHome } from "@/lib/famiglioHome";
import { sanitizeFamiliarCloudState } from "@/lib/nexusFamiliarCloud";
import { familiarDailyMissionCount } from "@/lib/nexusFamiliarProgression";
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

async function grantMissionRewardToRebuildSave(database: D1Database, customerId: string, missionId: string, missionDate: string, reward: { title: string; item: string; quantity: number; coins: number; experience: number }) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const row = await database.prepare("SELECT save_json, revision FROM nexus_pet_rebuild_saves WHERE customer_id = ?")
      .bind(customerId).first<{ save_json: string; revision: number }>();
    if (!row) return null;
    const checked = sanitizeFamiglioRebuildCloudSave(JSON.parse(row.save_json));
    if (!checked.ok) return null;
    const houseIndex = checked.save.activeHouseIndex;
    const house = checked.save.houses[houseIndex];
    if (!house || typeof house !== "object") return null;
    const now = Date.now();
    const home = restoreFamiliarHome(house.home, now);
    const item = ["food", "soap", "medicine", "toy"].includes(reward.item)
      ? reward.item as "food" | "soap" | "medicine" | "toy"
      : undefined;
    const rewardedHome = grantFamiliarHomeMissionReward(home, { title: reward.title, coins: reward.coins, experience: reward.experience, item, quantity: reward.quantity }, now, `${missionDate}:${missionId}`);
    if (rewardedHome === home) return { home, revision: Math.max(0, Math.floor(Number(row.revision) || 0)) };
    const houses = [...checked.save.houses];
    houses[houseIndex] = { ...house, home: rewardedHome };
    const next = { ...checked.save, home: rewardedHome, houses, updatedAt: new Date(now).toISOString() };
    const revision = Math.max(0, Math.floor(Number(row.revision) || 0)) + 1;
    const updated = await database.prepare(`UPDATE nexus_pet_rebuild_saves SET save_json = ?, revision = ?, updated_at = CURRENT_TIMESTAMP
      WHERE customer_id = ? AND revision = ?`)
      .bind(JSON.stringify(next), revision, customerId, row.revision).run();
    if (updated.meta.changes) {
      return { home: rewardedHome, revision };
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
        refreshUsed: false,
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
    const body = await request.json().catch(() => null) as { action?: unknown; missionId?: unknown } | null;
    if (body?.action === "refresh") {
      const missionCount = familiarDailyMissionCount(await databaseLevel(database, user.id));
      const refreshed = await refreshDailyFamiliarMissions(database, user.id, romeDateKey(), missionCount);
      if (!refreshed.ok) return json({ error: refreshed.error }, refreshed.status);
      return json(await familiarMissionPayload(database, user.id, romeDateKey(), missionCount));
    }
    const missionId = typeof body?.missionId === "string" ? body.missionId.slice(0, 80) : "";
    if (!missionId) return json({ error: "Missione non valida." }, 400);
    const missionDate = romeDateKey();
    const result = await prepareFamiliarMissionClaim(database, user.id, missionId, missionDate);
    const missionCount = familiarDailyMissionCount(await databaseLevel(database, user.id));
    if (!result.ok) {
      if ("claimed" in result && result.claimed) {
        return json({ alreadyClaimed: true, missions: (await familiarMissionPayload(database, user.id, missionDate, missionCount)).missions });
      }
      return json({ error: result.error }, result.status);
    }
    const saved = await grantMissionRewardToRebuildSave(database, user.id, missionId, missionDate, result.reward);
    if (!saved) return json({ error: "Ricompensa non salvata: la missione resta riscuotibile e puoi riprovare." }, 503);
    if (!await markFamiliarMissionClaimed(database, user.id, missionId, missionDate)) {
      return json({ error: "Ricompensa salvata, ma la conferma è in sospeso: premi di nuovo Riscuoti." }, 503);
    }
    return json({ reward: result.reward, home: saved.home, revision: saved.revision, missions: (await familiarMissionPayload(database, user.id, missionDate, missionCount)).missions });
  } catch {
    return json({ error: "Non è stato possibile riscuotere la ricompensa." }, 503);
  }
}
