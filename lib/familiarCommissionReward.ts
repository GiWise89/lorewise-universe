export const FAMILIAR_LEVEL_50_COMMISSION_REWARD = {
  code: "LW-FAMILIAR-L50-COMMISSION-15",
  requiredLevel: 50,
  discountCents: 1_500,
  label: "Premio Famiglio · livello 50",
} as const;

export type FamiliarCommissionRewardRow = {
  reward_code: string;
  discount_cents: number;
  status: "eligible" | "claimed" | "redeemed";
  claimed_request_id: string | null;
  claimed_at: string | null;
  redeemed_at: string | null;
};

export async function ensureFamiliarCommissionRewardSchema(database: D1Database) {
  await database.prepare(`CREATE TABLE IF NOT EXISTS familiar_commission_rewards (
    id TEXT PRIMARY KEY NOT NULL,
    customer_id TEXT NOT NULL,
    reward_code TEXT NOT NULL,
    required_level INTEGER NOT NULL,
    discount_cents INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'eligible',
    claimed_request_id TEXT,
    claimed_at TEXT,
    redeemed_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (claimed_request_id) REFERENCES commission_requests(id) ON DELETE SET NULL,
    UNIQUE (customer_id, reward_code),
    UNIQUE (claimed_request_id)
  )`).run();
  await database.prepare("CREATE INDEX IF NOT EXISTS familiar_commission_rewards_customer_idx ON familiar_commission_rewards(customer_id, status)").run();
}

export async function syncFamiliarCommissionReward(database: D1Database, customerId: string, familiarLevel: number) {
  await ensureFamiliarCommissionRewardSchema(database);
  if (familiarLevel < FAMILIAR_LEVEL_50_COMMISSION_REWARD.requiredLevel) return false;
  await database.prepare(`UPDATE familiar_commission_rewards
    SET status = 'eligible', claimed_at = NULL, updated_at = CURRENT_TIMESTAMP
    WHERE customer_id = ? AND reward_code = ? AND status = 'claimed'
      AND claimed_request_id IS NULL AND redeemed_at IS NULL`)
    .bind(customerId, FAMILIAR_LEVEL_50_COMMISSION_REWARD.code).run();
  const result = await database.prepare(`INSERT OR IGNORE INTO familiar_commission_rewards
    (id, customer_id, reward_code, required_level, discount_cents, status)
    VALUES (?, ?, ?, ?, ?, 'eligible')`)
    .bind(crypto.randomUUID(), customerId, FAMILIAR_LEVEL_50_COMMISSION_REWARD.code,
      FAMILIAR_LEVEL_50_COMMISSION_REWARD.requiredLevel, FAMILIAR_LEVEL_50_COMMISSION_REWARD.discountCents).run();
  return Number(result.meta.changes ?? 0) > 0;
}

export async function claimFamiliarCommissionReward(database: D1Database, customerId: string, requestId: string, familiarLevel: number) {
  await syncFamiliarCommissionReward(database, customerId, familiarLevel);
  if (familiarLevel < FAMILIAR_LEVEL_50_COMMISSION_REWARD.requiredLevel) return false;
  const result = await database.prepare(`UPDATE familiar_commission_rewards
    SET status = 'claimed', claimed_request_id = ?, claimed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE customer_id = ? AND reward_code = ? AND status = 'eligible' AND claimed_request_id IS NULL`)
    .bind(requestId, customerId, FAMILIAR_LEVEL_50_COMMISSION_REWARD.code).run();
  return Number(result.meta.changes ?? 0) > 0;
}

export async function getFamiliarCommissionRewardForRequest(database: D1Database, requestId: string) {
  await ensureFamiliarCommissionRewardSchema(database);
  return database.prepare(`SELECT reward_code, discount_cents, status, claimed_request_id, claimed_at, redeemed_at
    FROM familiar_commission_rewards WHERE claimed_request_id = ? AND reward_code = ? AND status = 'claimed' LIMIT 1`)
    .bind(requestId, FAMILIAR_LEVEL_50_COMMISSION_REWARD.code).first<FamiliarCommissionRewardRow>();
}

export async function getFamiliarCommissionRewardForCustomer(database: D1Database, customerId: string) {
  await ensureFamiliarCommissionRewardSchema(database);
  return database.prepare(`SELECT reward_code, discount_cents, status, claimed_request_id, claimed_at, redeemed_at
    FROM familiar_commission_rewards WHERE customer_id = ? AND reward_code = ? LIMIT 1`)
    .bind(customerId, FAMILIAR_LEVEL_50_COMMISSION_REWARD.code).first<FamiliarCommissionRewardRow>();
}

export async function markFamiliarCommissionRewardRedeemed(database: D1Database, requestId: string) {
  await database.prepare(`UPDATE familiar_commission_rewards SET status = 'redeemed',
    redeemed_at = COALESCE(redeemed_at, CURRENT_TIMESTAMP), updated_at = CURRENT_TIMESTAMP
    WHERE claimed_request_id = ? AND reward_code = ? AND status = 'claimed'`)
    .bind(requestId, FAMILIAR_LEVEL_50_COMMISSION_REWARD.code).run();
}

export async function releaseFamiliarCommissionReward(database: D1Database, requestId: string) {
  await database.prepare(`UPDATE familiar_commission_rewards
    SET status = 'eligible', claimed_request_id = NULL, claimed_at = NULL, updated_at = CURRENT_TIMESTAMP
    WHERE claimed_request_id = ? AND reward_code = ? AND status = 'claimed' AND redeemed_at IS NULL`)
    .bind(requestId, FAMILIAR_LEVEL_50_COMMISSION_REWARD.code).run();
}
