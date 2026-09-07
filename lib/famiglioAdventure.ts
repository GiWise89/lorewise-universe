import type { FamiliarGrowthStage } from "./famiglioHome.ts";
import { FAMILIAR_COLLECTION } from "./famiglioMarketExpansion.ts";

export type FamiliarAffinity = "natura" | "ardore" | "marea" | "vento" | "arcano" | "antico";
export type FamiliarBattleMoveId = "instinct" | "technique" | "guard" | "bond";
export type FamiliarDungeonId = "twilight-woods" | "astral-gardens" | "memory-crypt" | "fossil-valley";
export type FamiliarBattleOutcome = "active" | "victory" | "defeat";

export type FamiliarCombatProfile = {
  familiarId: string;
  affinity: FamiliarAffinity;
  maxTenacity: number;
  power: number;
  defense: number;
  speed: number;
  signatureName: string;
};

export type FamiliarAdventureProgress = {
  familiarId: string;
  bondXp: number;
  adventureXp: number;
  careDays: number;
  stage: FamiliarGrowthStage;
  wins: number;
  expeditions: number;
};

export type FamiliarExpedition = {
  familiarId: string;
  dungeonId: FamiliarDungeonId;
  startedAt: number;
  endsAt: number;
  eventId: string;
  choiceId: string | null;
  choiceOutcome: string | null;
  rewardMultiplier: number;
};

export type FamiliarBattle = {
  familiarId: string;
  dungeonId: FamiliarDungeonId;
  familiarTenacity: number;
  enemyTenacity: number;
  turn: number;
  guarding: boolean;
  enemyGuarding: boolean;
  enemyIntent: "strike" | "guard" | "special";
  outcome: FamiliarBattleOutcome;
  log: string[];
};

export type FamiliarAdventureReward = {
  familiarId: string;
  dungeonId: FamiliarDungeonId;
  nexusCoins: number;
  nightSigils: number;
  relicFragments: number;
  bondXp: number;
  adventureXp: number;
  source?: "expedition" | "legacy-battle";
};

export type FamiliarExpeditionHistoryEntry = {
  id: string;
  familiarId: string;
  dungeonId: FamiliarDungeonId;
  completedAt: number;
  nexusCoins: number;
  nightSigils: number;
  relicFragments: number;
  adventureXp: number;
};

export type FamiliarAdventureState = {
  progress: Record<string, FamiliarAdventureProgress>;
  expedition: FamiliarExpedition | null;
  battle: FamiliarBattle | null;
  pendingReward: FamiliarAdventureReward | null;
  history: FamiliarExpeditionHistoryEntry[];
  expeditionDayKey: string;
  expeditionsToday: number;
  lastMessage: string;
};

export type FamiliarDungeon = {
  id: FamiliarDungeonId;
  name: string;
  description: string;
  durationMinutes: number;
  minimumStage: FamiliarGrowthStage;
  backgroundSrc: string;
  enemyName: string;
  enemySpriteSrc: string;
  enemyAffinity: FamiliarAffinity;
  enemyTenacity: number;
  enemyPower: number;
  enemyDefense: number;
  reward: Omit<FamiliarAdventureReward, "familiarId" | "dungeonId" | "source">;
};

export type FamiliarExpeditionChoice = {
  id: string;
  label: string;
  description: string;
  outcome: string;
  rewardMultiplier: number;
  timeDeltaMinutes: number;
};

export type FamiliarExpeditionEvent = {
  id: string;
  dungeonId: FamiliarDungeonId;
  title: string;
  prompt: string;
  choices: readonly [FamiliarExpeditionChoice, FamiliarExpeditionChoice];
};

