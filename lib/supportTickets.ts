export type SupportTicketStatus = "open" | "reviewing" | "waiting_user" | "resolved" | "closed";

export async function ensureSupportTicketTables(database: D1Database) {
  await database.prepare(`CREATE TABLE IF NOT EXISTS support_tickets (
    id TEXT PRIMARY KEY NOT NULL,
    reference_code TEXT NOT NULL UNIQUE,
    customer_id TEXT NOT NULL,
    category TEXT NOT NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    product_code TEXT,
    status TEXT NOT NULL DEFAULT 'open',
    priority TEXT NOT NULL DEFAULT 'normal',
    admin_notes TEXT,
    resolved_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
  )`).run();
  await database.prepare("CREATE INDEX IF NOT EXISTS support_tickets_customer_idx ON support_tickets(customer_id, created_at)").run();
  await database.prepare("CREATE INDEX IF NOT EXISTS support_tickets_status_idx ON support_tickets(status, priority, created_at)").run();
}

export function makeSupportReference() {
  return `LW-SUP-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${crypto.randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase()}`;
}
