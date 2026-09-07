import type { FamiliarGrowthStage } from "./famiglioHome.ts";
import { STARTER_EGGS } from "./famiglioRebuild.ts";

export const PREMIUM_COVER_PRICE_EUR = 0.99;

export type PremiumCover = {
  id: string;
  name: string;
  description: string;
  artDesktop: string;
  artMobile: string;
  seasonal?: { start: number; end: number; label: string };
};

export const PREMIUM_COVERS: readonly PremiumCover[] = [
  { id: "serpent-micro", name: "Serpenti dello Specchio", description: "Micromotivo di serpenti smeraldo, occhi e punti dorati.", artDesktop: "/famiglio/rebuild/market/medusa-pattern-serpenti-v1.png", artMobile: "/famiglio/rebuild/market/medusa-pattern-serpenti-v1.png" },
  { id: "lunar-micro", name: "Cielo Lunare", description: "Micromotivo di lune, stelle e perle su indaco profondo.", artDesktop: "/famiglio/rebuild/market/medusa-pattern-lunare-v1.png", artMobile: "/famiglio/rebuild/market/medusa-pattern-lunare-v1.png" },
  { id: "creepy-micro", name: "Piccoli Presagi", description: "Micromotivo creepy con teschi, pipistrelli, candele e occhi.", artDesktop: "/famiglio/rebuild/market/medusa-pattern-creepy-v1.png", artMobile: "/famiglio/rebuild/market/medusa-pattern-creepy-v1.png" },
  { id: "prism-micro", name: "Prisma Stellare", description: "Micromotivo multicolore di prismi iridescenti e scintille.", artDesktop: "/famiglio/rebuild/market/medusa-pattern-prisma-v1.png", artMobile: "/famiglio/rebuild/market/medusa-pattern-prisma-v1.png" },
  { id: "sakura-micro", name: "Sakura Cremisi", description: "Micromotivo giapponese di sakura, petali e piccole onde.", artDesktop: "/famiglio/rebuild/market/medusa-pattern-sakura-v1.png", artMobile: "/famiglio/rebuild/market/medusa-pattern-sakura-v1.png" },
  { id: "emoticon-micro", name: "Emozioni del Nexus", description: "Micromotivo di faccine, cuori, fumetti e stelle colorate.", artDesktop: "/famiglio/rebuild/market/medusa-pattern-emoticon-v1.png", artMobile: "/famiglio/rebuild/market/medusa-pattern-emoticon-v1.png" },
  { id: "mycelium-micro", name: "Micelio Luminoso", description: "Micromotivo di funghi bioluminescenti, spore e felci.", artDesktop: "/famiglio/rebuild/market/medusa-pattern-micelio-v1.png", artMobile: "/famiglio/rebuild/market/medusa-pattern-micelio-v1.png" },
  { id: "gothic-rose-micro", name: "Rose Gotiche", description: "Micromotivo di rose bordeaux, spine nere e stelle d'argento.", artDesktop: "/famiglio/rebuild/market/medusa-pattern-rose-gotiche-v1.png", artMobile: "/famiglio/rebuild/market/medusa-pattern-rose-gotiche-v1.png" },
  { id: "alchemy-micro", name: "Alchimia Segreta", description: "Micromotivo di ampolle, glifi alchemici e gocce cristalline.", artDesktop: "/famiglio/rebuild/market/medusa-pattern-alchimia-v1.png", artMobile: "/famiglio/rebuild/market/medusa-pattern-alchimia-v1.png" },
  { id: "clockwork-micro", name: "Orologeria Astrale", description: "Micromotivo di ingranaggi, lancette e costellazioni dorate.", artDesktop: "/famiglio/rebuild/market/medusa-pattern-orologeria-v1.png", artMobile: "/famiglio/rebuild/market/medusa-pattern-orologeria-v1.png" },
  { id: "neon-tropical-micro", name: "Giungla Neon", description: "Micromotivo acceso di ibisco rosa, foglie lime e lucciole ciano.", artDesktop: "/famiglio/rebuild/market/medusa-pattern-neon-tropicale-v1.png", artMobile: "/famiglio/rebuild/market/medusa-pattern-neon-tropicale-v1.png" },
  { id: "candy-pop-micro", name: "Caramelle Pop", description: "Micromotivo brillante di dolci, cuori e stelle dai colori saturi.", artDesktop: "/famiglio/rebuild/market/medusa-pattern-caramelle-pop-v1.png", artMobile: "/famiglio/rebuild/market/medusa-pattern-caramelle-pop-v1.png" },
  { id: "solar-citrus-micro", name: "Agrumi Solari", description: "Micromotivo vivido di agrumi, fiori bianchi e scintille turchesi.", artDesktop: "/famiglio/rebuild/market/medusa-pattern-agrumi-solari-v1.png", artMobile: "/famiglio/rebuild/market/medusa-pattern-agrumi-solari-v1.png" },
  { id: "electric-ocean-micro", name: "Oceano Elettrico", description: "Micromotivo neon di coralli, conchiglie e piccoli pesci tropicali.", artDesktop: "/famiglio/rebuild/market/medusa-pattern-oceano-elettrico-v1.png", artMobile: "/famiglio/rebuild/market/medusa-pattern-oceano-elettrico-v1.png" },
  { id: "cosmic-vaporwave-micro", name: "Cosmo Vaporwave", description: "Micromotivo acceso di pianeti, comete e stelle magenta e ciano.", artDesktop: "/famiglio/rebuild/market/medusa-pattern-vaporwave-cosmico-v1.png", artMobile: "/famiglio/rebuild/market/medusa-pattern-vaporwave-cosmico-v1.png" },
];