export const FAMILIAR_DUNGEONS: readonly FamiliarDungeon[] = [
  {
    id: "twilight-woods",
    name: "Bosco del Crepuscolo",
    description: "Un sentiero breve fra radici vive e luci del Nexus.",
    durationMinutes: 5,
    minimumStage: "cucciolo",
    backgroundSrc: "/famiglio/rebuild/adventure/bosco-crepuscolo-v1.webp",
    enemyName: "Rovo Errante",
    enemySpriteSrc: "/famiglio/rebuild/adventure/rovo-errante-v1.webp",
    enemyAffinity: "natura",
    enemyTenacity: 76,
    enemyPower: 14,
    enemyDefense: 9,
    reward: { nexusCoins: 12, nightSigils: 1, relicFragments: 0, bondXp: 0, adventureXp: 28 },
  },
  {
    id: "astral-gardens",
    name: "Giardini Astrali",
    description: "Terrazze sospese, portali stellari e cristalli in movimento.",
    durationMinutes: 10,
    minimumStage: "giovane",
    backgroundSrc: "/famiglio/rebuild/adventure/giardini-astrali-v1.webp",
    enemyName: "Custode Astrale",
    enemySpriteSrc: "/famiglio/rebuild/adventure/custode-astrale-v1.webp",
    enemyAffinity: "arcano",
    enemyTenacity: 96,
    enemyPower: 17,
    enemyDefense: 12,
    reward: { nexusCoins: 20, nightSigils: 2, relicFragments: 1, bondXp: 0, adventureXp: 42 },
  },
  {
    id: "memory-crypt",
    name: "Cripta delle Memorie",
    description: "Una reliquia dimenticata attende oltre i sigilli della cripta.",
    durationMinutes: 15,
    minimumStage: "giovane",
    backgroundSrc: "/famiglio/rebuild/adventure/cripta-memorie-v1.webp",
    enemyName: "Archivista del Vuoto",
    enemySpriteSrc: "/famiglio/rebuild/adventure/archivista-vuoto-v1.webp",
    enemyAffinity: "arcano",
    enemyTenacity: 112,
    enemyPower: 20,
    enemyDefense: 14,
    reward: { nexusCoins: 26, nightSigils: 2, relicFragments: 3, bondXp: 0, adventureXp: 58 },
  },
  {
    id: "fossil-valley",
    name: "Valle Fossile",
    description: "La spedizione più lunga conduce al guardiano delle ere perdute.",
    durationMinutes: 20,
    minimumStage: "adulto",
    backgroundSrc: "/famiglio/rebuild/adventure/valle-fossile-v1.webp",
    enemyName: "Colosso d'Ambra",
    enemySpriteSrc: "/famiglio/rebuild/adventure/colosso-ambra-v1.webp",
    enemyAffinity: "antico",
    enemyTenacity: 136,
    enemyPower: 24,
    enemyDefense: 18,
    reward: { nexusCoins: 36, nightSigils: 3, relicFragments: 5, bondXp: 0, adventureXp: 76 },
  },
] as const;

export const FAMILIAR_EXPEDITION_EVENTS: readonly FamiliarExpeditionEvent[] = [
  { id: "radici-luminose", dungeonId: "twilight-woods", title: "Radici luminose", prompt: "Due sentieri si aprono davanti al Famiglio.", choices: [
    { id: "segui-luci", label: "Segui le luci", description: "Piu ricompense, ma il percorso richiede tempo.", outcome: "Le lucciole conducono a un nascondiglio del Nexus.", rewardMultiplier: 1.25, timeDeltaMinutes: 1 },
    { id: "sentiero-sicuro", label: "Sentiero sicuro", description: "Rientro più rapido e ricompensa normale.", outcome: "Il Famiglio evita le radici e accelera il rientro.", rewardMultiplier: 1, timeDeltaMinutes: -1 },
  ] },
  { id: "portale-incrinato", dungeonId: "astral-gardens", title: "Portale incrinato", prompt: "Un portale instabile pulsa tra i cristalli.", choices: [
    { id: "stabilizza", label: "Stabilizza il portale", description: "Usa l'affinità per recuperare frammenti extra.", outcome: "Il portale si calma e lascia cadere energia astrale.", rewardMultiplier: 1.3, timeDeltaMinutes: 2 },
    { id: "aggira", label: "Aggira il portale", description: "Nessun rischio e viaggio regolare.", outcome: "Il Famiglio prosegue lungo le terrazze esterne.", rewardMultiplier: 1, timeDeltaMinutes: 0 },
  ] },
  { id: "eco-sigillata", dungeonId: "memory-crypt", title: "Eco sigillata", prompt: "Una memoria dimenticata chiede di essere ascoltata.", choices: [
    { id: "ascolta", label: "Ascolta l'eco", description: "Richiede pazienza ma amplifica la ricompensa.", outcome: "La memoria riconosce il legame del Custode.", rewardMultiplier: 1.35, timeDeltaMinutes: 3 },
    { id: "incidi-sigillo", label: "Incidi un sigillo", description: "Conserva il ritmo della spedizione.", outcome: "Il nuovo sigillo protegge il cammino di ritorno.", rewardMultiplier: 1.1, timeDeltaMinutes: 0 },
  ] },
  { id: "orme-giganti", dungeonId: "fossil-valley", title: "Orme dei giganti", prompt: "Le tracce di una creatura antica attraversano la valle.", choices: [
    { id: "segui-orme", label: "Segui le orme", description: "Il tragitto e lungo, ma i reperti sono preziosi.", outcome: "Il Famiglio trova un deposito d'ambra fossile.", rewardMultiplier: 1.4, timeDeltaMinutes: 4 },
    { id: "osserva-distanza", label: "Osserva da lontano", description: "Raccoglie informazioni senza allungare il viaggio.", outcome: "Le osservazioni rendono il sentiero più sicuro.", rewardMultiplier: 1.12, timeDeltaMinutes: 0 },
  ] },
] as const;

