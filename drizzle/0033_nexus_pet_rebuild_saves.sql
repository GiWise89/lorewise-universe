CREATE TABLE nexus_pet_rebuild_saves (
  customer_id TEXT PRIMARY KEY REFERENCES customers(id) ON DELETE CASCADE,
  save_json TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX nexus_pet_rebuild_saves_updated_idx ON nexus_pet_rebuild_saves(updated_at);
