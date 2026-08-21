import { readdirSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { cancelStripeTestSubscription, createStripeTestRefund } from "../lib/stripe.ts";

const supportReference = process.argv[2]?.trim();
if (!supportReference) throw new Error("Indica il codice della richiesta di assistenza.");

const secretKey = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
if (!secretKey.startsWith("sk_test_")) throw new Error("Questa procedura accetta soltanto Stripe TEST.");

const stateDirectory = join(process.cwd(), ".wrangler", "state", "v3", "d1", "miniflare-D1DatabaseObject");
const databaseFile = readdirSync(stateDirectory)
  .filter((name) => name.endsWith(".sqlite") && name !== "metadata.sqlite")
  .map((name) => join(stateDirectory, name))[0];
if (!databaseFile) throw new Error("Database locale LoreWise non trovato.");

const database = new DatabaseSync(databaseFile);
database.exec("PRAGMA busy_timeout = 10000");
const record = database.prepare(`SELECT order_support_requests.id, order_support_requests.status,
  orders.id AS order_id, orders.status AS order_status, orders.customer_id, orders.order_type,
  orders.stripe_payment_intent_id, subscriptions.id AS subscription_id,
  subscriptions.stripe_subscription_id, subscription_invoices.stripe_invoice_id
  FROM order_support_requests
  INNER JOIN orders ON orders.id = order_support_requests.order_id
  LEFT JOIN subscriptions ON subscriptions.order_id = orders.id
  LEFT JOIN subscription_invoices ON subscription_invoices.subscription_id = subscriptions.id
    AND subscription_invoices.stripe_payment_intent_id = orders.stripe_payment_intent_id
  WHERE order_support_requests.reference_code = ? LIMIT 1`).get(supportReference);

if (!record) throw new Error("Richiesta di rimborso locale non trovata.");
if (record.order_type !== "subscription" || !record.stripe_subscription_id || !record.stripe_payment_intent_id) {
  throw new Error("La richiesta non è collegata a un abbonamento Stripe TEST completo.");
}
if (record.order_status === "refunded") {
  console.log(`${supportReference}: rimborso già completato.`);
  database.close();
  process.exit(0);
}
if (record.order_status !== "paid" || !["open", "reviewing", "approved"].includes(record.status)) {
  throw new Error("Lo stato della richiesta non consente il rimborso.");
}

database.prepare(`UPDATE order_support_requests SET status = 'approved',
  admin_notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
  .run("Rimborso approvato per il collaudo E2E del Universe Pass Supporter.", record.id);

await cancelStripeTestSubscription({ secretKey, subscriptionId: record.stripe_subscription_id });
const refund = await createStripeTestRefund({
  secretKey,
  paymentIntentId: record.stripe_payment_intent_id,
  orderId: record.order_id,
  supportRequestId: record.id,
});

if (refund.status === "pending") {
  database.prepare("UPDATE orders SET status = 'refund_pending', stripe_refund_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
    .run(refund.id, record.order_id);
  database.prepare(`UPDATE order_support_requests SET status = 'reviewing', admin_notes = ?,
    updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
    .run("Rimborso Stripe TEST avviato e in attesa di conferma.", record.id);
  console.log(`${supportReference}: rimborso Stripe TEST in attesa di conferma.`);
  database.close();
  process.exit(0);
}

database.exec("BEGIN IMMEDIATE");
try {
  database.prepare(`UPDATE orders SET status = 'refunded', stripe_refund_id = ?, refunded_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(refund.id, record.order_id);
  database.prepare(`UPDATE subscriptions SET status = 'canceled', cancel_at_period_end = 1,
    current_period_end = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(record.subscription_id);
  database.prepare(`UPDATE entitlements SET status = 'revoked', expires_at = CURRENT_TIMESTAMP
    WHERE order_item_id IN (SELECT id FROM order_items WHERE order_id = ?) AND status = 'active'`).run(record.order_id);
  if (record.stripe_invoice_id) {
    const credits = database.prepare(`SELECT id, remaining FROM benefit_ledger
      WHERE customer_id = ? AND source_key LIKE ? AND status = 'active'`)
      .all(record.customer_id, `invoice:${record.stripe_invoice_id}:%`);
    const revoked = credits.reduce((sum, row) => sum + Number(row.remaining), 0);
    for (const credit of credits) {
      database.prepare("UPDATE benefit_ledger SET status = 'revoked', remaining = 0 WHERE id = ?").run(credit.id);
    }
    if (revoked > 0) {
      database.prepare(`INSERT INTO benefit_events (id, customer_id, benefit_type, action, amount, reference_code)
        VALUES (?, ?, 'art_credit', 'revoked', ?, ?)`).run(crypto.randomUUID(), record.customer_id, revoked, record.stripe_invoice_id);
    }
  }
  database.prepare(`UPDATE order_support_requests SET status = 'resolved', admin_notes = ?,
    resolved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
    .run("Rimborso Stripe TEST completato; rinnovo, vantaggi e diritti revocati.", record.id);
  database.exec("COMMIT");
} catch (error) {
  database.exec("ROLLBACK");
  throw error;
}

console.log(`${supportReference}: rimborso Stripe TEST completato, abbonamento annullato e vantaggi revocati.`);
database.close();
