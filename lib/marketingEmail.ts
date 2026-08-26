export const MARKETING_POLICY_VERSION = "studio-updates-2026-08-25";

type MarketingRuntimeEnv = {
  RESEND_API_KEY?: string;
  LOREWISE_EMAIL_SENDER_NAME?: string;
  LOREWISE_EMAIL_SENDER_ADDRESS?: string;
  LOREWISE_EMAIL_REPLY_TO?: string;
  URL?: string;
};

export type MarketingCampaignCopy = {
  subject: string;
  heading: string;
  body: string;
  actionLabel?: string | null;
  actionUrl?: string | null;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] ?? character);
}

function paragraphs(value: string) {
  return value.split(/\n{2,}/).map((paragraph) => `<p style="font-size:17px;line-height:1.7;color:#4a3652">${escapeHtml(paragraph.trim()).replace(/\n/g, "<br>")}</p>`).join("");
}

function publicOrigin(runtime?: MarketingRuntimeEnv) {
  const candidate = runtime?.URL?.trim();
  return candidate && /^https?:\/\//.test(candidate) ? candidate.replace(/\/$/, "") : "https://lorewisenexus.it";
}

function absoluteActionUrl(copy: MarketingCampaignCopy, runtime?: MarketingRuntimeEnv): MarketingCampaignCopy {
  return copy.actionUrl?.startsWith("/") ? { ...copy, actionUrl: `${publicOrigin(runtime)}${copy.actionUrl}` } : copy;
}

export function renderMarketingEmail(copy: MarketingCampaignCopy, unsubscribeUrl: string) {
  const action = copy.actionLabel?.trim() && copy.actionUrl?.trim()
    ? `<p style="margin:30px 0"><a href="${escapeHtml(copy.actionUrl.trim())}" style="display:inline-block;background:#dc2579;color:#fff;text-decoration:none;font-weight:700;padding:15px 22px">${escapeHtml(copy.actionLabel.trim())}</a></p>`
    : "";
  const html = `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(copy.subject)}</title></head><body style="margin:0;background:#efe7f5;color:#241031;font-family:Arial,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:32px 16px"><table role="presentation" width="620" cellspacing="0" cellpadding="0" style="max-width:620px;background:#fffaf4;border-top:5px solid #dc2579"><tr><td style="padding:38px 42px"><p style="margin:0 0 24px;color:#7c35ec;font-weight:700;letter-spacing:2px;text-transform:uppercase">LoreWise Universe · GiWise Studio</p><h1 style="margin:14px 0;color:#17295e;font-family:Georgia,serif;font-size:38px;line-height:1.05">${escapeHtml(copy.heading)}</h1>${paragraphs(copy.body)}${action}<p style="margin:32px 0 0;padding-top:22px;border-top:1px solid #ddcfdb;font-size:13px;line-height:1.6;color:#725f76">Ricevi questa email perché hai scelto “Novità di GiWise Studio”. Puoi <a href="${escapeHtml(unsubscribeUrl)}" style="color:#7c35ec">disattivare queste comunicazioni</a> in qualsiasi momento. Le ricevute e i messaggi necessari al tuo account restano separati.</p></td></tr></table></td></tr></table></body></html>`;
  return { subject: copy.subject.trim(), html };
}

