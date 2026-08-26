ALTER TABLE commission_requests ADD COLUMN pricing_discount_code TEXT;
--> statement-breakpoint
ALTER TABLE commission_requests ADD COLUMN pricing_discount_label TEXT;
--> statement-breakpoint
ALTER TABLE commission_requests ADD COLUMN pricing_discount_kind TEXT;
--> statement-breakpoint
ALTER TABLE commission_requests ADD COLUMN pricing_discount_value INTEGER;
--> statement-breakpoint
CREATE TABLE commission_offer_entitlements (
  id TEXT PRIMARY KEY NOT NULL,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  offer_code TEXT NOT NULL,
  discount_cents INTEGER NOT NULL,
  registered_at TEXT NOT NULL,
  confirmed_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'eligible',
  claimed_request_id TEXT UNIQUE REFERENCES commission_requests(id) ON DELETE SET NULL,
  claimed_at TEXT,
  redeemed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX commission_offer_entitlements_customer_offer_unique ON commission_offer_entitlements(customer_id, offer_code);
--> statement-breakpoint
CREATE INDEX commission_offer_entitlements_customer_idx ON commission_offer_entitlements(customer_id, status);
--> statement-breakpoint
CREATE INDEX commission_offer_entitlements_expiry_idx ON commission_offer_entitlements(expires_at, status);
