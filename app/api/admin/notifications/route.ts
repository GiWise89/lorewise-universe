import { ensureAdminNotificationsTable, syncAdminNotifications } from "@/lib/adminNotifications";
import { requireOrderAdmin } from "@/lib/orderAdminAuth";

export async function GET() {
  const auth = await requireOrderAdmin();
  if ("response" in auth) return auth.response;
  await syncAdminNotifications(auth.database);
  const result = await auth.database.prepare(`SELECT id, category, severity, title, message, reference_code,
    target_url, source_created_at, read_at FROM admin_notifications
    ORDER BY CASE severity WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
    source_created_at DESC LIMIT 100`).all<Record<string, string | null>>();
  return Response.json({ notifications: result.results }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function PATCH(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin");
  if (origin && origin !== requestUrl.origin) return Response.json({ error: "Origine della richiesta non valida." }, { status: 403 });
  const auth = await requireOrderAdmin();
  if ("response" in auth) return auth.response;
  const body = await request.json().catch(() => null) as { action?: unknown; id?: unknown } | null;
  await ensureAdminNotificationsTable(auth.database);
  if (body?.action === "read" && typeof body.id === "string" && body.id.length <= 160) {
    await auth.database.prepare("UPDATE admin_notifications SET read_at = COALESCE(read_at, CURRENT_TIMESTAMP) WHERE id = ?")
      .bind(body.id).run();
  } else if (body?.action === "read_all") {
    await auth.database.prepare("UPDATE admin_notifications SET read_at = COALESCE(read_at, CURRENT_TIMESTAMP) WHERE read_at IS NULL").run();
  } else {
    return Response.json({ error: "Azione non valida." }, { status: 400 });
  }
  return Response.json({ message: "Notifica aggiornata." });
}
