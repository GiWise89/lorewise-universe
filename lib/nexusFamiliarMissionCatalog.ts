import type { FamiliarItemKey } from "./nexusFamiliar.ts";

export type FamiliarMissionActivity =
  | "artwork_visit"
  | "guide_visit"
  | "chronicle_visit"
  | "project_visit"
  | "artwork_like"
  | "meaningful_comment"
  | "comment_like"
  | "familiar_care"
  | "daily_return";

export type FamiliarMissionGroup = "explore" | "connect" | "care";

export type FamiliarMissionDefinition = {
  id: string;
  group: FamiliarMissionGroup;
  activity: FamiliarMissionActivity;
  title: string;
  description: string;
  target: number;
  reward: { item: FamiliarItemKey; quantity: number };
  href: string;
};

const MISSIONS: FamiliarMissionDefinition[] = [
  { id: "explore-art-2", group: "explore", activity: "artwork_visit", title: "Passeggiata in galleria", description: "Apri e osserva 2 opere diverse.", target: 2, reward: { item: "toy", quantity: 1 }, href: "/arte" },
  { id: "explore-art-3", group: "explore", activity: "artwork_visit", title: "Occhio del curatore", description: "Scopri 3 opere diverse dell’archivio.", target: 3, reward: { item: "soap", quantity: 2 }, href: "/arte" },
  { id: "explore-guide-1", group: "explore", activity: "guide_visit", title: "Una nuova strada", description: "Consulta una guida di gioco per almeno qualche secondo.", target: 1, reward: { item: "food", quantity: 2 }, href: "/giochi/guide" },
  { id: "explore-guide-2", group: "explore", activity: "guide_visit", title: "Rotte parallele", description: "Consulta 2 guide diverse.", target: 2, reward: { item: "toy", quantity: 2 }, href: "/giochi/guide" },
  { id: "explore-chronicle-1", group: "explore", activity: "chronicle_visit", title: "Segnale dal Nexus", description: "Leggi una Cronaca del Nexus.", target: 1, reward: { item: "food", quantity: 2 }, href: "/cronache-del-nexus" },
  { id: "explore-project-2", group: "explore", activity: "project_visit", title: "Dietro le quinte", description: "Esplora 2 progetti o lavori in corso diversi.", target: 2, reward: { item: "soap", quantity: 2 }, href: "/dove-nascono-i-mondi" },

  { id: "connect-like-1", group: "connect", activity: "artwork_like", title: "Un segno d’apprezzamento", description: "Metti Mi piace a un’opera che ti colpisce.", target: 1, reward: { item: "food", quantity: 2 }, href: "/arte" },
  { id: "connect-like-2", group: "connect", activity: "artwork_like", title: "Due scintille", description: "Metti Mi piace a 2 opere diverse.", target: 2, reward: { item: "food", quantity: 3 }, href: "/arte" },
  { id: "connect-like-3", group: "connect", activity: "artwork_like", title: "Traccia nella galleria", description: "Metti Mi piace a 3 opere diverse.", target: 3, reward: { item: "toy", quantity: 2 }, href: "/arte" },
  { id: "connect-comment-1", group: "connect", activity: "meaningful_comment", title: "Lascia una riflessione", description: "Scrivi un commento pertinente di almeno 40 caratteri e 6 parole reali.", target: 1, reward: { item: "medicine", quantity: 1 }, href: "/arte" },
  { id: "connect-comment-2", group: "connect", activity: "meaningful_comment", title: "Dialogo con le opere", description: "Scrivi 2 commenti pertinenti su opere diverse: almeno 40 caratteri e 6 parole ciascuno.", target: 2, reward: { item: "medicine", quantity: 1 }, href: "/arte" },
  { id: "connect-community-2", group: "connect", activity: "comment_like", title: "Voci da sostenere", description: "Apprezza 2 commenti di altri membri.", target: 2, reward: { item: "soap", quantity: 2 }, href: "/arte" },

  { id: "care-one", group: "care", activity: "familiar_care", title: "Un gesto di cura", description: "Compi un’azione di cura nella tana.", target: 1, reward: { item: "food", quantity: 2 }, href: "/famiglio" },
  { id: "care-two", group: "care", activity: "familiar_care", title: "Rituale quotidiano", description: "Compi 2 azioni di cura diverse.", target: 2, reward: { item: "toy", quantity: 1 }, href: "/famiglio" },
  { id: "care-three", group: "care", activity: "familiar_care", title: "Tana in armonia", description: "Compi 3 azioni di cura diverse.", target: 3, reward: { item: "medicine", quantity: 1 }, href: "/famiglio" },
  { id: "return-today", group: "care", activity: "daily_return", title: "Il Famiglio ti aspettava", description: "Rientra nella tana oggi.", target: 1, reward: { item: "food", quantity: 1 }, href: "/famiglio" },
];

