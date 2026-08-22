CREATE TABLE "site_page_views" (
  "id" text PRIMARY KEY NOT NULL,
  "site_host" text NOT NULL,
  "path" text NOT NULL,
  "session_hash" text NOT NULL,
  "referrer_host" text,
  "created_at" text DEFAULT (CURRENT_TIMESTAMP::text) NOT NULL
);

CREATE INDEX "site_page_views_created_idx" ON "site_page_views" ("created_at");
CREATE INDEX "site_page_views_path_idx" ON "site_page_views" ("path", "created_at");
CREATE INDEX "site_page_views_session_idx" ON "site_page_views" ("session_hash", "created_at");
