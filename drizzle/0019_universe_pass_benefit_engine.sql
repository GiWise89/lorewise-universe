ALTER TABLE orders ADD COLUMN discount_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN benefit_plan_code TEXT;
ALTER TABLE orders ADD COLUMN benefit_discount_percent INTEGER NOT NULL DEFAULT 0;

CREATE TABLE benefit_ledger (
  id TEXT PRIMARY KEY NOT NULL,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  subscription_id TEXT REFERENCES subscriptions(id) ON DELETE SET NULL,
  source_key TEXT NOT NULL UNIQUE,
  benefit_type TEXT NOT NULL,
  amount INTEGER NOT NULL DEFAULT 0,
  remaining INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  assigned_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT,
  used_at TEXT,
  resource_code TEXT,
  metadata_json TEXT
);
CREATE INDEX benefit_ledger_customer_idx ON benefit_ledger(customer_id, status);
CREATE INDEX benefit_ledger_expiry_idx ON benefit_ledger(expires_at);

CREATE TABLE benefit_events (
  id TEXT PRIMARY KEY NOT NULL,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  benefit_type TEXT NOT NULL,
  action TEXT NOT NULL,
  amount INTEGER NOT NULL DEFAULT 0,
  reference_code TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX benefit_events_customer_idx ON benefit_events(customer_id, created_at);

CREATE TABLE member_benefit_claims (
  id TEXT PRIMARY KEY NOT NULL,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  benefit_code TEXT NOT NULL,
  resource_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX member_benefit_claim_unique ON member_benefit_claims(customer_id, benefit_code, resource_code);
CREATE INDEX member_benefit_claim_customer_idx ON member_benefit_claims(customer_id, status);

CREATE TABLE codex_bookmarks (
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  entry_slug TEXT NOT NULL,
  collection_name TEXT NOT NULL DEFAULT 'Preferiti',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(customer_id, entry_slug)
);
CREATE INDEX codex_bookmarks_customer_idx ON codex_bookmarks(customer_id, collection_name);

CREATE TABLE studio_poll_votes (
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  poll_code TEXT NOT NULL,
  option_code TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(customer_id, poll_code)
);
CREATE INDEX studio_poll_votes_poll_idx ON studio_poll_votes(poll_code, option_code);
