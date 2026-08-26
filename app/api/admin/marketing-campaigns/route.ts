import { env } from "@/lib/netlifyRuntime";
import { deliverMarketingEmail, ensureMarketingTables, queueMarketingCampaign, sendMarketingTest } from "@/lib/marketingEmail";
import { requireOrderAdmin } from "@/lib/orderAdminAuth";

type RuntimeEnv = { DB?: D1Database; RESEND_API_KEY?: string; LOREWISE_EMAIL_SENDER_NAME?: string; LOREWISE_EMAIL_SENDER_ADDRESS?: string; LOREWISE_EMAIL_REPLY_TO?: string; URL?: string };
type CampaignInput = { id?: unknown; action?: unknown; subject?: unknown; heading?: unknown; body?: unknown; actionLabel?: unknown; actionUrl?: unknown };

function clean(value: unknown, maximum: number) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

function campaignCopy(body: CampaignInput) {
  const subject = clean(body.subject, 140);
  const heading = clean(body.heading, 180);
  const text = clean(body.body, 4000);
  const actionLabel = clean(body.actionLabel, 70);
  const actionUrl = clean(body.actionUrl, 500);
  if (!subject || !heading || !text) throw new Error("Oggetto, titolo e messaggio sono obbligatori.");
  if (actionUrl && !actionUrl.startsWith("/") && !/^https:\/\//i.test(actionUrl)) throw new Error("Il percorso del pulsante deve iniziare con / oppure https://.");
  if (Boolean(actionLabel) !== Boolean(actionUrl)) throw new Error("Testo e percorso del pulsante vanno compilati insieme.");
  return { subject, heading, body: text, actionLabel: actionLabel || null, actionUrl: actionUrl || null };
}

export async function GET() {
  const auth = await requireOrderAdmin();
  if ("response" in auth) return auth.response;
  await ensureMarketingTables(auth.database);
  const campaigns = await auth.database.prepare(`SELECT marketing_campaigns.*,
    SUM(CASE WHEN marketing_deliveries.status = 'sent' THEN 1 ELSE 0 END) AS sent_count,
    SUM(CASE WHEN marketing_deliveries.status IN ('queued','failed') THEN 1 ELSE 0 END) AS pending_count,
    SUM(CASE WHEN marketing_deliveries.status = 'revoked' THEN 1 ELSE 0 END) AS revoked_count
    FROM marketing_campaigns LEFT JOIN marketing_deliveries ON marketing_deliveries.campaign_id = marketing_campaigns.id
    GROUP BY marketing_campaigns.id ORDER BY marketing_campaigns.created_at DESC LIMIT 100`).all<Record<string, string | number | null>>();
  const audience = await auth.database.prepare(`SELECT COUNT(*) AS total FROM customers WHERE status = 'active' AND studio_updates_emails = 1`).first<{ total: number }>();
  const consent = await auth.database.prepare(`SELECT COUNT(*) AS total FROM marketing_consent_events`).first<{ total: number }>();
  const runtime = env as unknown as RuntimeEnv;
  return Response.json({
    configured: /^re_[A-Za-z0-9_\-]{16,}$/.test(runtime.RESEND_API_KEY?.trim() ?? ""),
    audienceCount: Number(audience?.total ?? 0), consentEvents: Number(consent?.total ?? 0), adminEmail: auth.adminEmail,
    campaigns: campaigns.results.map((row) => ({ id: row.id, code: row.code, subject: row.subject, heading: row.heading, body: row.body,
      actionLabel: row.action_label, actionUrl: row.action_url, status: row.status, recipientCount: Number(row.recipient_count ?? 0),
      sentCount: Number(row.sent_count ?? 0), pendingCount: Number(row.pending_count ?? 0), revokedCount: Number(row.revoked_count ?? 0),
      createdAt: row.created_at, updatedAt: row.updated_at })),
  }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return Response.json({ error: "Origine della richiesta non valida." }, { status: 403 });
  const auth = await requireOrderAdmin();
  if ("response" in auth) return auth.response;
  await ensureMarketingTables(auth.database);
  const body = await request.json().catch(() => null) as CampaignInput | null;
  if (!body) return Response.json({ error: "Richiesta non valida." }, { status: 400 });
  const id = typeof body.id === "string" && /^[0-9a-f-]{36}$/i.test(body.id) ? body.id : null;
  try {
    if (body.action === "save") {
      const copy = campaignCopy(body);
      if (id) {
        const result = await auth.database.prepare(`UPDATE marketing_campaigns SET subject = ?, heading = ?, body = ?, action_label = ?, action_url = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND status = 'draft'`).bind(copy.subject, copy.heading, copy.body, copy.actionLabel, copy.actionUrl, id).run();
        if (!Number(result.meta.changes ?? 0)) return Response.json({ error: "Solo una bozza può essere modificata." }, { status: 409 });
        return Response.json({ id, message: "Bozza aggiornata." });
      }
      const campaignId = crypto.randomUUID();
      const code = `GW-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${campaignId.slice(0, 6).toUpperCase()}`;
      await auth.database.prepare(`INSERT INTO marketing_campaigns (id, code, subject, heading, body, action_label, action_url, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).bind(campaignId, code, copy.subject, copy.heading, copy.body, copy.actionLabel, copy.actionUrl, auth.adminId).run();
      return Response.json({ id: campaignId, message: "Bozza creata." });
    }
    if (!id) return Response.json({ error: "Campagna non valida." }, { status: 400 });
    if (body.action === "queue") {
      const recipients = await queueMarketingCampaign(auth.database, id);
      return Response.json({ message: `Campagna messa in coda per ${recipients} iscritti.`, recipients });
    }
    if (body.action === "send_test") {
      const copy = await auth.database.prepare("SELECT subject, heading, body, action_label, action_url FROM marketing_campaigns WHERE id = ? LIMIT 1").bind(id).first<Record<string, string | null>>();
      if (!copy) return Response.json({ error: "Campagna non trovata." }, { status: 404 });
      const result = await sendMarketingTest(env as unknown as RuntimeEnv, auth.adminEmail, { subject: copy.subject!, heading: copy.heading!, body: copy.body!, actionLabel: copy.action_label, actionUrl: copy.action_url });
      return Response.json({ message: result.status === "sent" ? `Prova inviata a ${auth.adminEmail}.` : "Prova pronta, ma Resend non è ancora configurato.", result });
    }
    if (body.action === "send_pending") {
      const deliveries = await auth.database.prepare("SELECT id FROM marketing_deliveries WHERE campaign_id = ? AND status IN ('queued','failed') ORDER BY created_at ASC LIMIT 25").bind(id).all<{ id: string }>();
      const results = [];
      for (const delivery of deliveries.results) results.push(await deliverMarketingEmail(auth.database, env as unknown as RuntimeEnv, delivery.id));
      const remaining = await auth.database.prepare("SELECT COUNT(*) AS total FROM marketing_deliveries WHERE campaign_id = ? AND status IN ('queued','failed')").bind(id).first<{ total: number }>();
      if (!Number(remaining?.total ?? 0) && deliveries.results.length) await auth.database.prepare("UPDATE marketing_campaigns SET status = 'sent', sent_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(id).run();
      return Response.json({ message: `${deliveries.results.length} destinatari elaborati.`, processed: deliveries.results.length, remaining: Number(remaining?.total ?? 0), results });
    }
    if (body.action === "archive") {
      const result = await auth.database.prepare("UPDATE marketing_campaigns SET status = 'archived', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'draft'").bind(id).run();
      return Number(result.meta.changes ?? 0) ? Response.json({ message: "Bozza archiviata." }) : Response.json({ error: "Solo una bozza può essere archiviata." }, { status: 409 });
    }
    return Response.json({ error: "Azione non valida." }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Operazione non riuscita." }, { status: 400 });
  }
}