export function familiarExpeditionEvent(state: FamiliarAdventureState) {
  return FAMILIAR_EXPEDITION_EVENTS.find((event) => event.id === state.expedition?.eventId) ?? null;
}

export function expeditionChoiceIsAvailable(state: FamiliarAdventureState, now = Date.now(), ignoreTimer = false) {
  const expedition = state.expedition;
  if (!expedition || expedition.choiceId) return false;
  const duration = Math.max(1, expedition.endsAt - expedition.startedAt);
  return ignoreTimer || now >= expedition.startedAt + duration * .3;
}

export function resolveFamiliarExpeditionChoice(state: FamiliarAdventureState, choiceId: string, now = Date.now(), ignoreTimer = false) {
  const expedition = state.expedition;
  const event = familiarExpeditionEvent(state);
  if (!expedition || !event) return { ok: false as const, state, error: "Nessun imprevisto disponibile." };
  if (expedition.choiceId) return { ok: false as const, state, error: "La scelta di questa spedizione è già stata compiuta." };
  if (!expeditionChoiceIsAvailable(state, now, ignoreTimer)) return { ok: false as const, state, error: "L'imprevisto non e ancora comparso." };
  const choice = event.choices.find((entry) => entry.id === choiceId);
  if (!choice) return { ok: false as const, state, error: "Scelta non disponibile." };
  return {
    ok: true as const,
    state: {
      ...state,
      expedition: {
        ...expedition,
        endsAt: Math.max(now + 5_000, expedition.endsAt + choice.timeDeltaMinutes * 60_000),
        choiceId: choice.id,
        choiceOutcome: choice.outcome,
        rewardMultiplier: choice.rewardMultiplier,
      },
      lastMessage: choice.outcome,
    },
  };
}

const SIGNATURE_MOVE_NAMES: Readonly<Record<string, string>> = {
  cat: "Balzo dei baffi", golden: "Guardia fedele", akita: "Passo del custode", "great-dane": "Urto gentile",
  schnauzer: "Fiuto fulmineo", "saint-bernard": "Soccorso alpino", husky: "Corsa boreale", rabbit: "Salto di luna",
  fox: "Finta cremisi", turtle: "Guscio saldo", panda: "Abbraccio di bambù", horse: "Galoppo del Nexus",
  "polar-bear": "Zampa glaciale", "brown-bear": "Ruggito del bosco", parrot: "Eco piumata", bird: "Raffica canora",
  chicken: "Beccata solare", wolf: "Richiamo del branco", "fairy-rabbit": "Polvere di rugiada", "demon-rabbit": "Balzo d'ombra",
  "faerie-dragon": "Scintilla fatata", "blue-wyrmling": "Soffio zaffiro", "young-green-dragon": "Spira smeraldo", owlbear: "Artiglio del gufo",
  griffin: "Picchiata regale", "elder-snail": "Scia ancestrale", "fiddle-dog": "Accordo coraggioso", "guardian-rabbit": "Scudo della tana",
  slime: "Onda gelatinosa", kappa: "Vortice del fiume", "nexus-bat": "Impulso notturno", "frost-salamander": "Brina strisciante",
  "adult-red-dragon": "Fiamma sovrana", "ancient-black-dragon": "Eclissi antica", "displacer-beast": "Passo dislocante", "ice-golem": "Baluardo di ghiaccio",
  hellhound: "Morso infernale", imp: "Dispetto ardente", beholder: "Sguardo del Nexus", bulette: "Carica sotterranea",
  "purple-worm": "Spira purpurea", tyrannosaurus: "Ruggito primordiale", triceratops: "Carica delle tre corna", velociraptor: "Assalto rapido",
  stegosaurus: "Coda a placche", brachiosaurus: "Passo del gigante", ankylosaurus: "Mazza fossile", spinosaurus: "Marea preistorica",
  parasaurolophus: "Canto della valle", pteranodon: "Picchiata fossile", dilophosaurus: "Cresta abbagliante", carnotaurus: "Scatto cornuto",
  pachycephalosaurus: "Testata d'ambra",
};

