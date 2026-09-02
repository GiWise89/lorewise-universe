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
    "https://worldofwarcraft.blizzard.com/en-us/news/24293281/curse-of-ulatek-content-update-notes",
    "https://worldofwarcraft.blizzard.com/en-us/news/24296142/hotfixes-august-14-2026",
  ],
} as const;

export const LIVING_GUIDE_MONITORS = [
  WORLD_OF_WARCRAFT_MONITOR,
  { guideSlug: "the-sims-4", guideTitle: "The Sims 4", notificationTarget: "/notifiche", sourceUrls: ["https://www.ea.com/games/the-sims/the-sims-4/news", "https://www.ea.com/games/the-sims/the-sims-4/download"] },
  { guideSlug: "monster-hunter-wilds", guideTitle: "Monster Hunter Wilds", notificationTarget: "/notifiche", sourceUrls: ["https://www.monsterhunter.com/wilds/en-us/topics/tu/", "https://info.monsterhunter.com/wilds/update/us/"] },
  { guideSlug: "diablo-iv", guideTitle: "Diablo IV", notificationTarget: "/notifiche", sourceUrls: ["https://news.blizzard.com/en-us/diablo4", "https://news.blizzard.com/en-us/diablo4/23964909/diablo-iv-patch-notes"] },
  { guideSlug: "pokemon-pokopia", guideTitle: "Pokémon Pokopia", notificationTarget: "/notifiche", sourceUrls: ["https://www.pokemon.com/us/pokemon-news", "https://www.pokemon.com/us/pokemon-video-games/pokemon-pokopia"] },
  { guideSlug: "the-witcher-3", guideTitle: "The Witcher 3: Wild Hunt", notificationTarget: "/notifiche", sourceUrls: ["https://www.thewitcher.com/en/en/witcher3", "https://www.thewitcher.com/gp/en/songs-of-the-past", "https://www.thewitcher.com/gb/en/redkit/modding", "https://support.cdprojektred.com/en/witcher-3/pc"] },
  { guideSlug: "cyberpunk-2077", guideTitle: "Cyberpunk 2077", notificationTarget: "/notifiche", sourceUrls: ["https://www.cyberpunk.net/us/en/update-2.3", "https://www.cyberpunk.net/en/news/51674/update-2-3-patch-notes", "https://support.cdprojektred.com/en/cyberpunk/pc"] },
  { guideSlug: "inazuma-eleven-victory-road", guideTitle: "INAZUMA ELEVEN: Victory Road", notificationTarget: "/notifiche", sourceUrls: ["https://www.inazuma.jp/victory-road/en/index.html", "https://www.inazuma.jp/victory-road/en/topics/", "https://www.inazuma.jp/victory-road/en/system/"] },
] as const;

const RELEVANT_TERMS = /midnight|hotfix|content update|season|class|talent|dungeon|raid|mythic|delve|prey|pvp|housing|profession|warband|patch|ula.?tek|update|pack|expansion|event|monster|quest|balance|pokopia|bubbly basin|diablo|sims|witcher|redkit|songs of the past|cyberpunk|phantom liberty|inazuma|victory road|tournament|dlc/i;

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
  const monitor = LIVING_GUIDE_MONITORS.find((candidate) => candidate.guideSlug === snapshot.guideSlug);
  const guideTitle = monitor?.guideTitle ?? snapshot.guideSlug;
  return {
    id: `living-guide:${snapshot.guideSlug}:${shortFingerprint}`,
    category: "living-guide",
    severity: "medium",
    title: `${guideTitle}: novità da verificare`,
    message: "Il controllo mensile ha rilevato cambiamenti nelle fonti ufficiali. Controlla le novità e decidi se aggiornare la Guida Viva: nessun contenuto è stato pubblicato automaticamente.",
    referenceCode: `LW-LIVE-${snapshot.guideSlug.toUpperCase().replace(/[^A-Z0-9]+/g, "-")}-${shortFingerprint.toUpperCase()}`,
    targetUrl: monitor?.notificationTarget ?? "/notifiche",
    sourceCreatedAt: snapshot.checkedAt,
  };
}
