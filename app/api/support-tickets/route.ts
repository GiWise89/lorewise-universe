import { env } from "@/lib/netlifyRuntime";

import { ensureCommerceTables } from "@/lib/commerceServer";
import { ensureAdminNotificationsTable } from "@/lib/adminNotifications";
import { ensureSupportTicketTables, makeSupportReference } from "@/lib/supportTickets";
import { syncLoreWiseCustomer } from "@/lib/supabase/customer";
import { getLoreWiseUser } from "@/lib/supabase/server";

type RuntimeEnv = { DB?: D1Database };
const categories = new Set(["account", "game", "download", "commission", "subscription", "privacy", "other"]);

async function context() {
  const user = await getLoreWiseUser();
  if (!user?.email) return { response: Response.json({ error: "Accedi al tuo LoreWise ID per aprire una richiesta." }, { status: 401 }) };
  const database = (env as unknown as RuntimeEnv).DB;
  if (!database) return { response: Response.json({ error: "Centro assistenza non disponibile." }, { status: 503 }) };
  await ensureCommerceTables(database);
  await syncLoreWiseCustomer(user);
  await ensureSupportTicketTables(database);
  return { user, database };
}

export async function GET() {
  const result = await context();
  if ("response" in result) return result.response;
  const tickets = await result.database.prepare(`SELECT reference_code, category, subject, description, product_code,
    status, priority, admin_notes, resolved_at, created_at, updated_at FROM support_tickets
    WHERE customer_id = ? ORDER BY created_at DESC LIMIT 30`).bind(result.user.id).all<Record<string, unknown>>();
  return Response.json({ tickets: tickets.results.map((row) => ({ referenceCode: row.reference_code, category: row.category, subject: row.subject, description: row.description, productCode: row.product_code, status: row.status, priority: row.priority, adminNotes: row.admin_notes, resolvedAt: row.resolved_at, createdAt: row.created_at, updatedAt: row.updated_at })) }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin");
  if (origin && origin !== requestUrl.origin) return Response.json({ error: "Origine della richiesta non valida." }, { status: 403 });
  const result = await context();
  if ("response" in result) return result.response;
  const body = await request.json().catch(() => null) as { category?: unknown; subject?: unknown; description?: unknown; productCode?: unknown } | null;
  const category = typeof body?.category === "string" ? body.category.trim() : "";
  const subject = typeof body?.subject === "string" ? body.subject.trim() : "";
  const description = typeof body?.description === "string" ? body.description.trim() : "";
  const productCode = typeof body?.productCode === "string" ? body.productCode.trim().slice(0, 80) : "";
  if (!categories.has(category) || subject.length < 5 || subject.length > 120 || description.length < 30 || description.length > 4000) return Response.json({ error: "Compila categoria, oggetto e descrizione completa della richiesta." }, { status: 400 });
  const recent = await result.database.prepare("SELECT COUNT(*) AS total FROM support_tickets WHERE customer_id = ? AND datetime(created_at) > datetime('now', '-1 hour')").bind(result.user.id).first<{ total: number }>();
  if (Number(recent?.total ?? 0) >= 3) return Response.json({ error: "Hai già aperto tre richieste nell’ultima ora. Attendi prima di inviarne un’altra." }, { status: 429, headers: { "Retry-After": "3600" } });
  const id = crypto.randomUUID();
  const referenceCode = makeSupportReference();
  const priority = category === "privacy" ? "high" : "normal";
  await ensureAdminNotificationsTable(result.database);
  await result.database.batch([
    result.database.prepare(`INSERT INTO support_tickets (id, reference_code, customer_id, category, subject, description, product_code, priority)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).bind(id, referenceCode, result.user.id, category, subject, description, productCode || null, priority),
    result.database.prepare(`INSERT OR IGNORE INTO admin_notifications
      (id, category, severity, title, message, reference_code, target_url, source_created_at)
      VALUES (?, 'support', ?, 'Nuova richiesta di assistenza', ?, ?, '/gestione-assistenza', CURRENT_TIMESTAMP)`)
      .bind(`support-ticket:${id}`, priority === "high" ? "high" : "medium", subject, referenceCode),
  ]);
  return Response.json({ success: true, referenceCode, message: "Richiesta registrata e inviata al Centro Admin." }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
}
