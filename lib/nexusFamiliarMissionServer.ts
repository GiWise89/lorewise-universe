import {
  dailyFamiliarMissionsForCount,
  familiarMissionById,
  romeDateKey,
  type FamiliarMissionActivity,
} from "@/lib/nexusFamiliarMissionCatalog";
import { sanitizeFamiliarCloudState } from "@/lib/nexusFamiliarCloud";
import { familiarDailyMissionCount } from "@/lib/nexusFamiliarProgression";

type MissionRow = {
  mission_id: string;
  slot: number;
  target_count: number;
  progress_count: number;
  reward_item: string;
  reward_quantity: number;
  claimed_at: string | null;
};

function previousDateKey(date: string) {
  const instant = new Date(`${date}T12:00:00.000Z`);
  instant.setUTCDate(instant.getUTCDate() - 1);
  return instant.toISOString().slice(0, 10);
}

export async function ensureFamiliarMissionTables(database: D1Database) {
  await database.prepare(`CREATE TABLE IF NOT EXISTS nexus_familiar_daily_missions (
    customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    mission_date TEXT NOT NULL,
    slot INTEGER NOT NULL,
    mission_id TEXT NOT NULL,
    activity_type TEXT NOT NULL,
    target_count INTEGER NOT NULL,
    progress_count INTEGER NOT NULL DEFAULT 0,
    reward_item TEXT NOT NULL,
    reward_quantity INTEGER NOT NULL,
    claimed_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (customer_id, mission_date, slot),
    UNIQUE (customer_id, mission_date, mission_id)
  )`).run();
  await database.prepare("CREATE INDEX IF NOT EXISTS nexus_familiar_daily_missions_status_idx ON nexus_familiar_daily_missions(customer_id, mission_date, claimed_at)").run();
  await database.prepare(`CREATE TABLE IF NOT EXISTS nexus_familiar_activity_events (
    customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    activity_date TEXT NOT NULL,
    activity_type TEXT NOT NULL,
    source_key TEXT NOT NULL,
    quality_score INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (customer_id, activity_date, activity_type, source_key)
  )`).run();
  await database.prepare("CREATE INDEX IF NOT EXISTS nexus_familiar_activity_events_customer_idx ON nexus_familiar_activity_events(customer_id, activity_date, activity_type)").run();
}

export async function ensureDailyFamiliarMissions(database: D1Database, customerId: string, date = romeDateKey(), missionCount = 3) {
  await ensureFamiliarMissionTables(database);
  const existing = await database.prepare("SELECT mission_id, slot FROM nexus_familiar_daily_missions WHERE customer_id = ? AND mission_date = ? ORDER BY slot")
    .bind(customerId, date).all<{ mission_id: string; slot: number }>();
  if (existing.results.length >= missionCount) return;

  const previous = await database.prepare("SELECT mission_id FROM nexus_familiar_daily_missions WHERE customer_id = ? AND mission_date = ? ORDER BY slot")
    .bind(customerId, previousDateKey(date)).all<{ mission_id: string }>();
  const missions = dailyFamiliarMissionsForCount(customerId, date, previous.results.map((row) => row.mission_id), missionCount);
  for (const [slot, mission] of missions.entries()) {
    if (existing.results.some((row) => row.slot === slot)) continue;
    await database.prepare(`INSERT INTO nexus_familiar_daily_missions
      (customer_id, mission_date, slot, mission_id, activity_type, target_count, reward_item, reward_quantity)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(customer_id, mission_date, slot) DO NOTHING`)
      .bind(customerId, date, slot, mission.id, mission.activity, mission.target, mission.reward.item, mission.reward.quantity).run();
  }
}

