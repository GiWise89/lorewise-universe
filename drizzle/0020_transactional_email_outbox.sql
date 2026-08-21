CREATE TABLE transactional_emails (
  id TEXT PRIMARY KEY NOT NULL,
  event_key TEXT NOT NULL UNIQUE,
  customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
  recipient_email TEXT NOT NULL,
  template TEXT NOT NULL,
  subject TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  provider_message_id TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  sent_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX transactional_emails_status_idx ON transactional_emails(status, created_at);
CREATE INDEX transactional_emails_customer_idx ON transactional_emails(customer_id, created_at);
