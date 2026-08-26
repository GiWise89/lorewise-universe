import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const migrationDirectory = resolve("drizzle");
const migrationFiles = readdirSync(migrationDirectory).filter((name) => /^\d{4}_.+\.sql$/.test(name)).sort();
assert.ok(migrationFiles.length > 0, "Nessuna migrazione trovata.");

const database = new DatabaseSync(":memory:");
database.exec("PRAGMA foreign_keys = ON");

for (const filename of migrationFiles) {
  const source = readFileSync(resolve(migrationDirectory, filename), "utf8");
  const statements = source.split("--> statement-breakpoint").map((statement) => statement.trim()).filter(Boolean);
  database.exec("BEGIN");
  try {
    for (const statement of statements) database.exec(statement);
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw new Error(`Migrazione non applicabile: ${filename}\n${error instanceof Error ? error.message : String(error)}`);
  }
}

const requiredTables = [
  "customers", "commission_requests", "commission_request_files", "orders", "order_items", "subscriptions", "subscription_invoices",
  "entitlements", "commission_payments", "payment_events", "order_support_requests", "artwork_delivery_files", "game_delivery_files",
  "game_ratings",
  "benefit_ledger", "benefit_events", "member_benefit_claims", "codex_bookmarks", "codex_character_suggestions", "studio_poll_votes", "transactional_emails",
  "manual_deliveries",
  "site_page_views",
  "artwork_likes", "artwork_comments", "artwork_comment_reports", "artwork_comment_likes", "user_notifications", "admin_notifications",
  "marketing_consent_events", "marketing_campaigns", "marketing_deliveries",
  "commission_offer_entitlements",
];
const tables = new Set(database.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map((row) => row.name));
for (const table of requiredTables) assert.ok(tables.has(table), `Tabella finale mancante: ${table}`);

function columns(table) {
  return new Set(database.prepare(`PRAGMA table_info(${table})`).all().map((row) => row.name));
}

for (const column of ["stripe_refund_id", "refunded_at"]) assert.ok(columns("orders").has(column), `orders.${column} mancante`);
for (const column of ["discount_cents", "benefit_plan_code", "benefit_discount_percent"]) assert.ok(columns("orders").has(column), `orders.${column} mancante`);
for (const column of ["order_id", "stripe_subscription_id", "cancel_at_period_end"]) assert.ok(columns("subscriptions").has(column), `subscriptions.${column} mancante`);
for (const column of ["quote_cents", "deposit_cents", "quote_terms_accepted_at"]) assert.ok(columns("commission_requests").has(column), `commission_requests.${column} mancante`);
for (const column of ["pricing_discount_code", "pricing_discount_label", "pricing_discount_kind", "pricing_discount_value"]) assert.ok(columns("commission_requests").has(column), `commission_requests.${column} mancante`);
for (const column of ["rating", "game_version", "comment_id"]) assert.ok(columns("game_ratings").has(column), `game_ratings.${column} mancante`);
assert.ok(columns("customers").has("codex_spoiler_preference"), "customers.codex_spoiler_preference mancante");
for (const column of ["username", "bio", "avatar_object_key", "avatar_content_type", "profile_visibility"]) assert.ok(columns("customers").has(column), `customers.${column} mancante`);
assert.ok(columns("artwork_comments").has("parent_comment_id"), "artwork_comments.parent_comment_id mancante");
assert.ok(columns("admin_notifications").has("dismissed_at"), "admin_notifications.dismissed_at mancante");
for (const column of ["channel", "action", "source", "policy_version"]) assert.ok(columns("marketing_consent_events").has(column), `marketing_consent_events.${column} mancante`);
for (const column of ["audience", "subject", "heading", "body", "status", "recipient_count"]) assert.ok(columns("marketing_campaigns").has(column), `marketing_campaigns.${column} mancante`);
for (const column of ["unsubscribe_token", "recipient_email", "status", "attempts"]) assert.ok(columns("marketing_deliveries").has(column), `marketing_deliveries.${column} mancante`);
for (const column of ["event_key", "recipient_email", "template", "status", "attempts", "provider_message_id"]) assert.ok(columns("transactional_emails").has(column), `transactional_emails.${column} mancante`);

const indexes = new Set(database.prepare("SELECT name FROM sqlite_master WHERE type = 'index'").all().map((row) => row.name));
for (const index of ["subscriptions_order_id_unique", "orders_stripe_refund_id_unique", "entitlements_customer_resource_unique",
  "benefit_ledger_customer_idx", "member_benefit_claim_unique", "codex_bookmarks_customer_idx", "codex_character_suggestions_customer_idx", "studio_poll_votes_poll_idx", "transactional_emails_status_idx",
  "manual_deliveries_order_id_unique", "manual_deliveries_status_idx", "manual_deliveries_customer_idx",
  "site_page_views_created_idx", "site_page_views_path_idx", "site_page_views_session_idx",
  "customers_username_unique", "artwork_comment_likes_comment_idx", "user_notifications_inbox_idx", "user_notifications_group_unique", "admin_notifications_unread_idx",
  "marketing_consent_customer_idx", "marketing_campaigns_status_idx", "marketing_delivery_recipient_unique", "marketing_deliveries_status_idx",
  "commission_offer_entitlements_customer_offer_unique", "commission_offer_entitlements_customer_idx", "commission_offer_entitlements_expiry_idx"]) {
  assert.ok(indexes.has(index), `Indice finale mancante: ${index}`);
}

const foreignKeyIssues = database.prepare("PRAGMA foreign_key_check").all();
assert.equal(foreignKeyIssues.length, 0, "Il database finale contiene vincoli esterni incoerenti.");
database.close();

console.log(`Audit migrazioni superato: ${migrationFiles.length} file applicati in ordine, ${requiredTables.length} tabelle commerciali verificate.`);
