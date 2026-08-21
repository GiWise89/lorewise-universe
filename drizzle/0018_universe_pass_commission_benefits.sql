ALTER TABLE `commission_requests` ADD `customer_id` text;
--> statement-breakpoint
ALTER TABLE `commission_requests` ADD `quote_base_cents` integer;
--> statement-breakpoint
ALTER TABLE `commission_requests` ADD `quote_discount_cents` integer;
--> statement-breakpoint
ALTER TABLE `commission_requests` ADD `membership_plan_code` text;
--> statement-breakpoint
ALTER TABLE `commission_requests` ADD `membership_discount_percent` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `commission_requests` ADD `benefit_snapshot_at` text;
--> statement-breakpoint
CREATE INDEX `commission_requests_customer_id_idx` ON `commission_requests` (`customer_id`);
