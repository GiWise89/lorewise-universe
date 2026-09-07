import { NIGHT_MARKET_OFFERS } from "./famiglioMarketExpansion.ts";

export type FamiliarNeedId = "hunger" | "energy" | "happiness" | "hygiene" | "affection";
export type FamiliarHomeAction = "feed" | "play" | "clean" | "care" | "rest";
export type FamiliarMoodId = "radiant" | "content" | "restless" | "sad" | "exhausted";
export type FamiliarGrowthStage = "cucciolo" | "giovane" | "adulto";
export type FamiliarInventoryItemId = "moon-meal" | "blue-ball" | "cleansing-tonic" | "bond-lantern" | "purple-bed" | "comet-ball" | "emerald-ball" | "ribbon-star" | "moon-moth" | "heart-brush" | "cuddle-cushion" | "moon-mat" | "cloud-mat" | "arcane-gramophone" | "prism-lantern" | "energy-biscuit" | "comfort-balm" | "magic-feather" | "crystal-orb" | "traveler-katana" | "moon-compass" | "sigil-pouch" | "phoenix-feather" | "memory-crown" | "runic-tablet" | "soul-gem" | "memory-hourglass";
export type FamiliarDeviceCoverId = "nexus-violet" | "midnight-blue" | "jade-green" | "ember-red" | "aurora-pink" | "ivory-gold" | "obsidian-black" | "lagoon-cyan" | "sunset-orange" | "mint-frost" | "pearl-white" | "retro-yellow" | "amethyst-purple" | "coral-reef" | "forest-moss" | "copper-bronze" | "arctic-blue" | "lime-neon" | "magenta-pulse" | "laser-cyan" | "solar-yellow" | "ultraviolet-flare" | "orange-blaze";

export type FamiliarNeeds = Record<FamiliarNeedId, number>;

export type FamiliarToiletState = {
  urgency: number;
  wasteCount: number;
  lastEventAt: number | null;
};

export type FamiliarGrowth = {
  bondXp: number;
  stage: FamiliarGrowthStage;
  careStreak: number;
};

export type FamiliarDailyRoutine = {
  dayKey: string;
  completedActions: FamiliarHomeAction[];
  careCount: number;
};

export type FamiliarDailyWish = {
  dayKey: string;
  action: FamiliarHomeAction;
  fulfilledAt: number | null;
};

export type FamiliarDiaryEntry = {
  id: string;
  at: number;
  kind: "bond" | "wish" | "routine" | "growth" | "mission";
  title: string;
  detail: string;
};

export type FamiliarRewardWallet = {
  nexusCoins: number;
  totalEarned: number;
  nightSigils: number;
  relicFragments: number;
  nightRewards: string[];
  equippedNightRelicId: string | null;
};

export type FamiliarInventory = {
  quantities: Record<FamiliarInventoryItemId, number>;
  totalItemsUsed: number;
};

export type FamiliarEquippedItems = Partial<Record<FamiliarHomeAction, FamiliarInventoryItemId>>;

export type FamiliarDeviceCoverState = {
  activeId: FamiliarDeviceCoverId;
  ownedIds: FamiliarDeviceCoverId[];
};

export type FamiliarDeviceCover = {
  id: FamiliarDeviceCoverId;
  name: string;
  priceCoins: number;
  shellA: string;
  shellB: string;
  edge: string;
  unlockStage: FamiliarGrowthStage;
};

export type FamiliarInventoryItem = {
  id: FamiliarInventoryItemId;
  action: FamiliarHomeAction;
  name: string;
  description: string;
  assetSrc: string;
  animationSrc?: string;
  consumable: boolean;
  startingQuantity: number;
  bonus: Partial<FamiliarNeeds>;
  outcome: string;
};

export type FamiliarMarketOffer = {
  id: "pantry-refill" | "cleansing-refill" | "pantry-feast" | "care-kit" | "energy-biscuit" | "comfort-balm" | "comet-ball" | "emerald-ball" | "ribbon-star" | "moon-moth" | "heart-brush" | "cuddle-cushion" | "moon-mat" | "cloud-mat" | "arcane-gramophone" | "arcane-prism" | "magic-feather" | "crystal-orb";
  itemId: FamiliarInventoryItemId;
  name: string;
  description: string;
  quantity: number;
  priceCoins: number;
  stall: "daily" | "arcane";
  unlockStage: FamiliarGrowthStage;
  artSrc?: string;
};

export type FamiliarHomeState = {
  needs: FamiliarNeeds;
  toilet: FamiliarToiletState;
  activeAction: FamiliarHomeAction | null;
  roomAction: FamiliarHomeAction | null;
  actionEndsAt: number | null;
  actionBurstCount: number;
  actionBurstAction: FamiliarHomeAction | null;
  actionCooldownUntil: number | null;
  actionCooldowns: Partial<Record<FamiliarHomeAction, number>>;
  actionXpDayKey: string;
  actionXpEarned: number;
  lastUpdatedAt: number;
  lastActionAt: number | null;
  lastOutcome: string;
  growth: FamiliarGrowth;
  routine: FamiliarDailyRoutine;
  wish: FamiliarDailyWish;
  wallet: FamiliarRewardWallet;
  inventory: FamiliarInventory;
  equippedItems: FamiliarEquippedItems;
  deviceCover: FamiliarDeviceCoverState;
  activeItemId: FamiliarInventoryItemId | null;
  diary: FamiliarDiaryEntry[];
};

export const HOME_ACTIONS: ReadonlyArray<{
  id: FamiliarHomeAction;
  label: string;
  icon: string;
  message: string;
}> = [
  { id: "feed", label: "Nutri", icon: "🍲", message: "Che bontà!" },
  { id: "play", label: "Gioca", icon: "🧶", message: "Giochiamo!" },
  { id: "clean", label: "Pulisci", icon: "🫧", message: "Tutto pulito." },
  { id: "care", label: "Coccola", icon: "💜", message: "Il legame cresce." },
  { id: "rest", label: "Fai riposare", icon: "🌙", message: "Sogni tranquilli." },
] as const;

export const HOME_NEEDS: ReadonlyArray<{ id: FamiliarNeedId; label: string; icon: string }> = [
  { id: "hunger", label: "Fame", icon: "🍎" },
  { id: "energy", label: "Energia", icon: "⚡" },
  { id: "happiness", label: "Gioia", icon: "✨" },
  { id: "hygiene", label: "Igiene", icon: "💧" },
  { id: "affection", label: "Affetto", icon: "💜" },
] as const;

export const DAILY_WISHES: Record<FamiliarHomeAction, { title: string; description: string }> = {
  feed: { title: "Uno spuntino insieme", description: "Oggi vorrebbe condividere con te il momento del pasto." },
  play: { title: "Tempo di giocare", description: "Oggi desidera inseguire un gioco nella sua stanza." },
  clean: { title: "Una cura delicata", description: "Oggi apprezzerebbe una pulizia fatta con attenzione." },
  care: { title: "Restiamo vicini", description: "Oggi cerca una coccola e qualche istante in tua compagnia." },
  rest: { title: "Un riposo sereno", description: "Oggi vorrebbe addormentarsi sapendo che sei accanto a lui." },
};

export const DAILY_WISH_REWARD_COINS = 5;
export const DAILY_ROUTINE_REWARD_COINS = 10;
const MAX_DIARY_ENTRIES = 30;

