CREATE TABLE `commission_payments` (
	`id` text PRIMARY KEY NOT NULL,
	`request_id` text NOT NULL,
	`order_id` text NOT NULL,
	`phase` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`request_id`) REFERENCES `commission_requests`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `commission_payments_request_id_idx` ON `commission_payments` (`request_id`);--> statement-breakpoint
CREATE INDEX `commission_payments_order_id_idx` ON `commission_payments` (`order_id`);--> statement-breakpoint
CREATE TABLE `customers` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`display_name` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`stripe_customer_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `customers_email_unique` ON `customers` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `customers_stripe_customer_id_unique` ON `customers` (`stripe_customer_id`);--> statement-breakpoint
CREATE INDEX `customers_email_idx` ON `customers` (`email`);--> statement-breakpoint
CREATE INDEX `customers_status_idx` ON `customers` (`status`);--> statement-breakpoint
CREATE TABLE `entitlements` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`order_item_id` text,
	`resource_type` text NOT NULL,
	`resource_code` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`download_limit` integer,
	`download_count` integer DEFAULT 0 NOT NULL,
	`expires_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`order_item_id`) REFERENCES `order_items`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `entitlements_customer_id_idx` ON `entitlements` (`customer_id`);--> statement-breakpoint
CREATE INDEX `entitlements_resource_idx` ON `entitlements` (`resource_type`,`resource_code`);--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`product_code` text NOT NULL,
	`product_type` text NOT NULL,
	`title` text NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`unit_amount_cents` integer NOT NULL,
	`license_type` text,
	`metadata_json` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `order_items_order_id_idx` ON `order_items` (`order_id`);--> statement-breakpoint
CREATE INDEX `order_items_product_code_idx` ON `order_items` (`product_code`);--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`reference_code` text NOT NULL,
	`customer_id` text NOT NULL,
	`order_type` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`currency` text DEFAULT 'EUR' NOT NULL,
	`subtotal_cents` integer NOT NULL,
	`total_cents` integer NOT NULL,
	`stripe_checkout_session_id` text,
	`stripe_payment_intent_id` text,
	`paid_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_reference_code_unique` ON `orders` (`reference_code`);--> statement-breakpoint
CREATE UNIQUE INDEX `orders_stripe_checkout_session_id_unique` ON `orders` (`stripe_checkout_session_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `orders_stripe_payment_intent_id_unique` ON `orders` (`stripe_payment_intent_id`);--> statement-breakpoint
CREATE INDEX `orders_customer_id_idx` ON `orders` (`customer_id`);--> statement-breakpoint
CREATE INDEX `orders_status_idx` ON `orders` (`status`);--> statement-breakpoint
CREATE INDEX `orders_created_at_idx` ON `orders` (`created_at`);--> statement-breakpoint
CREATE TABLE `payment_events` (
	`id` text PRIMARY KEY NOT NULL,
	`provider_event_id` text NOT NULL,
	`event_type` text NOT NULL,
	`processing_status` text DEFAULT 'received' NOT NULL,
	`payload_hash` text,
	`processed_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payment_events_provider_event_id_unique` ON `payment_events` (`provider_event_id`);--> statement-breakpoint
CREATE INDEX `payment_events_type_idx` ON `payment_events` (`event_type`);--> statement-breakpoint
CREATE INDEX `payment_events_status_idx` ON `payment_events` (`processing_status`);--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`plan_code` text NOT NULL,
	`status` text DEFAULT 'incomplete' NOT NULL,
	`stripe_subscription_id` text,
	`current_period_end` text,
	`cancel_at_period_end` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subscriptions_stripe_subscription_id_unique` ON `subscriptions` (`stripe_subscription_id`);--> statement-breakpoint
CREATE INDEX `subscriptions_customer_id_idx` ON `subscriptions` (`customer_id`);--> statement-breakpoint
CREATE INDEX `subscriptions_status_idx` ON `subscriptions` (`status`);