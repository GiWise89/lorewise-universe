import {
  applyFamiliarTimePassage,
  grantFamiliarProgress,
  normalizeNexusFamiliar,
  type FamiliarItemKey,
  type FamiliarActionResult,
  type NexusFamiliarState,
} from "./nexusFamiliar.ts";
import { FAMILIAR_GADGETS } from "./nexusFamiliarGadgets.ts";
import { recordFamiliarOutingLegacy } from "./nexusFamiliarLegacy.ts";
import { fulfillFamiliarDailyWish } from "./nexusFamiliarRituals.ts";

export type FamiliarDestination = {
  id: string;
  name: string;
  description: string;
  icon: string;
  minutes: number;
  energyCost: number;
  minimumLevel?: number;
  reward: { coins: number; experience: number; items: Partial<Record<FamiliarItemKey, number>> };
};

export type FamiliarShopOffer = {
  id: string;
  name: string;
  description: string;
  icon: string;
  priceCoins?: number;
  priceCents?: number;
  kind: "theme" | "gadget" | "familiar" | "bundle";
  themeId?: string;
  appearanceId?: string;
  compatibleFamilies?: string[];
  bundleCategory?: "themes" | "gadgets" | "premium-gadgets" | "familiars";
  status: "preview" | "active";
};

export const MAX_DAILY_FAMILIAR_OUTINGS = 3;

export const FAMILIAR_DESTINATIONS: FamiliarDestination[] = [
  { id: "sentiero-luminoso", name: "Sentiero luminoso", description: "Una passeggiata breve tra le luci del Nexus.", icon: "/famiglio/time-icons/alba-v1.png", minutes: 5, energyCost: 8, reward: { coins: 6, experience: 30, items: {} } },
  { id: "giardino-delle-stelle", name: "Giardino delle stelle", description: "Dieci minuti per esplorare, giocare e trovare piccoli tesori.", icon: "/famiglio/needs/felicita-v2.png", minutes: 10, energyCost: 16, reward: { coins: 13, experience: 60, items: {} } },
  { id: "varco-dei-custodi", name: "Varco dei Custodi", description: "Quindici minuti oltre la soglia; il percorso più lungo offre la ricompensa migliore.", icon: "/famiglio/navigation/fuori-casa-v1.webp", minutes: 15, energyCost: 24, reward: { coins: 22, experience: 90, items: {} } },
];

export const FAMILIAR_OUTING_BONUS_LEVEL = 23;

export function familiarOutingRewardForLevel(destination: FamiliarDestination, level: number) {
  if (level < FAMILIAR_OUTING_BONUS_LEVEL) return destination.reward;
  return {
    ...destination.reward,
    coins: Math.ceil(destination.reward.coins * 1.25),
    experience: Math.ceil(destination.reward.experience * 1.25),
  };
}


