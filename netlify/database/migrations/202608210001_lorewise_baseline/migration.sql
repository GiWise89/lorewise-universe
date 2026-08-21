-- LoreWise Universe - baseline PostgreSQL per Netlify Database
-- Generato dagli schemi D1 approvati; dati commerciali nuovi, nessun ordine fittizio.

-- 0000_green_killer_shrike.sql
CREATE TABLE "commission_request_files" (
	"id" text PRIMARY KEY NOT NULL,
	"request_id" text NOT NULL,
	"object_key" text NOT NULL,
	"original_name" text NOT NULL,
	"content_type" text NOT NULL,
	"size" integer NOT NULL,
	"created_at" text DEFAULT (CURRENT_TIMESTAMP::text) NOT NULL
);

CREATE UNIQUE INDEX "commission_request_files_object_key_unique" ON "commission_request_files" ("object_key");
CREATE INDEX "commission_request_files_request_id_idx" ON "commission_request_files" ("request_id");
CREATE TABLE "commission_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"reference_code" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"category" text NOT NULL,
	"package_name" text NOT NULL,
	"intended_use" text NOT NULL,
	"ideal_deadline" text,
	"artwork_reference" text,
	"brief" text NOT NULL,
	"includes_minor" integer DEFAULT 0 NOT NULL,
	"guardian_name" text,
	"guardian_consent" integer DEFAULT 0 NOT NULL,
	"portfolio_consent" integer DEFAULT 0 NOT NULL,
	"privacy_consent" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"created_at" text DEFAULT (CURRENT_TIMESTAMP::text) NOT NULL
);

CREATE UNIQUE INDEX "commission_requests_reference_code_unique" ON "commission_requests" ("reference_code");
CREATE INDEX "commission_requests_created_at_idx" ON "commission_requests" ("created_at");
CREATE INDEX "commission_requests_status_idx" ON "commission_requests" ("status");

-- 0001_tricky_the_hunter.sql
ALTER TABLE "commission_requests" ADD "quote_cents" integer;
ALTER TABLE "commission_requests" ADD "admin_notes" text;
ALTER TABLE "commission_requests" ADD "launch_slot_reserved" integer DEFAULT 0 NOT NULL;
ALTER TABLE "commission_requests" ADD "updated_at" text DEFAULT (CURRENT_TIMESTAMP::text) NOT NULL;

-- 0002_old_ben_parker.sql
ALTER TABLE "commission_requests" ADD "client_response" text;
ALTER TABLE "commission_requests" ADD "client_message" text;
ALTER TABLE "commission_requests" ADD "client_responded_at" text;

-- 0003_spooky_lockheed.sql
ALTER TABLE "commission_requests" ADD "content_policy_consent" integer DEFAULT 0 NOT NULL;
ALTER TABLE "commission_requests" ADD "quote_terms_accepted_at" text;
ALTER TABLE "commission_requests" ADD "quote_terms_version" text;

-- 0004_ancient_sunset_bain.sql
CREATE TABLE "commission_payments" (
	"id" text PRIMARY KEY NOT NULL,
	"request_id" text NOT NULL,
	"order_id" text NOT NULL,
	"phase" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" text DEFAULT (CURRENT_TIMESTAMP::text) NOT NULL
);

CREATE INDEX "commission_payments_request_id_idx" ON "commission_payments" ("request_id");
CREATE INDEX "commission_payments_order_id_idx" ON "commission_payments" ("order_id");
CREATE TABLE "customers" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"display_name" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"stripe_customer_id" text,
	"created_at" text DEFAULT (CURRENT_TIMESTAMP::text) NOT NULL,
	"updated_at" text DEFAULT (CURRENT_TIMESTAMP::text) NOT NULL
);