export const FAMILIAR_DEVICE_COVERS: ReadonlyArray<FamiliarDeviceCover> = [
  { id: "nexus-violet", name: "Viola Nexus", priceCoins: 0, shellA: "#8f5de7", shellB: "#543096", edge: "#d9b8ff", unlockStage: "cucciolo" },
  { id: "midnight-blue", name: "Blu notte", priceCoins: 45, shellA: "#4169b8", shellB: "#20376f", edge: "#a9c8ff", unlockStage: "cucciolo" },
  { id: "jade-green", name: "Verde giada", priceCoins: 55, shellA: "#3f9f82", shellB: "#1e5d55", edge: "#a7f2d4", unlockStage: "cucciolo" },
  { id: "ember-red", name: "Rosso", priceCoins: 55, shellA: "#d63c3c", shellB: "#761f2a", edge: "#ffc2b0", unlockStage: "cucciolo" },
  { id: "aurora-pink", name: "Rosa aurora", priceCoins: 65, shellA: "#cf72b5", shellB: "#793c79", edge: "#ffd0ef", unlockStage: "giovane" },
  { id: "ivory-gold", name: "Avorio e oro", priceCoins: 85, shellA: "#d8c88f", shellB: "#8d7134", edge: "#fff1b2", unlockStage: "adulto" },
  { id: "obsidian-black", name: "Nero", priceCoins: 95, shellA: "#24262d", shellB: "#08090d", edge: "#9da4b2", unlockStage: "cucciolo" },
  { id: "lagoon-cyan", name: "Ciano laguna", priceCoins: 50, shellA: "#35b9c9", shellB: "#176375", edge: "#b9fbff", unlockStage: "cucciolo" },
  { id: "sunset-orange", name: "Arancione", priceCoins: 60, shellA: "#f28a2e", shellB: "#9d431d", edge: "#ffd39b", unlockStage: "cucciolo" },
  { id: "mint-frost", name: "Verde chiaro", priceCoins: 65, shellA: "#9bdc75", shellB: "#4f8d50", edge: "#e4ffc7", unlockStage: "cucciolo" },
  { id: "pearl-white", name: "Bianco perla", priceCoins: 90, shellA: "#eee9e1", shellB: "#aaa7b5", edge: "#fff9db", unlockStage: "adulto" },
  { id: "retro-yellow", name: "Giallo", priceCoins: 75, shellA: "#f2ce3f", shellB: "#9b6e13", edge: "#fff3a0", unlockStage: "cucciolo" },
  { id: "amethyst-purple", name: "Grigio titanio", priceCoins: 55, shellA: "#7d8794", shellB: "#3e4652", edge: "#dce5ef", unlockStage: "cucciolo" },
  { id: "coral-reef", name: "Corallo", priceCoins: 60, shellA: "#ef786f", shellB: "#9b3f55", edge: "#ffd0b8", unlockStage: "giovane" },
  { id: "forest-moss", name: "Verde bosco", priceCoins: 60, shellA: "#4f7f4c", shellB: "#254733", edge: "#bddd91", unlockStage: "giovane" },
  { id: "copper-bronze", name: "Marrone", priceCoins: 80, shellA: "#8b5a3c", shellB: "#4a2c25", edge: "#d7aa7d", unlockStage: "cucciolo" },
  { id: "arctic-blue", name: "Blu artico", priceCoins: 70, shellA: "#72b7d6", shellB: "#315f83", edge: "#d9f5ff", unlockStage: "giovane" },
  { id: "lime-neon", name: "Lime elettrico", priceCoins: 90, shellA: "#9bea46", shellB: "#397a27", edge: "#ecff9e", unlockStage: "adulto" },
  { id: "magenta-pulse", name: "Magenta pulsante", priceCoins: 95, shellA: "#ff2fb2", shellB: "#86145f", edge: "#ffc2ed", unlockStage: "adulto" },
  { id: "laser-cyan", name: "Ciano laser", priceCoins: 85, shellA: "#20e4ff", shellB: "#087994", edge: "#c9fbff", unlockStage: "giovane" },
  { id: "solar-yellow", name: "Giallo solare", priceCoins: 90, shellA: "#ffe13d", shellB: "#a16c08", edge: "#fff7b0", unlockStage: "adulto" },
  { id: "ultraviolet-flare", name: "Argento lunare", priceCoins: 95, shellA: "#b8c2cf", shellB: "#657080", edge: "#f2f7ff", unlockStage: "adulto" },
  { id: "orange-blaze", name: "Arancio fiamma", priceCoins: 85, shellA: "#ff7a18", shellB: "#a72b0b", edge: "#ffd0a1", unlockStage: "giovane" },
] as const;

export const SEASONAL_PREMIUM_COVERS = [
  { id: "halloween", name: "Notte di Halloween", monthDayStart: 1001, monthDayEnd: 1107 },
  { id: "christmas", name: "Natale nel Nexus", monthDayStart: 1201, monthDayEnd: 1231 },
  { id: "new-year", name: "Capodanno stellare", monthDayStart: 1226, monthDayEnd: 107 },
] as const;

export function availableSeasonalPremiumCovers(date = new Date()) {
  const monthDay = (date.getMonth() + 1) * 100 + date.getDate();
  return SEASONAL_PREMIUM_COVERS.filter((cover) => cover.monthDayStart <= cover.monthDayEnd
    ? monthDay >= cover.monthDayStart && monthDay <= cover.monthDayEnd
    : monthDay >= cover.monthDayStart || monthDay <= cover.monthDayEnd);
}

