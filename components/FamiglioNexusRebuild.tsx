"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import {
  RITUAL_PHASE_DURATION_MS,
  RITUAL_PHASES,
  STARTER_COLOR_OPTIONS,
  STARTER_EGGS,
  advanceRitual,
  beginHatching,
  cancelHatching,
  createRebuildState,
  customizeFamiliar,
  enterFamiliarHome,
  returnToEggs,
  ritualProgress,
  selectStarter,
  type FamiliarSex,
  type RebuildState,
  type StarterEgg,
} from "@/lib/famiglioRebuild";
import {
  DAILY_ROUTINE_REWARD_COINS,
  DAILY_WISHES,
  DAILY_WISH_REWARD_COINS,
  FAMILIAR_DEVICE_COVERS,
  FAMILIAR_REST_PRESETS,
  FAMILIAR_ITEM_CATALOG,
  HOME_ACTIONS,
  HOME_NEEDS,
  FAMILIAR_MOODS,
  GROWTH_STAGES,
  advanceFamiliarHome,
  createFamiliarHomeState,
  dailyRoutineProgress,
  familiarMood,
  growthProgress,
  homeActionAvailability,
  performHomeAction,
  restoreFamiliarHome,
  applyFamiliarInventoryItem,
  equipFamiliarInventoryItem,
  availableFamiliarDeviceCovers,
  availableFamiliarMarketOffers,
  grantFamiliarHomeMissionReward,
  purchaseFamiliarMarketOffer,
  purchaseFamiliarDeviceCover,
  equipFamiliarDeviceCover,
  exchangeNightMarketOffer,
  equipNightMarketRelic,
  cureFamiliarHome,
  chooseFamiliarBondMemory,
  type FamiliarHomeAction,
  type FamiliarRestPresetId,
  type FamiliarDeviceCoverId,
  type FamiliarInventoryItemId,
  type FamiliarNeeds,
  type FamiliarHomeState,
  type FamiliarToiletState,
} from "@/lib/famiglioHome";
import {
  FAMILIAR_BOND_KEEPSAKES,
  FAMILIAR_BOND_WEEK,
  FAMILIAR_BOND_TRAITS,
  dominantFamiliarBondTrait,
  familiarBondEvent,
  previewFamiliarBondWeek,
  type FamiliarBondChoice,
} from "@/lib/famiglioBondWeek";
import {
  FAMILIAR_COLLECTION,
  MEDUSA_FAMILIAR_CATALOG,
  FAMILIAR_BUNDLES,
  FAMILIAR_PRICE_EUR_BY_RARITY,
  MERCHANT_ROOMS,
  NIGHT_MARKET_OFFERS,
  PREMIUM_COVERS,
  PREMIUM_COVER_PRICE_EUR,
  availablePremiumCovers,
  nightMarketIsOpen,
  familiarAnimatedPreview,
  type FamiliarCollectionEntry,
} from "@/lib/famiglioMarketExpansion";
import { FAMILIAR_SHOP_OFFERS } from "@/lib/nexusFamiliarWorld";
import { playFamiliarHomeActionCue, playFamiliarInterfaceCue } from "@/lib/nexusFamiliarAudio";
import {
  combatShopCardFor,
  createSeededMoveSchedule,
  FAMILIAR_COMBAT_CIRCUITS,
  familiarCombatEntry,
  type CombatAffinity,
  type CombatRarity,
  type CombatRole,
} from "@/lib/famiglioCombatCatalog";
import { FamiglioGuideOverlay } from "./FamiglioGuideOverlay";
import { FamiglioDailyMiniGame } from "./FamiglioDailyMiniGame";
import { familiarActivityGate, familiarCombatNeedBonus } from "@/lib/famiglioWellbeing";
import { familiarDailyMoment, familiarReturnGreeting } from "@/lib/famiglioDailyMoments";
import { familiarLevelForExperience } from "@/lib/nexusFamiliar";
import { FAMILIAR_MILESTONES } from "@/lib/nexusFamiliarProgression";
import { recordFamiliarWeeklyStep, restoreFamiliarWeeklyLoopState, type FamiliarMiniGameKind } from "@/lib/famiglioWeeklyLoop";
import {
  FAMILIAR_ATTENDANCE_SEASONS,
  claimFamiliarAttendanceReward,
  familiarAttendanceRecovery,
  familiarAttendancePosition,
  familiarAttendanceReward,
  familiarLocalDateKey,
  type FamiliarAttendanceReward,
} from "@/lib/famiglioAttendanceYear";

const FamiglioAdventure = dynamic(() => import("./FamiglioAdventure").then((module) => module.FamiglioAdventure), {
  ssr: false,
  loading: () => <div role="status">Apro i sentieri del Nexus...</div>,
});
const FamiglioCombatArena = dynamic(() => import("./FamiglioCombatArena").then((module) => module.FamiglioCombatArena), {
  ssr: false,
  loading: () => <div role="status">Preparo l&apos;Arena...</div>,
});
const FamiglioProgression = dynamic(() => import("./FamiglioProgression").then((module) => module.FamiglioProgression), {
  ssr: false,
  loading: () => <div role="status">Ricompongo il percorso...</div>,
});
import type { FamiliarGuideSection } from "@/lib/famiglioTutorial";
import {
  createFamiliarAdventureState,
  familiarAdventureProgress,
  restoreFamiliarAdventureState,
  syncFamiliarAdventureGrowth,
  type FamiliarAdventureReward,
  type FamiliarAdventureState,
} from "@/lib/famiglioAdventure";
import {
  createFamiliarCombatState,
  familiarCombatOpponents,
  restoreFamiliarCombatState,
  startFamiliarCombatBattle,
  combatLevelForXp,
  type FamiliarCombatDifficulty,
  type FamiliarCombatReward,
  type FamiliarCombatState,
} from "@/lib/famiglioCombat";

type FamiliarLevelUpNotice = { track: "Legame" | "Esplorazione" | "Combattimento"; level: number; title: string; benefits: string[] };
import {
  dailyFamiliarMissions,
  previousRomeDateKey,
  romeDateKey,
  type FamiliarMissionActivity,
  type FamiliarMissionDifficulty,
  type FamiliarMissionGroup,
} from "@/lib/nexusFamiliarMissionCatalog";
import {
  FAMILIAR_SPRITE_ROSTER,
  REQUIRED_FAMILIAR_ACTIONS,
  type FamiliarSpriteAction,
} from "@/lib/famiglioSpriteRoster";
import {
  FAMILIAR_PERSONALITIES,
  autonomousReactionText,
  chooseAutonomousDecision,
  type AutonomousFamiliarBehavior,
  type AutonomousNeedSignal,
} from "@/lib/famiglioAutonomy";
import { familiarMealAsset, familiarMealProgress } from "@/lib/famiglioFoodProfiles";
import { familiarHouseVisual } from "@/lib/famiglioHouseVisuals";
import styles from "./FamiglioNexusRebuild.module.css";
import attendanceMotion from "./FamiglioAttendanceMotion.module.css";

const FIXED_STEP_MS = 1000 / 60;
const HOUSE_MOVEMENT_SPEED_FACTOR = .62;
const NORMALIZED_HOUSE_SPRITE_SIZE = 128;
const NORMALIZED_HOUSE_FLOOR_Y = 116;
// Keep every sleeping pose on the visible centre of the cushion rather than
// aligned to the room floor in front of the bed.
const HOUSE_BED_CUSHION_CENTER_OFFSET = .52;
const HOUSE_SLEEP_SURFACE_OFFSETS: Partial<Record<FamiliarInventoryItemId, number>> = {
  "purple-bed": HOUSE_BED_CUSHION_CENTER_OFFSET,
  "cuddle-cushion": .72,
  "moon-mat": .58,
  "cloud-mat": .58,
};
const EGG_SHEET_SRC = "/famiglio/rebuild/egg-sprite-sheet.png";
const RITUAL_SKY_SRC = "/famiglio/rebuild/ritual-sky-panorama-v1.png";
const EGG_FRAME_SIZE = 32;
const FAMILIAR_SAVE_KEY = "lorewise.famiglio-rebuild.v1";
const MISSION_REFRESH_KEY_PREFIX = "lorewise.famiglio-mission-refresh.v1";
const DIARY_PAGE_SIZE = 3;
type RoomDayPhase = "morning" | "afternoon" | "evening" | "night";
type RoomPreviewPhase = RoomDayPhase | "witching";
type HomeRoomId = "home" | "feed" | "clean" | "play" | "rest";
type HomeAssetKey = `${HomeRoomId}-${RoomDayPhase}`;
type WitchingAssetKey = `${HomeRoomId}-witching`;
type LocalHouseSnapshot = {
  rebuild: RebuildState;
  home: FamiliarHomeState;
  adventure: FamiliarAdventureState;
  combat: FamiliarCombatState;
  activeFamiliarId: string | null;
};
const HOME_ROOM_IDS: readonly HomeRoomId[] = ["home", "feed", "clean", "play", "rest"];
const HOME_DAY_PHASES: readonly RoomDayPhase[] = ["morning", "afternoon", "evening", "night"];
const HOME_ASSET_SOURCES = Object.fromEntries([
  ...HOME_ROOM_IDS.flatMap((room) => HOME_DAY_PHASES.map((phase) => [
    `${room}-${phase}`,
    `/famiglio/rebuild/rooms/${room}-${phase}.webp`,
  ])),
  ...HOME_ROOM_IDS.map((room) => [
    `${room}-witching`,
    `/famiglio/rebuild/rooms/${room}-witching.webp`,
  ]),
]) as Record<HomeAssetKey | WitchingAssetKey, string>;
const HOME_ACTION_TARGETS: Record<FamiliarHomeAction, number> = {
  feed: .3,
  play: .62,
  clean: .43,
  care: .56,
  rest: .58,
};
const HOME_OBJECT_ANCHORS: Record<FamiliarHomeAction, number> = {
  feed: .24,
  play: .66,
  clean: .37,
  care: .62,
  rest: .58,
};
const HOME_ROOM_GROUND_RATIOS: Record<"home" | FamiliarHomeAction, number> = {
  home: .86,
  feed: .88,
  clean: .87,
  play: .88,
  care: .86,
  rest: .87,
};
const HOME_NAVIGATION_ICONS = {
  inventory: "/famiglio/rebuild/nav-inventory-v1.png",
  diary: "/famiglio/rebuild/nav-diary-v1.png",
  missions: "/famiglio/rebuild/nav-missions-v1.png",
  market: "/famiglio/rebuild/nav-market-v1.png",
  adventure: "/famiglio/rebuild/adventure/nav-sentieri-v1.png",
} as const;

const WALLET_ICONS = {
  nexusCoins: "/famiglio/rebuild/nexus-pet-emblem-v2.png",
  nightSigils: "/famiglio/rebuild/market/items/sigil-pouch-transparent.png",
  relicFragments: "/famiglio/rebuild/market/items/ancient-relic.png",
} as const;

const HEADER_CONTROL_ICONS = {
  wallet: "/famiglio/rebuild/header-controls/header-wallet-v1.png",
  houses: "/famiglio/rebuild/header-controls/header-houses-v1.png",
  exit: "/famiglio/rebuild/header-controls/header-exit-v1.png",
} as const;

function homeActionWaitLabel(remainingMs: number) {
  const totalSeconds = Math.max(1, Math.ceil(remainingMs / 1_000));
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  return `${minutes}:${String(totalSeconds % 60).padStart(2, "0")}`;
}

type HomeSpriteAction = FamiliarSpriteAction;

const HOUSE_ACTION_FPS: Readonly<Record<HomeSpriteAction, number>> = {
  idle: 3,
  walk: 6,
  feed: 5,
  play: 7,
  clean: 4,
  care: 5,
  sit: 2,
  groom: 3,
  sleep: 2,
  "sleep-calm": 2,
};

type AutonomousPresentation = {
  species: StarterEgg["id"];
  behavior: AutonomousFamiliarBehavior;
  reaction: string;
};

type FamiliarHomePanel = "care" | "diary" | "missions" | "market" | "adventure" | "combat" | "progression";
type MarketVendorId = "daily" | "arcane" | "cosmetics";
type MarketWing = "court" | "atelier" | "night";
type NightMarketMerchantId = "ronin" | "lich";
type AnimatedMerchantId = MarketVendorId | NightMarketMerchantId | "medusa";
type MerchantReaction = { merchantId: AnimatedMerchantId; message: string; startedAt: number };

type MarketInfoItem = {
  id: string;
  name: string;
  description: string;
  usage: string;
  effect: string;
  quantity: string;
  price: string;
  artSrc?: string;
  artKind?: "familiar" | "bundle";
  familiars?: ReadonlyArray<{ id: string; name: string; previewSrc: string }>;
  swatch?: { color: string; edge: string };
  combat?: {
    type: string;
    rarity: CombatRarity;
    affinity: CombatAffinity;
    role: CombatRole;
    hp: number;
    attack: number;
    defense: number;
    speed: number;
    moves: ReadonlyArray<{ id: string; name: string; unlock: string; description: string }>;
  };
};

const MARKET_NEED_LABELS: Record<keyof FamiliarNeeds, string> = {
  hunger: "Fame",
  energy: "Energia",
  happiness: "Gioia",
  hygiene: "Igiene",
  affection: "Affetto",
};

function marketItemEffect(bonus: Partial<FamiliarNeeds>) {
  return Object.entries(bonus)
    .map(([need, value]) => `+${value} ${MARKET_NEED_LABELS[need as keyof FamiliarNeeds]}`)
    .join(" · ");
}

function CatalogPager({ page, pages, onPage, label }: { page: number; pages: number; onPage: (page: number) => void; label: string }) {
  const safePage = Math.min(Math.max(page, 0), Math.max(0, pages - 1));
  return <nav className={styles.collectionPager} aria-label={label}>
    <button type="button" disabled={safePage === 0} onClick={() => onPage(safePage - 1)} aria-label="Pagina precedente">‹</button>
    <strong>{safePage + 1} / {pages}</strong>
    <button type="button" disabled={safePage >= pages - 1} onClick={() => onPage(safePage + 1)} aria-label="Pagina successiva">›</button>
  </nav>;
}

function MarketInfoSheet({ item, onClose }: { item: MarketInfoItem; onClose: () => void }) {
  const sheetRef = useRef<HTMLElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    const frame = window.requestAnimationFrame(() => {
      sheet.scrollTop = 0;
      sheet.focus({ preventScroll: true });
    });
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onCloseRef.current(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [item.id]);

  return createPortal(<section ref={sheetRef} tabIndex={-1} className={styles.marketInfoSheet} data-art-kind={item.artKind} role="dialog" aria-modal="true" aria-labelledby="market-item-info-title">
    <button className={styles.marketInfoClose} type="button" aria-label="Chiudi informazioni" onClick={onClose}>×</button>
    <div className={styles.marketInfoHero}>
      {item.artSrc ? <span className={styles.marketInfoArt} style={{ backgroundImage: `url(${item.artSrc})` }} aria-hidden="true" /> : null}
      {item.swatch ? <span className={styles.marketInfoSwatch} style={{ backgroundColor: item.swatch.color, borderColor: item.swatch.edge }} aria-hidden="true" /> : null}
      <div><small>Scheda articolo</small><h4 id="market-item-info-title">{item.name}</h4><p>{item.description}</p></div>
    </div>
    {item.combat ? <section className={styles.marketInfoCombat} aria-label={`Profilo di combattimento di ${item.name}`}>
      <header>
        <span><small>Tipo</small><strong>{item.combat.type}</strong></span>
        <span><small>Rarità</small><strong>{item.combat.rarity}</strong></span>
        <span><small>Affinità</small><strong>{item.combat.affinity}</strong></span>
        <span><small>Ruolo</small><strong>{item.combat.role}</strong></span>
      </header>
      <div className={styles.marketCombatStats}>
        <span><small>HP iniziali</small><b>{item.combat.hp}</b></span>
        <span><small>Attacco</small><b>{item.combat.attack}</b></span>
        <span><small>Difesa</small><b>{item.combat.defense}</b></span>
        <span><small>Velocità</small><b>{item.combat.speed}</b></span>
      </div>
      <div className={styles.marketMoveList}>
        {item.combat.moves.map((move) => <span key={move.id}><b>{move.name}</b><small>{move.unlock} · {move.description}</small></span>)}
      </div>
    </section> : null}
    {item.familiars?.length ? <section className={styles.marketInfoBundle} aria-label={`Famigli inclusi in ${item.name}`}>
      <header><strong>{item.familiars.length} Famigli inclusi</strong><span>Ogni anteprima mostra il Famiglio completo in movimento.</span></header>
      <div>{item.familiars.map((familiar) => <article key={familiar.id}>
        <span style={{ backgroundImage: `url(${familiar.previewSrc})` }} role="img" aria-label={`Anteprima animata di ${familiar.name}`} />
        <strong>{familiar.name}</strong>
      </article>)}</div>
    </section> : null}
    <dl className={styles.marketInfoDetails}>
      <div><dt>Utilizzo</dt><dd>{item.usage}</dd></div>
      <div><dt>Effetto</dt><dd>{item.effect}</dd></div>
      <div><dt>Quantità</dt><dd>{item.quantity}</dd></div>
      <div><dt>Prezzo</dt><dd>{item.price}</dd></div>
    </dl>
  </section>, document.body);
}

function familiarMarketInfo(entry: FamiliarCollectionEntry): MarketInfoItem {
  const shop = combatShopCardFor(entry.id);
  const combatEntry = familiarCombatEntry(entry.id);
  const unlockBands = new Map(createSeededMoveSchedule(entry.id, entry.id).map((unlock) => [unlock.moveId, unlock.band]));
  return {
    id: `familiar-${entry.id}`,
    name: entry.name,
    description: "Famiglio completo per Casa, Spedizioni e combattimenti del Nexus.",
    usage: shop?.purchasable
      ? "Apri Prova per usarlo nella Casa. Dopo l'acquisto può essere scelto dalla collezione personale di Medusa."
      : "Puoi provarlo in locale, ma si ottiene nel gioco superando la Soglia Leggendaria.",
    effect: shop ? `${shop.rarity} · ${shop.affinity} · ruolo ${shop.role}. Cresce in combattimento con statistiche e mosse proprie.` : "Progressione di combattimento individuale.",
    quantity: entry.variants ? `1 Famiglio con ${entry.variants.length} aspetti` : "1 Famiglio permanente",
    price: shop?.purchasable ? `${entry.priceEuro.toFixed(2).replace(".", ",")} €` : (shop?.acquisition ?? "Ricompensa di gioco"),
    artSrc: familiarAnimatedPreview(entry),
    artKind: "familiar",
    combat: shop && combatEntry ? {
      type: shop.type,
      rarity: shop.rarity,
      affinity: shop.affinity,
      role: shop.role,
      hp: shop.initialHp,
      attack: shop.initialAttack,
      defense: shop.initialDefense,
      speed: shop.initialSpeed,
      moves: combatEntry.moves.map((move) => ({
        id: move.id,
        name: move.name,
        unlock: combatEntry.initialMoveIds.includes(move.id)
          ? "Mossa iniziale"
          : (() => {
            const band = unlockBands.get(move.id);
            return band ? `Apprendimento personale tra i livelli ${band[0]}–${band[1]}` : "Mossa personale";
          })(),
        description: move.description,
      })),
    } : undefined,
  };
}

function bundleMarketInfo(bundle: (typeof FAMILIAR_BUNDLES)[number]): MarketInfoItem {
  return {
    id: `familiar-bundle-${bundle.id}`,
    name: `Bundle ${bundle.name}`,
    description: bundle.description,
    usage: "Ogni Famiglio incluso può essere scelto singolarmente dalla collezione personale di Medusa.",
    effect: "Collezione permanente; ogni specie mantiene le proprie animazioni e la stessa progressione equilibrata.",
    quantity: `${bundle.familiars.length} Famigli`,
    price: `${bundle.priceEuro.toFixed(2).replace(".", ",")} €`,
    artSrc: familiarAnimatedPreview(bundle.familiars[0]),
    artKind: "bundle",
    familiars: bundle.familiars.map((entry) => ({ id: entry.id, name: entry.name, previewSrc: familiarAnimatedPreview(entry) })),
  };
}

const MARKET_VENDORS: ReadonlyArray<{
  id: MarketVendorId;
  name: string;
  role: string;
  stallLabel: string;
  greeting: string;
  spriteSrc: string;
  roomSrc: string;
}> = [
  {
    id: "daily",
    name: "Nora",
    role: "Custode della Bancarella quotidiana",
    stallLabel: "Cibo e cura",
    greeting: "Cibo e prodotti per la cura, sempre acquistabili con Monete Nexus.",
    ...MERCHANT_ROOMS.daily,
  },
  {
    id: "arcane",
    name: "Mirra",
    role: "Custode dell'Emporio arcano",
    stallLabel: "Giochi e rarita",
    greeting: "Giochi, materiali e oggetti speciali acquistabili con Monete Nexus.",
    ...MERCHANT_ROOMS.arcane,
  },
  {
    id: "cosmetics",
    name: "Iris",
    role: "Custode della Bottega dei Colori",
    stallLabel: "Cover e colori",
    greeting: "Colori permanenti per personalizzare il guscio del Nexus Pet con Monete Nexus.",
    ...MERCHANT_ROOMS.cosmetics,
  },
] as const;

const FUTURE_MARKET_WINGS = [
  { name: "Rotazioni stagionali", keeper: "Medusa" },
] as const;

const MERCHANT_IDLE_SEQUENCES: Readonly<Record<AnimatedMerchantId, readonly number[]>> = {
  daily: [0, 1, 2, 1, 0, 3, 2, 1],
  arcane: [0, 2, 1, 3, 2, 0, 1, 0],
  cosmetics: [0, 1, 3, 2, 3, 1, 0, 2],
  medusa: [0, 3, 2, 1, 2, 3, 0, 1],
  ronin: [0, 1, 2, 3, 2, 1, 0, 3],
  lich: [0, 3, 1, 2, 3, 2, 1, 0],
};

const MERCHANT_REACTION_SEQUENCE = [0, 2, 3, 2, 1, 3, 2, 0] as const;

function merchantFrame(merchantId: AnimatedMerchantId, tick: number, reaction: MerchantReaction | null) {
  const sequence = reaction?.merchantId === merchantId ? MERCHANT_REACTION_SEQUENCE : MERCHANT_IDLE_SEQUENCES[merchantId];
  return sequence[tick % sequence.length];
}
const NIGHT_MARKET_MERCHANTS = [
  {
    id: "ronin",
    name: "Ronin itinerante",
    subtitle: "Custode degli scambi notturni",
    description: "Scambia i Sigilli Notturni guadagnati nelle missioni speciali con ricompense scelte e sempre visibili.",
    unlock: "Si sblocca raggiungendo il livello di legame richiesto.",
    sampleName: "Katana del viandante",
    sampleMeta: "Ricompensa cosmetica permanente",
    sampleProgress: "Richiede 12 Sigilli Notturni",
    actionLabel: "Scambi non ancora disponibili",
    ...MERCHANT_ROOMS.ronin,
    itemSrc: "/famiglio/rebuild/market/ronin-katana.png",
  },
  {
    id: "lich",
    name: "Lich collezionista",
    subtitle: "Ricostruttore delle reliquie",
    description: "Riunisce frammenti appartenenti a una reliquia precisa: quando la raccolta e completa, il premio e garantito.",
    unlock: "Si sblocca dopo il primo evento narrativo del Nexus.",
    sampleName: "Corona delle memorie",
    sampleMeta: "Reliquia evento permanente",
    sampleProgress: "Frammenti raccolti: 0 / 6",
    actionLabel: "Ricostruzione non ancora disponibile",
    ...MERCHANT_ROOMS.lich,
    itemSrc: "/famiglio/rebuild/market/lich-crown.png",
  },
] as const;

const ATELIER_COVER = {
  id: "serpent-micro",
  name: "Serpenti dello Specchio",
  description: "Micromotivo di serpenti smeraldo, occhi e punti dorati.",
  price: "0,99 €",
  artSrc: "/famiglio/rebuild/market/medusa-pattern-serpenti-v1.png",
  mobileArtSrc: "/famiglio/rebuild/market/medusa-pattern-serpenti-v1.png",
} as const;

type DailyMissionView = {
  id: string;
  group: FamiliarMissionGroup;
  difficulty: FamiliarMissionDifficulty;
  title: string;
  description: string;
  href: string;
  progress: number;
  target: number;
  reward: { item: string; quantity: number };
  complete: boolean;
  claimed: boolean;
};

type DailyMissionResponse = {
  date?: string;
  missions?: DailyMissionView[];
  localPreview?: boolean;
  error?: string;
  reward?: { coins: number; experience: number; item: "food" | "soap" | "medicine" | "toy"; quantity: number };
  home?: unknown;
  revision?: number;
  alreadyClaimed?: boolean;
  refreshUsed?: boolean;
};

const MISSION_GROUP_COPY: Record<FamiliarMissionGroup, { label: string; icon: string }> = {
  explore: { label: "Esplora", icon: "◇" },
  connect: { label: "Connetti", icon: "♥" },
  care: { label: "Cura", icon: "✦" },
  combat: { label: "Lotta", icon: "⚔" },
  expedition: { label: "Spedizione", icon: "⌖" },
};

const MISSION_DIFFICULTY_LABEL: Record<FamiliarMissionDifficulty, string> = {
  facile: "Facile",
  normale: "Normale",
  difficile: "Difficile",
};

const MISSION_REWARD_NAMES: Record<string, string> = {
  food: "Provviste",
  soap: "Tonico",
  medicine: "Rimedio",
  toy: "Gioco",
};

function localDailyMissionPreview() {
  const date = romeDateKey();
  const previousDate = previousRomeDateKey(date);
  const previous = dailyFamiliarMissions("anteprima-lorewise", previousDate);
  return {
    date,
    missions: dailyFamiliarMissions("anteprima-lorewise", date, previous.map((mission) => mission.id)).map((mission) => ({
      ...mission,
      progress: 0,
      complete: false,
      claimed: false,
    })),
  };
}

function diaryDate(timestamp: number) {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp);
}

type EggSpriteMode = "idle" | "confirming" | "hatching" | "hatched";

const EGG_VISUALS: Record<StarterEgg["id"], { sheetX: number; sheetY: number; filter: string }> = {
  cat: { sheetX: 0, sheetY: 200, filter: "hue-rotate(8deg) brightness(1.08)" },
  golden: { sheetX: 416, sheetY: 0, filter: "sepia(.25) saturate(1.45) brightness(1.12)" },
  rabbit: { sheetX: 0, sheetY: 0, filter: "hue-rotate(72deg) saturate(1.2)" },
  fox: { sheetX: 416, sheetY: 0, filter: "sepia(.35) saturate(1.85) hue-rotate(338deg)" },
  turtle: { sheetX: 416, sheetY: 200, filter: "sepia(.5) saturate(1.5) hue-rotate(82deg)" },
  parrot: { sheetX: 0, sheetY: 200, filter: "hue-rotate(142deg) saturate(1.25) brightness(1.15)" },
  panda: { sheetX: 416, sheetY: 200, filter: "grayscale(1) brightness(1.18)" },
  horse: { sheetX: 416, sheetY: 0, filter: "sepia(.18) saturate(.9) brightness(.92)" },
};

type StarterSpriteConfig = {
  src: string;
  frameWidth: number;
  frameHeight: number;
  frames: number;
  fps: number;
  scale: number;
};

const STARTER_SPRITES = Object.fromEntries(STARTER_EGGS.map((egg) => {
    const spriteSet = FAMILIAR_SPRITE_ROSTER[egg.id];
    const idle = spriteSet.actions.idle;
    return [egg.id, {
      src: idle.src,
      frameWidth: idle.frameWidth,
      frameHeight: idle.frameHeight,
      frames: idle.frames,
      fps: idle.fps,
      scale: spriteSet.previewScale,
    }];
  })) as Record<StarterEgg["id"], StarterSpriteConfig>;

const STARTER_VARIANT_SOURCES: Partial<Record<StarterEgg["id"], Record<string, string>>> = {
  cat: {
    grey: "/famiglio/rebuild/starters/cat/idle-grey.png",
    black: "/famiglio/rebuild/starters/cat/idle-black.png",
    brown: "/famiglio/rebuild/starters/cat/idle-brown.png",
    siamese: "/famiglio/rebuild/starters/cat/idle-siamese.png",
  },
  rabbit: {
    white: "/famiglio/rebuild/starters/rabbit/idle-white.png",
    brown: "/famiglio/rebuild/starters/rabbit/idle-brown.png",
    black: "/famiglio/rebuild/starters/rabbit/idle-black.png",
  },
  parrot: {
    blue: "/famiglio/rebuild/starters/parrot/idle-blue.png",
    red: "/famiglio/rebuild/starters/parrot/idle-red.png",
    green: "/famiglio/rebuild/starters/parrot/idle-green.png",
    silver: "/famiglio/rebuild/starters/parrot/idle-silver.png",
    violet: "/famiglio/rebuild/starters/parrot/idle-violet.png",
  },
};

const HOME_SPRITE_ACTIONS: readonly HomeSpriteAction[] = REQUIRED_FAMILIAR_ACTIONS;

const DEFAULT_VARIANT: Partial<Record<StarterEgg["id"], string>> = {
  cat: "grey",
  rabbit: "white",
  parrot: "blue",
};

function homeSpriteSequence(egg: StarterEgg, colorVariant: string | null, action: HomeSpriteAction) {
  const base = FAMILIAR_SPRITE_ROSTER[egg.id].actions[action];
  const catVariant = colorVariant || DEFAULT_VARIANT[egg.id];
  return catVariant && STARTER_VARIANT_SOURCES[egg.id]
    ? { ...base, src: `/famiglio/rebuild/starters/${egg.id}/${action}-${catVariant}.png` }
    : base;
}

let preparedEggSheet: HTMLCanvasElement | null = null;
let eggSheetRequest: Promise<HTMLCanvasElement> | null = null;
let ritualSkyRequest: Promise<HTMLImageElement> | null = null;
const starterSpriteRequests = new Map<string, Promise<HTMLImageElement>>();
const imageAssetRequests = new Map<string, Promise<HTMLImageElement>>();

