import { readdirSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

const orderReference = process.argv[2]?.trim();
if (!orderReference) throw new Error("Indica il codice ordine da verificare.");
const directory = join(process.cwd(), ".wrangler", "state", "v3", "d1", "miniflare-D1DatabaseObject");
const file = readdirSync(directory).find((name) => name.endsWith(".sqlite") && name !== "metadata.sqlite");
if (!file) throw new Error("Database locale non trovato.");
const database = new DatabaseSync(join(directory, file), { readOnly: true });
const order = database.prepare(`SELECT orders.id, orders.reference_code, orders.status,
  subscriptions.status AS subscription_status, subscriptions.cancel_at_period_end,
  order_support_requests.status AS request_status
  FROM orders LEFT JOIN subscriptions ON subscriptions.order_id = orders.id
  LEFT JOIN order_support_requests ON order_support_requests.order_id = orders.id
  WHERE orders.reference_code = ? LIMIT 1`).get(orderReference);
if (!order) throw new Error("Ordine non trovato.");
const credits = database.prepare(`SELECT status, remaining, source_key FROM benefit_ledger
  WHERE subscription_id IN (SELECT id FROM subscriptions WHERE order_id = ?)`).all(order.id);
const messages = database.prepare(`SELECT id, status, template, created_at FROM transactional_emails
  WHERE payload_json LIKE ? ORDER BY created_at DESC`).all(`%${orderReference}%`);
console.log(JSON.stringify({ order, credits, messages }, null, 2));
database.close();