export const FAMILIAR_ITEM_CATALOG: ReadonlyArray<FamiliarInventoryItem> = [
  {
    id: "moon-meal",
    action: "feed",
    name: "Pasto lunare",
    description: "Una porzione nutriente servita nella ciotola del kit acquistato.",
    assetSrc: "/famiglio/rebuild/inventory/moon-meal.png",
    consumable: true,
    startingQuantity: 4,
    bonus: { hunger: 12, affection: 2 },
    outcome: "Ha gustato il Pasto lunare dalla sua ciotola.",
  },
  {
    id: "blue-ball",
    action: "play",
    name: "Palla azzurra",
    description: "Un gioco permanente che rende la sessione più coinvolgente.",
    assetSrc: "/famiglio/rebuild/inventory/blue-ball.png",
    consumable: false,
    startingQuantity: 1,
    bonus: { happiness: 9, affection: 2 },
    outcome: "Ha inseguito la Palla azzurra con entusiasmo.",
  },
  {
    id: "cleansing-tonic",
    action: "clean",
    name: "Tonico detergente",
    description: "Una piccola ampolla del pacchetto acquistato per una pulizia più efficace.",
    assetSrc: "/famiglio/rebuild/inventory/cleansing-tonic.png",
    consumable: true,
    startingQuantity: 3,
    bonus: { hygiene: 14, happiness: 2 },
    outcome: "Il Tonico detergente lo ha lasciato fresco e ordinato.",
  },
  {
    id: "bond-lantern",
    action: "care",
    name: "Lanterna del legame",
    description: "Una luce permanente che accompagna i momenti di affetto.",
    assetSrc: "/famiglio/rebuild/inventory/bond-lantern.png",
    consumable: false,
    startingQuantity: 1,
    bonus: { affection: 10, happiness: 4 },
    outcome: "La Lanterna del legame ha reso la coccola ancora più speciale.",
  },
  {
    id: "purple-bed",
    action: "rest",
    name: "Cuccia viola",
    description: "Una cuccia permanente e morbida per recuperare energia.",
    assetSrc: "/famiglio/rebuild/inventory/purple-bed.png",
    consumable: false,
    startingQuantity: 1,
    bonus: { energy: 12, affection: 2 },
    outcome: "Si è sistemato nella Cuccia viola e si sente al sicuro.",
  },
  {
    id: "comet-ball", action: "play", name: "Palla Cometa cremisi",
    description: "Una pallina permanente di Mirra, rossa e brillante, che rimbalza lasciando una breve scia dorata.",
    assetSrc: "/famiglio/rebuild/market/mirra/comet-ball.png", animationSrc: "/famiglio/rebuild/market/mirra/comet-ball-sheet.png", consumable: false, startingQuantity: 0,
    bonus: { happiness: 10, affection: 2 }, outcome: "Ha inseguito la Palla Cometa cremisi tra piccoli riflessi dorati.",
  },
  {
    id: "emerald-ball", action: "play", name: "Palla Stella smeraldo",
    description: "Una pallina permanente verde di Mirra, leggera e adatta a ogni Famiglio.",
    assetSrc: "/famiglio/rebuild/market/mirra/emerald-ball.png", animationSrc: "/famiglio/rebuild/market/mirra/emerald-ball-sheet.png", consumable: false, startingQuantity: 0,
    bonus: { happiness: 11, energy: 2 }, outcome: "Ha giocato con la Palla Stella smeraldo fino all'ultimo rimbalzo.",
  },
  {
    id: "ribbon-star", action: "play", name: "Stella dei Nastri",
    description: "Un giocattolo permanente che fluttua dolcemente e muove nastri luminosi senza coprire il Famiglio.",
    assetSrc: "/famiglio/rebuild/market/mirra/ribbon-star.png", animationSrc: "/famiglio/rebuild/market/mirra/ribbon-star-sheet.png", consumable: false, startingQuantity: 0,
    bonus: { happiness: 13, affection: 3 }, outcome: "Ha seguito i nastri della Stella luminosa per tutta la stanza.",
  },
  {
    id: "moon-moth", action: "play", name: "Falena lunare di pezza",
    description: "Un morbido giocattolo permanente che ondeggia come una piccola falena del Nexus.",
    assetSrc: "/famiglio/rebuild/market/mirra/moon-moth.png", animationSrc: "/famiglio/rebuild/market/mirra/moon-moth-sheet.png", consumable: false, startingQuantity: 0,
    bonus: { happiness: 14, affection: 4 }, outcome: "La Falena lunare ha accompagnato un gioco calmo e curioso.",
  },
  {
    id: "heart-brush", action: "care", name: "Spazzola del Cuore",
    description: "Una spazzola permanente, delicata e universale, creata per i momenti di coccola.",
    assetSrc: "/famiglio/rebuild/market/mirra/heart-brush.png", animationSrc: "/famiglio/rebuild/market/mirra/heart-brush-sheet.png", consumable: false, startingQuantity: 0,
    bonus: { affection: 12, hygiene: 3 }, outcome: "La Spazzola del Cuore ha reso il Famiglio sereno e ordinato.",
  },
  {
    id: "cuddle-cushion", action: "rest", name: "Cuscino Abbraccio",
    description: "Un cuscino permanente con una conca centrale su cui il Famiglio puo dormire raccolto.",
    assetSrc: "/famiglio/rebuild/market/mirra/cuddle-cushion.png", animationSrc: "/famiglio/rebuild/market/mirra/cuddle-cushion-sheet.png", consumable: false, startingQuantity: 0,
    bonus: { energy: 13, affection: 5 }, outcome: "Si e addormentato al centro del Cuscino Abbraccio.",
  },
  {
    id: "moon-mat", action: "rest", name: "Materassino Mezzaluna",
    description: "Un materassino permanente blu notte, basso e soffice, su cui il Famiglio puo dormire davvero.",
    assetSrc: "/famiglio/rebuild/market/mirra/moon-mat.png", animationSrc: "/famiglio/rebuild/market/mirra/moon-mat-sheet.png", consumable: false, startingQuantity: 0,
    bonus: { energy: 14, affection: 3 }, outcome: "Ha riposato sul Materassino Mezzaluna sotto una luce tranquilla.",
  },
  {
    id: "cloud-mat", action: "rest", name: "Materassino Nuvola",
    description: "Un materassino permanente color cielo con un bagliore tenue che accompagna il sonno.",
    assetSrc: "/famiglio/rebuild/market/mirra/cloud-mat.png", animationSrc: "/famiglio/rebuild/market/mirra/cloud-mat-sheet.png", consumable: false, startingQuantity: 0,
    bonus: { energy: 15, happiness: 3 }, outcome: "Si e addormentato sul Materassino Nuvola con il respiro calmo.",
  },
  {
    id: "arcane-gramophone",
    action: "play",
    name: "Gramofono arcano",
    description: "Un accessorio permanente di Mirra che accompagna il gioco con melodie del Nexus.",
    assetSrc: "/famiglio/rebuild/inventory/arcane-gramophone.png",
    consumable: false,
    startingQuantity: 0,
    bonus: { happiness: 13, affection: 3 },
    outcome: "Il Gramofono arcano ha riempito la stanza di musica.",
  },
  {
    id: "prism-lantern",
    action: "play",
    name: "Lanterna prismatica",
    description: "Una luce permanente che proietta riflessi da inseguire durante il gioco.",
    assetSrc: "/famiglio/rebuild/inventory/prism-lantern.png",
    consumable: false,
    startingQuantity: 0,
    bonus: { happiness: 16, affection: 4 },
    outcome: "Ha inseguito i riflessi della Lanterna prismatica.",
  },
  {
    id: "energy-biscuit",
    action: "feed",
    name: "Biscotto del viaggio",
    description: "Una porzione neutra adatta a ogni specie, preparata per recuperare energia.",
    assetSrc: "/famiglio/rebuild/market/items/energy-biscuit-transparent.png",
    consumable: true,
    startingQuantity: 0,
    bonus: { hunger: 8, energy: 6 },
    outcome: "Il Biscotto del viaggio ha restituito energia al Famiglio.",
  },
  {
    id: "comfort-balm",
    action: "care",
    name: "Balsamo del conforto",
    description: "Un balsamo delicato e universale per una cura rassicurante.",
    assetSrc: "/famiglio/rebuild/market/items/comfort-balm-transparent.png",
    consumable: true,
    startingQuantity: 0,
    bonus: { affection: 8, hygiene: 4 },
    outcome: "Il Balsamo del conforto ha reso la cura più dolce.",
  },
  {
    id: "magic-feather",
    action: "play",
    name: "Piuma danzante",
    description: "Un gioco permanente che fluttua a distanza di sicurezza.",
    assetSrc: "/famiglio/rebuild/market/items/magic-feather-transparent.png",
    consumable: false,
    startingQuantity: 0,
    bonus: { happiness: 12, energy: 2 },
    outcome: "Ha seguito la Piuma danzante per tutta la stanza.",
  },
  {
    id: "crystal-orb",
    action: "care",
    name: "Sfera delle emozioni",
    description: "Un accessorio permanente che riflette il colore dell'umore del Famiglio.",
    assetSrc: "/famiglio/rebuild/market/items/crystal-orb-transparent.png",
    consumable: false,
    startingQuantity: 0,
    bonus: { affection: 12, happiness: 5 },
    outcome: "La Sfera delle emozioni ha risposto al legame del Famiglio.",
  },
  {
    id: "traveler-katana", action: "play", name: "Fodero del viandante",
    description: "Ricompensa permanente di Ronin. Selezionala dallo Zaino per una sessione di gioco visibile nella stanza.",
    assetSrc: "/famiglio/rebuild/market/ronin-katana.png", consumable: false, startingQuantity: 0,
    bonus: { happiness: 10, affection: 3 }, outcome: "Il Fodero del viandante ha accompagnato un allenamento giocoso.",
  },
  {
    id: "moon-compass", action: "care", name: "Bussola lunare",
    description: "Ricompensa permanente di Ronin. Selezionala dallo Zaino per osservarla nella stanza e registrare il momento.",
    assetSrc: "/famiglio/rebuild/market/items/moon-compass-transparent.png", consumable: false, startingQuantity: 0,
    bonus: { affection: 7, happiness: 5 }, outcome: "La Bussola lunare ha indicato una nuova rotta nel diario.",
  },
  {
    id: "sigil-pouch", action: "care", name: "Borsa dei sigilli",
    description: "Ricompensa permanente di Ronin. Nello Zaino resta attivo il bonus di un Sigillo Notturno aggiuntivo per missione.",
    assetSrc: "/famiglio/rebuild/market/items/sigil-pouch-transparent.png", consumable: false, startingQuantity: 0,
    bonus: { affection: 6 }, outcome: "La Borsa dei sigilli è stata controllata insieme al Famiglio.",
  },
  {
    id: "phoenix-feather", action: "play", name: "Piuma della fenice",
    description: "Ricompensa permanente di Ronin. Selezionala dallo Zaino per farla fluttuare durante Gioca.",
    assetSrc: "/famiglio/rebuild/market/items/phoenix-feather-transparent.png", consumable: false, startingQuantity: 0,
    bonus: { happiness: 16, energy: 4, affection: 3 }, outcome: "La Piuma della fenice ha danzato nella stanza.",
  },
  {
    id: "memory-crown", action: "care", name: "Corona delle memorie",
    description: "Reliquia permanente del Lich. Selezionala dallo Zaino per una Coccola visibile e una memoria nel diario.",
    assetSrc: "/famiglio/rebuild/market/items/memory-crown-transparent.png", consumable: false, startingQuantity: 0,
    bonus: { affection: 14, happiness: 5 }, outcome: "La Corona delle memorie ha custodito questo momento nel diario.",
  },
  {
    id: "runic-tablet", action: "care", name: "Tavola delle rune",
    description: "Reliquia permanente del Lich. Selezionala dallo Zaino per consultarla insieme al Famiglio.",
    assetSrc: "/famiglio/rebuild/market/items/runic-tablet-transparent.png", consumable: false, startingQuantity: 0,
    bonus: { affection: 10, happiness: 6 }, outcome: "Le rune hanno rivelato una memoria illustrata.",
  },
  {
    id: "soul-gem", action: "care", name: "Gemma dell'eco",
    description: "Reliquia permanente del Lich. Selezionala dallo Zaino e osservala pulsare durante Coccola.",
    assetSrc: "/famiglio/rebuild/market/items/soul-gem-transparent.png", consumable: false, startingQuantity: 0,
    bonus: { affection: 15, happiness: 8 }, outcome: "La Gemma dell'eco ha risposto all'umore del Famiglio.",
  },
  {
    id: "memory-hourglass", action: "rest", name: "Clessidra dei ricordi",
    description: "Reliquia permanente del Lich. Selezionala dallo Zaino per accompagnare Fai riposare.",
    assetSrc: "/famiglio/rebuild/market/items/memory-hourglass-transparent.png", consumable: false, startingQuantity: 0,
    bonus: { energy: 16, affection: 5 }, outcome: "La Clessidra dei ricordi ha accompagnato un riposo profondo.",
  },
] as const;

