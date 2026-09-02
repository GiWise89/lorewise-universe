import type { FamiliarItemKey, NexusFamiliarState } from "./nexusFamiliar.ts";

export const FAMILIAR_PERSONALITY_KEYS = ["curiosity", "affection", "adventure", "playfulness", "calm"] as const;
export type FamiliarPersonalityKey = (typeof FAMILIAR_PERSONALITY_KEYS)[number];

export type FamiliarLegacyState = {
  personality: Record<FamiliarPersonalityKey, number>;
  memories: Array<{ id: string; unlockedAt: string }>;
  discoveries: Array<{ id: string; foundAt: string; destinationId: string }>;
  postcards: Array<{ id: string; unlockedAt: string }>;
};

export type FamiliarMemoryDefinition = {
  id: string;
  title: string;
  caption: string;
  seal: "bond" | "care" | "journey" | "growth";
};

export type FamiliarDiscoveryDefinition = {
  id: string;
  destinationId: string;
  name: string;
  description: string;
  rarity: "Comune" | "Raro" | "Straordinario";
  icon: string;
};

export type FamiliarPostcardDefinition = {
  id: string;
  destinationId: string;
  title: string;
  message: string;
  image: string;
};

export const FAMILIAR_MEMORIES: FamiliarMemoryDefinition[] = [
  { id: "primo-incontro", title: "Il primo incontro", caption: "Il giorno in cui avete scelto di attraversare il Nexus insieme.", seal: "bond" },
  { id: "prima-cura", title: "La prima cura", caption: "Un gesto semplice ha dato inizio alla fiducia.", seal: "care" },
  { id: "prima-uscita", title: "Oltre la soglia", caption: "La prima avventura fuori dalla tana.", seal: "journey" },
  { id: "prima-scoperta", title: "Qualcosa da ricordare", caption: "Il primo reperto riportato a casa.", seal: "journey" },
  { id: "livello-5", title: "Compagno riconosciuto", caption: "Il legame ha lasciato il suo primo sigillo nel Nexus.", seal: "growth" },
  { id: "livello-10", title: "Custode quotidiano", caption: "La costanza è diventata parte della vostra storia.", seal: "growth" },
];

export const FAMILIAR_DISCOVERIES: FamiliarDiscoveryDefinition[] = [
  { id: "polline-luminoso", destinationId: "sentiero-luminoso", name: "Polline luminoso", description: "Brilla soltanto quando viene riportato a casa.", rarity: "Comune", icon: "/famiglio/legacy/discoveries/polline-luminoso-v1.png" },
  { id: "piuma-del-varco", destinationId: "sentiero-luminoso", name: "Piuma del varco", description: "Una traccia leggera lasciata fra due sentieri.", rarity: "Raro", icon: "/famiglio/legacy/discoveries/piuma-del-varco-v1.png" },
  { id: "seme-stellare", destinationId: "giardino-delle-stelle", name: "Seme stellare", description: "Conserva una scintilla del giardino notturno.", rarity: "Comune", icon: "/famiglio/legacy/discoveries/seme-stellare-v1.png" },
  { id: "cristallo-di-rugiada", destinationId: "giardino-delle-stelle", name: "Cristallo di rugiada", description: "Riflette costellazioni che non esistono nel nostro cielo.", rarity: "Raro", icon: "/famiglio/legacy/discoveries/cristallo-rugiada-v1.png" },
  { id: "sigillo-del-custode", destinationId: "varco-dei-custodi", name: "Sigillo del Custode", description: "Un frammento antico che reagisce alla presenza del Famiglio.", rarity: "Straordinario", icon: "/famiglio/legacy/discoveries/sigillo-custode-v1.png" },
  { id: "scheggia-del-nexus", destinationId: "varco-dei-custodi", name: "Scheggia del Nexus", description: "Sembra indicare una strada diversa ogni volta.", rarity: "Raro", icon: "/famiglio/legacy/discoveries/scheggia-nexus-v1.png" },
];

export const FAMILIAR_POSTCARDS: FamiliarPostcardDefinition[] = [
  { id: "cartolina-sentiero", destinationId: "sentiero-luminoso", title: "Sentiero luminoso", message: "Una piccola luce ha accompagnato ogni passo.", image: "/famiglio/legacy/postcards/sentiero-luminoso-v1.png" },
  { id: "cartolina-giardino", destinationId: "giardino-delle-stelle", title: "Giardino delle stelle", message: "Qui persino i fiori sembrano ricordare il cielo.", image: "/famiglio/legacy/postcards/giardino-stelle-v1.png" },
  { id: "cartolina-varco", destinationId: "varco-dei-custodi", title: "Varco dei Custodi", message: "Oltre la soglia, il Nexus ha pronunciato il nostro nome.", image: "/famiglio/legacy/postcards/varco-custodi-v1.png" },
];

export const FAMILIAR_PERSONALITIES: Record<FamiliarPersonalityKey, { label: string; description: string; icon: string }> = {
  curiosity: { label: "Curioso", description: "Osserva, cerca e scopre dettagli nascosti.", icon: "/famiglio/legacy/personality/curiosita-v1.png" },
  affection: { label: "Affettuoso", description: "Ricorda le cure e cerca la tua presenza.", icon: "/famiglio/legacy/personality/affetto-v1.png" },
  adventure: { label: "Avventuroso", description: "Ama le uscite e i percorsi più lunghi.", icon: "/famiglio/legacy/personality/avventura-v1.png" },
  playfulness: { label: "Giocherellone", description: "Trasforma ogni momento in un invito a giocare.", icon: "/famiglio/legacy/personality/gioco-v1.png" },
  calm: { label: "Tranquillo", description: "Trova equilibrio nel riposo e nella quiete.", icon: "/famiglio/legacy/personality/quiete-v1.png" },
};

