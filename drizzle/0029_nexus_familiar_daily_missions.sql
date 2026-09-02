CREATE TABLE nexus_familiar_daily_missions (
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  mission_date TEXT NOT NULL,
  slot INTEGER NOT NULL,
  mission_id TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  target_count INTEGER NOT NULL,
  progress_count INTEGER NOT NULL DEFAULT 0,
  reward_item TEXT NOT NULL,
  reward_quantity INTEGER NOT NULL,
  claimed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (customer_id, mission_date, slot),
  UNIQUE (customer_id, mission_date, mission_id)
);
--> statement-breakpoint
CREATE INDEX nexus_familiar_daily_missions_status_idx ON nexus_familiar_daily_missions(customer_id, mission_date, claimed_at);
--> statement-breakpoint
CREATE TABLE nexus_familiar_activity_events (
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  activity_date TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  source_key TEXT NOT NULL,
  quality_score INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (customer_id, activity_date, activity_type, source_key)
);
--> statement-breakpoint
CREATE INDEX nexus_familiar_activity_events_customer_idx ON nexus_familiar_activity_events(customer_id, activity_date, activity_type);
