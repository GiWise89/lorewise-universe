import { env } from "@/lib/netlifyRuntime";

import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { commissionRequestFiles, commissionRequests } from "@/db/schema";
import { commissionCategories } from "@/lib/commissionCatalog";
import { CORRUPTED_PORTRAIT_PACKAGE, getCommissionPromotionForSubmission } from "@/lib/commissionPromotion";
import { getLoreWiseUser } from "@/lib/supabase/server";
import { syncLoreWiseCustomer } from "@/lib/supabase/customer";
import { ensureCommissionBenefitColumns, getActiveUniversePass } from "@/lib/universePass";
import { queueAndAttemptTransactionalEmail } from "@/lib/transactionalEmail";

const maxFiles = 3;
const maxFileSize = 8 * 1024 * 1024;
const allowedFileTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const packages = new Set(["Da valutare insieme", "Ritratto Essenziale", "Ritratto Completo", "Opera Narrativa", CORRUPTED_PORTRAIT_PACKAGE]);
const uses = new Set(["Personale", "Commerciale da valutare", "Non sono sicuro"]);

type RuntimeEnv = {
  DB?: D1Database;
  COMMISSION_UPLOADS?: R2Bucket;
  RESEND_API_KEY?: string;
  LOREWISE_EMAIL_SENDER_NAME?: string;
  LOREWISE_EMAIL_SENDER_ADDRESS?: string;
  LOREWISE_EMAIL_REPLY_TO?: string;
};

function field(formData: FormData, name: string, maxLength: number) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function checked(formData: FormData, name: string) {
  return formData.get(name) === "true";
}

function safeFileName(name: string) {
  return name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").slice(0, 100) || "riferimento";
}

function createReferenceCode() {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const token = crypto.randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase();
  return `LW-REQ-${date}-${token}`;
}

function isValidEuropeanDate(value: string) {
  if (!value) return true;
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return false;
  const [, day, month, year] = match;
  const parsed = new Date(Number(year), Number(month) - 1, Number(day));
  return parsed.getFullYear() === Number(year) && parsed.getMonth() === Number(month) - 1 && parsed.getDate() === Number(day);
}

async function ensureSchema(database: D1Database) {
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
    database.prepare("CREATE INDEX IF NOT EXISTS commission_requests_created_at_idx ON commission_requests(created_at)"),
    database.prepare("CREATE INDEX IF NOT EXISTS commission_requests_status_idx ON commission_requests(status)"),
    database.prepare("CREATE INDEX IF NOT EXISTS commission_request_files_request_id_idx ON commission_request_files(request_id)"),
  ]);
  const columns = await database.prepare("PRAGMA table_info(commission_requests)").all<{ name: string }>();
  const names = new Set(columns.results.map((column) => column.name));
  if (!names.has("content_policy_consent")) await database.prepare("ALTER TABLE commission_requests ADD COLUMN content_policy_consent INTEGER NOT NULL DEFAULT 0").run();
  if (!names.has("quote_terms_accepted_at")) await database.prepare("ALTER TABLE commission_requests ADD COLUMN quote_terms_accepted_at TEXT").run();
  if (!names.has("deposit_cents")) await database.prepare("ALTER TABLE commission_requests ADD COLUMN deposit_cents INTEGER").run();
  if (!names.has("quote_terms_version")) await database.prepare("ALTER TABLE commission_requests ADD COLUMN quote_terms_version TEXT").run();
}

