CREATE TABLE `manual_deliveries` (
  `id` text PRIMARY KEY NOT NULL,
  `order_id` text NOT NULL,
  `customer_id` text NOT NULL,
  `destination_email` text NOT NULL,
  `status` text DEFAULT 'pending' NOT NULL,
  `provider` text,
  `admin_notes` text,
  `sent_at` text,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `manual_deliveries_order_id_unique` ON `manual_deliveries` (`order_id`);
--> statement-breakpoint
CREATE INDEX `manual_deliveries_status_idx` ON `manual_deliveries` (`status`);
--> statement-breakpoint
CREATE INDEX `manual_deliveries_customer_idx` ON `manual_deliveries` (`customer_id`);
