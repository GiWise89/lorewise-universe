export type LivingGuideSnapshot = {
  guideSlug: string;
  checkedAt: string;
  fingerprint: string;
  signals: string[];
};

export const WORLD_OF_WARCRAFT_MONITOR = {
  guideSlug: "world-of-warcraft",
  guideTitle: "World of Warcraft",
  notificationTarget: "/notifiche",
  sourceUrls: [
    "https://worldofwarcraft.blizzard.com/en-us/news/",
    "https://worldofwarcraft.blizzard.com/en-us/midnight",
    "https://worldofwarcraft.blizzard.com/en-us/news/24295090",
  ],
} as const;

const RELEVANT_TERMS = /midnight|hotfix|content update|season|class|talent|dungeon|raid|mythic|delve|prey|pvp|housing|profession|warband|patch|ula.?tek/i;

export function extractLivingGuideSignals(html: string) {
  const headings = [...html.matchAll(/<(?:title|h1|h2|h3)[^>]*>([\s\S]*?)<\/(?:title|h1|h2|h3)>/gi)]
    .map((match) => match[1]
      .replace(/<[^>]+>/g, " ")
      .replace(/&(?:nbsp|#160);/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&#39;|&apos;/gi, "'")
      .replace(/&quot;/gi, '"')
      .replace(/\s+/g, " ")
      .trim())
    .filter((value) => value.length >= 8 && value.length <= 240 && RELEVANT_TERMS.test(value));
  return [...new Set(headings)].sort((left, right) => left.localeCompare(right, "en"));
}

export async function fingerprintLivingGuideSignals(signals: string[]) {
  const bytes = new TextEncoder().encode(signals.join("\n"));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, "0")).join("");
}

export function livingGuideChanged(previous: LivingGuideSnapshot | null, current: LivingGuideSnapshot) {
  return Boolean(previous && previous.fingerprint !== current.fingerprint);
}

export function buildLivingGuideNotification(snapshot: LivingGuideSnapshot) {
  const shortFingerprint = snapshot.fingerprint.slice(0, 12);
  return {
    id: `living-guide:${snapshot.guideSlug}:${shortFingerprint}`,
    category: "living-guide",
    severity: "medium",
    title: "World of Warcraft: novitÃ  da verificare",
    message: "Il controllo mensile ha rilevato cambiamenti nelle fonti ufficiali. Controlla le novitÃ  e decidi se aggiornare la Guida Viva: nessun contenuto Ã¨ stato pubblicato automaticamente.",
    referenceCode: `LW-LIVE-WOW-${shortFingerprint.toUpperCase()}`,
    targetUrl: "/notifiche",
    sourceCreatedAt: snapshot.checkedAt,
  };
}