export const FAMILIAR_MISSION_COUNT = 3;
export const MEANINGFUL_COMMENT_MIN_CHARACTERS = 40;
export const MEANINGFUL_COMMENT_MIN_WORDS = 6;

export function romeDateKey(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function hashSeed(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function pickForGroup(group: FamiliarMissionGroup, seed: string, excluded: ReadonlySet<string>) {
  const pool = MISSIONS.filter((mission) => mission.group === group);
  const start = hashSeed(`${seed}:${group}`) % pool.length;
  for (let offset = 0; offset < pool.length; offset += 1) {
    const candidate = pool[(start + offset) % pool.length];
    if (!excluded.has(candidate.id)) return candidate;
  }
  return pool[start];
}

export function dailyFamiliarMissions(userId: string, date = romeDateKey(), previousMissionIds: string[] = []) {
  const excluded = new Set(previousMissionIds);
  const core = (["explore", "connect", "care"] as FamiliarMissionGroup[])
    .map((group) => pickForGroup(group, `${userId}:${date}`, excluded));
  return core;
}

export function dailyFamiliarMissionsForCount(userId: string, date = romeDateKey(), previousMissionIds: string[] = [], count = FAMILIAR_MISSION_COUNT) {
  const core = dailyFamiliarMissions(userId, date, previousMissionIds);
  if (count <= core.length) return core.slice(0, count);
  const excluded = new Set([...previousMissionIds, ...core.map((mission) => mission.id)]);
  const remaining = MISSIONS.filter((mission) => !excluded.has(mission.id));
  const selected = [...core];
  for (let offset = 0; selected.length < count && remaining.length > 0; offset += 1) {
    const index = hashSeed(`${userId}:${date}:bonus:${offset}`) % remaining.length;
    selected.push(remaining.splice(index, 1)[0]);
  }
  return selected;
}

export function familiarMissionById(id: string) {
  return MISSIONS.find((mission) => mission.id === id) ?? null;
}

export function meaningfulMissionComment(text: string) {
  const normalized = text.normalize("NFKC").trim().replace(/\s+/g, " ");
  if (normalized.length < MEANINGFUL_COMMENT_MIN_CHARACTERS) return false;
  if (/^(.)\1{7,}$/u.test(normalized.replace(/\s/g, ""))) return false;
  const words = normalized.toLocaleLowerCase("it").match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) ?? [];
  if (words.length < MEANINGFUL_COMMENT_MIN_WORDS) return false;
  const meaningfulWords = words.filter((word) => word.length >= 3);
  return new Set(meaningfulWords).size >= 4;
}

export function familiarVisitActivity(pathname: string): { activity: FamiliarMissionActivity; sourceKey: string } | null {
  const parsed = new URL(pathname, "https://lorewisenexus.local");
  const path = parsed.pathname.replace(/\/+$/, "") || "/";
  if (/^\/arte\/[^/]+$/i.test(path)) return { activity: "artwork_visit", sourceKey: path.toLocaleLowerCase("it") };
  if (path === "/giochi/guide") {
    const game = parsed.searchParams.get("gioco")?.trim().toLocaleLowerCase("it") || "indice";
    return { activity: "guide_visit", sourceKey: `${path}?gioco=${encodeURIComponent(game)}` };
  }
  if (path === "/cronache-del-nexus" || /^\/cronache-del-nexus\/[^/]+$/i.test(path)) return { activity: "chronicle_visit", sourceKey: path.toLocaleLowerCase("it") };
  if (/^\/dove-nascono-i-mondi\/(?:giochi\/)?[^/]+$/i.test(path)) return { activity: "project_visit", sourceKey: path.toLocaleLowerCase("it") };
  return null;
}
