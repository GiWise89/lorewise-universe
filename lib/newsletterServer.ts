// Persistenza e invii per newsletter e avvisi “Avvisami”, con doppio consenso.
// Il token di conferma viene salvato solo come impronta SHA-256; il messaggio di conferma
// passa dalla coda transazionale esistente, così resta visibile e reinviabile dall’amministrazione.

import {
  NEWSLETTER_CONSENT_VERSION,
  createNewsletterToken,
  hashNewsletterToken,
  newsletterTopicLabel,
  newsletterTopics,
  planNewsletterConfirmation,
  planNewsletterSignup,
  type NewsletterTopic,
} from "@/lib/newsletter";
import { queueAndAttemptTransactionalEmail } from "@/lib/transactionalEmail";

type NewsletterRuntimeEnv = {
  RESEND_API_KEY?: string;
  LOREWISE_EMAIL_SENDER_NAME?: string;
  LOREWISE_EMAIL_SENDER_ADDRESS?: string;
  LOREWISE_EMAIL_REPLY_TO?: string;
};

export async function ensureNewsletterTables(database: D1Database) {
  await database.prepare(`CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
    id TEXT PRIMARY KEY NOT NULL, email TEXT NOT NULL, topic TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','confirmed','unsubscribed')),
    confirm_token_hash TEXT, confirm_sent_at TEXT, unsubscribe_token TEXT NOT NULL UNIQUE,
    consent_version TEXT NOT NULL, consent_at TEXT NOT NULL, source TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TEXT, unsubscribed_at TEXT, UNIQUE(email, topic)
  )`).run();
  await database.prepare("CREATE INDEX IF NOT EXISTS newsletter_subscriptions_confirm_idx ON newsletter_subscriptions(confirm_token_hash)").run();
  await database.prepare("CREATE INDEX IF NOT EXISTS newsletter_subscriptions_topic_status_idx ON newsletter_subscriptions(topic, status)").run();
}

/**
 * Crea o rinnova un’iscrizione in attesa e invia il link di conferma.
 * Le iscrizioni già confermate non vengono toccate e non ricevono nuove email.
 */
export async function requestNewsletterSubscription(database: D1Database, runtime: NewsletterRuntimeEnv, input: { email: string; topic: NewsletterTopic; origin: string; source?: string }) {
  await ensureNewsletterTables(database);
  const existing = await database.prepare("SELECT id, status FROM newsletter_subscriptions WHERE email = ? AND topic = ? LIMIT 1")
    .bind(input.email, input.topic).first<{ id: string; status: string }>();
  const plan = planNewsletterSignup(existing?.status);
  if (plan === "noop") return { status: "already_confirmed" as const };

  const token = createNewsletterToken();
  const tokenHash = await hashNewsletterToken(token);
  const now = new Date().toISOString();
  const source = input.source?.slice(0, 80) ?? null;
  let subscriptionId = existing?.id ?? null;
  if (plan === "insert") {
    subscriptionId = crypto.randomUUID();
    await database.prepare(`INSERT OR IGNORE INTO newsletter_subscriptions
      (id, email, topic, status, confirm_token_hash, confirm_sent_at, unsubscribe_token, consent_version, consent_at, source)
      VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?)`)
      .bind(subscriptionId, input.email, input.topic, tokenHash, now, createNewsletterToken(), NEWSLETTER_CONSENT_VERSION, now, source).run();
    const stored = await database.prepare("SELECT id, confirm_token_hash FROM newsletter_subscriptions WHERE email = ? AND topic = ? LIMIT 1")
      .bind(input.email, input.topic).first<{ id: string; confirm_token_hash: string | null }>();
    // Due richieste simultanee: vince la prima, la seconda non invia un link che non funzionerebbe.
    if (!stored || stored.confirm_token_hash !== tokenHash) return { status: "concurrent" as const };
    subscriptionId = stored.id;
  } else {
    await database.prepare(`UPDATE newsletter_subscriptions SET status = 'pending', confirm_token_hash = ?, confirm_sent_at = ?,
      consent_version = ?, consent_at = ?, source = COALESCE(?, source), unsubscribed_at = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND status != 'confirmed'`)
      .bind(tokenHash, now, NEWSLETTER_CONSENT_VERSION, now, source, subscriptionId).run();
  }

  const eventKey = `newsletter-confirm:${subscriptionId}:${tokenHash.slice(0, 16)}`;
  const result = await queueAndAttemptTransactionalEmail(database, runtime, {
    eventKey,
    recipientEmail: input.email,
    template: "newsletter_confirmation",
    payload: { title: newsletterTopicLabel(input.topic), detailUrl: `${input.origin}/newsletter/conferma?token=${encodeURIComponent(token)}` },
  });
  // Dopo l’invio il link non serve più nella coda: resta solo l’impronta nella tabella iscrizioni.
  if (result.status === "sent") {
    await database.prepare("UPDATE transactional_emails SET payload_json = ?, updated_at = CURRENT_TIMESTAMP WHERE event_key = ?")
      .bind(JSON.stringify({ title: newsletterTopicLabel(input.topic) }), eventKey).run();
  } else {
    console.warn(`[newsletter] conferma in coda (${result.status}${"reason" in result && result.reason ? `: ${result.reason}` : ""})`);
  }
  return { status: result.status };
}

export async function confirmNewsletterSubscription(database: D1Database, token: string) {
  await ensureNewsletterTables(database);
  const row = await database.prepare(`SELECT id, topic, status, confirm_sent_at, unsubscribe_token
    FROM newsletter_subscriptions WHERE confirm_token_hash = ? LIMIT 1`)
    .bind(await hashNewsletterToken(token)).first<{ id: string; topic: string; status: string; confirm_sent_at: string | null; unsubscribe_token: string }>();
  const outcome = planNewsletterConfirmation(row);
  if (outcome === "confirm" && row) {
    await database.prepare(`UPDATE newsletter_subscriptions SET status = 'confirmed', confirmed_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'pending'`).bind(row.id).run();
  }
  return { outcome, topic: row?.topic ?? null, unsubscribeToken: outcome === "confirm" || outcome === "already_confirmed" ? row?.unsubscribe_token ?? null : null };
}

export async function findNewsletterUnsubscribe(database: D1Database, token: string) {
  await ensureNewsletterTables(database);
  return database.prepare("SELECT id, topic, status FROM newsletter_subscriptions WHERE unsubscribe_token = ? LIMIT 1")
    .bind(token).first<{ id: string; topic: string; status: string }>();
}

export async function unsubscribeNewsletter(database: D1Database, token: string) {
  const row = await findNewsletterUnsubscribe(database, token);
  if (!row) return null;
  await database.prepare(`UPDATE newsletter_subscriptions SET status = 'unsubscribed', confirm_token_hash = NULL,
    unsubscribed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status != 'unsubscribed'`).bind(row.id).run();
  return row;
}

/** Conteggio in sola lettura degli iscritti confermati, per argomento. */
export async function countConfirmedNewsletterSubscribers(database: D1Database) {
  await ensureNewsletterTables(database);
  const rows = await database.prepare(`SELECT topic, COUNT(*) AS total FROM newsletter_subscriptions
    WHERE status = 'confirmed' GROUP BY topic`).all<{ topic: string; total: number }>();
  const counts = Object.fromEntries(Object.keys(newsletterTopics).map((topic) => [topic, 0])) as Record<string, number>;
  for (const row of rows.results) counts[row.topic] = Number(row.total ?? 0);
  return counts;
}
