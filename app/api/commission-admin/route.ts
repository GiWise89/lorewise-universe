import { env } from "@/lib/netlifyRuntime";

import { requireCommissionAdminApi } from "@/lib/commissionAdminAuth";
import { ensureCommerceTables } from "@/lib/commerceServer";
import { calculateCommissionBenefit, ensureCommissionBenefitColumns, getActiveUniversePass, universePassBenefitFromCode } from "@/lib/universePass";
import { commissionDiscountForSubmission } from "@/lib/commissionPromotion";
import { queueAndAttemptTransactionalEmail } from "@/lib/transactionalEmail";

type RuntimeEnv = {
  DB?: D1Database;
  COMMISSION_UPLOADS?: R2Bucket;
  RESEND_API_KEY?: string;
  LOREWISE_EMAIL_SENDER_NAME?: string;
  LOREWISE_EMAIL_SENDER_ADDRESS?: string;
  LOREWISE_EMAIL_REPLY_TO?: string;
};

const statuses = new Set(["new", "reviewing", "quoted", "accepted", "in_progress", "awaiting_balance", "balance_paid", "payment_issue", "completed", "declined", "cancelled"]);

async function runtimeEnv() {
  return env as unknown as RuntimeEnv;
}

async function ensureAdminSchema(database: D1Database) {
  await database.batch([
    database.prepare(`CREATE TABLE IF NOT EXISTS commission_requests (
      id TEXT PRIMARY KEY NOT NULL,
      reference_code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      category TEXT NOT NULL,
      package_name TEXT NOT NULL,
      intended_use TEXT NOT NULL,
      ideal_deadline TEXT,
      artwork_reference TEXT,
      brief TEXT NOT NULL,
      includes_minor INTEGER NOT NULL DEFAULT 0,
      guardian_name TEXT,
      guardian_consent INTEGER NOT NULL DEFAULT 0,
      portfolio_consent INTEGER NOT NULL DEFAULT 0,
      privacy_consent INTEGER NOT NULL DEFAULT 0,
      content_policy_consent INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'new',
      quote_cents INTEGER,
      deposit_cents INTEGER,
      admin_notes TEXT,
      launch_slot_reserved INTEGER NOT NULL DEFAULT 0,
      client_response TEXT,
      client_message TEXT,
      client_responded_at TEXT,
      quote_terms_accepted_at TEXT,
      quote_terms_version TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    database.prepare(`CREATE TABLE IF NOT EXISTS commission_request_files (
      id TEXT PRIMARY KEY NOT NULL,
      request_id TEXT NOT NULL,
      object_key TEXT NOT NULL UNIQUE,
      original_name TEXT NOT NULL,
      content_type TEXT NOT NULL,
      size INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (request_id) REFERENCES commission_requests(id) ON DELETE CASCADE
    )`),
  ]);

  const columns = await database.prepare("PRAGMA table_info(commission_requests)").all<{ name: string }>();
  const names = new Set(columns.results.map((column) => column.name));
  if (!names.has("quote_cents")) await database.prepare("ALTER TABLE commission_requests ADD COLUMN quote_cents INTEGER").run();
  if (!names.has("deposit_cents")) await database.prepare("ALTER TABLE commission_requests ADD COLUMN deposit_cents INTEGER").run();
  if (!names.has("admin_notes")) await database.prepare("ALTER TABLE commission_requests ADD COLUMN admin_notes TEXT").run();
  if (!names.has("launch_slot_reserved")) await database.prepare("ALTER TABLE commission_requests ADD COLUMN launch_slot_reserved INTEGER NOT NULL DEFAULT 0").run();
  if (!names.has("client_response")) await database.prepare("ALTER TABLE commission_requests ADD COLUMN client_response TEXT").run();
  if (!names.has("client_message")) await database.prepare("ALTER TABLE commission_requests ADD COLUMN client_message TEXT").run();
  if (!names.has("client_responded_at")) await database.prepare("ALTER TABLE commission_requests ADD COLUMN client_responded_at TEXT").run();
  if (!names.has("content_policy_consent")) await database.prepare("ALTER TABLE commission_requests ADD COLUMN content_policy_consent INTEGER NOT NULL DEFAULT 0").run();
  if (!names.has("quote_terms_accepted_at")) await database.prepare("ALTER TABLE commission_requests ADD COLUMN quote_terms_accepted_at TEXT").run();
  if (!names.has("quote_terms_version")) await database.prepare("ALTER TABLE commission_requests ADD COLUMN quote_terms_version TEXT").run();
  if (!names.has("updated_at")) await database.prepare("ALTER TABLE commission_requests ADD COLUMN updated_at TEXT").run();
}

function normalizeRequest(row: Record<string, unknown>, files: Record<string, unknown>[]) {
  const activePass = universePassBenefitFromCode(typeof row.active_plan_code === "string" ? row.active_plan_code : null, typeof row.active_period_end === "string" ? row.active_period_end : null);
  return {
    id: row.id,
    referenceCode: row.reference_code,
    name: row.name,
    email: row.email,
    category: row.category,
    packageName: row.package_name,
    intendedUse: row.intended_use,
    idealDeadline: row.ideal_deadline,
    artworkReference: row.artwork_reference,
    brief: row.brief,
    includesMinor: Boolean(row.includes_minor),
    guardianName: row.guardian_name,
    guardianConsent: Boolean(row.guardian_consent),
    portfolioConsent: Boolean(row.portfolio_consent),
    privacyConsent: Boolean(row.privacy_consent),
    contentPolicyConsent: Boolean(row.content_policy_consent),
    status: row.status,
    customerId: row.customer_id,
    quoteBaseCents: row.quote_base_cents ?? row.quote_cents,
    quoteDiscountCents: row.quote_discount_cents ?? 0,
    quoteCents: row.quote_cents,
    depositCents: row.deposit_cents,
    membershipPlanCode: row.membership_plan_code,
    membershipDiscountPercent: Number(row.membership_discount_percent ?? 0),
    benefitSnapshotAt: row.benefit_snapshot_at,
    activeMembership: activePass,
    adminNotes: row.admin_notes ?? "",
    launchSlotReserved: Boolean(row.launch_slot_reserved),
    clientResponse: row.client_response,
    clientMessage: row.client_message,
    clientRespondedAt: row.client_responded_at,
    quoteTermsAcceptedAt: row.quote_terms_accepted_at,
    quoteTermsVersion: row.quote_terms_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at,
    files: files
      .filter((file) => file.request_id === row.id)
      .map((file) => ({
        id: file.id,
        originalName: file.original_name,
        contentType: file.content_type,
        size: file.size,
      })),
  };
}

export async function GET(request: Request) {
  const auth = await requireCommissionAdminApi();
  if (auth.response) return auth.response;
  const runtime = await runtimeEnv();
  if (!runtime.DB) return Response.json({ error: "Archivio richieste non disponibile." }, { status: 503 });

  await ensureAdminSchema(runtime.DB);
  await ensureCommerceTables(runtime.DB);
  await ensureCommissionBenefitColumns(runtime.DB);
  const url = new URL(request.url);
  const status = url.searchParams.get("status")?.trim() ?? "all";
  const search = url.searchParams.get("search")?.trim().slice(0, 120) ?? "";
  const filters: string[] = [];
  const values: string[] = [];
  if (status !== "all" && statuses.has(status)) {
    filters.push("status = ?");
    values.push(status);
  }
  if (search) {
    filters.push("(reference_code LIKE ? OR name LIKE ? OR email LIKE ?)");
    const term = `%${search}%`;
    values.push(term, term, term);
  }
  const where = filters.length ? ` WHERE ${filters.join(" AND ")}` : "";
  const statement = runtime.DB.prepare(`SELECT commission_requests.*,
    (SELECT plan_code FROM subscriptions WHERE customer_id = commission_requests.customer_id
      AND status IN ('active', 'trialing') AND (current_period_end IS NULL OR datetime(current_period_end) > CURRENT_TIMESTAMP)
      ORDER BY created_at DESC LIMIT 1) AS active_plan_code,
    (SELECT current_period_end FROM subscriptions WHERE customer_id = commission_requests.customer_id
      AND status IN ('active', 'trialing') AND (current_period_end IS NULL OR datetime(current_period_end) > CURRENT_TIMESTAMP)
      ORDER BY created_at DESC LIMIT 1) AS active_period_end
    FROM commission_requests${where} ORDER BY
      CASE active_plan_code WHEN 'LW-PASS-COLLECTOR' THEN 0 WHEN 'LW-PASS-SUPPORTER' THEN 1 ELSE 2 END,
      created_at DESC`).bind(...values);
  const [requestRows, fileRows, reserved] = await Promise.all([
    statement.all<Record<string, unknown>>(),
    runtime.DB.prepare("SELECT * FROM commission_request_files ORDER BY created_at ASC").all<Record<string, unknown>>(),
    runtime.DB.prepare("SELECT COUNT(*) AS count FROM commission_requests WHERE launch_slot_reserved = 1").first<{ count: number }>(),
  ]);

  return Response.json({
    requests: requestRows.results.map((row) => normalizeRequest(row, fileRows.results)),
    launchSlots: { total: 10, reserved: Number(reserved?.count ?? 0) },
    admin: auth.admin,
  });
}

export async function PATCH(request: Request) {
  const auth = await requireCommissionAdminApi();
  if (auth.response) return auth.response;
  const runtime = await runtimeEnv();
  if (!runtime.DB) return Response.json({ error: "Archivio richieste non disponibile." }, { status: 503 });
  await ensureAdminSchema(runtime.DB);
  await ensureCommerceTables(runtime.DB);
  await ensureCommissionBenefitColumns(runtime.DB);

  const body = await request.json() as Record<string, unknown>;
  const id = typeof body.id === "string" ? body.id : "";
  const status = typeof body.status === "string" ? body.status : "";
  const quoteBaseCents = body.quoteBaseCents === null ? null : Number(body.quoteBaseCents ?? body.quoteCents);
  const depositCents = body.depositCents === null ? null : Number(body.depositCents);
  const adminNotes = typeof body.adminNotes === "string" ? body.adminNotes.trim().slice(0, 4000) : "";
  const launchSlotReserved = body.launchSlotReserved === true;
  if (!id || !statuses.has(status) || (quoteBaseCents !== null && (!Number.isInteger(quoteBaseCents) || quoteBaseCents < 0 || quoteBaseCents > 10_000_000))
    || (depositCents !== null && (!Number.isInteger(depositCents) || depositCents <= 0 || depositCents > 10_000_000))
  ) {
    return Response.json({ error: "Dati di aggiornamento non validi." }, { status: 400 });
  }

  const existing = await runtime.DB.prepare(`SELECT id, customer_id, reference_code, name, email, category, package_name, status, quote_base_cents, quote_discount_cents,
    quote_cents, deposit_cents, membership_plan_code, membership_discount_percent, benefit_snapshot_at, quote_terms_accepted_at, created_at
    FROM commission_requests WHERE id = ?`).bind(id).first<{
      id: string; customer_id: string | null; reference_code: string; name: string; email: string; category: string; package_name: string; status: string; quote_base_cents: number | null;
      quote_discount_cents: number | null; quote_cents: number | null; deposit_cents: number | null; membership_plan_code: string | null;
      membership_discount_percent: number; benefit_snapshot_at: string | null; quote_terms_accepted_at: string | null; created_at: string;
    }>();
  if (!existing) return Response.json({ error: "Richiesta non trovata." }, { status: 404 });
  const pricingLocked = Boolean(existing.quote_terms_accepted_at) || ["accepted", "in_progress", "awaiting_balance", "balance_paid", "completed"].includes(existing.status);
  if (pricingLocked && (quoteBaseCents !== existing.quote_base_cents || depositCents !== existing.deposit_cents)) {
    return Response.json({ error: "Prezzo, sconto e acconto restano bloccati dopo l’accettazione del preventivo." }, { status: 409 });
  }
  const currentPass = await getActiveUniversePass(runtime.DB, existing.customer_id);
  const currentDiscountPercent = commissionDiscountForSubmission({
    planCode: currentPass.code,
    ordinaryDiscountPercent: currentPass.commissionDiscountPercent,
    submittedAt: existing.created_at,
    packageName: existing.package_name,
  });
  const preserveSnapshot = quoteBaseCents !== null && quoteBaseCents === existing.quote_base_cents && Boolean(existing.benefit_snapshot_at);
  const pricing = quoteBaseCents === null ? null : preserveSnapshot ? {
    baseCents: quoteBaseCents,
    discountPercent: existing.membership_discount_percent ?? 0,
    discountCents: existing.quote_discount_cents ?? 0,
    finalCents: existing.quote_cents ?? quoteBaseCents,
  } : calculateCommissionBenefit(quoteBaseCents, currentDiscountPercent);
  const membershipPlanCode = preserveSnapshot ? existing.membership_plan_code : currentPass.code;
  const membershipDiscountPercent = preserveSnapshot ? existing.membership_discount_percent : currentDiscountPercent;
  if (depositCents !== null && (pricing === null || depositCents > pricing.finalCents)) {
    return Response.json({ error: "L’acconto non può superare il totale finale dopo lo sconto Universe Pass." }, { status: 400 });
  }
  if (status === "quoted" && (pricing === null || pricing.finalCents <= 0 || depositCents === null || depositCents >= pricing.finalCents)) {
    return Response.json({ error: "Per inviare il preventivo servono un totale positivo e un acconto inferiore al totale finale." }, { status: 400 });
  }

  await runtime.DB.prepare(`UPDATE commission_requests
    SET status = ?, quote_base_cents = ?, quote_discount_cents = ?, quote_cents = ?, deposit_cents = ?,
      membership_plan_code = ?, membership_discount_percent = ?, benefit_snapshot_at = CURRENT_TIMESTAMP,
      admin_notes = ?, launch_slot_reserved = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?`).bind(status, pricing?.baseCents ?? null, pricing?.discountCents ?? null, pricing?.finalCents ?? null,
      depositCents, membershipPlanCode, membershipDiscountPercent, adminNotes || null, launchSlotReserved ? 1 : 0, id).run();

  if (status === "quoted" && pricing) {
    const origin = new URL(request.url).origin;
    await queueAndAttemptTransactionalEmail(runtime.DB, runtime, {
      eventKey: `commission-quote:${existing.id}:${pricing.finalCents}`,
      customerId: existing.customer_id,
      recipientEmail: existing.email,
      template: "commission_quote",
      payload: {
        name: existing.name,
        referenceCode: existing.reference_code,
        title: existing.package_name,
        amountLabel: new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(pricing.finalCents / 100),
        detailUrl: `${origin}/commissioni/stato`,
      },
    });
  }

  return Response.json({ saved: true, pricing, membership: preserveSnapshot ? universePassBenefitFromCode(membershipPlanCode) : currentPass });
}

export async function DELETE(request: Request) {
  const auth = await requireCommissionAdminApi();
  if (auth.response) return auth.response;
  const runtime = await runtimeEnv();
  if (!runtime.DB || !runtime.COMMISSION_UPLOADS) return Response.json({ error: "Archivio richieste non disponibile." }, { status: 503 });
  await ensureAdminSchema(runtime.DB);

  const id = new URL(request.url).searchParams.get("id")?.trim() ?? "";
  if (!id) return Response.json({ error: "Richiesta non valida." }, { status: 400 });
  const files = await runtime.DB.prepare("SELECT object_key FROM commission_request_files WHERE request_id = ?").bind(id).all<{ object_key: string }>();
  await Promise.all(files.results.map((file) => runtime.COMMISSION_UPLOADS!.delete(file.object_key)));
  await runtime.DB.batch([
    runtime.DB.prepare("DELETE FROM commission_request_files WHERE request_id = ?").bind(id),
    runtime.DB.prepare("DELETE FROM commission_requests WHERE id = ?").bind(id),
  ]);
  return Response.json({ deleted: true });
}
