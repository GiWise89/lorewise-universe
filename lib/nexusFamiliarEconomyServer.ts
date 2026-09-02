import "server-only";

import type { NexusFamiliarState } from "./nexusFamiliar.ts";

export type FamiliarEconomyEventType =
  | "adoption"
  | "care"
  | "mission"
  | "outing"
  | "theme"
  | "gadget"
  | "ritual"
  | "paid_bundle"
  | "paid_refund"
  | "reset";

export async function ensureFamiliarEconomyTables(database: D1Database) {
  await database.prepare(`CREATE TABLE IF NOT EXISTS nexus_familiar_economy_events (
    id TEXT PRIMARY KEY NOT NULL,
    customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    familiar_id TEXT,
    event_type TEXT NOT NULL,
    source_key TEXT NOT NULL,
    coin_delta INTEGER NOT NULL DEFAULT 0,
    balance_before INTEGER NOT NULL DEFAULT 0,
    balance_after INTEGER NOT NULL DEFAULT 0,
    experience_delta INTEGER NOT NULL DEFAULT 0,
    metadata_json TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(customer_id, source_key)
  )`).run();
  await database.prepare("CREATE INDEX IF NOT EXISTS nexus_familiar_economy_customer_idx ON nexus_familiar_economy_events(customer_id, created_at)").run();
  await database.prepare(`CREATE TABLE IF NOT EXISTS nexus_familiar_sync_events (
    id TEXT PRIMARY KEY NOT NULL,
    customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    familiar_id TEXT,
    action TEXT NOT NULL,
    revision_before INTEGER NOT NULL DEFAULT 0,
    revision_after INTEGER NOT NULL DEFAULT 0,
    device_hint TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run();
  await database.prepare("CREATE INDEX IF NOT EXISTS nexus_familiar_sync_customer_idx ON nexus_familiar_sync_events(customer_id, created_at)").run();
}

export async function recordFamiliarEconomyEvent(database: D1Database, input: {
  customerId: string;
  eventType: FamiliarEconomyEventType;
  sourceKey: string;
  before: NexusFamiliarState | null;
  after: NexusFamiliarState | null;
  metadata?: Record<string, unknown>;
}) {
  await ensureFamiliarEconomyTables(database);
  const beforeCoins = input.before?.nexusCoins ?? 0;
  const afterCoins = input.after?.nexusCoins ?? 0;
  const beforeExperience = input.before?.experience ?? 0;
  const afterExperience = input.after?.experience ?? 0;
  return database.prepare(`INSERT INTO nexus_familiar_economy_events
    (id, customer_id, familiar_id, event_type, source_key, coin_delta, balance_before, balance_after, experience_delta, metadata_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(customer_id, source_key) DO NOTHING`)
    .bind(
      crypto.randomUUID(),
      input.customerId,
      input.after?.familiarId ?? input.before?.familiarId ?? null,
      input.eventType,
      input.sourceKey.slice(0, 180),
      afterCoins - beforeCoins,
      beforeCoins,
      afterCoins,
      afterExperience - beforeExperience,
      JSON.stringify(input.metadata ?? {}),
    ).run();
}

export async function recordFamiliarSyncEvent(database: D1Database, input: {
  customerId: string;
  familiarId?: string | null;
  action: "adopt" | "sync" | "command" | "mission" | "delete" | "paid_fulfillment" | "paid_refund";
  revisionBefore: number;
  revisionAfter: number;
  deviceHint?: string | null;
}) {
  await ensureFamiliarEconomyTables(database);
  await database.prepare(`INSERT INTO nexus_familiar_sync_events
    (id, customer_id, familiar_id, action, revision_before, revision_after, device_hint)
    VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .bind(
      crypto.randomUUID(), input.customerId, input.familiarId ?? null, input.action,
      Math.max(0, Math.floor(input.revisionBefore)), Math.max(0, Math.floor(input.revisionAfter)),
      input.deviceHint?.slice(0, 80) ?? null,
    ).run();
}

export async function familiarEconomyHistory(database: D1Database, customerId: string, limit = 40) {
  await ensureFamiliarEconomyTables(database);
  const rows = await database.prepare(`SELECT event_type, source_key, coin_delta, balance_after, experience_delta, created_at
    FROM nexus_familiar_economy_events WHERE customer_id = ? ORDER BY created_at DESC LIMIT ?`)
    .bind(customerId, Math.min(100, Math.max(1, Math.floor(limit)))).all<{
      event_type: string; source_key: string; coin_delta: number; balance_after: number; experience_delta: number; created_at: string;
    }>();
  return rows.results.map((row) => ({
    eventType: row.event_type,
    sourceKey: row.source_key,
    coinDelta: Number(row.coin_delta),
    balanceAfter: Number(row.balance_after),
    experienceDelta: Number(row.experience_delta),
    createdAt: row.created_at,
  }));
}
