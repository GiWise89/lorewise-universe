CREATE TABLE `support_tickets` (
  `id` text PRIMARY KEY NOT NULL,
  `reference_code` text NOT NULL,
  `customer_id` text NOT NULL,
  `category` text NOT NULL,
  `subject` text NOT NULL,
  `description` text NOT NULL,
  `product_code` text,
  `status` text DEFAULT 'open' NOT NULL,
  `priority` text DEFAULT 'normal' NOT NULL,
  `admin_notes` text,
  `resolved_at` text,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `support_tickets_reference_code_unique` ON `support_tickets` (`reference_code`);
--> statement-breakpoint
CREATE INDEX `support_tickets_customer_idx` ON `support_tickets` (`customer_id`,`created_at`);
--> statement-breakpoint
CREATE INDEX `support_tickets_status_idx` ON `support_tickets` (`status`,`priority`,`created_at`);
