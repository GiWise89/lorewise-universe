CREATE TABLE nexus_familiars (
  customer_id TEXT PRIMARY KEY NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  state_json TEXT NOT NULL,
  state_version INTEGER NOT NULL DEFAULT 1,
  revision INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX nexus_familiars_updated_idx ON nexus_familiars(updated_at);
