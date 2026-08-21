ALTER TABLE `customers` ADD `role` text DEFAULT 'member' NOT NULL;
--> statement-breakpoint
ALTER TABLE `customers` ADD `locale` text DEFAULT 'it-IT' NOT NULL;
--> statement-breakpoint
ALTER TABLE `customers` ADD `community_emails` integer DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE `customers` ADD `studio_updates_emails` integer DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE `customers` ADD `privacy_version` text;
--> statement-breakpoint
ALTER TABLE `customers` ADD `privacy_accepted_at` text;
--> statement-breakpoint
CREATE TABLE `artwork_likes` (
	`user_id` text NOT NULL,
	`artwork_code` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`user_id`, `artwork_code`),
	FOREIGN KEY (`user_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `artwork_likes_artwork_idx` ON `artwork_likes` (`artwork_code`);
--> statement-breakpoint
CREATE TABLE `artwork_comments` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`artwork_code` text NOT NULL,
	`body` text NOT NULL,
	`status` text DEFAULT 'visible' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `artwork_comments_artwork_idx` ON `artwork_comments` (`artwork_code`,`created_at`);
--> statement-breakpoint
CREATE INDEX `artwork_comments_user_idx` ON `artwork_comments` (`user_id`);
--> statement-breakpoint
CREATE INDEX `artwork_comments_status_idx` ON `artwork_comments` (`status`);
--> statement-breakpoint
CREATE TABLE `artwork_comment_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`comment_id` text NOT NULL,
	`reporter_user_id` text NOT NULL,
	`reason` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`comment_id`) REFERENCES `artwork_comments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`reporter_user_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `artwork_comment_reports_reporter_unique` ON `artwork_comment_reports` (`comment_id`,`reporter_user_id`);
--> statement-breakpoint
CREATE INDEX `artwork_comment_reports_status_idx` ON `artwork_comment_reports` (`status`);
--> statement-breakpoint
CREATE TABLE `community_moderation_events` (
	`id` text PRIMARY KEY NOT NULL,
	`moderator_user_id` text NOT NULL,
	`action` text NOT NULL,
	`comment_id` text,
	`target_user_id` text,
	`note` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`moderator_user_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `community_moderation_events_created_idx` ON `community_moderation_events` (`created_at`);
--> statement-breakpoint
CREATE INDEX `community_moderation_events_action_idx` ON `community_moderation_events` (`action`);
