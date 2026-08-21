ALTER TABLE `commission_requests` ADD `content_policy_consent` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `commission_requests` ADD `quote_terms_accepted_at` text;--> statement-breakpoint
ALTER TABLE `commission_requests` ADD `quote_terms_version` text;