const CATEGORY_AFFINITIES: Record<(typeof FAMILIAR_COLLECTION)[number]["category"], readonly FamiliarAffinity[]> = {
  real: ["natura", "vento", "marea"],
  magical: ["arcano", "natura", "marea", "vento"],
  legendary: ["arcano", "ardore", "antico"],
  dinosaur: ["antico", "natura", "ardore"],
};

const STAGE_ORDER: Record<FamiliarGrowthStage, number> = { cucciolo: 0, giovane: 1, adulto: 2 };
const STAGE_STAT_BONUS: Record<FamiliarGrowthStage, number> = { cucciolo: 0, giovane: 8, adulto: 17 };

function idSeed(id: string) {
  return [...id].reduce((total, character, index) => total + character.charCodeAt(0) * (index + 3), 0);
}

export function growthStageForFamiliar(bondXp: number, careDays: number): FamiliarGrowthStage {
  if (bondXp >= 3_500 && careDays >= 35) return "adulto";
  if (bondXp >= 900 && careDays >= 14) return "giovane";
  return "cucciolo";
}

export function familiarCombatProfile(familiarId: string, stage: FamiliarGrowthStage): FamiliarCombatProfile {
  const familiar = FAMILIAR_COLLECTION.find((entry) => entry.id === familiarId) ?? FAMILIAR_COLLECTION[0];
  const seed = idSeed(familiar.id);
  const affinities = CATEGORY_AFFINITIES[familiar.category];
  const stageBonus = STAGE_STAT_BONUS[stage];
  return {
    familiarId: familiar.id,
    affinity: affinities[seed % affinities.length],
    maxTenacity: 82 + seed % 17 + stageBonus * 2,
    power: 14 + seed % 6 + stageBonus,
    defense: 10 + Math.floor(seed / 5) % 7 + Math.round(stageBonus * .75),
    speed: 10 + Math.floor(seed / 11) % 8 + Math.round(stageBonus * .65),
    signatureName: SIGNATURE_MOVE_NAMES[familiar.id] ?? "Tecnica del Nexus",
  };
}

export function createFamiliarAdventureProgress(familiarId: string): FamiliarAdventureProgress {
  return {
    familiarId,
    bondXp: 0,
    adventureXp: 0,
    careDays: 0,
    stage: "cucciolo",
    wins: 0,
    expeditions: 0,
  };
}

export const FAMILIAR_DAILY_EXPEDITION_LIMIT = 3;

function romeDayKey(timestamp: number) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(timestamp));
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export function familiarExpeditionsToday(state: Pick<FamiliarAdventureState, "expeditionDayKey" | "expeditionsToday">, now = Date.now()) {
  return state.expeditionDayKey === romeDayKey(now)
    ? Math.min(FAMILIAR_DAILY_EXPEDITION_LIMIT, Math.max(0, state.expeditionsToday))
    : 0;
}

export function createFamiliarAdventureState(): FamiliarAdventureState {
  return {
    progress: {},
    expedition: null,
    battle: null,
    pendingReward: null,
    history: [],
    expeditionDayKey: "",
    expeditionsToday: 0,
    lastMessage: "I Sentieri del Nexus attendono il vostro primo passo.",
  };
}

export function familiarAdventureProgress(state: FamiliarAdventureState, familiarId: string) {
  return state.progress[familiarId] ?? createFamiliarAdventureProgress(familiarId);
}

export function syncFamiliarAdventureGrowth(
  state: FamiliarAdventureState,
  familiarId: string,
  bondXp: number,
  careDays: number,
) {
  const current = familiarAdventureProgress(state, familiarId);
  const nextBondXp = Math.max(current.bondXp, Math.max(0, Math.round(bondXp)));
  const nextCareDays = Math.max(current.careDays, Math.max(0, Math.round(careDays)));
  const next = { ...current, bondXp: nextBondXp, careDays: nextCareDays, stage: growthStageForFamiliar(nextBondXp, nextCareDays) };
  return { ...state, progress: { ...state.progress, [familiarId]: next } };
}

