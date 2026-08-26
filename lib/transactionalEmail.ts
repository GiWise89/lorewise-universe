type EmailRuntimeEnv = {
  RESEND_API_KEY?: string;
  LOREWISE_EMAIL_SENDER_NAME?: string;
  LOREWISE_EMAIL_SENDER_ADDRESS?: string;
  LOREWISE_EMAIL_REPLY_TO?: string;
};

export type TransactionalTemplate =
  | "order_paid" | "order_refunded" | "payment_disputed"
  | "subscription_activated" | "subscription_renewed" | "subscription_payment_failed"
  | "commission_received" | "commission_quote" | "commission_payment";

export type TransactionalEmailPayload = {
  name?: string; referenceCode?: string; title?: string; amountLabel?: string;
  phaseLabel?: string; planLabel?: string; periodLabel?: string;
  deliveryMode?: string;
  collectionSize?: number;
  accountUrl?: string; detailUrl?: string;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] ?? character);
}

function templateCopy(template: TransactionalTemplate, payload: TransactionalEmailPayload) {
  const reference = payload.referenceCode || "LoreWise Universe";
  const title = payload.title || reference;
  const amount = payload.amountLabel ? ` Importo: ${payload.amountLabel}.` : "";
  const copies: Record<TransactionalTemplate, { subject: string; heading: string; body: string; action: string }> = {
    order_paid: payload.deliveryMode === "manual"
      ? { subject: `Acquisto confermato · ${reference}`, heading: "Il tuo acquisto è registrato.", body: `${title} è stato collegato al tuo LoreWise ID.${amount} GiWise Studio verificherà l'ordine e invierà la consegna privata all'indirizzo email associato al profilo.`, action: "Segui ordine e consegna" }
      : payload.collectionSize && payload.collectionSize > 1
        ? { subject: `Collezione confermata · ${reference}`, heading: "Le tue opere sono nella Libreria.", body: `${title} è stata collegata al tuo LoreWise ID.${amount} Troverai ${payload.collectionSize} pacchetti protetti, una licenza personale per ogni opera e il riepilogo dell’ordine nella tua Area personale.`, action: "Apri i download della collezione" }
        : { subject: `Acquisto confermato · ${reference}`, heading: "Il tuo acquisto è nella Libreria.", body: `${title} è stato collegato al tuo LoreWise ID.${amount} Il file non parte automaticamente: resta protetto nella tua Area personale.`, action: "Apri Libreria e ordine" },
    order_refunded: { subject: `Rimborso confermato · ${reference}`, heading: "Il rimborso è stato registrato.", body: `L’ordine ${reference} risulta rimborsato. I diritti digitali collegati sono stati revocati secondo le condizioni accettate.`, action: "Apri il riepilogo" },
    payment_disputed: { subject: `Verifica necessaria · ${reference}`, heading: "Il pagamento richiede attenzione.", body: `Stripe ha segnalato una contestazione per ${reference}. I diritti collegati restano sospesi durante la verifica.`, action: "Apri assistenza ordine" },
    subscription_activated: { subject: `Universe Pass attivo · ${reference}`, heading: "Il tuo Universe Pass è attivo.", body: `${payload.planLabel || title} è ora collegato al LoreWise ID. Crediti, sconti e accessi compaiono automaticamente nell’Area personale.`, action: "Apri i miei vantaggi" },
    subscription_renewed: { subject: `Universe Pass rinnovato · ${reference}`, heading: "Rinnovo mensile confermato.", body: `${payload.planLabel || title} è stato rinnovato.${amount}${payload.periodLabel ? ` Periodo: ${payload.periodLabel}.` : ""}`, action: "Controlla piano e crediti" },
    subscription_payment_failed: { subject: "Pagamento Universe Pass non riuscito", heading: "Il rinnovo non è stato confermato.", body: `Il pagamento mensile di ${payload.planLabel || title} non è riuscito. Verifica lo stato nell’Area personale prima che i vantaggi vengano sospesi.`, action: "Controlla l’abbonamento" },
    commission_received: { subject: `Richiesta ricevuta · ${reference}`, heading: "La tua richiesta è arrivata.", body: `GiWise Studio ha ricevuto ${title}. Il codice ${reference} permette di seguire preventivo, decisioni e pagamenti.`, action: "Segui la richiesta" },
    commission_quote: { subject: `Preventivo disponibile · ${reference}`, heading: "Il preventivo è pronto.", body: `Il preventivo per ${title} è disponibile.${amount} Apri la pratica per leggere il riepilogo e accettare le condizioni.`, action: "Apri il preventivo" },
    commission_payment: { subject: `${payload.phaseLabel || "Pagamento"} confermato · ${reference}`, heading: `${payload.phaseLabel || "Pagamento"} registrato.`, body: `Il pagamento per ${title} è stato collegato alla commissione ${reference}.${amount} Lo stato del progetto è già aggiornato.`, action: "Segui il progetto" },
  };
  return copies[template];
}

