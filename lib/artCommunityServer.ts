import { ensureLoreWiseCustomersTable } from "@/lib/supabase/customer";

export async function ensureArtCommunityTables(database: D1Database) {
  await ensureLoreWiseCustomersTable(database);
  await database.prepare(`CREATE TABLE IF NOT EXISTS artwork_likes (
    user_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    artwork_code TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, artwork_code)
  )`).run();
  await database.prepare("CREATE INDEX IF NOT EXISTS artwork_likes_artwork_idx ON artwork_likes (artwork_code)").run();
  await database.prepare(`CREATE TABLE IF NOT EXISTS artwork_comments (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    artwork_code TEXT NOT NULL,
    parent_comment_id TEXT,
    body TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'visible',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run();
  const commentColumns = await database.prepare("PRAGMA table_info(artwork_comments)").all<{ name: string }>();
  if (!commentColumns.results.some((column) => column.name === "parent_comment_id")) {
    await database.prepare("ALTER TABLE artwork_comments ADD COLUMN parent_comment_id TEXT").run();
  }
  await database.prepare("CREATE INDEX IF NOT EXISTS artwork_comments_artwork_idx ON artwork_comments (artwork_code, created_at)").run();
  await database.prepare("CREATE INDEX IF NOT EXISTS artwork_comments_user_idx ON artwork_comments (user_id)").run();
  await database.prepare("CREATE INDEX IF NOT EXISTS artwork_comments_status_idx ON artwork_comments (status)").run();
  await database.prepare("CREATE INDEX IF NOT EXISTS artwork_comments_parent_idx ON artwork_comments (parent_comment_id)").run();
  await database.prepare(`CREATE TABLE IF NOT EXISTS artwork_comment_likes (
    user_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    comment_id TEXT NOT NULL REFERENCES artwork_comments(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, comment_id)
  )`).run();
  await database.prepare("CREATE INDEX IF NOT EXISTS artwork_comment_likes_comment_idx ON artwork_comment_likes (comment_id)").run();
  await database.prepare(`CREATE TABLE IF NOT EXISTS artwork_comment_reports (
    id TEXT PRIMARY KEY NOT NULL,
    comment_id TEXT NOT NULL REFERENCES artwork_comments(id) ON DELETE CASCADE,
    reporter_user_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run();
  await database.prepare("CREATE UNIQUE INDEX IF NOT EXISTS artwork_comment_reports_reporter_unique ON artwork_comment_reports (comment_id, reporter_user_id)").run();
  await database.prepare("CREATE INDEX IF NOT EXISTS artwork_comment_reports_status_idx ON artwork_comment_reports (status)").run();
  await database.prepare(`CREATE TABLE IF NOT EXISTS community_moderation_events (
    id TEXT PRIMARY KEY NOT NULL,
    moderator_user_id TEXT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    action TEXT NOT NULL,
    comment_id TEXT,
    target_user_id TEXT,
    note TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run();
  await database.prepare("CREATE INDEX IF NOT EXISTS community_moderation_events_created_idx ON community_moderation_events (created_at)").run();
  await database.prepare("CREATE INDEX IF NOT EXISTS community_moderation_events_action_idx ON community_moderation_events (action)").run();
  await database.prepare(`CREATE TABLE IF NOT EXISTS user_notifications (
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
  )`).run();
  await database.prepare("CREATE INDEX IF NOT EXISTS user_notifications_inbox_idx ON user_notifications(user_id, dismissed_at, read_at, created_at)").run();
  await database.prepare("CREATE UNIQUE INDEX IF NOT EXISTS user_notifications_group_unique ON user_notifications(user_id, group_key)").run();
}
