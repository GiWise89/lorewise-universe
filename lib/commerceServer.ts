import { ensureLoreWiseCustomersTable } from "@/lib/supabase/customer";
import { ensureBenefitEngineTables } from "@/lib/benefitEngine";
import { ensureTransactionalEmailTable } from "@/lib/transactionalEmail";

export async function ensureCommerceTables(database: D1Database) {
  await ensureLoreWiseCustomersTable(database);
  const statements = [
    `CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY NOT NULL, reference_code TEXT NOT NULL UNIQUE, customer_id TEXT NOT NULL,
      order_type TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', currency TEXT NOT NULL DEFAULT 'EUR',
      subtotal_cents INTEGER NOT NULL, total_cents INTEGER NOT NULL, stripe_checkout_session_id TEXT UNIQUE,
      stripe_payment_intent_id TEXT UNIQUE, stripe_refund_id TEXT UNIQUE, paid_at TEXT, refunded_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT
    )`,
    `CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY NOT NULL, order_id TEXT NOT NULL, product_code TEXT NOT NULL, product_type TEXT NOT NULL,
      title TEXT NOT NULL, quantity INTEGER NOT NULL DEFAULT 1, unit_amount_cents INTEGER NOT NULL,
      license_type TEXT, metadata_json TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS manual_deliveries (
      id TEXT PRIMARY KEY NOT NULL, order_id TEXT NOT NULL UNIQUE, customer_id TEXT NOT NULL,
      destination_email TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', provider TEXT,
      admin_notes TEXT, sent_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT
    )`,
    `CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY NOT NULL, customer_id TEXT NOT NULL, order_id TEXT, plan_code TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'incomplete', stripe_subscription_id TEXT UNIQUE, current_period_end TEXT,
      cancel_at_period_end INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS order_support_requests (
      id TEXT PRIMARY KEY NOT NULL, reference_code TEXT NOT NULL UNIQUE, order_id TEXT NOT NULL,
      customer_id TEXT NOT NULL, request_type TEXT NOT NULL, reason TEXT NOT NULL, details TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open', admin_notes TEXT, resolved_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT
    )`,
    `CREATE TABLE IF NOT EXISTS subscription_invoices (
      id TEXT PRIMARY KEY NOT NULL, subscription_id TEXT NOT NULL, stripe_invoice_id TEXT NOT NULL UNIQUE,
      stripe_payment_intent_id TEXT UNIQUE, amount_paid_cents INTEGER NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'EUR', status TEXT NOT NULL, period_start TEXT, period_end TEXT, paid_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS entitlements (
      id TEXT PRIMARY KEY NOT NULL, customer_id TEXT NOT NULL, order_item_id TEXT, resource_type TEXT NOT NULL,
      resource_code TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active', download_limit INTEGER,
      download_count INTEGER NOT NULL DEFAULT 0, expires_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
      FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE SET NULL
    )`,
    `CREATE TABLE IF NOT EXISTS artwork_delivery_files (
      id TEXT PRIMARY KEY NOT NULL, artwork_code TEXT NOT NULL UNIQUE, object_key TEXT NOT NULL UNIQUE,
      filename TEXT NOT NULL, content_type TEXT NOT NULL, size INTEGER NOT NULL, sha256 TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'preparing', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, approved_by TEXT, approved_at TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS game_delivery_files (
      id TEXT PRIMARY KEY NOT NULL, product_code TEXT NOT NULL UNIQUE, game_code TEXT NOT NULL,
      platform TEXT NOT NULL, version TEXT NOT NULL, object_key TEXT NOT NULL UNIQUE,
      filename TEXT NOT NULL, content_type TEXT NOT NULL, size INTEGER NOT NULL, sha256 TEXT NOT NULL,
      signature_status TEXT NOT NULL DEFAULT 'unchecked', scan_status TEXT NOT NULL DEFAULT 'unchecked',
      install_test_status TEXT NOT NULL DEFAULT 'unchecked', update_test_status TEXT NOT NULL DEFAULT 'unchecked',
      status TEXT NOT NULL DEFAULT 'qa_pending', approved_by TEXT, approved_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS payment_events (
      id TEXT PRIMARY KEY NOT NULL, provider_event_id TEXT NOT NULL UNIQUE, event_type TEXT NOT NULL,
      processing_status TEXT NOT NULL DEFAULT 'received', payload_hash TEXT, processed_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS commission_payments (
      id TEXT PRIMARY KEY NOT NULL, request_id TEXT NOT NULL, order_id TEXT NOT NULL, phase TEXT NOT NULL,
      amount_cents INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'pending', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (request_id) REFERENCES commission_requests(id) ON DELETE CASCADE,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT
    )`,
    "CREATE INDEX IF NOT EXISTS orders_customer_id_idx ON orders(customer_id)",
    "CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status)",
    "CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at)",
    "CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items(order_id)",
    "CREATE INDEX IF NOT EXISTS order_items_product_code_idx ON order_items(product_code)",
    "CREATE INDEX IF NOT EXISTS manual_deliveries_status_idx ON manual_deliveries(status)",
    "CREATE INDEX IF NOT EXISTS manual_deliveries_customer_idx ON manual_deliveries(customer_id)",
    "CREATE INDEX IF NOT EXISTS order_support_order_id_idx ON order_support_requests(order_id)",
    "CREATE INDEX IF NOT EXISTS order_support_customer_id_idx ON order_support_requests(customer_id)",
    "CREATE INDEX IF NOT EXISTS order_support_status_idx ON order_support_requests(status)",
    "CREATE INDEX IF NOT EXISTS subscriptions_customer_id_idx ON subscriptions(customer_id)",
    "CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON subscriptions(status)",
    "CREATE INDEX IF NOT EXISTS subscription_invoices_subscription_idx ON subscription_invoices(subscription_id)",
    "CREATE INDEX IF NOT EXISTS subscription_invoices_status_idx ON subscription_invoices(status)",
    "CREATE INDEX IF NOT EXISTS entitlements_customer_id_idx ON entitlements(customer_id)",
    "CREATE INDEX IF NOT EXISTS entitlements_resource_idx ON entitlements(resource_type, resource_code)",
    "CREATE UNIQUE INDEX IF NOT EXISTS entitlements_customer_resource_unique ON entitlements(customer_id, resource_type, resource_code)",
    "CREATE INDEX IF NOT EXISTS artwork_delivery_files_status_idx ON artwork_delivery_files(status)",
    "CREATE INDEX IF NOT EXISTS game_delivery_files_status_idx ON game_delivery_files(status)",
    "CREATE INDEX IF NOT EXISTS game_delivery_files_game_idx ON game_delivery_files(game_code, platform)",
    "CREATE INDEX IF NOT EXISTS payment_events_type_idx ON payment_events(event_type)",
    "CREATE INDEX IF NOT EXISTS payment_events_status_idx ON payment_events(processing_status)",
    "CREATE INDEX IF NOT EXISTS commission_payments_request_id_idx ON commission_payments(request_id)",
    "CREATE INDEX IF NOT EXISTS commission_payments_order_id_idx ON commission_payments(order_id)",
  ];
  for (const statement of statements) await database.prepare(statement).run();
  const orderColumns = await database.prepare("PRAGMA table_info(orders)").all<{ name: string }>();
  const orderColumnNames = new Set(orderColumns.results.map((column) => column.name));
  if (!orderColumnNames.has("stripe_refund_id")) await database.prepare("ALTER TABLE orders ADD COLUMN stripe_refund_id TEXT").run();
  if (!orderColumnNames.has("refunded_at")) await database.prepare("ALTER TABLE orders ADD COLUMN refunded_at TEXT").run();
  await database.prepare("CREATE UNIQUE INDEX IF NOT EXISTS orders_stripe_refund_id_unique ON orders(stripe_refund_id)").run();
  const subscriptionColumns = await database.prepare("PRAGMA table_info(subscriptions)").all<{ name: string }>();
  const subscriptionColumnNames = new Set(subscriptionColumns.results.map((column) => column.name));
  if (!subscriptionColumnNames.has("order_id")) await database.prepare("ALTER TABLE subscriptions ADD COLUMN order_id TEXT").run();
  await database.prepare("CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_order_id_unique ON subscriptions(order_id)").run();
  const deliveryColumns = await database.prepare("PRAGMA table_info(artwork_delivery_files)").all<{ name: string }>();
  const deliveryColumnNames = new Set(deliveryColumns.results.map((column) => column.name));
  if (!deliveryColumnNames.has("approved_by")) await database.prepare("ALTER TABLE artwork_delivery_files ADD COLUMN approved_by TEXT").run();
  if (!deliveryColumnNames.has("approved_at")) await database.prepare("ALTER TABLE artwork_delivery_files ADD COLUMN approved_at TEXT").run();
  await ensureBenefitEngineTables(database);
  await ensureTransactionalEmailTable(database);
}