export async function ensureMarketingTables(database: D1Database) {
  await database.prepare(`CREATE TABLE IF NOT EXISTS marketing_consent_events (
    id TEXT PRIMARY KEY NOT NULL, event_key TEXT UNIQUE, customer_id TEXT NOT NULL,
    channel TEXT NOT NULL, action TEXT NOT NULL, source TEXT NOT NULL, policy_version TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
  )`).run();
  await database.prepare("CREATE INDEX IF NOT EXISTS marketing_consent_customer_idx ON marketing_consent_events(customer_id, channel, created_at)").run();
  await database.prepare(`CREATE TABLE IF NOT EXISTS marketing_campaigns (
    id TEXT PRIMARY KEY NOT NULL, code TEXT NOT NULL UNIQUE, audience TEXT NOT NULL DEFAULT 'studio_updates',
    subject TEXT NOT NULL, heading TEXT NOT NULL, body TEXT NOT NULL, action_label TEXT, action_url TEXT,
    status TEXT NOT NULL DEFAULT 'draft', created_by TEXT, recipient_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    queued_at TEXT, sent_at TEXT, FOREIGN KEY (created_by) REFERENCES customers(id) ON DELETE SET NULL
  )`).run();
  await database.prepare("CREATE INDEX IF NOT EXISTS marketing_campaigns_status_idx ON marketing_campaigns(status, created_at)").run();
  await database.prepare(`CREATE TABLE IF NOT EXISTS marketing_deliveries (
    id TEXT PRIMARY KEY NOT NULL, campaign_id TEXT NOT NULL, customer_id TEXT, recipient_email TEXT NOT NULL,
    unsubscribe_token TEXT NOT NULL UNIQUE, status TEXT NOT NULL DEFAULT 'queued', provider_message_id TEXT,
    attempts INTEGER NOT NULL DEFAULT 0, last_error TEXT, sent_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
  )`).run();
  await database.prepare("CREATE UNIQUE INDEX IF NOT EXISTS marketing_delivery_recipient_unique ON marketing_deliveries(campaign_id, customer_id)").run();
  await database.prepare("CREATE INDEX IF NOT EXISTS marketing_deliveries_status_idx ON marketing_deliveries(status, created_at)").run();
}

export async function recordMarketingConsent(database: D1Database, input: { customerId: string; channel: "studio_updates" | "community"; granted: boolean; source: "registration" | "account" | "unsubscribe" | "account_deletion"; eventKey?: string }) {
  await ensureMarketingTables(database);
  const statement = input.eventKey ? "INSERT OR IGNORE" : "INSERT";
  await database.prepare(`${statement} INTO marketing_consent_events (id, event_key, customer_id, channel, action, source, policy_version)
    VALUES (?, ?, ?, ?, ?, ?, ?)`).bind(crypto.randomUUID(), input.eventKey ?? null, input.customerId, input.channel,
      input.granted ? "granted" : "revoked", input.source, MARKETING_POLICY_VERSION).run();
}

export async function queueMarketingCampaign(database: D1Database, campaignId: string) {
  await ensureMarketingTables(database);
  const campaign = await database.prepare("SELECT id, status FROM marketing_campaigns WHERE id = ? LIMIT 1").bind(campaignId).first<{ id: string; status: string }>();
  if (!campaign || campaign.status !== "draft") throw new Error("Solo una bozza può essere messa in coda.");
  const recipients = await database.prepare(`SELECT id, email FROM customers
    WHERE status = 'active' AND studio_updates_emails = 1 ORDER BY created_at ASC`).all<{ id: string; email: string }>();
  for (const recipient of recipients.results) {
    await database.prepare(`INSERT OR IGNORE INTO marketing_deliveries
      (id, campaign_id, customer_id, recipient_email, unsubscribe_token, status)
      VALUES (?, ?, ?, ?, ?, 'queued')`).bind(crypto.randomUUID(), campaignId, recipient.id, recipient.email.toLowerCase(), crypto.randomUUID()).run();
  }
  const count = await database.prepare("SELECT COUNT(*) AS total FROM marketing_deliveries WHERE campaign_id = ?").bind(campaignId).first<{ total: number }>();
  await database.prepare("UPDATE marketing_campaigns SET status = 'queued', recipient_count = ?, queued_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
    .bind(Number(count?.total ?? 0), campaignId).run();
  return Number(count?.total ?? 0);
}

async function sendWithResend(runtime: MarketingRuntimeEnv, input: { to: string; subject: string; html: string; idempotencyKey: string }) {
  const apiKey = runtime.RESEND_API_KEY?.trim() ?? "";
  if (!/^re_[A-Za-z0-9_\-]{16,}$/.test(apiKey)) return { status: "queued" as const, reason: "provider_not_configured" };
  const senderName = runtime.LOREWISE_EMAIL_SENDER_NAME?.trim() || "LoreWise Universe";
  const senderAddress = runtime.LOREWISE_EMAIL_SENDER_ADDRESS?.trim() || "novita@auth.lorewisenexus.it";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": input.idempotencyKey },
    body: JSON.stringify({ from: `${senderName} <${senderAddress}>`, to: [input.to], reply_to: runtime.LOREWISE_EMAIL_REPLY_TO?.trim() || "lorewise.archive@gmail.com", subject: input.subject, html: input.html }),
    signal: AbortSignal.timeout(12_000),
  });
  const result = await response.json().catch(() => ({})) as { id?: string; message?: string };
  if (!response.ok || !result.id) throw new Error(result.message || `Resend HTTP ${response.status}`);
  return { status: "sent" as const, providerMessageId: result.id };
}

