CREATE TABLE nexus_familiar_economy_events (
  id TEXT PRIMARY KEY NOT NULL,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  familiar_id TEXT,
  event_type TEXT NOT NULL,
  source_key TEXT NOT NULL,
  coin_delta INTEGER NOT NULL DEFAULT 0,
  balance_before INTEGER NOT NULL DEFAULT 0,
  balance_after INTEGER NOT NULL DEFAULT 0,
  experience_delta INTEGER NOT NULL DEFAULT 0,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(customer_id, source_key)
);
--> statement-breakpoint
CREATE INDEX nexus_familiar_economy_customer_idx ON nexus_familiar_economy_events(customer_id, created_at);
--> statement-breakpoint
CREATE TABLE nexus_familiar_sync_events (
  id TEXT PRIMARY KEY NOT NULL,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  familiar_id TEXT,
  action TEXT NOT NULL,
  revision_before INTEGER NOT NULL DEFAULT 0,
  revision_after INTEGER NOT NULL DEFAULT 0,
  device_hint TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX nexus_familiar_sync_customer_idx ON nexus_familiar_sync_events(customer_id, created_at);
