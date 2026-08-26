import { env } from "@/lib/netlifyRuntime";

import { ACCOUNT_PROFILE_LIMITS } from "@/lib/accountPolicy";
import { avatarUrl, normalizeUsername, usernameError } from "@/lib/publicProfile";
import { ensureAccountDeletionRequestsTable } from "@/lib/accountDeletion";
import { localAccountProfile, netlifyDatabaseIsConfigured } from "@/lib/localAccountFallback";
import { syncLoreWiseCustomer } from "@/lib/supabase/customer";
import { createLoreWiseServerClient, getLoreWiseUser, isLocalLoreWiseRequest } from "@/lib/supabase/server";
import { profileCompletion } from "@/lib/profileCompletion";
import { recordMarketingConsent } from "@/lib/marketingEmail";

type RuntimeEnv = { DB?: D1Database; LOREWISE_ADMIN_EMAILS?: string };

type CustomerProfileRow = {
  email: string;
  display_name: string | null;
  username: string | null;
  bio: string | null;
  avatar_object_key: string | null;
  profile_visibility: string;
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
  const database = (env as unknown as RuntimeEnv).DB;
  if (!database) return { error: Response.json({ error: "Archivio personale non disponibile." }, { status: 503 }) };
  await syncLoreWiseCustomer(user);
  await ensureAccountDeletionRequestsTable(database);
  return { database, user };
}

function publicProfile(row: CustomerProfileRow) {
  const completion = profileCompletion({ displayName: row.display_name, username: row.username });
  return {
    email: row.email,
    displayName: row.display_name ?? "",
    username: row.username ?? "",
    bio: row.bio ?? "",
    profileVisibility: row.profile_visibility === "private" ? "private" : "public",
    avatarUrl: avatarUrl(row.username, Boolean(row.avatar_object_key)),
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
    ...completion,
  };
}

async function readProfile(database: D1Database, userId: string) {
  return database.prepare(`SELECT customers.email, customers.display_name, customers.username, customers.bio,
    customers.avatar_object_key, customers.profile_visibility, customers.role, customers.locale,
    customers.community_emails, customers.studio_updates_emails, customers.codex_spoiler_preference, customers.privacy_version,
    customers.privacy_accepted_at, customers.created_at, customers.updated_at, customers.status,
    (SELECT requested_at FROM account_deletion_requests WHERE customer_id = customers.id AND status = 'pending'
      ORDER BY requested_at DESC LIMIT 1) AS deletion_requested_at
    FROM customers WHERE customers.id = ?`)
    .bind(userId).first<CustomerProfileRow>();
}

