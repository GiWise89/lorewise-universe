import { LOREWISE_OWNER_EMAIL } from "./accountPolicy.ts";

export const UNIVERSE_PASS_PLANS = {
  "LW-PASS-SUPPORTER": {
    code: "LW-PASS-SUPPORTER",
    name: "Supporter",
    commissionDiscountPercent: 5,
    gameDiscountPercent: 5,
    digitalDiscountPercent: 5,
    artworkDiscountPercent: 10,
    artworkCreditsPerMonth: 1,
    artworkCreditCap: 2,
    earlyAccess: true,
    betaApplications: true,
    collectorDossiers: false,
    communityBadge: "Supporter",
  },
  "LW-PASS-COLLECTOR": {
    code: "LW-PASS-COLLECTOR",
    name: "Collector",
    commissionDiscountPercent: 10,
    gameDiscountPercent: 10,
    digitalDiscountPercent: 10,
    artworkDiscountPercent: 20,
    artworkCreditsPerMonth: 2,
    artworkCreditCap: 4,
    earlyAccess: true,
    betaApplications: true,
    collectorDossiers: true,
    communityBadge: "Collector",
  },
} as const;

export type UniversePassCode = keyof typeof UNIVERSE_PASS_PLANS;
export type UniversePassBenefit = {
  code: UniversePassCode | null;
  name: "Supporter" | "Collector" | "Visitatore";
  active: boolean;
  commissionDiscountPercent: number;
  gameDiscountPercent: number;
  digitalDiscountPercent: number;
  artworkDiscountPercent: number;
  artworkCreditsPerMonth: number;
  artworkCreditCap: number;
  earlyAccess: boolean;
  betaApplications: boolean;
  collectorDossiers: boolean;
  communityBadge: "Supporter" | "Collector" | null;
  currentPeriodEnd: string | null;
};

const visitorBenefit: UniversePassBenefit = {
  code: null,
  name: "Visitatore",
  active: false,
  commissionDiscountPercent: 0,
  gameDiscountPercent: 0,
  digitalDiscountPercent: 0,
  artworkDiscountPercent: 0,
  artworkCreditsPerMonth: 0,
  artworkCreditCap: 0,
  earlyAccess: false,
  betaApplications: false,
  collectorDossiers: false,
  communityBadge: null,
  currentPeriodEnd: null,
};

export const OWNER_COLLECTOR_SUBSCRIPTION_PREFIX = "complimentary-owner-collector:";

export function isPermanentCollectorEmail(email: string | null | undefined) {
  return email?.trim().toLocaleLowerCase("it") === LOREWISE_OWNER_EMAIL;
}

export function universePassBenefitFromCode(code: string | null | undefined, currentPeriodEnd: string | null = null): UniversePassBenefit {
  const plan = code && code in UNIVERSE_PASS_PLANS ? UNIVERSE_PASS_PLANS[code as UniversePassCode] : null;
  return plan ? { ...plan, active: true, currentPeriodEnd } : { ...visitorBenefit };
}

export async function getActiveUniversePass(database: D1Database, customerId: string | null | undefined): Promise<UniversePassBenefit> {
  if (!customerId) return { ...visitorBenefit };
  const customer = await database.prepare("SELECT email FROM customers WHERE id = ? LIMIT 1")
    .bind(customerId).first<{ email: string }>();
  if (isPermanentCollectorEmail(customer?.email)) {
    await database.prepare(`INSERT INTO subscriptions
      (id, customer_id, plan_code, status, stripe_subscription_id, current_period_end, cancel_at_period_end, created_at, updated_at)
      VALUES (?, ?, 'LW-PASS-COLLECTOR', 'active', NULL, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET plan_code = 'LW-PASS-COLLECTOR', status = 'active',
        stripe_subscription_id = NULL, current_period_end = NULL, cancel_at_period_end = 0,
        updated_at = CURRENT_TIMESTAMP`)
      .bind(`${OWNER_COLLECTOR_SUBSCRIPTION_PREFIX}${customerId}`, customerId).run();
    return universePassBenefitFromCode("LW-PASS-COLLECTOR", null);
  }
  const row = await database.prepare(`SELECT plan_code, current_period_end FROM subscriptions
    WHERE customer_id = ? AND status IN ('active', 'trialing')
      AND (current_period_end IS NULL OR datetime(current_period_end) > CURRENT_TIMESTAMP)
    ORDER BY created_at DESC LIMIT 1`).bind(customerId).first<{ plan_code: string; current_period_end: string | null }>();
  return universePassBenefitFromCode(row?.plan_code, row?.current_period_end ?? null);
}