export async function POST(request: Request) {
  const user = await getLoreWiseUser();
  if (!user?.email) return Response.json({ error: "Accedi con il tuo LoreWise ID per inviare una commissione e ricevere automaticamente i vantaggi del piano." }, { status: 401 });
  const runtime = env as unknown as RuntimeEnv;
  if (!runtime.DB || !runtime.COMMISSION_UPLOADS) {
    return Response.json({ error: "Archivio richieste non ancora disponibile." }, { status: 503 });
  }

  try {
    await syncLoreWiseCustomer(user);
    const customer = await runtime.DB.prepare("SELECT id, email, status FROM customers WHERE id = ?")
      .bind(user.id).first<{ id: string; email: string; status: string }>();
    if (!customer || customer.status !== "active") return Response.json({ error: "Questo LoreWise ID non può inviare nuove richieste." }, { status: 403 });
    const formData = await request.formData();
    if (field(formData, "website", 200)) {
      return Response.json({ referenceCode: createReferenceCode(), received: true }, { status: 201 });
    }

    const name = field(formData, "name", 100);
    const email = customer.email.toLocaleLowerCase("it");
    const category = field(formData, "category", 80);
    const packageName = field(formData, "packageName", 80);
    const intendedUse = field(formData, "intendedUse", 50);
    const idealDeadline = field(formData, "idealDeadline", 10);
    const artworkReference = field(formData, "artworkReference", 120);
    const brief = field(formData, "brief", 4000);
    const guardianName = field(formData, "guardianName", 100);
    const includesMinor = checked(formData, "includesMinor");
    const guardianConsent = checked(formData, "guardianConsent");
    const portfolioConsent = checked(formData, "portfolioConsent");
    const privacyConsent = checked(formData, "privacyConsent");
    const contentPolicyConsent = checked(formData, "contentPolicyConsent");
    const files = formData.getAll("references").filter((item): item is File => item instanceof File && item.size > 0);

    if (name.length < 2 || !/^\S+@\S+\.\S+$/.test(email)) {
      return Response.json({ error: "Inserisci nome ed email validi." }, { status: 400 });
    }
    if (!commissionCategories.includes(category as (typeof commissionCategories)[number]) || !packages.has(packageName) || !uses.has(intendedUse)) {
      return Response.json({ error: "Categoria, pacchetto o utilizzo non validi." }, { status: 400 });
    }
    if (packageName === CORRUPTED_PORTRAIT_PACKAGE && !getCommissionPromotionForSubmission(packageName, new Date())) {
      return Response.json({ error: "La promozione La mia versione corrotta non è attiva." }, { status: 400 });
    }
    if (brief.length < 20) {
      return Response.json({ error: "Descrivi la richiesta con almeno 20 caratteri." }, { status: 400 });
    }
    if (!isValidEuropeanDate(idealDeadline)) {
      return Response.json({ error: "La data ideale deve usare il formato GG/MM/AAAA." }, { status: 400 });
    }
    if (!privacyConsent) {
      return Response.json({ error: "Il consenso al trattamento dei dati è necessario per inviare la richiesta." }, { status: 400 });
    }
    if (!contentPolicyConsent) {
      return Response.json({ error: "Devi accettare la politica dei contenuti GiWise Studio." }, { status: 400 });
    }
    if (includesMinor && (guardianName.length < 2 || !guardianConsent)) {
      return Response.json({ error: "Per un ritratto di minore servono nome e consenso del genitore o tutore." }, { status: 400 });
    }
    if (files.length > maxFiles || files.some((file) => file.size > maxFileSize || !allowedFileTypes.has(file.type))) {
      return Response.json({ error: "Puoi allegare fino a 3 immagini JPG, PNG o WebP, massimo 8 MB ciascuna." }, { status: 400 });
    }

    await ensureSchema(runtime.DB);
    await ensureCommissionBenefitColumns(runtime.DB);
    const db = getDb(runtime.DB);
    const requestId = crypto.randomUUID();
    const referenceCode = createReferenceCode();
    const storedKeys: string[] = [];

    await db.insert(commissionRequests).values({
      id: requestId,
      referenceCode,
      customerId: customer.id,
      name,
      email,
      category,
      packageName,
      intendedUse,
      idealDeadline: idealDeadline || null,
      artworkReference: artworkReference || null,
      brief,
      includesMinor,
      guardianName: includesMinor ? guardianName : null,
      guardianConsent: includesMinor && guardianConsent,
      portfolioConsent,
      privacyConsent,
      contentPolicyConsent,
    });

    try {
      for (const file of files) {
        const fileId = crypto.randomUUID();
        const objectKey = `commission-requests/${requestId}/${fileId}-${safeFileName(file.name)}`;
        await runtime.COMMISSION_UPLOADS.put(objectKey, file.stream(), {
          httpMetadata: { contentType: file.type },
          customMetadata: { requestId, referenceCode },
        });
        storedKeys.push(objectKey);
        await db.insert(commissionRequestFiles).values({
          id: fileId,
          requestId,
          objectKey,
          originalName: file.name.slice(0, 180),
          contentType: file.type,
          size: file.size,
        });
      }
    } catch (error) {
      await Promise.all(storedKeys.map((key) => runtime.COMMISSION_UPLOADS?.delete(key)));
      await db.delete(commissionRequests).where(eq(commissionRequests.id, requestId));
      throw error;
    }

    const pass = await getActiveUniversePass(runtime.DB, customer.id);
    const emailResult = await queueAndAttemptTransactionalEmail(runtime.DB, runtime, {
      eventKey: `commission-received:${requestId}`,
      customerId: customer.id,
      recipientEmail: customer.email,
      template: "commission_received",
      payload: {
        name,
        referenceCode,
        title: packageName,
        detailUrl: `${new URL(request.url).origin}/commissioni/stato`,
      },
    });
    return Response.json({
      referenceCode,
      received: true,
      message: "Richiesta archiviata correttamente.",
      emailConfirmationConfigured: emailResult.status === "sent",
      emailStatus: emailResult.status,
      account: { email: customer.email, plan: pass.name, commissionDiscountPercent: pass.commissionDiscountPercent },
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Errore inatteso";
    return Response.json({ error: `Non è stato possibile archiviare la richiesta. ${message}` }, { status: 500 });
  }
}
