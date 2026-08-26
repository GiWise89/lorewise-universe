CREATE TABLE marketing_consent_events (
  id TEXT PRIMARY KEY NOT NULL,
  event_key TEXT UNIQUE,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  action TEXT NOT NULL,
  source TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX marketing_consent_customer_idx ON marketing_consent_events(customer_id, channel, created_at);
--> statement-breakpoint
CREATE TABLE marketing_campaigns (
  id TEXT PRIMARY KEY NOT NULL,
  code TEXT NOT NULL UNIQUE,
  audience TEXT NOT NULL DEFAULT 'studio_updates',
  subject TEXT NOT NULL,
  heading TEXT NOT NULL,
  body TEXT NOT NULL,
  action_label TEXT,
  action_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_by TEXT REFERENCES customers(id) ON DELETE SET NULL,
  recipient_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  queued_at TEXT,
  sent_at TEXT
);
--> statement-breakpoint
CREATE INDEX marketing_campaigns_status_idx ON marketing_campaigns(status, created_at);
--> statement-breakpoint
CREATE TABLE marketing_deliveries (
  id TEXT PRIMARY KEY NOT NULL,
  campaign_id TEXT NOT NULL REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
  recipient_email TEXT NOT NULL,
  unsubscribe_token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'queued',
  provider_message_id TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  sent_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX marketing_delivery_recipient_unique ON marketing_deliveries(campaign_id, customer_id);
--> statement-breakpoint
CREATE INDEX marketing_deliveries_status_idx ON marketing_deliveries(status, created_at);