export function calculateCommissionBenefit(baseCents: number, discountPercent: number) {
  if (!Number.isInteger(baseCents) || baseCents < 0) throw new Error("Prezzo iniziale della commissione non valido.");
  const normalizedPercent = Number.isInteger(discountPercent) ? Math.min(100, Math.max(0, discountPercent)) : 0;
  const discountCents = Math.round(baseCents * normalizedPercent / 100);
  return { baseCents, discountPercent: normalizedPercent, discountCents, finalCents: baseCents - discountCents };
}

export type DiscountableProductType = "artwork" | "game" | "commission" | "merchandise";

export function discountPercentForProduct(benefit: UniversePassBenefit, productType: DiscountableProductType) {
  if (!benefit.active) return 0;
  if (productType === "commission") return benefit.commissionDiscountPercent;
  if (productType === "game") return benefit.gameDiscountPercent;
  if (productType === "artwork") return benefit.artworkDiscountPercent;
  return benefit.digitalDiscountPercent;
}

export function calculatePurchaseBenefit(baseCents: number, discountPercent: number) {
  return calculateCommissionBenefit(baseCents, discountPercent);
}

export function calculateArtworkCreditGrant(currentBalance: number, monthlyAmount: number, cap: number) {
  if (![currentBalance, monthlyAmount, cap].every(Number.isInteger) || currentBalance < 0 || monthlyAmount < 0 || cap < 0) {
    throw new Error("Saldo crediti non valido.");
  }
  return Math.max(0, Math.min(monthlyAmount, cap - currentBalance));
}

export const UNIVERSE_PASS_OPPORTUNITIES = [
  { code: "early-diary", title: "Diario anticipato", description: "Aggiornamenti dello studio prima della pubblicazione generale.", minimumPlan: "Supporter" },
  { code: "reserved-demo", title: "Demo riservate", description: "Build indicate come pronte per il collaudo dei membri.", minimumPlan: "Supporter" },
  { code: "beta-the-wound-remembers", title: "Candidatura beta · The Wound Remembers", description: "Iscrizione verificata alla selezione dei prossimi test.", minimumPlan: "Supporter" },
  { code: "development-materials", title: "Materiali di sviluppo", description: "Concept approvati, note di sistema e avanzamento dei lavori.", minimumPlan: "Supporter" },
] as const;

export const STUDIO_POLLS = [
  {
    code: "LW-POLL-2026-01",
    title: "Quale dossier originale approfondire per primo?",
    opensAt: "2026-08-20T00:00:00.000Z",
    closesAt: "2026-12-31T22:59:59.000Z",
    options: [
      { code: "nhevara", label: "Nhevara" },
      { code: "kharvoss", label: "Kharvoss" },
      { code: "fuori-trama", label: "Il cast di Fuori Trama" },
    ],
  },
  {
    code: "LW-POLL-2026-02",
    title: "Quale materiale di sviluppo vuoi vedere?",
    opensAt: "2026-08-20T00:00:00.000Z",
    closesAt: "2026-12-31T22:59:59.000Z",
    options: [
      { code: "concept", label: "Concept e bozzetti" },
      { code: "systems", label: "Sistemi e prototipi" },
      { code: "behind-scenes", label: "Dietro le quinte dello studio" },
    ],
  },
] as const;

export function pollIsOpen(opensAt: string, closesAt: string, now = new Date()) {
  const instant = now.getTime();
  return instant >= new Date(opensAt).getTime() && instant <= new Date(closesAt).getTime();
}

export async function ensureCommissionBenefitColumns(database: D1Database) {
  const columns = await database.prepare("PRAGMA table_info(commission_requests)").all<{ name: string }>();
  const names = new Set(columns.results.map((column) => column.name));
  const additions = [
    ["customer_id", "ALTER TABLE commission_requests ADD COLUMN customer_id TEXT"],
    ["quote_base_cents", "ALTER TABLE commission_requests ADD COLUMN quote_base_cents INTEGER"],
    ["quote_discount_cents", "ALTER TABLE commission_requests ADD COLUMN quote_discount_cents INTEGER"],
    ["membership_plan_code", "ALTER TABLE commission_requests ADD COLUMN membership_plan_code TEXT"],
    ["membership_discount_percent", "ALTER TABLE commission_requests ADD COLUMN membership_discount_percent INTEGER NOT NULL DEFAULT 0"],
    ["benefit_snapshot_at", "ALTER TABLE commission_requests ADD COLUMN benefit_snapshot_at TEXT"],
  ] as const;
  for (const [name, statement] of additions) {
    if (!names.has(name)) await database.prepare(statement).run();
  }
  await database.prepare("CREATE INDEX IF NOT EXISTS commission_requests_customer_id_idx ON commission_requests(customer_id)").run();
  await database.prepare(`UPDATE commission_requests SET customer_id = (
      SELECT customers.id FROM customers WHERE lower(customers.email) = lower(commission_requests.email) LIMIT 1
    ) WHERE customer_id IS NULL AND EXISTS (
      SELECT 1 FROM customers WHERE lower(customers.email) = lower(commission_requests.email)
    )`).run();
}