CREATE UNIQUE INDEX "customers_email_unique" ON "customers" ("email");
CREATE UNIQUE INDEX "customers_stripe_customer_id_unique" ON "customers" ("stripe_customer_id");
CREATE INDEX "customers_email_idx" ON "customers" ("email");
CREATE INDEX "customers_status_idx" ON "customers" ("status");
CREATE TABLE "entitlements" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_id" text NOT NULL,
	"order_item_id" text,
	"resource_type" text NOT NULL,
	"resource_code" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"download_limit" integer,
	"download_count" integer DEFAULT 0 NOT NULL,
	"expires_at" text,
	"created_at" text DEFAULT (CURRENT_TIMESTAMP::text) NOT NULL
);

CREATE INDEX "entitlements_customer_id_idx" ON "entitlements" ("customer_id");
CREATE INDEX "entitlements_resource_idx" ON "entitlements" ("resource_type","resource_code");
CREATE TABLE "order_items" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"product_code" text NOT NULL,
	"product_type" text NOT NULL,
	"title" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_amount_cents" integer NOT NULL,
	"license_type" text,
	"metadata_json" text,
	"created_at" text DEFAULT (CURRENT_TIMESTAMP::text) NOT NULL
);

CREATE INDEX "order_items_order_id_idx" ON "order_items" ("order_id");
CREATE INDEX "order_items_product_code_idx" ON "order_items" ("product_code");
CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"reference_code" text NOT NULL,
	"customer_id" text NOT NULL,
	"order_type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"currency" text DEFAULT 'EUR' NOT NULL,
	"subtotal_cents" integer NOT NULL,
	"total_cents" integer NOT NULL,
	"stripe_checkout_session_id" text,
	"stripe_payment_intent_id" text,
	"paid_at" text,
	"created_at" text DEFAULT (CURRENT_TIMESTAMP::text) NOT NULL,
	"updated_at" text DEFAULT (CURRENT_TIMESTAMP::text) NOT NULL
);

CREATE UNIQUE INDEX "orders_reference_code_unique" ON "orders" ("reference_code");
CREATE UNIQUE INDEX "orders_stripe_checkout_session_id_unique" ON "orders" ("stripe_checkout_session_id");
CREATE UNIQUE INDEX "orders_stripe_payment_intent_id_unique" ON "orders" ("stripe_payment_intent_id");
CREATE INDEX "orders_customer_id_idx" ON "orders" ("customer_id");
CREATE INDEX "orders_status_idx" ON "orders" ("status");
CREATE INDEX "orders_created_at_idx" ON "orders" ("created_at");
CREATE TABLE "payment_events" (
	"id" text PRIMARY KEY NOT NULL,
	"provider_event_id" text NOT NULL,
	"event_type" text NOT NULL,
	"processing_status" text DEFAULT 'received' NOT NULL,
	"payload_hash" text,
	"processed_at" text,
	"created_at" text DEFAULT (CURRENT_TIMESTAMP::text) NOT NULL
);

CREATE UNIQUE INDEX "payment_events_provider_event_id_unique" ON "payment_events" ("provider_event_id");
CREATE INDEX "payment_events_type_idx" ON "payment_events" ("event_type");
CREATE INDEX "payment_events_status_idx" ON "payment_events" ("processing_status");
CREATE TABLE "subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_id" text NOT NULL,
	"plan_code" text NOT NULL,
	"status" text DEFAULT 'incomplete' NOT NULL,
	"stripe_subscription_id" text,
	"current_period_end" text,
	"cancel_at_period_end" integer DEFAULT 0 NOT NULL,
	"created_at" text DEFAULT (CURRENT_TIMESTAMP::text) NOT NULL,
	"updated_at" text DEFAULT (CURRENT_TIMESTAMP::text) NOT NULL
);

CREATE UNIQUE INDEX "subscriptions_stripe_subscription_id_unique" ON "subscriptions" ("stripe_subscription_id");
CREATE INDEX "subscriptions_customer_id_idx" ON "subscriptions" ("customer_id");
CREATE INDEX "subscriptions_status_idx" ON "subscriptions" ("status");

-- 0005_lorewise_account_profile.sql
ALTER TABLE "customers" ADD "role" text DEFAULT 'member' NOT NULL;