export const FAMILIAR_MARKET_OFFERS: ReadonlyArray<FamiliarMarketOffer> = [
  {
    id: "pantry-refill",
    itemId: "moon-meal",
    name: "Scorta di pasti lunari",
    description: "Due porzioni per riempire la dispensa della Casa.",
    quantity: 2,
    priceCoins: 8,
    stall: "daily",
    unlockStage: "cucciolo",
  },
  {
    id: "cleansing-refill",
    itemId: "cleansing-tonic",
    name: "Tonico di rugiada",
    description: "Una nuova ampolla per le cure di pulizia.",
    quantity: 1,
    priceCoins: 10,
    stall: "daily",
    unlockStage: "cucciolo",
  },
  {
    id: "pantry-feast",
    itemId: "moon-meal",
    artSrc: "/famiglio/rebuild/inventory/young-pantry.png",
    name: "Dispensa del giovane",
    description: "Cinque pasti lunari in una scorta più conveniente.",
    quantity: 5,
    priceCoins: 18,
    stall: "daily",
    unlockStage: "giovane",
  },
  {
    id: "care-kit",
    itemId: "cleansing-tonic",
    artSrc: "/famiglio/rebuild/market/items/care-kit.png",
    name: "Corredo del custode",
    description: "Tre tonici di rugiada per un Famiglio adulto.",
    quantity: 3,
    priceCoins: 24,
    stall: "daily",
    unlockStage: "adulto",
  },
  {
    id: "energy-biscuit",
    itemId: "energy-biscuit",
    name: "Biscotti del viaggio",
    description: "Tre porzioni universali per fame ed energia.",
    quantity: 3,
    priceCoins: 20,
    stall: "daily",
    unlockStage: "giovane",
  },
  {
    id: "comfort-balm",
    itemId: "comfort-balm",
    name: "Balsamo del conforto",
    description: "Due applicazioni delicate per affetto e igiene.",
    quantity: 2,
    priceCoins: 28,
    stall: "daily",
    unlockStage: "adulto",
  },
  { id: "comet-ball", itemId: "comet-ball", name: "Palla Cometa cremisi", description: "Pallina permanente rossa con una breve scia dorata.", quantity: 1, priceCoins: 12, stall: "arcane", unlockStage: "cucciolo" },
  { id: "emerald-ball", itemId: "emerald-ball", name: "Palla Stella smeraldo", description: "Pallina permanente verde, leggera e luminosa.", quantity: 1, priceCoins: 14, stall: "arcane", unlockStage: "cucciolo" },
  { id: "ribbon-star", itemId: "ribbon-star", name: "Stella dei Nastri", description: "Giocattolo permanente fluttuante con nastri luminosi.", quantity: 1, priceCoins: 18, stall: "arcane", unlockStage: "cucciolo" },
  { id: "moon-moth", itemId: "moon-moth", name: "Falena lunare di pezza", description: "Morbido giocattolo permanente che ondeggia nella stanza.", quantity: 1, priceCoins: 20, stall: "arcane", unlockStage: "cucciolo" },
  { id: "heart-brush", itemId: "heart-brush", name: "Spazzola del Cuore", description: "Spazzola permanente per coccole delicate e rassicuranti.", quantity: 1, priceCoins: 22, stall: "arcane", unlockStage: "cucciolo" },
  { id: "cuddle-cushion", itemId: "cuddle-cushion", name: "Cuscino Abbraccio", description: "Cuscino permanente che emana un tepore discreto.", quantity: 1, priceCoins: 26, stall: "arcane", unlockStage: "cucciolo" },
  { id: "moon-mat", itemId: "moon-mat", name: "Materassino Mezzaluna", description: "Materassino permanente blu notte per un riposo profondo.", quantity: 1, priceCoins: 28, stall: "arcane", unlockStage: "cucciolo" },
  { id: "cloud-mat", itemId: "cloud-mat", name: "Materassino Nuvola", description: "Materassino permanente soffice con bagliore color cielo.", quantity: 1, priceCoins: 30, stall: "arcane", unlockStage: "cucciolo" },
  {
    id: "arcane-gramophone",
    itemId: "arcane-gramophone",
    name: "Gramofono arcano",
    description: "Accessorio permanente per giocare seguendo le melodie del Nexus.",
    quantity: 1,
    priceCoins: 38,
    stall: "arcane",
    unlockStage: "giovane",
  },
  {
    id: "arcane-prism",
    itemId: "prism-lantern",
    name: "Lanterna prismatica",
    description: "Accessorio permanente che crea riflessi luminosi da inseguire.",
    quantity: 1,
    priceCoins: 60,
    stall: "arcane",
    unlockStage: "adulto",
  },
  {
    id: "magic-feather",
    itemId: "magic-feather",
    name: "Piuma danzante",
    description: "Gioco permanente che fluttua senza restare ancorato al pavimento.",
    quantity: 1,
    priceCoins: 46,
    stall: "arcane",
    unlockStage: "giovane",
  },
  {
    id: "crystal-orb",
    itemId: "crystal-orb",
    name: "Sfera delle emozioni",
    description: "Accessorio permanente che reagisce all'umore del Famiglio.",
    quantity: 1,
    priceCoins: 72,
    stall: "arcane",
    unlockStage: "adulto",
  },
] as const;

const GROWTH_STAGE_ORDER: Record<FamiliarGrowthStage, number> = { cucciolo: 0, giovane: 1, adulto: 2 };

export function isGrowthStageUnlocked(current: FamiliarGrowthStage, required: FamiliarGrowthStage) {
  return GROWTH_STAGE_ORDER[current] >= GROWTH_STAGE_ORDER[required];
}

export function availableFamiliarMarketOffers(stall: FamiliarMarketOffer["stall"], stage: FamiliarGrowthStage) {
  return FAMILIAR_MARKET_OFFERS.filter((offer) => offer.stall === stall && isGrowthStageUnlocked(stage, offer.unlockStage));
}

export function availableFamiliarDeviceCovers(stage: FamiliarGrowthStage) {
  return FAMILIAR_DEVICE_COVERS.filter((cover) => isGrowthStageUnlocked(stage, cover.unlockStage));
}

function createStarterInventory(): FamiliarInventory {
  return {
    quantities: Object.fromEntries(FAMILIAR_ITEM_CATALOG.map((item) => [item.id, item.startingQuantity])) as Record<FamiliarInventoryItemId, number>,
    totalItemsUsed: 0,
  };
}

export const FAMILIAR_MOODS: Record<FamiliarMoodId, { label: string; icon: string }> = {
  radiant: { label: "Raggiante", icon: "✦" },
  content: { label: "Sereno", icon: "☀" },
  restless: { label: "Irrequieto", icon: "◌" },
  sad: { label: "Triste", icon: "☂" },
  exhausted: { label: "Sfinito", icon: "☾" },
};

export const GROWTH_STAGES: Record<FamiliarGrowthStage, { label: string; minimumXp: number; nextXp: number | null; scale: number }> = {
  cucciolo: { label: "Cucciolo", minimumXp: 0, nextXp: 900, scale: .9 },
  giovane: { label: "Giovane", minimumXp: 900, nextXp: 3_500, scale: 1 },
  adulto: { label: "Adulto", minimumXp: 3_500, nextXp: null, scale: 1.08 },
};

const ACTION_DURATION_MS: Record<FamiliarHomeAction, number> = {
  // Il pasto animato dura 4,8 secondi: questo margine mantiene sincronizzati
  // azione e ultimo fotogramma senza mostrare un ambiguo timer da 30 secondi.
  feed: 6_000,
  play: 5_500,
  clean: 4_500,
  care: 4_500,
  rest: 12_000,
};

const ACTION_XP: Record<FamiliarHomeAction, number> = {
  feed: 4,
  play: 5,
  clean: 4,
  care: 5,
  rest: 3,
};

export const HOME_ACTION_REPEAT_LIMIT = 2;
export const HOME_ACTION_COOLDOWN_MS = 2 * 60 * 1_000;
export const HOME_ACTION_DAILY_XP_LIMIT = 40;
export const FAMILIAR_TOILET_URGENCY_PER_HOUR = 22;
export const FAMILIAR_TOILET_MAX_WASTE = 3;
export const HOME_ACTION_ENERGY_COST: Record<FamiliarHomeAction, number> = {
  feed: 0,
  play: 8,
  clean: 5,
  care: 0,
  rest: 0,
};

const RESOURCE_REQUIRED_ACTIONS = new Set<FamiliarHomeAction>(["feed", "clean"]);

function availableConsumableForAction(state: FamiliarHomeState, action: FamiliarHomeAction, preferredItemId?: FamiliarInventoryItemId | null) {
  const preferred = preferredItemId
    ? FAMILIAR_ITEM_CATALOG.find((item) => item.id === preferredItemId && item.action === action && state.inventory.quantities[item.id] > 0)
    : null;
  if (preferred) return preferred;
  return FAMILIAR_ITEM_CATALOG.find((item) => item.action === action && item.consumable && state.inventory.quantities[item.id] > 0) ?? null;
}

export function homeActionAvailability(state: FamiliarHomeState, action: FamiliarHomeAction, now = Date.now()) {
  if (state.activeAction && state.actionEndsAt && state.actionEndsAt > now) {
    return { available: false, code: "busy" as const, remainingMs: state.actionEndsAt - now, reason: "Attendi la fine dell'azione in corso." };
  }
  const actionCooldownUntil = state.actionCooldowns?.[action] ?? 0;
  if (actionCooldownUntil > now) {
    return { available: false, code: "cooldown" as const, remainingMs: actionCooldownUntil - now, reason: `Hai ripetuto ${HOME_ACTIONS.find((entry) => entry.id === action)?.label ?? "questa azione"} due volte: attendi prima di ripeterla.` };
  }
  const energyCost = HOME_ACTION_ENERGY_COST[action];
  if (energyCost > 0 && state.needs.energy < energyCost) {
    return { available: false, code: "energy" as const, remainingMs: 0, reason: `Servono almeno ${energyCost} punti Energia.` };
  }
  if (RESOURCE_REQUIRED_ACTIONS.has(action) && !availableConsumableForAction(state, action)) {
    return {
      available: false,
      code: "stock" as const,
      remainingMs: 0,
      reason: action === "feed" ? "Cibo terminato: rifornisciti al Mercato." : "Prodotti per l'igiene terminati: rifornisciti al Mercato.",
    };
  }
  return { available: true, code: "ready" as const, remainingMs: 0, reason: "Disponibile." };
}

