export const WELCOME_COMMISSION_OFFER = {
  code: "LW-WELCOME-COMMISSION-5-2026",
  discountCents: 500,
  startsAt: "2026-08-25T00:00:00+02:00",
  registrationEndsAt: "2026-09-30T23:59:59.999+02:00",
  validityDaysAfterConfirmation: 30,
  dismissalKey: "lorewise-welcome-commission-5-2026-dismissed",
  title: "5 € sulla tua prima commissione",
  description: "Crea e conferma il tuo LoreWise ID entro il 30 settembre. Il bonus vale anche per gli account già confermati e si applica automaticamente alla prima commissione. Non è cumulabile con altri sconti: viene scelto il vantaggio più conveniente.",
  action: "Accedi o crea il LoreWise ID",
  href: "/account#account-signin-title",
} as const;

export type CommissionDiscountSelection = {
  baseCents: number;
  discountPercent: number;
  discountCents: number;
  finalCents: number;
  code: string | null;
  label: string;
  kind: "none" | "percentage" | "fixed";
  value: number;
};

export function isWelcomeCommissionOfferActive(at: Date | string | number = new Date()) {
  const timestamp = at instanceof Date ? at.getTime() : typeof at === "number" ? at : Date.parse(at);
  return Number.isFinite(timestamp)
    && timestamp >= Date.parse(WELCOME_COMMISSION_OFFER.startsAt)
    && timestamp <= Date.parse(WELCOME_COMMISSION_OFFER.registrationEndsAt);
}

function timestamp(value: Date | string | number) {
  return value instanceof Date ? value.getTime() : typeof value === "number" ? value : Date.parse(value);
}

export function welcomeCommissionRegistrationIsEligible(registeredAt: Date | string | number, confirmedAt: Date | string | number) {
  const registered = timestamp(registeredAt);
  const confirmed = timestamp(confirmedAt);
  const ends = Date.parse(WELCOME_COMMISSION_OFFER.registrationEndsAt);
  return Number.isFinite(registered) && Number.isFinite(confirmed)
    && registered <= ends
    && confirmed >= registered && confirmed <= ends;
}

export function welcomeCommissionEligibilityStartsAt(confirmedAt: Date | string | number) {
  const confirmed = timestamp(confirmedAt);
  if (!Number.isFinite(confirmed)) throw new Error("Data di conferma LoreWise ID non valida.");
  return new Date(Math.max(confirmed, Date.parse(WELCOME_COMMISSION_OFFER.startsAt))).toISOString();
}

export function welcomeCommissionOfferExpiresAt(confirmedAt: Date | string | number) {
  const confirmed = timestamp(confirmedAt);
  if (!Number.isFinite(confirmed)) throw new Error("Data di conferma LoreWise ID non valida.");
  const existingAccountExpiryBase = Date.parse(WELCOME_COMMISSION_OFFER.registrationEndsAt);
  const expiryBase = confirmed < Date.parse(WELCOME_COMMISSION_OFFER.startsAt) ? existingAccountExpiryBase : confirmed;
  return new Date(expiryBase + WELCOME_COMMISSION_OFFER.validityDaysAfterConfirmation * 24 * 60 * 60 * 1000).toISOString();
}

export function calculateBestCommissionDiscount({
  baseCents,
  percentage,
  percentageCode,
  percentageLabel,
  welcomeOfferEligible,
}: {
  baseCents: number;
  percentage: number;
  percentageCode: string | null;
  percentageLabel: string;
  welcomeOfferEligible: boolean;
}): CommissionDiscountSelection {
  if (!Number.isInteger(baseCents) || baseCents < 0) throw new Error("Importo commissione non valido.");
  if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) throw new Error("Percentuale commissione non valida.");
  const percentageCents = Math.min(baseCents, Math.round(baseCents * percentage / 100));
  const welcomeCents = welcomeOfferEligible ? Math.min(baseCents, WELCOME_COMMISSION_OFFER.discountCents) : 0;
  const useWelcomeOffer = welcomeCents > 0 && welcomeCents >= percentageCents;
  const discountCents = useWelcomeOffer ? welcomeCents : percentageCents;
  return {
    baseCents,
    discountPercent: useWelcomeOffer ? 0 : percentage,
    discountCents,
    finalCents: baseCents - discountCents,
    code: useWelcomeOffer ? WELCOME_COMMISSION_OFFER.code : percentageCents > 0 ? percentageCode : null,
    label: useWelcomeOffer ? "Bonus LoreWise ID" : percentageCents > 0 ? percentageLabel : "Nessuno sconto",
    kind: useWelcomeOffer ? "fixed" : percentageCents > 0 ? "percentage" : "none",
    value: useWelcomeOffer ? welcomeCents : percentageCents > 0 ? percentage : 0,
  };
}

