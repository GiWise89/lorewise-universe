export async function createUserNotification(database: D1Database, input: {
  userId: string;
  actorUserId?: string | null;
  type: "reply" | "comment_like" | "moderation";
  artworkCode?: string | null;
  commentId?: string | null;
  title: string;
  message: string;
  targetUrl: string;
  groupKey?: string | null;
}) {
  if (input.actorUserId && input.actorUserId === input.userId) return;
  const id = crypto.randomUUID();
  if (input.groupKey) {
    await database.prepare(`INSERT INTO user_notifications
      (id, user_id, actor_user_id, type, artwork_code, comment_id, title, message, target_url, group_key)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, group_key) DO UPDATE SET actor_user_id = excluded.actor_user_id,
        title = excluded.title, message = excluded.message, target_url = excluded.target_url,
        read_at = NULL, dismissed_at = NULL, updated_at = CURRENT_TIMESTAMP`)
      .bind(id, input.userId, input.actorUserId ?? null, input.type, input.artworkCode ?? null,
        input.commentId ?? null, input.title, input.message, input.targetUrl, input.groupKey).run();
    return;
  }
  await database.prepare(`INSERT INTO user_notifications
    (id, user_id, actor_user_id, type, artwork_code, comment_id, title, message, target_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(id, input.userId, input.actorUserId ?? null, input.type, input.artworkCode ?? null,
      input.commentId ?? null, input.title, input.message, input.targetUrl).run();
}