export function premiumCoverIsAvailable(cover: PremiumCover, date = new Date()) {
  if (!cover.seasonal) return true;
  const monthDay = (date.getMonth() + 1) * 100 + date.getDate();
  return cover.seasonal.start <= cover.seasonal.end
    ? monthDay >= cover.seasonal.start && monthDay <= cover.seasonal.end
    : monthDay >= cover.seasonal.start || monthDay <= cover.seasonal.end;
}

export function availablePremiumCovers(date = new Date()) {
  return PREMIUM_COVERS.filter((cover) => premiumCoverIsAvailable(cover, date));
}

export type MerchantRoomId = "daily" | "arcane" | "cosmetics" | "ronin" | "lich";

export const MERCHANT_ROOMS: Record<MerchantRoomId, { roomSrc: string; spriteSrc: string }> = {
  daily: { roomSrc: "/famiglio/rebuild/market/nora-bottega.png", spriteSrc: "/famiglio/rebuild/market/nora-idle-v3.png" },
  arcane: { roomSrc: "/famiglio/rebuild/market/mirra-emporio.png", spriteSrc: "/famiglio/rebuild/market/mirra-idle-v3.png" },
  cosmetics: { roomSrc: "/famiglio/rebuild/market/iris-bottega.png", spriteSrc: "/famiglio/rebuild/market/iris-idle-v3.png" },
  ronin: { roomSrc: "/famiglio/rebuild/market/ronin-padiglione.png", spriteSrc: "/famiglio/rebuild/market/ronin-idle-v3.png" },
  lich: { roomSrc: "/famiglio/rebuild/market/lich-reliquiario.png", spriteSrc: "/famiglio/rebuild/market/lich-idle-v3.png" },
};

export type NightMarketOffer = {
  id: string;
  itemId: "traveler-katana" | "moon-compass" | "sigil-pouch" | "phoenix-feather" | "memory-crown" | "runic-tablet" | "soul-gem" | "memory-hourglass";
  merchant: "ronin" | "lich";
  name: string;
  description: string;
  usage: string;
  effect: string;
  destination: string;
  artSrc: string;
  currency: "sigils" | "fragments";
  price: number;
  unlockStage: FamiliarGrowthStage;
};

