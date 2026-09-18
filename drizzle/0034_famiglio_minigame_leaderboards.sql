CREATE TABLE IF NOT EXISTS famiglio_matches (id TEXT PRIMARY KEY, customer_id TEXT NOT NULL, kind TEXT NOT NULL, seed BIGINT NOT NULL, started_at BIGINT NOT NULL, score INTEGER);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS famiglio_records (week TEXT NOT NULL, kind TEXT NOT NULL, customer_id TEXT NOT NULL, nickname TEXT NOT NULL, score INTEGER NOT NULL, achieved_at BIGINT NOT NULL, PRIMARY KEY(week,kind,customer_id));
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS famiglio_weekly_awards (week TEXT NOT NULL, kind TEXT NOT NULL, customer_id TEXT NOT NULL, coins INTEGER NOT NULL DEFAULT 100 CHECK(coins=100), claimed INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(week,kind));
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS famiglio_records_ranking ON famiglio_records(week,kind,score DESC,achieved_at,customer_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS famiglio_matches_owner ON famiglio_matches(customer_id,started_at);
