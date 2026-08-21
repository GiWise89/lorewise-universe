import { OWNER_COLLECTOR_SUBSCRIPTION_PREFIX, UNIVERSE_PASS_PLANS, calculateArtworkCreditGrant, getActiveUniversePass } from "@/lib/universePass";

export async function ensureBenefitEngineTables(database: D1Database) {
  const statements = [
    `CREATE TABLE IF NOT EXISTS benefit_ledger (
      id TEXT PRIMARY KEY NOT NULL, customer_id TEXT NOT NULL, subscription_id TEXT,
      source_key TEXT NOT NULL UNIQUE, benefit_type TEXT NOT NULL, amount INTEGER NOT NULL DEFAULT 0,
      remaining INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'active',
      assigned_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, expires_at TEXT, used_at TEXT,
      resource_code TEXT, metadata_json TEXT,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
      FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL
    )`,
    `CREATE TABLE IF NOT EXISTS benefit_events (
      id TEXT PRIMARY KEY NOT NULL, customer_id TEXT NOT NULL, benefit_type TEXT NOT NULL,
      action TEXT NOT NULL, amount INTEGER NOT NULL DEFAULT 0, reference_code TEXT,
      metadata_json TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS member_benefit_claims (
      id TEXT PRIMARY KEY NOT NULL, customer_id TEXT NOT NULL, benefit_code TEXT NOT NULL,
      resource_code TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'submitted',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS codex_bookmarks (
      customer_id TEXT NOT NULL, entry_slug TEXT NOT NULL, collection_name TEXT NOT NULL DEFAULT 'Preferiti',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(customer_id, entry_slug),
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS studio_poll_votes (
      customer_id TEXT NOT NULL, poll_code TEXT NOT NULL, option_code TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(customer_id, poll_code),
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    )`,
    "CREATE INDEX IF NOT EXISTS benefit_ledger_customer_idx ON benefit_ledger(customer_id, status)",
    "CREATE INDEX IF NOT EXISTS benefit_ledger_expiry_idx ON benefit_ledger(expires_at)",
    "CREATE INDEX IF NOT EXISTS benefit_events_customer_idx ON benefit_events(customer_id, created_at)",
    "CREATE UNIQUE INDEX IF NOT EXISTS member_benefit_claim_unique ON member_benefit_claims(customer_id, benefit_code, resource_code)",
    "CREATE INDEX IF NOT EXISTS member_benefit_claim_customer_idx ON member_benefit_claims(customer_id, status)",
    "CREATE INDEX IF NOT EXISTS codex_bookmarks_customer_idx ON codex_bookmarks(customer_id, collection_name)",
    "CREATE INDEX IF NOT EXISTS studio_poll_votes_poll_idx ON studio_poll_votes(poll_code, option_code)",
  ];
  for (const statement of statements) await database.prepare(statement).run();
  const columns = await database.prepare("PRAGMA table_info(orders)").all<{ name: string }>();
  const names = new Set(columns.results.map((column) => column.name));
  if (!names.has("discount_cents")) await database.prepare("ALTER TABLE orders ADD COLUMN discount_cents INTEGER NOT NULL DEFAULT 0").run();
  if (!names.has("benefit_plan_code")) await database.prepare("ALTER TABLE orders ADD COLUMN benefit_plan_code TEXT").run();
  if (!names.has("benefit_discount_percent")) await database.prepare("ALTER TABLE orders ADD COLUMN benefit_discount_percent INTEGER NOT NULL DEFAULT 0").run();
}

export async function expireBenefits(database: D1Database, customerId: string) {
  await database.prepare(`UPDATE benefit_ledger SET status = 'expired', remaining = 0
    WHERE customer_id = ? AND status = 'active' AND expires_at IS NOT NULL AND datetime(expires_at) <= CURRENT_TIMESTAMP`)
    .bind(customerId).run();
}

