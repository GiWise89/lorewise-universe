CREATE TABLE `account_deletion_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`requested_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`canceled_at` text,
	`completed_at` text,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `account_deletion_requests_customer_idx` ON `account_deletion_requests` (`customer_id`);
--> statement-breakpoint
CREATE INDEX `account_deletion_requests_status_idx` ON `account_deletion_requests` (`status`);
