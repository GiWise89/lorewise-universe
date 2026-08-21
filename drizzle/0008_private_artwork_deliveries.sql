CREATE TABLE `artwork_delivery_files` (
	`id` text PRIMARY KEY NOT NULL,
	`artwork_code` text NOT NULL,
	`object_key` text NOT NULL,
	`filename` text NOT NULL,
	`content_type` text NOT NULL,
	`size` integer NOT NULL,
	`sha256` text NOT NULL,
	`status` text DEFAULT 'preparing' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `artwork_delivery_files_artwork_code_unique` ON `artwork_delivery_files` (`artwork_code`);--> statement-breakpoint
CREATE UNIQUE INDEX `artwork_delivery_files_object_key_unique` ON `artwork_delivery_files` (`object_key`);--> statement-breakpoint
CREATE INDEX `artwork_delivery_files_status_idx` ON `artwork_delivery_files` (`status`);
