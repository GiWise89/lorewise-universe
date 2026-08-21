CREATE TABLE `game_ratings` (
  `user_id` text NOT NULL,
  `game_code` text NOT NULL,
  `rating` integer NOT NULL CHECK (`rating` BETWEEN 1 AND 5),
  `game_version` text NOT NULL,
  `comment_id` text NOT NULL UNIQUE,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (`user_id`, `game_code`),
  FOREIGN KEY (`user_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`comment_id`) REFERENCES `artwork_comments`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `game_ratings_game_idx` ON `game_ratings` (`game_code`, `created_at`);
