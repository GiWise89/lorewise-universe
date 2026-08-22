export async function ensureAdminNotificationsTable(database: D1Database) {
  await database.prepare(`CREATE TABLE IF NOT EXISTS admin_notifications (
    id TEXT PRIMARY KEY NOT NULL,
    category TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'info',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    reference_code TEXT,
    target_url TEXT NOT NULL,
    source_created_at TEXT NOT NULL,
    read_at TEXT,
    dismissed_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run();
  const columns = await database.prepare("PRAGMA table_info(admin_notifications)").all<{ name: string }>();
  if (!columns.results.some((column) => column.name === "dismissed_at")) {
    await database.prepare("ALTER TABLE admin_notifications ADD COLUMN dismissed_at TEXT").run();
  }
  await database.prepare("CREATE INDEX IF NOT EXISTS admin_notifications_unread_idx ON admin_notifications(read_at, source_created_at)").run();
}

async function tableExists(database: D1Database, table: string) {
  const row = await database.prepare("SELECT 1 AS found FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1")
    .bind(table).first<{ found: number }>();
  return Boolean(row?.found);
}

export async function syncAdminNotifications(database: D1Database) {
  await ensureAdminNotificationsTable(database);

  if (await tableExists(database, "commission_requests")) {
    await database.prepare(`INSERT OR IGNORE INTO admin_notifications
      (id, category, severity, title, message, reference_code, target_url, source_created_at)
      SELECT 'commission:' || id, 'commission', 'high', 'Nuova richiesta di preventivo',
        name || ' ha inviato una richiesta per ' || package_name || '.', reference_code,
        '/gestione-commissioni', created_at
      FROM commission_requests WHERE status IN ('new', 'reviewing')`).run();
  }

  if (await tableExists(database, "orders")) {
    await database.prepare(`INSERT OR IGNORE INTO admin_notifications
      (id, category, severity, title, message, reference_code, target_url, source_created_at)
      SELECT 'purchase:' || id, 'purchase', 'high', 'Nuovo acquisto confermato',
        'Pagamento registrato per ' || reference_code || ' · ' || printf('%.2f', total_cents / 100.0) || ' ' || currency || '.',
        reference_code, '/gestione-ordini', COALESCE(paid_at, updated_at, created_at)
      FROM orders WHERE status = 'paid'`).run();
    await database.prepare(`INSERT OR IGNORE INTO admin_notifications
      (id, category, severity, title, message, reference_code, target_url, source_created_at)
      SELECT 'order-alert:' || status || ':' || id, 'payment', 'critical',
        CASE status WHEN 'disputed' THEN 'Pagamento contestato' WHEN 'refund_pending' THEN 'Rimborso in lavorazione' ELSE 'Problema di pagamento' END,
        'Controlla subito lo stato dell’ordine ' || reference_code || '.', reference_code,
        '/gestione-ordini', updated_at
      FROM orders WHERE status IN ('disputed', 'refund_pending', 'payment_issue')`).run();
  }

  if (await tableExists(database, "order_support_requests")) {
    await database.prepare(`INSERT OR IGNORE INTO admin_notifications
      (id, category, severity, title, message, reference_code, target_url, source_created_at)
      SELECT 'support:' || id, CASE request_type WHEN 'refund' THEN 'refund' ELSE 'support' END,
        CASE request_type WHEN 'refund' THEN 'critical' ELSE 'high' END,
        CASE request_type WHEN 'refund' THEN 'Nuova richiesta di rimborso' ELSE 'Nuova richiesta di assistenza' END,
        reason, reference_code, '/gestione-ordini', created_at
      FROM order_support_requests WHERE status IN ('open', 'reviewing', 'approved')`).run();
  }

  if (await tableExists(database, "support_tickets")) {
    await database.prepare(`INSERT OR IGNORE INTO admin_notifications
      (id, category, severity, title, message, reference_code, target_url, source_created_at)
      SELECT 'support-ticket:' || id, 'support',
        CASE priority WHEN 'critical' THEN 'critical' WHEN 'high' THEN 'high' ELSE 'medium' END,
        'Richiesta di assistenza: ' || subject, description, reference_code,
        '/gestione-assistenza', created_at
      FROM support_tickets WHERE status IN ('open', 'reviewing', 'waiting_user')`).run();
  }

  if (await tableExists(database, "artwork_comment_reports")) {
    await database.prepare(`INSERT OR IGNORE INTO admin_notifications
      (id, category, severity, title, message, reference_code, target_url, source_created_at)
      SELECT 'community:' || id, 'community', 'high', 'Nuova segnalazione Community',
        reason, comment_id, '/gestione-community', created_at
      FROM artwork_comment_reports WHERE status = 'open'`).run();
  }

  if (await tableExists(database, "artwork_delivery_files")) {
    await database.prepare(`INSERT OR IGNORE INTO admin_notifications
      (id, category, severity, title, message, reference_code, target_url, source_created_at)
      SELECT 'art-delivery:' || id, 'delivery', 'medium', 'Pacchetto Arte da verificare',
        filename || ' attende il controllo qualità.', artwork_code,
        '/gestione-consegne-arte', created_at
      FROM artwork_delivery_files WHERE status != 'approved'`).run();
  }

  if (await tableExists(database, "game_delivery_files")) {
    await database.prepare(`INSERT OR IGNORE INTO admin_notifications
      (id, category, severity, title, message, reference_code, target_url, source_created_at)
      SELECT 'game-delivery:' || id, 'delivery', 'medium', 'Build di gioco da verificare',
        filename || ' attende il controllo qualità.', product_code,
        '/gestione-consegne-giochi', created_at
      FROM game_delivery_files WHERE status != 'approved'`).run();
  }

  if (await tableExists(database, "transactional_emails")) {
    await database.prepare(`INSERT OR IGNORE INTO admin_notifications
      (id, category, severity, title, message, reference_code, target_url, source_created_at)
      SELECT 'email-failed:' || id, 'email', 'critical', 'Email transazionale non consegnata',
        subject || ' · ' || recipient_email, event_key, '/gestione-email', updated_at
      FROM transactional_emails WHERE status = 'failed'`).run();
  }
}