export const NIGHT_MARKET_OFFERS: readonly NightMarketOffer[] = [
  { id: "traveler-katana", itemId: "traveler-katana", merchant: "ronin", name: "Fodero del viandante", description: "Reliquia tattica forgiata per l'Arena e la Torre.", usage: "Equipaggiala dallo Zaino come unica Reliquia Notturna attiva.", effect: "Custodisce un vantaggio d'iniziativa da usare nelle sfide più dure.", destination: "Casa del Famiglio > Zaino > Reliquie Notturne", artSrc: "/famiglio/rebuild/market/ronin-katana.png", currency: "sigils", price: 12, unlockStage: "giovane" },
  { id: "moon-compass", itemId: "moon-compass", merchant: "ronin", name: "Bussola lunare", description: "Reliquia di esplorazione che riconosce sentieri alternativi.", usage: "Equipaggiala prima di partire per una spedizione.", effect: "Custodisce una deviazione sicura per cambiare una scelta di viaggio.", destination: "Casa del Famiglio > Zaino > Reliquie Notturne", artSrc: "/famiglio/rebuild/market/items/moon-compass-transparent.png", currency: "sigils", price: 8, unlockStage: "giovane" },
  { id: "sigil-pouch", itemId: "sigil-pouch", merchant: "ronin", name: "Borsa dei sigilli", description: "Reliquia passiva che protegge le ricompense notturne.", usage: "Equipaggiala prima di riscuotere una missione.", effect: "Ogni missione completata assegna 1 Sigillo Notturno aggiuntivo.", destination: "Casa del Famiglio > Zaino > Reliquie Notturne", artSrc: "/famiglio/rebuild/market/items/sigil-pouch-transparent.png", currency: "sigils", price: 10, unlockStage: "giovane" },
  { id: "phoenix-feather", itemId: "phoenix-feather", merchant: "ronin", name: "Piuma della fenice", description: "Reliquia di salvataggio legata alle scalate della Torre.", usage: "Equipaggiala prima di una battaglia decisiva.", effect: "Custodisce un ritorno dalla sconfitta senza spezzare la scalata.", destination: "Casa del Famiglio > Zaino > Reliquie Notturne", artSrc: "/famiglio/rebuild/market/items/phoenix-feather-transparent.png", currency: "sigils", price: 18, unlockStage: "adulto" },
  { id: "memory-crown", itemId: "memory-crown", merchant: "lich", name: "Corona delle memorie", description: "Reliquia di legame che trattiene ciò che il Famiglio impara.", usage: "Equipaggiala prima di riscuotere una missione.", effect: "Le ricompense di missione assegnano il 20% di XP legame in più.", destination: "Casa del Famiglio > Zaino > Reliquie Notturne", artSrc: "/famiglio/rebuild/market/items/memory-crown-transparent.png", currency: "fragments", price: 6, unlockStage: "giovane" },
  { id: "runic-tablet", itemId: "runic-tablet", merchant: "lich", name: "Tavola delle rune", description: "Reliquia tattica che riscrive temporaneamente una mossa.", usage: "Equipaggiala prima di preparare le mosse da combattimento.", effect: "Custodisce un modificatore runico per una mossa della battaglia.", destination: "Casa del Famiglio > Zaino > Reliquie Notturne", artSrc: "/famiglio/rebuild/market/items/runic-tablet-transparent.png", currency: "fragments", price: 4, unlockStage: "giovane" },
  { id: "soul-gem", itemId: "soul-gem", merchant: "lich", name: "Gemma dell'eco", description: "Reliquia della Torre che memorizza il piano raggiunto.", usage: "Equipaggiala prima di iniziare o riprendere una scalata.", effect: "Custodisce una singola ancora per non perdere il piano raggiunto.", destination: "Casa del Famiglio > Zaino > Reliquie Notturne", artSrc: "/famiglio/rebuild/market/items/soul-gem-transparent.png", currency: "fragments", price: 5, unlockStage: "adulto" },
  { id: "memory-hourglass", itemId: "memory-hourglass", merchant: "lich", name: "Clessidra dei ricordi", description: "Reliquia temporale per le spedizioni più lunghe.", usage: "Equipaggiala prima di avviare una spedizione.", effect: "Custodisce una riduzione del tempo di viaggio, indicata prima della partenza.", destination: "Casa del Famiglio > Zaino > Reliquie Notturne", artSrc: "/famiglio/rebuild/market/items/memory-hourglass-transparent.png", currency: "fragments", price: 8, unlockStage: "adulto" },
] as const;

