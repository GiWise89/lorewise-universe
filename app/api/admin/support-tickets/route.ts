import { requireOrderAdmin } from "@/lib/orderAdminAuth";
import { ensureSupportTicketTables } from "@/lib/supportTickets";

const statuses = new Set(["open", "reviewing", "waiting_user", "resolved", "closed"]);
const priorities = new Set(["low", "normal", "high", "critical"]);

export async function GET() {
  const auth = await requireOrderAdmin();
  if ("response" in auth) return auth.response;
  await ensureSupportTicketTables(auth.database);
  const tickets = await auth.database.prepare(`SELECT support_tickets.*, customers.email, customers.display_name
    FROM support_tickets JOIN customers ON customers.id = support_tickets.customer_id
    ORDER BY CASE priority WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END, created_at DESC LIMIT 150`).all<Record<string, unknown>>();
  return Response.json({ tickets: tickets.results.map((row) => ({ id: row.id, referenceCode: row.reference_code, customerEmail: row.email, customerName: row.display_name, category: row.category, subject: row.subject, description: row.description, productCode: row.product_code, status: row.status, priority: row.priority, adminNotes: row.admin_notes ?? "", createdAt: row.created_at, updatedAt: row.updated_at })) }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function PATCH(request: Request) {
  const auth = await requireOrderAdmin();
  if ("response" in auth) return auth.response;
  const body = await request.json().catch(() => null) as { id?: unknown; status?: unknown; priority?: unknown; adminNotes?: unknown } | null;
  const id = typeof body?.id === "string" ? body.id : "";
  const status = typeof body?.status === "string" ? body.status : "";
  const priority = typeof body?.priority === "string" ? body.priority : "";
  const adminNotes = typeof body?.adminNotes === "string" ? body.adminNotes.trim().slice(0, 4000) : "";
  if (!id || !statuses.has(status) || !priorities.has(priority)) return Response.json({ error: "Aggiornamento non valido." }, { status: 400 });
  await ensureSupportTicketTables(auth.database);
  const existing = await auth.database.prepare("SELECT id FROM support_tickets WHERE id = ?").bind(id).first();
  if (!existing) return Response.json({ error: "Richiesta non trovata." }, { status: 404 });
  await auth.database.prepare(`UPDATE support_tickets SET status = ?, priority = ?, admin_notes = ?,
    resolved_at = CASE WHEN ? IN ('resolved','closed') THEN COALESCE(resolved_at, CURRENT_TIMESTAMP) ELSE NULL END,
    updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(status, priority, adminNotes || null, status, id).run();
  return Response.json({ success: true, message: "Richiesta aggiornata." });
}