export function renderTransactionalEmail(template: TransactionalTemplate, payload: TransactionalEmailPayload) {
  const copy = templateCopy(template, payload);
  const actionUrl = payload.detailUrl || payload.accountUrl || "https://lorewisenexus.it/account";
  const greeting = payload.name ? `Ciao ${escapeHtml(payload.name)},` : "Ciao,";
  const html = `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(copy.subject)}</title></head><body style="margin:0;background:#efe7f5;color:#241031;font-family:Arial,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:32px 16px"><table role="presentation" width="620" cellspacing="0" cellpadding="0" style="max-width:620px;background:#fffaf4;border-top:5px solid #dc2579"><tr><td style="padding:38px 42px"><p style="margin:0 0 24px;color:#7c35ec;font-weight:700;letter-spacing:2px;text-transform:uppercase">LoreWise Universe · GiWise Studio</p><p style="font-size:17px">${greeting}</p><h1 style="margin:14px 0;color:#17295e;font-family:Georgia,serif;font-size:38px;line-height:1.05">${escapeHtml(copy.heading)}</h1><p style="font-size:17px;line-height:1.7;color:#4a3652">${escapeHtml(copy.body)}</p><p style="margin:30px 0"><a href="${escapeHtml(actionUrl)}" style="display:inline-block;background:#dc2579;color:#fff;text-decoration:none;font-weight:700;padding:15px 22px">${escapeHtml(copy.action)}</a></p><p style="margin:32px 0 0;padding-top:22px;border-top:1px solid #ddcfdb;font-size:13px;line-height:1.6;color:#725f76">Messaggio transazionale collegato al tuo LoreWise ID. Non rispondere con dati di pagamento. Per assistenza: lorewise.archive@gmail.com.</p></td></tr></table></td></tr></table></body></html>`;
  return { subject: copy.subject, html };
}

export async function ensureTransactionalEmailTable(database: D1Database) {
  await database.prepare(`CREATE TABLE IF NOT EXISTS transactional_emails (
    id TEXT PRIMARY KEY NOT NULL, event_key TEXT NOT NULL UNIQUE, customer_id TEXT,
    recipient_email TEXT NOT NULL, template TEXT NOT NULL, subject TEXT NOT NULL,
    payload_json TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'queued', provider_message_id TEXT,
    attempts INTEGER NOT NULL DEFAULT 0, last_error TEXT, sent_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
  )`).run();
  await database.prepare("CREATE INDEX IF NOT EXISTS transactional_emails_status_idx ON transactional_emails(status, created_at)").run();
  await database.prepare("CREATE INDEX IF NOT EXISTS transactional_emails_customer_idx ON transactional_emails(customer_id, created_at)").run();
}

export async function queueTransactionalEmail(database: D1Database, input: { eventKey: string; customerId?: string | null; recipientEmail: string; template: TransactionalTemplate; payload: TransactionalEmailPayload }) {
  await ensureTransactionalEmailTable(database);
  const rendered = renderTransactionalEmail(input.template, input.payload);
  await database.prepare(`INSERT OR IGNORE INTO transactional_emails
    (id, event_key, customer_id, recipient_email, template, subject, payload_json, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'queued')`).bind(crypto.randomUUID(), input.eventKey, input.customerId ?? null,
      input.recipientEmail.trim().toLowerCase(), input.template, rendered.subject, JSON.stringify(input.payload)).run();
  return database.prepare("SELECT id, status FROM transactional_emails WHERE event_key = ? LIMIT 1")
    .bind(input.eventKey).first<{ id: string; status: string }>();
}

