import { env } from "@/lib/netlifyRuntime";
import { ensureAdminNotificationsTable, syncAdminNotifications } from "@/lib/adminNotifications";
import { ensureArtCommunityTables } from "@/lib/artCommunityServer";
import { syncLoreWiseCustomer } from "@/lib/supabase/customer";
import { getLoreWiseUser } from "@/lib/supabase/server";

type RuntimeEnv = { DB?: D1Database };
type NotificationRow = { id: string; type: string; title: string; message: string; target_url: string; created_at: string; read_at: string | null };

async function authenticated() {
  const user = await getLoreWiseUser();
  if (!user) return { response: Response.json({ error: "Accedi per vedere le notifiche." }, { status: 401 }) };
  const database = (env as unknown as RuntimeEnv).DB;
  if (!database) return { response: Response.json({ error: "Centro notifiche non disponibile." }, { status: 503 }) };
  await syncLoreWiseCustomer(user);
  await ensureArtCommunityTables(database);
  const customer = await database.prepare("SELECT role, status FROM customers WHERE id = ?").bind(user.id).first<{ role: string; status: string }>();
  if (!customer || customer.status !== "active") return { response: Response.json({ error: "Profilo non attivo." }, { status: 403 }) };
  return { database, user, admin: customer.role === "admin" };
}

export async function GET() {
  try {
    const auth = await authenticated();
    if ("response" in auth) return auth.response;
    const personal = await auth.database.prepare(`SELECT id, type, title, message, target_url, created_at, read_at
      FROM user_notifications WHERE user_id = ? AND dismissed_at IS NULL ORDER BY created_at DESC LIMIT 100`)
      .bind(auth.user.id).all<NotificationRow>();
    let admin: NotificationRow[] = [];
    if (auth.admin) {
      await syncAdminNotifications(auth.database);
      const result = await auth.database.prepare(`SELECT id, category AS type, title, message, target_url,
        source_created_at AS created_at, read_at FROM admin_notifications WHERE dismissed_at IS NULL
        ORDER BY source_created_at DESC LIMIT 100`).all<NotificationRow>();
      admin = result.results;
    }
    const notifications = [
      ...personal.results.map((item) => ({ ...item, scope: "personal" as const })),
      ...admin.map((item) => ({ ...item, scope: "admin" as const })),
    ].sort((left, right) => right.created_at.localeCompare(left.created_at));
    return Response.json({
      notifications: notifications.map((item) => ({ id: item.id, scope: item.scope, type: item.type, title: item.title, message: item.message, targetUrl: item.target_url, createdAt: item.created_at, readAt: item.read_at })),
      unreadCount: notifications.filter((item) => !item.read_at).length,
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return Response.json({ error: "Non è stato possibile caricare le notifiche." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  try {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) return Response.json({ error: "Origine non valida." }, { status: 403 });
    const auth = await authenticated();
    if ("response" in auth) return auth.response;
    const body = await request.json().catch(() => null) as { action?: unknown; id?: unknown; scope?: unknown } | null;
    const action = typeof body?.action === "string" ? body.action : "";
    const id = typeof body?.id === "string" && body.id.length <= 180 ? body.id : "";
    const scope = body?.scope === "admin" ? "admin" : "personal";
    if (scope === "admin" && !auth.admin) return Response.json({ error: "Permesso non valido." }, { status: 403 });
    if (scope === "admin" || (auth.admin && (action === "read_all" || action === "dismiss_read"))) {
      await ensureAdminNotificationsTable(auth.database);
    }
    if (action === "read" && id) {
      if (scope === "admin") await auth.database.prepare("UPDATE admin_notifications SET read_at = COALESCE(read_at, CURRENT_TIMESTAMP) WHERE id = ?").bind(id).run();
      else await auth.database.prepare("UPDATE user_notifications SET read_at = COALESCE(read_at, CURRENT_TIMESTAMP) WHERE id = ? AND user_id = ?").bind(id, auth.user.id).run();
    } else if (action === "read_all") {
      await auth.database.prepare("UPDATE user_notifications SET read_at = COALESCE(read_at, CURRENT_TIMESTAMP) WHERE user_id = ? AND dismissed_at IS NULL").bind(auth.user.id).run();
      if (auth.admin) await auth.database.prepare("UPDATE admin_notifications SET read_at = COALESCE(read_at, CURRENT_TIMESTAMP) WHERE dismissed_at IS NULL").run();
    } else if (action === "dismiss" && id) {
      if (scope === "admin") await auth.database.prepare("UPDATE admin_notifications SET read_at = COALESCE(read_at, CURRENT_TIMESTAMP), dismissed_at = COALESCE(dismissed_at, CURRENT_TIMESTAMP) WHERE id = ?").bind(id).run();
      else await auth.database.prepare("UPDATE user_notifications SET read_at = COALESCE(read_at, CURRENT_TIMESTAMP), dismissed_at = COALESCE(dismissed_at, CURRENT_TIMESTAMP) WHERE id = ? AND user_id = ?").bind(id, auth.user.id).run();
    } else if (action === "dismiss_read") {
      await auth.database.prepare("UPDATE user_notifications SET dismissed_at = COALESCE(dismissed_at, CURRENT_TIMESTAMP) WHERE user_id = ? AND read_at IS NOT NULL").bind(auth.user.id).run();
      if (auth.admin) await auth.database.prepare("UPDATE admin_notifications SET dismissed_at = COALESCE(dismissed_at, CURRENT_TIMESTAMP) WHERE read_at IS NOT NULL").run();
    } else return Response.json({ error: "Azione non valida." }, { status: 400 });
    return Response.json({ message: "Notifiche aggiornate." }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return Response.json({ error: "Aggiornamento delle notifiche non riuscito." }, { status: 503 });
  }
}