export function dungeonIsUnlocked(stage: FamiliarGrowthStage, dungeon: FamiliarDungeon) {
  return STAGE_ORDER[stage] >= STAGE_ORDER[dungeon.minimumStage];
}

export function startFamiliarExpedition(
  state: FamiliarAdventureState,
  familiarId: string,
  dungeonId: FamiliarDungeonId,
  now = Date.now(),
) {
  if (state.expedition || state.battle || state.pendingReward) return { ok: false as const, state, error: "È già in corso una spedizione." };
  const dungeon = FAMILIAR_DUNGEONS.find((entry) => entry.id === dungeonId);
  if (!dungeon) return { ok: false as const, state, error: "Sentiero non disponibile." };
  const progress = familiarAdventureProgress(state, familiarId);
  const dayKey = romeDayKey(now);
  const expeditionsToday = familiarExpeditionsToday(state, now);
  if (expeditionsToday >= FAMILIAR_DAILY_EXPEDITION_LIMIT) {
    return { ok: false as const, state, error: "Hai già utilizzato le 3 spedizioni disponibili oggi." };
  }
  if (!dungeonIsUnlocked(progress.stage, dungeon)) {
    return { ok: false as const, state, error: `${dungeon.name} richiede lo stadio ${dungeon.minimumStage}.` };
  }
  const event = FAMILIAR_EXPEDITION_EVENTS.find((entry) => entry.dungeonId === dungeonId)!;
  const expedition: FamiliarExpedition = {
    familiarId,
    dungeonId,
    startedAt: now,
    endsAt: now + dungeon.durationMinutes * 60_000,
    eventId: event.id,
    choiceId: null,
    choiceOutcome: null,
    rewardMultiplier: 1,
  };
  return {
    ok: true as const,
    state: {
      ...state,
      expedition,
      pendingReward: null,
      expeditionDayKey: dayKey,
      expeditionsToday: expeditionsToday + 1,
      lastMessage: `${dungeon.name}: il viaggio è iniziato.`,
      progress: {
        ...state.progress,
        [familiarId]: {
          ...progress,
          expeditions: progress.expeditions + 1,
        },
      },
    },
  };
}

export function expeditionRemainingMs(state: FamiliarAdventureState, now = Date.now()) {
  return state.expedition ? Math.max(0, state.expedition.endsAt - now) : 0;
}

/**
 * Concludes the timer-only expedition and prepares its fixed reward.
 * Combat is deliberately not opened here: the battle ladder has its own state
 * and interface in the dedicated Famiglio combat module.
 */
export function completeFamiliarExpedition(state: FamiliarAdventureState, now = Date.now()) {
  if (state.pendingReward) {
    return { ok: false as const, state, error: "La ricompensa della spedizione deve ancora essere riscattata." };
  }
  if (!state.expedition) return { ok: false as const, state, error: "Nessuna spedizione in corso." };
  if (state.expedition.endsAt > now) {
    return { ok: false as const, state, error: "Il Famiglio è ancora in viaggio." };
  }
  const dungeon = FAMILIAR_DUNGEONS.find((entry) => entry.id === state.expedition?.dungeonId);
  if (!dungeon) return { ok: false as const, state, error: "Sentiero non disponibile." };
  const reward: FamiliarAdventureReward = {
    familiarId: state.expedition.familiarId,
    dungeonId: dungeon.id,
    ...dungeon.reward,
    nexusCoins: Math.max(1, Math.round(dungeon.reward.nexusCoins * (state.expedition.rewardMultiplier || 1))),
    nightSigils: Math.max(0, Math.round(dungeon.reward.nightSigils * (state.expedition.rewardMultiplier || 1))),
    relicFragments: Math.max(0, Math.round(dungeon.reward.relicFragments * (state.expedition.rewardMultiplier || 1))),
    adventureXp: Math.max(1, Math.round(dungeon.reward.adventureXp * (state.expedition.rewardMultiplier || 1))),
    bondXp: 0,
    source: "expedition",
  };
  return {
    ok: true as const,
    reward,
    state: {
      ...state,
      battle: null,
      pendingReward: reward,
      lastMessage: `${dungeon.name} completato: la ricompensa di esplorazione è pronta.`,
    },
  };
}