export async function deliverTransactionalEmail(database: D1Database, env: EmailRuntimeEnv, id: string) {
  await ensureTransactionalEmailTable(database);
  const row = await database.prepare(`SELECT id, recipient_email, template, payload_json, status FROM transactional_emails WHERE id = ? LIMIT 1`)
    .bind(id).first<{ id: string; recipient_email: string; template: TransactionalTemplate; payload_json: string; status: string }>();
  if (!row || row.status === "sent") return { status: row?.status ?? "missing" };
  const apiKey = env.RESEND_API_KEY?.trim() ?? "";
  if (!/^re_[A-Za-z0-9_\-]{16,}$/.test(apiKey)) return { status: "queued", reason: "provider_not_configured" };
  let payload: TransactionalEmailPayload;
  try { payload = JSON.parse(row.payload_json) as TransactionalEmailPayload; } catch { payload = {}; }
  const rendered = renderTransactionalEmail(row.template, payload);
  const senderName = env.LOREWISE_EMAIL_SENDER_NAME?.trim() || "LoreWise Universe";
  const senderAddress = env.LOREWISE_EMAIL_SENDER_ADDRESS?.trim() || "account@auth.lorewisenexus.it";
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": `lorewise-email-${row.id}` },
      body: JSON.stringify({ from: `${senderName} <${senderAddress}>`, to: [row.recipient_email], reply_to: env.LOREWISE_EMAIL_REPLY_TO?.trim() || "lorewise.archive@gmail.com", subject: rendered.subject, html: rendered.html }),
      signal: AbortSignal.timeout(12_000),
    });
    const result = await response.json().catch(() => ({})) as { id?: string; message?: string };
    if (!response.ok || !result.id) throw new Error(result.message || `Resend HTTP ${response.status}`);
    await database.prepare(`UPDATE transactional_emails SET status = 'sent', provider_message_id = ?, attempts = attempts + 1,
      last_error = NULL, sent_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(result.id, row.id).run();
    return { status: "sent", providerMessageId: result.id };
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 500) : "Invio non riuscito";
    await database.prepare(`UPDATE transactional_emails SET status = 'failed', attempts = attempts + 1,
      last_error = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(message, row.id).run();
    return { status: "failed", reason: message };
  }
}

export async function queueAndAttemptTransactionalEmail(database: D1Database, env: EmailRuntimeEnv, input: Parameters<typeof queueTransactionalEmail>[1]) {
  const queued = await queueTransactionalEmail(database, input);
  return queued ? deliverTransactionalEmail(database, env, queued.id) : { status: "missing" };
}

export async function backfillTransactionalEmailOutbox(database: D1Database) {
  await ensureTransactionalEmailTable(database);
  const orders = await database.prepare(`SELECT orders.id, orders.reference_code, orders.order_type, orders.status,
    orders.total_cents, orders.currency, customers.id AS customer_id, customers.email, customers.display_name,
    COALESCE(MAX(order_items.title), orders.reference_code) AS item_title
    FROM orders JOIN customers ON customers.id = orders.customer_id
    LEFT JOIN order_items ON order_items.order_id = orders.id
    WHERE orders.status IN ('paid', 'refunded', 'disputed') AND orders.order_type NOT IN ('commission', 'subscription')
    GROUP BY orders.id ORDER BY orders.created_at ASC`)
    .all<{ id: string; reference_code: string; order_type: string; status: string; total_cents: number; currency: string; customer_id: string; email: string; display_name: string | null; item_title: string }>();
  for (const order of orders.results) {
    const template: TransactionalTemplate = order.status === "refunded" ? "order_refunded" : order.status === "disputed" ? "payment_disputed" : order.order_type === "subscription" ? "subscription_activated" : order.order_type === "commission" ? "commission_payment" : "order_paid";
    await queueTransactionalEmail(database, {
      eventKey: `backfill:${template}:${order.id}`,
      customerId: order.customer_id,
      recipientEmail: order.email,
      template,
      payload: {
        name: order.display_name || undefined,
        referenceCode: order.reference_code,
        title: order.item_title,
        amountLabel: new Intl.NumberFormat("it-IT", { style: "currency", currency: order.currency }).format(order.total_cents / 100),
        detailUrl: `https://lorewisenexus.it/account/ordini/${encodeURIComponent(order.reference_code)}`,
      },
    });
  }
}
