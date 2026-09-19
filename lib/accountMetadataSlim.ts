// I salvataggi del Famiglio delle anteprime locali finivano nei metadati dell'utente Supabase.
// Supabase copia i metadati dentro il token di accesso, quindi nel cookie: oltre ~20 KB Netlify
// risponde 400 a ogni pagina del sito. In produzione il gioco salva nel database, perciò queste
// chiavi non servono: dopo l'accesso vengono tolte e la sessione viene rigenerata leggera.
import type { SupabaseClient, User } from "@supabase/supabase-js";

export const LOCAL_PREVIEW_GAME_KEYS = [
  "nexus_pet_rebuild_save",
  "nexus_pet_rebuild_revision",
  "nexus_familiar_state",
  "nexus_familiar_revision",
  "nexus_familiar_slots",
] as const;

export function heavyGameMetadataKeys(user: Pick<User, "user_metadata"> | null | undefined) {
  const metadata = user?.user_metadata ?? {};
  return LOCAL_PREVIEW_GAME_KEYS.filter((key) => metadata[key] !== undefined && metadata[key] !== null);
}

/** Toglie dai metadati i salvataggi delle anteprime e rinnova la sessione. Restituisce true se ha alleggerito. */
export async function slimAccountMetadata(client: SupabaseClient, user: Pick<User, "user_metadata"> | null | undefined) {
  const keys = heavyGameMetadataKeys(user);
  if (!keys.length) return false;
  const { error } = await client.auth.updateUser({ data: Object.fromEntries(keys.map((key) => [key, null])) });
  if (error) return false;
  await client.auth.refreshSession();
  return true;
}

/** Nel browser: vero sui domini pubblici, falso su localhost e rete locale (dove le anteprime leggono ancora questi dati). */
export function isPublicBrowserHost(hostname: string) {
  const host = hostname.toLowerCase();
  return !(host === "localhost" || host === "127.0.0.1" || host === "[::1]"
    || /^192\.168\./.test(host) || /^10\./.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host));
}
