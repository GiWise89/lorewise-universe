CREATE TABLE `game_delivery_files` (
	`id` text PRIMARY KEY NOT NULL,
	`product_code` text NOT NULL,
	`game_code` text NOT NULL,
	`platform` text NOT NULL,
	`version` text NOT NULL,
	`object_key` text NOT NULL,
	`filename` text NOT NULL,
	`content_type` text NOT NULL,
	`size` integer NOT NULL,
	`sha256` text NOT NULL,
	`signature_status` text DEFAULT 'unchecked' NOT NULL,
	`scan_status` text DEFAULT 'unchecked' NOT NULL,
	`install_test_status` text DEFAULT 'unchecked' NOT NULL,
	`update_test_status` text DEFAULT 'unchecked' NOT NULL,
	`status` text DEFAULT 'qa_pending' NOT NULL,
	`approved_by` text,
	`approved_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `game_delivery_files_product_code_unique` ON `game_delivery_files` (`product_code`);
--> statement-breakpoint
CREATE UNIQUE INDEX `game_delivery_files_object_key_unique` ON `game_delivery_files` (`object_key`);
--> statement-breakpoint
CREATE INDEX `game_delivery_files_status_idx` ON `game_delivery_files` (`status`);
--> statement-breakpoint
CREATE INDEX `game_delivery_files_game_idx` ON `game_delivery_files` (`game_code`,`platform`);