function loadImageAsset(src: string): Promise<HTMLImageElement> {
  const pending = imageAssetRequests.get(src);
  if (pending) return pending;
  const request = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Asset non caricato: ${src}`));
    image.src = src;
  });
  imageAssetRequests.set(src, request);
  return request;
}

function starterSpriteConfig(egg: StarterEgg, colorVariant: string | null): StarterSpriteConfig {
  const base = STARTER_SPRITES[egg.id];
  const variantSource = colorVariant ? STARTER_VARIANT_SOURCES[egg.id]?.[colorVariant] : null;
  return variantSource ? { ...base, src: variantSource } : base;
}

function loadStarterSprite(egg: StarterEgg, colorVariant: string | null): Promise<HTMLImageElement> {
  const config = starterSpriteConfig(egg, colorVariant);
  const pending = starterSpriteRequests.get(config.src);
  if (pending) return pending;
  const request = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Sprite di ${egg.familiar} non caricato`));
    image.src = config.src;
  });
  starterSpriteRequests.set(config.src, request);
  return request;
}

function loadEggSpriteSheet(): Promise<HTMLCanvasElement> {
  if (preparedEggSheet) return Promise.resolve(preparedEggSheet);
  if (eggSheetRequest) return eggSheetRequest;
  eggSheetRequest = new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const sheet = document.createElement("canvas");
      sheet.width = image.naturalWidth;
      sheet.height = image.naturalHeight;
      const context = sheet.getContext("2d", { willReadFrequently: true });
      if (!context) {
        reject(new Error("Canvas delle uova non disponibile"));
        return;
      }
      context.drawImage(image, 0, 0);
      const pixels = context.getImageData(0, 0, sheet.width, sheet.height);
      for (let index = 0; index < pixels.data.length; index += 4) {
        const red = pixels.data[index];
        const green = pixels.data[index + 1];
        const blue = pixels.data[index + 2];
        if (Math.abs(red - 102) < 8 && Math.abs(green - 153) < 8 && Math.abs(blue - 102) < 8) {
          pixels.data[index + 3] = 0;
        }
      }
      context.putImageData(pixels, 0, 0);
      preparedEggSheet = sheet;
      resolve(sheet);
    };
    image.onerror = () => reject(new Error("Foglio sprite delle uova non caricato"));
    image.src = EGG_SHEET_SRC;
  });
  return eggSheetRequest;
}

function loadRitualSky(): Promise<HTMLImageElement> {
  if (ritualSkyRequest) return ritualSkyRequest;
  ritualSkyRequest = new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Fondale celeste della schiusa non caricato"));
    image.src = RITUAL_SKY_SRC;
  });
  return ritualSkyRequest;
}

function spriteFrame(state: RebuildState, mode: EggSpriteMode, simulationTime: number) {
  if (mode === "idle") return { column: 0, row: 0 };
  if (mode === "confirming") {
    const rockingFrames = [0, 1, 0, 2, 0, 3];
    return { column: rockingFrames[Math.floor(simulationTime / 170) % rockingFrames.length], row: 32 };
  }
  if (mode === "hatched") return { column: 11, row: 128 };
  if (state.ritualPhaseIndex === 0) {
    const bounceFrames = [0, 1, 2, 1];
    return { column: bounceFrames[Math.floor(simulationTime / 320) % bounceFrames.length], row: 64 };
  }
  if (state.ritualPhaseIndex === 1) {
    const crackRatio = Math.min(1, state.phaseElapsedMs / RITUAL_PHASE_DURATION_MS);
    return { column: Math.min(6, Math.floor(crackRatio * 6)), row: 96 };
  }
  const phaseRatio = Math.min(1, state.phaseElapsedMs / RITUAL_PHASE_DURATION_MS);
  return { column: Math.min(11, Math.floor(phaseRatio * 11)), row: 128 };
}

function drawEggSprite(
  context: CanvasRenderingContext2D,
  sheet: HTMLCanvasElement,
  egg: StarterEgg,
  centerX: number,
  centerY: number,
  size: number,
  state: RebuildState,
  mode: EggSpriteMode,
  simulationTime: number,
) {
  const visual = EGG_VISUALS[egg.id];
  const frame = spriteFrame(state, mode, simulationTime);
  context.save();
  context.imageSmoothingEnabled = false;
  context.filter = visual.filter;
  context.shadowColor = egg.color;
  context.shadowBlur = Math.max(8, size * .1);
  context.drawImage(
    sheet,
    visual.sheetX + frame.column * EGG_FRAME_SIZE,
    visual.sheetY + frame.row,
    EGG_FRAME_SIZE,
    EGG_FRAME_SIZE,
    centerX - size / 2,
    centerY - size / 2,
    size,
    size,
  );
  context.restore();
}

function drawBornFamiliar(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  egg: StarterEgg,
  centerX: number,
  groundY: number,
  availableSize: number,
  simulationTime: number,
) {
  const sprite = STARTER_SPRITES[egg.id];
  const frame = Math.floor(simulationTime / (1000 / sprite.fps)) % sprite.frames;
  const size = availableSize * sprite.scale;
  context.save();
  context.imageSmoothingEnabled = false;
  context.shadowColor = egg.color;
  context.shadowBlur = Math.max(10, size * .1);
  context.drawImage(
    image,
    frame * sprite.frameWidth,
    0,
    sprite.frameWidth,
    sprite.frameHeight,
    centerX - size / 2,
    groundY - size,
    size,
    size,
  );
  context.restore();
}

function MiniEgg({ egg }: { egg: StarterEgg }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    let frameRequest = 0;
    let lastTime = performance.now();
    let accumulator = 0;
    let simulationTime = STARTER_EGGS.findIndex((starter) => starter.id === egg.id) * 410;

    void loadEggSpriteSheet().then((sheet) => {
      if (cancelled) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = 88 * ratio;
      canvas.height = 104 * ratio;
      const context = canvas.getContext("2d");
      if (!context) return;

      const render = () => {
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        context.clearRect(0, 0, 88, 104);
        const cycleTime = simulationTime % 2800;
        const mode: EggSpriteMode = cycleTime < 1050 ? "confirming" : "idle";
        const isMoving = mode === "confirming";
        const angle = isMoving ? Math.sin(simulationTime / 145) * .08 : 0;
        const lift = isMoving ? Math.abs(Math.sin(simulationTime / 220)) * 7 : 0;
        context.save();
        context.translate(44, 54 - lift);
        context.rotate(angle);
        drawEggSprite(context, sheet, egg, 0, 0, 82, createRebuildState(), mode, simulationTime);
        context.restore();
      };

      const animate = (now: number) => {
        accumulator += Math.min(now - lastTime, 250);
        lastTime = now;
        while (accumulator >= FIXED_STEP_MS) {
          simulationTime += FIXED_STEP_MS;
          accumulator -= FIXED_STEP_MS;
        }
        render();
        frameRequest = requestAnimationFrame(animate);
      };

      frameRequest = requestAnimationFrame(animate);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frameRequest);
    };
  }, [egg]);

  return <canvas ref={canvasRef} className={styles.miniEgg} width="88" height="104" aria-hidden="true" />;
}

function FamiliarPreview({ egg, colorVariant = null }: { egg: StarterEgg; colorVariant?: string | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    let frameRequest = 0;
    let lastTime = performance.now();
    let accumulator = 0;
    let simulationTime = 0;

    void loadStarterSprite(egg, colorVariant).then((image) => {
      if (cancelled) return;
      const context = canvas.getContext("2d");
      if (!context) return;

      const render = () => {
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.max(1, Math.round(width * ratio));
        canvas.height = Math.max(1, Math.round(height * ratio));
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        context.clearRect(0, 0, width, height);
        const size = Math.min(width * .78, height * .74, 156);
        const groundY = height * .82;
        context.beginPath();
        context.ellipse(width * .5, groundY, size * .28, size * .06, 0, 0, Math.PI * 2);
        context.fillStyle = "rgba(19,37,35,.22)";
        context.fill();
        drawBornFamiliar(context, image, egg, width * .5, groundY, size, simulationTime);
      };

      const animate = (now: number) => {
        accumulator += Math.min(now - lastTime, 250);
        lastTime = now;
        while (accumulator >= FIXED_STEP_MS) {
          simulationTime += FIXED_STEP_MS;
          accumulator -= FIXED_STEP_MS;
        }
        render();
        frameRequest = requestAnimationFrame(animate);
      };
      frameRequest = requestAnimationFrame(animate);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frameRequest);
    };
  }, [egg, colorVariant]);

  return <canvas ref={canvasRef} className={styles.familiarPreview} aria-label={`Anteprima animata: ${egg.familiar}`} />;
}

function NexusCanvas({ state, egg }: { state: RebuildState; egg: StarterEgg }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    let sheet: HTMLCanvasElement | null = null;
    let familiarSheet: HTMLImageElement | null = null;
    let ritualSky: HTMLImageElement | null = null;
    let frameRequest = 0;
    let lastTime = performance.now();
    let accumulator = 0;
    let simulationTime = 0;

    const render = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const targetWidth = Math.max(1, Math.round(width * ratio));
      const targetHeight = Math.max(1, Math.round(height * ratio));
      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      }
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const current = stateRef.current;
      const active = current.stage === "hatching";
      const glow = context.createRadialGradient(width * .5, height * .48, 10, width * .5, height * .48, height * .62);
      glow.addColorStop(0, `${egg.color}48`);
      glow.addColorStop(1, "rgba(8,9,18,0)");
      context.clearRect(0, 0, width, height);
      context.fillStyle = "#111329";
      context.fillRect(0, 0, width, height);

      if (ritualSky) {
        const scale = Math.max(width / ritualSky.naturalWidth, height / ritualSky.naturalHeight);
        const panoramaWidth = ritualSky.naturalWidth * scale;
        const panoramaHeight = ritualSky.naturalHeight * scale;
        const travel = Math.max(0, panoramaWidth - width);
        const cycleDuration = active ? 84000 : 132000;
        const cycle = (simulationTime % cycleDuration) / cycleDuration;
        const fullPan = cycle <= .5 ? cycle * 2 : (1 - cycle) * 2;
        const pan = active ? fullPan : current.stage === "hatched" ? .72 + fullPan * .08 : .38 + fullPan * .1;
        context.imageSmoothingEnabled = false;
        context.drawImage(ritualSky, -travel * pan, (height - panoramaHeight) * .5, panoramaWidth, panoramaHeight);
        const veilOpacity = active ? .24 - current.ritualPhaseIndex * .045 : current.stage === "hatched" ? .12 : .2;
        context.fillStyle = `rgba(8, 8, 24, ${veilOpacity})`;
        context.fillRect(0, 0, width, height);
      } else {
        context.fillStyle = glow;
        context.fillRect(0, 0, width, height);
        for (let index = 0; index < 22; index += 1) {
          const x = ((index * 97) % 997) / 997 * width;
          const baseY = ((index * 61) % 641) / 641 * height;
          const y = (baseY + simulationTime * (.004 + index % 3 * .0015)) % height;
          context.beginPath();
          context.arc(x, y, index % 4 === 0 ? 2 : 1.2, 0, Math.PI * 2);
          context.fillStyle = `rgba(247,241,255,${.2 + index % 3 * .1})`;
          context.fill();
        }
      }

      if (current.stage === "hatched" && familiarSheet) {
        const familiarSize = Math.min(width * .46, height * .48, 230);
        const groundY = height * .72;
        context.beginPath();
        context.ellipse(width * .5, groundY, familiarSize * .29, familiarSize * .065, 0, 0, Math.PI * 2);
        context.fillStyle = "rgba(0,0,0,.3)";
        context.fill();
        drawBornFamiliar(context, familiarSheet, egg, width * .5, groundY, familiarSize, simulationTime);
      } else if (sheet) {
        const mode: EggSpriteMode = current.stage === "hatching" ? "hatching" : current.stage === "hatched" ? "hatched" : "confirming";
        const phasePower = active ? 1 + current.ritualPhaseIndex * .28 : .45;
        const bounce = active
          ? Math.abs(Math.sin(simulationTime / (current.ritualPhaseIndex === 0 ? 430 : 520))) * 11 * phasePower
          : Math.abs(Math.sin(simulationTime / 420)) * 4;
        const angle = Math.sin(simulationTime / (active ? 460 : 300)) * (active ? .055 : .04) * phasePower;
        const pulse = active && current.ritualPhaseIndex === 0
          ? 1 + Math.sin(simulationTime / 420) * .025
          : 1;
        context.beginPath();
        context.ellipse(
          width * .5,
          height * .69,
          Math.max(34, 72 - bounce * .9),
          Math.max(5, 13 - bounce * .12),
          0,
          0,
          Math.PI * 2,
        );
        context.fillStyle = `rgba(0,0,0,${Math.max(.12, .34 - bounce * .006)})`;
        context.fill();
        context.save();
        context.translate(width * .5, height * .54 - bounce);
        context.rotate(angle);
        context.scale(pulse, 2 - pulse);
        drawEggSprite(context, sheet, egg, 0, 0, Math.min(width * .54, height * .68, 280), current, mode, simulationTime);
        context.restore();
      }

      context.fillStyle = "rgba(247,241,255,.58)";
      context.font = "600 13px system-ui";
      context.textAlign = "center";
      context.fillText(active ? `Risonanza ${ritualProgress(current)}%` : egg.egg, width * .5, height - 24);
    };

    const animate = (now: number) => {
      accumulator += Math.min(now - lastTime, 250);
      lastTime = now;
      while (accumulator >= FIXED_STEP_MS) {
        simulationTime += FIXED_STEP_MS;
        accumulator -= FIXED_STEP_MS;
      }
      render();
      frameRequest = requestAnimationFrame(animate);
    };

    void loadEggSpriteSheet().then((loadedSheet) => {
      sheet = loadedSheet;
    });
    void loadStarterSprite(egg, state.colorVariant).then((loadedSprite) => {
      familiarSheet = loadedSprite;
    });
    void loadRitualSky().then((loadedSky) => {
      ritualSky = loadedSky;
    });
    frameRequest = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRequest);
  }, [egg, state.colorVariant]);

  return <canvas ref={canvasRef} className={styles.nexusCanvas} aria-label={`${egg.egg}, ${egg.familiar}`} />;
}

type HomeAssets = Record<HomeAssetKey | WitchingAssetKey, HTMLImageElement>;

function isWitchingHalfHour(date: Date) {
  return date.getHours() === 3 && date.getMinutes() < 30;
}

function drawPurchasedHome(
  context: CanvasRenderingContext2D,
  assets: HomeAssets,
  action: FamiliarHomeAction | null,
  x: number,
  y: number,
  width: number,
  height: number,
  date = new Date(),
) {
  const roomId: HomeRoomId = action === "feed" || action === "clean" || action === "play" || action === "rest" ? action : "home";
  const room = isWitchingHalfHour(date)
    ? assets[`${roomId}-witching`]
    : assets[`${roomId}-${roomDayPhase(date)}`];
  context.imageSmoothingEnabled = false;
  context.drawImage(room, x, y, width, height);
}

function roomDayPhase(date = new Date()): RoomDayPhase {
  const hour = date.getHours();
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  if (hour >= 18 && hour < 22) return "evening";
  return "night";
}


function drawHomeActionEffect(
  context: CanvasRenderingContext2D,
  action: FamiliarHomeAction | null,
  itemId: FamiliarInventoryItemId | null,
  centerX: number,
  groundY: number,
  petSize: number,
  elapsed: number,
) {
  if (!action || action === "rest") return;
  const phase = elapsed / 1000;
  context.save();
  context.imageSmoothingEnabled = false;
  if (action === "feed") {
    context.fillStyle = "#ffd36a";
    const nibble = Math.floor(phase * 5) % 3;
    context.fillRect(centerX - petSize * .49, groundY - petSize * (.2 + nibble * .025), 4, 4);
    context.fillRect(centerX - petSize * .41, groundY - petSize * (.16 + (2 - nibble) * .02), 3, 3);
  } else if (action === "clean") {
    const bubbles = [[-.42, -.32], [-.25, -.72], [.18, -.58], [.38, -.3]];
    context.strokeStyle = "#b9f4ff";
    context.lineWidth = 3;
    for (const [offsetX, offsetY] of bubbles) {
      const bob = Math.sin(phase * 4 + offsetX * 8) * 5;
      context.strokeRect(centerX + petSize * offsetX, groundY + petSize * offsetY + bob, 7, 7);
    }
  } else if (action === "care") {
    const medicine = itemId === "comfort-balm";
    context.fillStyle = medicine ? "#7df2a0" : "#ff79bb";
    for (let index = 0; index < 3; index += 1) {
      const lift = (phase * 18 + index * 17) % 48;
      const x = centerX + petSize * (.2 + index * .14);
      const y = groundY - petSize * .55 - lift;
      context.fillRect(x, y, 8, 6);
      context.fillRect(x + 2, y + 6, 4, 3);
    }
    if (medicine) {
      context.fillStyle = "#efffd7";
      const pulse = 1 + Math.floor(Math.abs(Math.sin(phase * 3)) * 2);
      context.fillRect(centerX - pulse, groundY - petSize * .86, pulse * 2 + 2, 10);
      context.fillRect(centerX - 4, groundY - petSize * .86 + 4 - pulse, 10, pulse * 2 + 2);
    }
  }
  context.restore();
}

function drawFamiliarWaste(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  wasteCount: number,
  roomX: number,
  roomY: number,
  roomWidth: number,
  roomHeight: number,
  elapsed: number,
) {
  const visibleWaste = Math.max(0, Math.min(3, Math.round(wasteCount)));
  if (!visibleWaste) return;
  const sourceFrameSize = image.naturalHeight;
  const frame = Math.floor(elapsed / 360) % 4;
  const size = Math.max(24, Math.min(42, roomHeight * .14));
  const baseX = roomX + roomWidth * .42;
  const baseY = roomY + roomHeight * .79;
  context.save();
  context.imageSmoothingEnabled = false;
  for (let index = 0; index < visibleWaste; index += 1) {
    const spread = (index - (visibleWaste - 1) / 2) * size * .4;
    const itemSize = size * (1 - index * .08);
    context.drawImage(
      image,
      frame * sourceFrameSize,
      0,
      sourceFrameSize,
      sourceFrameSize,
      baseX + spread - itemSize / 2,
      baseY - itemSize,
      itemSize,
      itemSize,
    );
  }
  context.restore();
}

type InventoryAssets = Record<FamiliarInventoryItemId, HTMLImageElement>;

function drawInventoryObject(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  itemId: FamiliarInventoryItemId,
  centerX: number,
  groundY: number,
  petSize: number,
  elapsedInteraction: number,
  elapsedPresence = elapsedInteraction,
) {
  const item = FAMILIAR_ITEM_CATALOG.find((candidate) => candidate.id === itemId);
  const ballItems: FamiliarInventoryItemId[] = ["blue-ball", "mission-ball", "comet-ball", "emerald-ball"];
  const floatingToys: FamiliarInventoryItemId[] = ["ribbon-star", "moon-moth"];
  const sleepMats: FamiliarInventoryItemId[] = ["cuddle-cushion", "moon-mat", "cloud-mat"];
  const animatedMirraItems: FamiliarInventoryItemId[] = ["comet-ball", "emerald-ball", "ribbon-star", "moon-moth", "heart-brush", "cuddle-cushion", "moon-mat", "cloud-mat"];
  const largeRelic = ["traveler-katana", "memory-crown", "runic-tablet", "memory-hourglass"].includes(itemId);
  const floatingRelic = ["prism-lantern", "magic-feather", "phoenix-feather", "soul-gem", "moon-compass", ...floatingToys].includes(itemId);
  const isBall = ballItems.includes(itemId);
  const isSleepMat = sleepMats.includes(itemId);
  const width = itemId === "purple-bed" || isSleepMat
    ? petSize * 1.65
    : itemId === "moon-meal"
      ? petSize * .34
    : isBall
      ? petSize * .34
      : itemId === "arcane-gramophone"
        ? petSize * .72
        : itemId === "cuddle-cushion"
          ? petSize * 1.15
        : largeRelic ? petSize * .62 : petSize * .46;
  const spriteFrames = animatedMirraItems.includes(itemId) ? 4 : 1;
  const sourceFrameWidth = image.naturalWidth / spriteFrames;
  const height = width / Math.max(.5, sourceFrameWidth / image.naturalHeight);
  const phase = elapsedPresence / 1000;
  const playPhase = elapsedPresence * .0045;
  const useProgress = Math.min(1, elapsedInteraction / 3_800);
  const isPlayObject = item?.action === "play";
  const isCareObject = item?.action === "care";
  const isRestObject = item?.action === "rest" && itemId !== "purple-bed" && !isSleepMat;
  const isCleaningSupply = item?.action === "clean" && item.consumable;
  const consumedScale = item?.consumable ? 1 - useProgress * .42 : 1;
  const verticalScale = isCleaningSupply ? 1 - useProgress * .5 : consumedScale;
  const lift = isBall
    ? petSize * (.1 + Math.abs(Math.sin(playPhase * 1.35)) * .12)
    : floatingRelic || isRestObject ? petSize * (.07 + Math.sin(phase * 2.5) * .035) : 0;
  const rotation = isPlayObject ? Math.sin(phase * 3.4) * .14 : isRestObject ? Math.sin(phase * 1.3) * .06 : 0;
  context.save();
  context.imageSmoothingEnabled = false;
  context.globalAlpha = item?.consumable ? Math.max(.22, 1 - useProgress * .72) : 1;
  if (floatingRelic || isCareObject || isRestObject || isSleepMat || isBall) {
    context.shadowColor = itemId === "phoenix-feather" || itemId === "comet-ball" ? "#ffb05d" : itemId === "emerald-ball" ? "#65f2ad" : itemId === "cloud-mat" ? "#aeeeff" : "#9c78ff";
    context.shadowBlur = 7 + Math.abs(Math.sin(phase * 2.4)) * 8;
  }
  const animatedCenterX = centerX;
  const animatedGroundY = isBall
    ? groundY - petSize * (.1 + Math.abs(Math.sin(playPhase * 1.35)) * .12)
    : groundY - lift;
  const drawY = animatedGroundY - height;
  if (itemId === "moon-meal") {
    // Keep the vessel at its original size and opacity. Only the food above
    // its rim is consumed, one bite per complete four-frame eating cycle.
    context.globalAlpha = 1;
    const { bites } = familiarMealProgress(elapsedInteraction);
    const isBamboo = image.naturalHeight > image.naturalWidth;
    const foodHeight = Math.floor(image.naturalHeight * (isBamboo ? .9 : .5));
    const removedRows = Math.floor(foodHeight * bites / 3);
    const remainingHeight = image.naturalHeight - removedRows;
    context.drawImage(image, 0, removedRows, image.naturalWidth, remainingHeight,
      centerX - width / 2, drawY + height * removedRows / image.naturalHeight,
      width, height * remainingHeight / image.naturalHeight);
    context.restore();
    return;
  }
  context.translate(animatedCenterX, animatedGroundY);
  context.rotate(rotation);
  context.scale(consumedScale, verticalScale);
  const spriteFrameDuration = isCareObject ? 280 : 190;
  // Cuscini e materassini sono superfici di riposo: restano perfettamente
  // fermi mentre il Famiglio vi si adagia.
  const spriteFrame = isSleepMat
    ? 0
    : spriteFrames > 1
      ? Math.floor(elapsedPresence / spriteFrameDuration) % spriteFrames
      : 0;
  context.drawImage(
    image,
    spriteFrame * sourceFrameWidth,
    0,
    sourceFrameWidth,
    image.naturalHeight,
    -width / 2,
    drawY - animatedGroundY,
    width,
    height,
  );
  context.restore();

  if ((isPlayObject || isCareObject || isRestObject) && itemId !== "purple-bed") {
    context.save();
      context.fillStyle = itemId === "phoenix-feather" || itemId === "comet-ball" ? "rgba(255,190,92,.88)" : itemId === "emerald-ball" ? "rgba(112,255,185,.82)" : "rgba(213,188,255,.82)";
    for (let index = 0; index < 3; index += 1) {
      const angle = phase * (1.4 + index * .18) + index * 2.1;
      const radius = petSize * (.3 + index * .06);
      const sparkleX = centerX + Math.cos(angle) * radius;
      const sparkleY = groundY - height * .55 + Math.sin(angle) * petSize * .16;
      const size = Math.max(2, petSize * .025);
      context.fillRect(sparkleX - size / 2, sparkleY - size / 2, size, size);
    }
    context.restore();
  }
}

function measureOpaqueFrameCenters(
  image: HTMLImageElement,
  frameWidth: number,
  frameHeight: number,
  frames: number,
) {
  const measurement = document.createElement("canvas");
  measurement.width = image.naturalWidth;
  measurement.height = image.naturalHeight;
  const context = measurement.getContext("2d", { willReadFrequently: true });
  if (!context) return Array.from({ length: frames }, () => ({ x: frameWidth * .5, y: frameHeight * .5 }));
  context.drawImage(image, 0, 0);
  return Array.from({ length: frames }, (_, frameIndex) => {
    const pixels = context.getImageData(frameIndex * frameWidth, 0, frameWidth, frameHeight).data;
    const visible = new Uint8Array(frameWidth * frameHeight);
    for (let y = 0; y < frameHeight; y += 1) for (let x = 0; x < frameWidth; x += 1) {
      if (pixels[(y * frameWidth + x) * 4 + 3] >= 32) visible[y * frameWidth + x] = 1;
    }
    let largest = { area: 0, left: 0, right: frameWidth - 1, top: 0, bottom: frameHeight - 1 };
    for (let start = 0; start < visible.length; start += 1) {
      if (!visible[start]) continue;
      const queue = [start];
      visible[start] = 0;
      let cursor = 0;
      let area = 0;
      let left = frameWidth;
      let right = -1;
      let top = frameHeight;
      let bottom = -1;
      while (cursor < queue.length) {
        const pixel = queue[cursor++];
        const x = pixel % frameWidth;
        const y = Math.floor(pixel / frameWidth);
        area += 1;
        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
        for (const [nextX, nextY] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
          if (nextX < 0 || nextX >= frameWidth || nextY < 0 || nextY >= frameHeight) continue;
          const next = nextY * frameWidth + nextX;
          if (!visible[next]) continue;
          visible[next] = 0;
          queue.push(next);
        }
      }
      if (area > largest.area) largest = { area, left, right, top, bottom };
    }
    return largest.area
      ? { x: (largest.left + largest.right) / 2, y: (largest.top + largest.bottom) / 2 }
      : { x: frameWidth * .5, y: frameHeight * .5 };
  });
}

function drawAutonomousNeedCue(
  context: CanvasRenderingContext2D,
  signal: AutonomousNeedSignal,
  centerX: number,
  groundY: number,
  petSize: number,
) {
  if (!signal) return;
  const unit = Math.max(3, Math.min(5, Math.round(petSize / 24)));
  const x = Math.round(centerX + petSize * .2);
  const y = Math.round(groundY - petSize * 1.22);
  context.save();
  context.imageSmoothingEnabled = false;
  context.fillStyle = "rgba(30, 18, 48, .9)";
  context.fillRect(x - unit, y - unit, unit * 10, unit * 9);
  context.fillStyle = "#fff8d8";
  context.fillRect(x, y, unit * 8, unit * 7);
  context.fillRect(x + unit, y + unit * 7, unit * 2, unit * 2);
  const actionBySignal: Record<Exclude<AutonomousNeedSignal, null>, FamiliarHomeAction> = {
    food: "feed",
    energy: "rest",
    play: "play",
    hygiene: "clean",
    affection: "care",
  };
  const buttonIcon = HOME_ACTIONS.find((action) => action.id === actionBySignal[signal])?.icon ?? "";
  context.font = `${Math.round(unit * 5.2)}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(buttonIcon, x + unit * 4, y + unit * 3.65);
  context.restore();
}

function drawBondMemoryAtmosphere(
  context: CanvasRenderingContext2D,
  day: number,
  roomX: number,
  roomY: number,
  roomWidth: number,
  roomHeight: number,
  elapsed: number,
) {
  const pulse = .5 + Math.sin(elapsed / 360) * .5;
  const pixel = Math.max(2, Math.round(roomWidth / 260));
  const accent = ["#c78cff", "#74efff", "#ff9bd4", "#a66cff", "#ffd96b", "#70e8ff", "#ffe374"][(day - 1) % 7] ?? "#c78cff";
  context.save();
  context.imageSmoothingEnabled = false;
  context.fillStyle = `rgba(18, 7, 34, ${.12 + pulse * .08})`;
  context.fillRect(roomX, roomY, roomWidth, roomHeight);
  context.strokeStyle = accent;
  context.fillStyle = accent;
  context.lineWidth = pixel;
  context.shadowColor = accent;
  context.shadowBlur = pixel * (4 + pulse * 4);

  if (day === 1) {
    const x = roomX + roomWidth * .16;
    const y = roomY + roomHeight * .42;
    for (let index = 0; index < 3; index += 1) {
      const radius = pixel * (4 + index * 5 + pulse * 3);
      context.globalAlpha = .85 - index * .2;
      context.strokeRect(Math.round(x - radius), Math.round(y - radius), Math.round(radius * 2), Math.round(radius * 2));
    }
  } else if (day === 2) {
    for (let index = 0; index < 5; index += 1) {
      const x = roomX + roomWidth * (.18 + index * .11);
      const y = roomY + roomHeight * (.72 - (index % 2) * .06);
      context.globalAlpha = .38 + ((index + Math.floor(elapsed / 260)) % 5) * .11;
      context.fillRect(Math.round(x), Math.round(y), pixel * 5, pixel * 8);
      context.fillRect(Math.round(x + pixel * 6), Math.round(y - pixel * 3), pixel * 3, pixel * 3);
    }
  } else if (day === 3) {
    context.font = `${Math.round(roomHeight * .1)}px serif`;
    context.textAlign = "center";
    for (let index = 0; index < 4; index += 1) {
      context.globalAlpha = .45 + index * .12;
      context.fillText(index % 2 ? "♫" : "♪", roomX + roomWidth * (.18 + index * .15), roomY + roomHeight * (.32 - Math.sin(elapsed / 420 + index) * .08));
    }
  } else if (day === 4) {
    const x = roomX + roomWidth * .2;
    const y = roomY + roomHeight * .13;
    context.globalAlpha = .72 + pulse * .18;
    context.fillStyle = "#14091f";
    context.fillRect(x, y, roomWidth * .13, roomHeight * .3);
    context.fillStyle = "#ff405f";
    context.fillRect(x + roomWidth * .035, y + roomHeight * .09, pixel * 3, pixel * 2);
    context.fillRect(x + roomWidth * .078, y + roomHeight * .09, pixel * 3, pixel * 2);
  } else if (day === 5) {
    const x = roomX + roomWidth * .18;
    const y = roomY + roomHeight * .55;
    context.globalAlpha = .88;
    context.fillStyle = "#f5cf73";
    context.fillRect(x, y, roomWidth * .2, roomHeight * .18);
    context.strokeStyle = "#7e4568";
    context.beginPath();
    context.moveTo(x + roomWidth * .03, y + roomHeight * .13);
    context.lineTo(x + roomWidth * .08, y + roomHeight * .05);
    context.lineTo(x + roomWidth * .16, y + roomHeight * .11);
    context.stroke();
  } else if (day === 6) {
    const x = roomX + roomWidth * .2;
    const y = roomY + roomHeight * .2;
    context.globalAlpha = .75;
    context.strokeRect(x, y, roomWidth * .16, roomHeight * .38);
    context.beginPath();
    context.moveTo(x + roomWidth * .08, y);
    context.lineTo(x + roomWidth * .06, y + roomHeight * .13);
    context.lineTo(x + roomWidth * .11, y + roomHeight * .22);
    context.lineTo(x + roomWidth * .07, y + roomHeight * .38);
    context.stroke();
  } else if (day === 8) {
    const x = roomX + roomWidth * .19;
    const y = roomY + roomHeight * .18;
    context.globalAlpha = .78 + pulse * .18;
    context.strokeRect(x, y, roomWidth * .15, roomHeight * .34);
    context.fillRect(x + roomWidth * .115, y + roomHeight * .17, pixel * 3, pixel * 3);
  } else if (day === 9) {
    for (let index = 0; index < 4; index += 1) {
      context.globalAlpha = .7 - index * .12;
      context.beginPath();
      context.ellipse(roomX + roomWidth * .32, roomY + roomHeight * .75, roomWidth * (.08 + index * .045 + pulse * .01), roomHeight * (.025 + index * .014), 0, 0, Math.PI * 2);
      context.stroke();
    }
  } else if (day === 10) {
    const x = roomX + roomWidth * .25;
    const y = roomY + roomHeight * .7;
    context.globalAlpha = .82 + pulse * .16;
    context.fillRect(x, y - roomHeight * .12, pixel * 3, roomHeight * .12);
    context.beginPath();
    context.ellipse(x - pixel * 4, y - roomHeight * .1, pixel * 6, pixel * 3, -.45, 0, Math.PI * 2);
    context.ellipse(x + pixel * 6, y - roomHeight * .075, pixel * 7, pixel * 3, .45, 0, Math.PI * 2);
    context.fill();
  } else if (day === 11) {
    context.globalAlpha = .72;
    context.beginPath();
    context.moveTo(roomX + roomWidth * .1, roomY + roomHeight * .76);
    context.lineTo(roomX + roomWidth * .3, roomY + roomHeight * .56);
    context.lineTo(roomX + roomWidth * .48, roomY + roomHeight * .76);
    context.stroke();
    for (let index = 0; index < 7; index += 1) context.fillRect(roomX + roomWidth * (.15 + index * .045), roomY + roomHeight * (.7 - Math.sin(index * .8) * .06), pixel * 5, pixel * 2);
  } else if (day === 12) {
    for (let index = 0; index < 12; index += 1) {
      const x = roomX + roomWidth * (.1 + ((index * 17) % 78) / 100);
      const y = roomY + roomHeight * (((elapsed / 18 + index * 37) % 80) / 100);
      context.globalAlpha = .45 + (index % 3) * .2;
      context.fillRect(x, y, pixel * 2, pixel * 5);
    }
  } else if (day === 13) {
    context.globalAlpha = .65 + pulse * .18;
    context.fillStyle = "#11051d";
    context.fillRect(roomX, roomY, roomWidth * .12, roomHeight);
    context.fillRect(roomX + roomWidth * .88, roomY, roomWidth * .12, roomHeight);
    context.strokeStyle = accent;
    for (let index = 0; index < 4; index += 1) context.strokeRect(roomX + roomWidth * (.04 + index * .24), roomY + roomHeight * .16, roomWidth * .08, roomHeight * .2);
  } else {
    const points = [[.16, .32], [.25, .2], [.32, .36], [.42, .18], [.5, .34], [.6, .22], [.68, .38]];
    context.globalAlpha = .78 + pulse * .2;
    context.beginPath();
    points.forEach(([px, py], index) => {
      const x = roomX + roomWidth * px;
      const y = roomY + roomHeight * py;
      if (index === 0) context.moveTo(x, y); else context.lineTo(x, y);
    });
    context.stroke();
    points.forEach(([px, py]) => context.fillRect(roomX + roomWidth * px - pixel, roomY + roomHeight * py - pixel, pixel * 3, pixel * 3));
  }
  context.restore();
}

function drawBondKeepsakes(
  context: CanvasRenderingContext2D,
  keepsakeIds: readonly string[],
  roomX: number,
  roomY: number,
  roomWidth: number,
  roomHeight: number,
  familiarX: number,
  familiarGroundY: number,
  petSize: number,
  elapsed: number,
) {
  if (!keepsakeIds.length) return;
  const pixel = Math.max(2, Math.round(roomWidth / 300));
  const pulse = .5 + Math.sin(elapsed / 420) * .5;
  const auraId = [...keepsakeIds].reverse().find((id) => FAMILIAR_BOND_KEEPSAKES[id]?.kind === "aura");
  context.save();
  context.imageSmoothingEnabled = false;
  if (auraId) {
    const auraColor = auraId.includes("rose") ? "#ff91cf" : auraId.includes("violet") ? "#b278ff" : auraId.includes("star") ? "#ffe66f" : "#69e9ff";
    context.strokeStyle = auraColor;
    context.fillStyle = auraColor;
    context.shadowColor = auraColor;
    context.shadowBlur = pixel * 5;
    context.globalAlpha = .24 + pulse * .16;
    context.lineWidth = pixel;
    context.beginPath();
    context.ellipse(familiarX, familiarGroundY - petSize * .44, petSize * (.52 + pulse * .05), petSize * (.33 + pulse * .035), 0, 0, Math.PI * 2);
    context.stroke();
    for (let index = 0; index < 6; index += 1) {
      const angle = elapsed / 900 + index * Math.PI / 3;
      context.globalAlpha = .45 + (index % 2) * .2;
      context.fillRect(familiarX + Math.cos(angle) * petSize * .5, familiarGroundY - petSize * .44 + Math.sin(angle) * petSize * .28, pixel * 2, pixel * 2);
    }
  }

  const objectId = [...keepsakeIds].reverse().find((id) => FAMILIAR_BOND_KEEPSAKES[id]?.kind !== "aura");
  if (objectId) {
    const x = roomX + roomWidth * .84;
    const y = roomY + roomHeight * .38;
    context.globalAlpha = .9;
    context.shadowBlur = pixel * (3 + pulse * 2);
    context.shadowColor = objectId.includes("sprout") ? "#9dff8b" : "#ffe06b";
    if (objectId.includes("song") || objectId.includes("sigil")) {
      context.fillStyle = objectId.includes("song") ? "#ef9bff" : "#68ebff";
      context.fillRect(x, y, pixel * 8, pixel * 8);
      context.fillStyle = "#fff3a2";
      context.fillRect(x + pixel * 3, y - pixel * 5, pixel * 2, pixel * 6);
      context.fillRect(x + pixel * 4, y - pixel * 5, pixel * 5, pixel * 2);
    } else if (objectId.includes("sprout")) {
      context.fillStyle = objectId.includes("gold") ? "#ffd765" : "#6be9dc";
      context.fillRect(x + pixel * 3, y, pixel * 2, pixel * 9);
      context.fillRect(x - pixel, y - pixel * 2, pixel * 5, pixel * 4);
      context.fillRect(x + pixel * 5, y + pixel, pixel * 6, pixel * 4);
    } else if (objectId.includes("lantern") || objectId.includes("home")) {
      context.fillStyle = "#6b3c82";
      context.fillRect(x, y, pixel * 10, pixel * 12);
      context.fillStyle = "#ffe46d";
      context.fillRect(x + pixel * 3, y + pixel * 3, pixel * 4, pixel * 6);
    } else {
      context.strokeStyle = "#ffe46d";
      context.lineWidth = pixel * 2;
      context.beginPath();
      context.arc(x + pixel * 5, y + pixel * 5, pixel * 5, 0, Math.PI * 2);
      context.stroke();
      context.fillStyle = "#d77cff";
      context.fillRect(x + pixel * 4, y - pixel * 2, pixel * 2, pixel * 14);
    }
  }
  context.restore();
}

function FamiliarHomeCanvas({
  egg,
  collectionFamiliar,
  colorVariant,
  action,
  room,
  actionEndsAt,
  activeItemId,
  equippedRestItemId,
  needs,
  toilet,
  sick,
  growthScale,
  growthStage,
  away,
  roomTime,
  bondStoryDay,
  bondStoryActive,
  bondStoryVisible,
  bondKeepsakeIds,
  onAutonomousReaction,
  onMealFinished,
}: {
  egg: StarterEgg;
  collectionFamiliar?: FamiliarCollectionEntry | null;
  colorVariant: string | null;
  action: FamiliarHomeAction | null;
  room: FamiliarHomeAction | null;
  actionEndsAt: number | null;
  activeItemId: FamiliarInventoryItemId | null;
  equippedRestItemId: FamiliarInventoryItemId;
  needs: FamiliarNeeds;
  toilet: FamiliarToiletState;
  sick: boolean;
  growthScale: number;
  growthStage: "cucciolo" | "giovane" | "adulto";
  away: boolean;
  roomTime: Date | null;
  bondStoryDay: number | null;
  bondStoryActive: boolean;
  bondStoryVisible: boolean;
  bondKeepsakeIds: readonly string[];
  onAutonomousReaction: (presentation: AutonomousPresentation) => void;
  onMealFinished: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const actionRef = useRef<FamiliarHomeAction | null>(action);
  const actionStartRef = useRef(0);
  const interactionStartRef = useRef(0);
  const positionRef = useRef(.5);
  const targetRef = useRef(.5);
  const facingRef = useRef(1);
  const lastSpriteActionRef = useRef<HomeSpriteAction>("idle");
  const sequenceStartRef = useRef(0);
  const needsRef = useRef(needs);
  const toiletRef = useRef(toilet);
  const roomTimeRef = useRef(roomTime);
  const roomRef = useRef(room);
  const activeItemIdRef = useRef(activeItemId);
  const equippedRestItemIdRef = useRef(equippedRestItemId);
  const bondKeepsakeIdsRef = useRef(bondKeepsakeIds);
  const reactionCallbackRef = useRef(onAutonomousReaction);
  const mealFinishedRef = useRef(onMealFinished);
  const sceneOpenedAtRef = useRef(0);
  useEffect(() => { mealFinishedRef.current = onMealFinished; }, [onMealFinished]);
  const personality = FAMILIAR_PERSONALITIES[egg.id];
  const collectionVisual = collectionFamiliar ? familiarHouseVisual(collectionFamiliar.id) : null;
  const autonomousRef = useRef<{
    behavior: AutonomousFamiliarBehavior;
    endsAt: number;
    movementSpeed: number;
    signal: AutonomousNeedSignal;
    reaction: string;
  }>({
    behavior: "idle",
    endsAt: 0,
    movementSpeed: personality.movementSpeed,
    signal: null,
    reaction: autonomousReactionText(egg.id, "idle"),
  });

  useEffect(() => {
    needsRef.current = needs;
  }, [needs]);

  useEffect(() => {
    toiletRef.current = toilet;
  }, [toilet]);

  useEffect(() => {
    roomTimeRef.current = roomTime;
  }, [roomTime]);

  useEffect(() => {
    roomRef.current = room;
  }, [room]);

  useEffect(() => {
    activeItemIdRef.current = activeItemId;
  }, [activeItemId]);

  useEffect(() => {
    equippedRestItemIdRef.current = equippedRestItemId;
  }, [equippedRestItemId]);

  useEffect(() => {
    bondKeepsakeIdsRef.current = bondKeepsakeIds;
  }, [bondKeepsakeIds]);

  useEffect(() => {
    reactionCallbackRef.current = onAutonomousReaction;
  }, [onAutonomousReaction]);

  useEffect(() => {
    actionRef.current = action;
    actionStartRef.current = performance.now();
    interactionStartRef.current = 0;
    if (action) {
      targetRef.current = HOME_ACTION_TARGETS[action];
    } else {
      targetRef.current = positionRef.current;
      const reaction = autonomousReactionText(egg.id, "idle");
      autonomousRef.current = {
        behavior: "idle",
        endsAt: performance.now() + 900,
        movementSpeed: personality.movementSpeed,
        signal: null,
        reaction,
      };
      reactionCallbackRef.current({ species: egg.id, behavior: "idle", reaction });
    }
  }, [action, actionEndsAt, egg.id, personality.movementSpeed]);

  useEffect(() => {
    if (bondStoryActive && !actionRef.current) targetRef.current = .76;
  }, [bondStoryActive, bondStoryDay]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    let cancelled = false;
    let frameRequest = 0;
    let lastTime = performance.now();
    let accumulator = 0;
    let simulationTime = 0;
    let assets: HomeAssets | null = null;
    let inventoryAssets: InventoryAssets | null = null;
    let wasteAsset: HTMLImageElement | null = null;
    let hygieneTrailAsset: HTMLImageElement | null = null;
    const spriteImages = new Map<HomeSpriteAction, HTMLImageElement>();
    const spriteFrameCenters = new Map<HomeSpriteAction, Array<{ x: number; y: number }>>();
    const spriteSet = FAMILIAR_SPRITE_ROSTER[egg.id];

    const render = (now: number) => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const targetWidth = Math.max(1, Math.round(width * ratio));
      const targetHeight = Math.max(1, Math.round(height * ratio));
      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      }
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);
      context.fillStyle = "#151025";
      context.fillRect(0, 0, width, height);
      if (!assets) return;

      const roomWidth = Math.min(width, height * 16 / 9);
      const roomHeight = roomWidth * 9 / 16;
      const roomX = (width - roomWidth) * .5;
      const roomY = (height - roomHeight) * .5;
      const currentAction = actionRef.current;
      drawPurchasedHome(context, assets, roomRef.current, roomX, roomY, roomWidth, roomHeight, roomTimeRef.current ?? new Date());
      if (bondStoryVisible && bondStoryDay) {
        drawBondMemoryAtmosphere(context, bondStoryDay, roomX, roomY, roomWidth, roomHeight, simulationTime);
      }
      if (away) return;
      if (wasteAsset) drawFamiliarWaste(context, wasteAsset, toiletRef.current.wasteCount, roomX, roomY, roomWidth, roomHeight, simulationTime);
      const moving = Math.abs(targetRef.current - positionRef.current) > .008;
      const autonomousBehavior = autonomousRef.current.behavior;
      const spriteAction: HomeSpriteAction = moving
        ? "walk"
        : currentAction === "rest"
          ? "sleep"
          : currentAction
            ? currentAction
            : autonomousBehavior === "sit"
              ? "sit"
              : autonomousBehavior === "groom"
                ? "groom"
                : autonomousBehavior === "sleep"
                  ? "sleep-calm"
                  : autonomousBehavior === "seek-food" || autonomousBehavior === "seek-affection"
                    ? "sit"
                  : bondStoryActive ? "sit" : "idle";
      const sprite = spriteImages.get(spriteAction);
      if (!sprite) return;
      const starterSequence = homeSpriteSequence(egg, colorVariant, spriteAction);
      const sourceFrameWidth = collectionFamiliar
        ? 128
        : starterSequence.frameWidth;
      const sourceFrameHeight = collectionFamiliar
        ? 128
        : starterSequence.frameHeight;
      const sourceFrames = collectionFamiliar
        ? 4
        : starterSequence.frames;
      const sourceFps = collectionFamiliar
        ? HOUSE_ACTION_FPS[spriteAction]
        : Math.min(starterSequence.fps, HOUSE_ACTION_FPS[spriteAction]);
      const sourceLoops = collectionFamiliar
        ? ["idle", "walk", "feed", "play", "clean", "care"].includes(spriteAction)
        : starterSequence.loop;

      if (lastSpriteActionRef.current !== spriteAction) {
        lastSpriteActionRef.current = spriteAction;
        sequenceStartRef.current = now;
      }

      const elapsedAction = Math.max(0, now - actionStartRef.current);
      if (currentAction && !moving && interactionStartRef.current === 0) interactionStartRef.current = now;
      const elapsedInteraction = interactionStartRef.current > 0
        ? Math.max(0, now - interactionStartRef.current)
        : 0;
      const mealProgress = familiarMealProgress(elapsedInteraction);
      if (currentAction === "feed" && mealProgress.finished) {
        actionRef.current = null;
        targetRef.current = positionRef.current;
        mealFinishedRef.current();
      }
      const sequenceElapsed = Math.max(0, now - sequenceStartRef.current);
      const rawFrame = Math.floor((spriteAction === "idle" ? simulationTime : sequenceElapsed) / (1000 / sourceFps));
      const frame = spriteAction === "feed" && mealProgress.settling
        ? sourceFrames - 1
        : sourceLoops ? rawFrame % sourceFrames : Math.min(sourceFrames - 1, rawFrame);
      const compactRoom = roomWidth < 500;
      const petSize = Math.min(
        roomWidth * (compactRoom ? .19 : .14),
        roomHeight * (compactRoom ? .36 : .27),
        145,
      ) * (collectionVisual?.scale ?? spriteSet.previewScale) * (collectionFamiliar ? 1 : growthScale);
      const minCenter = roomX + petSize * .55;
      const maxCenter = roomX + roomWidth - petSize * .55;
      if (currentAction === "feed") {
        const mealX = roomX + roomWidth * HOME_OBJECT_ANCHORS.feed;
        const desiredCenter = mealX + petSize * .33;
        targetRef.current = Math.max(0, Math.min(1, (desiredCenter - minCenter) / (maxCenter - minCenter)));
      }
      const centerX = minCenter + (maxCenter - minCenter) * positionRef.current;
      const roomGroundRatio = HOME_ROOM_GROUND_RATIOS[roomRef.current ?? "home"];
      const groundY = roomY + roomHeight * roomGroundRatio;
      const actionAnchor = currentAction;
      const fixedObjectCenterX = actionAnchor === "feed"
        ? roomX + roomWidth * HOME_OBJECT_ANCHORS.feed
        : actionAnchor
        ? minCenter + (maxCenter - minCenter) * HOME_OBJECT_ANCHORS[actionAnchor]
        : centerX;
      const requestedItem = activeItemIdRef.current
        ? FAMILIAR_ITEM_CATALOG.find((item) => item.id === activeItemIdRef.current)
        : null;
      const equippedRestItem = FAMILIAR_ITEM_CATALOG.find((item) =>
        item.id === equippedRestItemIdRef.current && item.action === "rest");
      const restItemId: FamiliarInventoryItemId = currentAction === "rest"
        ? equippedRestItem?.id ?? (requestedItem?.action === "rest" ? requestedItem.id : "purple-bed")
        : "purple-bed";
      if (currentAction === "rest" && inventoryAssets?.[restItemId]) {
        drawInventoryObject(context, inventoryAssets[restItemId], restItemId, fixedObjectCenterX, groundY, petSize, elapsedAction);
      }
      // Impedisce a un oggetto dell'azione precedente di contaminare quella nuova.
      const actionItemId = currentAction && requestedItem?.action === currentAction
        ? requestedItem.id
        : null;
      const displayedItemId = actionItemId
        ?? (currentAction === "feed"
          ? "moon-meal"
          : currentAction === "play"
            ? "blue-ball"
            : null);
      const configuredGroundY = groundY + roomHeight * (collectionVisual?.groundOffset ?? 0);
      const familiarGroundY = configuredGroundY;
      drawBondKeepsakes(context, bondKeepsakeIdsRef.current, roomX, roomY, roomWidth, roomHeight, centerX, familiarGroundY, petSize, simulationTime);
      const frameCenter = spriteFrameCenters.get(spriteAction)?.[frame] ?? { x: sourceFrameWidth * .5, y: sourceFrameHeight * .5 };
      const spriteDrawY = currentAction === "rest" && !moving
        ? groundY - petSize * (HOUSE_SLEEP_SURFACE_OFFSETS[restItemId] ?? HOUSE_BED_CUSHION_CENTER_OFFSET) - petSize * (frameCenter.y / sourceFrameHeight)
        : familiarGroundY - petSize * (NORMALIZED_HOUSE_FLOOR_Y / NORMALIZED_HOUSE_SPRITE_SIZE);
      const spriteDrawX = currentAction === "rest" && !moving
        ? -petSize * (frameCenter.x / sourceFrameWidth)
        : -petSize / 2;

      // Il pasto appartiene al piano della stanza: durante "Nutri" deve restare
      // dietro al Famiglio, mai sovrapporsi al corpo o al muso.
      if (displayedItemId === "moon-meal" && inventoryAssets?.[displayedItemId]) {
        drawInventoryObject(context, inventoryAssets[displayedItemId], displayedItemId, fixedObjectCenterX, groundY, petSize, elapsedInteraction, elapsedAction);
      }

      context.save();
      context.imageSmoothingEnabled = false;
      context.shadowColor = "rgba(24, 12, 36, .55)";
      context.shadowBlur = 8;
      context.translate(centerX, 0);
      const displayFacing = spriteAction === "feed" ? -1 : facingRef.current;
      context.scale(displayFacing, 1);
      context.drawImage(
        sprite,
        frame * sourceFrameWidth,
        0,
        sourceFrameWidth,
        sourceFrameHeight,
        spriteDrawX,
        spriteDrawY,
        petSize,
        petSize,
      );
      context.restore();

      if (needsRef.current.hygiene <= 20 && hygieneTrailAsset && currentAction !== "clean") {
        const trailFrameWidth = hygieneTrailAsset.naturalWidth / 16;
        const trailFrame = Math.floor(simulationTime / 115) % 16;
        const trailSize = petSize * .62;
        context.save();
        context.globalAlpha = .72;
        context.imageSmoothingEnabled = false;
        context.drawImage(hygieneTrailAsset, trailFrame * trailFrameWidth, 0, trailFrameWidth, hygieneTrailAsset.naturalHeight, centerX - trailSize * .55, familiarGroundY - petSize * .9, trailSize, trailSize);
        context.restore();
      }

      if (sick) {
        const crossSize = Math.max(2, Math.round(petSize * .045));
        const crossX = Math.round(centerX + petSize * .32);
        const crossY = Math.round(familiarGroundY - petSize * .98);
        context.save();
        context.fillStyle = "rgba(24, 14, 39, .82)";
        context.fillRect(crossX - crossSize * 2, crossY - crossSize * 2, crossSize * 5, crossSize * 5);
        context.fillStyle = "#9af0a1";
        context.fillRect(crossX, crossY - crossSize, crossSize, crossSize * 3);
        context.fillRect(crossX - crossSize, crossY, crossSize * 3, crossSize);
        context.restore();
      }

      drawHomeActionEffect(context, moving ? null : currentAction, activeItemIdRef.current, centerX, familiarGroundY, petSize, elapsedInteraction);
      if (displayedItemId && displayedItemId !== "purple-bed" && displayedItemId !== "moon-meal" && requestedItem?.action !== "rest" && inventoryAssets?.[displayedItemId]) {
        drawInventoryObject(context, inventoryAssets[displayedItemId], displayedItemId, fixedObjectCenterX, groundY, petSize, elapsedInteraction, elapsedAction);
      }
      drawAutonomousNeedCue(
        context,
        !currentAction && !moving && now - sceneOpenedAtRef.current >= 4_000
          ? autonomousRef.current.signal
          : null,
        centerX,
        familiarGroundY,
        petSize,
      );

    };

    const animate = (now: number) => {
      if (sceneOpenedAtRef.current === 0) sceneOpenedAtRef.current = now;
      // Do not spend the approach invisibly while its images are still loading.
      if (!assets || !inventoryAssets || spriteImages.size !== HOME_SPRITE_ACTIONS.length) {
        lastTime = now;
        accumulator = 0;
        render(now);
        frameRequest = requestAnimationFrame(animate);
        return;
      }
      if (actionRef.current === "feed" && interactionStartRef.current > 0 && Math.abs(targetRef.current - positionRef.current) > .008) {
        interactionStartRef.current += Math.max(0, now - lastTime);
      }
      accumulator += Math.min(now - lastTime, 250);
      lastTime = now;
      while (accumulator >= FIXED_STEP_MS) {
        simulationTime += FIXED_STEP_MS;
        if (!actionRef.current && bondStoryActive) {
          targetRef.current = .76;
          autonomousRef.current = {
            behavior: "sit",
            endsAt: now + 1_000,
            movementSpeed: personality.movementSpeed,
            signal: null,
            reaction: "Resta accanto a te e ascolta il Ricordo del Legame.",
          };
        } else if (!actionRef.current) {
          const autonomous = autonomousRef.current;
          const reachedTarget = Math.abs(targetRef.current - positionRef.current) <= .008;
          if (autonomous.behavior === "roam" && reachedTarget) {
            const reaction = autonomousReactionText(egg.id, "idle");
            autonomousRef.current = {
              behavior: "idle",
              endsAt: now + 1_800 * personality.patience,
              movementSpeed: personality.movementSpeed,
              signal: null,
              reaction,
            };
            reactionCallbackRef.current({ species: egg.id, behavior: "idle", reaction });
          } else if (now >= autonomous.endsAt) {
            const decision = chooseAutonomousDecision(egg.id, needsRef.current, autonomous.behavior);
            let destination = decision.target;
            if (decision.behavior === "roam") {
              let nextTarget = .15 + Math.random() * .7;
              if (Math.abs(nextTarget - positionRef.current) < .18) {
                nextTarget = positionRef.current < .5 ? .72 : .28;
              }
              destination = nextTarget;
            }
            targetRef.current = destination ?? positionRef.current;
            autonomousRef.current = { ...decision, endsAt: now + decision.durationMs };
            reactionCallbackRef.current({ species: egg.id, behavior: decision.behavior, reaction: decision.reaction });
          }
        }
        if (Math.abs(targetRef.current - positionRef.current) > .008) {
          const direction = Math.sign(targetRef.current - positionRef.current);
          if (direction) facingRef.current = direction;
          const movementSpeed = (actionRef.current ? personality.movementSpeed : autonomousRef.current.movementSpeed)
            * HOUSE_MOVEMENT_SPEED_FACTOR;
          positionRef.current += direction * movementSpeed * (FIXED_STEP_MS / 1000);
          if (Math.sign(targetRef.current - positionRef.current) !== direction) positionRef.current = targetRef.current;
        } else if (actionRef.current && actionRef.current !== "rest") {
          const interactionDirection = Math.sign(HOME_OBJECT_ANCHORS[actionRef.current] - HOME_ACTION_TARGETS[actionRef.current]);
          if (interactionDirection) facingRef.current = interactionDirection;
        }
        accumulator -= FIXED_STEP_MS;
      }
      render(now);
      frameRequest = requestAnimationFrame(animate);
    };

    const assetEntries = Object.entries(HOME_ASSET_SOURCES) as Array<[HomeAssetKey | WitchingAssetKey, string]>;
    void Promise.all(assetEntries.map(async ([key, src]) => [key, await loadImageAsset(src)] as const)).then((loaded) => {
      if (!cancelled) assets = Object.fromEntries(loaded) as HomeAssets;
    });
    void Promise.all(FAMILIAR_ITEM_CATALOG.map(async (item) => [
      item.id,
      await loadImageAsset(item.id === "moon-meal" ? familiarMealAsset(collectionFamiliar?.id ?? egg.id) : item.animationSrc ?? item.assetSrc),
    ] as const)).then((loaded) => {
      if (!cancelled) inventoryAssets = Object.fromEntries(loaded) as InventoryAssets;
    });
    void loadImageAsset("/famiglio/rebuild/effects/cute-toilet-waste-v1.png").then((loaded) => {
      if (!cancelled) wasteAsset = loaded;
    });
    void loadImageAsset("/famiglio/rebuild/combat/vfx/status-poison.png").then((loaded) => {
      if (!cancelled) hygieneTrailAsset = loaded;
    });
    void Promise.all(HOME_SPRITE_ACTIONS.map(async (spriteAction) => {
      const src = collectionFamiliar
        ? `${collectionFamiliar.spriteBase}/growth/${growthStage}/house/${spriteAction === "feed" ? "feed-v3" : spriteAction}.png`
        : homeSpriteSequence(egg, colorVariant, spriteAction).src;
      const image = await loadImageAsset(src);
      const sequence = collectionFamiliar
        ? { frameWidth: 128, frameHeight: 128, frames: 4 }
        : homeSpriteSequence(egg, colorVariant, spriteAction);
      return [spriteAction, image, measureOpaqueFrameCenters(image, sequence.frameWidth, sequence.frameHeight, sequence.frames)] as const;
    })).then((loaded) => {
      if (!cancelled) loaded.forEach(([key, image, centers]) => {
        spriteImages.set(key, image);
        spriteFrameCenters.set(key, centers);
      });
    });
    frameRequest = requestAnimationFrame(animate);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frameRequest);
    };
  }, [egg, collectionFamiliar, collectionVisual, colorVariant, growthScale, growthStage, personality.movementSpeed, personality.patience, away, sick, bondStoryActive, bondStoryVisible, bondStoryDay]);

  return <canvas ref={canvasRef} className={styles.homeCanvas} aria-label={`Casa di ${collectionFamiliar?.name ?? egg.familiar}${toilet.wasteCount ? ", da pulire" : ""}`} />;
}

const SEX_OPTIONS: ReadonlyArray<{ id: FamiliarSex; label: string }> = [
  { id: "female", label: "Femmina" },
  { id: "male", label: "Maschio" },
  { id: "unspecified", label: "Non specificato" },
];

function SexChoiceIcon({ sex }: { sex: FamiliarSex }) {
  if (sex === "female") {
    return (
      <svg className={`${styles.sexChoiceIcon} ${styles.sexChoiceIconFemale}`} viewBox="0 0 32 32" aria-hidden="true">
        <circle cx="16" cy="6" r="4" />
        <path d="M10.8 12.2c.6-1.4 2-2.2 3.5-2.2h3.4c1.5 0 2.9.8 3.5 2.2l4.3 10.3h-5.1V30h-3v-7.5h-2.8V30h-3v-7.5H6.5l4.3-10.3Z" />
      </svg>
    );
  }
  if (sex === "male") {
    return (
      <svg className={`${styles.sexChoiceIcon} ${styles.sexChoiceIconMale}`} viewBox="0 0 32 32" aria-hidden="true">
        <circle cx="16" cy="6" r="4" />
        <path d="M11 11h10c1.7 0 3 1.3 3 3v8h-4v8h-3v-8h-2v8h-3v-8H8v-8c0-1.7 1.3-3 3-3Z" />
      </svg>
    );
  }
  return (
    <svg className={`${styles.sexChoiceIcon} ${styles.sexChoiceIconNeutral}`} viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="6" r="4" />
      <path d="M11 11h10c1.7 0 3 1.3 3 3v8h-4v8h-3v-8h-2v8h-3v-8H8v-8c0-1.7 1.3-3 3-3Z" />
    </svg>
  );
}

export function FamiglioNexusRebuild() {
  const [state, setState] = useState<RebuildState>(createRebuildState);
  const [homeState, setHomeState] = useState<FamiliarHomeState>(createFamiliarHomeState);
  const [adventureState, setAdventureState] = useState<FamiliarAdventureState>(createFamiliarAdventureState);
  const [combatState, setCombatState] = useState<FamiliarCombatState>(createFamiliarCombatState);
  const [autonomousPresentation, setAutonomousPresentation] = useState<AutonomousPresentation | null>(null);
  const [homePanel, setHomePanel] = useState<FamiliarHomePanel>("care");
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [restChoiceOpen, setRestChoiceOpen] = useState(false);
  const [levelUpNotice, setLevelUpNotice] = useState<FamiliarLevelUpNotice | null>(null);
  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const [attendanceBusy, setAttendanceBusy] = useState(false);
  const [attendanceReveal, setAttendanceReveal] = useState<FamiliarAttendanceReward | null>(null);
  const [attendanceAutoSuppressed, setAttendanceAutoSuppressed] = useState(false);
  const [miniGameOpen, setMiniGameOpen] = useState(false);
  const [bondStoryOpen, setBondStoryOpen] = useState(false);
  const [bondStoryFeedback, setBondStoryFeedback] = useState<{ choice: FamiliarBondChoice; day: number } | null>(null);
  const [storageReady, setStorageReady] = useState(false);
  const [focusedEggIndex, setFocusedEggIndex] = useState(0);
  const [homeFamiliarIndex, setHomeFamiliarIndex] = useState(0);
  const [testCollectionFamiliarId, setTestCollectionFamiliarId] = useState<string | null>(null);
  const [diaryPage, setDiaryPage] = useState(0);
  const initialMissionPreview = useMemo(() => localDailyMissionPreview(), []);
  const [missionDate, setMissionDate] = useState(initialMissionPreview.date);
  const [missions, setMissions] = useState<DailyMissionView[]>(initialMissionPreview.missions);
  const [missionMode, setMissionMode] = useState<"loading" | "live" | "preview" | "error">("loading");
  const [missionMessage, setMissionMessage] = useState("");
  const [selectedMissionIndex, setSelectedMissionIndex] = useState(0);
  const [missionRefreshUsed, setMissionRefreshUsed] = useState(false);
  const [claimingMissionId, setClaimingMissionId] = useState<string | null>(null);
  const [marketMessage, setMarketMessage] = useState("Scegli una bancarella: gli acquisti con monete entrano subito nello zaino.");
  const [selectedMarketVendor, setSelectedMarketVendor] = useState<MarketVendorId>("daily");
  const [marketWing, setMarketWing] = useState<MarketWing>("court");
  const [selectedNightMerchant, setSelectedNightMerchant] = useState<NightMarketMerchantId>("ronin");
  const [marketIdleTick, setMarketIdleTick] = useState(0);
  const [merchantReaction, setMerchantReaction] = useState<MerchantReaction | null>(null);
  const [previewDeviceCoverId, setPreviewDeviceCoverId] = useState<FamiliarDeviceCoverId | null>(null);
  const [coverCatalogPage, setCoverCatalogPage] = useState(0);
  const [marketInfoItem, setMarketInfoItem] = useState<MarketInfoItem | null>(null);
  const [atelierCoverPreview, setAtelierCoverPreview] = useState(false);
  const [selectedPremiumCoverId, setSelectedPremiumCoverId] = useState<string>(ATELIER_COVER.id);
  const [equippedPremiumCoverId, setEquippedPremiumCoverId] = useState<string | null>(null);
  const [purchasedOfferIds, setPurchasedOfferIds] = useState<string[]>([]);
  const [purchasedAppearanceIds, setPurchasedAppearanceIds] = useState<string[]>([]);
  const [checkoutOfferId, setCheckoutOfferId] = useState<string | null>(null);
  const [atelierCategory, setAtelierCategory] = useState<"covers" | "familiars" | "bundle" | "slots">("covers");
  const [atelierCatalogPage, setAtelierCatalogPage] = useState(0);
  const [compactFamiliarCatalog, setCompactFamiliarCatalog] = useState(false);
  const [houseManagerOpen, setHouseManagerOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const [homeAudioMuted, setHomeAudioMuted] = useState(false);
  const [homeAudioVolume, setHomeAudioVolume] = useState(.58);
  const [, setHomeAudioUnlocked] = useState(false);
  const [restartStep, setRestartStep] = useState<0 | 1 | 2>(0);
  const [activeHouseIndex, setActiveHouseIndex] = useState(0);
  const [localHouseTrial, setLocalHouseTrial] = useState(false);
  const [savedHouseSnapshots, setSavedHouseSnapshots] = useState<Array<LocalHouseSnapshot | null>>([null, null, null]);
  const houseSnapshotsRef = useRef<Array<LocalHouseSnapshot | null>>([null, null, null]);
  const cloudRevisionRef = useRef(0);
  const cloudSaveInFlightRef = useRef(false);
  const homeActionEndsAtRef = useRef<number | null>(null);
  const [cloudSyncReady, setCloudSyncReady] = useState(false);
  const [cloudReloadToken, setCloudReloadToken] = useState(0);
  const [marketOfferPage, setMarketOfferPage] = useState(0);
  const [combatPreparedFamiliarId, setCombatPreparedFamiliarId] = useState<string | null>(null);
  const [roomClock, setRoomClock] = useState<Date | null>(null);
  const [roomPreviewPhase, setRoomPreviewPhase] = useState<RoomPreviewPhase | null>(null);
  const [allTestMode, setAllTestMode] = useState(false);
  const [previewSession, setPreviewSession] = useState(false);
  const previewSessionRef = useRef(false);
  const familiarAway = Boolean(adventureState.expedition || combatState.activeBattle);
  const selectedEgg = useMemo(
    () => STARTER_EGGS.find((egg) => egg.id === state.selectedId) ?? null,
    [state.selectedId],
  );

  const showMerchantReaction = useCallback((merchantId: AnimatedMerchantId, message: string) => {
    setMerchantReaction({ merchantId, message, startedAt: Date.now() });
    setMarketIdleTick(0);
  }, []);

  const loadMissions = useCallback(async () => {
    try {
      const response = await fetch("/api/famiglio/missions", { credentials: "same-origin", cache: "no-store" });
      const payload = await response.json().catch(() => ({})) as DailyMissionResponse;
      if (response.status === 401) {
        const preview = localDailyMissionPreview();
        setMissionDate(preview.date);
        setMissions(preview.missions);
        setMissionMode("preview");
        return;
      }
      if (!response.ok || !Array.isArray(payload.missions)) throw new Error(payload.error || "Missioni non disponibili.");
      setMissionDate(payload.date || romeDateKey());
      setMissions(payload.missions);
      setMissionRefreshUsed(Boolean(payload.refreshUsed));
      setMissionMode(payload.localPreview ? "preview" : "live");
    } catch {
      const preview = localDailyMissionPreview();
      setMissionDate(preview.date);
      setMissions(preview.missions);
      try { setMissionRefreshUsed(window.localStorage.getItem(`${MISSION_REFRESH_KEY_PREFIX}:${preview.date}`) === "used"); } catch { setMissionRefreshUsed(false); }
      setMissionMode("error");
    }
  }, []);

  const claimAttendance = useCallback(async () => {
    if (attendanceBusy) return;
    setAttendanceBusy(true);
    try {
      if (cloudSyncReady && !previewSessionRef.current) {
        const response = await fetch("/api/famiglio/rebuild/attendance", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ houseIndex: activeHouseIndex, baseRevision: cloudRevisionRef.current }),
        });
        const payload = await response.json().catch(() => ({})) as { home?: unknown; reward?: FamiliarAttendanceReward; revision?: unknown; error?: string };
        if (response.ok && payload.home && payload.reward) {
          setHomeState(restoreFamiliarHome(payload.home));
          cloudRevisionRef.current = Math.max(cloudRevisionRef.current, Math.floor(Number(payload.revision) || 0));
          setAttendanceReveal(payload.reward);
          return;
        }
        if (response.status !== 401) {
          setMarketMessage(payload.error || "Il premio non \u00e8 stato consumato. Riprova.");
          return;
        }
      }
      const claimed = claimFamiliarAttendanceReward(homeState);
      if (claimed.reward) {
        setHomeState(claimed.state);
        setAttendanceReveal(claimed.reward);
      }
    } finally {
      setAttendanceBusy(false);
    }
  }, [activeHouseIndex, attendanceBusy, cloudSyncReady, homeState]);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/famiglio/slots", { credentials: "same-origin", cache: "no-store" })
      .then(async (response) => ({ response, payload: await response.json().catch(() => ({})) as { purchasedOfferIds?: unknown; purchasedAppearanceIds?: unknown } }))
      .then(({ response, payload }) => {
        if (cancelled || !response.ok) return;
        setPurchasedOfferIds(Array.isArray(payload.purchasedOfferIds) ? payload.purchasedOfferIds.filter((entry): entry is string => typeof entry === "string") : []);
        setPurchasedAppearanceIds(Array.isArray(payload.purchasedAppearanceIds) ? payload.purchasedAppearanceIds.filter((entry): entry is string => typeof entry === "string") : []);
      })
      .catch(() => undefined);
    try {
      const storedCoverId = window.localStorage.getItem("lorewise:famiglio:premium-cover");
      if (storedCoverId && PREMIUM_COVERS.some((cover) => cover.id === storedCoverId)) window.queueMicrotask(() => setEquippedPremiumCoverId(storedCoverId));
    } catch { /* Il browser può bloccare lo storage: la cover resta comunque nel LoreWise ID. */ }
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    document.documentElement.classList.add("famiglio-immersive");
    document.body.classList.add("famiglio-immersive");
    return () => {
      document.documentElement.classList.remove("famiglio-immersive");
      document.body.classList.remove("famiglio-immersive");
    };
  }, []);

  useEffect(() => {
    const updateClock = () => setRoomClock(new Date());
    updateClock();
    const interval = window.setInterval(updateClock, 30_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    homeActionEndsAtRef.current = homeState.actionEndsAt;
  }, [homeState.actionEndsAt]);

  useEffect(() => {
    if (!storageReady || attendanceAutoSuppressed || miniGameOpen || state.stage !== "home" || homeState.attendance.claimedDates.includes(familiarLocalDateKey())) return;
    const recovery = familiarAttendanceRecovery(homeState.attendance);
    if (recovery.active && !recovery.next) return;
    const timeout = window.setTimeout(() => setAttendanceOpen(true), 650);
    return () => window.clearTimeout(timeout);
  }, [attendanceAutoSuppressed, homeState.attendance.claimedDates, miniGameOpen, state.stage, storageReady]);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 760px)");
    const update = () => { setCompactFamiliarCatalog(query.matches); setAtelierCatalogPage(0); setCoverCatalogPage(0); };
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let restoredState: RebuildState | null = null;
    let restoredHome = createFamiliarHomeState();
    let restoredAdventure = createFamiliarAdventureState();
    let restoredCombat = createFamiliarCombatState();
    let restoredPanel: FamiliarHomePanel = "care";
    let previewVendor: MarketVendorId | null = null;
    let previewWing: MarketWing | null = null;
    let previewAtelierCategory: "covers" | "familiars" | "bundle" | "slots" | null = null;
    let previewCollectionFamiliarId: string | null = null;
    let previewRoomPhase: RoomPreviewPhase | null = null;
    let previewRestChoice = false;
    let previewMiniGame = false;
    let previewAttendance = false;
    let previewSuppressAttendance = false;
    let previewLevelUp: FamiliarLevelUpNotice | null = null;
    let previewAllTestMode = false;
    let restoredLocalHouseTrial = false;
    let restoredHouseSnapshots: Array<LocalHouseSnapshot | null> = [null, null, null];
    let restoredHouseIndex = 0;
    let restoredSelectedFamiliarId: string | null = null;
    try {
      const previewHostname = window.location.hostname;
      const isPrivateLanHost = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(previewHostname);
      const isLocalPreview = previewHostname === "127.0.0.1" || previewHostname === "localhost" || isPrivateLanHost;
      const previewParams = new URLSearchParams(window.location.search);
      const previewStage = isLocalPreview ? previewParams.get("preview") : null;
      previewSessionRef.current = Boolean(previewStage);
      window.queueMicrotask(() => setPreviewSession(Boolean(previewStage)));
      restoredLocalHouseTrial = isLocalPreview;
      const stored = window.localStorage.getItem(FAMILIAR_SAVE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as { rebuild?: RebuildState; home?: FamiliarHomeState; adventure?: FamiliarAdventureState; combat?: FamiliarCombatState; activeFamiliarId?: unknown; activeHouseIndex?: unknown; houses?: Array<Partial<LocalHouseSnapshot> | null> };
        const storedHouseIndex = Math.max(0, Math.min(2, Number.isInteger(parsed.activeHouseIndex) ? Number(parsed.activeHouseIndex) : 0));
        const storedHouses = Array.from({ length: 3 }, (_, index) => {
          const candidate = parsed.houses?.[index];
          if (!candidate?.rebuild) return null;
          return {
            rebuild: candidate.rebuild,
            home: restoreFamiliarHome(candidate.home),
            adventure: restoreFamiliarAdventureState(candidate.adventure),
            combat: restoreFamiliarCombatState(candidate.combat),
            activeFamiliarId: typeof candidate.activeFamiliarId === "string" ? candidate.activeFamiliarId : null,
          } satisfies LocalHouseSnapshot;
        });
        const legacyHouse: LocalHouseSnapshot | null = parsed.rebuild ? {
          rebuild: parsed.rebuild,
          home: restoreFamiliarHome(parsed.home),
          adventure: restoreFamiliarAdventureState(parsed.adventure),
          combat: restoreFamiliarCombatState(parsed.combat),
          activeFamiliarId: typeof parsed.activeFamiliarId === "string" ? parsed.activeFamiliarId : null,
        } : null;
        if (!storedHouses[0] && legacyHouse) storedHouses[0] = legacyHouse;
        houseSnapshotsRef.current = storedHouses;
        restoredHouseSnapshots = storedHouses;
        const activeStoredHouse = storedHouses[storedHouseIndex] ?? storedHouses[0] ?? legacyHouse;
        restoredHouseIndex = activeStoredHouse === storedHouses[storedHouseIndex] ? storedHouseIndex : 0;
        restoredHome = restoreFamiliarHome(activeStoredHouse?.home);
        restoredAdventure = restoreFamiliarAdventureState(activeStoredHouse?.adventure);
        restoredCombat = restoreFamiliarCombatState(activeStoredHouse?.combat);
        if (restoredCombat.activeBattle) restoredPanel = "combat";
        if (activeStoredHouse?.activeFamiliarId && FAMILIAR_COLLECTION.some((entry) => entry.id === activeStoredHouse.activeFamiliarId)) restoredSelectedFamiliarId = activeStoredHouse.activeFamiliarId;
        if (!previewStage) {
          const selectedExists = STARTER_EGGS.some((egg) => egg.id === activeStoredHouse?.rebuild.selectedId);
          if (activeStoredHouse?.rebuild && selectedExists && (activeStoredHouse.rebuild.stage === "hatched" || activeStoredHouse.rebuild.stage === "home")) {
            restoredState = activeStoredHouse.rebuild;
          }
        }
      }
      if (previewStage) {
        const requestedSpecies = previewParams.get("species");
        const previewEgg = STARTER_EGGS.find((egg) => egg.id === requestedSpecies) ?? STARTER_EGGS.find((egg) => egg.id === "cat")!;
        const requestedColor = previewParams.get("color");
        const previewColor = STARTER_COLOR_OPTIONS[previewEgg.id].some((option) => option.id === requestedColor)
          ? requestedColor
          : STARTER_COLOR_OPTIONS[previewEgg.id][0]?.id ?? null;
        const prepared = customizeFamiliar(selectStarter(createRebuildState(), previewEgg.id), {
          familiarName: "Luna",
          familiarSex: "female",
          colorVariant: previewColor,
        });
        restoredState = previewStage === "choosing"
          ? createRebuildState()
          : previewStage === "hatching"
            ? beginHatching(prepared)
            : previewStage === "hatched"
              ? { ...prepared, stage: "hatched", unlockedIds: [previewEgg.id] }
            : previewStage === "home" || previewStage === "diary" || previewStage === "missions" || previewStage === "market" || previewStage === "adventure" || previewStage === "combat" || previewStage === "battle" || previewStage === "progression"
                ? { ...prepared, stage: "home", unlockedIds: [previewEgg.id] }
                : prepared;
        if (previewStage === "diary") restoredPanel = "diary";
        if (previewStage === "missions") restoredPanel = "missions";
        if (previewStage === "market") restoredPanel = "market";
        if (previewStage === "adventure") restoredPanel = "adventure";
        if (previewStage === "combat" || previewStage === "battle") restoredPanel = "combat";
        if (previewStage === "progression") restoredPanel = "progression";
        const requestedGrowth = previewParams.get("growth");
        previewMiniGame = previewParams.get("minigame") === "1";
        const requestedGame = previewParams.get("game");
        if (requestedGame === "light" || requestedGame === "jump" || requestedGame === "catch" || requestedGame === "memory") {
          const weekly = restoreFamiliarWeeklyLoopState(restoredHome.weeklyLoop, new Date(), restoredHome.attendance.launchDate);
          restoredHome = { ...restoredHome, weeklyLoop: { ...weekly, miniGame: { ...weekly.miniGame, kind: requestedGame } } };
        }
        previewAttendance = previewParams.get("attendance") === "1";
        if (previewParams.get("recovery") === "ready") {
          const today = Date.parse(`${familiarLocalDateKey()}T00:00:00Z`);
          const dateAgo = (days: number) => new Date(today - days * 86_400_000).toISOString().slice(0, 10);
          restoredHome.attendance = { ...restoredHome.attendance, launchDate: dateAgo(371), claimedDates: Array.from({ length: 6 }, (_, index) => dateAgo(6 - index)), lastClaimDate: dateAgo(1), streak: 6, collectibles: [] };
          previewAttendance = true;
        }
        previewSuppressAttendance = previewParams.get("attendance") === "0";
        if (previewParams.get("test") === "all") {
          previewAllTestMode = true;
          const testHome = createFamiliarHomeState();
          restoredHome = {
            ...testHome,
            growth: { ...testHome.growth, bondXp: GROWTH_STAGES.adulto.minimumXp, stage: "adulto" },
            wallet: { ...testHome.wallet, nexusCoins: 9_999, totalEarned: 9_999, nightSigils: 999, relicFragments: 999 },
            lastOutcome: "Modalità prova: tutti gli oggetti sono sbloccati e puoi acquistarli senza esaurire la valuta di test.",
          };
        }
        if (requestedGrowth === "cucciolo") restoredHome = { ...restoredHome, growth: { ...restoredHome.growth, bondXp: 0, stage: "cucciolo", careStreak: 0 } };
        if (requestedGrowth === "giovane") restoredHome = { ...restoredHome, growth: { ...restoredHome.growth, bondXp: GROWTH_STAGES.giovane.minimumXp, stage: "giovane", careStreak: 14 }, wallet: { ...restoredHome.wallet, nexusCoins: Math.max(100, restoredHome.wallet.nexusCoins), totalEarned: Math.max(100, restoredHome.wallet.totalEarned), nightSigils: Math.max(24, restoredHome.wallet.nightSigils), relicFragments: Math.max(8, restoredHome.wallet.relicFragments) } };
        if (requestedGrowth === "adulto") restoredHome = { ...restoredHome, growth: { ...restoredHome.growth, bondXp: GROWTH_STAGES.adulto.minimumXp, stage: "adulto", careStreak: 35 }, wallet: { ...restoredHome.wallet, nexusCoins: Math.max(150, restoredHome.wallet.nexusCoins), totalEarned: Math.max(150, restoredHome.wallet.totalEarned), nightSigils: Math.max(40, restoredHome.wallet.nightSigils), relicFragments: Math.max(20, restoredHome.wallet.relicFragments) } };
        if (previewParams.get("toilet") === "dirty") restoredHome = {
          ...restoredHome,
          toilet: { urgency: 24, wasteCount: 2, lastEventAt: Date.now() },
          needs: { ...restoredHome.needs, hygiene: Math.min(restoredHome.needs.hygiene, 62) },
          lastOutcome: "Il Famiglio ha fatto i bisogni. Usa Pulisci per sistemare la Casa.",
        };
        if (previewParams.get("sick") === "1") restoredHome = {
          ...restoredHome,
          health: { status: "sick", sickSince: Date.now(), lastCheckAt: Date.now() },
          inventory: { ...restoredHome.inventory, quantities: { ...restoredHome.inventory.quantities, "comfort-balm": Math.max(1, restoredHome.inventory.quantities["comfort-balm"] ?? 0) } },
          lastOutcome: "Il Famiglio non si sente bene. Usa Cura con la medicina di Nora.",
        };
        if (previewParams.get("hygiene") === "low") restoredHome = {
          ...restoredHome,
          needs: { ...restoredHome.needs, hygiene: 18 },
          lastOutcome: "L'igiene è bassa: la scia verde segnala che è il momento di pulire.",
        };
        const requestedBondDay = Number(previewParams.get("bondDay"));
        if (Number.isInteger(requestedBondDay) && requestedBondDay >= 1 && requestedBondDay <= FAMILIAR_BOND_WEEK.length) {
          restoredHome = { ...restoredHome, bondWeek: previewFamiliarBondWeek(requestedBondDay) };
        }
        const requestedVendor = previewParams.get("vendor");
        if (requestedVendor === "daily" || requestedVendor === "arcane" || requestedVendor === "cosmetics") previewVendor = requestedVendor;
        const requestedWing = previewParams.get("wing");
        if (requestedWing === "court" || requestedWing === "atelier" || requestedWing === "night") previewWing = requestedWing;
        const requestedCategory = previewParams.get("category");
        if (requestedCategory === "covers" || requestedCategory === "familiars" || requestedCategory === "bundle" || requestedCategory === "slots") previewAtelierCategory = requestedCategory;
        const requestedFamiliar = previewParams.get("familiar");
        if (requestedFamiliar && FAMILIAR_COLLECTION.some((entry) => entry.id === requestedFamiliar)) previewCollectionFamiliarId = requestedFamiliar;
        const activePreviewFamiliarId = previewCollectionFamiliarId ?? previewEgg.id;
        const previewCareDays = restoredHome.growth.stage === "adulto" ? 35 : restoredHome.growth.stage === "giovane" ? 14 : 0;
        restoredAdventure = syncFamiliarAdventureGrowth(restoredAdventure, activePreviewFamiliarId, restoredHome.growth.bondXp, previewCareDays);
        if (previewStage === "battle") {
          const requestedCircuitId = previewParams.get("circuit");
          const circuit = FAMILIAR_COMBAT_CIRCUITS.find((entry) => entry.id === requestedCircuitId) ?? FAMILIAR_COMBAT_CIRCUITS[0];
          const requestedOpponent = previewParams.get("opponent");
          const opponentId = familiarCombatOpponents(activePreviewFamiliarId, circuit.id).find((id) => id === requestedOpponent)
            ?? familiarCombatOpponents(activePreviewFamiliarId, circuit.id)[0];
          const requestedDifficulty = previewParams.get("difficulty");
          const difficulty: FamiliarCombatDifficulty = requestedDifficulty === "expert" || requestedDifficulty === "nexus" ? requestedDifficulty : "normal";
          if (opponentId) {
            restoredCombat = startFamiliarCombatBattle(restoredCombat, {
              playerId: activePreviewFamiliarId,
              opponentId,
              circuitId: circuit.id,
              difficulty,
              ignoreUnlocks: true,
            }).state;
            const requestedResult = previewParams.get("result");
            if (restoredCombat.activeBattle && (requestedResult === "victory" || requestedResult === "defeat")) {
              restoredCombat = {
                ...restoredCombat,
                activeBattle: { ...restoredCombat.activeBattle, outcome: requestedResult, resultApplied: true },
              };
            }
          }
        }
        const requestedRoomPhase = previewParams.get("time");
        if (requestedRoomPhase === "morning" || requestedRoomPhase === "afternoon" || requestedRoomPhase === "evening" || requestedRoomPhase === "night" || requestedRoomPhase === "witching") previewRoomPhase = requestedRoomPhase;
        const requestedRoom = previewParams.get("room");
        if (requestedRoom === "home" || requestedRoom === "feed" || requestedRoom === "clean" || requestedRoom === "play" || requestedRoom === "rest") {
          restoredHome = { ...restoredHome, roomAction: requestedRoom === "home" ? null : requestedRoom };
        }
        if (previewParams.get("needs") === "full") {
          restoredHome = {
            ...restoredHome,
            needs: { hunger: 100, energy: 100, happiness: 100, hygiene: 100, affection: 100 },
            health: { status: "healthy", sickSince: null, lastCheckAt: Date.now() },
            toilet: { urgency: 0, wasteCount: 0, lastEventAt: null },
            activeAction: null, actionEndsAt: null, lastActionAt: null,
            actionCooldownUntil: null, actionCooldowns: {}, actionBurstCount: 0, actionBurstAction: null,
            lastUpdatedAt: Date.now(),
            inventory: { ...restoredHome.inventory, quantities: Object.fromEntries(FAMILIAR_ITEM_CATALOG.map(item => [item.id, 99])) as typeof restoredHome.inventory.quantities },
            lastOutcome: "Anteprima pronta: bisogni a 100 e scorte per le prove. Ricarica per ripartire.",
          };
        }
        const requestedAction = previewParams.get("action") as FamiliarHomeAction | null;
        if (requestedAction && HOME_ACTIONS.some((entry) => entry.id === requestedAction)) {
          const requestedRestPreset = previewParams.get("rest") as FamiliarRestPresetId | null;
          const restPresetId = FAMILIAR_REST_PRESETS.some((preset) => preset.id === requestedRestPreset) ? requestedRestPreset! : "nap";
          restoredHome = performHomeAction(restoredHome, requestedAction, undefined, null, restPresetId);
        }
        previewRestChoice = previewParams.get("rest") === "choose";
        const requestedLevelUp = previewParams.get("levelup");
        if (requestedLevelUp === "bond") previewLevelUp = { track: "Legame", level: 10, title: "Sintonia crescente", benefits: ["Nuovo traguardo del Legame", "Sconto dell'1% nelle botteghe"] };
        if (requestedLevelUp === "adventure") previewLevelUp = { track: "Esplorazione", level: 4, title: "Esploratore del Nexus", benefits: ["Nuove ricompense di spedizione", "Progresso registrato nel Diario"] };
        if (requestedLevelUp === "combat") previewLevelUp = { track: "Combattimento", level: 5, title: "Tecnica migliorata", benefits: ["Una mossa può essere potenziata", "Statistiche di lotta aumentate"] };
        const requestedItem = previewParams.get("item") as FamiliarInventoryItemId | null;
        if (requestedItem && FAMILIAR_ITEM_CATALOG.some((item) => item.id === requestedItem)) {
          restoredHome = {
            ...restoredHome,
            activeItemId: requestedItem,
            inventory: {
              ...restoredHome.inventory,
              quantities: { ...restoredHome.inventory.quantities, [requestedItem]: Math.max(1, restoredHome.inventory.quantities[requestedItem] ?? 0) },
            },
          };
        }
      }
    } catch {
      restoredHome = createFamiliarHomeState();
    }
    const restoredActiveFamiliarId = previewCollectionFamiliarId ?? restoredState?.selectedId ?? null;
    if (restoredActiveFamiliarId) {
      const migratedCareDays = restoredHome.growth.stage === "adulto" ? 35 : restoredHome.growth.stage === "giovane" ? 14 : restoredHome.growth.careStreak;
      restoredAdventure = syncFamiliarAdventureGrowth(restoredAdventure, restoredActiveFamiliarId, restoredHome.growth.bondXp, migratedCareDays);
    }
    window.requestAnimationFrame(() => {
      if (cancelled) return;
      if (restoredState) setState(restoredState);
      setHomeState(restoredHome);
      setAdventureState(restoredAdventure);
      setCombatState(restoredCombat);
      setHomePanel(restoredPanel);
      if (previewVendor) setSelectedMarketVendor(previewVendor);
      if (previewWing) setMarketWing(previewWing);
      if (previewAtelierCategory) setAtelierCategory(previewAtelierCategory);
      if (previewCollectionFamiliarId) setTestCollectionFamiliarId(previewCollectionFamiliarId);
      else {
        const combatFamiliarId = restoredCombat.activeBattle?.player.familiarId ?? restoredSelectedFamiliarId;
        if (combatFamiliarId) {
          const unlockedIndex = restoredState?.unlockedIds.findIndex((id) => id === combatFamiliarId) ?? -1;
          if (unlockedIndex >= 0) setHomeFamiliarIndex(unlockedIndex);
          else setTestCollectionFamiliarId(combatFamiliarId);
        }
      }
      if (previewRoomPhase) setRoomPreviewPhase(previewRoomPhase);
      if (previewRestChoice) setRestChoiceOpen(true);
      if (previewMiniGame) setMiniGameOpen(true);
      if (previewAttendance) setAttendanceOpen(true);
      if (previewSuppressAttendance) setAttendanceAutoSuppressed(true);
      if (previewLevelUp) setLevelUpNotice(previewLevelUp);
      setAllTestMode(previewAllTestMode);
      setLocalHouseTrial(restoredLocalHouseTrial);
      setSavedHouseSnapshots(restoredHouseSnapshots);
      setActiveHouseIndex(restoredHouseIndex);
      setStorageReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!storageReady || previewSessionRef.current) return;
    const selectedFamiliarIdForStorage = combatState.activeBattle?.player.familiarId ?? testCollectionFamiliarId ?? state.unlockedIds[homeFamiliarIndex] ?? state.selectedId ?? "cat";
    const currentSnapshot: LocalHouseSnapshot = { rebuild: state, home: homeState, adventure: adventureState, combat: combatState, activeFamiliarId: selectedFamiliarIdForStorage };
    const houses = [...houseSnapshotsRef.current];
    houses[activeHouseIndex] = currentSnapshot;
    houseSnapshotsRef.current = houses;
    window.localStorage.setItem(FAMILIAR_SAVE_KEY, JSON.stringify({ ...currentSnapshot, houses, activeHouseIndex }));
    window.dispatchEvent(new Event("lorewise:famiglio-rebuild-updated"));
  }, [activeHouseIndex, adventureState, combatState, homeFamiliarIndex, homeState, state, storageReady, testCollectionFamiliarId]);

  useEffect(() => {
    if (!storageReady || previewSessionRef.current) return;
    let cancelled = false;
    void fetch("/api/famiglio/rebuild", { credentials: "same-origin", cache: "no-store" })
      .then(async (response) => ({ response, payload: await response.json().catch(() => ({})) as { save?: unknown; revision?: unknown } }))
      .then(({ response, payload }) => {
        if (cancelled) return;
        if (response.status === 401) return;
        if (!response.ok) return;
        cloudRevisionRef.current = Math.max(0, Math.floor(Number(payload.revision) || 0));
        const save = payload.save;
        if (save && typeof save === "object" && !Array.isArray(save)) {
          const candidate = save as { houses?: Array<Partial<LocalHouseSnapshot> | null>; activeHouseIndex?: unknown };
          const houses = Array.from({ length: 3 }, (_, index) => {
            const house = candidate.houses?.[index];
            if (!house?.rebuild) return null;
            return {
              rebuild: house.rebuild,
              home: restoreFamiliarHome(house.home),
              adventure: restoreFamiliarAdventureState(house.adventure),
              combat: restoreFamiliarCombatState(house.combat),
              activeFamiliarId: typeof house.activeFamiliarId === "string" ? house.activeFamiliarId : null,
            } satisfies LocalHouseSnapshot;
          });
          const requestedIndex = Math.max(0, Math.min(2, Number.isInteger(candidate.activeHouseIndex) ? Number(candidate.activeHouseIndex) : 0));
          const selectedIndex = houses[requestedIndex] ? requestedIndex : Math.max(0, houses.findIndex(Boolean));
          const active = houses[selectedIndex];
          // Un caricamento cloud avviato all'apertura non può interrompere una
          // cura che l'utente ha già iniziato mentre la risposta era in viaggio.
          const localActionRunning = Boolean(homeActionEndsAtRef.current && homeActionEndsAtRef.current > Date.now());
          if (active && !localActionRunning) {
            houseSnapshotsRef.current = houses;
            setSavedHouseSnapshots(houses);
            setActiveHouseIndex(selectedIndex);
            setState(active.rebuild);
            setHomeState(active.home);
            setAdventureState(active.adventure);
            setCombatState(active.combat);
            setHomePanel((currentPanel) => active.combat.activeBattle ? "combat" : currentPanel);
            if (active.activeFamiliarId) {
              const starterIndex = active.rebuild.unlockedIds.findIndex((id) => id === active.activeFamiliarId);
              if (starterIndex >= 0) {
                setHomeFamiliarIndex(starterIndex);
                setTestCollectionFamiliarId(null);
              } else if (FAMILIAR_COLLECTION.some((entry) => entry.id === active.activeFamiliarId)) {
                setTestCollectionFamiliarId(active.activeFamiliarId);
              }
            }
            window.localStorage.setItem(FAMILIAR_SAVE_KEY, JSON.stringify({ ...active, houses, activeHouseIndex: selectedIndex }));
          }
        }
        window.requestAnimationFrame(() => { if (!cancelled) setCloudSyncReady(true); });
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [cloudReloadToken, storageReady]);

  useEffect(() => {
    if (!cloudSyncReady || previewSessionRef.current) return;
    const selectedFamiliarIdForStorage = combatState.activeBattle?.player.familiarId ?? testCollectionFamiliarId ?? state.unlockedIds[homeFamiliarIndex] ?? state.selectedId ?? "cat";
    const currentSnapshot: LocalHouseSnapshot = { rebuild: state, home: homeState, adventure: adventureState, combat: combatState, activeFamiliarId: selectedFamiliarIdForStorage };
    const houses = [...houseSnapshotsRef.current];
    houses[activeHouseIndex] = currentSnapshot;
    const save = { schemaVersion: 1 as const, ...currentSnapshot, houses, activeHouseIndex, updatedAt: new Date().toISOString() };
    let cancelled = false;
    let timeout: number;
    const retry = () => { if (!cancelled) timeout = window.setTimeout(send, 2000); };
    const send = () => {
      if (cancelled) return;
      if (cloudSaveInFlightRef.current) { timeout = window.setTimeout(send, 250); return; }
      cloudSaveInFlightRef.current = true;
      void fetch("/api/famiglio/rebuild", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ save, baseRevision: cloudRevisionRef.current }),
      }).then(async (response) => ({ response, payload: await response.json().catch(() => ({})) as { revision?: unknown } }))
        .then(({ response, payload }) => {
          if (response.ok) cloudRevisionRef.current = Math.max(cloudRevisionRef.current, Math.floor(Number(payload.revision) || 0));
          else if (response.status === 409) {
            setCloudSyncReady(false);
            setCloudReloadToken((current) => current + 1);
          } else if (response.status >= 500 || response.status === 429) retry();
        })
        .catch(retry)
        .finally(() => { cloudSaveInFlightRef.current = false; });
    };
    timeout = window.setTimeout(send, 900);
    return () => { cancelled = true; window.clearTimeout(timeout); };
  }, [activeHouseIndex, adventureState, cloudSyncReady, combatState, homeFamiliarIndex, homeState, state, testCollectionFamiliarId]);

  useEffect(() => {
    if (state.stage !== "hatching") return;
    let request = 0;
    let lastTime = performance.now();
    let pending = 0;
    const tick = (now: number) => {
      pending += Math.min(now - lastTime, 250);
      lastTime = now;
      if (pending >= 200) {
        const elapsed = pending;
        pending = 0;
        setState((current) => advanceRitual(current, elapsed));
      }
      request = requestAnimationFrame(tick);
    };
    request = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(request);
  }, [state.stage]);

  useEffect(() => {
    if (state.stage !== "home" || familiarAway) return;
    const interval = window.setInterval(() => setHomeState((current) => advanceFamiliarHome(current)), 1_000);
    return () => window.clearInterval(interval);
  }, [familiarAway, state.stage]);

  useEffect(() => {
    if (state.stage !== "home" || homePanel !== "market") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const interval = window.setInterval(() => setMarketIdleTick((current) => current + 1), merchantReaction ? 180 : 360);
    return () => window.clearInterval(interval);
  }, [homePanel, merchantReaction, state.stage]);

  useEffect(() => {
    if (!merchantReaction) return;
    const timeout = window.setTimeout(() => setMerchantReaction(null), 2_400);
    return () => window.clearTimeout(timeout);
  }, [merchantReaction]);

  useEffect(() => {
    if (state.stage !== "home") return;
    const initialRefresh = window.setTimeout(() => void loadMissions(), 0);
    const refresh = () => void loadMissions();
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.clearTimeout(initialRefresh);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [loadMissions, state.stage]);

  const phase = RITUAL_PHASES[state.ritualPhaseIndex];
  const phaseSeconds = Math.max(0, Math.ceil((RITUAL_PHASE_DURATION_MS - state.phaseElapsedMs) / 1000));
  const totalSeconds = Math.max(0, Math.ceil((RITUAL_PHASE_DURATION_MS * RITUAL_PHASES.length - state.totalElapsedMs) / 1000));
  const colorOptions = selectedEgg ? STARTER_COLOR_OPTIONS[selectedEgg.id] : [];
  const familiarDisplayName = state.familiarName.trim() || selectedEgg?.familiar || "Famiglio";
  const focusedEgg = STARTER_EGGS[focusedEggIndex];
  const unlockedFamiliars = state.unlockedIds
    .map((id) => STARTER_EGGS.find((egg) => egg.id === id))
    .filter((egg): egg is StarterEgg => Boolean(egg));
  const homeFamiliar = unlockedFamiliars[homeFamiliarIndex] ?? selectedEgg;
  const testCollectionFamiliar = FAMILIAR_COLLECTION.find((entry) => entry.id === testCollectionFamiliarId) ?? null;
  const activeFamiliarId = combatState.activeBattle?.player.familiarId ?? testCollectionFamiliar?.id ?? homeFamiliar?.id ?? "cat";
  const starterIsActive = STARTER_EGGS.some((entry) => entry.id === activeFamiliarId);
  const activeCollectionFamiliar = starterIsActive
    ? null
    : testCollectionFamiliar ?? FAMILIAR_COLLECTION.find((entry) => entry.id === activeFamiliarId) ?? null;
  const ownedCombatFamiliarIds = new Set<string>(purchasedAppearanceIds);
  for (const id of state.unlockedIds) ownedCombatFamiliarIds.add(id);
  if (state.selectedId) ownedCombatFamiliarIds.add(state.selectedId);
  for (const house of savedHouseSnapshots) {
    if (!house) continue;
    if (house.activeFamiliarId) ownedCombatFamiliarIds.add(house.activeFamiliarId);
    if (house.rebuild.selectedId) ownedCombatFamiliarIds.add(house.rebuild.selectedId);
    for (const id of house.rebuild.unlockedIds) ownedCombatFamiliarIds.add(id);
  }
  // Le anteprime complete restano disponibili soltanto nella modalita di prova locale.
  if (allTestMode) {
    for (const entry of FAMILIAR_COLLECTION) ownedCombatFamiliarIds.add(entry.id);
  } else if (previewSession && testCollectionFamiliarId) {
    ownedCombatFamiliarIds.add(testCollectionFamiliarId);
  }
  const combatColorVariantById = new Map<string, string | null>();
  for (const house of savedHouseSnapshots) {
    if (house?.rebuild.selectedId) combatColorVariantById.set(house.rebuild.selectedId, house.rebuild.colorVariant);
  }
  if (state.selectedId) combatColorVariantById.set(state.selectedId, state.colorVariant);
  const combatFamiliarOptions = FAMILIAR_COLLECTION
    .filter((entry) => ownedCombatFamiliarIds.has(entry.id))
    .map((entry) => ({ id: entry.id, name: entry.name, growthStage: familiarAdventureProgress(adventureState, entry.id).stage, colorVariant: combatColorVariantById.get(entry.id) ?? null }));
  const activeBattleFamiliar = combatState.activeBattle
    ? FAMILIAR_COLLECTION.find((entry) => entry.id === combatState.activeBattle?.player.familiarId)
    : null;
  const combatSelectedFamiliar = activeBattleFamiliar
    ? { id: activeBattleFamiliar.id, name: activeBattleFamiliar.name, growthStage: familiarAdventureProgress(adventureState, activeBattleFamiliar.id).stage, colorVariant: combatColorVariantById.get(activeBattleFamiliar.id) ?? null }
    : combatFamiliarOptions.find((entry) => entry.id === combatPreparedFamiliarId)
      ?? combatFamiliarOptions.find((entry) => entry.id === activeFamiliarId)
      ?? combatFamiliarOptions[0];
  const combatSelectedFamiliarId = combatSelectedFamiliar?.id ?? activeFamiliarId;
  const combatSelectedFamiliarName = combatSelectedFamiliar?.name ?? activeCollectionFamiliar?.name ?? familiarDisplayName;
  const combatSelectedGrowthStage = combatSelectedFamiliar?.growthStage ?? familiarAdventureProgress(adventureState, activeFamiliarId).stage;
  const combatSelectedColorVariant = combatSelectedFamiliar?.colorVariant ?? null;
  const activeAdventureProgress = familiarAdventureProgress(adventureState, activeFamiliarId);
  const activeGrowth = { bondXp: activeAdventureProgress.bondXp, stage: activeAdventureProgress.stage, careStreak: activeAdventureProgress.careDays };
  const homeDisplayName = activeCollectionFamiliar?.name ?? familiarDisplayName;
  const homePersonality = homeFamiliar ? FAMILIAR_PERSONALITIES[homeFamiliar.id] : null;
  const autonomousReaction = homeFamiliar && autonomousPresentation?.species === homeFamiliar.id
    ? autonomousPresentation.reaction
    : homeFamiliar
      ? autonomousReactionText(homeFamiliar.id, "idle")
      : "";
  const mood = familiarMood(homeState.needs);
  const expeditionGate = familiarActivityGate(homeState, "expedition");
  const combatGate = familiarActivityGate(homeState, "combat");
  const moodMeta = FAMILIAR_MOODS[mood];
  const toiletMessage = homeState.toilet.wasteCount > 0
    ? "Ha fatto i bisogni: usa Pulisci per sistemare la Casa."
    : homeState.toilet.urgency >= 78
      ? "Sta cercando un angolino per fare i bisogni."
      : null;
  const growthMeta = GROWTH_STAGES[activeGrowth.stage];
  const routinePercent = dailyRoutineProgress(homeState.routine);
  const diaryPageCount = Math.max(1, Math.ceil(homeState.diary.length / DIARY_PAGE_SIZE));
  const visibleDiaryEntries = homeState.diary.slice(
    diaryPage * DIARY_PAGE_SIZE,
    diaryPage * DIARY_PAGE_SIZE + DIARY_PAGE_SIZE,
  );
  const completedRoutineActions = new Set(homeState.routine.completedActions).size;
  const wishCopy = DAILY_WISHES[homeState.wish.action];
  const wishAction = HOME_ACTIONS.find((item) => item.id === homeState.wish.action)!;
  const dominantBondTraitId = dominantFamiliarBondTrait(homeState.bondWeek);
  const dominantBondTrait = FAMILIAR_BOND_TRAITS[dominantBondTraitId];
  const storyModalEvent = familiarBondEvent(bondStoryFeedback?.day ?? homeState.bondWeek.pendingDay);
  const displayedDeviceCoverId = homePanel === "market" && marketWing === "court" && selectedMarketVendor === "cosmetics"
    ? previewDeviceCoverId ?? homeState.deviceCover.activeId
    : homeState.deviceCover.activeId;
  const activeDeviceCover = FAMILIAR_DEVICE_COVERS.find((cover) => cover.id === displayedDeviceCoverId) ?? FAMILIAR_DEVICE_COVERS[0];
  const premiumCovers = availablePremiumCovers();
  const displayedPremiumCoverId = atelierCoverPreview ? selectedPremiumCoverId : equippedPremiumCoverId;
  const selectedPremiumCover = displayedPremiumCoverId ? premiumCovers.find((cover) => cover.id === displayedPremiumCoverId) ?? null : null;
  const displayedRoomTime = useMemo(() => {
    if (!roomClock || !roomPreviewPhase) return roomClock;
    const previewHour: Record<RoomPreviewPhase, number> = { morning: 8, afternoon: 14, evening: 19, night: 23, witching: 3 };
    const date = new Date(roomClock);
    date.setHours(previewHour[roomPreviewPhase], roomPreviewPhase === "witching" ? 10 : 0, 0, 0);
    return date;
  }, [roomClock, roomPreviewPhase]);
  const interactionNow = displayedRoomTime?.getTime() ?? homeState.lastUpdatedAt;
  const dailyMoment = familiarDailyMoment(activeFamiliarId, interactionNow);
  const returnGreeting = familiarReturnGreeting(homeState, homeDisplayName, interactionNow);
  const nightMarketOpen = localHouseTrial || allTestMode || nightMarketIsOpen(displayedRoomTime ?? new Date());
  const activeGuideSection: FamiliarGuideSection = state.stage === "home" ? homePanel : "onboarding";
  const deviceShellStyle = {
    "--shell-a": activeDeviceCover.shellA,
    "--shell-b": activeDeviceCover.shellB,
    "--shell-edge": activeDeviceCover.edge,
    "--premium-cover-desktop": selectedPremiumCover ? `url(${selectedPremiumCover.artDesktop})` : "none",
    "--premium-cover-mobile": selectedPremiumCover ? `url(${selectedPremiumCover.artMobile})` : "none",
  } as CSSProperties;

  const ensureHomeAudio = useCallback((muted = homeAudioMuted, volume = homeAudioVolume) => {
    if (typeof window === "undefined") return;
    setHomeAudioUnlocked(true);
    void muted;
    void volume;
  }, [homeAudioMuted, homeAudioVolume]);

  const openFocusedEgg = () => {
    setState((current) => selectStarter(current, focusedEgg.id));
  };

  const moveDeviceSelection = (direction: -1 | 1) => {
    if (familiarAway) return;
    if (state.stage === "choosing") {
      setFocusedEggIndex((current) => (current + direction + STARTER_EGGS.length) % STARTER_EGGS.length);
      return;
    }
    if (state.stage === "home" && allTestMode) {
      const currentIndex = Math.max(0, FAMILIAR_COLLECTION.findIndex((entry) => entry.id === activeFamiliarId));
      const next = FAMILIAR_COLLECTION[(currentIndex + direction + FAMILIAR_COLLECTION.length) % FAMILIAR_COLLECTION.length];
      const preserved = syncFamiliarAdventureGrowth(adventureState, activeFamiliarId, homeState.growth.bondXp, homeState.growth.careStreak);
      const target = familiarAdventureProgress(preserved, next.id);
      setAdventureState(preserved);
      setHomeState((current) => ({ ...current, growth: { bondXp: target.bondXp, stage: target.stage, careStreak: target.careDays } }));
      setTestCollectionFamiliarId(next.id);
      return;
    }
    if ((state.stage === "hatched" || state.stage === "home") && unlockedFamiliars.length > 1) {
      const nextIndex = (homeFamiliarIndex + direction + unlockedFamiliars.length) % unlockedFamiliars.length;
      const nextId = unlockedFamiliars[nextIndex].id;
      const preserved = syncFamiliarAdventureGrowth(adventureState, activeFamiliarId, homeState.growth.bondXp, homeState.growth.careStreak);
      const target = familiarAdventureProgress(preserved, nextId);
      setAdventureState(preserved);
      setHomeState((current) => ({ ...current, growth: { bondXp: target.bondXp, stage: target.stage, careStreak: target.careDays } }));
      setHomeFamiliarIndex(nextIndex);
    }
  };

  const selectCombatFamiliar = (familiarId: string) => {
    if (combatState.activeBattle || !combatFamiliarOptions.some((entry) => entry.id === familiarId)) return;
    setCombatPreparedFamiliarId(familiarId);
  };

  const activateDeviceSelection = () => {
    if (state.stage === "choosing") openFocusedEgg();
    if (state.stage === "confirming") setState(beginHatching);
  };

  const receiveAdventureReward = (reward: FamiliarAdventureReward) => {
    const previousAdventureXp = adventureState.progress[reward.familiarId]?.adventureXp ?? 0;
    const previousAdventureLevel = Math.min(50, Math.floor(previousAdventureXp / 100) + 1);
    const nextAdventureLevel = Math.min(50, Math.floor((previousAdventureXp + reward.adventureXp) / 100) + 1);
    if (nextAdventureLevel > previousAdventureLevel) setLevelUpNotice({ track: "Esplorazione", level: nextAdventureLevel, title: "Nuovi sentieri riconosciuti", benefits: ["Ricompense di spedizione migliorate", "Nuove varianti di viaggio disponibili"] });
    setHomeState((current) => {
      const at = Date.now();
      return {
        ...current,
        lastOutcome: `Spedizione completata: +${reward.nexusCoins} Monete Nexus e +${reward.adventureXp} XP esplorazione.`,
        wallet: {
          ...current.wallet,
          nexusCoins: current.wallet.nexusCoins + reward.nexusCoins,
          totalEarned: current.wallet.totalEarned + reward.nexusCoins,
          nightSigils: current.wallet.nightSigils + reward.nightSigils,
          relicFragments: current.wallet.relicFragments + reward.relicFragments,
        },
        weeklyLoop: recordFamiliarWeeklyStep(current.weeklyLoop, "adventure", new Date(), current.attendance.launchDate),
        diary: [{
          id: `adventure-${reward.dungeonId}-${at}`,
          at,
          kind: "mission" as const,
          title: "Spedizione completata",
          detail: `Ricompensa: ${reward.nexusCoins} Monete Nexus, ${reward.nightSigils} Sigilli Notturni, ${reward.relicFragments} Frammenti e ${reward.adventureXp} XP esplorazione.`,
        }, ...current.diary].slice(0, 30),
      };
    });
  };

  const receiveCombatReward = (reward: FamiliarCombatReward) => {
    const previousCombat = combatState.profiles[reward.familiarId];
    const previousCombatLevel = previousCombat?.combatLevel ?? 1;
    const nextCombatLevel = combatLevelForXp((previousCombat?.combatXp ?? 0) + reward.combatXp);
    if (nextCombatLevel > previousCombatLevel) setLevelUpNotice({ track: "Combattimento", level: nextCombatLevel, title: "Forza del Legame aumentata", benefits: ["Statistiche di battaglia migliorate", "Controlla il Percorso per eventuali nuove mosse"] });
    setHomeState((current) => {
      const at = Date.now();
      return {
        ...current,
        lastOutcome: `Vittoria nell'Arena: +${reward.combatXp} XP combattimento e +${reward.nexusCoins} Monete Nexus.`,
        wallet: {
          ...current.wallet,
          nexusCoins: current.wallet.nexusCoins + reward.nexusCoins,
          totalEarned: current.wallet.totalEarned + reward.nexusCoins,
          nightSigils: current.wallet.nightSigils + reward.nightSigils,
          relicFragments: current.wallet.relicFragments + reward.relicFragments,
        },
        weeklyLoop: recordFamiliarWeeklyStep(current.weeklyLoop, "combat", new Date(), current.attendance.launchDate),
        diary: [{
          id: `combat-${reward.key}-${at}`,
          at,
          kind: "mission" as const,
          title: "Vittoria nell'Arena",
          detail: `${reward.combatXp} XP combattimento · ${reward.nexusCoins} Monete Nexus · ${reward.nightSigils} Sigilli · ${reward.relicFragments} Frammenti.`,
        }, ...current.diary].slice(0, 30),
      };
    });
  };

  const performActiveHomeAction = (action: FamiliarHomeAction, restPresetId: FamiliarRestPresetId = "nap") => {
    const previousActionAt = homeState.lastActionAt;
    const previousBondLevel = familiarLevelForExperience(homeState.growth.bondXp);
    const equippedItemId = homeState.equippedItems?.[action];
    const equippedItem = FAMILIAR_ITEM_CATALOG.find((item) => item.id === equippedItemId && item.action === action);
    const next = equippedItem
      ? applyFamiliarInventoryItem(homeState, equippedItem.id, undefined, restPresetId)
      : performHomeAction(homeState, action, undefined, null, restPresetId);
    const progressed = next.lastActionAt !== previousActionAt
      ? { ...next, weeklyLoop: recordFamiliarWeeklyStep(next.weeklyLoop, action === "play" ? "play" : "care", new Date(), next.attendance.launchDate) }
      : next;
    setHomeState(progressed);
    const nextBondLevel = familiarLevelForExperience(progressed.growth.bondXp);
    if (nextBondLevel > previousBondLevel) {
      const milestone = FAMILIAR_MILESTONES.find((entry) => entry.level === nextBondLevel);
      setLevelUpNotice({ track: "Legame", level: nextBondLevel, title: milestone?.title ?? "Il vostro Legame cresce", benefits: milestone ? [milestone.benefit, milestone.rewardLabel] : ["Nuova intensità del Legame", "Progressi registrati nel Diario"] });
    }
    setAdventureState((current) => syncFamiliarAdventureGrowth(current, activeFamiliarId, progressed.growth.bondXp, progressed.growth.careStreak));
    return progressed.lastActionAt !== previousActionAt && progressed.activeAction === action;
  };

  const completeDailyMiniGame = (score: number, kind: FamiliarMiniGameKind) => {
    setHomeState((current) => {
      const weeklyLoop = restoreFamiliarWeeklyLoopState(current.weeklyLoop, new Date(), current.attendance.launchDate);
      const alreadyRewarded = weeklyLoop.miniGame.rewarded;
      const previousBest = weeklyLoop.miniGame.scores?.[kind] ?? (kind === weeklyLoop.miniGame.kind ? weeklyLoop.miniGame.bestScore : 0);
      const coins = alreadyRewarded ? 0 : 8 + Math.min(20, Math.max(0, score));
      const played = performHomeAction(current, "play");
      return {
        ...played,
        lastOutcome: alreadyRewarded ? (score > previousBest ? `Nuovo record di oggi: ${score} punti.` : `Allenamento: ${score} punti. Record di oggi: ${previousBest}.`) : `Minigioco completato: +${coins} Monete Nexus.`,
        wallet: { ...played.wallet, nexusCoins: played.wallet.nexusCoins + coins, totalEarned: played.wallet.totalEarned + coins },
        weeklyLoop: {
          ...recordFamiliarWeeklyStep(weeklyLoop, "play", new Date(), current.attendance.launchDate),
          miniGame: { ...weeklyLoop.miniGame, kind, bestScore: Math.max(score, previousBest), scores: { ...weeklyLoop.miniGame.scores, [kind]: Math.max(score, previousBest) }, rewarded: true },
        },
      };
    });
      setMiniGameOpen(false);
      setHomePanel("care");
      void recordCareMission("play");
  };

  const chooseBondStory = (choice: FamiliarBondChoice) => {
    const day = homeState.bondWeek.pendingDay;
    if (!day) return;
    const previousBondLevel = familiarLevelForExperience(homeState.growth.bondXp);
    const next = chooseFamiliarBondMemory(homeState, choice.id);
    const nextBondLevel = familiarLevelForExperience(next.growth.bondXp);
    setHomeState(next);
    setBondStoryFeedback({ choice, day });
    setAdventureState((current) => syncFamiliarAdventureGrowth(current, activeFamiliarId, next.growth.bondXp, next.growth.careStreak));
    ensureHomeAudio();
    playFamiliarInterfaceCue("confirm", !homeAudioMuted, homeAudioVolume);
    if (nextBondLevel > previousBondLevel) {
      const milestone = FAMILIAR_MILESTONES.find((entry) => entry.level === nextBondLevel);
      setLevelUpNotice({ track: "Legame", level: nextBondLevel, title: milestone?.title ?? "Il vostro Legame cresce", benefits: milestone ? [milestone.benefit, milestone.rewardLabel] : ["Un nuovo Ricordo del Legame", "La scelta è stata custodita nel Diario"] });
    }
  };

  const selectActiveInventoryItem = (itemId: FamiliarInventoryItemId) => {
    const next = equipFamiliarInventoryItem(homeState, itemId);
    if (next === homeState) return false;
    setHomeState(next);
    return true;
  };

  const applyActiveInventoryItem = (itemId: FamiliarInventoryItemId) => {
    const previousActionAt = homeState.lastActionAt;
    const previousBondLevel = familiarLevelForExperience(homeState.growth.bondXp);
    const next = applyFamiliarInventoryItem(homeState, itemId);
    setHomeState(next);
    const nextBondLevel = familiarLevelForExperience(next.growth.bondXp);
    if (nextBondLevel > previousBondLevel) {
      const milestone = FAMILIAR_MILESTONES.find((entry) => entry.level === nextBondLevel);
      setLevelUpNotice({ track: "Legame", level: nextBondLevel, title: milestone?.title ?? "Il vostro Legame cresce", benefits: milestone ? [milestone.benefit, milestone.rewardLabel] : ["Nuova intensità del Legame", "Progressi registrati nel Diario"] });
    }
    setAdventureState((current) => syncFamiliarAdventureGrowth(current, activeFamiliarId, next.growth.bondXp, next.growth.careStreak));
    return next.lastActionAt !== previousActionAt;
  };

  const recordGameMission = async (activity: FamiliarMissionActivity, sourceKey: string) => {
    try {
      const response = await fetch("/api/famiglio/activity", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activity, sourceKey }),
      });
      if (response.ok) await loadMissions();
    } catch {
      // La cura locale continua anche quando il servizio missioni non è raggiungibile.
    }
  };

  const recordCareMission = async (action: FamiliarHomeAction) => {
    await recordGameMission("familiar_care", action);
  };

  const claimMission = async (mission: DailyMissionView) => {
    if (!mission.complete || mission.claimed || missionMode !== "live") return;
    setClaimingMissionId(mission.id);
    setMissionMessage("");
    try {
      const response = await fetch("/api/famiglio/missions", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ missionId: mission.id }),
      });
      const payload = await response.json().catch(() => ({})) as DailyMissionResponse;
      if (response.ok && payload.alreadyClaimed && Array.isArray(payload.missions)) {
        setMissions(payload.missions);
        setCloudSyncReady(false);
        setCloudReloadToken((current) => current + 1);
        setMissionMessage(`${mission.title}: la ricompensa era già stata salvata.`);
        return;
      }
      if (!response.ok || !payload.reward || !Array.isArray(payload.missions)) {
        throw new Error(payload.error || "Ricompensa non disponibile.");
      }
      setMissions(payload.missions);
      const rewardedHome = payload.home
        ? restoreFamiliarHome(payload.home)
        : grantFamiliarHomeMissionReward(homeState, {
            title: mission.title,
            coins: payload.reward.coins,
            experience: payload.reward.experience,
            item: payload.reward.item,
            quantity: payload.reward.quantity,
          });
      cloudRevisionRef.current = Math.max(cloudRevisionRef.current, Math.floor(Number(payload.revision) || 0));
      const previousBondLevel = familiarLevelForExperience(homeState.growth.bondXp);
      const nextBondLevel = familiarLevelForExperience(rewardedHome.growth.bondXp);
      if (nextBondLevel > previousBondLevel) {
        const milestone = FAMILIAR_MILESTONES.find((entry) => entry.level === nextBondLevel);
        setLevelUpNotice({ track: "Legame", level: nextBondLevel, title: milestone?.title ?? "Il vostro Legame cresce", benefits: milestone ? [milestone.benefit, milestone.rewardLabel] : ["Ricompensa della missione applicata", "Progressi registrati nel Diario"] });
      }
      setHomeState(rewardedHome);
      setAdventureState((current) => syncFamiliarAdventureGrowth(current, activeFamiliarId, rewardedHome.growth.bondXp, rewardedHome.growth.careStreak));
      setMissionMessage(`${mission.title}: ricompensa riscossa.`);
    } catch (error) {
      setMissionMessage(error instanceof Error ? error.message : "Non è stato possibile riscuotere la ricompensa.");
    } finally {
      setClaimingMissionId(null);
    }
  };

  const refreshDailyMissions = async () => {
    if (missionRefreshUsed || missionMode === "loading") return;
    setMissionMode("loading");
    setMissionMessage("");
    try {
      if (missionMode === "preview") {
        const date = missionDate || romeDateKey();
        const refreshed = dailyFamiliarMissions("anteprima-lorewise:refresh", `${date}:refresh`, missions.map((mission) => mission.id)).map((mission) => ({
          ...mission,
          progress: 0,
          complete: false,
          claimed: false,
        }));
        window.localStorage.setItem(`${MISSION_REFRESH_KEY_PREFIX}:${date}`, "used");
        setMissions(refreshed);
        setMissionRefreshUsed(true);
        setMissionMode("preview");
        setMissionMessage("Missioni aggiornate. Il prossimo rinnovo sarà disponibile domani.");
        return;
      }
      const response = await fetch("/api/famiglio/missions", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "refresh" }),
      });
      const payload = await response.json() as DailyMissionResponse;
      if (!response.ok || !Array.isArray(payload.missions)) throw new Error(payload.error || "Aggiornamento non disponibile.");
      setMissionDate(payload.date || romeDateKey());
      setMissions(payload.missions);
      setMissionRefreshUsed(true);
      setMissionMode("live");
      setMissionMessage("Missioni aggiornate. Il prossimo rinnovo sarà disponibile domani.");
    } catch (error) {
      setMissionMode((current) => current === "loading" ? "error" : current);
      setMissionMessage(error instanceof Error ? error.message : "Non è stato possibile aggiornare le missioni.");
    }
  };

  const goBack = () => {
    if (homePanel === "combat" && combatState.activeBattle?.outcome === "active") return;
    if (state.stage === "home" && homePanel !== "care") {
      setHomePanel("care");
      return;
    }
    if (state.stage === "confirming") {
      setState(returnToEggs);
      return;
    }
    if (state.stage === "hatching") {
      const shouldCancel = window.confirm("Tornando indietro il rito ricomincerà da zero. Vuoi continuare?");
      if (shouldCancel) setState(cancelHatching);
    }
  };

  const currentHouseSnapshot = (): LocalHouseSnapshot => ({
    rebuild: state,
    home: homeState,
    adventure: adventureState,
    combat: combatState,
    activeFamiliarId: combatState.activeBattle?.player.familiarId ?? testCollectionFamiliarId ?? state.unlockedIds[homeFamiliarIndex] ?? state.selectedId,
  });

  const switchHouse = (nextIndex: number) => {
    if (nextIndex === activeHouseIndex || nextIndex < 0 || nextIndex > 2) {
      setHouseManagerOpen(false);
      return;
    }
    const houses = [...houseSnapshotsRef.current];
    houses[activeHouseIndex] = currentHouseSnapshot();
    const target = houses[nextIndex];
    const purchasedHouse = nextIndex === 1
      ? purchasedOfferIds.includes("slot-famiglio-2")
      : nextIndex === 2 && purchasedOfferIds.includes("slot-famiglio-3");
    if (!target && !localHouseTrial && !purchasedHouse) {
      setHouseManagerOpen(false);
      setHomePanel("market");
      setMarketWing("atelier");
      setAtelierCategory("slots");
      return;
    }
    const next = target ?? {
      rebuild: createRebuildState(),
      home: createFamiliarHomeState(),
      adventure: createFamiliarAdventureState(),
      combat: createFamiliarCombatState(),
      activeFamiliarId: null,
    } satisfies LocalHouseSnapshot;
    houses[nextIndex] = next;
    houseSnapshotsRef.current = houses;
    setSavedHouseSnapshots(houses);
    setActiveHouseIndex(nextIndex);
    setState(next.rebuild);
    setHomeState(next.home);
    setAdventureState(next.adventure);
    setCombatState(next.combat);
    const starterIndex = next.activeFamiliarId ? next.rebuild.unlockedIds.findIndex((id) => id === next.activeFamiliarId) : -1;
    setHomeFamiliarIndex(Math.max(0, starterIndex));
    setTestCollectionFamiliarId(next.activeFamiliarId && starterIndex < 0 ? next.activeFamiliarId : null);
    setHomePanel(next.combat.activeBattle ? "combat" : "care");
    setInventoryOpen(false);
    setRestartStep(0);
    setHouseManagerOpen(false);
  };

  const restartActiveFamiliar = () => {
    const houses = [...houseSnapshotsRef.current];
    houses[activeHouseIndex] = null;
    houseSnapshotsRef.current = houses;
    setSavedHouseSnapshots(houses);
    setState(createRebuildState());
    setHomeState(createFamiliarHomeState());
    setAdventureState(createFamiliarAdventureState());
    setCombatState(createFamiliarCombatState());
    setTestCollectionFamiliarId(null);
    setHomeFamiliarIndex(0);
    setHomePanel("care");
    setRestartStep(0);
    setHouseManagerOpen(false);
  };

  const openHousePurchase = () => {
    setRestartStep(0);
    setHouseManagerOpen(false);
    setHomePanel("market");
    setMarketWing("atelier");
    setAtelierCategory("slots");
  };

  const startFamiliarCheckout = async (offerId: string) => {
    if (checkoutOfferId) return;
    setCheckoutOfferId(offerId);
    setMarketMessage("Apertura del pagamento protetto…");
    showMerchantReaction("medusa", "Medusa prepara il contratto nello Specchio.");
    try {
      const response = await fetch("/api/checkout", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productType: "merchandise", productCode: `LW-FAM-${offerId.toUpperCase()}` }) });
      const payload = await response.json().catch(() => ({})) as { checkoutUrl?: string; error?: string };
      if (!response.ok || !payload.checkoutUrl) throw new Error(payload.error || "Pagamento non disponibile.");
      window.location.assign(payload.checkoutUrl);
    } catch (error) {
      setMarketMessage(error instanceof Error ? error.message : "Pagamento non disponibile.");
      setCheckoutOfferId(null);
    }
  };

  const equipPurchasedPremiumCover = (coverId: string) => {
    setSelectedPremiumCoverId(coverId);
    setEquippedPremiumCoverId(coverId);
    setAtelierCoverPreview(false);
    try { window.localStorage.setItem("lorewise:famiglio:premium-cover", coverId); } catch { /* Preferenza solo locale. */ }
    setMarketMessage("Cover premium applicata. I comandi restano sempre leggibili.");
    showMerchantReaction("medusa", "Medusa sigilla la cover sul Nexus Pet.");
  };

  const attendancePosition = familiarAttendancePosition(new Date(), homeState.attendance.launchDate);
  const attendanceRecovery = familiarAttendanceRecovery(homeState.attendance);
  const attendanceSeason = FAMILIAR_ATTENDANCE_SEASONS.find((season) => season.id === familiarAttendanceReward(attendancePosition.dayIndex).seasonId) ?? FAMILIAR_ATTENDANCE_SEASONS[0];
  const attendanceWeekRewards = Array.from({ length: 7 }, (_, index) => familiarAttendanceReward(Math.min(364, (attendancePosition.week - 1) * 7 + index + 1)));
  const miniGameFamiliar = FAMILIAR_COLLECTION.find((entry) => entry.id === activeFamiliarId) ?? FAMILIAR_COLLECTION[0];

  return (
    <main
      className={`${styles.experience} famiglio-game-root`}
      onPointerDownCapture={(event) => {
        const target = event.target as HTMLElement;
        if (target.closest('[data-famiglio-audio-scope="combat"]')) return;
        const control = target.closest("button, a, [role='button']") as HTMLButtonElement | HTMLAnchorElement | null;
        if (!control || ("disabled" in control && control.disabled)) return;
        ensureHomeAudio();
        playFamiliarInterfaceCue("confirm", !homeAudioMuted, homeAudioVolume);
      }}
      onChangeCapture={(event) => {
        const target = event.target;
        if (!(target instanceof HTMLSelectElement) || target.closest('[data-famiglio-audio-scope="combat"]')) return;
        ensureHomeAudio();
        playFamiliarInterfaceCue("select", !homeAudioMuted, homeAudioVolume);
      }}
    >
      <div className={styles.nexusGlow} aria-hidden="true" />
      <section className={styles.deviceShell} style={deviceShellStyle} data-cover={activeDeviceCover.id} data-premium-cover={selectedPremiumCover ? "true" : "false"}>
        <header className={styles.deviceTop}>
          <span className={styles.brandMark} role="img" aria-label="Emblema Nexus Pet" />
          <div>
            <strong>Nexus Pet</strong>
            <small>Custode tascabile</small>
          </div>
          {state.stage === "confirming" || state.stage === "hatching" || (state.stage === "home" && homePanel !== "care" && !(homePanel === "combat" && combatState.activeBattle?.outcome === "active")) ? (
            <button className={`${styles.screenBack} ${styles.screenBackTop}`} type="button" onClick={goBack} aria-label="Torna alla schermata precedente">
              <span className={styles.screenBackIcon} aria-hidden="true">←</span>
            </button>
          ) : null}
          <div className={styles.walletStrip} aria-label="Valute disponibili">
            <span title="Monete Nexus" aria-label={`${homeState.wallet.nexusCoins} Monete Nexus`}>
              <i style={{ backgroundImage: `url(${WALLET_ICONS.nexusCoins})` }} aria-hidden="true" />
              <b>{homeState.wallet.nexusCoins}</b>
            </span>
            <span title="Sigilli Notturni" aria-label={`${homeState.wallet.nightSigils} Sigilli Notturni`}>
              <i style={{ backgroundImage: `url(${WALLET_ICONS.nightSigils})` }} aria-hidden="true" />
              <b>{homeState.wallet.nightSigils}</b>
            </span>
            <span title="Frammenti di Reliquia" aria-label={`${homeState.wallet.relicFragments} Frammenti di Reliquia`}>
              <i style={{ backgroundImage: `url(${WALLET_ICONS.relicFragments})` }} aria-hidden="true" />
              <b>{homeState.wallet.relicFragments}</b>
            </span>
          </div>
          <button
            className={styles.walletTrigger}
            type="button"
            aria-expanded={walletOpen}
            aria-controls="famiglio-wallet-popover"
            aria-label="Apri il Portafoglio del Nexus"
            onClick={() => setWalletOpen((current) => !current)}
          >
            <span className={styles.headerControlIcon} style={{ backgroundImage: `url(${HEADER_CONTROL_ICONS.wallet})` }} aria-hidden="true" /><b>Valute</b>
          </button>
          <button className={styles.houseManagerTrigger} type="button" onClick={() => { setWalletOpen(false); setRestartStep(0); setHouseManagerOpen(true); }} aria-label={`Gestisci le Case. Casa attiva ${activeHouseIndex + 1}`}>
            <span className={styles.headerControlIcon} style={{ backgroundImage: `url(${HEADER_CONTROL_ICONS.houses})` }} aria-hidden="true" /><b>Case</b><small>{activeHouseIndex + 1}/3</small>
          </button>
          <FamiglioGuideOverlay section={activeGuideSection} ready={storageReady} />
          <Link className={styles.exitExperience} href="/" aria-label="Esci dal Nexus Pet"><span className={styles.headerControlIcon} style={{ backgroundImage: `url(${HEADER_CONTROL_ICONS.exit})` }} aria-hidden="true" /><b>Esci</b></Link>
          <span className={styles.statusLight} aria-label="Dispositivo attivo" />
          {walletOpen ? (
            <section id="famiglio-wallet-popover" className={styles.walletPopover} aria-label="Portafoglio del Nexus">
              <header>
                <strong>Portafoglio</strong>
                <button type="button" onClick={() => setWalletOpen(false)} aria-label="Chiudi il Portafoglio">×</button>
              </header>
              <div>
                <span><i style={{ backgroundImage: `url(${WALLET_ICONS.nexusCoins})` }} aria-hidden="true" /><small>Monete Nexus</small><b>{homeState.wallet.nexusCoins}</b></span>
                <span><i style={{ backgroundImage: `url(${WALLET_ICONS.nightSigils})` }} aria-hidden="true" /><small>Sigilli Notturni</small><b>{homeState.wallet.nightSigils}</b></span>
                <span><i style={{ backgroundImage: `url(${WALLET_ICONS.relicFragments})` }} aria-hidden="true" /><small>Frammenti di Reliquia</small><b>{homeState.wallet.relicFragments}</b></span>
              </div>
            </section>
          ) : null}
        </header>
      <section className={styles.introduction}>
        {state.stage === "confirming" || state.stage === "hatching" || (state.stage === "home" && homePanel !== "care" && !(homePanel === "combat" && combatState.activeBattle?.outcome === "active")) ? (
          <button className={`${styles.screenBack} ${styles.screenBackIntro}`} type="button" onClick={goBack} aria-label="Torna alla schermata precedente">
            <span className={styles.screenBackIcon} aria-hidden="true">←</span><span className={styles.screenBackLabel}>← Indietro</span>
          </button>
        ) : null}
        <p className={styles.eyebrow}>Famigli del Nexus</p>
        <h1>{state.stage === "choosing" ? "Il primo legame" : state.stage === "confirming" ? "Ascolta il richiamo" : state.stage === "hatching" ? "Rituale di schiusa" : state.stage === "hatched" ? "Il legame è nato" : homePanel === "diary" ? "Diario del legame" : homePanel === "missions" ? "Missioni del Nexus" : homePanel === "market" ? "Mercato del Nexus" : homePanel === "adventure" ? "Spedizioni del Nexus" : homePanel === "combat" ? "Arena dei Famigli" : homePanel === "progression" ? "Percorso del Legame" : "La Casa del Famiglio"}</h1>
        <p>
          {state.stage === "choosing" && "Ogni uovo custodisce un Famiglio preciso. La scelta è tua e non è casuale."}
          {state.stage === "confirming" && "Osserva il sigillo e il carattere del Famiglio. Puoi ancora cambiare scelta."}
          {state.stage === "hatching" && "La schiusa procede da sola. Nel frattempo prepara l’identità del tuo Famiglio."}
          {state.stage === "hatched" && "Da questo momento il vostro cammino nel Nexus sarà condiviso."}
          {state.stage === "home" && (homePanel === "diary" ? `I ricordi importanti di ${familiarDisplayName} restano custoditi qui.` : homePanel === "missions" ? "Tre incarichi reali, diversi ogni giorno, uniscono il Famiglio al resto di LoreWise." : homePanel === "market" ? "Bancarelle distinte per provviste, cure e future collezioni speciali." : homePanel === "adventure" ? "Spedizioni a tempo con ricompense ed esperienza esplorazione." : homePanel === "combat" ? "Duelli progressivi tra tutti i Famigli, con livelli, statistiche e mosse personali." : homePanel === "progression" ? "Evoluzioni, nuove mosse e ricompense raccolte in un cammino leggibile." : `${homeDisplayName} ti aspetta nel suo rifugio.`)}
        </p>
        {state.stage === "hatching" ? <div className={styles.progressBlock}><span>Legame {ritualProgress(state)}%</span><progress max="100" value={ritualProgress(state)} /></div> : null}
      </section>

      <section className={styles.stage} aria-live="polite">
        {state.stage === "choosing" ? (
          <div className={styles.eggGrid} aria-label="Scegli il primo Famiglio">
            {STARTER_EGGS.map((egg) => (
              <button
                className={`${styles.eggChoice} ${focusedEgg.id === egg.id ? styles.eggChoiceActive : ""}`}
                type="button"
                key={egg.id}
                aria-current={focusedEgg.id === egg.id ? "true" : undefined}
                onFocus={() => setFocusedEggIndex(STARTER_EGGS.findIndex((starter) => starter.id === egg.id))}
                onClick={() => {
                  setFocusedEggIndex(STARTER_EGGS.findIndex((starter) => starter.id === egg.id));
                  setState((current) => selectStarter(current, egg.id));
                }}
              >
                <MiniEgg egg={egg} />
                <strong>{egg.familiar}</strong>
                <span>{egg.egg}</span>
              </button>
            ))}
          </div>
        ) : null}

        {state.stage === "confirming" && selectedEgg ? (
          <div className={styles.focusScene}>
            <NexusCanvas state={state} egg={selectedEgg} />
            <div className={styles.focusCopy}>
              <small>{selectedEgg.egg}</small>
              <div className={styles.identityReveal}>
                <FamiliarPreview egg={selectedEgg} colorVariant={state.colorVariant} />
                <span>Forma custodita</span>
              </div>
              <h2>{selectedEgg.familiar}</h2>
              <p>{selectedEgg.nature}</p>
              <ul className={styles.traitList}>{selectedEgg.traits.map((trait) => <li key={trait}>{trait}</li>)}</ul>
              <button className={styles.primaryAction} type="button" onClick={() => setState(beginHatching)}>Inizia il rituale</button>
              <button className={styles.secondaryAction} type="button" onClick={() => setState(returnToEggs)}>Scegli un altro uovo</button>
            </div>
          </div>
        ) : null}

        {state.stage === "hatching" && selectedEgg ? (
          <div className={styles.focusScene}>
            <NexusCanvas state={state} egg={selectedEgg} />
            <div className={styles.focusCopy}>
              <small>Fase {state.ritualPhaseIndex + 1} di 3</small>
              <h2>{phase.title}</h2>
              <p>{phase.instruction}</p>
              <div className={styles.customization}>
                <label className={styles.nameField} htmlFor="familiar-name">
                  <span>Nome</span>
                  <input
                    id="familiar-name"
                    type="text"
                    maxLength={18}
                    value={state.familiarName}
                    placeholder={`Nome di ${selectedEgg.familiar}`}
                    onChange={(event) => setState((current) => customizeFamiliar(current, { familiarName: event.target.value }))}
                  />
                </label>
                <fieldset className={styles.choiceField} data-choice="sex">
                  <legend>Sesso</legend>
                  <div>
                    {SEX_OPTIONS.map((option) => (
                      <button
                        className={state.familiarSex === option.id ? styles.selectedOption : styles.optionButton}
                        type="button"
                        key={option.id}
                        aria-label={option.label}
                        title={option.label}
                        onClick={() => setState((current) => customizeFamiliar(current, { familiarSex: option.id }))}
                      >
                        <SexChoiceIcon sex={option.id} />
                      </button>
                    ))}
                  </div>
                </fieldset>
                {colorOptions.length > 1 ? (
                  <fieldset className={styles.choiceField} data-choice="color">
                    <legend>Colore</legend>
                    <div>
                      {colorOptions.map((option) => (
                        <button
                          className={state.colorVariant === option.id ? styles.selectedOption : styles.optionButton}
                          type="button"
                          key={option.id}
                          onClick={() => setState((current) => customizeFamiliar(current, { colorVariant: option.id }))}
                        >
                          <span className={styles.colorPreview} aria-hidden="true">
                            <i style={{ backgroundColor: option.colors[0] }} />
                            {option.colors[1] ? <i style={{ backgroundColor: option.colors[1] }} /> : null}
                          </span>
                          <span>{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </fieldset>
                ) : null}
                <div className={styles.characterBlock}>
                  <span>Carattere</span>
                  <strong>{selectedEgg.nature}</strong>
                  <ul className={styles.traitList}>{selectedEgg.traits.map((trait) => <li key={trait}>{trait}</li>)}</ul>
                </div>
              </div>
              <span className={styles.countdown}>Schiusa automatica · {totalSeconds}s rimanenti · fase {phaseSeconds}s</span>
            </div>
          </div>
        ) : null}

        {state.stage === "hatched" && homeFamiliar ? (
          <div className={styles.focusScene}>
            <NexusCanvas state={state} egg={homeFamiliar} />
            <div className={styles.focusCopy}>
              <small>Primo ricordo inciso</small>
              <h2>{familiarDisplayName} è nato</h2>
              <p>{homeFamiliar.familiar} · {SEX_OPTIONS.find((option) => option.id === state.familiarSex)?.label}. Il legame è stato riconosciuto dal Nexus.</p>
              <button className={styles.primaryAction} type="button" onClick={() => setState(enterFamiliarHome)}>Entra nella Casa</button>
            </div>
          </div>
        ) : null}

        {state.stage === "home" && homeFamiliar && homePanel === "care" ? (
          <div className={styles.homeExperience}>
            <div className={styles.homeScene}>
              <FamiliarHomeCanvas
                egg={homeFamiliar}
                collectionFamiliar={activeCollectionFamiliar}
                colorVariant={state.colorVariant}
                action={homeState.activeAction}
                room={homeState.roomAction}
                actionEndsAt={homeState.actionEndsAt}
                activeItemId={homeState.activeItemId}
                equippedRestItemId={homeState.equippedItems.rest ?? "purple-bed"}
                needs={homeState.needs}
                toilet={homeState.toilet}
                sick={homeState.health.status === "sick"}
                growthScale={growthMeta.scale}
                growthStage={activeGrowth.stage}
                away={familiarAway}
                roomTime={displayedRoomTime}
                bondStoryDay={storyModalEvent?.day ?? null}
                bondStoryActive={bondStoryOpen}
                bondStoryVisible={bondStoryOpen}
                bondKeepsakeIds={homeState.bondWeek.keepsakeIds}
                onAutonomousReaction={setAutonomousPresentation}
                onMealFinished={() => setHomeState((current) => current.activeAction === "feed"
                  ? { ...current, activeAction: null, activeItemId: null, roomAction: "feed", actionEndsAt: null }
                  : current)}
              />
              {bondStoryOpen && storyModalEvent ? (
                <section className={styles.bondStoryScene} data-tone={storyModalEvent.tone} role="dialog" aria-modal="true" aria-labelledby="bond-story-title">
                  <button className={styles.bondStorySceneClose} type="button" aria-label="Chiudi il ricordo" onClick={() => {
                    setBondStoryOpen(false);
                    setBondStoryFeedback(null);
                  }}>×</button>
                  <div className={styles.bondStorySceneHeading}>
                    <span aria-hidden="true">{storyModalEvent.symbol}</span>
                    <div><small>{storyModalEvent.eyebrow} · {storyModalEvent.day}/{FAMILIAR_BOND_WEEK.length}</small><h3 id="bond-story-title">{storyModalEvent.title}</h3></div>
                  </div>
                  {!bondStoryFeedback ? <>
                    <p>{storyModalEvent.scene}</p>
                    <strong>{storyModalEvent.question}</strong>
                    <div className={styles.bondStorySceneChoices}>
                      {storyModalEvent.choices.map((choice) => <button type="button" key={choice.id} onClick={() => chooseBondStory(choice)}>
                        <span aria-hidden="true">{FAMILIAR_BOND_TRAITS[choice.trait].icon}</span>
                        <b>{choice.label}</b>
                      </button>)}
                    </div>
                  </> : <div className={styles.bondStorySceneResult}>
                    <strong>{bondStoryFeedback.choice.memoryTitle}</strong>
                    <p>{bondStoryFeedback.choice.response}</p>
                    <div><b>+{bondStoryFeedback.choice.bondXp} XP</b><b>+{bondStoryFeedback.choice.coins} monete</b></div>
                    {bondStoryFeedback.choice.keepsakeId ? <small className={styles.bondStoryReward}>Ricompensa nella Casa: {FAMILIAR_BOND_KEEPSAKES[bondStoryFeedback.choice.keepsakeId]?.label}</small> : null}
                    <button type="button" onClick={() => {
                      setBondStoryOpen(false);
                      setBondStoryFeedback(null);
                    }}>Custodisci nel Diario</button>
                  </div>}
                </section>
              ) : null}
              <div className={styles.homeAudioControls} aria-label="Audio della Casa">
                <button
                  type="button"
                  aria-label={homeAudioMuted ? "Attiva audio della Casa" : "Disattiva audio della Casa"}
                  title={homeAudioMuted ? "Attiva audio della Casa" : "Disattiva audio della Casa"}
                  aria-pressed={homeAudioMuted}
                  onClick={() => {
                    const nextMuted = !homeAudioMuted;
                    setHomeAudioMuted(nextMuted);
                    ensureHomeAudio(nextMuted, homeAudioVolume);
                  }}
                >
                  <span style={{ backgroundImage: "url(/famiglio/rebuild/combat/ui/control-audio.png)" }} data-muted={homeAudioMuted} aria-hidden="true" />
                </button>
                <label>
                  <span>Volume</span>
                  <input
                    aria-label="Volume della Casa"
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={homeAudioVolume}
                    onChange={(event) => {
                      const nextVolume = Number(event.target.value);
                      setHomeAudioVolume(nextVolume);
                      if (nextVolume > 0 && homeAudioMuted) setHomeAudioMuted(false);
                      ensureHomeAudio(false, nextVolume);
                    }}
                  />
                </label>
              </div>
              {homeState.health.status === "sick" ? <button
                className={styles.homeSceneCure}
                type="button"
                disabled={familiarAway || Boolean(homeState.activeAction) || (homeState.inventory.quantities["comfort-balm"] ?? 0) <= 0}
                title={(homeState.inventory.quantities["comfort-balm"] ?? 0) <= 0 ? "Acquista la medicina da Nora." : "Usa una dose della medicina di Nora."}
                onClick={() => {
                  const next = cureFamiliarHome(homeState);
                  setHomeState(next);
                  ensureHomeAudio();
                  playFamiliarInterfaceCue("confirm", !homeAudioMuted, homeAudioVolume);
                }}
              ><span className={styles.homeSceneCureIcon} aria-hidden="true" /><strong>Cura</strong><small>x{homeState.inventory.quantities["comfort-balm"] ?? 0}</small></button> : null}
              <div className={styles.homeNameplate}>
                <strong>{homeDisplayName}</strong>
                <span>{familiarAway ? `${homeDisplayName} è sui Sentieri del Nexus. I bisogni restano sospesi.` : homeState.activeAction ? homeState.lastOutcome : toiletMessage ?? `${moodMeta.icon} ${moodMeta.label} · ${autonomousReaction} · ${dailyMoment.title}`}</span>
                <small title={dailyMoment.message}>{returnGreeting}</small>
                <time className={styles.roomClock} dateTime={displayedRoomTime?.toISOString()}>
                  <b>{displayedRoomTime ? displayedRoomTime.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }) : "--:--"}</b>
                  <small>{displayedRoomTime ? displayedRoomTime.toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" }) : ""}</small>
                  <em>{displayedRoomTime ? ({ morning: "Mattina", afternoon: "Pomeriggio", evening: "Sera", night: "Notte" } as const)[roomDayPhase(displayedRoomTime)] : ""}</em>
                </time>
              </div>
            </div>
            <div className={styles.needsPanel} aria-label="Bisogni del Famiglio">
              {homePersonality ? (
                <div className={styles.personalityStrip}>
                  <small>Istinto</small>
                  <strong>{homePersonality.title}</strong>
                  <span>{homePersonality.signature}</span>
                  <button className={styles.progressionEntry} type="button" onClick={() => setHomePanel("progression")}>
                    <i style={{ backgroundImage: "url(/famiglio/rebuild/inventory/bond-lantern.png)" }} aria-hidden="true" />
                    <b>Percorso</b>
                  </button>
                </div>
              ) : null}
              <div className={styles.tamagotchiStatus}>
                <div>
                  <small>Umore</small>
                  <strong>{moodMeta.icon} {moodMeta.label}</strong>
                </div>
                <div>
                  <small>Crescita</small>
                  <strong>{growthMeta.label}</strong>
                  <span className={styles.growthDetail}>{growthMeta.nextXp ? `${activeGrowth.bondXp}/${growthMeta.nextXp} XP · ${activeGrowth.careStreak} giorni` : "Stadio massimo"}</span>
                  <span className={styles.statusTrack} aria-label={`Crescita: ${Math.round(growthProgress(activeGrowth))}%`}>
                    <i style={{ width: `${growthProgress(activeGrowth)}%` }} />
                  </span>
                </div>
                <div>
                  <small>Routine</small>
                  <strong>{completedRoutineActions}/{HOME_ACTIONS.length}</strong>
                  <span className={styles.statusTrack} aria-label={`Routine: ${routinePercent}%`}>
                    <i style={{ width: `${routinePercent}%` }} />
                  </span>
                </div>
                <div>
                  <small>Legame</small>
                  <strong>{activeGrowth.bondXp} XP</strong>
                </div>
              </div>
              {HOME_NEEDS.map((need) => (
                <div className={styles.needRow} key={need.id}>
                  <span aria-hidden="true">{need.icon}</span>
                  <strong>{need.label}</strong>
                  <div className={styles.needTrack} aria-label={`${need.label}: ${Math.round(homeState.needs[need.id])}%`}>
                    <i style={{ width: `${homeState.needs[need.id]}%` }} />
                  </div>
                  <b>{Math.round(homeState.needs[need.id])}</b>
                </div>
              ))}
            </div>
            {!inventoryOpen ? <section className={`${styles.dailyWishCard} ${homeState.wish.fulfilledAt ? styles.dailyWishComplete : ""}`} aria-label="Desiderio di oggi">
              <header>
                <span aria-hidden="true">✦</span>
                <small>{homeState.wish.fulfilledAt ? "Desiderio esaudito" : "Desiderio di oggi"}</small>
              </header>
               <strong>{wishCopy.title}</strong>
               <p>{wishCopy.description}</p>
               <footer>
                <b>{homeState.wish.fulfilledAt ? `Ottenute ${DAILY_WISH_REWARD_COINS} monete Nexus` : `${wishAction.label} · +${DAILY_WISH_REWARD_COINS} monete Nexus`}</b>
                <div className={styles.dailyButtons}>
                  <button type="button" aria-label="Apri zaino" title="Apri zaino" disabled={familiarAway} onClick={() => setInventoryOpen(true)}><span className={styles.dailyNavIcon} style={{ backgroundImage: `url(${HOME_NAVIGATION_ICONS.inventory})` }} aria-hidden="true" /><span className={styles.dailyNavLabel}>Zaino</span></button>
                  <button type="button" aria-label="Apri diario" title="Apri diario" disabled={familiarAway} onClick={() => { setDiaryPage(0); setHomePanel("diary"); }}><span className={styles.dailyNavIcon} style={{ backgroundImage: `url(${HOME_NAVIGATION_ICONS.diary})` }} aria-hidden="true" /><span className={styles.dailyNavLabel}>Diario</span></button>
                  <button type="button" aria-label="Apri missioni" title="Apri missioni" disabled={familiarAway} onClick={() => setHomePanel("missions")}><span className={styles.dailyNavIcon} style={{ backgroundImage: `url(${HOME_NAVIGATION_ICONS.missions})` }} aria-hidden="true" /><span className={styles.dailyNavLabel}>Missioni</span></button>
                  <button type="button" aria-label="Apri mercato" title="Apri mercato" disabled={familiarAway} onClick={() => setHomePanel("market")}><span className={styles.dailyNavIcon} style={{ backgroundImage: `url(${HOME_NAVIGATION_ICONS.market})` }} aria-hidden="true" /><span className={styles.dailyNavLabel}>Mercato</span></button>
                  <button type="button" aria-label="Apri le Spedizioni del Nexus" title="Spedizioni" disabled={Boolean(combatState.activeBattle)} onClick={() => setHomePanel("adventure")}><span className={styles.dailyNavIcon} style={{ backgroundImage: `url(${HOME_NAVIGATION_ICONS.adventure})` }} aria-hidden="true" /><span className={styles.dailyNavLabel}>Spedizioni</span></button>
                  <button type="button" aria-label="Apri l'Arena dei Famigli" title="Lotte" disabled={Boolean(adventureState.expedition)} onClick={() => setHomePanel("combat")}><span className={`${styles.dailyNavIcon} ${styles.combatNavIcon}`} aria-hidden="true">⚔</span><span className={styles.dailyNavLabel}>Lotte</span></button>
                </div>
              </footer>
            </section> : (
              <section className={styles.inventoryTray} aria-label="Inventario del Famiglio">
                <header><div><small>Kit del custode</small><strong>Inventario</strong></div><button type="button" onClick={() => setInventoryOpen(false)}>Chiudi</button></header>
                <div className={styles.inventoryItems}>
                  {FAMILIAR_ITEM_CATALOG.filter((item) => homeState.inventory.quantities[item.id] > 0).map((item) => {
                    const quantity = homeState.inventory.quantities[item.id];
                    const availability = homeActionAvailability(homeState, item.action);
                    const nightRelic = NIGHT_MARKET_OFFERS.some((offer) => offer.itemId === item.id);
                    const medicine = item.id === "comfort-balm";
                    const selectable = !item.consumable && !nightRelic;
                    const equipped = selectable && homeState.equippedItems?.[item.action] === item.id;
                    const blocked = familiarAway || quantity <= 0 || (medicine ? homeState.health.status !== "sick" : (!selectable && !availability.available));
                    return (
                      <button
                        className={equipped || homeState.activeItemId === item.id ? styles.inventoryItemActive : styles.inventoryItem}
                        type="button"
                        key={item.id}
                        disabled={blocked}
                        aria-pressed={selectable ? equipped : undefined}
                        title={familiarAway ? `${homeDisplayName} deve prima tornare alla Casa.` : !selectable && !availability.available ? availability.reason : item.description}
                        onClick={() => {
                          if (selectable) {
                            if (selectActiveInventoryItem(item.id)) {
                              ensureHomeAudio();
                              playFamiliarInterfaceCue("confirm", !homeAudioMuted, homeAudioVolume);
                            }
                          } else if (medicine) {
                            const next = cureFamiliarHome(homeState);
                            setHomeState(next);
                            ensureHomeAudio();
                            playFamiliarInterfaceCue("confirm", !homeAudioMuted, homeAudioVolume);
                          } else if (applyActiveInventoryItem(item.id)) {
                            ensureHomeAudio();
                            playFamiliarHomeActionCue(activeFamiliarId, item.action, !homeAudioMuted, homeAudioVolume);
                            void recordCareMission(item.action);
                          }
                        }}
                      >
                        <span className={styles.inventoryIcon} style={{ backgroundImage: `url(${item.id === "moon-meal" ? familiarMealAsset(activeFamiliarId) : item.assetSrc})` }} aria-hidden="true" />
                        <strong>{item.name}</strong>
                        <small>{item.consumable ? `x${quantity} · Usa` : nightRelic ? "Reliquia" : equipped ? "In uso" : "Seleziona"}</small>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}
            <div className={styles.homeActions} aria-label="Azioni con il Famiglio">
              {HOME_ACTIONS.map((item) => {
                const availability = homeActionAvailability(homeState, item.id);
                const blockedReason = familiarAway ? `${homeDisplayName} deve prima concludere l'attività fuori dalla Casa.` : availability.reason;
                const blocked = familiarAway || !availability.available;
                const shortReason = availability.code === "cooldown"
                  ? homeActionWaitLabel(availability.remainingMs)
                  : availability.code === "busy"
                    ? homeState.activeAction === item.id
                      ? homeActionWaitLabel(availability.remainingMs)
                      : null
                  : availability.code === "stock" ? "Scorte finite"
                  : availability.code === "energy" ? "Energia bassa"
                  : null;
                return <button
                  className={homeState.activeAction === item.id
                    ? styles.homeActionActive
                    : `${styles.homeAction} ${item.id === homeState.wish.action && !homeState.wish.fulfilledAt ? styles.homeActionWish : ""} ${item.id === "clean" && homeState.toilet.wasteCount > 0 ? styles.homeActionWasteAlert : ""}`}
                  type="button"
                  key={item.id}
                  data-alert-phase={item.id === "clean" && homeState.toilet.wasteCount > 0 && displayedRoomTime
                    ? Math.floor(displayedRoomTime.getTime() / 700) % 2
                    : undefined}
                  data-timer={availability.code === "cooldown" || (availability.code === "busy" && homeState.activeAction === item.id) ? "true" : undefined}
                  disabled={blocked}
                  title={blocked ? blockedReason : undefined}
                  onClick={() => {
                    if (item.id === "play") {
                      setMiniGameOpen(true);
                      return;
                    }
                    if (item.id === "rest") {
                      setRestChoiceOpen(true);
                      return;
                    }
                    if (performActiveHomeAction(item.id)) {
                      ensureHomeAudio();
                      playFamiliarHomeActionCue(activeFamiliarId, item.id, !homeAudioMuted, homeAudioVolume);
                      void recordCareMission(item.id);
                    }
                  }}
                >
                  <span aria-hidden="true">{item.icon}</span>
                  <strong>{item.label}</strong>
                  {blocked && shortReason ? <small className={styles.actionBlockReason}>{shortReason}</small> : null}
                  {item.id === homeState.wish.action && !homeState.wish.fulfilledAt ? <small className={styles.wishMarker} title="Azione del desiderio">Desid.</small> : null}
                </button>;
              })}
            </div>
            {restChoiceOpen ? <div className={styles.restChoiceBackdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setRestChoiceOpen(false); }}>
              <section className={styles.restChoiceSheet} role="dialog" aria-modal="true" aria-labelledby="rest-choice-title">
                <header><div><small>Routine del Famiglio</small><h3 id="rest-choice-title">Quanto deve riposare?</h3></div><button type="button" aria-label="Chiudi" onClick={() => setRestChoiceOpen(false)}>×</button></header>
                <div>{FAMILIAR_REST_PRESETS.map((preset) => <button type="button" key={preset.id} onClick={() => {
                  setRestChoiceOpen(false);
                  if (performActiveHomeAction("rest", preset.id)) {
                    ensureHomeAudio();
                    playFamiliarHomeActionCue(activeFamiliarId, "rest", !homeAudioMuted, homeAudioVolume);
                    void recordCareMission("rest");
                  }
                }}><strong>{preset.name}</strong><span>{preset.description}</span><b>{Math.round(preset.durationMs / 60_000)} min</b></button>)}</div>
              </section>
            </div> : null}
          </div>
        ) : null}

        {state.stage === "home" && homeFamiliar && homePanel === "adventure" ? (
          <FamiglioAdventure
            familiarId={activeFamiliarId}
            familiarName={homeDisplayName}
            colorVariant={state.colorVariant}
            growthStage={activeGrowth.stage}
            state={adventureState}
            setState={setAdventureState}
            testMode={allTestMode}
            onReward={receiveAdventureReward}
            onMissionActivity={(activity, sourceKey) => void recordGameMission(activity, sourceKey)}
            activityGate={expeditionGate}
            onReturnHome={() => setHomePanel("care")}
          />
        ) : null}

        {state.stage === "home" && homeFamiliar && homePanel === "combat" ? (
          <FamiglioCombatArena
            familiarId={combatSelectedFamiliarId}
            familiarName={combatSelectedFamiliarName}
            growthStage={combatSelectedGrowthStage}
            colorVariant={combatSelectedColorVariant}
            state={combatState}
            setState={setCombatState}
            testMode={allTestMode}
            playerStatBonus={familiarCombatNeedBonus(combatGate)}
            activityGate={combatGate}
            familiarOptions={combatFamiliarOptions}
            onSelectFamiliar={selectCombatFamiliar}
            onReward={receiveCombatReward}
            onMissionActivity={(activity, sourceKey) => void recordGameMission(activity, sourceKey)}
            onReturnHome={() => setHomePanel("care")}
          />
        ) : null}

        {state.stage === "home" && homeFamiliar && homePanel === "progression" ? (
          <FamiglioProgression
            familiarId={activeFamiliarId}
            familiarName={homeDisplayName}
            bondXp={activeGrowth.bondXp}
            careDays={activeGrowth.careStreak}
            growthStage={activeGrowth.stage}
            combatState={combatState}
            attendance={homeState.attendance}
            weeklyLoop={homeState.weeklyLoop}
            onOpenAttendance={() => { setAttendanceReveal(null); setAttendanceOpen(true); }}
            onNavigateStep={(step) => {
              if (familiarAway) { setHomePanel(combatState.activeBattle ? "combat" : "adventure"); return; }
              if (step === "play") { setHomePanel("care"); if (!homeState.activeAction) setMiniGameOpen(true); }
              else setHomePanel(step === "care" ? "care" : step === "combat" ? "combat" : "adventure");
            }}
            onClaimWeeklyChest={() => setHomeState((current) => current.weeklyLoop.steps.length < 4 || current.weeklyLoop.chestClaimed ? current : ({ ...current, lastOutcome: "Tesoro settimanale aperto: +45 Monete Nexus e +2 Frammenti di Reliquia.", wallet: { ...current.wallet, nexusCoins: current.wallet.nexusCoins + 45, totalEarned: current.wallet.totalEarned + 45, relicFragments: current.wallet.relicFragments + 2 }, weeklyLoop: { ...current.weeklyLoop, chestClaimed: true } }))}
            onReturnHome={() => setHomePanel("care")}
          />
        ) : null}

        {state.stage === "home" && homeFamiliar && homePanel === "market" ? (
          <section className={`${styles.marketScreen} ${marketWing === "atelier" ? styles.atelierScreen : ""}`} aria-label="Mercato del Nexus">
            <header className={styles.marketHeader}>
              <div>
                <small>Passaggio dei custodi</small>
                <h2>{marketWing === "court" ? "La corte dei mercanti" : marketWing === "atelier" ? "Atelier dello Specchio" : "Il Mercato notturno"}</h2>
                <p>{marketWing === "court" ? "Ogni custode ha la propria bottega e un catalogo che cresce con il legame." : marketWing === "atelier" ? "Medusa presenta cover e Famigli esatti, visibili e mai casuali." : "Scambi rari e reliquie si ottengono attraverso missioni ed eventi."}</p>
              </div>
              <div className={styles.marketWallet}><small>{marketWing === "court" ? "Portamonete" : marketWing === "atelier" ? "Prezzi reali" : "Valute notturne"}</small><strong>{marketWing === "court" ? homeState.wallet.nexusCoins : marketWing === "atelier" ? "€" : `${homeState.wallet.nightSigils} / ${homeState.wallet.relicFragments}`}</strong><span>{marketWing === "court" ? "Monete Nexus" : marketWing === "atelier" ? "Acquisto singolo" : "Sigilli / Frammenti"}</span></div>
              <div className={styles.marketHeaderActions}>
                {marketWing === "court" ? <><button type="button" onClick={() => { setMarketInfoItem(null); setAtelierCoverPreview(false); setMarketWing("atelier"); }}>Atelier Medusa</button><button type="button" disabled={!nightMarketOpen} title={nightMarketOpen ? "Aperto fino alle 06:00" : "Apre alle 21:00"} onClick={() => { setMarketInfoItem(null); setMarketWing("night"); }}>{nightMarketOpen ? "Mercato notturno" : "Notturno · apre alle 21"}</button></> : <button type="button" onClick={() => { setMarketInfoItem(null); setAtelierCoverPreview(false); setMarketWing("court"); }}>Torna alla corte</button>}
                <button type="button" onClick={() => { setMarketInfoItem(null); setHomePanel("care"); }}>Torna alla Casa</button>
              </div>
            </header>
            {marketWing === "court" ? <div className={styles.marketBody}>
              <div className={styles.marketScene} aria-label="Piazza coperta del Mercato del Nexus">
                {(() => {
                  const vendor = MARKET_VENDORS.find((candidate) => candidate.id === selectedMarketVendor)!;
                  return <div className={styles.marketSceneCanvas} style={{ backgroundImage: `url(${vendor.roomSrc})` }}>
                    <nav className={styles.marketSceneTabs} aria-label="Scegli il mercante">
                      {MARKET_VENDORS.map((choice) => <button key={choice.id} type="button" aria-pressed={choice.id === vendor.id} onClick={() => { setSelectedMarketVendor(choice.id); setMarketInfoItem(null); setPreviewDeviceCoverId(null); setMarketOfferPage(0); setCoverCatalogPage(0); setMarketMessage(`${choice.name} ti mostra la sua bottega.`); }}>{choice.name}</button>)}
                    </nav>
                    <span className={styles.marketSoloVendor} data-reacting={merchantReaction?.merchantId === vendor.id}>
                      {merchantReaction?.merchantId === vendor.id ? <span className={styles.merchantReactionBubble} role="status">{merchantReaction.message}</span> : null}
                      <span className={styles.marketVendorSprite} style={{ backgroundImage: `url(${vendor.spriteSrc})`, backgroundPosition: `${merchantFrame(vendor.id, marketIdleTick, merchantReaction) * (100 / 3)}% 0%` }} aria-hidden="true" />
                      <span className={styles.marketVendorPlaque}><strong>{vendor.name}</strong><small>{vendor.stallLabel}</small></span>
                    </span>
                  </div>;
                })()}
              </div>
              <aside className={styles.marketVendorPanel} aria-live="polite">
                {(() => {
                  const vendor = MARKET_VENDORS.find((candidate) => candidate.id === selectedMarketVendor)!;
                  const allOffers = vendor.id === "daily" || vendor.id === "arcane"
                    ? availableFamiliarMarketOffers(vendor.id, activeGrowth.stage)
                    : [];
                  const offerPageCount = Math.max(1, Math.ceil(allOffers.length / 3));
                  const activeOfferPage = Math.min(marketOfferPage, offerPageCount - 1);
                  const offers = allOffers.slice(activeOfferPage * 3, activeOfferPage * 3 + 3);
                  return <>
                    <header><small>Bancarella selezionata</small><h3>{vendor.name}</h3><p>{vendor.role}</p><span>{vendor.greeting} Catalogo {GROWTH_STAGES[activeGrowth.stage].label}.</span></header>
                    {vendor.id === "cosmetics" ? (() => {
                      const covers = availableFamiliarDeviceCovers(activeGrowth.stage);
                      const coversPerPage = compactFamiliarCatalog ? 2 : 4;
                      const pageCount = Math.max(1, Math.ceil(covers.length / coversPerPage));
                      const currentPage = Math.min(coverCatalogPage, pageCount - 1);
                      const visibleCovers = covers.slice(currentPage * coversPerPage, currentPage * coversPerPage + coversPerPage);
                      return <div className={styles.coverOfferGrid} data-cover-count={visibleCovers.length}>
                        {visibleCovers.map((cover) => {
                          const owned = homeState.deviceCover.ownedIds.includes(cover.id);
                          const active = homeState.deviceCover.activeId === cover.id;
                          const previewing = previewDeviceCoverId === cover.id;
                          const canBuy = homeState.wallet.nexusCoins >= cover.priceCoins;
                          return <article className={active || previewing ? styles.coverOfferActive : styles.coverOffer} key={cover.id}>
                            <span className={styles.coverSwatch} style={{ backgroundColor: cover.shellA, borderColor: cover.edge }} aria-hidden="true" />
                            <div className={styles.coverOfferCopy}>
                              <span className={styles.marketOfferTitle}>
                                <strong>{cover.name}</strong>
                                <button
                                  className={styles.marketInfoButton}
                                  type="button"
                                  aria-label={`Informazioni su ${cover.name}`}
                                  aria-expanded={marketInfoItem?.id === `cover-${cover.id}`}
                                  onClick={() => setMarketInfoItem((current) => current?.id === `cover-${cover.id}` ? null : {
                                    id: `cover-${cover.id}`,
                                    name: cover.name,
                                    description: "Una cover permanente per personalizzare integralmente il guscio del Nexus Pet.",
                                    usage: "Dopo l'acquisto puoi applicarla, cambiarla e riutilizzarla quando vuoi dalla Bottega dei Colori.",
                                    effect: "Cambia soltanto il colore esterno del dispositivo. Non modifica statistiche, forza o progressione del Famiglio.",
                                    quantity: "1 cover permanente",
                                    price: cover.priceCoins === 0 ? "Inclusa" : `${cover.priceCoins} Monete Nexus`,
                                    swatch: { color: cover.shellA, edge: cover.edge },
                                  })}
                                >i</button>
                              </span>
                              <small>{cover.priceCoins === 0 ? "Cover iniziale" : `${cover.priceCoins} monete`}</small>
                            </div>
                            <div className={styles.coverActions}>
                              {active ? <span className={styles.coverCurrentState}>In uso</span> : <>
                                <button
                                  type="button"
                                  aria-pressed={previewing}
                                  onClick={() => {
                                    const nextPreview = previewing ? null : cover.id;
                                    setPreviewDeviceCoverId(nextPreview);
                                    setMarketMessage(nextPreview ? `Anteprima ${cover.name}: nessuna moneta spesa.` : "Anteprima terminata: cover precedente ripristinata.");
                                  }}
                                >{previewing ? "Annulla" : "Prova"}</button>
                                <button
                                  type="button"
                                  disabled={!owned && !canBuy}
                                  title={!owned && !canBuy ? `Servono ${cover.priceCoins} Monete Nexus` : undefined}
                                  onClick={() => {
                                    const next = owned ? equipFamiliarDeviceCover(homeState, cover.id) : purchaseFamiliarDeviceCover(homeState, cover.id);
                                    setHomeState(next);
                                    setPreviewDeviceCoverId(null);
                                    setMarketMessage(next.lastOutcome);
                                    showMerchantReaction("cosmetics", owned ? "Iris sistema la nuova tonalità." : "Iris avvolge la cover con cura.");
                                  }}
                                >{owned ? "Applica" : "Compra"}</button>
                              </>}
                            </div>
                          </article>;
                        })}
                        {pageCount > 1 ? <nav className={styles.coverPager} aria-label="Pagine delle cover">
                          <button type="button" disabled={currentPage === 0} onClick={() => setCoverCatalogPage((page) => Math.max(0, page - 1))}>‹ Precedenti</button>
                          <span>{currentPage + 1} / {pageCount}</span>
                          <button type="button" disabled={currentPage >= pageCount - 1} onClick={() => setCoverCatalogPage((page) => Math.min(pageCount - 1, page + 1))}>Successive ›</button>
                        </nav> : null}
                      </div>;
                    })() : <div className={styles.marketOfferList} data-offer-count={offers.length}>
                      {offers.map((offer) => {
                        const item = FAMILIAR_ITEM_CATALOG.find((candidate) => candidate.id === offer.itemId)!;
                        const alreadyOwned = !item.consumable && homeState.inventory.quantities[offer.itemId] > 0;
                        const canBuy = !alreadyOwned && homeState.wallet.nexusCoins >= offer.priceCoins;
                        return <article className={styles.marketOfferCard} key={offer.id}>
                          <span className={styles.marketItemArt} style={{ backgroundImage: `url(${offer.artSrc ?? (item.id === "moon-meal" ? familiarMealAsset(activeFamiliarId) : item.assetSrc)})` }} aria-hidden="true" />
                          <div className={styles.marketOfferCopy}>
                            <span className={styles.marketOfferTitle}>
                              <strong>{offer.name}</strong>
                              <button
                                className={styles.marketInfoButton}
                                type="button"
                                aria-label={`Informazioni su ${offer.name}`}
                                aria-expanded={marketInfoItem?.id === `offer-${offer.id}`}
                                onClick={() => setMarketInfoItem((current) => current?.id === `offer-${offer.id}` ? null : {
                                  id: `offer-${offer.id}`,
                                  name: offer.name,
                                  description: offer.description,
                                  usage: `${item.description} Dopo l'acquisto: Casa del Famiglio > Zaino. Selezionalo per avviare “${HOME_ACTIONS.find((action) => action.id === item.action)?.label ?? item.action}”.`,
                                  effect: `${marketItemEffect(item.bonus)}. ${item.consumable ? "Ogni utilizzo consuma una unità." : "L'oggetto resta nello zaino dopo ogni utilizzo."}`,
                                  quantity: item.consumable ? `${offer.quantity} unità` : "1 oggetto permanente",
                                  price: `${offer.priceCoins} Monete Nexus`,
                                  artSrc: offer.artSrc ?? (item.id === "moon-meal" ? familiarMealAsset(activeFamiliarId) : item.assetSrc),
                                })}
                              >i</button>
                            </span>
                            <p>{offer.description}</p><small>Nello zaino: {homeState.inventory.quantities[offer.itemId]}</small>
                          </div>
                          <div className={styles.marketPrice}><strong>{offer.priceCoins} monete</strong></div>
                          <button
                            type="button"
                            disabled={!canBuy}
                            onClick={() => {
                              const next = purchaseFamiliarMarketOffer(homeState, offer.id);
                              setHomeState(next);
                              setMarketMessage(next.lastOutcome);
                              showMerchantReaction(vendor.id, vendor.id === "daily" ? "Nora prepara il pacchetto." : "Mirra sigilla l'oggetto.");
                            }}
                          >{alreadyOwned ? "Già posseduto" : canBuy ? `Compra ×${offer.quantity}` : "Monete insufficienti"}</button>
                        </article>;
                      })}
                    </div>}
                    {vendor.id !== "cosmetics" && offerPageCount > 1 ? <nav className={styles.coverPager} aria-label="Pagine degli articoli"><button type="button" disabled={activeOfferPage === 0} onClick={() => setMarketOfferPage((page) => Math.max(0, page - 1))}>Precedenti</button><span>{activeOfferPage + 1} / {offerPageCount}</span><button type="button" disabled={activeOfferPage >= offerPageCount - 1} onClick={() => setMarketOfferPage((page) => Math.min(offerPageCount - 1, page + 1))}>Successivi</button></nav> : null}
                    {marketInfoItem ? <MarketInfoSheet item={marketInfoItem} onClose={() => setMarketInfoItem(null)} /> : null}
                  </>;
                })()}
              </aside>
            </div> : marketWing === "atelier" ? (
              <div className={`${styles.marketBody} ${styles.atelierMarketBody}`} aria-label="Atelier dello Specchio di Medusa">
                <div className={styles.marketScene} aria-label="Sala dell'Atelier dello Specchio">
                  <div className={styles.atelierSceneCanvas}>
                    <span
                      className={styles.atelierMedusaSprite}
                      data-reacting={merchantReaction?.merchantId === "medusa"}
                      style={{ backgroundImage: "url(/famiglio/rebuild/market/medusa-idle-v1.png)", backgroundPosition: `${merchantFrame("medusa", marketIdleTick, merchantReaction) * (100 / 3)}% 0%` }}
                      aria-hidden="true"
                    />
                    {merchantReaction?.merchantId === "medusa" ? <span className={`${styles.merchantReactionBubble} ${styles.atelierReactionBubble}`} role="status">{merchantReaction.message}</span> : null}
                    <span className={styles.atelierMedusaPlaque}><strong>Medusa</strong><small>Custode dello Specchio</small></span>
                  </div>
                </div>
                <aside className={`${styles.marketVendorPanel} ${styles.atelierVendorPanel}`} data-category={atelierCategory} aria-live="polite">
                  <header><small>Atelier selezionato</small><h3>Medusa</h3><p>Custode delle collezioni premium</p><span>Prezzi in euro, contenuto sempre visibile e nessuna estrazione casuale.</span></header>
                  <div className={styles.atelierOfferList}>
                    <nav className={styles.atelierTabs} aria-label="Categorie dell'Atelier">
                      <button type="button" aria-pressed={atelierCategory === "covers"} onClick={() => { setAtelierCategory("covers"); setAtelierCatalogPage(0); setMarketInfoItem(null); }}>Cover</button>
                      <button type="button" aria-pressed={atelierCategory === "familiars"} onClick={() => { setAtelierCategory("familiars"); setAtelierCatalogPage(0); setAtelierCoverPreview(false); setMarketInfoItem(null); }}>Famigli</button>
                      <button type="button" aria-pressed={atelierCategory === "bundle"} onClick={() => { setAtelierCategory("bundle"); setAtelierCatalogPage(0); setAtelierCoverPreview(false); setMarketInfoItem(null); }}>Bundle</button>
                      <button type="button" aria-pressed={atelierCategory === "slots"} onClick={() => { setAtelierCategory("slots"); setAtelierCatalogPage(0); setAtelierCoverPreview(false); setMarketInfoItem(null); }}>Case</button>
                    </nav>
                    {atelierCategory === "covers" ? <div className={styles.premiumCoverCatalog}>{premiumCovers.slice(atelierCatalogPage * 2, atelierCatalogPage * 2 + 2).map((cover) => {
                      const previewing = selectedPremiumCover?.id === cover.id && atelierCoverPreview;
                      return <article className={previewing ? styles.premiumCoverCardActive : styles.premiumCoverCard} key={cover.id}>
                        <span className={styles.premiumCoverArt} style={{ backgroundImage: `url(${cover.artDesktop})` }} aria-hidden="true" />
                        <div className={styles.premiumCoverCopy}>
                          <span className={styles.marketOfferTitle}>
                            <strong>{cover.name}</strong>
                            <button className={styles.marketInfoButton} type="button" aria-label={`Informazioni su ${cover.name}`} aria-expanded={marketInfoItem?.id === `atelier-${cover.id}`} onClick={() => setMarketInfoItem((current) => current?.id === `atelier-${cover.id}` ? null : { id: `atelier-${cover.id}`, name: cover.name, description: cover.description, usage: "Puoi provarla sul dispositivo prima dell'acquisto. Dopo l'acquisto resta collegata al tuo LoreWise ID e può essere riapplicata.", effect: "Cambia soltanto l'aspetto del guscio. Non aumenta statistiche, forza o progressione del Famiglio.", quantity: "1 cover premium permanente", price: `${PREMIUM_COVER_PRICE_EUR.toFixed(2).replace(".", ",")} €`, artSrc: cover.artDesktop })}>i</button>
                          </span>
                          <p>{cover.description}</p>
                          <small>Acquisto singolo · permanente</small>
                          <b>{PREMIUM_COVER_PRICE_EUR.toFixed(2).replace(".", ",")} €</b>
                        </div>
                        <div className={styles.premiumCoverActions}>
                          <button type="button" aria-pressed={previewing} onClick={() => { setSelectedPremiumCoverId(cover.id); setAtelierCoverPreview(!previewing); setMarketMessage(previewing ? "Anteprima premium terminata." : `Anteprima ${cover.name}: nessun addebito.`); showMerchantReaction("medusa", previewing ? "Lo Specchio torna limpido." : "Medusa accende l'anteprima nello Specchio."); }}>{previewing ? "Annulla prova" : "Prova cover"}</button>
                          {(() => {
                            const offerId = `cover-${cover.id}`;
                            const owned = purchasedOfferIds.includes(offerId);
                            return <button type="button" disabled={checkoutOfferId !== null} onClick={() => owned ? equipPurchasedPremiumCover(cover.id) : void startFamiliarCheckout(offerId)}>{checkoutOfferId === offerId ? "Apertura…" : owned ? "Applica" : `Acquista ${PREMIUM_COVER_PRICE_EUR.toFixed(2).replace(".", ",")} €`}</button>;
                          })()}
                        </div>
                      </article>;
                    })}{premiumCovers.length > 2 ? <CatalogPager page={atelierCatalogPage} pages={Math.ceil(premiumCovers.length / 2)} onPage={setAtelierCatalogPage} label="Pagine delle cover premium" /> : null}</div> : null}
                    {atelierCategory === "familiars" ? <div className={styles.premiumFamiliarCatalog}>
                      <div className={styles.familiarPriceGuide} aria-label="Prezzi dei Famigli per rarità">
                        {Object.entries(FAMILIAR_PRICE_EUR_BY_RARITY).map(([rarity, price]) => <span data-rarity={rarity} key={rarity}><small>{rarity === "leggendario" ? <>leggen<wbr />dario</> : rarity}</small><strong>{price.toFixed(2).replace(".", ",")} €</strong></span>)}
                      </div>
                      <div className={styles.premiumFamiliarGrid}>{MEDUSA_FAMILIAR_CATALOG.slice(atelierCatalogPage * (compactFamiliarCatalog ? 2 : 4), atelierCatalogPage * (compactFamiliarCatalog ? 2 : 4) + (compactFamiliarCatalog ? 2 : 4)).map((entry) => {
                        const combat = combatShopCardFor(entry.id);
                        const offerId = `catalog-${entry.id}`;
                        const owned = purchasedAppearanceIds.includes(entry.id);
                        return <article className={styles.premiumFamiliarCard} data-rarity={entry.rarity} key={entry.id}>
                          <span style={{ backgroundImage: `url(${familiarAnimatedPreview(entry)})` }} role="img" aria-label={`Anteprima completa di ${entry.name}`} />
                          <div>
                            <strong>{entry.name}</strong>
                            <span className={styles.familiarCombatTags}>{combat ? <><em>{combat.rarity}</em><em>{combat.affinity}</em><em>{combat.role}</em></> : null}</span>
                            <small>{combat ? `HP ${combat.initialHp} · ATT ${combat.initialAttack} · DIF ${combat.initialDefense} · VEL ${combat.initialSpeed}` : entry.unlock}</small>
                            <b>{combat?.purchasable ? `${entry.priceEuro.toFixed(2).replace(".", ",")} €` : "Ricompensa leggendaria"}</b>
                          </div>
                          <button className={styles.marketInfoButton} type="button" aria-label={`Informazioni su ${entry.name}`} onClick={() => setMarketInfoItem(familiarMarketInfo(entry))}>i</button>
                          <button type="button" disabled={Boolean(!combat?.purchasable || checkoutOfferId)} onClick={() => { if (owned || allTestMode) { showMerchantReaction("medusa", "Medusa apre il passaggio verso la nuova Casa."); setTestCollectionFamiliarId(entry.id); setMarketInfoItem(null); setHomePanel("care"); setInventoryOpen(false); } else void startFamiliarCheckout(offerId); }}>{!combat?.purchasable ? "Ricompensa di gioco" : checkoutOfferId === offerId ? "Apertura…" : allTestMode ? "Prova nella Casa" : owned ? "Porta nella Casa" : `Acquista ${entry.priceEuro.toFixed(2).replace(".", ",")} €`}</button>
                        </article>;
                      })}</div>
                      <CatalogPager page={atelierCatalogPage} pages={Math.ceil(MEDUSA_FAMILIAR_CATALOG.length / (compactFamiliarCatalog ? 2 : 4))} onPage={setAtelierCatalogPage} label="Pagine dei Famigli premium" />
                    </div> : null}
                    {atelierCategory === "bundle" ? <div className={styles.bundleCatalog}>{FAMILIAR_BUNDLES.slice(atelierCatalogPage, atelierCatalogPage + 1).map((bundle) => {
                      const offerId = `bundle-${bundle.id}`;
                      const purchasable = bundle.id !== "legendary";
                      const owned = purchasable && purchasedOfferIds.includes(offerId);
                      return <article className={styles.bundleCategoryCard} key={bundle.id}>
                      <div className={styles.bundleFamiliarPreview} aria-hidden="true">
                        {bundle.familiars.slice(0, 3).map((entry) => <span key={entry.id} style={{ backgroundImage: `url(${familiarAnimatedPreview(entry)})` }} />)}
                      </div>
                      <div className={styles.bundleShowcaseCopy}>
                        <small>Collezione da {bundle.familiars.length} specie</small>
                        <strong>{bundle.name}</strong>
                        <p>{bundle.description}</p>
                        <b>{bundle.priceEuro.toFixed(2).replace(".", ",")} €</b>
                      </div>
                      <button className={styles.marketInfoButton} type="button" aria-label={`Informazioni sul bundle ${bundle.name}`} onClick={() => setMarketInfoItem(bundleMarketInfo(bundle))}>i</button>
                      <button className={styles.bundlePurchaseButton} type="button" disabled={!purchasable || owned || checkoutOfferId !== null} onClick={() => void startFamiliarCheckout(offerId)}>{!purchasable ? "Ricompensa di gioco" : owned ? "Già posseduto" : checkoutOfferId === offerId ? "Apertura…" : `Acquista ${bundle.priceEuro.toFixed(2).replace(".", ",")} €`}</button>
                    </article>})}{FAMILIAR_BUNDLES.length > 1 ? <CatalogPager page={atelierCatalogPage} pages={FAMILIAR_BUNDLES.length} onPage={setAtelierCatalogPage} label="Pagine delle collezioni" /> : null}</div> : null}
                    {atelierCategory === "slots" ? <div className={styles.bundleCatalog}>
                      {FAMILIAR_SHOP_OFFERS.filter((offer) => offer.kind === "slot").map((offer, index) => <article className={styles.bundleCategoryCard} key={offer.id}>
                        <div className={styles.bundleShowcaseCopy}><small>Casa {index + 2} di 3 · separata</small><strong>{offer.name}</strong><p>{offer.description} Ogni Famiglio conserva stanza, crescita e progressi propri.</p><b>0,99 €</b></div>
                        <button className={styles.bundlePurchaseButton} type="button" disabled={purchasedOfferIds.includes(offer.id) || checkoutOfferId !== null} onClick={() => void startFamiliarCheckout(offer.id)}>{purchasedOfferIds.includes(offer.id) ? "Già acquistata" : checkoutOfferId === offer.id ? "Apertura…" : "Acquista 0,99 €"}</button>
                      </article>)}
                    </div> : null}
                  </div>
                  {marketInfoItem ? <MarketInfoSheet item={marketInfoItem} onClose={() => setMarketInfoItem(null)} /> : null}
                </aside>
              </div>
            ) : !nightMarketOpen ? (
              <div className={styles.nightMarketClosed} role="status">
                <span aria-hidden="true">☾</span>
                <div><small>Orario del Nexus</small><h3>Il Mercato notturno è chiuso</h3><p>Ronin e Lich aprono le loro botteghe ogni sera alle 21:00 e chiudono alle 06:00.</p></div>
                <button type="button" onClick={() => setMarketWing("court")}>Torna alla corte</button>
              </div>
            ) : (
              <div className={styles.marketBody} aria-label="Mercanti del Mercato notturno">
                <div className={styles.marketScene} aria-label="Sala del Mercato notturno">
                  {(() => {
                    const merchant = NIGHT_MARKET_MERCHANTS.find((candidate) => candidate.id === selectedNightMerchant)!;
                    return <div className={styles.nightMarketSceneCanvas} style={{ backgroundImage: `url(${merchant.roomSrc})` }}>
                      <nav className={styles.marketSceneTabs} aria-label="Scegli il mercante notturno">{NIGHT_MARKET_MERCHANTS.map((choice) => <button type="button" key={choice.id} aria-pressed={choice.id === merchant.id} onClick={() => { setSelectedNightMerchant(choice.id); setMarketInfoItem(null); }}>{choice.name}</button>)}</nav>
                      <span className={styles.marketSoloVendor} data-reacting={merchantReaction?.merchantId === merchant.id}>{merchantReaction?.merchantId === merchant.id ? <span className={styles.merchantReactionBubble} role="status">{merchantReaction.message}</span> : null}<span className={styles.nightMerchantSprite} style={{ backgroundImage: `url(${merchant.spriteSrc})`, backgroundPosition: `${merchantFrame(merchant.id, marketIdleTick, merchantReaction) * (100 / 3)}% 0%` }} aria-hidden="true" /><span className={styles.marketVendorPlaque}><strong>{merchant.name}</strong><small>{merchant.subtitle}</small></span></span>
                    </div>;
                  })()}
                </div>
                {(() => {
                  const merchant = NIGHT_MARKET_MERCHANTS.find((candidate) => candidate.id === selectedNightMerchant)!;
                  return <aside className={styles.marketVendorPanel} aria-live="polite">
                    <header><small>Mercante selezionato</small><h3>{merchant.name}</h3><p>{merchant.subtitle}</p><span>{merchant.description}</span></header>
                    <div className={styles.nightMerchantDetail}>
                      <div className={styles.nightOfferGrid}>{NIGHT_MARKET_OFFERS.filter((offer) => offer.merchant === merchant.id).map((offer) => {
                        const unlocked = activeGrowth.stage === "adulto" || offer.unlockStage !== "adulto" && activeGrowth.stage === "giovane";
                        const owned = homeState.wallet.nightRewards.includes(offer.id);
                        const equipped = homeState.wallet.equippedNightRelicId === offer.id;
                        const balance = offer.currency === "sigils" ? homeState.wallet.nightSigils : homeState.wallet.relicFragments;
                        return <article className={styles.nightOfferCard} data-equipped={equipped} key={offer.id}><span style={{ backgroundImage: `url(${offer.artSrc})` }} aria-hidden="true" /><div><span className={styles.marketOfferTitle}><strong>{offer.name}</strong><button className={styles.marketInfoButton} type="button" aria-label={`Informazioni su ${offer.name}`} onClick={() => setMarketInfoItem({ id: `night-${offer.id}`, name: offer.name, description: offer.description, usage: `${offer.usage} Dove trovarlo: ${offer.destination}.`, effect: offer.effect, quantity: "1 reliquia permanente · se ne equipaggia una alla volta", price: `${offer.price} ${offer.currency === "sigils" ? "Sigilli Notturni" : "Frammenti di Reliquia"}`, artSrc: offer.artSrc })}>i</button></span><small>{offer.usage}</small><b>{equipped ? "Reliquia attiva" : owned ? "Nella collezione" : `${offer.price} ${offer.currency === "sigils" ? "sigilli" : "frammenti"}`}</b></div><button type="button" disabled={!owned && (!unlocked || balance < offer.price)} onClick={() => { const next = owned ? equipNightMarketRelic(homeState, offer.id) : exchangeNightMarketOffer(homeState, offer.id); setHomeState(next); setMarketMessage(next.lastOutcome); showMerchantReaction(merchant.id, merchant.id === "ronin" ? "Ronin affida la reliquia al suo nuovo custode." : "Il Lich ricompone la memoria della reliquia."); }}>{equipped ? "In uso" : owned ? "Equipaggia" : !unlocked ? `Richiede ${GROWTH_STAGES[offer.unlockStage].label}` : balance < offer.price ? "Valuta insufficiente" : "Scambia"}</button></article>;
                      })}</div>
                      <div className={styles.nightMerchantReward}>
                        <span style={{ backgroundImage: `url(${merchant.itemSrc})` }} aria-hidden="true" />
                        <div>
                          <small>Ricompensa mostrata</small>
                          <span className={styles.marketOfferTitle}>
                            <strong>{merchant.sampleName}</strong>
                            <button
                              className={styles.marketInfoButton}
                              type="button"
                              aria-label={`Informazioni su ${merchant.sampleName}`}
                              aria-expanded={marketInfoItem?.id === `night-${merchant.id}`}
                              onClick={() => setMarketInfoItem((current) => current?.id === `night-${merchant.id}` ? null : merchant.id === "ronin" ? {
                                id: `night-${merchant.id}`,
                                name: merchant.sampleName,
                                description: "Una ricompensa cosmetica permanente proposta dal Ronin itinerante.",
                                usage: "Si ottiene scegliendola nello scambio notturno e si equipaggia come aspetto cosmetico.",
                                effect: "Personalizza l'aspetto senza aumentare statistiche, forza o progressione.",
                                quantity: "1 ricompensa permanente",
                                price: "12 Sigilli Notturni",
                                artSrc: merchant.itemSrc,
                              } : {
                                id: `night-${merchant.id}`,
                                name: merchant.sampleName,
                                description: "Una reliquia evento permanente ricostruita dal Lich collezionista.",
                                usage: "Raccogli tutti i sei frammenti della stessa reliquia durante missioni ed eventi dedicati.",
                                effect: "Completati i frammenti, la Corona delle memorie viene ottenuta con certezza: nessuna estrazione casuale.",
                                quantity: "1 reliquia permanente",
                                price: "6 frammenti evento · 0 / 6",
                                artSrc: merchant.itemSrc,
                              })}
                            >i</button>
                          </span>
                          <p>{merchant.sampleMeta}</p>
                        </div>
                        <b>{merchant.sampleProgress}</b>
                      </div>
                      <small>{merchant.unlock}</small>
                      <button type="button" disabled>{merchant.actionLabel}</button>
                    </div>
                    {marketInfoItem ? <MarketInfoSheet item={marketInfoItem} onClose={() => setMarketInfoItem(null)} /> : null}
                  </aside>;
                })()}
              </div>
            )}
            <footer className={styles.marketNotice} role="status" aria-live="polite">
              <span>{marketWing === "night" ? (nightMarketOpen ? "Mercato aperto dalle 21:00 alle 06:00." : "Mercato chiuso · riapre alle 21:00.") : marketMessage}</span>
              <span className={styles.marketFutureSummary}>Prossime aperture: {FUTURE_MARKET_WINGS.map((wing) => `${wing.name} · ${wing.keeper}`).join(" / ")}</span>
            </footer>
          </section>
        ) : null}

        {state.stage === "home" && homeFamiliar && homePanel === "missions" ? (
          <section className={styles.missionScreen} aria-label="Missioni giornaliere del Famiglio">
            <header className={styles.missionHeader}>
              <div>
                <small>Risonanze quotidiane · {missionDate || romeDateKey()}</small>
                <h2>Missioni del Nexus</h2>
                <p>Esplora LoreWise, partecipa alla comunità e prenditi cura del tuo Famiglio.</p>
              </div>
              <div className={styles.missionHeaderActions}>
                <button type="button" onClick={() => void refreshDailyMissions()} disabled={missionMode === "loading" || missionRefreshUsed} title={missionRefreshUsed ? "Hai già aggiornato le missioni di oggi" : "Sostituisci una volta le missioni di oggi"}>{missionRefreshUsed ? "Aggiornate oggi" : "Aggiorna missioni"}</button>
                <button type="button" onClick={() => setHomePanel("care")}>Torna alla Casa</button>
              </div>
            </header>
            {missionMode === "loading" && missions.length === 0 ? (
              <div className={styles.missionLoading} role="status">Il Nexus sta scegliendo le missioni di oggi…</div>
            ) : (
              <>
                <nav className={styles.missionTabs} aria-label="Scegli la missione giornaliera">
                  {missions.map((mission, index) => (
                    <button type="button" key={mission.id} aria-pressed={selectedMissionIndex === index} onClick={() => setSelectedMissionIndex(index)}>
                      <span>{index + 1}</span>{MISSION_DIFFICULTY_LABEL[mission.difficulty]}
                    </button>
                  ))}
                </nav>
                <div className={styles.missionGrid}>
                {missions.map((mission, index) => {
                  const group = MISSION_GROUP_COPY[mission.group];
                  const percent = Math.min(100, Math.round((mission.progress / mission.target) * 100));
                  return (
                    <article className={`${styles.missionCard} ${mission.complete ? styles.missionCardComplete : ""}`} data-group={mission.group} data-selected={selectedMissionIndex === index} key={mission.id}>
                      <header><span aria-hidden="true">{group.icon}</span><small>{group.label} · {MISSION_DIFFICULTY_LABEL[mission.difficulty]}</small></header>
                      <h3>{mission.title}</h3>
                      <p>{mission.description}</p>
                      <div className={styles.missionProgress}>
                        <span><b>{mission.progress}</b> / {mission.target}</span>
                        <span className={styles.missionTrack} aria-label={`${mission.title}: ${percent}%`}><i style={{ width: `${percent}%` }} /></span>
                      </div>
                      <footer>
                        <small>Ricompensa</small>
                        <strong>{mission.reward.quantity}× {MISSION_REWARD_NAMES[mission.reward.item] || mission.reward.item}</strong>
                        {mission.claimed ? (
                          <button type="button" disabled>Riscossa</button>
                        ) : mission.complete && missionMode === "live" ? (
                          <button type="button" onClick={() => void claimMission(mission)} disabled={claimingMissionId === mission.id}>
                            {claimingMissionId === mission.id ? "Attendi…" : "Riscuoti"}
                          </button>
                        ) : (
                          <Link href={mission.href}>Vai alla missione</Link>
                        )}
                      </footer>
                    </article>
                  );
                })}
                </div>
              </>
            )}
            <footer className={styles.missionNotice}>
              <span role="status" aria-live="polite">{missionMessage || (missionMode === "loading" ? "Missioni già disponibili · sincronizzazione dei progressi in corso…" : missionMode === "preview" ? "Anteprima locale: accedi al LoreWise ID per salvare progressi e ricompense." : missionMode === "error" ? "Il servizio non risponde: puoi vedere le missioni, ma i progressi non vengono simulati." : "I progressi vengono registrati soltanto dopo un'azione realmente completata.")}</span>
              {missionMode === "preview" ? <Link href="/account">Accedi al LoreWise ID</Link> : null}
            </footer>
          </section>
        ) : null}

        {state.stage === "home" && homeFamiliar && homePanel === "diary" ? (
          <section className={styles.diaryScreen} aria-label={`Diario di ${familiarDisplayName}`}>
            <header className={styles.diaryHeader}>
              <div>
                <small>Memorie del legame</small>
                <h2>Diario di {familiarDisplayName}</h2>
                <p>Qui restano soltanto desideri, traguardi e giornate davvero importanti.</p>
              </div>
              <button type="button" onClick={() => setHomePanel("care")}>Torna alla Casa</button>
            </header>
            <div className={styles.diarySummary}>
               <div><small>Monete Nexus</small><strong>{homeState.wallet.nexusCoins}</strong></div>
               <div><small>Giorni di cura</small><strong>{homeState.growth.careStreak}</strong></div>
               <div><small>Crescita</small><strong>{growthMeta.label}</strong></div>
               <div><small>Indole emersa</small><strong>{dominantBondTrait.icon} {dominantBondTrait.label}</strong></div>
            </div>
            <div className={styles.diaryEntries}>
              {visibleDiaryEntries.map((entry) => (
                <article key={entry.id}>
                  <time dateTime={new Date(entry.at).toISOString()}>{diaryDate(entry.at)}</time>
                  <div><strong>{entry.title}</strong><p>{entry.detail}</p></div>
                </article>
              ))}
            </div>
            <nav className={styles.diaryPagination} aria-label="Pagine del diario">
              <button type="button" disabled={diaryPage === 0} onClick={() => setDiaryPage((page) => Math.max(0, page - 1))}>←</button>
              <span>{diaryPage + 1} / {diaryPageCount}</span>
              <button type="button" disabled={diaryPage + 1 >= diaryPageCount} onClick={() => setDiaryPage((page) => Math.min(diaryPageCount - 1, page + 1))}>→</button>
            </nav>
          </section>
        ) : null}
      </section>
        <footer className={styles.deviceControls} aria-label="Comandi del Nexus Pet">
          <span className={styles.speaker} aria-hidden="true">••••</span>
          <button
            className={styles.controlButton}
            type="button"
            onClick={() => moveDeviceSelection(-1)}
            disabled={familiarAway || (state.stage !== "choosing" && !((state.stage === "hatched" || state.stage === "home") && (allTestMode || unlockedFamiliars.length > 1)))}
            aria-label={state.stage === "hatched" || state.stage === "home" ? "Famiglio precedente" : "Uovo precedente"}
          >‹</button>
          <button
            className={`${styles.controlButton} ${styles.controlButtonMain}`}
            type="button"
            onClick={activateDeviceSelection}
            disabled={state.stage === "hatching" || state.stage === "hatched" || state.stage === "home"}
            aria-label={state.stage === "confirming" ? "Inizia il rituale" : "Apri l'uovo selezionato"}
          >◇</button>
          <button
            className={styles.controlButton}
            type="button"
            onClick={() => moveDeviceSelection(1)}
            disabled={familiarAway || (state.stage !== "choosing" && !((state.stage === "hatched" || state.stage === "home") && (allTestMode || unlockedFamiliars.length > 1)))}
            aria-label={state.stage === "hatched" || state.stage === "home" ? "Famiglio successivo" : "Uovo successivo"}
          >›</button>
          <span className={styles.deviceModel}>NX-01</span>
        </footer>
      </section>
      {houseManagerOpen && typeof document !== "undefined" ? createPortal(
        <div className={styles.houseManagerBackdrop} role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) { setHouseManagerOpen(false); setRestartStep(0); } }}>
          <section className={styles.houseManagerSheet} role="dialog" aria-modal="true" aria-labelledby="house-manager-title">
            <header>
              <div><small>Gestione Famigli</small><h2 id="house-manager-title">Le tue Case</h2></div>
              <button type="button" onClick={() => { setHouseManagerOpen(false); setRestartStep(0); }} aria-label="Chiudi gestione Case">Chiudi</button>
            </header>
            {restartStep === 0 ? <>
              <p>Ogni Casa conserva separatamente Famiglio, stanza, crescita, mosse, spedizioni e progressi.</p>
              <div className={styles.houseSlotGrid}>
                {[0, 1, 2].map((index) => {
                  const snapshot = index === activeHouseIndex ? currentHouseSnapshot() : savedHouseSnapshots[index];
                  const familiarId = snapshot?.activeFamiliarId ?? snapshot?.rebuild.selectedId ?? null;
                  const familiar = familiarId ? FAMILIAR_COLLECTION.find((entry) => entry.id === familiarId) : null;
                  const purchasedHouse = index === 1
                    ? purchasedOfferIds.includes("slot-famiglio-2")
                    : index === 2 && purchasedOfferIds.includes("slot-famiglio-3");
                  const available = index === 0 || localHouseTrial || purchasedHouse || Boolean(snapshot);
                  return <article className={styles.houseSlotCard} data-active={index === activeHouseIndex} key={index}>
                    <small>Casa {index + 1}{index === activeHouseIndex ? " · attiva" : ""}</small>
                    <strong>{familiar?.name ?? (available ? "Casa libera" : "Casa da acquistare")}</strong>
                    <span>{familiar ? `${GROWTH_STAGES[snapshot!.home.growth.stage].label} · ${snapshot!.home.growth.bondXp} XP` : available ? "Pronta per un nuovo legame" : "Sblocca uno spazio separato"}</span>
                    <button type="button" disabled={index === activeHouseIndex} onClick={() => switchHouse(index)}>{index === activeHouseIndex ? "Selezionata" : available ? "Entra nella Casa" : "Acquista Casa"}</button>
                  </article>;
                })}
              </div>
              {localHouseTrial ? <p className={styles.localTrialNote}>Prova locale: tutte e tre le Case sono disponibili per verificare creazione e passaggio tra Famigli.</p> : null}
              <div className={styles.houseManagerActions}><button type="button" onClick={openHousePurchase}>Acquista un&apos;altra Casa</button><button className={styles.restartFamiliarButton} type="button" onClick={() => setRestartStep(1)}>Ricomincia con questa Casa</button></div>
            </> : restartStep === 1 ? <div className={styles.restartWarning}>
              <small>Prima conferma</small>
              <h3>Vuoi davvero ricominciare?</h3>
              <p>Livelli, XP, crescita, mosse, missioni, spedizioni, oggetti e ricordi della Casa {activeHouseIndex + 1} verranno eliminati in modo permanente.</p>
              <p>Puoi conservare questo Famiglio acquistando un&apos;altra Casa e crescendone fino a tre separatamente.</p>
              <div><button type="button" onClick={openHousePurchase}>Acquista Casa · 0,99 €</button><button type="button" onClick={() => setRestartStep(2)}>Continua</button><button type="button" onClick={() => setRestartStep(0)}>Annulla</button></div>
            </div> : <div className={styles.restartWarning}>
              <small>Conferma finale</small>
              <h3>Eliminazione permanente</h3>
              <p>Questa operazione non può essere annullata. Le altre Case e gli acquisti associati al LoreWise ID non verranno eliminati.</p>
              <div><button className={styles.restartFamiliarButton} type="button" onClick={restartActiveFamiliar}>Elimina progressi e ricomincia</button><button type="button" onClick={() => setRestartStep(0)}>Non eliminare</button></div>
            </div>}
          </section>
        </div>, document.body,
      ) : null}
      {levelUpNotice && typeof document !== "undefined" ? createPortal(
        <div className={styles.levelUpBackdrop} role="presentation">
          <section className={styles.levelUpSheet} role="dialog" aria-modal="true" aria-labelledby="level-up-title">
            <span className={styles.levelUpEmblem} aria-hidden="true">✦</span>
            <small>Livello {levelUpNotice.track}</small>
            <h3 id="level-up-title">Livello {levelUpNotice.level}</h3>
            <strong>{levelUpNotice.title}</strong>
            <ul>{levelUpNotice.benefits.map((benefit) => <li key={benefit}>{benefit}</li>)}</ul>
            <button type="button" onClick={() => setLevelUpNotice(null)}>Continua il cammino</button>
          </section>
        </div>, document.body,
      ) : null}
      {miniGameOpen && typeof document !== "undefined" ? createPortal(
        <FamiglioDailyMiniGame
          kind={homeState.weeklyLoop.miniGame.kind}
          bestScore={homeState.weeklyLoop.miniGame.bestScore}
          scores={homeState.weeklyLoop.miniGame.scores}
          rewarded={homeState.weeklyLoop.miniGame.rewarded}
          familiarName={homeDisplayName}
          familiarSprite={familiarAnimatedPreview(miniGameFamiliar)}
          familiarVisual={homeFamiliar && activeFamiliarId === homeFamiliar.id ? <FamiliarPreview egg={homeFamiliar} colorVariant={state.colorVariant} /> : undefined}
          onClose={() => setMiniGameOpen(false)}
          onComplete={completeDailyMiniGame}
        />, document.body,
      ) : null}
      {attendanceOpen && state.stage === "home" && typeof document !== "undefined" ? createPortal(
        <div className={styles.attendanceBackdrop} role="presentation">
          <section className={styles.attendanceSheet} role="dialog" aria-modal="true" aria-labelledby="attendance-title" style={{ "--attendance-accent": attendanceSeason.accent, "--attendance-cover": `url(${attendanceSeason.cover})` } as CSSProperties}>
            <header>
              <div><small>{attendanceRecovery.active ? "Completa la tua collezione" : `Stagione ${attendanceSeason.name} · settimana ${attendancePosition.week}/52`}</small><h2 id="attendance-title">Registro presenze</h2></div>
              <button type="button" aria-label="Chiudi il Registro presenze" onClick={() => { setAttendanceOpen(false); setAttendanceReveal(null); }}>×</button>
            </header>
            {attendanceReveal ? <div className={styles.attendanceReveal}>
              <span className={attendanceMotion.rewardPop} aria-hidden="true"><img src={attendanceReveal.icon} alt="" /></span>
              <small>{attendanceRecovery.active && !attendanceReveal.collectibleId ? "Presenza registrata" : "Ricompensa riscossa"}</small>
              <strong>{attendanceReveal.label}</strong>
              <p>{attendanceReveal.collectibleId ? "Il nuovo ricordo è stato aggiunto all'Album del Legame." : attendanceRecovery.active ? "Torna domani per continuare: al settimo giorno consecutivo recuperi un ricordo mancante." : "La ricompensa è già disponibile nella tua Casa."}</p>
              <button type="button" onClick={() => { setAttendanceOpen(false); setAttendanceReveal(null); }}>Continua</button>
            </div> : attendanceRecovery.active ? <>
              <div className={`${styles.attendanceReveal} ${styles.attendanceRecoveryIntro}`}>
                {attendanceRecovery.next ? <>
                  <img src={attendanceRecovery.next.icon} alt="" />
                  <strong>{attendanceRecovery.next.name}</strong>
                  <p>Sette presenze consecutive per recuperare questo ricordo. Recuperi i ricordi mancanti in ordine, senza doppioni. Se salti un giorno, la serie riparte.</p>
                </> : <strong>Album completo! Hai raccolto tutti i 52 ricordi.</strong>}
              </div>
              {attendanceRecovery.next ? <>
                <div className={styles.attendanceWeek}>
                  {Array.from({ length: 7 }, (_, index) => <article key={index} data-claimed={index < attendanceRecovery.progress} data-current={index === attendanceRecovery.progress} data-rare={index === 6}>
                    <small>Presenza {index + 1}</small>
                    {index === 6 ? <img src={attendanceRecovery.next!.icon} alt="" /> : null}
                    <strong>{index < attendanceRecovery.progress ? "Registrata" : index === 6 ? "Ricordo" : "Da registrare"}</strong>
                  </article>)}
                </div>
                <footer><span>{attendanceRecovery.progress}/7 presenze consecutive</span><button type="button" disabled={attendanceBusy || attendanceRecovery.claimedToday} onClick={() => void claimAttendance()}>{attendanceBusy ? "Registro…" : attendanceRecovery.claimedToday ? "Presenza registrata" : "Registra la presenza"}</button></footer>
              </> : null}
            </> : <>
              <div className={styles.attendanceWeek}>
                {attendanceWeekRewards.map((reward) => {
                  const dateMs = Date.parse(`${homeState.attendance.launchDate}T00:00:00Z`) + (reward.dayIndex - 1) * 86_400_000;
                  const date = new Date(dateMs).toISOString().slice(0, 10);
                  const claimed = homeState.attendance.claimedDates.includes(date);
                  const current = reward.dayIndex === attendancePosition.dayIndex;
                  return <article key={reward.dayIndex} data-current={current} data-claimed={claimed} data-rare={reward.rare}>
                    <small>Giorno {reward.weekday}</small>
                    <img src={reward.icon} alt="" />
                    <strong>{reward.label}</strong>
                    <span>{claimed ? "Riscosso" : current ? "Oggi" : "Da sbloccare"}</span>
                  </article>;
                })}
              </div>
              <footer>
                <span><b>{homeState.attendance.streak}</b> giorni consecutivi</span>
                <button type="button" disabled={attendanceBusy || homeState.attendance.claimedDates.includes(attendancePosition.date)} onClick={() => void claimAttendance()}>{attendanceBusy ? "Registro…" : homeState.attendance.claimedDates.includes(attendancePosition.date) ? "Già riscosso" : "Riscatta il premio"}</button>
              </footer>
            </>}
          </section>
        </div>, document.body,
      ) : null}
    </main>
  );
}
