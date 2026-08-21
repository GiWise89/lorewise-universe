import { ensureArtCommunityTables } from "@/lib/artCommunityServer";

export async function ensureGameCommunityTables(database: D1Database) {
  await ensureArtCommunityTables(database);
  await database.prepare(`CREATE TABLE IF NOT EXISTS game_ratings (
    user_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    game_code TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    game_version TEXT NOT NULL,
    comment_id TEXT NOT NULL UNIQUE REFERENCES artwork_comments(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, game_code)
  )`).run();
  await database.prepare("CREATE INDEX IF NOT EXISTS game_ratings_game_idx ON game_ratings (game_code, created_at)").run();
}
