import type { User } from "@supabase/supabase-js";

import { ACCOUNT_PRIVACY_VERSION, LOREWISE_OWNER_EMAIL } from "@/lib/accountPolicy";

type RuntimeEnv = { LOREWISE_ADMIN_EMAILS?: string };

function metadataString(user: User, key: string) {
  const value = user.user_metadata?.[key];
  return typeof value === "string" ? value.trim() : "";
}

export function netlifyDatabaseIsConfigured() {
  return Boolean(process.env.NETLIFY_DB_URL?.trim());
}

export function localAccountRole(user: User, runtime: RuntimeEnv = {}) {
  const admins = new Set(
    (runtime.LOREWISE_ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLocaleLowerCase("it"))
      .filter(Boolean),
  );
  admins.add(LOREWISE_OWNER_EMAIL);
  return admins.has(user.email?.trim().toLocaleLowerCase("it") ?? "") ? "admin" : "member";
}

export function localAccountProfile(user: User, runtime: RuntimeEnv = {}) {
  const displayName = metadataString(user, "full_name")
    || metadataString(user, "display_name")
    || metadataString(user, "name");
  const privacyVersion = metadataString(user, "privacy_version") === ACCOUNT_PRIVACY_VERSION
    ? ACCOUNT_PRIVACY_VERSION
    : null;

  return {
    email: user.email ?? "",
    displayName,
    role: localAccountRole(user, runtime),
    locale: metadataString(user, "locale") || "it-IT",
    communityEmails: user.user_metadata?.community_emails === true,
    studioUpdatesEmails: user.user_metadata?.studio_updates_emails === true,
    codexSpoilerPreference: user.user_metadata?.codex_spoiler_preference === "open" ? "open" : "protected",
    privacyVersion,
    privacyAcceptedAt: privacyVersion ? user.created_at : null,
    createdAt: user.created_at,
    updatedAt: user.updated_at ?? user.created_at,
    status: "active",
    deletionRequestedAt: null,
  };
}
