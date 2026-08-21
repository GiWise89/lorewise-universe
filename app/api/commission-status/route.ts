import { env } from "@/lib/netlifyRuntime";

type RuntimeEnv = { DB?: D1Database };
import { COMMISSION_TERMS_VERSION } from "@/lib/commissionTerms";
import { ensureCommerceTables } from "@/lib/commerceServer";
import { ensureCommissionBenefitColumns } from "@/lib/universePass";

type RequestRow = {
  id: string;
  reference_code: string;
  name: string;
  category: string;
  package_name: string;
  intended_use: string;
  ideal_deadline: string | null;
  status: string;
  quote_base_cents: number | null;
  quote_discount_cents: number | null;
  quote_cents: number | null;
  deposit_cents: number | null;
  membership_plan_code: string | null;
  membership_discount_percent: number;
  benefit_snapshot_at: string | null;
  client_response: string | null;
  client_message: string | null;
  client_responded_at: string | null;
  created_at: string;
  updated_at: string | null;
  quote_terms_accepted_at: string | null;
  quote_terms_version: string | null;
};

const referencePattern = /^LW-REQ-\d{8}-[A-F0-9]{6}$/;
const terminalStatuses = new Set(["accepted", "in_progress", "awaiting_balance", "balance_paid", "completed", "declined", "cancelled"]);

async function getRuntime() {
  return env as unknown as RuntimeEnv;
}

async function ensureClientResponseColumns(database: D1Database) {
  await database.prepare(`CREATE TABLE IF NOT EXISTS commission_requests (
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
  )`).run();
  const columns = await database.prepare("PRAGMA table_info(commission_requests)").all<{ name: string }>();
  const names = new Set(columns.results.map((column) => column.name));
  if (!names.has("client_response")) await database.prepare("ALTER TABLE commission_requests ADD COLUMN client_response TEXT").run();
  if (!names.has("client_message")) await database.prepare("ALTER TABLE commission_requests ADD COLUMN client_message TEXT").run();
  if (!names.has("client_responded_at")) await database.prepare("ALTER TABLE commission_requests ADD COLUMN client_responded_at TEXT").run();
  if (!names.has("content_policy_consent")) await database.prepare("ALTER TABLE commission_requests ADD COLUMN content_policy_consent INTEGER NOT NULL DEFAULT 0").run();
  if (!names.has("quote_terms_accepted_at")) await database.prepare("ALTER TABLE commission_requests ADD COLUMN quote_terms_accepted_at TEXT").run();
  if (!names.has("deposit_cents")) await database.prepare("ALTER TABLE commission_requests ADD COLUMN deposit_cents INTEGER").run();
  if (!names.has("quote_terms_version")) await database.prepare("ALTER TABLE commission_requests ADD COLUMN quote_terms_version TEXT").run();
  if (!names.has("updated_at")) await database.prepare("ALTER TABLE commission_requests ADD COLUMN updated_at TEXT").run();
}

function publicRequest(row: RequestRow) {
  return {
    referenceCode: row.reference_code,
    clientFirstName: row.name.trim().split(/\s+/)[0] || "Cliente",
    category: row.category,
    packageName: row.package_name,
    intendedUse: row.intended_use,
    idealDeadline: row.ideal_deadline,
    status: row.status,
    quoteBaseCents: row.quote_base_cents ?? row.quote_cents,
    quoteDiscountCents: row.quote_discount_cents ?? 0,
    quoteCents: row.quote_cents,
    depositCents: row.deposit_cents,
    membershipPlanCode: row.membership_plan_code,
    membershipDiscountPercent: row.membership_discount_percent ?? 0,
    benefitSnapshotAt: row.benefit_snapshot_at,
    clientResponse: row.client_response,
    clientMessage: row.client_message,
    clientRespondedAt: row.client_responded_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at,
    quoteTermsAcceptedAt: row.quote_terms_accepted_at,
    quoteTermsVersion: row.quote_terms_version,
  };
}

export async function POST(request: Request) {
  const runtime = await getRuntime();
  if (!runtime.DB) return Response.json({ error: "Servizio di consultazione non disponibile." }, { status: 503 });

  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Dati non validi." }, { status: 400 });
  }

  const referenceCode = typeof body.referenceCode === "string" ? body.referenceCode.trim().toUpperCase() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLocaleLowerCase("it") : "";
  const action = typeof body.action === "string" ? body.action : "lookup";
  const message = typeof body.message === "string" ? body.message.trim().slice(0, 1000) : "";
  const termsAccepted = body.termsAccepted === true;
  if (!referencePattern.test(referenceCode) || !/^\S+@\S+\.\S+$/.test(email)) {
    return Response.json({ error: "Codice richiesta o email non validi." }, { status: 400 });
  }

  await ensureClientResponseColumns(runtime.DB);
  await ensureCommerceTables(runtime.DB);
  await ensureCommissionBenefitColumns(runtime.DB);
  let row = await runtime.DB.prepare(`SELECT id, reference_code, name, category, package_name, intended_use,
    ideal_deadline, status, quote_base_cents, quote_discount_cents, quote_cents, deposit_cents,
    membership_plan_code, membership_discount_percent, benefit_snapshot_at,
    client_response, client_message, client_responded_at, quote_terms_accepted_at, quote_terms_version, created_at, updated_at
    FROM commission_requests WHERE reference_code = ? AND lower(email) = ?`)
    .bind(referenceCode, email).first<RequestRow>();
  if (!row) {
    return Response.json({ error: "Nessuna richiesta corrisponde ai dati inseriti." }, { status: 404, headers: { "Cache-Control": "no-store" } });
  }

  if (action === "accept_quote") {
    if (row.quote_cents == null || row.deposit_cents == null || row.status !== "quoted") {
      return Response.json({ error: "Questo preventivo non può essere accettato nello stato attuale." }, { status: 409 });
    }
    if (!termsAccepted) {
      return Response.json({ error: "Per accettare il preventivo devi confermare le condizioni del servizio." }, { status: 400 });
    }
    await runtime.DB.prepare(`UPDATE commission_requests SET status = 'accepted', client_response = 'accepted',
      client_message = NULL, client_responded_at = CURRENT_TIMESTAMP, quote_terms_accepted_at = CURRENT_TIMESTAMP,
      quote_terms_version = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(COMMISSION_TERMS_VERSION, row.id).run();
  } else if (action === "request_clarification") {
    if (row.quote_cents == null || terminalStatuses.has(row.status) || message.length < 10) {
      return Response.json({ error: "Scrivi almeno 10 caratteri per chiedere un chiarimento sul preventivo." }, { status: 409 });
    }
    await runtime.DB.prepare(`UPDATE commission_requests SET status = 'reviewing', client_response = 'clarification_requested',
      client_message = ?, client_responded_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(message, row.id).run();
  } else if (action !== "lookup") {
    return Response.json({ error: "Azione non valida." }, { status: 400 });
  }

  if (action !== "lookup") {
    row = await runtime.DB.prepare(`SELECT id, reference_code, name, category, package_name, intended_use,
      ideal_deadline, status, quote_base_cents, quote_discount_cents, quote_cents, deposit_cents,
      membership_plan_code, membership_discount_percent, benefit_snapshot_at,
      client_response, client_message, client_responded_at, quote_terms_accepted_at, quote_terms_version, created_at, updated_at
      FROM commission_requests WHERE id = ?`).bind(row.id).first<RequestRow>();
  }

  return Response.json({ request: publicRequest(row!) }, { headers: { "Cache-Control": "private, no-store" } });
}
