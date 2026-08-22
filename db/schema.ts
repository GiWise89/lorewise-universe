import { sql } from "drizzle-orm";
import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const sitePageViews = sqliteTable("site_page_views", {
  id: text("id").primaryKey(),
  siteHost: text("site_host").notNull(),
  path: text("path").notNull(),
  sessionHash: text("session_hash").notNull(),
  referrerHost: text("referrer_host"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("site_page_views_created_idx").on(table.createdAt),
  index("site_page_views_path_idx").on(table.path, table.createdAt),
  index("site_page_views_session_idx").on(table.sessionHash, table.createdAt),
]);

export const commissionRequests = sqliteTable("commission_requests", {
  id: text("id").primaryKey(),
  referenceCode: text("reference_code").notNull().unique(),
  customerId: text("customer_id"),
  name: text("name").notNull(),
  email: text("email").notNull(),
  category: text("category").notNull(),
  packageName: text("package_name").notNull(),
  intendedUse: text("intended_use").notNull(),
  idealDeadline: text("ideal_deadline"),
  artworkReference: text("artwork_reference"),
  brief: text("brief").notNull(),
  includesMinor: integer("includes_minor", { mode: "boolean" }).notNull().default(false),
  guardianName: text("guardian_name"),
  guardianConsent: integer("guardian_consent", { mode: "boolean" }).notNull().default(false),
  portfolioConsent: integer("portfolio_consent", { mode: "boolean" }).notNull().default(false),
  privacyConsent: integer("privacy_consent", { mode: "boolean" }).notNull().default(false),
  contentPolicyConsent: integer("content_policy_consent", { mode: "boolean" }).notNull().default(false),
  status: text("status").notNull().default("new"),
  quoteBaseCents: integer("quote_base_cents"),
  quoteDiscountCents: integer("quote_discount_cents"),
  quoteCents: integer("quote_cents"),
  depositCents: integer("deposit_cents"),
  membershipPlanCode: text("membership_plan_code"),
  membershipDiscountPercent: integer("membership_discount_percent").notNull().default(0),
  benefitSnapshotAt: text("benefit_snapshot_at"),
  adminNotes: text("admin_notes"),
  launchSlotReserved: integer("launch_slot_reserved", { mode: "boolean" }).notNull().default(false),
  clientResponse: text("client_response"),
  clientMessage: text("client_message"),
  clientRespondedAt: text("client_responded_at"),
  quoteTermsAcceptedAt: text("quote_terms_accepted_at"),
  quoteTermsVersion: text("quote_terms_version"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("commission_requests_created_at_idx").on(table.createdAt),
  index("commission_requests_status_idx").on(table.status),
  index("commission_requests_customer_id_idx").on(table.customerId),
]);

export const commissionRequestFiles = sqliteTable("commission_request_files", {
  id: text("id").primaryKey(),
  requestId: text("request_id").notNull().references(() => commissionRequests.id, { onDelete: "cascade" }),
  objectKey: text("object_key").notNull().unique(),
  originalName: text("original_name").notNull(),
  contentType: text("content_type").notNull(),
  size: integer("size").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("commission_request_files_request_id_idx").on(table.requestId),
]);

export const customers = sqliteTable("customers", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  displayName: text("display_name"),
  role: text("role").notNull().default("member"),
  locale: text("locale").notNull().default("it-IT"),
  communityEmails: integer("community_emails", { mode: "boolean" }).notNull().default(false),
  studioUpdatesEmails: integer("studio_updates_emails", { mode: "boolean" }).notNull().default(false),
  codexSpoilerPreference: text("codex_spoiler_preference").notNull().default("protected"),
  privacyVersion: text("privacy_version"),
  privacyAcceptedAt: text("privacy_accepted_at"),
  status: text("status").notNull().default("pending"),
  stripeCustomerId: text("stripe_customer_id").unique(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("customers_email_idx").on(table.email),
  index("customers_status_idx").on(table.status),
]);

export const accountDeletionRequests = sqliteTable("account_deletion_requests", {
  id: text("id").primaryKey(),
  customerId: text("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"),
  requestedAt: text("requested_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  canceledAt: text("canceled_at"),
  completedAt: text("completed_at"),
}, (table) => [
  index("account_deletion_requests_customer_idx").on(table.customerId),
  index("account_deletion_requests_status_idx").on(table.status),
]);

export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  referenceCode: text("reference_code").notNull().unique(),
  customerId: text("customer_id").notNull().references(() => customers.id, { onDelete: "restrict" }),
  orderType: text("order_type").notNull(),
  status: text("status").notNull().default("pending"),
  currency: text("currency").notNull().default("EUR"),
  subtotalCents: integer("subtotal_cents").notNull(),
  discountCents: integer("discount_cents").notNull().default(0),
  totalCents: integer("total_cents").notNull(),
  benefitPlanCode: text("benefit_plan_code"),
  benefitDiscountPercent: integer("benefit_discount_percent").notNull().default(0),
  stripeCheckoutSessionId: text("stripe_checkout_session_id").unique(),
  stripePaymentIntentId: text("stripe_payment_intent_id").unique(),
  stripeRefundId: text("stripe_refund_id").unique(),
  paidAt: text("paid_at"),
  refundedAt: text("refunded_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("orders_customer_id_idx").on(table.customerId),
  index("orders_status_idx").on(table.status),
  index("orders_created_at_idx").on(table.createdAt),
]);

export const orderItems = sqliteTable("order_items", {
  id: text("id").primaryKey(),
  orderId: text("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productCode: text("product_code").notNull(),
  productType: text("product_type").notNull(),
  title: text("title").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitAmountCents: integer("unit_amount_cents").notNull(),
  licenseType: text("license_type"),
  metadataJson: text("metadata_json"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("order_items_order_id_idx").on(table.orderId),
  index("order_items_product_code_idx").on(table.productCode),
]);

export const manualDeliveries = sqliteTable("manual_deliveries", {
  id: text("id").primaryKey(),
  orderId: text("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }).unique(),
  customerId: text("customer_id").notNull().references(() => customers.id, { onDelete: "restrict" }),
  destinationEmail: text("destination_email").notNull(),
  status: text("status").notNull().default("pending"),
  provider: text("provider"),
  adminNotes: text("admin_notes"),
  sentAt: text("sent_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("manual_deliveries_status_idx").on(table.status),
  index("manual_deliveries_customer_idx").on(table.customerId),
]);

export const orderSupportRequests = sqliteTable("order_support_requests", {
  id: text("id").primaryKey(),
  referenceCode: text("reference_code").notNull().unique(),
  orderId: text("order_id").notNull().references(() => orders.id, { onDelete: "restrict" }),
  customerId: text("customer_id").notNull().references(() => customers.id, { onDelete: "restrict" }),
  requestType: text("request_type").notNull(),
  reason: text("reason").notNull(),
  details: text("details").notNull(),
  status: text("status").notNull().default("open"),
  adminNotes: text("admin_notes"),
  resolvedAt: text("resolved_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("order_support_order_id_idx").on(table.orderId),
  index("order_support_customer_id_idx").on(table.customerId),
  index("order_support_status_idx").on(table.status),
]);

export const subscriptions = sqliteTable("subscriptions", {
  id: text("id").primaryKey(),
  customerId: text("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  orderId: text("order_id").references(() => orders.id, { onDelete: "set null" }).unique(),
  planCode: text("plan_code").notNull(),
  status: text("status").notNull().default("incomplete"),
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  currentPeriodEnd: text("current_period_end"),
  cancelAtPeriodEnd: integer("cancel_at_period_end", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("subscriptions_customer_id_idx").on(table.customerId),
  index("subscriptions_status_idx").on(table.status),
]);

export const subscriptionInvoices = sqliteTable("subscription_invoices", {
  id: text("id").primaryKey(),
  subscriptionId: text("subscription_id").notNull().references(() => subscriptions.id, { onDelete: "cascade" }),
  stripeInvoiceId: text("stripe_invoice_id").notNull().unique(),
  stripePaymentIntentId: text("stripe_payment_intent_id").unique(),
  amountPaidCents: integer("amount_paid_cents").notNull().default(0),
  currency: text("currency").notNull().default("EUR"),
  status: text("status").notNull(),
  periodStart: text("period_start"),
  periodEnd: text("period_end"),
  paidAt: text("paid_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("subscription_invoices_subscription_idx").on(table.subscriptionId),
  index("subscription_invoices_status_idx").on(table.status),
]);

export const entitlements = sqliteTable("entitlements", {
  id: text("id").primaryKey(),
  customerId: text("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  orderItemId: text("order_item_id").references(() => orderItems.id, { onDelete: "set null" }),
  resourceType: text("resource_type").notNull(),
  resourceCode: text("resource_code").notNull(),
  status: text("status").notNull().default("active"),
  downloadLimit: integer("download_limit"),
  downloadCount: integer("download_count").notNull().default(0),
  expiresAt: text("expires_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("entitlements_customer_id_idx").on(table.customerId),
  index("entitlements_resource_idx").on(table.resourceType, table.resourceCode),
  uniqueIndex("entitlements_customer_resource_unique").on(table.customerId, table.resourceType, table.resourceCode),
]);

export const artworkDeliveryFiles = sqliteTable("artwork_delivery_files", {
  id: text("id").primaryKey(),
  artworkCode: text("artwork_code").notNull().unique(),
  objectKey: text("object_key").notNull().unique(),
  filename: text("filename").notNull(),
  contentType: text("content_type").notNull(),
  size: integer("size").notNull(),
  sha256: text("sha256").notNull(),
  status: text("status").notNull().default("preparing"),
  approvedBy: text("approved_by"),
  approvedAt: text("approved_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("artwork_delivery_files_status_idx").on(table.status),
]);

export const gameDeliveryFiles = sqliteTable("game_delivery_files", {
  id: text("id").primaryKey(),
  productCode: text("product_code").notNull().unique(),
  gameCode: text("game_code").notNull(),
  platform: text("platform").notNull(),
  version: text("version").notNull(),
  objectKey: text("object_key").notNull().unique(),
  filename: text("filename").notNull(),
  contentType: text("content_type").notNull(),
  size: integer("size").notNull(),
  sha256: text("sha256").notNull(),
  signatureStatus: text("signature_status").notNull().default("unchecked"),
  scanStatus: text("scan_status").notNull().default("unchecked"),
  installTestStatus: text("install_test_status").notNull().default("unchecked"),
  updateTestStatus: text("update_test_status").notNull().default("unchecked"),
  status: text("status").notNull().default("qa_pending"),
  approvedBy: text("approved_by"),
  approvedAt: text("approved_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("game_delivery_files_status_idx").on(table.status),
  index("game_delivery_files_game_idx").on(table.gameCode, table.platform),
]);

export const commissionPayments = sqliteTable("commission_payments", {
  id: text("id").primaryKey(),
  requestId: text("request_id").notNull().references(() => commissionRequests.id, { onDelete: "cascade" }),
  orderId: text("order_id").notNull().references(() => orders.id, { onDelete: "restrict" }),
  phase: text("phase").notNull(),
  amountCents: integer("amount_cents").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("commission_payments_request_id_idx").on(table.requestId),
  index("commission_payments_order_id_idx").on(table.orderId),
]);

export const paymentEvents = sqliteTable("payment_events", {
  id: text("id").primaryKey(),
  providerEventId: text("provider_event_id").notNull().unique(),
  eventType: text("event_type").notNull(),
  processingStatus: text("processing_status").notNull().default("received"),
  payloadHash: text("payload_hash"),
  processedAt: text("processed_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("payment_events_type_idx").on(table.eventType),
  index("payment_events_status_idx").on(table.processingStatus),
]);

export const transactionalEmails = sqliteTable("transactional_emails", {
  id: text("id").primaryKey(),
  eventKey: text("event_key").notNull().unique(),
  customerId: text("customer_id").references(() => customers.id, { onDelete: "set null" }),
  recipientEmail: text("recipient_email").notNull(),
  template: text("template").notNull(),
  subject: text("subject").notNull(),
  payloadJson: text("payload_json").notNull(),
  status: text("status").notNull().default("queued"),
  providerMessageId: text("provider_message_id"),
  attempts: integer("attempts").notNull().default(0),
  lastError: text("last_error"),
  sentAt: text("sent_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("transactional_emails_status_idx").on(table.status, table.createdAt),
  index("transactional_emails_customer_idx").on(table.customerId, table.createdAt),
]);

export const artworkLikes = sqliteTable("artwork_likes", {
  userId: text("user_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  artworkCode: text("artwork_code").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  primaryKey({ columns: [table.userId, table.artworkCode] }),
  index("artwork_likes_artwork_idx").on(table.artworkCode),
]);

export const artworkComments = sqliteTable("artwork_comments", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  artworkCode: text("artwork_code").notNull(),
  body: text("body").notNull(),
  status: text("status").notNull().default("visible"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("artwork_comments_artwork_idx").on(table.artworkCode, table.createdAt),
  index("artwork_comments_user_idx").on(table.userId),
  index("artwork_comments_status_idx").on(table.status),
]);

export const artworkCommentReports = sqliteTable("artwork_comment_reports", {
  id: text("id").primaryKey(),
  commentId: text("comment_id").notNull().references(() => artworkComments.id, { onDelete: "cascade" }),
  reporterUserId: text("reporter_user_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  status: text("status").notNull().default("open"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("artwork_comment_reports_reporter_unique").on(table.commentId, table.reporterUserId),
  index("artwork_comment_reports_status_idx").on(table.status),
]);

export const communityModerationEvents = sqliteTable("community_moderation_events", {
  id: text("id").primaryKey(),
  moderatorUserId: text("moderator_user_id").notNull().references(() => customers.id, { onDelete: "restrict" }),
  action: text("action").notNull(),
  commentId: text("comment_id"),
  targetUserId: text("target_user_id"),
  note: text("note"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("community_moderation_events_created_idx").on(table.createdAt),
  index("community_moderation_events_action_idx").on(table.action),
]);

export const gameRatings = sqliteTable("game_ratings", {
  userId: text("user_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  gameCode: text("game_code").notNull(),
  rating: integer("rating").notNull(),
  gameVersion: text("game_version").notNull(),
  commentId: text("comment_id").notNull().references(() => artworkComments.id, { onDelete: "cascade" }).unique(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  primaryKey({ columns: [table.userId, table.gameCode] }),
  index("game_ratings_game_idx").on(table.gameCode, table.createdAt),
]);

export const benefitLedger = sqliteTable("benefit_ledger", {
  id: text("id").primaryKey(),
  customerId: text("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  subscriptionId: text("subscription_id").references(() => subscriptions.id, { onDelete: "set null" }),
  sourceKey: text("source_key").notNull().unique(),
  benefitType: text("benefit_type").notNull(),
  amount: integer("amount").notNull().default(0),
  remaining: integer("remaining").notNull().default(0),
  status: text("status").notNull().default("active"),
  assignedAt: text("assigned_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  expiresAt: text("expires_at"),
  usedAt: text("used_at"),
  resourceCode: text("resource_code"),
  metadataJson: text("metadata_json"),
}, (table) => [
  index("benefit_ledger_customer_idx").on(table.customerId, table.status),
  index("benefit_ledger_expiry_idx").on(table.expiresAt),
]);

export const benefitEvents = sqliteTable("benefit_events", {
  id: text("id").primaryKey(),
  customerId: text("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  benefitType: text("benefit_type").notNull(),
  action: text("action").notNull(),
  amount: integer("amount").notNull().default(0),
  referenceCode: text("reference_code"),
  metadataJson: text("metadata_json"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("benefit_events_customer_idx").on(table.customerId, table.createdAt)]);

export const memberBenefitClaims = sqliteTable("member_benefit_claims", {
  id: text("id").primaryKey(),
  customerId: text("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  benefitCode: text("benefit_code").notNull(),
  resourceCode: text("resource_code").notNull(),
  status: text("status").notNull().default("submitted"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("member_benefit_claim_unique").on(table.customerId, table.benefitCode, table.resourceCode),
  index("member_benefit_claim_customer_idx").on(table.customerId, table.status),
]);

export const codexBookmarks = sqliteTable("codex_bookmarks", {
  customerId: text("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  entrySlug: text("entry_slug").notNull(),
  collectionName: text("collection_name").notNull().default("Preferiti"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  primaryKey({ columns: [table.customerId, table.entrySlug] }),
  index("codex_bookmarks_customer_idx").on(table.customerId, table.collectionName),
]);

export const codexCharacterSuggestions = sqliteTable("codex_character_suggestions", {
  id: text("id").primaryKey(),
  customerId: text("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  requestedName: text("requested_name").notNull(),
  universe: text("universe").notNull(),
  reason: text("reason").notNull(),
  status: text("status").notNull().default("submitted"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("codex_character_suggestions_customer_idx").on(table.customerId, table.status, table.createdAt),
]);

export const studioPollVotes = sqliteTable("studio_poll_votes", {
  customerId: text("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  pollCode: text("poll_code").notNull(),
  optionCode: text("option_code").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  primaryKey({ columns: [table.customerId, table.pollCode] }),
  index("studio_poll_votes_poll_idx").on(table.pollCode, table.optionCode),
]);