ALTER TABLE "customers" ADD "locale" text DEFAULT 'it-IT' NOT NULL;

ALTER TABLE "customers" ADD "community_emails" integer DEFAULT 0 NOT NULL;

ALTER TABLE "customers" ADD "studio_updates_emails" integer DEFAULT 0 NOT NULL;

ALTER TABLE "customers" ADD "privacy_version" text;

ALTER TABLE "customers" ADD "privacy_accepted_at" text;

CREATE TABLE "artwork_likes" (
	"user_id" text NOT NULL,
	"artwork_code" text NOT NULL,
	"created_at" text DEFAULT (CURRENT_TIMESTAMP::text) NOT NULL,
	PRIMARY KEY("user_id", "artwork_code")
);

CREATE INDEX "artwork_likes_artwork_idx" ON "artwork_likes" ("artwork_code");

CREATE TABLE "artwork_comments" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"artwork_code" text NOT NULL,
	"body" text NOT NULL,
	"status" text DEFAULT 'visible' NOT NULL,
	"created_at" text DEFAULT (CURRENT_TIMESTAMP::text) NOT NULL,
	"updated_at" text DEFAULT (CURRENT_TIMESTAMP::text) NOT NULL
);

CREATE INDEX "artwork_comments_artwork_idx" ON "artwork_comments" ("artwork_code","created_at");

CREATE INDEX "artwork_comments_user_idx" ON "artwork_comments" ("user_id");

CREATE INDEX "artwork_comments_status_idx" ON "artwork_comments" ("status");

CREATE TABLE "artwork_comment_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"comment_id" text NOT NULL,
	"reporter_user_id" text NOT NULL,
	"reason" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" text DEFAULT (CURRENT_TIMESTAMP::text) NOT NULL
);

CREATE UNIQUE INDEX "artwork_comment_reports_reporter_unique" ON "artwork_comment_reports" ("comment_id","reporter_user_id");

CREATE INDEX "artwork_comment_reports_status_idx" ON "artwork_comment_reports" ("status");

CREATE TABLE "community_moderation_events" (
	"id" text PRIMARY KEY NOT NULL,
	"moderator_user_id" text NOT NULL,
	"action" text NOT NULL,
	"comment_id" text,
	"target_user_id" text,
	"note" text,
	"created_at" text DEFAULT (CURRENT_TIMESTAMP::text) NOT NULL
);

CREATE INDEX "community_moderation_events_created_idx" ON "community_moderation_events" ("created_at");

CREATE INDEX "community_moderation_events_action_idx" ON "community_moderation_events" ("action");

-- 0006_account_deletion_requests.sql
CREATE TABLE "account_deletion_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"requested_at" text DEFAULT (CURRENT_TIMESTAMP::text) NOT NULL,
	"canceled_at" text,
	"completed_at" text
);

CREATE INDEX "account_deletion_requests_customer_idx" ON "account_deletion_requests" ("customer_id");

CREATE INDEX "account_deletion_requests_status_idx" ON "account_deletion_requests" ("status");

-- 0007_commercial_entitlement_guard.sql
CREATE UNIQUE INDEX "entitlements_customer_resource_unique"
ON "entitlements" ("customer_id", "resource_type", "resource_code");

-- 0008_private_artwork_deliveries.sql
CREATE TABLE "artwork_delivery_files" (
	"id" text PRIMARY KEY NOT NULL,
	"artwork_code" text NOT NULL,
	"object_key" text NOT NULL,
	"filename" text NOT NULL,
	"content_type" text NOT NULL,
	"size" integer NOT NULL,
	"sha256" text NOT NULL,
	"status" text DEFAULT 'preparing' NOT NULL,
	"created_at" text DEFAULT (CURRENT_TIMESTAMP::text) NOT NULL,
	"updated_at" text DEFAULT (CURRENT_TIMESTAMP::text) NOT NULL
);