export function nightMarketIsOpen(date = new Date()) {
  const hour = Number(new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Rome",
    hour: "2-digit",
    hourCycle: "h23",
  }).format(date));
  return hour >= 21 || hour < 6;
}

export const REQUIRED_COLLECTION_ACTIONS = ["idle", "walk", "feed", "play", "clean", "care", "sit", "groom", "sleep", "sleep-calm"] as const;

export type FamiliarMarketRarity = "comune" | "raro" | "epico" | "leggendario";

export const FAMILIAR_PRICE_EUR_BY_RARITY: Readonly<Record<FamiliarMarketRarity, number>> = Object.freeze({
  comune: 0.99,
  raro: 1.49,
  epico: 1.99,
  leggendario: 2.99,
});

const RARE_FAMILIAR_IDS = new Set([
  "great-dane", "saint-bernard", "panda", "horse", "polar-bear", "brown-bear", "wolf",
  "fairy-rabbit", "demon-rabbit", "elder-snail", "guardian-rabbit", "slime", "kappa", "nexus-bat", "frost-salamander",
  "velociraptor", "parasaurolophus", "pachycephalosaurus",
]);

const EPIC_FAMILIAR_IDS = new Set([
  "faerie-dragon", "blue-wyrmling", "young-green-dragon", "owlbear", "griffin",
  "tyrannosaurus", "triceratops", "stegosaurus", "brachiosaurus", "ankylosaurus", "spinosaurus", "pteranodon", "dilophosaurus", "carnotaurus",
]);

const LEGENDARY_FAMILIAR_IDS = new Set([
  "adult-red-dragon", "ancient-black-dragon", "displacer-beast", "ice-golem", "hellhound", "imp", "beholder", "bulette", "purple-worm",
]);

export function familiarMarketRarity(familiarId: string): FamiliarMarketRarity {
  if (LEGENDARY_FAMILIAR_IDS.has(familiarId)) return "leggendario";
  if (EPIC_FAMILIAR_IDS.has(familiarId)) return "epico";
  if (RARE_FAMILIAR_IDS.has(familiarId)) return "raro";
  return "comune";
}

export function familiarPriceEuro(familiarId: string) {
  return FAMILIAR_PRICE_EUR_BY_RARITY[familiarMarketRarity(familiarId)];
}

export type FamiliarCollectionEntry = {
  id: string;
  name: string;
  category: "real" | "magical" | "legendary" | "dinosaur";
  access: "starter" | "progression" | "mission" | "narrative";
  unlock: string;
  rarity: FamiliarMarketRarity;
  priceEuro: number;
  spriteBase: string;
  variants?: readonly string[];
};

export const DEFAULT_FAMILIAR_IDS = new Set<string>(STARTER_EGGS.map((entry) => entry.id));

