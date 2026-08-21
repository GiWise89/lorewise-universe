import { ACCOUNT_PROFILE_LIMITS } from "@/lib/accountPolicy";
import { ensureAccountDeletionRequestsTable } from "@/lib/accountDeletion";
import { syncLoreWiseCustomer } from "@/lib/supabase/customer";
import { getLoreWiseUser } from "@/lib/supabase/server";

type RuntimeEnv = { DB?: D1Database };

type CustomerProfileRow = {
  email: string;
  display_name: string | null;
  role: string;
  locale: string;
  community_emails: number;
  studio_updates_emails: number;
  codex_spoiler_preference: string;
  privacy_version: string | null;
  privacy_accepted_at: string | null;
  created_at: string;
  updated_at: string;
  status: string;
  deletion_requested_at: string | null;
};

async function authenticatedCustomer() {
  const user = await getLoreWiseUser();
  if (!user) return { error: Response.json({ error: "Sessione non valida." }, { status: 401 }) };
  const { env } = await import("cloudflare:workers");
  const database = (env as unknown as RuntimeEnv).DB;
  if (!database) return { error: Response.json({ error: "Archivio personale non disponibile." }, { status: 503 }) };
  await syncLoreWiseCustomer(user);
  await ensureAccountDeletionRequestsTable(database);
  return { database, user };
}

function publicProfile(row: CustomerProfileRow) {
  return {
    email: row.email,
    displayName: row.display_name ?? "",
    role: row.role,
    locale: row.locale,
    communityEmails: Boolean(row.community_emails),
    studioUpdatesEmails: Boolean(row.studio_updates_emails),
    codexSpoilerPreference: row.codex_spoiler_preference === "open" ? "open" : "protected",
    privacyVersion: row.privacy_version,
    privacyAcceptedAt: row.privacy_accepted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    status: row.status,
    deletionRequestedAt: row.deletion_requested_at,
  };
}

async function readProfile(database: D1Database, userId: string) {
  return database.prepare(`SELECT customers.email, customers.display_name, customers.role, customers.locale,
    customers.community_emails, customers.studio_updates_emails, customers.codex_spoiler_preference, customers.privacy_version,
    customers.privacy_accepted_at, customers.created_at, customers.updated_at, customers.status,
    (SELECT requested_at FROM account_deletion_requests WHERE customer_id = customers.id AND status = 'pending'
      ORDER BY requested_at DESC LIMIT 1) AS deletion_requested_at
    FROM customers WHERE customers.id = ?`)
    .bind(userId).first<CustomerProfileRow>();
}

export async function GET() {
  try {
    const authenticated = await authenticatedCustomer();
    if (authenticated.error) return authenticated.error;
    const row = await readProfile(authenticated.database, authenticated.user.id);
    if (!row) return Response.json({ error: "Profilo non trovato." }, { status: 404 });
    return Response.json({ profile: publicProfile(row) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return Response.json({ error: "Non è stato possibile caricare il profilo." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  try {
    const authenticated = await authenticatedCustomer();
    if (authenticated.error) return authenticated.error;
    const body = await request.json() as Record<string, unknown>;
    const currentProfile = await readProfile(authenticated.database, authenticated.user.id);
    if (!currentProfile) return Response.json({ error: "Profilo non trovato." }, { status: 404 });
    const displayName = typeof body.displayName === "string" ? body.displayName.trim() : (currentProfile.display_name ?? "");
    if (displayName.length > ACCOUNT_PROFILE_LIMITS.displayName) {
      return Response.json({ error: `Il nome pubblico non può superare ${ACCOUNT_PROFILE_LIMITS.displayName} caratteri.` }, { status: 400 });
    }
    const communityEmails = typeof body.communityEmails === "boolean" ? body.communityEmails : Boolean(currentProfile.community_emails);
    const studioUpdatesEmails = typeof body.studioUpdatesEmails === "boolean" ? body.studioUpdatesEmails : Boolean(currentProfile.studio_updates_emails);
    const codexSpoilerPreference = typeof body.codexSpoilerPreference === "string" ? body.codexSpoilerPreference : currentProfile.codex_spoiler_preference;
    if (!['protected', 'open'].includes(codexSpoilerPreference)) return Response.json({ error: "Preferenza spoiler non valida." }, { status: 400 });
    const current = await authenticated.database.prepare("SELECT status FROM customers WHERE id = ?").bind(authenticated.user.id).first<{ status: string }>();
    if (current?.status === "deletion_requested") return Response.json({ error: "Annulla prima la richiesta di cancellazione per modificare il profilo." }, { status: 409 });
    await authenticated.database.prepare(`UPDATE customers SET display_name = ?, community_emails = ?,
      studio_updates_emails = ?, codex_spoiler_preference = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .bind(displayName || null, communityEmails ? 1 : 0, studioUpdatesEmails ? 1 : 0, codexSpoilerPreference, authenticated.user.id)
      .run();
    const row = await readProfile(authenticated.database, authenticated.user.id);
    return Response.json({ profile: publicProfile(row!), message: "Profilo e preferenze aggiornati." }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return Response.json({ error: "Non è stato possibile salvare le preferenze." }, { status: 503 });
  }
}