CREATE UNIQUE INDEX "artwork_delivery_files_artwork_code_unique" ON "artwork_delivery_files" ("artwork_code");
CREATE UNIQUE INDEX "artwork_delivery_files_object_key_unique" ON "artwork_delivery_files" ("object_key");
CREATE INDEX "artwork_delivery_files_status_idx" ON "artwork_delivery_files" ("status");

-- 0009_artwork_delivery_approval.sql
ALTER TABLE "artwork_delivery_files" ADD "approved_by" text;

ALTER TABLE "artwork_delivery_files" ADD "approved_at" text;

-- 0010_order_support_requests.sql
CREATE TABLE "order_support_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"reference_code" text NOT NULL,
	"order_id" text NOT NULL,
	"customer_id" text NOT NULL,
	"request_type" text NOT NULL,
	"reason" text NOT NULL,
	"details" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"admin_notes" text,
	"resolved_at" text,
	"created_at" text DEFAULT (CURRENT_TIMESTAMP::text) NOT NULL,
	"updated_at" text DEFAULT (CURRENT_TIMESTAMP::text) NOT NULL
);

CREATE UNIQUE INDEX "order_support_requests_reference_code_unique" ON "order_support_requests" ("reference_code");
CREATE INDEX "order_support_order_id_idx" ON "order_support_requests" ("order_id");
CREATE INDEX "order_support_customer_id_idx" ON "order_support_requests" ("customer_id");
CREATE INDEX "order_support_status_idx" ON "order_support_requests" ("status");

-- 0011_private_game_deliveries.sql
CREATE TABLE "game_delivery_files" (
	"id" text PRIMARY KEY NOT NULL,
	"product_code" text NOT NULL,
	"game_code" text NOT NULL,
	"platform" text NOT NULL,
	"version" text NOT NULL,
	"object_key" text NOT NULL,
	"filename" text NOT NULL,
	"content_type" text NOT NULL,
	"size" integer NOT NULL,
	"sha256" text NOT NULL,
	"signature_status" text DEFAULT 'unchecked' NOT NULL,
	"scan_status" text DEFAULT 'unchecked' NOT NULL,
	"install_test_status" text DEFAULT 'unchecked' NOT NULL,
	"update_test_status" text DEFAULT 'unchecked' NOT NULL,
	"status" text DEFAULT 'qa_pending' NOT NULL,
	"approved_by" text,
	"approved_at" text,
	"created_at" text DEFAULT (CURRENT_TIMESTAMP::text) NOT NULL,
	"updated_at" text DEFAULT (CURRENT_TIMESTAMP::text) NOT NULL
);

CREATE UNIQUE INDEX "game_delivery_files_product_code_unique" ON "game_delivery_files" ("product_code");

CREATE UNIQUE INDEX "game_delivery_files_object_key_unique" ON "game_delivery_files" ("object_key");

CREATE INDEX "game_delivery_files_status_idx" ON "game_delivery_files" ("status");

CREATE INDEX "game_delivery_files_game_idx" ON "game_delivery_files" ("game_code","platform");

-- 0012_refund_lifecycle.sql
ALTER TABLE "orders" ADD "stripe_refund_id" text;
ALTER TABLE "orders" ADD "refunded_at" text;
CREATE UNIQUE INDEX "orders_stripe_refund_id_unique" ON "orders" ("stripe_refund_id");

