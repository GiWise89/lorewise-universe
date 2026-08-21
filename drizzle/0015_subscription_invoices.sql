CREATE TABLE `subscription_invoices` (
  `id` text PRIMARY KEY NOT NULL,
  `subscription_id` text NOT NULL,
  `stripe_invoice_id` text NOT NULL,
  `stripe_payment_intent_id` text,
  `amount_paid_cents` integer DEFAULT 0 NOT NULL,
  `currency` text DEFAULT 'EUR' NOT NULL,
  `status` text NOT NULL,
  `period_start` text,
  `period_end` text,
  `paid_at` text,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE UNIQUE INDEX `subscription_invoices_stripe_invoice_id_unique` ON `subscription_invoices` (`stripe_invoice_id`);
CREATE UNIQUE INDEX `subscription_invoices_stripe_payment_intent_id_unique` ON `subscription_invoices` (`stripe_payment_intent_id`);
CREATE INDEX `subscription_invoices_subscription_idx` ON `subscription_invoices` (`subscription_id`);
CREATE INDEX `subscription_invoices_status_idx` ON `subscription_invoices` (`status`);