export const FAMILIAR_COLLECTION: readonly FamiliarCollectionEntry[] = [
  ...[
    ["cat", "Gatto", ["classico", "nero", "rosso", "crema", "grigio", "siamese"]],
    ["golden", "Golden Retriever"], ["akita", "Akita"], ["great-dane", "Alano"],
    ["schnauzer", "Schnauzer"], ["saint-bernard", "San Bernardo"], ["husky", "Husky siberiano"],
    ["rabbit", "Coniglio", ["bianco", "marrone", "nero"]], ["fox", "Volpe"], ["turtle", "Tartaruga"],
    ["panda", "Panda"], ["horse", "Cavallo"], ["polar-bear", "Orso polare"], ["brown-bear", "Orso bruno"],
    ["parrot", "Pappagallo", ["blu", "rosso", "verde", "argento", "viola"]],
    ["bird", "Uccellino", ["verde", "blu", "rosa", "viola", "giallo", "bianco", "nero", "arancio"]],
    ["chicken", "Gallina/Pulcino"], ["wolf", "Lupo"],
  ].map(([id, name, variants]) => ({ id: id as string, name: name as string, category: "real" as const, access: DEFAULT_FAMILIAR_IDS.has(id as string) ? "starter" as const : "progression" as const, unlock: DEFAULT_FAMILIAR_IDS.has(id as string) ? "Scelta iniziale gratuita" : "Disponibile da Medusa", rarity: familiarMarketRarity(id as string), priceEuro: familiarPriceEuro(id as string), spriteBase: `/famiglio/rebuild/collection/${id}`, variants: variants as readonly string[] | undefined })),
  ...[
    ["fairy-rabbit", "Coniglio fatato"], ["demon-rabbit", "Coniglio demoniaco"], ["faerie-dragon", "Drago fatato"],
    ["blue-wyrmling", "Cucciolo di drago blu"], ["young-green-dragon", "Giovane drago verde"], ["owlbear", "Orsogufo"],
    ["griffin", "Grifone"], ["elder-snail", "Lumaca ancestrale"], ["fiddle-dog", "Cane musicista"],
    ["guardian-rabbit", "Coniglio guardiano"], ["slime", "Slime"], ["kappa", "Kappa"],
    ["nexus-bat", "Pipistrello del Nexus"], ["frost-salamander", "Salamandra del gelo"],
  ].map(([id, name]) => ({ id, name, category: "magical" as const, access: "mission" as const, unlock: "Uova, missioni ed esplorazioni", rarity: familiarMarketRarity(id), priceEuro: familiarPriceEuro(id), spriteBase: `/famiglio/rebuild/collection/${id}` })),
  ...[
    ["adult-red-dragon", "Drago rosso adulto"], ["ancient-black-dragon", "Drago nero antico"],
    ["displacer-beast", "Bestia dislocante"], ["ice-golem", "Golem di ghiaccio"], ["hellhound", "Segugio infernale"],
    ["imp", "Imp"], ["beholder", "Beholder"], ["bulette", "Bulette"], ["purple-worm", "Verme purpureo"],
  ].map(([id, name]) => ({ id, name, category: "legendary" as const, access: "narrative" as const, unlock: "Ricompensa narrativa rara", rarity: familiarMarketRarity(id), priceEuro: familiarPriceEuro(id), spriteBase: `/famiglio/rebuild/collection/${id}` })),
  ...[
    ["tyrannosaurus", "Tirannosauro"], ["triceratops", "Triceratopo"], ["velociraptor", "Velociraptor"],
    ["stegosaurus", "Stegosauro"], ["brachiosaurus", "Brachiosauro"], ["ankylosaurus", "Anchilosauro"],
    ["spinosaurus", "Spinosauro"], ["parasaurolophus", "Parasaurolofo"], ["pteranodon", "Pteranodonte"],
    ["dilophosaurus", "Dilofosauro"], ["carnotaurus", "Carnotauro"], ["pachycephalosaurus", "Pachicefalosauro"],
  ].map(([id, name]) => ({ id, name, category: "dinosaur" as const, access: "progression" as const, unlock: "Spedizioni preistoriche", rarity: familiarMarketRarity(id), priceEuro: familiarPriceEuro(id), spriteBase: `/famiglio/rebuild/collection/${id}` })),
] as const;

export const MEDUSA_FAMILIAR_CATALOG = FAMILIAR_COLLECTION.filter((entry) => !DEFAULT_FAMILIAR_IDS.has(entry.id));

export function familiarAnimatedPreview(entry: FamiliarCollectionEntry) {
  return `${entry.spriteBase}/preview.webp`;
}

const FAMILIAR_BUNDLE_CATEGORIES = [
  { id: "real", name: "Famigli reali", description: "Animali da compagnia e specie naturali con tutti gli aspetti disponibili." },
  { id: "magical", name: "Famigli magici", description: "Creature del Nexus legate a uova, missioni ed esplorazioni." },
  { id: "legendary", name: "Famigli leggendari", description: "Creature rare collegate alle ricompense narrative più difficili." },
  { id: "dinosaur", name: "Dinosauri", description: "L'intera collezione delle spedizioni preistoriche." },
] as const;

export const FAMILIAR_BUNDLES = FAMILIAR_BUNDLE_CATEGORIES.map((bundle) => {
  const familiars = MEDUSA_FAMILIAR_CATALOG.filter((entry) => entry.category === bundle.id);
  return {
    ...bundle,
    familiars,
    priceEuro: Math.ceil(familiars.length * 0.8) - 0.01,
  };
});
