CREATE TABLE IF NOT EXISTS newsletter_subscriptions (id TEXT PRIMARY KEY NOT NULL, email TEXT NOT NULL, topic TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','confirmed','unsubscribed')), confirm_token_hash TEXT, confirm_sent_at TEXT, unsubscribe_token TEXT NOT NULL UNIQUE, consent_version TEXT NOT NULL, consent_at TEXT NOT NULL, source TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, confirmed_at TEXT, unsubscribed_at TEXT, UNIQUE(email, topic));
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS newsletter_subscriptions_confirm_idx ON newsletter_subscriptions(confirm_token_hash);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS newsletter_subscriptions_topic_status_idx ON newsletter_subscriptions(topic, status);
