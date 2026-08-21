import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { createStripeTestRefund } from "../lib/stripe.ts";

const supportReference = process.argv[2]?.trim();
if (!supportReference) throw new Error("Indica il codice della richiesta di rimborso del gioco.");

function localSecretKey() {
  const configured = process.env.STRIPE_SECRET_KEY?.trim();
  if (configured) return configured;
  const line = readFileSync(join(process.cwd(), ".env.local"), "utf8")
    .split(/\r?\n/)
    .find((entry) => entry.startsWith("STRIPE_SECRET_KEY="));
  return line?.slice(line.indexOf("=") + 1).trim() ?? "";
}

const secretKey = localSecretKey();
if (!secretKey.startsWith("sk_test_")) throw new Error("Questa procedura accetta soltanto Stripe TEST.");

const stateDirectory = join(process.cwd(), ".wrangler", "state", "v3", "d1", "miniflare-D1DatabaseObject");
const databaseFile = readdirSync(stateDirectory)
  .filter((name) => name.endsWith(".sqlite") && name !== "metadata.sqlite")
  .map((name) => join(stateDirectory, name))[0];
if (!databaseFile) throw new Error("Database locale LoreWise non trovato.");

const database = new DatabaseSync(databaseFile);
database.exec("PRAGMA busy_timeout = 10000");

const record = database.prepare(`SELECT order_support_requests.id, order_support_requests.status,
  orders.id AS order_id, orders.status AS order_status, orders.order_type, orders.stripe_payment_intent_id
  FROM order_support_requests
  INNER JOIN orders ON orders.id = order_support_requests.order_id
  WHERE order_support_requests.reference_code = ? LIMIT 1`).get(supportReference);

if (!record) throw new Error("Richiesta di rimborso locale non trovata.");
if (record.order_type !== "game" || !record.stripe_payment_intent_id) {
  throw new Error("La richiesta non e collegata a un acquisto gioco Stripe TEST completo.");
}
if (record.order_status === "refunded") {
  console.log(`${supportReference}: rimborso gia completato.`);
  database.close();
  process.exit(0);
}
if (record.order_status !== "paid" || record.status !== "approved") {
  throw new Error("Lo stato della richiesta non consente il rimborso.");
}

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
  database.prepare(`UPDATE entitlements SET status = 'revoked', expires_at = CURRENT_TIMESTAMP
    WHERE order_item_id IN (SELECT id FROM order_items WHERE order_id = ?) AND status = 'active'`).run(record.order_id);
  database.prepare(`UPDATE order_support_requests SET status = 'resolved', admin_notes = ?,
    resolved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
    .run("Rimborso Stripe TEST completato; licenza e download del gioco revocati.", record.id);
  database.exec("COMMIT");
} catch (error) {
  database.exec("ROLLBACK");
  throw error;
}

console.log(`${supportReference}: rimborso Stripe TEST completato e accesso al gioco revocato.`);
database.close();