export async function grantPaidInvoiceCredits(database: D1Database, input: {
  invoiceId: string; subscriptionId: string; customerId: string; planCode: string; periodEnd: string | null;
}) {
  const plan = UNIVERSE_PASS_PLANS[input.planCode as keyof typeof UNIVERSE_PASS_PLANS];
  if (!plan || plan.artworkCreditsPerMonth <= 0) return 0;
  await expireBenefits(database, input.customerId);
  const existingSource = await database.prepare("SELECT id FROM benefit_ledger WHERE source_key = ? LIMIT 1")
    .bind(`invoice:${input.invoiceId}:art-credit`).first();
  if (existingSource) return 0;
  const balance = await database.prepare(`SELECT COALESCE(SUM(remaining), 0) AS total FROM benefit_ledger
    WHERE customer_id = ? AND benefit_type = 'art_credit' AND status = 'active'
      AND (expires_at IS NULL OR datetime(expires_at) > CURRENT_TIMESTAMP)`)
    .bind(input.customerId).first<{ total: number }>();
  const granted = calculateArtworkCreditGrant(Number(balance?.total ?? 0), plan.artworkCreditsPerMonth, plan.artworkCreditCap);
  await database.batch([
    database.prepare(`INSERT INTO benefit_ledger (id, customer_id, subscription_id, source_key, benefit_type,
      amount, remaining, status, assigned_at, expires_at, metadata_json)
      VALUES (?, ?, ?, ?, 'art_credit', ?, ?, ?, CURRENT_TIMESTAMP, ?, ?)`)
      .bind(crypto.randomUUID(), input.customerId, input.subscriptionId, `invoice:${input.invoiceId}:art-credit`, granted, granted,
        granted ? "active" : "capped", input.periodEnd, JSON.stringify({ planCode: input.planCode, invoiceId: input.invoiceId })),
    database.prepare(`INSERT INTO benefit_events (id, customer_id, benefit_type, action, amount, reference_code, metadata_json)
      VALUES (?, ?, 'art_credit', ?, ?, ?, ?)`)
      .bind(crypto.randomUUID(), input.customerId, granted ? "granted" : "cap_reached", granted, input.invoiceId,
        JSON.stringify({ planCode: input.planCode, cap: plan.artworkCreditCap })),
  ]);
  return granted;
}

export async function grantPermanentCollectorCredits(database: D1Database, customerId: string, now = new Date()) {
  const subscriptionId = `${OWNER_COLLECTOR_SUBSCRIPTION_PREFIX}${customerId}`;
  const subscription = await database.prepare(`SELECT plan_code FROM subscriptions
    WHERE id = ? AND customer_id = ? AND status = 'active' LIMIT 1`)
    .bind(subscriptionId, customerId).first<{ plan_code: string }>();
  if (subscription?.plan_code !== "LW-PASS-COLLECTOR") return 0;
  const month = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  return grantPaidInvoiceCredits(database, {
    invoiceId: `complimentary:${month}`,
    subscriptionId,
    customerId,
    planCode: subscription.plan_code,
    periodEnd: null,
  });
}

export async function revokeUnusedInvoiceBenefits(database: D1Database, customerId: string, referenceCode: string) {
  const rows = await database.prepare(`SELECT id, remaining FROM benefit_ledger
    WHERE customer_id = ? AND source_key LIKE ? AND status = 'active'`).bind(customerId, `invoice:${referenceCode}:%`)
    .all<{ id: string; remaining: number }>();
  if (!rows.results.length) return 0;
  const revoked = rows.results.reduce((sum, row) => sum + Number(row.remaining), 0);
  await database.batch([
    ...rows.results.map((row) => database.prepare("UPDATE benefit_ledger SET status = 'revoked', remaining = 0 WHERE id = ?").bind(row.id)),
    database.prepare(`INSERT INTO benefit_events (id, customer_id, benefit_type, action, amount, reference_code)
      VALUES (?, ?, 'art_credit', 'revoked', ?, ?)`)
      .bind(crypto.randomUUID(), customerId, revoked, referenceCode),
  ]);
  return revoked;
}

export async function getCommunityBadge(database: D1Database, customerId: string) {
  const pass = await getActiveUniversePass(database, customerId);
  return pass.communityBadge;
}
