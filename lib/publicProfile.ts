import { ACCOUNT_PROFILE_LIMITS } from "@/lib/accountPolicy";

const RESERVED_USERNAMES = new Set(["admin", "account", "api", "giwise", "lorewise", "moderatore", "supporto", "vip"]);

export function normalizeUsername(value: string) {
  return value.trim().toLocaleLowerCase("it");
}

export function usernameError(value: string, options?: { allowGiwiseForAdmin?: boolean }) {
  const username = normalizeUsername(value);
  if (username.length < 3 || username.length > ACCOUNT_PROFILE_LIMITS.username) return "Il nickname deve contenere da 3 a 24 caratteri.";
  if (!/^[a-z0-9][a-z0-9._]*$/.test(username)) return "Usa lettere minuscole, numeri, punto o trattino basso; inizia con una lettera o un numero.";
  if (RESERVED_USERNAMES.has(username) && !(username === "giwise" && options?.allowGiwiseForAdmin)) return "Questo nickname è riservato.";
  return null;
}

export function avatarUrl(username: string | null, hasAvatar: boolean) {
  return username && hasAvatar ? `/api/profile-avatar/${encodeURIComponent(username)}` : null;
}
