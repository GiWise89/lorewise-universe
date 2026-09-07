CREATE TABLE IF NOT EXISTS familiar_commission_rewards (
  id TEXT PRIMARY KEY NOT NULL,
  customer_id TEXT NOT NULL,
  reward_code TEXT NOT NULL,
  required_level INTEGER NOT NULL,
  discount_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'eligible',
  claimed_request_id TEXT UNIQUE,
  claimed_at TEXT,
  redeemed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (claimed_request_id) REFERENCES commission_requests(id) ON DELETE SET NULL,
  UNIQUE (customer_id, reward_code)
);

CREATE INDEX IF NOT EXISTS familiar_commission_rewards_customer_idx
  ON familiar_commission_rewards(customer_id, status);
