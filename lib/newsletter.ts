// Logica pura di newsletter e avvisi: validazione, argomenti ammessi, token e decisioni
// del doppio consenso. Nessuna dipendenza dal runtime, così resta testabile con node --test.

export const NEWSLETTER_CONSENT_VERSION = "newsletter-2026-09-18";
export const NEWSLETTER_CONFIRM_TTL_HOURS = 48;

export const newsletterTopics = {
  cronache: { label: "Le Cronache del lunedì", description: "la lettera settimanale con uscite, giochi e novità dal Nexus" },
  "avvisami:demon-match-android": { label: "Demon Match Three su Android", description: "un solo avviso quando Demon Match Three sarà disponibile su Android" },
  "avvisami:sandbox": { label: "SandBox", description: "un solo avviso quando SandBox sarà giocabile" },
} as const;

export type NewsletterTopic = keyof typeof newsletterTopics;
export type NewsletterStatus = "pending" | "confirmed" | "unsubscribed";

export function isNewsletterTopic(value: unknown): value is NewsletterTopic {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(newsletterTopics, value);
}

export function newsletterTopicLabel(topic: NewsletterTopic) {
  return newsletterTopics[topic].label;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Normalizza l’indirizzo (spazi e maiuscole) e lo rifiuta se non plausibile. */
export function normalizeNewsletterEmail(value: unknown) {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (email.length < 6 || email.length > 254 || !emailPattern.test(email)) return null;
  return email;
}

export type NewsletterSignupValidation =
  | { ok: true; email: string; topic: NewsletterTopic }
  | { ok: false; reason: "invalid_body" | "honeypot" | "invalid_topic" | "invalid_email" | "consent_required"; error: string };

/**
 * Valida il corpo della richiesta di iscrizione. Il campo esca `website` deve restare vuoto:
 * se è compilato la richiesta viene scartata in silenzio dal chiamante.
 */
export function validateNewsletterSignup(body: unknown): NewsletterSignupValidation {
  if (typeof body !== "object" || body === null || Array.isArray(body)) return { ok: false, reason: "invalid_body", error: "Dati non validi." };
  const input = body as Record<string, unknown>;
  if (typeof input.website === "string" ? input.website.trim() !== "" : input.website != null) {
    return { ok: false, reason: "honeypot", error: "Richiesta scartata." };
  }
  if (!isNewsletterTopic(input.topic)) return { ok: false, reason: "invalid_topic", error: "Questo avviso non è disponibile." };
  const email = normalizeNewsletterEmail(input.email);
  if (!email) return { ok: false, reason: "invalid_email", error: "Inserisci un indirizzo email valido." };
  if (input.consent !== true) return { ok: false, reason: "consent_required", error: "Per iscriverti devi accettare l’informativa privacy." };
  return { ok: true, email, topic: input.topic };
}

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Token casuale da 256 bit in base64url (43 caratteri). */
export function createNewsletterToken() {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(32)));
}

export function isNewsletterToken(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{43}$/.test(value);
}

/** Impronta SHA-256 esadecimale: nel database viene salvata solo questa, mai il token di conferma. */
export async function hashNewsletterToken(token: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function isConfirmationExpired(sentAt: string | null | undefined, now: Date = new Date()) {
  const sent = sentAt ? Date.parse(sentAt) : Number.NaN;
  if (!Number.isFinite(sent)) return true;
  return now.getTime() - sent > NEWSLETTER_CONFIRM_TTL_HOURS * 60 * 60 * 1000;
}

/** Decide cosa fare quando arriva una richiesta per una coppia email/argomento. */
export function planNewsletterSignup(existingStatus: NewsletterStatus | string | null | undefined): "insert" | "refresh" | "noop" {
  if (!existingStatus) return "insert";
  return existingStatus === "confirmed" ? "noop" : "refresh";
}

export type NewsletterConfirmationOutcome = "confirm" | "already_confirmed" | "expired" | "invalid";

/** Decide l’esito di un link di conferma a partire dalla riga trovata tramite impronta del token. */
export function planNewsletterConfirmation(row: { status: string; confirm_sent_at: string | null } | null | undefined, now: Date = new Date()): NewsletterConfirmationOutcome {
  if (!row) return "invalid";
  if (row.status === "confirmed") return "already_confirmed";
  if (row.status !== "pending") return "invalid";
  return isConfirmationExpired(row.confirm_sent_at, now) ? "expired" : "confirm";
}

/** Risposta identica per indirizzi nuovi, già iscritti o scartati: non rivela mai se l’email esiste. */
export function newsletterAcceptedMessage(topic: NewsletterTopic) {
  return topic === "cronache"
    ? "Controlla la posta: ti abbiamo scritto per confermare l’iscrizione. Se non trovi il messaggio, guarda anche nello spam."
    : "Controlla la posta: conferma l’indirizzo e ti avviseremo appena ci sarà la novità.";
}
