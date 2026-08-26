import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import test from "node:test";

import { getAutomaticArtworkDelivery } from "../lib/automaticArtworkDelivery.ts";
import { resolveArtworkProduct } from "../lib/commercialCatalog.ts";
import { horrorArtworkBundles } from "../lib/horrorArtworkBundles.ts";

const root = path.resolve(import.meta.dirname, "..");

function createCommerceDatabase() {
  const database = new DatabaseSync(":memory:");
  database.exec("PRAGMA foreign_keys = ON");
  const migrationDirectory = path.resolve(root, "drizzle");
  const migrations = readdirSync(migrationDirectory).filter((name) => /^\d{4}_.+\.sql$/.test(name)).sort();
  for (const filename of migrations) {
    const source = readFileSync(path.resolve(migrationDirectory, filename), "utf8");
    const statements = source.split("--> statement-breakpoint").map((statement) => statement.trim()).filter(Boolean);
    database.exec("BEGIN");
    try {
      for (const statement of statements) database.exec(statement);
      database.exec("COMMIT");
    } catch (error) {
      database.exec("ROLLBACK");
      throw error;
    }
  }
  return database;
}

test("simulates three paid Halloween orders and nine protected automatic downloads", () => {
  const database = createCommerceDatabase();
  const customerId = "customer-halloween-owner";
  const outsiderId = "customer-halloween-outsider";
  database.prepare("INSERT INTO customers (id, email, display_name, status) VALUES (?, ?, ?, 'active')")
    .run(customerId, "halloween-owner@example.invalid", "Cliente Halloween");
  database.prepare("INSERT INTO customers (id, email, display_name, status) VALUES (?, ?, ?, 'active')")
    .run(outsiderId, "halloween-outsider@example.invalid", "Altro cliente");

  for (const [index, bundle] of horrorArtworkBundles.entries()) {
    const product = resolveArtworkProduct(bundle.code);
    assert.ok(product);
    assert.equal(product.amountCents, 2490);
    assert.deepEqual(product.bundleMembers, [...bundle.artworkCodes]);

    const orderId = `order-halloween-${index + 1}`;
    const orderItemId = `item-halloween-${index + 1}`;
    database.prepare(`INSERT INTO orders
      (id, reference_code, customer_id, order_type, status, currency, subtotal_cents, total_cents, stripe_checkout_session_id)
      VALUES (?, ?, ?, 'artwork', 'pending', 'EUR', ?, ?, ?)`)
      .run(orderId, `LW-HALLOWEEN-00${index + 1}`, customerId, product.amountCents, product.amountCents, `cs_test_halloween_${index + 1}`);
    database.prepare(`INSERT INTO order_items
      (id, order_id, product_code, product_type, title, quantity, unit_amount_cents, license_type, metadata_json)
      VALUES (?, ?, ?, 'artwork', ?, 1, ?, ?, ?)`)
      .run(orderItemId, orderId, product.code, product.title, product.amountCents, product.licenseType,
        JSON.stringify({ resourceType: "artwork", downloadLimit: product.downloadLimit, deliveryMode: "automatic", bundleMembers: product.bundleMembers }));

    database.exec("BEGIN");
    try {
      database.prepare("UPDATE orders SET status = 'paid', stripe_payment_intent_id = ?, paid_at = CURRENT_TIMESTAMP WHERE id = ?")
        .run(`pi_test_halloween_${index + 1}`, orderId);
      database.prepare(`INSERT INTO payment_events
        (id, provider_event_id, event_type, processing_status, payload_hash, processed_at)
        VALUES (?, ?, 'checkout.session.completed', 'processed', ?, CURRENT_TIMESTAMP)`)
        .run(`payment-event-${index + 1}`, `evt_test_halloween_${index + 1}`, "0".repeat(64));
      for (const artworkCode of bundle.artworkCodes) {
        database.prepare(`INSERT INTO entitlements
          (id, customer_id, order_item_id, resource_type, resource_code, status, download_limit, download_count)
          VALUES (?, ?, ?, 'artwork', ?, 'active', ?, 0)`)
          .run(`entitlement-${artworkCode}`, customerId, orderItemId, artworkCode, product.downloadLimit);
      }
      database.exec("COMMIT");
    } catch (error) {
      database.exec("ROLLBACK");
      throw error;
    }
  }

  const orderSummary = database.prepare("SELECT COUNT(*) AS count, SUM(total_cents) AS total FROM orders WHERE customer_id = ? AND status = 'paid'").get(customerId);
  assert.equal(orderSummary.count, 3);
  assert.equal(orderSummary.total, 7470);
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM payment_events WHERE processing_status = 'processed'").get().count, 3);

  const entitlements = database.prepare(`SELECT entitlements.id, entitlements.resource_code, entitlements.download_limit,
    entitlements.download_count FROM entitlements
    INNER JOIN order_items ON order_items.id = entitlements.order_item_id
    INNER JOIN orders ON orders.id = order_items.order_id
    WHERE entitlements.customer_id = ? AND entitlements.status = 'active' AND orders.status = 'paid'
    ORDER BY entitlements.resource_code`).all(customerId);
  assert.equal(entitlements.length, 9);
  assert.equal(new Set(entitlements.map((entry) => entry.resource_code)).size, 9);

  for (const entitlement of entitlements) {
    const outsiderAccess = database.prepare("SELECT id FROM entitlements WHERE customer_id = ? AND resource_code = ? AND status = 'active'")
      .get(outsiderId, entitlement.resource_code);
    assert.equal(outsiderAccess, undefined);

    const delivery = getAutomaticArtworkDelivery(entitlement.resource_code);
    assert.ok(delivery);
    const packagePath = path.resolve(root, "output", "artwork-deliveries", delivery.localPackage);
    assert.equal(statSync(packagePath).size, delivery.size);
    assert.equal(createHash("sha256").update(readFileSync(packagePath)).digest("hex"), delivery.sha256);

    const update = database.prepare(`UPDATE entitlements SET download_count = download_count + 1
      WHERE id = ? AND status = 'active' AND download_count < download_limit`).run(entitlement.id);
    assert.equal(update.changes, 1);
  }

  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM entitlements WHERE customer_id = ? AND download_count = 1").get(customerId).count, 9);
  assert.deepEqual(database.prepare("PRAGMA foreign_key_check").all(), []);
  database.close();
});

test("groups the three licenses in the account and explains the post-purchase journey", () => {
  const dashboard = readFileSync(path.resolve(root, "components", "AccountPersonalDashboard.tsx"), "utf8");
  const dashboardRoute = readFileSync(path.resolve(root, "app", "api", "account", "dashboard", "route.ts"), "utf8");
  const accountPage = readFileSync(path.resolve(root, "app", "account", "page.tsx"), "utf8");
  assert.match(dashboardRoute, /order_items\.product_code AS order_product_code/);
  assert.match(dashboardRoute, /collectionTitle: collection\?\.title/);
  assert.match(dashboard, /Collezione completa · 3 opere/);
  assert.match(dashboard, /Apri i tre download/);
  assert.match(dashboard, /Ricevuta e riepilogo/);
  assert.match(dashboard, /Certificato nominativo/);
  assert.match(accountPage, /anteprima === "acquisto-halloween"/);
  assert.match(accountPage, /Anteprima locale · nessun ordine reale/);
});