export async function ensureWelcomeCommissionOfferSchema(database: D1Database) {
  await database.prepare(`CREATE TABLE IF NOT EXISTS commission_offer_entitlements (
    id TEXT PRIMARY KEY NOT NULL,
    customer_id TEXT NOT NULL,
    offer_code TEXT NOT NULL,
    discount_cents INTEGER NOT NULL,
    registered_at TEXT NOT NULL,
    confirmed_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'eligible',
    claimed_request_id TEXT,
    claimed_at TEXT,
    redeemed_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (claimed_request_id) REFERENCES commission_requests(id) ON DELETE SET NULL,
    UNIQUE (customer_id, offer_code),
    UNIQUE (claimed_request_id)
  )`).run();
  await database.prepare("CREATE INDEX IF NOT EXISTS commission_offer_entitlements_customer_idx ON commission_offer_entitlements(customer_id, status)").run();
  await database.prepare("CREATE INDEX IF NOT EXISTS commission_offer_entitlements_expiry_idx ON commission_offer_entitlements(expires_at, status)").run();
}

export async function syncWelcomeCommissionOfferEntitlement(database: D1Database, user: {
  id: string;
  created_at: string;
  email_confirmed_at?: string | null;
}) {
  const confirmedAt = user.email_confirmed_at;
  if (!confirmedAt || !welcomeCommissionRegistrationIsEligible(user.created_at, confirmedAt)) return false;
  const eligibleFrom = welcomeCommissionEligibilityStartsAt(confirmedAt);
  await ensureWelcomeCommissionOfferSchema(database);
  await database.prepare(`INSERT OR IGNORE INTO commission_offer_entitlements
    (id, customer_id, offer_code, discount_cents, registered_at, confirmed_at, expires_at, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'eligible')`)
    .bind(crypto.randomUUID(), user.id, WELCOME_COMMISSION_OFFER.code, WELCOME_COMMISSION_OFFER.discountCents,
      user.created_at, eligibleFrom, welcomeCommissionOfferExpiresAt(confirmedAt)).run();
  const commissionTable = await database.prepare("SELECT 1 AS found FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1")
    .bind("commission_requests")
    .first<{ found: number }>();
  if (commissionTable) {
    await database.prepare(`UPDATE commission_offer_entitlements
      SET status = 'claimed',
        claimed_request_id = (SELECT id FROM commission_requests WHERE customer_id = ? ORDER BY datetime(created_at) ASC, created_at ASC, id ASC LIMIT 1),
        claimed_at = (SELECT created_at FROM commission_requests WHERE customer_id = ? ORDER BY datetime(created_at) ASC, created_at ASC, id ASC LIMIT 1),
        updated_at = CURRENT_TIMESTAMP
      WHERE customer_id = ? AND offer_code = ? AND status = 'eligible' AND claimed_request_id IS NULL
        AND datetime((SELECT created_at FROM commission_requests WHERE customer_id = ? ORDER BY datetime(created_at) ASC, created_at ASC, id ASC LIMIT 1)) >= datetime(confirmed_at)
        AND datetime((SELECT created_at FROM commission_requests WHERE customer_id = ? ORDER BY datetime(created_at) ASC, created_at ASC, id ASC LIMIT 1)) <= datetime(expires_at)`)
      .bind(user.id, user.id, user.id, WELCOME_COMMISSION_OFFER.code, user.id, user.id).run();
  }
  return true;
}

export async function claimWelcomeCommissionOffer(database: D1Database, customerId: string, requestId: string, requestedAt: string) {
  await ensureWelcomeCommissionOfferSchema(database);
  const firstRequest = await database.prepare(`SELECT id FROM commission_requests
    WHERE customer_id = ? ORDER BY datetime(created_at) ASC, created_at ASC, id ASC LIMIT 1`)
    .bind(customerId).first<{ id: string }>();
  if (firstRequest?.id !== requestId) return false;
  const result = await database.prepare(`UPDATE commission_offer_entitlements
    SET status = 'claimed', claimed_request_id = ?, claimed_at = ?, updated_at = CURRENT_TIMESTAMP
    WHERE customer_id = ? AND offer_code = ? AND status = 'eligible' AND claimed_request_id IS NULL
      AND datetime(?) >= datetime(confirmed_at) AND datetime(?) <= datetime(expires_at)`)
    .bind(requestId, requestedAt, customerId, WELCOME_COMMISSION_OFFER.code, requestedAt, requestedAt).run();
  return Number(result.meta.changes ?? 0) > 0;
}

export async function getWelcomeCommissionOfferForRequest(database: D1Database, requestId: string) {
  await ensureWelcomeCommissionOfferSchema(database);
  return database.prepare(`SELECT offer_code, discount_cents, status, expires_at, redeemed_at
    FROM commission_offer_entitlements WHERE claimed_request_id = ? AND offer_code = ? AND status = 'claimed' LIMIT 1`)
    .bind(requestId, WELCOME_COMMISSION_OFFER.code)
    .first<{ offer_code: string; discount_cents: number; status: string; expires_at: string; redeemed_at: string | null }>();
}

export async function markWelcomeCommissionOfferRedeemed(database: D1Database, requestId: string) {
  await database.prepare(`UPDATE commission_offer_entitlements SET redeemed_at = COALESCE(redeemed_at, CURRENT_TIMESTAMP),
    updated_at = CURRENT_TIMESTAMP WHERE claimed_request_id = ? AND offer_code = ? AND status = 'claimed'`)
    .bind(requestId, WELCOME_COMMISSION_OFFER.code).run();
}