function nextEnemyIntent(turn: number): FamiliarBattle["enemyIntent"] {
  return turn % 4 === 0 ? "special" : turn % 3 === 0 ? "guard" : "strike";
}

export function openFamiliarExpeditionEncounter(state: FamiliarAdventureState, now = Date.now()) {
  if (!state.expedition) return { ok: false as const, state, error: "Nessuna spedizione in corso." };
  if (state.expedition.endsAt > now) return { ok: false as const, state, error: "Il Famiglio è ancora in viaggio." };
  const dungeon = FAMILIAR_DUNGEONS.find((entry) => entry.id === state.expedition!.dungeonId)!;
  const progress = familiarAdventureProgress(state, state.expedition.familiarId);
  const profile = familiarCombatProfile(progress.familiarId, progress.stage);
  const battle: FamiliarBattle = {
    familiarId: progress.familiarId,
    dungeonId: dungeon.id,
    familiarTenacity: profile.maxTenacity,
    enemyTenacity: dungeon.enemyTenacity,
    turn: 1,
    guarding: false,
    enemyGuarding: false,
    enemyIntent: nextEnemyIntent(1),
    outcome: "active",
    log: [`${dungeon.enemyName} protegge il passaggio.`, "Scegli la prima mossa."],
  };
  return { ok: true as const, state: { ...state, battle, lastMessage: `Incontro: ${dungeon.enemyName}.` } };
}

const AFFINITY_ADVANTAGE: Record<FamiliarAffinity, FamiliarAffinity> = {
  natura: "marea",
  marea: "ardore",
  ardore: "natura",
  vento: "antico",
  antico: "arcano",
  arcano: "vento",
};

export function familiarBattleMoves(familiarId: string, stage: FamiliarGrowthStage) {
  const profile = familiarCombatProfile(familiarId, stage);
  return [
    { id: "instinct" as const, name: "Istinto", description: "Un attacco affidabile.", power: 18, unlocked: true },
    { id: "technique" as const, name: profile.signatureName, description: `Tecnica ${profile.affinity} personale.`, power: 27, unlocked: stage !== "cucciolo" },
    { id: "guard" as const, name: "Guardia", description: "Riduce il prossimo colpo.", power: 0, unlocked: true },
    { id: "bond" as const, name: "Legame del Nexus", description: "Cura e sprigiona il legame adulto.", power: 34, unlocked: stage === "adulto" },
  ];
}

function boundedDamage(value: number) {
  return Math.max(4, Math.round(value));
}