export const FAMILIAR_SHOP_OFFERS: FamiliarShopOffer[] = [
  { id: "tema-giardino-lucciole", name: "Giardino delle lucciole", description: "Cinque sfondi coordinati: alba, giorno, pomeriggio, tramonto e notte.", icon: "/famiglio/themes/giardino-lucciole/giorno-v1.png", priceCoins: 100, kind: "theme", themeId: "giardino-lucciole", status: "preview" },
  { id: "tema-biblioteca-astrale", name: "Biblioteca astrale", description: "Cinque momenti del giorno fra libri, camino e mappe stellari.", icon: "/famiglio/themes/biblioteca-astrale/giorno-v1.png", priceCoins: 140, kind: "theme", themeId: "biblioteca-astrale", status: "preview" },
  { id: "tema-serra-celeste", name: "Serra celeste", description: "Cinque sfondi coordinati fra vetrate, fiori magici e acqua.", icon: "/famiglio/themes/serra-celeste/giorno-v1.png", priceCoins: 180, kind: "theme", themeId: "serra-celeste", status: "preview" },
  { id: "tema-cucina-alchemica", name: "Cucina dell'Alchimista", description: "Cinque momenti del giorno fra rame, erbe, pozioni e focolare.", icon: "/famiglio/themes/cucina-alchemica/giorno-v1.png", priceCoins: 220, kind: "theme", themeId: "cucina-alchemica", status: "preview" },
  ...FAMILIAR_GADGETS.map((gadget) => ({
    ...gadget,
    kind: "gadget" as const,
    status: gadget.priceCents ? "active" as const : "preview" as const,
  })),
  { id: "famiglio-drago-tascabile", name: "Tartaruga delle maree", description: "Famiglio pixel art con camminata, guscio, salto e riposo reali.", icon: "/famiglio/navigation/shop-v1.webp", priceCents: 200, kind: "familiar", appearanceId: "pocket-dragon", status: "active" },
  { id: "famiglio-panda-rosso", name: "Gallina delle stelle", description: "Famiglio pixel art che cammina, becchetta, si siede e dorme.", icon: "/famiglio/navigation/shop-v1.webp", priceCents: 200, kind: "familiar", appearanceId: "ember-red-panda", status: "active" },
  { id: "famiglio-cerbiatto-astrale", name: "Pappagallo astrale", description: "Famiglio pixel art con passi, volo, posa e sonno dedicati.", icon: "/famiglio/navigation/shop-v1.webp", priceCents: 200, kind: "familiar", appearanceId: "astral-fawn", status: "active" },
  { id: "famiglio-axolotl-nexus", name: "Orsetto del Nexus", description: "Famiglio pixel art con corsa, salto, reazioni e riposo dedicati.", icon: "/famiglio/navigation/shop-v1.webp", priceCents: 200, kind: "familiar", appearanceId: "nexus-axolotl", status: "active" },
  { id: "bundle-famigli-premium", name: "Collezione Famigli del Nexus", description: "Tartaruga, gallina, pappagallo e orsetto insieme in un unico bundle.", icon: "/famiglio/navigation/shop-v1.webp", priceCents: 499, kind: "bundle", bundleCategory: "familiars", status: "active" },
  { id: "bundle-dimore", name: "Bundle Dimore complete", description: "Sblocca insieme tutti gli sfondi della tana presenti nel catalogo.", icon: "/famiglio/navigation/tana-v1.webp", priceCents: 399, kind: "bundle", bundleCategory: "themes", status: "active" },
  { id: "bundle-gadget", name: "Collezione Look premium", description: "Sblocca insieme i sette look premium, precomposti per ogni Famiglio, colore e azione.", icon: "/famiglio/navigation/shop-v1.webp", priceCents: 499, kind: "bundle", bundleCategory: "premium-gadgets", status: "active" },
];

export function startFamiliarOuting(state: NexusFamiliarState, destinationId: string, now = new Date()): FamiliarActionResult {
  const current = applyFamiliarTimePassage(state, now);
  const destination = FAMILIAR_DESTINATIONS.find((entry) => entry.id === destinationId);
  if (!destination) return { ok: false, state: current, error: "Destinazione non disponibile." };
  if (current.level < (destination.minimumLevel ?? 1)) return { ok: false, state: current, error: `Questa destinazione si apre al livello ${destination.minimumLevel}.` };
  if (current.outing) return { ok: false, state: current, error: "Il Famiglio è già fuori casa." };
  if (current.dailyProgress.outingsStarted >= MAX_DAILY_FAMILIAR_OUTINGS) return { ok: false, state: current, error: "Il Famiglio ha già completato le tre uscite di oggi." };
  if (current.needs.energy < destination.energyCost) return { ok: false, state: current, error: "Non ha abbastanza energia per partire." };
  const durationMs = destination.minutes * 60_000;
  return {
    ok: true,
    state: {
      ...current,
      needs: { ...current.needs, energy: Math.max(0, current.needs.energy - destination.energyCost) },
      dailyProgress: { ...current.dailyProgress, outingsStarted: current.dailyProgress.outingsStarted + 1 },
      outing: { destinationId, startedAt: now.toISOString(), endsAt: new Date(now.getTime() + durationMs).toISOString() },
      updatedAt: now.toISOString(),
    },
    message: `${current.name} è partito verso ${destination.name}.`,
  };
}

