import { ensureAdminAuditTable } from "@/lib/adminAudit";
import { syncAdminNotifications } from "@/lib/adminNotifications";
import { ensureArtCommunityTables } from "@/lib/artCommunityServer";
import { ensureBenefitEngineTables } from "@/lib/benefitEngine";
import { requireOrderAdmin } from "@/lib/orderAdminAuth";
import { ensureTransactionalEmailTable } from "@/lib/transactionalEmail";
import { ensureSupportTicketTables } from "@/lib/supportTickets";
import { getSiteAnalyticsSummary } from "@/lib/siteAnalytics";

async function existingTables(database: D1Database) {
  const result = await database.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all<{ name: string }>();
  return new Set(result.results.map((row) => row.name));
}

async function count(database: D1Database, table: string, where = "") {
  const row = await database.prepare(`SELECT COUNT(*) AS total FROM ${table}${where}`).first<{ total: number }>();
  return Number(row?.total ?? 0);
}

export async function GET() {
  const auth = await requireOrderAdmin();
  if ("response" in auth) return auth.response;
  await ensureBenefitEngineTables(auth.database);
  await ensureArtCommunityTables(auth.database);
  await ensureAdminAuditTable(auth.database);
  await ensureTransactionalEmailTable(auth.database);
  await ensureSupportTicketTables(auth.database);
  await syncAdminNotifications(auth.database);
  const tables = await existingTables(auth.database);
  const has = (name: string) => tables.has(name);
  const [users, activeUsers, subscriptions, pendingOrders, support, commissions, reports, deliveriesArt, deliveriesGame, pendingEmails, unreadNotifications, analytics] = await Promise.all([
    count(auth.database, "customers"),
    count(auth.database, "customers", " WHERE status = 'active'"),
    count(auth.database, "subscriptions", " WHERE status IN ('active', 'trialing')"),
    count(auth.database, "orders", " WHERE status IN ('pending', 'payment_issue', 'refund_pending')"),
    (has("order_support_requests") ? await count(auth.database, "order_support_requests", " WHERE status IN ('open', 'reviewing', 'approved')") : 0) + await count(auth.database, "support_tickets", " WHERE status IN ('open', 'reviewing', 'waiting_user')"),
    has("commission_requests") ? count(auth.database, "commission_requests", " WHERE status IN ('new', 'reviewing', 'quoted', 'accepted', 'in_progress', 'awaiting_balance')") : 0,
    has("artwork_comment_reports") ? count(auth.database, "artwork_comment_reports", " WHERE status = 'open'") : 0,
    has("artwork_delivery_files") ? count(auth.database, "artwork_delivery_files", " WHERE status != 'approved'") : 0,
    has("game_delivery_files") ? count(auth.database, "game_delivery_files", " WHERE status != 'approved'") : 0,
    count(auth.database, "transactional_emails", " WHERE status IN ('queued', 'failed')"),
    count(auth.database, "admin_notifications", " WHERE read_at IS NULL AND dismissed_at IS NULL"),
    getSiteAnalyticsSummary(auth.database),
  ]);
  const notifications = await auth.database.prepare(`SELECT id, category, severity, title, message, reference_code,
    target_url, source_created_at, read_at FROM admin_notifications WHERE dismissed_at IS NULL
    ORDER BY CASE severity WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
    source_created_at DESC LIMIT 12`).all<Record<string, unknown>>();
  const audit = await auth.database.prepare(`SELECT admin_audit_events.action, admin_audit_events.note,
      admin_audit_events.created_at, actor.email AS admin_email, target.email AS target_email
    FROM admin_audit_events
    LEFT JOIN customers actor ON actor.id = admin_audit_events.admin_id
    LEFT JOIN customers target ON target.id = admin_audit_events.target_customer_id
    ORDER BY admin_audit_events.created_at DESC LIMIT 12`).all<Record<string, unknown>>();
  return Response.json({
    identity: { email: auth.adminEmail },
    analytics,
    summary: { users, activeUsers, subscriptions, pendingOrders, support, commissions, reports, deliveries: deliveriesArt + deliveriesGame, pendingEmails, unreadNotifications },
    notifications: notifications.results.map((row) => ({ id: row.id, category: row.category, severity: row.severity,
      title: row.title, message: row.message, referenceCode: row.reference_code, targetUrl: row.target_url,
      createdAt: row.source_created_at, readAt: row.read_at })),
    recentActions: audit.results.map((row) => ({ action: row.action, note: row.note, createdAt: row.created_at, adminEmail: row.admin_email, targetEmail: row.target_email })),
  }, { headers: { "Cache-Control": "private, no-store" } });
}