export function performFamiliarBattleMove(state: FamiliarAdventureState, moveId: FamiliarBattleMoveId) {
  const battle = state.battle;
  if (!battle || battle.outcome !== "active") return { ok: false as const, state, error: "Nessun combattimento attivo." };
  const dungeon = FAMILIAR_DUNGEONS.find((entry) => entry.id === battle.dungeonId)!;
  const progress = familiarAdventureProgress(state, battle.familiarId);
  const profile = familiarCombatProfile(battle.familiarId, progress.stage);
  const move = familiarBattleMoves(battle.familiarId, progress.stage).find((entry) => entry.id === moveId);
  if (!move?.unlocked) return { ok: false as const, state, error: "Questa mossa non è ancora stata appresa." };

  const affinityBonus = AFFINITY_ADVANTAGE[profile.affinity] === dungeon.enemyAffinity ? 1.22 : 1;
  const playerBase = moveId === "guard" ? 0 : move.power + profile.power * .55;
  const playerDamage = moveId === "guard" ? 0 : boundedDamage((playerBase - dungeon.enemyDefense * .42) * affinityBonus * (battle.enemyGuarding ? .52 : 1));
  const afterPlayer = Math.max(0, battle.enemyTenacity - playerDamage);
  const log = [...battle.log.slice(-3)];
  if (moveId === "guard") log.push("Il Famiglio assume una posizione di guardia.");
  else log.push(`${move.name}: ${playerDamage} danni.`);

  if (afterPlayer <= 0) {
    const reward: FamiliarAdventureReward = { familiarId: battle.familiarId, dungeonId: dungeon.id, ...dungeon.reward, source: "legacy-battle" };
    const nextBondXp = progress.bondXp + reward.bondXp;
    const nextProgress: FamiliarAdventureProgress = {
      ...progress,
      bondXp: nextBondXp,
      adventureXp: progress.adventureXp + reward.adventureXp,
      stage: growthStageForFamiliar(nextBondXp, progress.careDays),
      wins: progress.wins + 1,
    };
    log.push(`${dungeon.enemyName} riconosce il vostro legame.`);
    return {
      ok: true as const,
      state: {
        ...state,
        battle: { ...battle, enemyTenacity: 0, outcome: "victory", log },
        pendingReward: reward,
        progress: { ...state.progress, [battle.familiarId]: nextProgress },
        lastMessage: `Vittoria nel ${dungeon.name}.`,
      },
    };
  }

  const guarded = moveId === "guard";
  const enemyBase = battle.enemyIntent === "special" ? dungeon.enemyPower * 1.4 : dungeon.enemyPower;
  const enemyDamage = battle.enemyIntent === "guard" ? 0 : boundedDamage((enemyBase - profile.defense * .38) * (guarded ? .38 : 1));
  let familiarTenacity = Math.max(0, battle.familiarTenacity - enemyDamage);
  if (moveId === "bond") familiarTenacity = Math.min(profile.maxTenacity, familiarTenacity + 14);
  if (battle.enemyIntent === "guard") log.push(`${dungeon.enemyName} prepara la propria difesa.`);
  else log.push(`${dungeon.enemyName} infligge ${enemyDamage} danni.`);
  const outcome: FamiliarBattleOutcome = familiarTenacity <= 0 ? "defeat" : "active";
  if (outcome === "defeat") log.push("Il Famiglio è stanco e torna al sicuro nella Casa.");
  const turn = battle.turn + 1;
  return {
    ok: true as const,
    state: {
      ...state,
      battle: {
        ...battle,
        familiarTenacity,
        enemyTenacity: afterPlayer,
        turn,
        guarding: guarded,
        enemyGuarding: battle.enemyIntent === "guard",
        enemyIntent: nextEnemyIntent(turn),
        outcome,
        log,
      },
      lastMessage: outcome === "defeat" ? "Il Famiglio è rientrato stanco, ma non ha perso nulla." : state.lastMessage,
    },
  };
}

export function closeFamiliarBattle(state: FamiliarAdventureState) {
  if (!state.battle || state.battle.outcome === "active") return state;
  return { ...state, battle: null, expedition: null };
}

export function claimFamiliarAdventureReward(state: FamiliarAdventureState, now = Date.now()) {
  if (!state.pendingReward) return { ok: false as const, state, error: "Nessuna ricompensa pronta." };
  const reward = state.pendingReward;
  const progress = familiarAdventureProgress(state, reward.familiarId);
  const explorationReward = reward.source === "expedition" || (!reward.source && !state.battle);
  const nextProgress = explorationReward
    ? { ...progress, adventureXp: progress.adventureXp + reward.adventureXp }
    : progress;
  const historyEntry: FamiliarExpeditionHistoryEntry = {
    id: `${reward.familiarId}:${reward.dungeonId}:${state.expedition?.startedAt ?? now}`,
    familiarId: reward.familiarId,
    dungeonId: reward.dungeonId,
    completedAt: now,
    nexusCoins: reward.nexusCoins,
    nightSigils: reward.nightSigils,
    relicFragments: reward.relicFragments,
    adventureXp: reward.adventureXp,
  };
  return {
    ok: true as const,
    reward,
    state: {
      ...state,
      pendingReward: null,
      battle: null,
      expedition: null,
      progress: { ...state.progress, [reward.familiarId]: nextProgress },
      history: [historyEntry, ...state.history.filter((entry) => entry.id !== historyEntry.id)].slice(0, 12),
      lastMessage: "Ricompensa custodita. Il Famiglio è tornato a Casa.",
    },
  };
}