const clampNeed = (value: number) => Math.max(0, Math.min(100, Math.round(value * 10) / 10));
const clampXp = (value: number) => Math.max(0, Math.min(999_999, Math.round(value)));

function localDayKey(now: number) {
  const date = new Date(now);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function previousDayKey(now: number) {
  const date = new Date(now);
  date.setDate(date.getDate() - 1);
  return localDayKey(date.getTime());
}

function wishForDay(now: number): FamiliarDailyWish {
  const dayKey = localDayKey(now);
  const seed = [...dayKey].reduce((total, character) => total + character.charCodeAt(0), 0);
  return {
    dayKey,
    action: HOME_ACTIONS[seed % HOME_ACTIONS.length].id,
    fulfilledAt: null,
  };
}

function currentWish(wish: FamiliarDailyWish, now: number) {
  return wish.dayKey === localDayKey(now) ? wish : wishForDay(now);
}

function diaryEntry(
  kind: FamiliarDiaryEntry["kind"],
  at: number,
  title: string,
  detail: string,
): FamiliarDiaryEntry {
  return { id: `${kind}-${at}`, at, kind, title, detail };
}

function appendDiary(entries: FamiliarDiaryEntry[], additions: FamiliarDiaryEntry[]) {
  return [...additions, ...entries].slice(0, MAX_DIARY_ENTRIES);
}

export function growthStageForXp(bondXp: number): FamiliarGrowthStage {
  if (bondXp >= GROWTH_STAGES.adulto.minimumXp) return "adulto";
  if (bondXp >= GROWTH_STAGES.giovane.minimumXp) return "giovane";
  return "cucciolo";
}

export function familiarMood(needs: FamiliarNeeds): FamiliarMoodId {
  const values = Object.values(needs);
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  if (needs.energy <= 18 || needs.hunger <= 14) return "exhausted";
  if (average >= 86 && Math.min(...values) >= 68) return "radiant";
  if (average >= 65 && Math.min(...values) >= 42) return "content";
  if (average >= 42) return "restless";
  return "sad";
}

export function growthProgress(growth: FamiliarGrowth) {
  const definition = GROWTH_STAGES[growth.stage];
  if (definition.nextXp === null) return 100;
  return Math.max(0, Math.min(100, ((growth.bondXp - definition.minimumXp) / (definition.nextXp - definition.minimumXp)) * 100));
}

export function dailyRoutineProgress(routine: FamiliarDailyRoutine) {
  return Math.round((new Set(routine.completedActions).size / HOME_ACTIONS.length) * 100);
}

function currentRoutine(routine: FamiliarDailyRoutine, now: number): FamiliarDailyRoutine {
  const today = localDayKey(now);
  if (routine.dayKey === today) return routine;
  return {
    dayKey: today,
    completedActions: [],
    careCount: 0,
  };
}

export function createFamiliarHomeState(now = Date.now()): FamiliarHomeState {
  return {
    needs: { hunger: 82, energy: 78, happiness: 84, hygiene: 88, affection: 76 },
    toilet: { urgency: 18, wasteCount: 0, lastEventAt: null },
    activeAction: null,
    roomAction: null,
    actionEndsAt: null,
    actionBurstCount: 0,
    actionBurstAction: null,
    actionCooldownUntil: null,
    actionCooldowns: {},
    actionXpDayKey: localDayKey(now),
    actionXpEarned: 0,
    lastUpdatedAt: now,
    lastActionAt: null,
    lastOutcome: "È tranquillo nella sua Casa.",
    growth: { bondXp: 0, stage: "cucciolo", careStreak: 0 },
    routine: { dayKey: localDayKey(now), completedActions: [], careCount: 0 },
    wish: wishForDay(now),
    wallet: { nexusCoins: 0, totalEarned: 0, nightSigils: 0, relicFragments: 0, nightRewards: [], equippedNightRelicId: null },
    inventory: createStarterInventory(),
    equippedItems: { play: "blue-ball", care: "bond-lantern", rest: "purple-bed" },
    deviceCover: { activeId: "nexus-violet", ownedIds: ["nexus-violet"] },
    activeItemId: null,
    diary: [diaryEntry("bond", now, "Il primo giorno", "Un nuovo legame è stato riconosciuto dal Nexus.")],
  };
}

export function equipFamiliarInventoryItem(
  state: FamiliarHomeState,
  itemId: FamiliarInventoryItemId,
): FamiliarHomeState {
  const item = FAMILIAR_ITEM_CATALOG.find((candidate) => candidate.id === itemId);
  if (!item || item.consumable || NIGHT_MARKET_OFFERS.some((offer) => offer.itemId === itemId)) return state;
  if ((state.inventory.quantities[itemId] ?? 0) <= 0) {
    return { ...state, lastOutcome: `${item.name} non è ancora nel tuo inventario.` };
  }
  return {
    ...state,
    equippedItems: { ...state.equippedItems, [item.action]: item.id },
    lastOutcome: `${item.name} selezionato per ${HOME_ACTIONS.find((action) => action.id === item.action)?.label.toLowerCase() ?? "la prossima azione"}.`,
  };
}

export function advanceFamiliarHome(state: FamiliarHomeState, now = Date.now()): FamiliarHomeState {
  const elapsedMs = Math.max(0, Math.min(now - state.lastUpdatedAt, 24 * 60 * 60 * 1000));
  const elapsedHours = elapsedMs / 3_600_000;
  const elapsedSeconds = elapsedMs / 1_000;
  const sleeping = state.activeAction === "rest" && Boolean(state.actionEndsAt && state.actionEndsAt > now);
  const hungerPenalty = state.needs.hunger <= 18 ? elapsedHours * 1.8 : 0;
  const hygienePenalty = state.needs.hygiene <= 20 ? elapsedHours * 1.2 : 0;
  const previousToilet = state.toilet ?? { urgency: 18, wasteCount: 0, lastEventAt: null };
  const accumulatedUrgency = Math.max(0, previousToilet.urgency) + elapsedHours * FAMILIAR_TOILET_URGENCY_PER_HOUR;
  const naturalEvents = Math.floor(accumulatedUrgency / 100);
  const wasteCount = Math.min(FAMILIAR_TOILET_MAX_WASTE, previousToilet.wasteCount + naturalEvents);
  const newWaste = Math.max(0, wasteCount - previousToilet.wasteCount);
  const toilet: FamiliarToiletState = {
    urgency: Math.round((accumulatedUrgency % 100) * 10) / 10,
    wasteCount,
    lastEventAt: newWaste > 0 ? now : previousToilet.lastEventAt,
  };
  const needs: FamiliarNeeds = {
    hunger: clampNeed(state.needs.hunger - elapsedHours * 2.2),
    energy: clampNeed(state.needs.energy + (sleeping ? elapsedSeconds * 1.15 : -elapsedHours * 1.4) - hungerPenalty),
    happiness: clampNeed(state.needs.happiness - elapsedHours * .9 - hungerPenalty - hygienePenalty - wasteCount * elapsedHours * .55 - newWaste * 3),
    hygiene: clampNeed(state.needs.hygiene - elapsedHours * .7 - wasteCount * elapsedHours * 2.2 - newWaste * 14),
    affection: clampNeed(state.needs.affection - elapsedHours * .55),
  };
  const finished = Boolean(state.actionEndsAt && state.actionEndsAt <= now);
  const actionCooldowns = Object.fromEntries(Object.entries(state.actionCooldowns ?? {}).filter(([, until]) => Number(until) > now)) as Partial<Record<FamiliarHomeAction, number>>;
  const recovered = Boolean(state.lastActionAt && now - state.lastActionAt >= HOME_ACTION_COOLDOWN_MS);
  const xpDayKey = localDayKey(now);
  return {
    ...state,
    needs,
    toilet,
    activeAction: finished ? null : state.activeAction,
    activeItemId: finished ? null : state.activeItemId,
    actionEndsAt: finished ? null : state.actionEndsAt,
    actionBurstCount: recovered ? 0 : state.actionBurstCount ?? 0,
    actionBurstAction: recovered ? null : state.actionBurstAction ?? null,
    actionCooldownUntil: null,
    actionCooldowns,
    actionXpDayKey: xpDayKey,
    actionXpEarned: state.actionXpDayKey === xpDayKey ? Math.max(0, state.actionXpEarned ?? 0) : 0,
    lastUpdatedAt: now,
    lastOutcome: newWaste > 0 ? "Il Famiglio ha fatto i bisogni. Usa Pulisci per sistemare la Casa." : state.lastOutcome,
    routine: currentRoutine(state.routine, now),
    wish: currentWish(state.wish, now),
  };
}

export function performHomeAction(
  state: FamiliarHomeState,
  action: FamiliarHomeAction,
  now = Date.now(),
  preferredItemId: FamiliarInventoryItemId | null = null,
): FamiliarHomeState {
  const current = advanceFamiliarHome(state, now);
  const availability = homeActionAvailability(current, action, now);
  if (!availability.available) return { ...current, lastOutcome: availability.reason };
  const usedItem = preferredItemId
    ? FAMILIAR_ITEM_CATALOG.find((item) => item.id === preferredItemId && item.action === action && current.inventory.quantities[item.id] > 0) ?? null
    : RESOURCE_REQUIRED_ACTIONS.has(action) ? availableConsumableForAction(current, action) : null;
  const needs = { ...current.needs };
  let toilet = current.toilet;
  let outcome = HOME_ACTIONS.find((item) => item.id === action)?.message ?? "Il legame continua.";
  let earnedXp = ACTION_XP[action];

  if (action === "feed") {
    if (needs.hunger >= 92) {
      needs.hunger = clampNeed(needs.hunger + 4);
      needs.happiness = clampNeed(needs.happiness - 3);
      earnedXp = 3;
      outcome = "È già sazio: meglio non esagerare.";
    } else {
      needs.hunger = clampNeed(needs.hunger + 24);
      needs.affection = clampNeed(needs.affection + 2);
    }
    toilet = { ...toilet, urgency: Math.min(99, toilet.urgency + 18) };
  }
  if (action === "play") {
    needs.happiness = clampNeed(needs.happiness + 22);
    needs.energy = clampNeed(needs.energy - HOME_ACTION_ENERGY_COST.play);
    needs.affection = clampNeed(needs.affection + 2);
  }
  if (action === "clean") {
    const cleanedWaste = toilet.wasteCount;
    if (needs.hygiene >= 95) {
      earnedXp = 3;
      outcome = "È già pulitissimo.";
    }
    needs.hygiene = clampNeed(needs.hygiene + 28);
    needs.energy = clampNeed(needs.energy - HOME_ACTION_ENERGY_COST.clean);
    toilet = { ...toilet, wasteCount: 0 };
    if (cleanedWaste > 0) outcome = cleanedWaste === 1
      ? "Hai pulito i bisogni del Famiglio. La Casa è di nuovo in ordine."
      : `Hai rimosso ${cleanedWaste} sporco dalla Casa. Ora è tutto pulito.`;
  }
  if (action === "care") {
    needs.affection = clampNeed(needs.affection + 24);
    needs.happiness = clampNeed(needs.happiness + 4);
  }
  if (action === "rest") {
    if (needs.energy >= 92) {
      earnedXp = 3;
      outcome = "Non ha molto sonno, ma si rilassa accanto a te.";
    }
    needs.energy = clampNeed(needs.energy + 3);
  }

  const routine = currentRoutine(current.routine, now);
  const firstToday = !routine.completedActions.includes(action);
  const completedActions = firstToday ? [...routine.completedActions, action] : routine.completedActions;
  const completedDay = completedActions.length === HOME_ACTIONS.length;
  const completedRoutineNow = completedDay && firstToday;
  const wasPreviousDayComplete = state.routine.completedActions.length === HOME_ACTIONS.length
    && state.routine.dayKey === previousDayKey(now);
  const careStreak = completedRoutineNow
    ? (wasPreviousDayComplete ? current.growth.careStreak + 1 : Math.max(1, current.growth.careStreak))
    : current.growth.careStreak;
  const wishFulfilledNow = current.wish.action === action && current.wish.fulfilledAt === null;
  const wish = wishFulfilledNow ? { ...current.wish, fulfilledAt: now } : current.wish;
  const rewardCoins = (wishFulfilledNow ? DAILY_WISH_REWARD_COINS : 0)
    + (completedRoutineNow ? DAILY_ROUTINE_REWARD_COINS : 0);
  const requestedXp = earnedXp + (completedRoutineNow ? 8 : 0) + (wishFulfilledNow ? 2 : 0);
  const xpRemaining = Math.max(0, HOME_ACTION_DAILY_XP_LIMIT - current.actionXpEarned);
  const grantedXp = Math.min(requestedXp, xpRemaining);
  const bondXp = clampXp(current.growth.bondXp + grantedXp);
  const nextStage = growthStageForXp(bondXp);
  const diaryAdditions: FamiliarDiaryEntry[] = [];
  if (wishFulfilledNow) {
    diaryAdditions.push(diaryEntry(
      "wish",
      now,
      "Desiderio esaudito",
      `${DAILY_WISHES[action].title}: avete guadagnato ${DAILY_WISH_REWARD_COINS} monete Nexus.`,
    ));
    outcome = `${outcome} Desiderio esaudito: +${DAILY_WISH_REWARD_COINS} monete Nexus.`;
  }
  if (completedRoutineNow) {
    diaryAdditions.push(diaryEntry(
      "routine",
      now,
      "Giornata di cura completa",
      `Tutte le cinque cure sono state completate: +${DAILY_ROUTINE_REWARD_COINS} monete Nexus.`,
    ));
    outcome = `${outcome} Routine del giorno completata!`;
  }
  if (nextStage !== current.growth.stage) {
    diaryAdditions.push(diaryEntry(
      "growth",
      now,
      `Nuovo stadio: ${GROWTH_STAGES[nextStage].label}`,
      "Il legame è cresciuto e il Famiglio mostra una presenza più matura.",
    ));
  }

  const actionEndsAt = now + ACTION_DURATION_MS[action];
  const actionBurstCount = current.actionBurstAction === action ? Math.min(HOME_ACTION_REPEAT_LIMIT, current.actionBurstCount + 1) : 1;
  const repeatedLimitReached = actionBurstCount >= HOME_ACTION_REPEAT_LIMIT;
  const actionCooldowns = repeatedLimitReached
    ? { ...current.actionCooldowns, [action]: actionEndsAt + HOME_ACTION_COOLDOWN_MS }
    : current.actionCooldowns;
  if (grantedXp < requestedXp) outcome = `${outcome} Limite XP delle azioni raggiunto per oggi; i bisogni continuano comunque a migliorare.`;
  const inventory = usedItem ? {
    quantities: {
      ...current.inventory.quantities,
      [usedItem.id]: usedItem.consumable ? Math.max(0, current.inventory.quantities[usedItem.id] - 1) : current.inventory.quantities[usedItem.id],
    },
    totalItemsUsed: current.inventory.totalItemsUsed + 1,
  } : current.inventory;

  return {
    ...current,
    needs,
    toilet,
    activeAction: action,
    activeItemId: usedItem?.id ?? null,
    roomAction: action,
    actionEndsAt,
    actionBurstCount,
    actionBurstAction: repeatedLimitReached ? null : action,
    actionCooldownUntil: null,
    actionCooldowns,
    actionXpDayKey: localDayKey(now),
    actionXpEarned: current.actionXpEarned + grantedXp,
    lastUpdatedAt: now,
    lastActionAt: now,
    lastOutcome: outcome,
    growth: { bondXp, stage: nextStage, careStreak },
    routine: { ...routine, completedActions, careCount: routine.careCount + 1 },
    wish,
    wallet: {
      nexusCoins: current.wallet.nexusCoins + rewardCoins,
      totalEarned: current.wallet.totalEarned + rewardCoins,
      nightSigils: current.wallet.nightSigils,
      relicFragments: current.wallet.relicFragments,
      nightRewards: current.wallet.nightRewards,
      equippedNightRelicId: current.wallet.equippedNightRelicId,
    },
    inventory,
    diary: appendDiary(current.diary, diaryAdditions),
  };
}

export function applyFamiliarInventoryItem(
  state: FamiliarHomeState,
  itemId: FamiliarInventoryItemId,
  now = Date.now(),
): FamiliarHomeState {
  const item = FAMILIAR_ITEM_CATALOG.find((candidate) => candidate.id === itemId);
  if (!item) return state;
  const currentQuantity = state.inventory.quantities[itemId];
  if (currentQuantity <= 0) {
    return { ...state, lastOutcome: `${item.name}: scorte terminate. Rifornisciti al Mercato.` };
  }
  const nightRelic = NIGHT_MARKET_OFFERS.find((offer) => offer.itemId === itemId);
  if (nightRelic) return equipNightMarketRelic(state, nightRelic.id);
  const actionState = performHomeAction(state, item.action, now, item.id);
  if (actionState.lastActionAt !== now) return actionState;
  const needs = { ...actionState.needs };
  for (const [need, bonus] of Object.entries(item.bonus) as Array<[FamiliarNeedId, number]>) {
    needs[need] = clampNeed(needs[need] + bonus);
  }
  const recordsMemory = ["moon-compass", "memory-crown", "runic-tablet"].includes(item.id);
  return {
    ...actionState,
    needs,
    activeItemId: item.id,
    lastOutcome: item.outcome,
    diary: recordsMemory
      ? appendDiary(actionState.diary, [diaryEntry("mission", now, item.name, item.outcome)])
      : actionState.diary,
  };
}

export function grantFamiliarHomeMissionReward(
  state: FamiliarHomeState,
  reward: { title: string; coins: number; experience: number },
  now = Date.now(),
): FamiliarHomeState {
  const coins = Math.max(0, Math.round(reward.coins));
  const memoryCrownBonus = state.wallet.equippedNightRelicId === "memory-crown";
  const experience = Math.max(0, Math.round(reward.experience * (memoryCrownBonus ? 1.2 : 1)));
  const bondXp = clampXp(state.growth.bondXp + experience);
  const stage = growthStageForXp(bondXp);
  const additions = [diaryEntry(
    "mission",
    now,
    "Missione completata",
    `${reward.title}: +${coins} monete Nexus e +${experience} XP legame.`,
  )];
  if (stage !== state.growth.stage) {
    additions.push(diaryEntry(
      "growth",
      now,
      `Nuovo stadio: ${GROWTH_STAGES[stage].label}`,
      "Il legame è cresciuto e il Famiglio mostra una presenza più matura.",
    ));
  }
  const sigilPouchBonus = state.wallet.equippedNightRelicId === "sigil-pouch" ? 1 : 0;
  return {
    ...state,
    lastOutcome: `${reward.title} completata: ricompensa riscossa.${sigilPouchBonus ? " Borsa dei sigilli: +1 Sigillo Notturno." : ""}${memoryCrownBonus ? " Corona delle memorie: +20% XP missione." : ""}`,
    growth: { ...state.growth, bondXp, stage },
    wallet: {
      nexusCoins: state.wallet.nexusCoins + coins,
      totalEarned: state.wallet.totalEarned + coins,
      nightSigils: state.wallet.nightSigils + 1 + sigilPouchBonus,
      relicFragments: state.wallet.relicFragments + (stage === "adulto" ? 1 : 0),
      nightRewards: state.wallet.nightRewards,
      equippedNightRelicId: state.wallet.equippedNightRelicId,
    },
    diary: appendDiary(state.diary, additions),
  };
}

export function purchaseFamiliarMarketOffer(
  state: FamiliarHomeState,
  offerId: FamiliarMarketOffer["id"],
): FamiliarHomeState {
  const offer = FAMILIAR_MARKET_OFFERS.find((candidate) => candidate.id === offerId);
  if (!offer) return state;
  if (!isGrowthStageUnlocked(state.growth.stage, offer.unlockStage)) {
    return { ...state, lastOutcome: `${offer.name} si sblocca allo stadio ${GROWTH_STAGES[offer.unlockStage].label}.` };
  }
  const item = FAMILIAR_ITEM_CATALOG.find((candidate) => candidate.id === offer.itemId);
  if (item && !item.consumable && state.inventory.quantities[offer.itemId] > 0) {
    return { ...state, lastOutcome: `${offer.name} è già nel tuo zaino.` };
  }
  if (state.wallet.nexusCoins < offer.priceCoins) {
    return { ...state, lastOutcome: `Servono ${offer.priceCoins} monete Nexus per ${offer.name}.` };
  }
  return {
    ...state,
    lastOutcome: `${offer.name}: aggiunto allo Zaino. Torna alla Casa, apri Zaino e selezionalo per usarlo.`,
    wallet: { ...state.wallet, nexusCoins: state.wallet.nexusCoins - offer.priceCoins },
    inventory: {
      ...state.inventory,
      quantities: {
        ...state.inventory.quantities,
        [offer.itemId]: state.inventory.quantities[offer.itemId] + offer.quantity,
      },
    },
  };
}

export function exchangeNightMarketOffer(state: FamiliarHomeState, offerId: string, now = Date.now()): FamiliarHomeState {
  const offer = NIGHT_MARKET_OFFERS.find((candidate) => candidate.id === offerId);
  if (!offer) return state;
  if (!isGrowthStageUnlocked(state.growth.stage, offer.unlockStage)) {
    return { ...state, lastOutcome: `${offer.name} si sblocca allo stadio ${GROWTH_STAGES[offer.unlockStage].label}.` };
  }
  if (state.wallet.nightRewards.includes(offer.id)) {
    return {
      ...state,
      inventory: { ...state.inventory, quantities: { ...state.inventory.quantities, [offer.itemId]: 1 } },
      lastOutcome: `${offer.name} appartiene già alla tua collezione ed è disponibile in Casa > Zaino.`,
    };
  }
  const balance = offer.currency === "sigils" ? state.wallet.nightSigils : state.wallet.relicFragments;
  if (balance < offer.price) {
    const label = offer.currency === "sigils" ? "Sigilli Notturni" : "Frammenti di Reliquia";
    return { ...state, lastOutcome: `Servono ${offer.price} ${label} per ${offer.name}.` };
  }
  const wallet = {
    ...state.wallet,
    nightSigils: offer.currency === "sigils" ? state.wallet.nightSigils - offer.price : state.wallet.nightSigils,
    relicFragments: offer.currency === "fragments" ? state.wallet.relicFragments - offer.price : state.wallet.relicFragments,
    nightRewards: [...state.wallet.nightRewards, offer.id],
    equippedNightRelicId: offer.id,
  };
  return {
    ...state,
    wallet,
    inventory: { ...state.inventory, quantities: { ...state.inventory.quantities, [offer.itemId]: 1 } },
    lastOutcome: `${offer.name} ottenuta ed equipaggiata. Puoi tenere attiva una sola Reliquia Notturna alla volta.`,
    diary: appendDiary(state.diary, [diaryEntry("mission", now, "Scambio notturno", `${offer.name} ottenuto da ${offer.merchant === "ronin" ? "Ronin" : "Lich"}.`)]),
  };
}

export function equipNightMarketRelic(state: FamiliarHomeState, offerId: string): FamiliarHomeState {
  const offer = NIGHT_MARKET_OFFERS.find((candidate) => candidate.id === offerId);
  if (!offer || (!state.wallet.nightRewards.includes(offerId) && state.inventory.quantities[offer.itemId] <= 0)) return state;
  if (state.wallet.equippedNightRelicId === offerId) {
    return { ...state, activeItemId: offer.itemId, lastOutcome: `${offer.name} è già la Reliquia Notturna attiva.` };
  }
  return {
    ...state,
    wallet: { ...state.wallet, equippedNightRelicId: offerId },
    activeItemId: offer.itemId,
    lastOutcome: `${offer.name} equipaggiata. La reliquia precedente è tornata nello Zaino.`,
  };
}

export function purchaseFamiliarDeviceCover(state: FamiliarHomeState, coverId: FamiliarDeviceCoverId): FamiliarHomeState {
  const cover = FAMILIAR_DEVICE_COVERS.find((candidate) => candidate.id === coverId);
  if (!cover) return state;
  if (state.deviceCover.ownedIds.includes(coverId)) return equipFamiliarDeviceCover(state, coverId);
  if (!isGrowthStageUnlocked(state.growth.stage, cover.unlockStage)) {
    return { ...state, lastOutcome: `La cover ${cover.name} si sblocca allo stadio ${GROWTH_STAGES[cover.unlockStage].label}.` };
  }
  if (state.wallet.nexusCoins < cover.priceCoins) {
    return { ...state, lastOutcome: `Servono ${cover.priceCoins} monete Nexus per la cover ${cover.name}.` };
  }
  return {
    ...state,
    lastOutcome: `Cover ${cover.name} acquistata e applicata al Nexus Pet.`,
    wallet: { ...state.wallet, nexusCoins: state.wallet.nexusCoins - cover.priceCoins },
    deviceCover: { activeId: coverId, ownedIds: [...state.deviceCover.ownedIds, coverId] },
  };
}

export function equipFamiliarDeviceCover(state: FamiliarHomeState, coverId: FamiliarDeviceCoverId): FamiliarHomeState {
  const cover = FAMILIAR_DEVICE_COVERS.find((candidate) => candidate.id === coverId);
  if (!cover || !state.deviceCover.ownedIds.includes(coverId)) return state;
  return { ...state, lastOutcome: `Cover ${cover.name} applicata al Nexus Pet.`, deviceCover: { ...state.deviceCover, activeId: coverId } };
}

export function restoreFamiliarHome(value: unknown, now = Date.now()): FamiliarHomeState {
  if (!value || typeof value !== "object") return createFamiliarHomeState(now);
  const candidate = value as Partial<FamiliarHomeState>;
  const base = createFamiliarHomeState(now);
  const rawNeeds = candidate.needs && typeof candidate.needs === "object" ? candidate.needs : base.needs;
  const rawToilet = candidate.toilet && typeof candidate.toilet === "object" ? candidate.toilet : base.toilet;
  const bondXp = clampXp(Number(candidate.growth?.bondXp ?? 0));
  const validActions = Array.isArray(candidate.routine?.completedActions)
    ? candidate.routine.completedActions.filter((action): action is FamiliarHomeAction => HOME_ACTIONS.some((item) => item.id === action))
    : [];
  const validWishAction = HOME_ACTIONS.some((item) => item.id === candidate.wish?.action);
  const wish = candidate.wish?.dayKey === localDayKey(now) && validWishAction
    ? {
        dayKey: candidate.wish.dayKey,
        action: candidate.wish.action!,
        fulfilledAt: Number.isFinite(candidate.wish.fulfilledAt) ? Number(candidate.wish.fulfilledAt) : null,
      }
    : wishForDay(now);
  const validDiary = Array.isArray(candidate.diary)
    ? candidate.diary.filter((entry): entry is FamiliarDiaryEntry => Boolean(
        entry
        && typeof entry.id === "string"
        && Number.isFinite(entry.at)
        && ["bond", "wish", "routine", "growth", "mission"].includes(entry.kind)
        && typeof entry.title === "string"
        && typeof entry.detail === "string",
      )).slice(0, MAX_DIARY_ENTRIES)
    : base.diary;
  const rawCoins = Number(candidate.wallet?.nexusCoins ?? 0);
  const nexusCoins = Number.isFinite(rawCoins) ? Math.max(0, Math.round(rawCoins)) : 0;
  const rawTotalEarned = Number(candidate.wallet?.totalEarned ?? nexusCoins);
  const totalEarned = Number.isFinite(rawTotalEarned) ? Math.max(nexusCoins, Math.round(rawTotalEarned)) : nexusCoins;
  const rawNightSigils = Number(candidate.wallet?.nightSigils ?? 0);
  const nightSigils = Number.isFinite(rawNightSigils) ? Math.max(0, Math.round(rawNightSigils)) : 0;
  const rawRelicFragments = Number(candidate.wallet?.relicFragments ?? 0);
  const relicFragments = Number.isFinite(rawRelicFragments) ? Math.max(0, Math.round(rawRelicFragments)) : 0;
  const nightRewards = Array.isArray(candidate.wallet?.nightRewards)
    ? Array.from(new Set(candidate.wallet.nightRewards.filter((id): id is string => typeof id === "string" && NIGHT_MARKET_OFFERS.some((offer) => offer.id === id))))
    : [];
  const equippedNightRelicId = nightRewards.includes(String(candidate.wallet?.equippedNightRelicId ?? ""))
    ? String(candidate.wallet?.equippedNightRelicId)
    : null;
  const baseInventory = createStarterInventory();
  const restoredQuantities = Object.fromEntries(FAMILIAR_ITEM_CATALOG.map((item) => {
    const rawQuantity = Number(candidate.inventory?.quantities?.[item.id] ?? baseInventory.quantities[item.id]);
    const nightRewardOwned = NIGHT_MARKET_OFFERS.some((offer) => offer.itemId === item.id && nightRewards.includes(offer.id));
    const quantity = nightRewardOwned
      ? Math.max(1, Number.isFinite(rawQuantity) ? Math.round(rawQuantity) : 0)
      : Number.isFinite(rawQuantity) ? Math.max(0, Math.round(rawQuantity)) : baseInventory.quantities[item.id];
    return [item.id, item.consumable ? quantity : Math.min(1, quantity)];
  })) as Record<FamiliarInventoryItemId, number>;
  const restoredEquippedItems = Object.fromEntries(HOME_ACTIONS.flatMap(({ id: action }) => {
    const requestedId = candidate.equippedItems?.[action];
    const requestedItem = FAMILIAR_ITEM_CATALOG.find((item) => item.id === requestedId);
    if (requestedItem && requestedItem.action === action && !requestedItem.consumable && restoredQuantities[requestedItem.id] > 0) {
      return [[action, requestedItem.id]];
    }
    const fallbackId = base.equippedItems[action];
    return fallbackId && restoredQuantities[fallbackId] > 0 ? [[action, fallbackId]] : [];
  })) as FamiliarEquippedItems;
  const validCoverIds = Array.isArray(candidate.deviceCover?.ownedIds)
    ? candidate.deviceCover.ownedIds.filter((id): id is FamiliarDeviceCoverId => FAMILIAR_DEVICE_COVERS.some((cover) => cover.id === id))
    : [];
  const ownedCoverIds = Array.from(new Set<FamiliarDeviceCoverId>(["nexus-violet", ...validCoverIds]));
  const activeCoverId = ownedCoverIds.includes(candidate.deviceCover?.activeId as FamiliarDeviceCoverId)
    ? candidate.deviceCover!.activeId as FamiliarDeviceCoverId
    : "nexus-violet";
  const rawActionEndsAt = Number(candidate.actionEndsAt ?? 0);
  const restoredActiveAction = Number.isFinite(rawActionEndsAt)
    && rawActionEndsAt > now
    && HOME_ACTIONS.some((entry) => entry.id === candidate.activeAction)
    ? candidate.activeAction!
    : null;
  const actionCooldowns = Object.fromEntries(HOME_ACTIONS.flatMap(({ id }) => {
    const until = Number(candidate.actionCooldowns?.[id] ?? (candidate.actionBurstAction === id ? candidate.actionCooldownUntil : 0));
    return Number.isFinite(until) && until > now ? [[id, until]] : [];
  })) as Partial<Record<FamiliarHomeAction, number>>;
  const actionBurstAction = HOME_ACTIONS.some((entry) => entry.id === candidate.actionBurstAction) ? candidate.actionBurstAction! : null;
  const actionBurstCount = actionBurstAction ? Math.max(0, Math.min(HOME_ACTION_REPEAT_LIMIT - 1, Math.round(Number(candidate.actionBurstCount ?? 0)))) : 0;
  const actionXpDayKey = localDayKey(now);
  const actionXpEarned = candidate.actionXpDayKey === actionXpDayKey ? Math.max(0, Math.min(HOME_ACTION_DAILY_XP_LIMIT, Math.round(Number(candidate.actionXpEarned ?? 0)))) : 0;
  const restoredActiveItemId = restoredActiveAction && FAMILIAR_ITEM_CATALOG.some((item) => item.id === candidate.activeItemId)
    ? candidate.activeItemId!
    : null;
  const restored: FamiliarHomeState = {
    needs: {
      hunger: clampNeed(Number(rawNeeds.hunger ?? base.needs.hunger)),
      energy: clampNeed(Number(rawNeeds.energy ?? base.needs.energy)),
      happiness: clampNeed(Number(rawNeeds.happiness ?? base.needs.happiness)),
      hygiene: clampNeed(Number(rawNeeds.hygiene ?? base.needs.hygiene)),
      affection: clampNeed(Number(rawNeeds.affection ?? base.needs.affection)),
    },
    toilet: {
      urgency: clampNeed(Number(rawToilet.urgency ?? base.toilet.urgency)),
      wasteCount: Math.max(0, Math.min(FAMILIAR_TOILET_MAX_WASTE, Math.round(Number(rawToilet.wasteCount ?? 0)))),
      lastEventAt: Number.isFinite(rawToilet.lastEventAt) ? Number(rawToilet.lastEventAt) : null,
    },
    activeAction: restoredActiveAction,
    roomAction: HOME_ACTIONS.some((action) => action.id === candidate.roomAction) ? candidate.roomAction! : null,
    actionEndsAt: restoredActiveAction ? rawActionEndsAt : null,
    actionBurstCount,
    actionBurstAction,
    actionCooldownUntil: null,
    actionCooldowns,
    actionXpDayKey,
    actionXpEarned,
    lastUpdatedAt: Number.isFinite(candidate.lastUpdatedAt) ? Number(candidate.lastUpdatedAt) : now,
    lastActionAt: Number.isFinite(candidate.lastActionAt) ? Number(candidate.lastActionAt) : null,
    lastOutcome: typeof candidate.lastOutcome === "string" ? candidate.lastOutcome : base.lastOutcome,
    growth: {
      bondXp,
      stage: growthStageForXp(bondXp),
      careStreak: Math.max(0, Math.round(Number(candidate.growth?.careStreak ?? 0))),
    },
    routine: {
      dayKey: typeof candidate.routine?.dayKey === "string" ? candidate.routine.dayKey : localDayKey(now),
      completedActions: validActions,
      careCount: Math.max(0, Math.round(Number(candidate.routine?.careCount ?? validActions.length))),
    },
    wish,
    wallet: { nexusCoins, totalEarned, nightSigils, relicFragments, nightRewards, equippedNightRelicId },
    inventory: {
      quantities: restoredQuantities,
      totalItemsUsed: Math.max(0, Math.round(Number(candidate.inventory?.totalItemsUsed ?? 0))),
    },
    equippedItems: restoredEquippedItems,
    deviceCover: { activeId: activeCoverId, ownedIds: ownedCoverIds },
    activeItemId: restoredActiveItemId,
    diary: validDiary,
  };
  return advanceFamiliarHome(restored, now);
}
