import { env } from "@/lib/netlifyRuntime";

import type { User } from "@supabase/supabase-js";
import { ACCOUNT_PRIVACY_VERSION, LOREWISE_OWNER_EMAIL } from "@/lib/accountPolicy";
import { ensureAdminNotificationsTable } from "@/lib/adminNotifications";

type RuntimeEnv = { DB?: D1Database; LOREWISE_ADMIN_EMAILS?: string };

function configuredAdminEmails(runtime: RuntimeEnv) {
  const configured = runtime.LOREWISE_ADMIN_EMAILS?.split(",").map((email) => email.trim().toLocaleLowerCase("it")).filter(Boolean) ?? [];
  configured.push(LOREWISE_OWNER_EMAIL);
  return new Set(configured);
}

export async function ensureLoreWiseCustomersTable(database: D1Database) {
  await database.prepare(`CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY NOT NULL,
    email TEXT NOT NULL UNIQUE,
    display_name TEXT,
    role TEXT NOT NULL DEFAULT 'member',
    locale TEXT NOT NULL DEFAULT 'it-IT',
    community_emails INTEGER NOT NULL DEFAULT 0,
    studio_updates_emails INTEGER NOT NULL DEFAULT 0,
    codex_spoiler_preference TEXT NOT NULL DEFAULT 'protected',
    privacy_version TEXT,
    privacy_accepted_at TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    stripe_customer_id TEXT UNIQUE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run();
  await database.prepare("CREATE INDEX IF NOT EXISTS customers_email_idx ON customers (email)").run();
  await database.prepare("CREATE INDEX IF NOT EXISTS customers_status_idx ON customers (status)").run();
  const columns = await database.prepare("PRAGMA table_info(customers)").all<{ name: string }>();
  const names = new Set(columns.results.map((column) => column.name));
  if (!names.has("role")) await database.prepare("ALTER TABLE customers ADD COLUMN role TEXT NOT NULL DEFAULT 'member'").run();
  if (!names.has("locale")) await database.prepare("ALTER TABLE customers ADD COLUMN locale TEXT NOT NULL DEFAULT 'it-IT'").run();
  if (!names.has("community_emails")) await database.prepare("ALTER TABLE customers ADD COLUMN community_emails INTEGER NOT NULL DEFAULT 0").run();
  if (!names.has("studio_updates_emails")) await database.prepare("ALTER TABLE customers ADD COLUMN studio_updates_emails INTEGER NOT NULL DEFAULT 0").run();
  if (!names.has("codex_spoiler_preference")) await database.prepare("ALTER TABLE customers ADD COLUMN codex_spoiler_preference TEXT NOT NULL DEFAULT 'protected'").run();
  if (!names.has("privacy_version")) await database.prepare("ALTER TABLE customers ADD COLUMN privacy_version TEXT").run();
  if (!names.has("privacy_accepted_at")) await database.prepare("ALTER TABLE customers ADD COLUMN privacy_accepted_at TEXT").run();
  if (!names.has("username")) await database.prepare("ALTER TABLE customers ADD COLUMN username TEXT").run();
  if (!names.has("bio")) await database.prepare("ALTER TABLE customers ADD COLUMN bio TEXT").run();
  if (!names.has("avatar_object_key")) await database.prepare("ALTER TABLE customers ADD COLUMN avatar_object_key TEXT").run();
  if (!names.has("avatar_content_type")) await database.prepare("ALTER TABLE customers ADD COLUMN avatar_content_type TEXT").run();
  if (!names.has("profile_visibility")) await database.prepare("ALTER TABLE customers ADD COLUMN profile_visibility TEXT NOT NULL DEFAULT 'public'").run();
  await database.prepare("CREATE UNIQUE INDEX IF NOT EXISTS customers_username_unique ON customers(username)").run();
  if (!names.has("registration_notified_at")) {
    await database.prepare("ALTER TABLE customers ADD COLUMN registration_notified_at TEXT").run();
    await database.prepare("UPDATE customers SET registration_notified_at = created_at WHERE registration_notified_at IS NULL").run();
  }
}

export async function syncLoreWiseCustomer(user: User) {
  if (!user.email) throw new Error("L’identità verificata non contiene un indirizzo email.");
  const runtime = env as unknown as RuntimeEnv;
  const database = runtime.DB;
  if (!database) throw new Error("Database account non disponibile.");
  await ensureLoreWiseCustomersTable(database);
  const displayName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null;
  const privacyVersion = user.user_metadata?.privacy_version === ACCOUNT_PRIVACY_VERSION ? ACCOUNT_PRIVACY_VERSION : null;
  const privacyAcceptedAt = privacyVersion ? user.created_at : null;
  const communityEmails = user.user_metadata?.community_emails === true ? 1 : 0;
  const studioUpdatesEmails = user.user_metadata?.studio_updates_emails === true ? 1 : 0;
  const normalizedEmail = user.email.toLocaleLowerCase("it");
  const role = configuredAdminEmails(runtime).has(normalizedEmail) ? "admin" : "member";
  await database.prepare(`INSERT INTO customers (id, email, display_name, role, locale, community_emails,
      studio_updates_emails, privacy_version, privacy_accepted_at, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'it-IT', ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET email = excluded.email, display_name = excluded.display_name,
      role = CASE WHEN excluded.role = 'admin' THEN 'admin' ELSE customers.role END,
      privacy_version = COALESCE(customers.privacy_version, excluded.privacy_version),
      privacy_accepted_at = COALESCE(customers.privacy_accepted_at, excluded.privacy_accepted_at),
      status = CASE WHEN customers.status IN ('blocked', 'deletion_requested') THEN customers.status ELSE 'active' END,
      updated_at = CURRENT_TIMESTAMP`)
    .bind(user.id, normalizedEmail, displayName, role, communityEmails, studioUpdatesEmails, privacyVersion, privacyAcceptedAt)
    .run();

  const registration = await database.prepare("SELECT registration_notified_at FROM customers WHERE id = ?")
    .bind(user.id).first<{ registration_notified_at: string | null }>();
  if (!registration?.registration_notified_at) {
    try {
      await ensureAdminNotificationsTable(database);
      const identity = displayName?.trim() ? `${displayName.trim()} · ${normalizedEmail}` : normalizedEmail;
      await database.prepare(`INSERT OR IGNORE INTO admin_notifications
        (id, category, severity, title, message, reference_code, target_url, source_created_at)
        VALUES (?, 'user', 'info', 'Nuovo LoreWise ID registrato', ?, ?, '/admin#admin-users', ?)`)
        .bind(`user:${user.id}`, `${identity} ha creato un nuovo account.`, normalizedEmail, user.created_at)
        .run();
      await database.prepare("UPDATE customers SET registration_notified_at = CURRENT_TIMESTAMP WHERE id = ? AND registration_notified_at IS NULL")
        .bind(user.id).run();
    } catch {
      // La registrazione resta valida; il tentativo di notifica verrà ripetuto alla prossima sincronizzazione.
    }
  }
}