export function restoreFamiliarAdventureState(value: unknown): FamiliarAdventureState {
  const base = createFamiliarAdventureState();
  if (!value || typeof value !== "object") return base;
  const candidate = value as Partial<FamiliarAdventureState>;
  const knownIds = new Set(FAMILIAR_COLLECTION.map((entry) => entry.id));
  const progressEntries = candidate.progress && typeof candidate.progress === "object"
    ? Object.entries(candidate.progress).filter(([id]) => knownIds.has(id))
    : [];
  const progress = Object.fromEntries(progressEntries.map(([id, raw]) => {
    const entry = raw as Partial<FamiliarAdventureProgress>;
    const bondXp = Math.max(0, Math.round(Number(entry.bondXp) || 0));
    const careDays = Math.max(0, Math.round(Number(entry.careDays) || 0));
    return [id, {
      familiarId: id,
      bondXp,
      adventureXp: Math.max(0, Math.round(Number(entry.adventureXp) || 0)),
      careDays,
      stage: growthStageForFamiliar(bondXp, careDays),
      wins: Math.max(0, Math.round(Number(entry.wins) || 0)),
      expeditions: Math.max(0, Math.round(Number(entry.expeditions) || 0)),
    } satisfies FamiliarAdventureProgress];
  }));
  const dungeonIds = new Set(FAMILIAR_DUNGEONS.map((entry) => entry.id));
  const expedition = candidate.expedition
    && knownIds.has(candidate.expedition.familiarId)
    && dungeonIds.has(candidate.expedition.dungeonId)
    && Number.isFinite(candidate.expedition.startedAt)
    && Number.isFinite(candidate.expedition.endsAt)
    ? {
      ...candidate.expedition,
      eventId: FAMILIAR_EXPEDITION_EVENTS.some((event) => event.id === candidate.expedition?.eventId)
        ? String(candidate.expedition.eventId)
        : FAMILIAR_EXPEDITION_EVENTS.find((event) => event.dungeonId === candidate.expedition?.dungeonId)?.id ?? "",
      choiceId: typeof candidate.expedition.choiceId === "string" ? candidate.expedition.choiceId : null,
      choiceOutcome: typeof candidate.expedition.choiceOutcome === "string" ? candidate.expedition.choiceOutcome : null,
      rewardMultiplier: Math.min(1.5, Math.max(1, Number(candidate.expedition.rewardMultiplier) || 1)),
    }
    : null;
  const battle = candidate.battle
    && knownIds.has(candidate.battle.familiarId)
    && dungeonIds.has(candidate.battle.dungeonId)
    && ["active", "victory", "defeat"].includes(candidate.battle.outcome)
    ? candidate.battle
    : null;
  const pending = candidate.pendingReward;
  const pendingReward = pending
    && knownIds.has(pending.familiarId)
    && dungeonIds.has(pending.dungeonId)
    ? {
      familiarId: pending.familiarId,
      dungeonId: pending.dungeonId,
      nexusCoins: Math.max(0, Math.round(Number(pending.nexusCoins) || 0)),
      nightSigils: Math.max(0, Math.round(Number(pending.nightSigils) || 0)),
      relicFragments: Math.max(0, Math.round(Number(pending.relicFragments) || 0)),
      bondXp: 0,
      adventureXp: Math.max(0, Math.round(Number(pending.adventureXp) || 0)),
      source: pending.source === "legacy-battle" || (!pending.source && battle?.outcome === "victory")
        ? "legacy-battle" as const
        : "expedition" as const,
    }
    : null;
  const history = Array.isArray(candidate.history)
    ? candidate.history.flatMap((raw, index) => {
      if (!raw || !knownIds.has(raw.familiarId) || !dungeonIds.has(raw.dungeonId) || !Number.isFinite(raw.completedAt)) return [];
      return [{
        id: typeof raw.id === "string" && raw.id ? raw.id : `${raw.familiarId}:${raw.dungeonId}:${raw.completedAt}:${index}`,
        familiarId: raw.familiarId,
        dungeonId: raw.dungeonId,
        completedAt: raw.completedAt,
        nexusCoins: Math.max(0, Math.round(Number(raw.nexusCoins) || 0)),
        nightSigils: Math.max(0, Math.round(Number(raw.nightSigils) || 0)),
        relicFragments: Math.max(0, Math.round(Number(raw.relicFragments) || 0)),
        adventureXp: Math.max(0, Math.round(Number(raw.adventureXp) || 0)),
      } satisfies FamiliarExpeditionHistoryEntry];
    }).slice(0, 12)
    : [];
  return {
    progress,
    expedition,
    battle,
    pendingReward,
    history,
    expeditionDayKey: typeof candidate.expeditionDayKey === "string" ? candidate.expeditionDayKey : "",
    expeditionsToday: Math.min(
      FAMILIAR_DAILY_EXPEDITION_LIMIT,
      Math.max(0, Math.round(Number(candidate.expeditionsToday) || 0)),
    ),
    lastMessage: typeof candidate.lastMessage === "string" ? candidate.lastMessage : base.lastMessage,
  };
}
