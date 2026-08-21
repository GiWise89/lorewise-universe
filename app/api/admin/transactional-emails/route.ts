import { env } from "@/lib/netlifyRuntime";

import { requireOrderAdmin } from "@/lib/orderAdminAuth";
import { backfillTransactionalEmailOutbox, deliverTransactionalEmail, ensureTransactionalEmailTable } from "@/lib/transactionalEmail";

type RuntimeEnv = { DB?: D1Database; RESEND_API_KEY?: string; LOREWISE_EMAIL_SENDER_NAME?: string; LOREWISE_EMAIL_SENDER_ADDRESS?: string; LOREWISE_EMAIL_REPLY_TO?: string };

async function runtimeEnv() {
  return env as unknown as RuntimeEnv;
}

export async function GET() {
  const auth = await requireOrderAdmin();
  if ("response" in auth) return auth.response;
  await ensureTransactionalEmailTable(auth.database);
  await backfillTransactionalEmailOutbox(auth.database);
  const runtime = await runtimeEnv();
  const rows = await auth.database.prepare(`SELECT id, event_key, recipient_email, template, subject, status,
    provider_message_id, attempts, last_error, sent_at, created_at, updated_at
    FROM transactional_emails ORDER BY created_at DESC LIMIT 200`).all<Record<string, string | number | null>>();
  const summary = await auth.database.prepare(`SELECT COUNT(*) AS total,
    SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) AS sent,
    SUM(CASE WHEN status = 'queued' THEN 1 ELSE 0 END) AS queued,
    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed,
    SUM(CASE WHEN status = 'archived' THEN 1 ELSE 0 END) AS archived FROM transactional_emails`).first<Record<string, number>>();
  return Response.json({
    configured: /^re_[A-Za-z0-9_\-]{16,}$/.test(runtime.RESEND_API_KEY?.trim() ?? ""),
    sender: runtime.LOREWISE_EMAIL_SENDER_ADDRESS?.trim() || "account@auth.lorewisenexus.it",
    summary: { total: Number(summary?.total ?? 0), sent: Number(summary?.sent ?? 0), queued: Number(summary?.queued ?? 0), failed: Number(summary?.failed ?? 0), archived: Number(summary?.archived ?? 0) },
    emails: rows.results.map((row) => ({
      id: row.id, eventKey: row.event_key, recipientEmail: row.recipient_email, template: row.template,
      subject: row.subject, status: row.status, providerMessageId: row.provider_message_id,
      attempts: Number(row.attempts ?? 0), lastError: row.last_error, sentAt: row.sent_at,
      createdAt: row.created_at, updatedAt: row.updated_at,
    })),
  }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin");
  if (origin && origin !== requestUrl.origin) return Response.json({ error: "Origine della richiesta non valida." }, { status: 403 });
  const auth = await requireOrderAdmin();
  if ("response" in auth) return auth.response;
  const runtime = await runtimeEnv();
  await ensureTransactionalEmailTable(auth.database);
  const body = await request.json().catch(() => null) as { id?: unknown; action?: unknown } | null;
  let ids: string[] = [];
  const validId = typeof body?.id === "string" && /^[A-Za-z0-9-]{20,80}$/.test(body.id);
  if (validId && body?.action === "archive") {
    const result = await auth.database.prepare(`UPDATE transactional_emails
      SET status = 'archived', last_error = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND status IN ('queued', 'failed')`).bind(body.id).run();
    return Response.json({ processed: Number(result.meta.changes ?? 0), archived: true });
  }
  if (validId) ids = [body.id as string];
  else if (body?.action === "retry_pending") {
    const result = await auth.database.prepare("SELECT id FROM transactional_emails WHERE status IN ('queued', 'failed') ORDER BY created_at ASC LIMIT 25").all<{ id: string }>();
    ids = result.results.map((row) => row.id);
  } else return Response.json({ error: "Richiesta di invio non valida." }, { status: 400 });
  const results = [];
  for (const id of ids) results.push(await deliverTransactionalEmail(auth.database, runtime, id));
  return Response.json({ processed: ids.length, results });
}
