import { ensureAdminAuditTable, recordAdminAudit } from "@/lib/adminAudit";
import { ensureBenefitEngineTables } from "@/lib/benefitEngine";
import { LOREWISE_OWNER_EMAIL } from "@/lib/accountPolicy";
import { requireOrderAdmin } from "@/lib/orderAdminAuth";

const roles = new Set(["member", "moderator", "admin"]);
const statuses = new Set(["active", "blocked"]);

export async function GET(request: Request) {
  const auth = await requireOrderAdmin();
  if ("response" in auth) return auth.response;
  await ensureBenefitEngineTables(auth.database);
  await ensureAdminAuditTable(auth.database);
  const url = new URL(request.url);
  const search = url.searchParams.get("search")?.trim().slice(0, 100) ?? "";
  const status = url.searchParams.get("status")?.trim() ?? "all";
  const values: string[] = [];
  const filters: string[] = [];
  if (search) { const term = `%${search}%`; filters.push("(customers.email LIKE ? OR customers.display_name LIKE ? OR customers.id LIKE ?)"); values.push(term, term, term); }
  if (status !== "all" && ["active", "blocked", "deletion_requested"].includes(status)) { filters.push("customers.status = ?"); values.push(status); }
  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const result = await auth.database.prepare(`SELECT customers.id, customers.email, customers.display_name,
      customers.role, customers.status, customers.created_at, customers.updated_at,
      (SELECT plan_code FROM subscriptions WHERE customer_id = customers.id ORDER BY created_at DESC LIMIT 1) AS plan_code,
      (SELECT status FROM subscriptions WHERE customer_id = customers.id ORDER BY created_at DESC LIMIT 1) AS plan_status,
      (SELECT COALESCE(SUM(remaining), 0) FROM benefit_ledger WHERE customer_id = customers.id AND status = 'active') AS credits,
      (SELECT COUNT(*) FROM orders WHERE customer_id = customers.id) AS orders_count,
      (SELECT COUNT(*) FROM entitlements WHERE customer_id = customers.id AND status = 'active') AS library_count
    FROM customers ${where} ORDER BY customers.created_at DESC LIMIT 150`).bind(...values).all<Record<string, unknown>>();
  return Response.json({
    users: result.results.map((row) => ({ id: row.id, email: row.email, displayName: row.display_name ?? "", role: row.role,
      status: row.status, createdAt: row.created_at, updatedAt: row.updated_at, planCode: row.plan_code, planStatus: row.plan_status,
      credits: Number(row.credits ?? 0), orders: Number(row.orders_count ?? 0), libraryItems: Number(row.library_count ?? 0),
      owner: String(row.email).toLocaleLowerCase("it") === LOREWISE_OWNER_EMAIL.toLocaleLowerCase("it") })),
  }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function PATCH(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin");
  if (origin && origin !== requestUrl.origin) return Response.json({ error: "Origine della richiesta non valida." }, { status: 403 });
  const auth = await requireOrderAdmin();
  if ("response" in auth) return auth.response;
  await ensureBenefitEngineTables(auth.database);
  await ensureAdminAuditTable(auth.database);
  const body = await request.json().catch(() => null) as { customerId?: unknown; action?: unknown; value?: unknown; note?: unknown } | null;
  const customerId = typeof body?.customerId === "string" ? body.customerId : "";
  const action = typeof body?.action === "string" ? body.action : "";
  const value = typeof body?.value === "string" ? body.value : "";
  const note = typeof body?.note === "string" ? body.note.trim().slice(0, 500) : "";
  const target = customerId ? await auth.database.prepare("SELECT id, email, role, status FROM customers WHERE id = ?").bind(customerId)
    .first<{ id: string; email: string; role: string; status: string }>() : null;
  if (!target) return Response.json({ error: "Profilo non trovato." }, { status: 404 });
  const isOwner = target.email.toLocaleLowerCase("it") === LOREWISE_OWNER_EMAIL.toLocaleLowerCase("it");

  if (action === "set_role") {
    if (!roles.has(value)) return Response.json({ error: "Ruolo non valido." }, { status: 400 });
    if (isOwner && value !== "admin") return Response.json({ error: "Il ruolo del proprietario LoreWise non può essere ridotto." }, { status: 409 });
    await auth.database.prepare("UPDATE customers SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(value, customerId).run();
    await recordAdminAudit(auth.database, { adminId: auth.adminId, targetCustomerId: customerId, action, previousValue: target.role, nextValue: value, note });
    return Response.json({ message: "Ruolo aggiornato e registrato." });
  }

  if (action === "set_status") {
    if (!statuses.has(value)) return Response.json({ error: "Stato non valido." }, { status: 400 });
    if ((isOwner || customerId === auth.adminId) && value === "blocked") return Response.json({ error: "Questo account amministrativo non può essere bloccato da questa sessione." }, { status: 409 });
    await auth.database.prepare("UPDATE customers SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(value, customerId).run();
    await recordAdminAudit(auth.database, { adminId: auth.adminId, targetCustomerId: customerId, action, previousValue: target.status, nextValue: value, note });
    return Response.json({ message: value === "blocked" ? "Account sospeso e azione registrata." : "Account riattivato e azione registrata." });
  }

  if (action === "grant_art_credit") {
    const amount = Number.parseInt(value, 10);
    if (!Number.isInteger(amount) || amount < 1 || amount > 10) return Response.json({ error: "Puoi assegnare da 1 a 10 crediti per operazione." }, { status: 400 });
    const expiresAt = new Date(); expiresAt.setUTCMonth(expiresAt.getUTCMonth() + 12);
    const reference = `admin:${crypto.randomUUID()}`;
    await auth.database.batch([
      auth.database.prepare(`INSERT INTO benefit_ledger (id, customer_id, source_key, benefit_type, amount, remaining,
        status, assigned_at, expires_at, metadata_json) VALUES (?, ?, ?, 'art_credit', ?, ?, 'active', CURRENT_TIMESTAMP, ?, ?)`)
        .bind(crypto.randomUUID(), customerId, reference, amount, amount, expiresAt.toISOString(), JSON.stringify({ adminId: auth.adminId, note })),
      auth.database.prepare(`INSERT INTO benefit_events (id, customer_id, benefit_type, action, amount, reference_code, metadata_json)
        VALUES (?, ?, 'art_credit', 'admin_granted', ?, ?, ?)`)
        .bind(crypto.randomUUID(), customerId, amount, reference, JSON.stringify({ adminId: auth.adminId, note })),
    ]);
    await recordAdminAudit(auth.database, { adminId: auth.adminId, targetCustomerId: customerId, action, nextValue: String(amount), note });
    return Response.json({ message: `${amount} ${amount === 1 ? "credito assegnato" : "crediti assegnati"} e registrati.` });
  }

  return Response.json({ error: "Azione amministrativa non riconosciuta." }, { status: 400 });
}
