import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

const orderReference = process.argv[2]?.trim();
if (!orderReference) throw new Error("Indica il codice ordine di collaudo del gioco.");

const directory = join(process.cwd(), ".wrangler", "state", "v3", "d1", "miniflare-D1DatabaseObject");
const file = readdirSync(directory).find((name) => name.endsWith(".sqlite") && name !== "metadata.sqlite");
if (!file) throw new Error("Database locale non trovato.");

const database = new DatabaseSync(join(directory, file), { readOnly: true });
const order = database.prepare(`SELECT id, reference_code, status, order_type, total_cents, currency, created_at, paid_at
  FROM orders WHERE reference_code = ? LIMIT 1`).get(orderReference);
assert.ok(order, "Ordine non trovato.");
assert.equal(order.order_type, "game", "L'ordine non e di tipo gioco.");

const item = database.prepare(`SELECT id, product_code, product_type, title, unit_amount_cents
  FROM order_items WHERE order_id = ? LIMIT 1`).get(order.id);
assert.ok(item, "Riga d'ordine non trovata.");
assert.equal(item.product_code, "GS-GAME-001-WIN", "Prodotto Windows inatteso.");

const entitlement = database.prepare(`SELECT status, resource_code, download_count, download_limit, created_at, expires_at
  FROM entitlements WHERE order_item_id = ? LIMIT 1`).get(item.id);
assert.ok(entitlement, "Licenza gioco non trovata.");

const emails = database.prepare(`SELECT template, status, created_at FROM transactional_emails
  WHERE payload_json LIKE ? ORDER BY created_at`).all(`%${orderReference}%`);
const supportRequests = database.prepare(`SELECT reference_code, request_type, status, reason, admin_notes, resolved_at
  FROM order_support_requests WHERE order_id = ? ORDER BY created_at`).all(order.id);

console.log(JSON.stringify({
  order: {
    referenceCode: order.reference_code,
    status: order.status,
    totalCents: order.total_cents,
    currency: order.currency,
    paidAt: order.paid_at,
  },
  item: {
    productCode: item.product_code,
    title: item.title,
    unitPriceCents: item.unit_amount_cents,
  },
  entitlement,
  supportRequests,
  emails,
}, null, 2));

database.close();
