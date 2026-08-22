ALTER TABLE customers ADD COLUMN username TEXT;
--> statement-breakpoint
ALTER TABLE customers ADD COLUMN bio TEXT;
--> statement-breakpoint
ALTER TABLE customers ADD COLUMN avatar_object_key TEXT;
--> statement-breakpoint
ALTER TABLE customers ADD COLUMN avatar_content_type TEXT;
--> statement-breakpoint
ALTER TABLE customers ADD COLUMN profile_visibility TEXT NOT NULL DEFAULT 'public';
--> statement-breakpoint
CREATE UNIQUE INDEX customers_username_unique ON customers(username);
--> statement-breakpoint
ALTER TABLE artwork_comments ADD COLUMN parent_comment_id TEXT;
--> statement-breakpoint
CREATE INDEX artwork_comments_parent_idx ON artwork_comments(parent_comment_id);
--> statement-breakpoint
CREATE TABLE artwork_comment_likes (
  user_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  comment_id TEXT NOT NULL REFERENCES artwork_comments(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, comment_id)
);
--> statement-breakpoint
CREATE INDEX artwork_comment_likes_comment_idx ON artwork_comment_likes(comment_id);
--> statement-breakpoint
CREATE TABLE user_notifications (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  actor_user_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  artwork_code TEXT,
  comment_id TEXT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  target_url TEXT NOT NULL,
  group_key TEXT,
  read_at TEXT,
  dismissed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX user_notifications_inbox_idx ON user_notifications(user_id, dismissed_at, read_at, created_at);
--> statement-breakpoint
CREATE UNIQUE INDEX user_notifications_group_unique ON user_notifications(user_id, group_key);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS admin_notifications (
  id TEXT PRIMARY KEY NOT NULL,
  category TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  reference_code TEXT,
  target_url TEXT NOT NULL,
  source_created_at TEXT NOT NULL,
  read_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
ALTER TABLE admin_notifications ADD COLUMN dismissed_at TEXT;
--> statement-breakpoint
CREATE INDEX admin_notifications_unread_idx ON admin_notifications(read_at, source_created_at);