export async function GET() {
  try {
    const user = await getLoreWiseUser();
    if (!user?.email) return Response.json({ error: "Sessione non valida." }, { status: 401 });
    if (await isLocalLoreWiseRequest() && !netlifyDatabaseIsConfigured()) {
      const profile = localAccountProfile(user, env as unknown as RuntimeEnv);
      return Response.json({ profile: { ...profile, ...profileCompletion(profile) }, localPreview: true }, {
        headers: { "Cache-Control": "private, no-store" },
      });
    }
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
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) return Response.json({ error: "Origine non valida." }, { status: 403 });
    const localUser = await getLoreWiseUser();
    if (!localUser?.email) return Response.json({ error: "Sessione non valida." }, { status: 401 });
    if (await isLocalLoreWiseRequest() && !netlifyDatabaseIsConfigured()) {
      const body = await request.json() as Record<string, unknown>;
      const currentProfile = localAccountProfile(localUser, env as unknown as RuntimeEnv);
      const displayName = typeof body.displayName === "string" ? body.displayName.trim() : currentProfile.displayName;
      if (displayName.length > ACCOUNT_PROFILE_LIMITS.displayName) {
        return Response.json({ error: `Il nome pubblico non puo superare ${ACCOUNT_PROFILE_LIMITS.displayName} caratteri.` }, { status: 400 });
      }
      const username = typeof body.username === "string" ? normalizeUsername(body.username) : currentProfile.username;
      if (username) {
        const invalidUsername = usernameError(username, { allowGiwiseForAdmin: currentProfile.role === "admin" });
        if (invalidUsername) return Response.json({ error: invalidUsername }, { status: 400 });
      }
      const bio = typeof body.bio === "string" ? body.bio.trim() : currentProfile.bio;
      if (bio.length > ACCOUNT_PROFILE_LIMITS.bio) return Response.json({ error: `La biografia non può superare ${ACCOUNT_PROFILE_LIMITS.bio} caratteri.` }, { status: 400 });
      const profileVisibility = body.profileVisibility === "private" ? "private" : "public";
      const communityEmails = typeof body.communityEmails === "boolean" ? body.communityEmails : currentProfile.communityEmails;
      const studioUpdatesEmails = typeof body.studioUpdatesEmails === "boolean" ? body.studioUpdatesEmails : currentProfile.studioUpdatesEmails;
      const codexSpoilerPreference = typeof body.codexSpoilerPreference === "string" ? body.codexSpoilerPreference : currentProfile.codexSpoilerPreference;
      if (!["protected", "open"].includes(codexSpoilerPreference)) {
        return Response.json({ error: "Preferenza spoiler non valida." }, { status: 400 });
      }
      const client = await createLoreWiseServerClient();
      if (!client) return Response.json({ error: "Servizio account non disponibile." }, { status: 503 });
      const { data, error } = await client.auth.updateUser({
        data: {
          ...localUser.user_metadata,
          full_name: displayName || null,
          username: username || null,
          bio: bio || null,
          profile_visibility: profileVisibility,
          community_emails: communityEmails,
          studio_updates_emails: studioUpdatesEmails,
          codex_spoiler_preference: codexSpoilerPreference,
        },
      });
      if (error || !data.user) return Response.json({ error: "Non e stato possibile salvare le preferenze." }, { status: 503 });
      const profile = localAccountProfile(data.user, env as unknown as RuntimeEnv);
      return Response.json({
        profile: { ...profile, ...profileCompletion(profile) },
        message: "Profilo e preferenze aggiornati.",
        localPreview: true,
      }, { headers: { "Cache-Control": "private, no-store" } });
    }
    const authenticated = await authenticatedCustomer();
    if (authenticated.error) return authenticated.error;
    const body = await request.json() as Record<string, unknown>;
    const currentProfile = await readProfile(authenticated.database, authenticated.user.id);
    if (!currentProfile) return Response.json({ error: "Profilo non trovato." }, { status: 404 });
    const displayName = typeof body.displayName === "string" ? body.displayName.trim() : (currentProfile.display_name ?? "");
    if (displayName.length > ACCOUNT_PROFILE_LIMITS.displayName) {
      return Response.json({ error: `Il nome pubblico non può superare ${ACCOUNT_PROFILE_LIMITS.displayName} caratteri.` }, { status: 400 });
    }
    const username = typeof body.username === "string" ? normalizeUsername(body.username) : (currentProfile.username ?? "");
    if (username) {
      const invalidUsername = usernameError(username, { allowGiwiseForAdmin: currentProfile.role === "admin" });
      if (invalidUsername) return Response.json({ error: invalidUsername }, { status: 400 });
      const conflict = await authenticated.database.prepare("SELECT id FROM customers WHERE username = ? AND id <> ? LIMIT 1")
        .bind(username, authenticated.user.id).first();
      if (conflict) return Response.json({ error: "Questo nickname è già utilizzato." }, { status: 409 });
    }
    const bio = typeof body.bio === "string" ? body.bio.trim() : (currentProfile.bio ?? "");
    if (bio.length > ACCOUNT_PROFILE_LIMITS.bio) return Response.json({ error: `La biografia non può superare ${ACCOUNT_PROFILE_LIMITS.bio} caratteri.` }, { status: 400 });
    const profileVisibility = body.profileVisibility === "private" ? "private" : "public";
    const communityEmails = typeof body.communityEmails === "boolean" ? body.communityEmails : Boolean(currentProfile.community_emails);
    const studioUpdatesEmails = typeof body.studioUpdatesEmails === "boolean" ? body.studioUpdatesEmails : Boolean(currentProfile.studio_updates_emails);
    const codexSpoilerPreference = typeof body.codexSpoilerPreference === "string" ? body.codexSpoilerPreference : currentProfile.codex_spoiler_preference;
    if (!['protected', 'open'].includes(codexSpoilerPreference)) return Response.json({ error: "Preferenza spoiler non valida." }, { status: 400 });
    const current = await authenticated.database.prepare("SELECT status FROM customers WHERE id = ?").bind(authenticated.user.id).first<{ status: string }>();
    if (current?.status === "deletion_requested") return Response.json({ error: "Annulla prima la richiesta di cancellazione per modificare il profilo." }, { status: 409 });
    await authenticated.database.prepare(`UPDATE customers SET display_name = ?, username = ?, bio = ?, profile_visibility = ?, community_emails = ?,
      studio_updates_emails = ?, codex_spoiler_preference = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .bind(displayName || null, username || null, bio || null, profileVisibility, communityEmails ? 1 : 0, studioUpdatesEmails ? 1 : 0, codexSpoilerPreference, authenticated.user.id)
      .run();
    if (communityEmails !== Boolean(currentProfile.community_emails)) {
      await recordMarketingConsent(authenticated.database, { customerId: authenticated.user.id, channel: "community", granted: communityEmails, source: "account" });
    }
    if (studioUpdatesEmails !== Boolean(currentProfile.studio_updates_emails)) {
      await recordMarketingConsent(authenticated.database, { customerId: authenticated.user.id, channel: "studio_updates", granted: studioUpdatesEmails, source: "account" });
    }
    const row = await readProfile(authenticated.database, authenticated.user.id);
    return Response.json({ profile: publicProfile(row!), message: "Profilo e preferenze aggiornati." }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return Response.json({ error: "Non è stato possibile salvare le preferenze." }, { status: 503 });
  }
}