export function claimFamiliarOuting(state: NexusFamiliarState, now = new Date()): FamiliarActionResult {
  const current = normalizeNexusFamiliar(state, now);
  if (!current.outing) return { ok: false, state: current, error: "Nessuna uscita da completare." };
  const destination = FAMILIAR_DESTINATIONS.find((entry) => entry.id === current.outing?.destinationId);
  if (!destination) return { ok: false, state: { ...current, outing: null }, error: "Questa destinazione non è più disponibile." };
  if (Date.parse(current.outing.endsAt) > now.getTime()) return { ok: false, state: current, error: "Il Famiglio non è ancora tornato." };
  const reward = familiarOutingRewardForLevel(destination, current.level);
  const rewarded = grantFamiliarProgress({ ...current, outing: null }, reward, now);
  const withDiscovery = fulfillFamiliarDailyWish(recordFamiliarOutingLegacy(rewarded, destination.id, now), "outing", now);
  return { ok: true, state: withDiscovery, message: `${current.name} è tornato con ${reward.coins} monete e nuovi tesori.` };
}

export function purchaseFamiliarThemeWithCoins(state: NexusFamiliarState, offerId: string, now = new Date()): FamiliarActionResult {
  const current = applyFamiliarTimePassage(state, now);
  const offer = FAMILIAR_SHOP_OFFERS.find((entry) => entry.id === offerId && entry.kind === "theme");
  if (!offer?.themeId || !offer.priceCoins) return { ok: false, state: current, error: "Sfondo non disponibile." };
  if (current.den.unlockedThemes.includes(offer.themeId)) return equipFamiliarTheme(current, offer.themeId, now);
  if (current.nexusCoins < offer.priceCoins) return { ok: false, state: current, error: "Monete del Nexus insufficienti." };
  return {
    ok: true,
    state: {
      ...current,
      nexusCoins: current.nexusCoins - offer.priceCoins,
      den: { ...current.den, theme: offer.themeId, unlockedThemes: [...new Set([...current.den.unlockedThemes, offer.themeId])] },
      updatedAt: now.toISOString(),
    },
    message: `${offer.name} è ora la tana del tuo Famiglio.`,
  };
}

export function equipFamiliarTheme(state: NexusFamiliarState, themeId: string, now = new Date()): FamiliarActionResult {
  const current = applyFamiliarTimePassage(state, now);
  if (!current.den.unlockedThemes.includes(themeId)) return { ok: false, state: current, error: "Questo sfondo non è ancora stato sbloccato." };
  return { ok: true, state: { ...current, den: { ...current.den, theme: themeId }, updatedAt: now.toISOString() }, message: "Nuovo sfondo della tana attivato." };
}

export function purchaseFamiliarGadgetWithCoins(state: NexusFamiliarState, gadgetId: string, now = new Date()): FamiliarActionResult {
  const current = applyFamiliarTimePassage(state, now);
  const gadget = FAMILIAR_GADGETS.find((entry) => entry.id === gadgetId);
  if (!gadget?.priceCoins) return { ok: false, state: current, error: "Questo look richiede un acquisto premium." };
  if (current.den.unlockedGadgets.includes(gadget.id)) return equipFamiliarGadget(current, gadget.id, now);
  if (current.nexusCoins < gadget.priceCoins) return { ok: false, state: current, error: "Monete del Nexus insufficienti." };
  return {
    ok: true,
    state: {
      ...current,
      nexusCoins: current.nexusCoins - gadget.priceCoins,
      den: { ...current.den, equippedGadget: gadget.id, unlockedGadgets: [...current.den.unlockedGadgets, gadget.id] },
      updatedAt: now.toISOString(),
    },
    message: `${gadget.name} è stato indossato dal Famiglio.`,
  };
}

export function equipFamiliarGadget(state: NexusFamiliarState, gadgetId: string | null, now = new Date()): FamiliarActionResult {
  const current = applyFamiliarTimePassage(state, now);
  if (gadgetId !== null && !current.den.unlockedGadgets.includes(gadgetId)) return { ok: false, state: current, error: "Questo gadget non è ancora stato sbloccato." };
  return { ok: true, state: { ...current, den: { ...current.den, equippedGadget: gadgetId }, updatedAt: now.toISOString() }, message: gadgetId ? "Nuovo gadget equipaggiato." : "Gadget rimosso." };
}
