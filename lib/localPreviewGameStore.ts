// Archivio del Famiglio per le anteprime locali senza database: un file JSON per utente in .tmp.
// Prima questi dati andavano nei metadati dell'account Supabase reale e ingrossavano il cookie
// anche sul sito pubblico (vedi lib/accountMetadataSlim.ts). I vecchi dati nei metadati restano
// leggibili come riserva finché il file non esiste.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { User } from "@supabase/supabase-js";
import { LOCAL_PREVIEW_GAME_KEYS } from "@/lib/accountMetadataSlim";
import { netlifyDatabaseIsConfigured } from "@/lib/localAccountFallback";
import { getLoreWiseUser, isLocalLoreWiseRequest } from "@/lib/supabase/server";

type GameData = Record<string, unknown>;
const storeDirectory = path.join(process.cwd(), ".tmp", "local-preview-famiglio");

function storeFile(userId: string) {
  return path.join(storeDirectory, `${userId.replace(/[^a-zA-Z0-9-]/g, "")}.json`);
}

function pickGameKeys(source: Record<string, unknown> | null | undefined) {
  const picked: GameData = {};
  for (const key of LOCAL_PREVIEW_GAME_KEYS) if (source && key in source) picked[key] = source[key];
  return picked;
}

async function readStore(userId: string): Promise<GameData | null> {
  try { return JSON.parse(await readFile(storeFile(userId), "utf8")) as GameData; }
  catch { return null; }
}

/**
 * Utente per le rotte del Famiglio. In anteprima locale senza database i dati di gioco
 * vengono letti dal file locale; altrove l'utente resta invariato.
 */
export async function getFamiglioUser(): Promise<User | null> {
  const user = await getLoreWiseUser();
  if (!user || !(await isLocalLoreWiseRequest()) || netlifyDatabaseIsConfigured()) return user;
  const stored = await readStore(user.id);
  const metadata = { ...user.user_metadata };
  for (const key of LOCAL_PREVIEW_GAME_KEYS) delete metadata[key];
  return { ...user, user_metadata: { ...metadata, ...(stored ?? pickGameKeys(user.user_metadata)) } };
}

/** Salva nel file locale soltanto le chiavi di gioco; stessa forma di risposta di auth.updateUser. */
export async function saveLocalGameData(user: User, data: GameData) {
  const next = { ...pickGameKeys(user.user_metadata), ...pickGameKeys(data) };
  await mkdir(storeDirectory, { recursive: true });
  await writeFile(storeFile(user.id), JSON.stringify(next), "utf8");
  return { data: { user: { ...user, user_metadata: { ...user.user_metadata, ...next } } }, error: null };
}