export function createFamiliarLegacy(now = new Date()): FamiliarLegacyState {
  return {
    personality: { curiosity: 1, affection: 1, adventure: 0, playfulness: 0, calm: 1 },
    memories: [{ id: "primo-incontro", unlockedAt: now.toISOString() }],
    discoveries: [],
    postcards: [],
  };
}

export function normalizeFamiliarLegacy(input: Partial<FamiliarLegacyState> | null | undefined, now = new Date()): FamiliarLegacyState {
  const starter = createFamiliarLegacy(now);
  const knownMemories = new Set(FAMILIAR_MEMORIES.map((entry) => entry.id));
  const knownDiscoveries = new Set(FAMILIAR_DISCOVERIES.map((entry) => entry.id));
  const knownPostcards = new Set(FAMILIAR_POSTCARDS.map((entry) => entry.id));
  const uniqueById = <T extends { id: string }>(entries: T[]) => [...new Map(entries.map((entry) => [entry.id, entry])).values()];
  return {
    personality: Object.fromEntries(FAMILIAR_PERSONALITY_KEYS.map((key) => {
      const value = Number(input?.personality?.[key]);
      return [key, Math.min(999, Math.max(0, Math.floor(Number.isFinite(value) ? value : starter.personality[key])))];
    })) as FamiliarLegacyState["personality"],
    memories: uniqueById((input?.memories ?? starter.memories).filter((entry) => knownMemories.has(entry.id) && Number.isFinite(Date.parse(entry.unlockedAt))).map((entry) => ({ id: entry.id, unlockedAt: entry.unlockedAt }))).slice(0, FAMILIAR_MEMORIES.length),
    discoveries: uniqueById((input?.discoveries ?? []).filter((entry) => knownDiscoveries.has(entry.id) && Number.isFinite(Date.parse(entry.foundAt))).map((entry) => ({ id: entry.id, foundAt: entry.foundAt, destinationId: String(entry.destinationId).slice(0, 48) }))).slice(0, FAMILIAR_DISCOVERIES.length),
    postcards: uniqueById((input?.postcards ?? []).filter((entry) => knownPostcards.has(entry.id) && Number.isFinite(Date.parse(entry.unlockedAt))).map((entry) => ({ id: entry.id, unlockedAt: entry.unlockedAt }))).slice(0, FAMILIAR_POSTCARDS.length),
  };
}

function addMemory(legacy: FamiliarLegacyState, id: string, now: Date) {
  if (legacy.memories.some((entry) => entry.id === id)) return legacy;
  return { ...legacy, memories: [...legacy.memories, { id, unlockedAt: now.toISOString() }] };
}

export function recordFamiliarCareLegacy(state: NexusFamiliarState, item: FamiliarItemKey | "rest", now = new Date()): NexusFamiliarState {
  const legacy = normalizeFamiliarLegacy(state.legacy, now);
  const trait: FamiliarPersonalityKey = item === "toy" ? "playfulness" : item === "rest" ? "calm" : "affection";
  const personality = { ...legacy.personality, [trait]: legacy.personality[trait] + 2 };
  return { ...state, legacy: addMemory({ ...legacy, personality }, "prima-cura", now) };
}

function deterministicIndex(seed: string, length: number) {
  let hash = 2166136261;
  for (const character of seed) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return Math.abs(hash) % Math.max(1, length);
}

export function recordFamiliarOutingLegacy(state: NexusFamiliarState, destinationId: string, now = new Date()): NexusFamiliarState {
  let legacy = normalizeFamiliarLegacy(state.legacy, now);
  legacy = addMemory(legacy, "prima-uscita", now);
  const candidates = FAMILIAR_DISCOVERIES.filter((entry) => entry.destinationId === destinationId && !legacy.discoveries.some((found) => found.id === entry.id));
  const discovery = candidates[deterministicIndex(`${state.familiarId}:${destinationId}:${now.toISOString().slice(0, 10)}`, candidates.length)];
  if (discovery) {
    legacy = {
      ...legacy,
      discoveries: [...legacy.discoveries, { id: discovery.id, foundAt: now.toISOString(), destinationId }],
    };
    legacy = addMemory(legacy, "prima-scoperta", now);
  }
  const destinationDiscoveries = legacy.discoveries.filter((found) => FAMILIAR_DISCOVERIES.find((entry) => entry.id === found.id)?.destinationId === destinationId);
  const postcard = FAMILIAR_POSTCARDS.find((entry) => entry.destinationId === destinationId);
  if (postcard && destinationDiscoveries.length >= 2 && !legacy.postcards.some((entry) => entry.id === postcard.id)) {
    legacy = { ...legacy, postcards: [...legacy.postcards, { id: postcard.id, unlockedAt: now.toISOString() }] };
  }
  return {
    ...state,
    legacy: {
      ...legacy,
      personality: {
        ...legacy.personality,
        curiosity: legacy.personality.curiosity + 2,
        adventure: legacy.personality.adventure + 3,
      },
    },
  };
}

export function recordFamiliarMilestoneMemories(state: NexusFamiliarState, levels: number[], now = new Date()): NexusFamiliarState {
  let legacy = normalizeFamiliarLegacy(state.legacy, now);
  if (levels.includes(5)) legacy = addMemory(legacy, "livello-5", now);
  if (levels.includes(10)) legacy = addMemory(legacy, "livello-10", now);
  return { ...state, legacy };
}

export function dominantFamiliarPersonality(legacy: FamiliarLegacyState) {
  return FAMILIAR_PERSONALITY_KEYS.reduce((best, key) => legacy.personality[key] > legacy.personality[best] ? key : best, FAMILIAR_PERSONALITY_KEYS[0]);
}
