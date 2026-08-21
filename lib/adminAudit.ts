export async function ensureAdminAuditTable(database: D1Database) {
  await database.prepare(`CREATE TABLE IF NOT EXISTS admin_audit_events (
    id TEXT PRIMARY KEY NOT NULL,
    admin_id TEXT NOT NULL,
    target_customer_id TEXT,
    action TEXT NOT NULL,
    previous_value TEXT,
    next_value TEXT,
    note TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES customers(id) ON DELETE RESTRICT,
    FOREIGN KEY (target_customer_id) REFERENCES customers(id) ON DELETE SET NULL
  )`).run();
  await database.prepare("CREATE INDEX IF NOT EXISTS admin_audit_created_idx ON admin_audit_events(created_at)").run();
  await database.prepare("CREATE INDEX IF NOT EXISTS admin_audit_target_idx ON admin_audit_events(target_customer_id, created_at)").run();
}

export async function recordAdminAudit(database: D1Database, input: {
  adminId: string;
  targetCustomerId?: string | null;
  action: string;
  previousValue?: string | null;
  nextValue?: string | null;
  note?: string | null;
}) {
  await ensureAdminAuditTable(database);
  await database.prepare(`INSERT INTO admin_audit_events
    (id, admin_id, target_customer_id, action, previous_value, next_value, note)
    VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .bind(crypto.randomUUID(), input.adminId, input.targetCustomerId ?? null, input.action,
      input.previousValue ?? null, input.nextValue ?? null, input.note?.slice(0, 500) ?? null).run();
}
