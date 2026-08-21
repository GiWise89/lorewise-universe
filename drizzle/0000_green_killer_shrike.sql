CREATE TABLE `commission_request_files` (
	`id` text PRIMARY KEY NOT NULL,
	`request_id` text NOT NULL,
	`object_key` text NOT NULL,
	`original_name` text NOT NULL,
	`content_type` text NOT NULL,
	`size` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`request_id`) REFERENCES `commission_requests`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `commission_request_files_object_key_unique` ON `commission_request_files` (`object_key`);--> statement-breakpoint
CREATE INDEX `commission_request_files_request_id_idx` ON `commission_request_files` (`request_id`);--> statement-breakpoint
CREATE TABLE `commission_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`reference_code` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`category` text NOT NULL,
	`package_name` text NOT NULL,
	`intended_use` text NOT NULL,
	`ideal_deadline` text,
	`artwork_reference` text,
	`brief` text NOT NULL,
	`includes_minor` integer DEFAULT false NOT NULL,
	`guardian_name` text,
	`guardian_consent` integer DEFAULT false NOT NULL,
	`portfolio_consent` integer DEFAULT false NOT NULL,
	`privacy_consent` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `commission_requests_reference_code_unique` ON `commission_requests` (`reference_code`);--> statement-breakpoint
CREATE INDEX `commission_requests_created_at_idx` ON `commission_requests` (`created_at`);--> statement-breakpoint
CREATE INDEX `commission_requests_status_idx` ON `commission_requests` (`status`);