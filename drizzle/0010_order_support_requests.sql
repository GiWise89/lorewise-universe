CREATE TABLE `order_support_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`reference_code` text NOT NULL,
	`order_id` text NOT NULL,
	`customer_id` text NOT NULL,
	`request_type` text NOT NULL,
	`reason` text NOT NULL,
	`details` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`admin_notes` text,
	`resolved_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `order_support_requests_reference_code_unique` ON `order_support_requests` (`reference_code`);--> statement-breakpoint
CREATE INDEX `order_support_order_id_idx` ON `order_support_requests` (`order_id`);--> statement-breakpoint
CREATE INDEX `order_support_customer_id_idx` ON `order_support_requests` (`customer_id`);--> statement-breakpoint
CREATE INDEX `order_support_status_idx` ON `order_support_requests` (`status`);