-- 0013_subscription_order_link.sql
ALTER TABLE "subscriptions" ADD "order_id" text REFERENCES orders(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX "subscriptions_order_id_unique" ON "subscriptions" ("order_id");

-- 0014_commission_deposit.sql
ALTER TABLE "commission_requests" ADD "deposit_cents" integer;

-- 0015_subscription_invoices.sql
CREATE TABLE "subscription_invoices" (
  "id" text PRIMARY KEY NOT NULL,
  "subscription_id" text NOT NULL,
  "stripe_invoice_id" text NOT NULL,
  "stripe_payment_intent_id" text,
  "amount_paid_cents" integer DEFAULT 0 NOT NULL,
  "currency" text DEFAULT 'EUR' NOT NULL,
  "status" text NOT NULL,
  "period_start" text,
  "period_end" text,
  "paid_at" text,
  "created_at" text DEFAULT (CURRENT_TIMESTAMP::text) NOT NULL,
  "updated_at" text DEFAULT (CURRENT_TIMESTAMP::text) NOT NULL
);
CREATE UNIQUE INDEX "subscription_invoices_stripe_invoice_id_unique" ON "subscription_invoices" ("stripe_invoice_id");
CREATE UNIQUE INDEX "subscription_invoices_stripe_payment_intent_id_unique" ON "subscription_invoices" ("stripe_payment_intent_id");
CREATE INDEX "subscription_invoices_subscription_idx" ON "subscription_invoices" ("subscription_id");
CREATE INDEX "subscription_invoices_status_idx" ON "subscription_invoices" ("status");

-- 0016_game_ratings.sql
CREATE TABLE "game_ratings" (
  "user_id" text NOT NULL,
  "game_code" text NOT NULL,
  "rating" integer NOT NULL CHECK ("rating" BETWEEN 1 AND 5),
  "game_version" text NOT NULL,
  "comment_id" text NOT NULL UNIQUE,
  "created_at" text DEFAULT (CURRENT_TIMESTAMP::text) NOT NULL,
  "updated_at" text DEFAULT (CURRENT_TIMESTAMP::text) NOT NULL,
  PRIMARY KEY ("user_id", "game_code")
);

CREATE INDEX "game_ratings_game_idx" ON "game_ratings" ("game_code", "created_at");

-- 0017_codex_spoiler_preference.sql
ALTER TABLE "customers" ADD COLUMN "codex_spoiler_preference" text DEFAULT 'protected' NOT NULL;

-- 0018_universe_pass_commission_benefits.sql
ALTER TABLE "commission_requests" ADD "customer_id" text;

ALTER TABLE "commission_requests" ADD "quote_base_cents" integer;

ALTER TABLE "commission_requests" ADD "quote_discount_cents" integer;

ALTER TABLE "commission_requests" ADD "membership_plan_code" text;

ALTER TABLE "commission_requests" ADD "membership_discount_percent" integer DEFAULT 0 NOT NULL;

ALTER TABLE "commission_requests" ADD "benefit_snapshot_at" text;

CREATE INDEX "commission_requests_customer_id_idx" ON "commission_requests" ("customer_id");

-- 0019_universe_pass_benefit_engine.sql
ALTER TABLE orders ADD COLUMN discount_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN benefit_plan_code TEXT;
ALTER TABLE orders ADD COLUMN benefit_discount_percent INTEGER NOT NULL DEFAULT 0;

CREATE TABLE benefit_ledger (
  id TEXT PRIMARY KEY NOT NULL,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  subscription_id TEXT REFERENCES subscriptions(id) ON DELETE SET NULL,
  source_key TEXT NOT NULL UNIQUE,
  benefit_type TEXT NOT NULL,
  amount INTEGER NOT NULL DEFAULT 0,
  remaining INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  assigned_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT,
  used_at TEXT,
  resource_code TEXT,
  metadata_json TEXT
);
CREATE INDEX benefit_ledger_customer_idx ON benefit_ledger(customer_id, status);
CREATE INDEX benefit_ledger_expiry_idx ON benefit_ledger(expires_at);

CREATE TABLE benefit_events (
  id TEXT PRIMARY KEY NOT NULL,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  benefit_type TEXT NOT NULL,
  action TEXT NOT NULL,
  amount INTEGER NOT NULL DEFAULT 0,
  reference_code TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX benefit_events_customer_idx ON benefit_events(customer_id, created_at);

CREATE TABLE member_benefit_claims (
  id TEXT PRIMARY KEY NOT NULL,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  benefit_code TEXT NOT NULL,
  resource_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX member_benefit_claim_unique ON member_benefit_claims(customer_id, benefit_code, resource_code);
CREATE INDEX member_benefit_claim_customer_idx ON member_benefit_claims(customer_id, status);

CREATE TABLE codex_bookmarks (
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  entry_slug TEXT NOT NULL,
  collection_name TEXT NOT NULL DEFAULT 'Preferiti',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(customer_id, entry_slug)
);
CREATE INDEX codex_bookmarks_customer_idx ON codex_bookmarks(customer_id, collection_name);

CREATE TABLE studio_poll_votes (
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  poll_code TEXT NOT NULL,
  option_code TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(customer_id, poll_code)
);
CREATE INDEX studio_poll_votes_poll_idx ON studio_poll_votes(poll_code, option_code);

-- 0020_transactional_email_outbox.sql
CREATE TABLE transactional_emails (
  id TEXT PRIMARY KEY NOT NULL,
  event_key TEXT NOT NULL UNIQUE,
  customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
  recipient_email TEXT NOT NULL,
  template TEXT NOT NULL,
  subject TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  provider_message_id TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  sent_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX transactional_emails_status_idx ON transactional_emails(status, created_at);
CREATE INDEX transactional_emails_customer_idx ON transactional_emails(customer_id, created_at);

-- 0021_support_tickets.sql
CREATE TABLE "support_tickets" (
  "id" text PRIMARY KEY NOT NULL,
  "reference_code" text NOT NULL,
  "customer_id" text NOT NULL,
  "category" text NOT NULL,
  "subject" text NOT NULL,
  "description" text NOT NULL,
  "product_code" text,
  "status" text DEFAULT 'open' NOT NULL,
  "priority" text DEFAULT 'normal' NOT NULL,
  "admin_notes" text,
  "resolved_at" text,
  "created_at" text DEFAULT (CURRENT_TIMESTAMP::text) NOT NULL,
  "updated_at" text DEFAULT (CURRENT_TIMESTAMP::text) NOT NULL
);

CREATE UNIQUE INDEX "support_tickets_reference_code_unique" ON "support_tickets" ("reference_code");

CREATE INDEX "support_tickets_customer_idx" ON "support_tickets" ("customer_id","created_at");

CREATE INDEX "support_tickets_status_idx" ON "support_tickets" ("status","priority","created_at");

-- 0022_manual_private_deliveries.sql
CREATE TABLE "manual_deliveries" (
  "id" text PRIMARY KEY NOT NULL,
  "order_id" text NOT NULL,
  "customer_id" text NOT NULL,
  "destination_email" text NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "provider" text,
  "admin_notes" text,
  "sent_at" text,
  "created_at" text DEFAULT (CURRENT_TIMESTAMP::text) NOT NULL,
  "updated_at" text DEFAULT (CURRENT_TIMESTAMP::text) NOT NULL
);

CREATE UNIQUE INDEX "manual_deliveries_order_id_unique" ON "manual_deliveries" ("order_id");

CREATE INDEX "manual_deliveries_status_idx" ON "manual_deliveries" ("status");

CREATE INDEX "manual_deliveries_customer_idx" ON "manual_deliveries" ("customer_id");

-- Vincoli aggiunti dopo la creazione di tutte le tabelle.
ALTER TABLE "commission_request_files" ADD CONSTRAINT "fk_commission_request_files_request_id_0" FOREIGN KEY ("request_id") REFERENCES "commission_requests" ("id") ON UPDATE NO ACTION ON DELETE CASCADE;
ALTER TABLE "commission_payments" ADD CONSTRAINT "fk_commission_payments_request_id_1" FOREIGN KEY ("request_id") REFERENCES "commission_requests" ("id") ON UPDATE NO ACTION ON DELETE CASCADE;
ALTER TABLE "commission_payments" ADD CONSTRAINT "fk_commission_payments_order_id_2" FOREIGN KEY ("order_id") REFERENCES "orders" ("id") ON UPDATE NO ACTION ON DELETE RESTRICT;
ALTER TABLE "entitlements" ADD CONSTRAINT "fk_entitlements_customer_id_3" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON UPDATE NO ACTION ON DELETE CASCADE;
ALTER TABLE "entitlements" ADD CONSTRAINT "fk_entitlements_order_item_id_4" FOREIGN KEY ("order_item_id") REFERENCES "order_items" ("id") ON UPDATE NO ACTION ON DELETE SET NULL;
ALTER TABLE "order_items" ADD CONSTRAINT "fk_order_items_order_id_5" FOREIGN KEY ("order_id") REFERENCES "orders" ("id") ON UPDATE NO ACTION ON DELETE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "fk_orders_customer_id_6" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON UPDATE NO ACTION ON DELETE RESTRICT;
ALTER TABLE "subscriptions" ADD CONSTRAINT "fk_subscriptions_customer_id_7" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON UPDATE NO ACTION ON DELETE CASCADE;
ALTER TABLE "artwork_likes" ADD CONSTRAINT "fk_artwork_likes_user_id_8" FOREIGN KEY ("user_id") REFERENCES "customers" ("id") ON UPDATE NO ACTION ON DELETE CASCADE;
ALTER TABLE "artwork_comments" ADD CONSTRAINT "fk_artwork_comments_user_id_9" FOREIGN KEY ("user_id") REFERENCES "customers" ("id") ON UPDATE NO ACTION ON DELETE CASCADE;
ALTER TABLE "artwork_comment_reports" ADD CONSTRAINT "fk_artwork_comment_reports_comment_id_10" FOREIGN KEY ("comment_id") REFERENCES "artwork_comments" ("id") ON UPDATE NO ACTION ON DELETE CASCADE;
ALTER TABLE "artwork_comment_reports" ADD CONSTRAINT "fk_artwork_comment_reports_reporter_user_id_11" FOREIGN KEY ("reporter_user_id") REFERENCES "customers" ("id") ON UPDATE NO ACTION ON DELETE CASCADE;
ALTER TABLE "community_moderation_events" ADD CONSTRAINT "fk_community_moderation_events_moderator_user_id_12" FOREIGN KEY ("moderator_user_id") REFERENCES "customers" ("id") ON UPDATE NO ACTION ON DELETE RESTRICT;
ALTER TABLE "account_deletion_requests" ADD CONSTRAINT "fk_account_deletion_requests_customer_id_13" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON UPDATE NO ACTION ON DELETE CASCADE;
ALTER TABLE "order_support_requests" ADD CONSTRAINT "fk_order_support_requests_order_id_14" FOREIGN KEY ("order_id") REFERENCES "orders" ("id") ON UPDATE NO ACTION ON DELETE RESTRICT;
ALTER TABLE "order_support_requests" ADD CONSTRAINT "fk_order_support_requests_customer_id_15" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON UPDATE NO ACTION ON DELETE RESTRICT;
ALTER TABLE "subscription_invoices" ADD CONSTRAINT "fk_subscription_invoices_subscription_id_16" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions" ("id") ON UPDATE NO ACTION ON DELETE CASCADE;
ALTER TABLE "game_ratings" ADD CONSTRAINT "fk_game_ratings_user_id_17" FOREIGN KEY ("user_id") REFERENCES "customers" ("id") ON UPDATE NO ACTION ON DELETE CASCADE;
ALTER TABLE "game_ratings" ADD CONSTRAINT "fk_game_ratings_comment_id_18" FOREIGN KEY ("comment_id") REFERENCES "artwork_comments" ("id") ON UPDATE NO ACTION ON DELETE CASCADE;
ALTER TABLE "support_tickets" ADD CONSTRAINT "fk_support_tickets_customer_id_19" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON UPDATE NO ACTION ON DELETE CASCADE;
ALTER TABLE "manual_deliveries" ADD CONSTRAINT "fk_manual_deliveries_order_id_20" FOREIGN KEY ("order_id") REFERENCES "orders" ("id") ON UPDATE NO ACTION ON DELETE CASCADE;
ALTER TABLE "manual_deliveries" ADD CONSTRAINT "fk_manual_deliveries_customer_id_21" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON UPDATE NO ACTION ON DELETE RESTRICT;

