CREATE TABLE IF NOT EXISTS nexus_familiar_slots (
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  familiar_id TEXT NOT NULL,
  state_json TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (customer_id, familiar_id)
);
CREATE INDEX IF NOT EXISTS nexus_familiar_slots_customer_idx ON nexus_familiar_slots(customer_id, updated_at);