export async function recordFamiliarMissionActivity(database: D1Database, input: {
  customerId: string;
  activity: FamiliarMissionActivity;
  sourceKey: string;
  qualityScore?: number;
  date?: string;
  missionCount?: number;
}) {
  const date = input.date ?? romeDateKey();
  const sourceKey = input.sourceKey.trim().toLocaleLowerCase("it").slice(0, 180);
  if (!sourceKey) return false;
  const missionCount = input.missionCount ?? await familiarMissionCountForCustomer(database, input.customerId);
  await ensureDailyFamiliarMissions(database, input.customerId, date, missionCount);
  const inserted = await database.prepare(`INSERT INTO nexus_familiar_activity_events
    (customer_id, activity_date, activity_type, source_key, quality_score)
    VALUES (?, ?, ?, ?, ?) ON CONFLICT(customer_id, activity_date, activity_type, source_key) DO NOTHING`)
    .bind(input.customerId, date, input.activity, sourceKey, Math.max(0, Math.floor(input.qualityScore ?? 0))).run();
  if (!inserted.meta.changes) return false;
  await database.prepare(`UPDATE nexus_familiar_daily_missions
    SET progress_count = CASE WHEN progress_count + 1 > target_count THEN target_count ELSE progress_count + 1 END,
      updated_at = CURRENT_TIMESTAMP
    WHERE customer_id = ? AND mission_date = ? AND activity_type = ? AND claimed_at IS NULL`)
    .bind(input.customerId, date, input.activity).run();
  return true;
}

export async function familiarMissionCountForCustomer(database: D1Database, customerId: string) {
  try {
    const row = await database.prepare("SELECT state_json FROM nexus_familiars WHERE customer_id = ?")
      .bind(customerId).first<{ state_json: string }>();
    if (!row) return familiarDailyMissionCount(1);
    const checked = sanitizeFamiliarCloudState(JSON.parse(row.state_json));
    return familiarDailyMissionCount(checked.ok ? checked.state.level : 1);
  } catch {
    return familiarDailyMissionCount(1);
  }
}

export async function familiarMissionPayload(database: D1Database, customerId: string, date = romeDateKey(), missionCount = 3) {
  await ensureDailyFamiliarMissions(database, customerId, date, missionCount);
  await recordFamiliarMissionActivity(database, { customerId, activity: "daily_return", sourceKey: date, date, missionCount });
  const rows = await database.prepare(`SELECT mission_id, slot, target_count, progress_count, reward_item, reward_quantity, claimed_at
    FROM nexus_familiar_daily_missions WHERE customer_id = ? AND mission_date = ? ORDER BY slot`)
    .bind(customerId, date).all<MissionRow>();
  return {
    date,
    missions: rows.results.flatMap((row) => {
      const definition = familiarMissionById(row.mission_id);
      if (!definition) return [];
      return [{
        id: definition.id,
        group: definition.group,
        title: definition.title,
        description: definition.description,
        href: definition.href,
        progress: Math.min(row.target_count, Number(row.progress_count) || 0),
        target: row.target_count,
        reward: { item: row.reward_item, quantity: row.reward_quantity },
        complete: Number(row.progress_count) >= row.target_count,
        claimed: Boolean(row.claimed_at),
      }];
    }),
  };
}

export async function claimFamiliarMission(database: D1Database, customerId: string, missionId: string, date = romeDateKey()) {
  await ensureDailyFamiliarMissions(database, customerId, date);
  const row = await database.prepare(`SELECT mission_id, target_count, progress_count, reward_item, reward_quantity, claimed_at
    FROM nexus_familiar_daily_missions WHERE customer_id = ? AND mission_date = ? AND mission_id = ?`)
    .bind(customerId, date, missionId).first<MissionRow>();
  if (!row) return { ok: false as const, status: 404, error: "Missione non trovata." };
  if (row.claimed_at) return { ok: false as const, status: 409, error: "Ricompensa gia riscattata." };
  if (Number(row.progress_count) < Number(row.target_count)) return { ok: false as const, status: 409, error: "Completa prima la missione." };
  const claimed = await database.prepare(`UPDATE nexus_familiar_daily_missions SET claimed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE customer_id = ? AND mission_date = ? AND mission_id = ? AND claimed_at IS NULL`)
    .bind(customerId, date, missionId).run();
  if (!claimed.meta.changes) return { ok: false as const, status: 409, error: "Ricompensa gia riscattata." };
  const definition = familiarMissionById(row.mission_id);
  const coins = definition?.group === "connect" ? 8 : definition?.group === "explore" ? 6 : 5;
  const experience = 15 + Math.max(0, Math.min(2, Number(row.target_count) - 1)) * 10;
  return { ok: true as const, reward: { item: row.reward_item, quantity: Number(row.reward_quantity), coins, experience } };
}
