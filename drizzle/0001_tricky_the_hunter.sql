ALTER TABLE `commission_requests` ADD `quote_cents` integer;--> statement-breakpoint
ALTER TABLE `commission_requests` ADD `admin_notes` text;--> statement-breakpoint
ALTER TABLE `commission_requests` ADD `launch_slot_reserved` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `commission_requests` ADD `updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL;