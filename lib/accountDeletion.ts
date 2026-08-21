export async function ensureAccountDeletionRequestsTable(database: D1Database) {
  await database.prepare(`CREATE TABLE IF NOT EXISTS account_deletion_requests (
    id TEXT PRIMARY KEY NOT NULL,
    customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending',
    requested_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    canceled_at TEXT,
    completed_at TEXT
  )`).run();
  await database.prepare("CREATE INDEX IF NOT EXISTS account_deletion_requests_customer_idx ON account_deletion_requests (customer_id)").run();
  await database.prepare("CREATE INDEX IF NOT EXISTS account_deletion_requests_status_idx ON account_deletion_requests (status)").run();
}