export async function deliverMarketingEmail(database: D1Database, runtime: MarketingRuntimeEnv, deliveryId: string) {
  await ensureMarketingTables(database);
  const row = await database.prepare(`SELECT marketing_deliveries.id, marketing_deliveries.customer_id, marketing_deliveries.recipient_email,
    marketing_deliveries.unsubscribe_token, marketing_deliveries.status, marketing_campaigns.subject, marketing_campaigns.heading,
    marketing_campaigns.body, marketing_campaigns.action_label, marketing_campaigns.action_url
    FROM marketing_deliveries JOIN marketing_campaigns ON marketing_campaigns.id = marketing_deliveries.campaign_id
    WHERE marketing_deliveries.id = ? LIMIT 1`).bind(deliveryId).first<Record<string, string | null>>();
  if (!row || row.status === "sent") return { status: row?.status ?? "missing" };
  const consent = row.customer_id ? await database.prepare("SELECT studio_updates_emails, status FROM customers WHERE id = ?").bind(row.customer_id).first<{ studio_updates_emails: number; status: string }>() : null;
  if (!consent || !consent.studio_updates_emails || consent.status !== "active") {
    await database.prepare("UPDATE marketing_deliveries SET status = 'revoked', last_error = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(deliveryId).run();
    return { status: "revoked" };
  }
  const origin = publicOrigin(runtime);
  const rendered = renderMarketingEmail(absoluteActionUrl({ subject: row.subject!, heading: row.heading!, body: row.body!, actionLabel: row.action_label, actionUrl: row.action_url }, runtime), `${origin}/email-preferences/unsubscribe?token=${encodeURIComponent(row.unsubscribe_token!)}`);
  try {
    const result = await sendWithResend(runtime, { to: row.recipient_email!, subject: rendered.subject, html: rendered.html, idempotencyKey: `lorewise-marketing-${deliveryId}` });
    if (result.status === "queued") return result;
    await database.prepare("UPDATE marketing_deliveries SET status = 'sent', provider_message_id = ?, attempts = attempts + 1, last_error = NULL, sent_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .bind(result.providerMessageId, deliveryId).run();
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 500) : "Invio non riuscito";
    await database.prepare("UPDATE marketing_deliveries SET status = 'failed', attempts = attempts + 1, last_error = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(message, deliveryId).run();
    return { status: "failed", reason: message };
  }
}

export async function sendMarketingTest(runtime: MarketingRuntimeEnv, recipient: string, copy: MarketingCampaignCopy) {
  const rendered = renderMarketingEmail(absoluteActionUrl(copy, runtime), `${publicOrigin(runtime)}/account#comunicazioni`);
  return sendWithResend(runtime, { to: recipient.toLowerCase(), subject: `[PROVA] ${rendered.subject}`, html: rendered.html, idempotencyKey: `lorewise-marketing-test-${crypto.randomUUID()}` });
}
