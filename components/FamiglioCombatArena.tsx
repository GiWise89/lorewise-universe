"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type Dispatch, type KeyboardEvent as ReactKeyboardEvent, type SetStateAction } from "react";
import {
  claimFamiliarCombatReward,
  closeFamiliarCombatBattle,
  combatDifficultyIsUnlocked,
  equipFamiliarCombatMove,
  familiarCombatDamagePreview,
  familiarCombatMoveEnergyCost,
  familiarCombatMoveHasCooldown,
  familiarCombatMoveIsBase,
  familiarCombatMoveMaxUses,
  FAMILIAR_COMBAT_SWITCH_ENERGY_COST,
  familiarCombatLevelProgress,
  familiarCombatOpponentPreview,
  familiarCombatOpponents,
  familiarCombatProgress,
  performFamiliarCombatTurn,
  retreatFromFamiliarCombat,
  startFamiliarCombatBattle,
  switchFamiliarCombatant,
  type FamiliarCombatDifficulty,
  type FamiliarCombatOutcome,
  type FamiliarCombatState,
  type FamiliarCombatTimelineEvent,
  type FamiliarCombatReward,
  type FamiliarCombatStats,
} from "../lib/famiglioCombat.ts";
import { advanceFamiliarTower, createFamiliarTowerRun, familiarTowerFloor, familiarTowerFloorBackground, type FamiliarTowerRun } from "../lib/famiglioCombatTower.ts";
import {
  FAMILIAR_COMBAT_CATALOG,
  FAMILIAR_COMBAT_CIRCUITS,
  FAMILIAR_COMBAT_DIFFICULTIES,
  combatMoveById,
  combatStatsAtLevel,
  affinityMultiplier,
  familiarCombatEntry,
  type CombatMove,
} from "../lib/famiglioCombatCatalog.ts";
import {
  familiarCombatPresentationCue,
  type FamiliarCombatPresentationCue,
} from "../lib/famiglioCombatPresentation.ts";
import { familiarCombatPhaseDurationScale } from "../lib/famiglioCombatMotion.ts";
import {
  FAMILIAR_COMBAT_CAMPAIGN,
  familiarCampaignIsComplete,
  familiarCampaignIsUnlocked,
  familiarCampaignLevelById,
  familiarCampaignOpponent,
} from "../lib/famiglioCombatCampaign.ts";
import { familiarHouseVisual } from "../lib/famiglioHouseVisuals.ts";
import type { FamiliarGrowthStage } from "../lib/famiglioHome.ts";
import { playFamiliarInterfaceCue } from "../lib/nexusFamiliarAudio.ts";
import { FamiglioBattleCanvas, FamiglioCombatPreviewCanvas, preloadFamiglioCombatImages } from "./FamiglioCombatCanvas.tsx";
import { FamiglioCampaignNpcCanvas, type CampaignNpcPose } from "./FamiglioCampaignNpcCanvas.tsx";
import styles from "./FamiglioCombatArena.module.css";
import battleStyles from "./FamiglioBattleScreen.module.css";

type FamiglioCombatArenaProps = {
  familiarId: string;
  familiarName: string;
  growthStage: FamiliarGrowthStage;
  colorVariant?: string | null;
  state: FamiliarCombatState;
  setState: Dispatch<SetStateAction<FamiliarCombatState>>;
  testMode?: boolean;
  playerStatBonus?: Partial<FamiliarCombatStats>;
  playerEvolutionPath?: "impeto" | "baluardo" | "risonanza" | null;
  familiarOptions: ReadonlyArray<{ id: string; name: string; growthStage: FamiliarGrowthStage; colorVariant?: string | null }>;
  onSelectFamiliar: (familiarId: string) => void;
  onReturnHome: () => void;
  onReward: (reward: FamiliarCombatReward) => void;
  onMissionActivity?: (activity: "familiar_battle" | "familiar_tower_floor", sourceKey: string) => void;
  onBattleVictory?: (battleId: string) => void;
  activityGate?: { allowed: boolean; reason: string | null; warnings: string[] };
};

type VisibleHealth = {
  battleId: string;
  player: number;
  opponent: number;
};

type ArenaSetupTab = "familiar" | "arenas" | "campaign" | "opponents" | "mode" | "moves" | "ready";

const ARENA_BACKGROUNDS: Readonly<Record<string, string>> = {
  "prime-orme": "/famiglio/rebuild/combat/arenas/cortile-prime-orme-v1.webp",
  "bosco-risonanze": "/famiglio/rebuild/combat/arenas/bosco-risonanze-v1.webp",
  "grotte-celesti": "/famiglio/rebuild/combat/arenas/grotte-celesti-v1.webp",
  "rovine-arcane": "/famiglio/rebuild/combat/arenas/rovine-arcane-v1.webp",
  "valle-titani": "/famiglio/rebuild/combat/arenas/valle-titani-v1.webp",
  "soglia-leggendaria": "/famiglio/rebuild/combat/arenas/soglia-leggendaria-v1.webp",
};

const RARITY_LABELS = {
  comune: "Comune",
  raro: "Raro",
  epico: "Epico",
  leggendario: "Leggendario",
} as const;

const DIFFICULTY_COPY: Readonly<Record<FamiliarCombatDifficulty, string>> = {
  normal: "Ritmo leggibile e scelte introduttive.",
  expert: "L'avversario anticipa cure, guardie e colpi finali.",
  nexus: "Strategia adattiva, statistiche e ricompense superiori.",
};

const ROLE_BATTLE_COPY = {
  agile: "Molto rapido: tende ad agire per primo e a concatenare colpi precisi.",
  assaltatore: "Pressione offensiva alta: cerca danni diretti e aperture decisive.",
  guardiano: "Difesa elevata: assorbe i colpi e prepara protezioni resistenti.",
  mistico: "Tecniche arcane: applica alterazioni e attacca anche dalla distanza.",
  sostegno: "Controllo e recupero: usa cure, rigenerazione e vantaggi progressivi.",
  colosso: "Grande resistenza e impatti pesanti, ma iniziativa generalmente bassa.",
} as const;

const STATUS_LABELS: Readonly<Record<string, string>> = {
  burn: "Bruciatura",
  freeze: "Gelo",
  poison: "Veleno",
  paralysis: "Paralisi",
  sleep: "Sonno",
  slow: "Rallentamento",
  weaken: "Indebolimento",
  guard: "Guardia",
  ward: "Protezione",
  regen: "Rigenerazione",
  focus: "Concentrazione",
};

const STATUS_DETAILS: Readonly<Record<string, string>> = {
  burn: "Infligge danni progressivi finché la bruciatura resta attiva.",
  freeze: "Blocca temporaneamente l'azione del Famiglio colpito.",
  poison: "Consuma gli HP a ogni turno per tutta la sua durata.",
  paralysis: "Riduce la rapidità e può impedire di completare l'azione.",
  sleep: "Impedisce di agire finché il Famiglio non si risveglia.",
  slow: "Riduce la velocità e può cambiare l'ordine delle azioni.",
  weaken: "Riduce la forza degli attacchi finché l'effetto rimane attivo.",
  guard: "Attenua il prossimo impatto ricevuto.",
  ward: "Assorbe una parte del prossimo danno subito.",
  regen: "Recupera una parte degli HP a ogni turno.",
  focus: "Aumenta temporaneamente l'efficacia offensiva.",
};

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const LOCALIZED_FAMILIARS = [...FAMILIAR_COMBAT_CATALOG].sort((left, right) => right.id.length - left.id.length);
// Il motore scrive gli id tecnici ("cat", "imp") nei messaggi: vanno sostituiti
// soltanto come parole intere, altrimenti "Beccata" diventava "BecGattoa" e
// "bloccato" diventava "bloGattoo" nella cronaca e nel banner del turno.
const FAMILIAR_ID_PATTERN = new RegExp(
  `(?<![\\p{L}\\p{N}-])(${LOCALIZED_FAMILIARS.map((familiar) => familiar.id.replace(/[^a-z0-9-]/gi, "")).join("|")})(?![\\p{L}\\p{N}-])`,
  "gu",
);
const FAMILIAR_NAME_BY_ID = new Map(LOCALIZED_FAMILIARS.map((familiar) => [familiar.id, familiar.name]));

// Alcune mosse contengono un id come parola intera ("Marea dello slime",
// "Graffio dell'imp"): restano intatte.
const PROTECTED_MOVE_NAMES = [...new Set(FAMILIAR_COMBAT_CATALOG.flatMap((familiar) => familiar.moves.map((move) => move.name)))]
  .filter((name) => new RegExp(FAMILIAR_ID_PATTERN.source, "u").test(name))
  .sort((left, right) => right.length - left.length);

const PROTECTED_MOVE_SPLIT = new RegExp(`(${PROTECTED_MOVE_NAMES.map((name) => name.replace(/[.*+?^$()|[\]\\{}]/g, "\\$&")).join("|") || "(?!)"})`, "u");

function combatText(value: string) {
  return value
    .split(PROTECTED_MOVE_SPLIT)
    .map((part, index) => index % 2 === 1 ? part : part.replace(FAMILIAR_ID_PATTERN, (id) => FAMILIAR_NAME_BY_ID.get(id) ?? id))
    .join("");
}

// Stessa stima di forza usata da lib/famiglioCombatTower.ts per le riserve rivali.
function familiarCombatPower(entry: (typeof FAMILIAR_COMBAT_CATALOG)[number]) {
  const rarity = { comune: 0, raro: 1, epico: 2, leggendario: 3 }[entry.rarity] ?? 0;
  return entry.baseStats.hp * .18 + entry.baseStats.attack * .34 + entry.baseStats.defense * .28 + entry.baseStats.speed * .2 + rarity * 8;
}

function stageLabel(stage: FamiliarGrowthStage) {
  return stage === "cucciolo" ? "Cucciolo" : stage === "giovane" ? "Giovane" : "Adulto";
}

function opponentStageForLevel(level: number): FamiliarGrowthStage {
  return level >= 33 ? "adulto" : level >= 17 ? "giovane" : "cucciolo";
}

function spritePath(familiarId: string, growthStage: FamiliarGrowthStage, pose: string, colorVariant?: string | null) {
  const baseVariants: Readonly<Record<string, string>> = { cat: "grey", rabbit: "white", parrot: "blue" };
  const baseVariant = baseVariants[familiarId];
  const variantSegment = colorVariant && baseVariant && colorVariant !== baseVariant ? `/variants/${colorVariant}` : "";
  return `/famiglio/rebuild/collection/${familiarId}/growth/${growthStage}/battle-v6${variantSegment}/${pose}.png?v=8`;
}

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));
}

function InitiativeDie({ value }: { value: number }) {
  const safeValue = Math.min(6, Math.max(1, Math.round(value)));
  return <span
    className={battleStyles.initiativeDie}
    style={{ "--die-position": `${(safeValue - 1) * 20}%` } as CSSProperties}
    role="img"
    aria-label={`Dado: ${safeValue}`}
  />;
}

function moveVisual(move: CombatMove) {
  if (move.damageClass === "restore") return { kind: "heal", label: "Cura", pose: "heal" };
  if (move.damageClass === "status" && (move.status === "guard" || move.animation === "guard")) return { kind: "guard", label: "Difesa", pose: "guard" };
  if (move.damageClass === "status") return { kind: "status", label: "Tecnica", pose: "technique" };
  if (move.damageClass === "magic") return { kind: "magic", label: "Magia", pose: "magic" };
  return { kind: "physical", label: "Fisica", pose: "physical" };
}

function updateActiveAudioSettings(audios: Iterable<HTMLAudioElement>, muted: boolean, volume: number) {
  const normalizedVolume = Math.min(1, Math.max(0, volume));
  for (const audio of audios) {
    audio.volume = normalizedVolume;
    if (muted || normalizedVolume <= 0) audio.pause();
  }
}

function poseFor(
  familiarId: string,
  playerId: string,
  event: FamiliarCombatTimelineEvent | null,
  resultOutcome: FamiliarCombatOutcome,
  entering: boolean,
) {
  if (!event) {
    if (entering) return "entrance";
    // Ritirata: esito neutro, nessuno dei due Famigli festeggia o crolla.
    if (resultOutcome === "retreat") return "idle";
    if (resultOutcome !== "active") {
      const playerWon = resultOutcome === "victory";
      return familiarId === playerId ? (playerWon ? "victory" : "exhausted") : (playerWon ? "exhausted" : "victory");
    }
    return "idle";
  }
  const isActor = event.actorId === familiarId;
  const isTarget = event.targetId === familiarId;
  if (event.phase === "result") {
    const playerWon = event.vfxCue.includes("victory");
    return familiarId === playerId ? (playerWon ? "victory" : "exhausted") : (playerWon ? "exhausted" : "victory");
  }
  // Il bersaglio reagisce una volta sola: l'impatto mostra il contatto/VFX,
  // mentre il frame `reaction` riproduce la posa di colpo subito.
  if (event.phase === "reaction" && isTarget && Number(event.amount) > 0) return "hit";
  if (!isActor) return "idle";
  if (event.phase === "advance" || event.phase === "return") return event.actionKind === "physical" ? "run" : "idle";
  if (event.phase === "guard") return "guard";
  if (event.phase === "windup") {
    if (event.actionKind === "physical") return "attack";
    if (event.actionKind === "heal") return "heal";
    if (event.actionKind === "guard") return "guard";
    if (event.actionKind === "magic") return "magic";
    return "technique";
  }
  if (event.phase === "projectile") return "magic";
  if (event.phase === "impact") return event.actionKind === "physical" ? "physical" : "idle";
  if (event.phase === "status") return event.actionKind === "heal" ? "heal" : event.actionKind === "status" ? "technique" : "idle";
  return "idle";
}

function moveSubtitle(move: CombatMove) {
  if (move.damageClass === "restore") return `Cura ${Math.round((move.healingRatio ?? .2) * 100)}% · ${titleCase(move.affinity)}`;
  const status = move.status ? ` · ${STATUS_LABELS[move.status] ?? titleCase(move.status)} ${move.statusChance ?? 100}%` : "";
  if (move.damageClass === "status") return `${move.status ? STATUS_LABELS[move.status] ?? titleCase(move.status) : "Supporto"} · ${titleCase(move.affinity)}`;
  return `Potenza ${move.power} · Precisione ${move.accuracy}% · ${titleCase(move.affinity)}${status}`;
}

function moveCompactStats(move: CombatMove) {
  if (move.damageClass === "restore") return `Cura ${Math.round((move.healingRatio ?? .2) * 100)}% · ${titleCase(move.affinity)}`;
  if (move.damageClass === "status") return `${move.status ? STATUS_LABELS[move.status] ?? titleCase(move.status) : "Supporto"} · ${titleCase(move.affinity)}`;
  return `POT ${move.power} · PRE ${move.accuracy}% · ${titleCase(move.affinity)}`;
}

function StatGrid({ familiarId, level, previewStats }: { familiarId: string; level: number; previewStats?: FamiliarCombatStats }) {
  const stats = previewStats ?? combatStatsAtLevel(familiarId, level);
  if (!stats) return null;
  return <dl className={styles.statGrid}>
    <div><dt>HP</dt><dd>{stats.hp}</dd></div>
    <div><dt>Attacco</dt><dd>{stats.attack}</dd></div>
    <div><dt>Difesa</dt><dd>{stats.defense}</dd></div>
    <div><dt>Velocità</dt><dd>{stats.speed}</dd></div>
  </dl>;
}

export function FamiglioCombatArena({
  familiarId,
  familiarName,
  growthStage,
  colorVariant = null,
  state,
  setState,
  testMode = false,
  playerStatBonus,
  playerEvolutionPath = null,
  familiarOptions,
  onSelectFamiliar,
  onReturnHome,
  onReward,
  onMissionActivity,
  onBattleVictory,
  activityGate,
}: FamiglioCombatArenaProps) {
  const progress = familiarCombatProgress(state, familiarId);
  const levelProgress = familiarCombatLevelProgress(progress);
  const playerEntry = familiarCombatEntry(familiarId) ?? FAMILIAR_COMBAT_CATALOG[0];
  const [selectedCircuitId, setSelectedCircuitId] = useState(FAMILIAR_COMBAT_CIRCUITS[0].id);
  const selectedCircuit = FAMILIAR_COMBAT_CIRCUITS.find((entry) => entry.id === selectedCircuitId) ?? FAMILIAR_COMBAT_CIRCUITS[0];
  const initialOpponents = familiarCombatOpponents(familiarId, testMode ? undefined : selectedCircuit.id);
  const [selectedOpponentId, setSelectedOpponentId] = useState(initialOpponents[0] ?? "");
  const [difficulty, setDifficulty] = useState<FamiliarCombatDifficulty>("normal");
  const [setupTab, setSetupTab] = useState<ArenaSetupTab>("familiar");
  const [rosterQuery, setRosterQuery] = useState("");
  const [rosterPage, setRosterPage] = useState(0);
  const [arenaCategoryTab, setArenaCategoryTab] = useState<"paths" | "team" | "arenas" | "future">("paths");
  const [currentEvent, setCurrentEvent] = useState<FamiliarCombatTimelineEvent | null>(null);
  const [contactActors, setContactActors] = useState<readonly string[]>([]);
  const [visibleHealth, setVisibleHealth] = useState<VisibleHealth | null>(null);
  const [presentationBattle, setPresentationBattle] = useState<FamiliarCombatState["activeBattle"]>(null);
  const [animating, setAnimating] = useState(false);
  const [entering, setEntering] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(.62);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState<1 | 2>(1);
  const [battleInfoPanel, setBattleInfoPanel] = useState<"status" | "log" | null>(null);
  const [selectedMoveInfoId, setSelectedMoveInfoId] = useState<string | null>(null);
  const [retreatConfirmOpen, setRetreatConfirmOpen] = useState(false);
  const [initiativeBattleId, setInitiativeBattleId] = useState<string | null>(null);
  const [battleFormat, setBattleFormat] = useState<"duel" | "team" | "tower" | "campaign">("duel");
  const [selectedCampaignNumber, setSelectedCampaignNumber] = useState(1);
  const [towerRun, setTowerRun] = useState<FamiliarTowerRun | null>(null);
  const [teamIds, setTeamIds] = useState<string[]>([familiarId]);
  const [roundNotice, setRoundNotice] = useState<number | null>(null);
  const [localMessage, setLocalMessage] = useState<string | null>(null);
  const sequenceRef = useRef(0);
  const towerRunSerialRef = useRef(0);
  const pendingPresentationStateRef = useRef<FamiliarCombatState | null>(null);
  const activeAudioRef = useRef<Set<HTMLAudioElement>>(new Set());
  const audioContextRef = useRef<AudioContext | null>(null);
  const playedAudioEventIdsRef = useRef<Set<string>>(new Set());
  const audioSettingsRef = useRef({ muted, volume });
  const entranceTimerRef = useRef<number | null>(null);
  const shownInitiativeBattleIdsRef = useRef<Set<string>>(new Set());
  // Guardia sincrona contro doppio click/tap: lo stato `animating` arriva solo
  // al render successivo, il ref blocca subito un secondo turno.
  const turnLockRef = useRef(false);
  // La velocità scelta durante un turno deve valere anche per le fasi restanti.
  const animationSpeedRef = useRef<1 | 2>(1);
  const arenaRef = useRef<HTMLElement>(null);
  const dialogReturnFocusRef = useRef<HTMLElement | null>(null);
  const towerStorageKey = `lorewise:famiglio:tower:${familiarId}`;

  useEffect(() => {
    const timer = window.setTimeout(() => setTeamIds((current) => [...new Set([familiarId, ...current.filter((id) => familiarOptions.some((option) => option.id === id))])].slice(0, 3)), 0);
    return () => window.clearTimeout(timer);
  }, [familiarId, familiarOptions]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(towerStorageKey);
      if (!stored) return;
      const storedRun = JSON.parse(stored) as FamiliarTowerRun;
      if (!storedRun?.id || !Array.isArray(storedRun.floors) || storedRun.currentFloor < 1 || storedRun.currentFloor > storedRun.floors.length) return;
      const parsed: FamiliarTowerRun = {
        ...storedRun,
        floors: storedRun.floors.map((floor) => {
          const teamBattle = [4, 8, 10].includes(floor.floor);
          const fallbackTeam = [floor.opponentId, ...FAMILIAR_COMBAT_CATALOG.map((entry) => entry.id).filter((id) => id !== familiarId && id !== floor.opponentId)].slice(0, 3);
          return { ...floor, teamBattle, opponentTeamIds: teamBattle ? [...new Set(floor.opponentTeamIds?.length ? floor.opponentTeamIds : fallbackTeam)].slice(0, 3) : [floor.opponentId] };
        }),
      };
      const floor = familiarTowerFloor(parsed);
      const timer = window.setTimeout(() => {
        setTowerRun(parsed);
        setBattleFormat("tower");
        if (floor) {
          setSelectedCircuitId(floor.circuitId);
          setSelectedOpponentId(floor.opponentId);
          if (floor.teamBattle) setTeamIds((current) => [...new Set([familiarId, ...current, ...familiarOptions.map((option) => option.id)])].slice(0, 3));
        }
      }, 0);
      return () => window.clearTimeout(timer);
    } catch { /* La Torre resta giocabile anche senza memoria locale. */ }
  }, [familiarId, familiarOptions, towerStorageKey]);

  const opponentIds = useMemo(
    () => familiarCombatOpponents(familiarId, testMode ? undefined : selectedCircuit.id),
    [familiarId, selectedCircuit.id, testMode],
  );
  const normalizedRosterQuery = rosterQuery.trim().toLocaleLowerCase("it");
  const filteredFamiliarOptions = normalizedRosterQuery
    ? familiarOptions.filter((option) => option.name.toLocaleLowerCase("it").includes(normalizedRosterQuery))
    : familiarOptions;
  const rosterPageSize = 8;
  const rosterPageCount = Math.max(1, Math.ceil(filteredFamiliarOptions.length / rosterPageSize));
  const safeRosterPage = Math.min(rosterPage, rosterPageCount - 1);
  const visibleFamiliarOptions = filteredFamiliarOptions.slice(safeRosterPage * rosterPageSize, (safeRosterPage + 1) * rosterPageSize);
  const selectPreparedFamiliar = (nextFamiliarId: string) => {
    onSelectFamiliar(nextFamiliarId);
    setTeamIds((current) => [...new Set([nextFamiliarId, ...current])].slice(0, 3));
  };
  const toggleTeamMember = (nextFamiliarId: string) => {
    if (nextFamiliarId === familiarId) return;
    setTeamIds((current) => current.includes(nextFamiliarId)
      ? current.filter((id) => id !== nextFamiliarId)
      : current.length < 3 ? [...current, nextFamiliarId] : current);
  };
  const completePlayerTeam = () => {
    const available = familiarOptions.map((option) => option.id);
    setTeamIds((current) => [...new Set([familiarId, ...current, ...available])].slice(0, 3));
  };
  const activeTowerFloor = battleFormat === "tower" ? familiarTowerFloor(towerRun) : null;
  const selectedCampaignLevel = battleFormat === "campaign" ? FAMILIAR_COMBAT_CAMPAIGN[selectedCampaignNumber - 1] ?? FAMILIAR_COMBAT_CAMPAIGN[0] : null;
  const nextCampaignLevelNumber = FAMILIAR_COMBAT_CAMPAIGN.find((level) => !familiarCampaignIsComplete(progress, level))?.number ?? 20;
  const selectedCampaignOpponentId = selectedCampaignLevel ? familiarCampaignOpponent(selectedCampaignLevel, familiarId) : null;
  const safeOpponentId = selectedCampaignOpponentId ?? activeTowerFloor?.opponentId ?? (opponentIds.includes(selectedOpponentId) ? selectedOpponentId : opponentIds[0] ?? "");
  const teamBattle = battleFormat === "team" || Boolean(selectedCampaignLevel?.teamBattle) || Boolean(activeTowerFloor?.teamBattle);
  // Rivali scelti esplicitamente (piano della Torre, livello di Campagna), mai
  // già presenti nella squadra del giocatore: il motore scarta allo stesso modo
  // chi è già schierato e usa il primo rimasto come titolare.
  const explicitRivalIds = [...new Set([
    safeOpponentId,
    ...(activeTowerFloor?.opponentTeamIds ?? []),
    ...(selectedCampaignLevel?.opponentIds ?? []),
  ])].filter((id) => id && id !== familiarId && !teamIds.includes(id));
  const leadRivalEntry = familiarCombatEntry(explicitRivalIds[0] ?? safeOpponentId);
  // Le riserve mancanti hanno forza vicina a quella del titolare (come nella
  // Torre): prima si riempiva con i rivali del circuito dal più debole, e il
  // livello 4 della Campagna in 3 contro 3 diventava il più facile.
  const reservePool = [...new Set([...opponentIds, ...FAMILIAR_COMBAT_CATALOG.map((entry) => entry.id)])]
    .filter((id) => id !== familiarId && !teamIds.includes(id) && !explicitRivalIds.includes(id));
  const leadRivalPower = leadRivalEntry ? familiarCombatPower(leadRivalEntry) : 0;
  const reserveRivalIds = reservePool
    .flatMap((id) => { const entry = familiarCombatEntry(id); return entry ? [entry] : []; })
    .sort((left, right) => Math.abs(familiarCombatPower(left) - leadRivalPower) - Math.abs(familiarCombatPower(right) - leadRivalPower) || left.id.localeCompare(right.id))
    .map((entry) => entry.id);
  const opponentTeamIds = [...explicitRivalIds, ...reserveRivalIds].slice(0, teamBattle ? 3 : 1);
  // In 3 contro 3 l'anteprima mostra lo stesso titolare che il motore schiererà.
  const previewOpponentId = teamBattle ? opponentTeamIds[0] ?? safeOpponentId : safeOpponentId;
  const opponentEntry = familiarCombatEntry(previewOpponentId);
  const opponentPreview = previewOpponentId ? familiarCombatOpponentPreview({
    playerId: familiarId,
    opponentId: previewOpponentId,
    circuitId: selectedCircuit.id,
    difficulty,
    opponentLevel: selectedCampaignLevel?.opponentLevel ?? activeTowerFloor?.opponentLevel ?? (testMode ? progress.combatLevel : undefined),
    // Le soglie di Campagna scalano il rivale sul livello del giocatore: l'anteprima
    // deve mostrare le stesse statistiche che il motore userà in battaglia.
    encounterId: selectedCampaignLevel?.id,
    playerLevel: selectedCampaignLevel ? progress.combatLevel : undefined,
  }) : null;
  const opponentRoster = opponentIds.flatMap((id) => {
    const entry = familiarCombatEntry(id);
    const preview = familiarCombatOpponentPreview({
      playerId: familiarId,
      opponentId: id,
      circuitId: selectedCircuit.id,
      difficulty,
      opponentLevel: testMode ? progress.combatLevel : undefined,
    });
    if (!entry || !preview) return [];
    return [{
      entry,
      preview,
      visual: familiarHouseVisual(id),
      growthStage: opponentStageForLevel(preview.level),
      guardian: selectedCircuit.bossId === id,
    }];
  });
  const proposedOpponentLevel = opponentPreview?.level ?? selectedCircuit.minLevel;
  const activeCombatantId = state.activeBattle?.outcome === "active" ? state.activeBattle.player.familiarId : familiarId;
  const activeCombatantProgress = familiarCombatProgress(state, activeCombatantId);
  const playerMoves = activeCombatantProgress.equippedMoveIds.map(combatMoveById).filter((move): move is CombatMove => Boolean(move));
  const selectedMoveInfo = selectedMoveInfoId ? playerMoves.find((move) => move.id === selectedMoveInfoId) ?? null : null;
  const learnedMoves = progress.learnedMoveIds.map(combatMoveById).filter((move): move is CombatMove => Boolean(move));
  const opponentMoves = opponentPreview?.moves ?? [];
  const battle = presentationBattle ?? state.activeBattle;
  const opponentGrowthStage = opponentStageForLevel(battle?.opponent.level ?? proposedOpponentLevel);
  const battlePlayerEntry = battle ? familiarCombatEntry(battle.player.familiarId) : null;
  const battleOpponentEntry = battle ? familiarCombatEntry(battle.opponent.familiarId) : null;
  const battleCircuit = battle ? FAMILIAR_COMBAT_CIRCUITS.find((entry) => entry.id === battle.circuitId) ?? selectedCircuit : selectedCircuit;
  const battleCampaignLevel = familiarCampaignLevelById(battle?.encounterId);
  const towerBackground = battleFormat === "tower" ? familiarTowerFloorBackground(activeTowerFloor?.floor) : null;
  const battleBackground = battleCampaignLevel?.arenaSrc ?? towerBackground ?? ARENA_BACKGROUNDS[battleCircuit.id] ?? battleCircuit.backgroundSrc;
  const battleDifficultyLabel = FAMILIAR_COMBAT_DIFFICULTIES.find((entry) => entry.id === battle?.difficulty)?.label ?? FAMILIAR_COMBAT_DIFFICULTIES[0].label;
  const battlePlayerOption = familiarOptions.find((option) => option.id === (battle?.player.familiarId ?? familiarId));
  const battlePlayerName = battlePlayerEntry?.name ?? familiarName;
  const playerVisual = familiarHouseVisual(battle?.player.familiarId ?? familiarId);
  const opponentVisual = familiarHouseVisual(battle?.opponent.familiarId ?? previewOpponentId);
  const playerHp = battle && visibleHealth?.battleId === battle.id ? visibleHealth.player : battle?.player.hp ?? 0;
  const opponentHp = battle && visibleHealth?.battleId === battle.id ? visibleHealth.opponent : battle?.opponent.hp ?? 0;
  const playerHpPercent = battle ? Math.max(0, Math.min(100, playerHp / Math.max(1, battle.player.maxHp) * 100)) : 0;
  const opponentHpPercent = battle ? Math.max(0, Math.min(100, opponentHp / Math.max(1, battle.opponent.maxHp) * 100)) : 0;
  const playerEnergyPercent = battle ? Math.max(0, Math.min(100, battle.player.energy / Math.max(1, battle.player.maxEnergy) * 100)) : 0;
  const opponentEnergyPercent = battle ? Math.max(0, Math.min(100, battle.opponent.energy / Math.max(1, battle.opponent.maxEnergy) * 100)) : 0;
  const presentationCue = useMemo(
    () => currentEvent ? familiarCombatPresentationCue(currentEvent, combatMoveById(currentEvent.moveId)) : null,
    [currentEvent],
  );
  const phaseActorId = currentEvent?.actorId ?? battle?.player.familiarId ?? familiarId;
  const phaseDuration = Math.round(
    (presentationCue?.durationMs ?? currentEvent?.durationMs ?? 500)
      * familiarCombatPhaseDurationScale(phaseActorId)
      * 1.53
      / animationSpeed,
  );
  const initiativeOpen = Boolean(battle?.initiative && initiativeBattleId === battle.id && battle.outcome === "active");
  const playerBattlePose = battle
    ? poseFor(battle.player.familiarId, battle.player.familiarId, currentEvent, battle.outcome, entering)
    : "idle";
  const opponentBattlePose = battle
    ? poseFor(battle.opponent.familiarId, battle.player.familiarId, currentEvent, battle.outcome, entering)
    : "idle";
  const campaignNpcPose: CampaignNpcPose = !battleCampaignLevel || !battle
    ? "idle"
    : battle.outcome === "victory"
      ? "defeat"
      : battle.outcome === "defeat"
        ? "victory"
        : currentEvent?.phase === "reaction" && Number(currentEvent.amount) > 0
          ? currentEvent.targetId === battle.opponent.familiarId ? "anger" : "cheer"
          : currentEvent?.actorId === battle.opponent.familiarId
            ? "command"
            : "idle";

  // Il cartello del round dipende solo da id/turno: prima ripartiva a ogni
  // cambio d'oggetto (inizio animazione) e riannunciava il round già giocato.
  const roundBattleId = battle?.id ?? null;
  const roundTurn = battle?.turn ?? 0;
  const roundActive = battle?.outcome === "active";
  useEffect(() => {
    if (!roundBattleId || !roundActive || animating) return;
    const show = window.setTimeout(() => setRoundNotice(roundTurn), 0);
    const timer = window.setTimeout(() => setRoundNotice((current) => current === roundTurn ? null : current), 1250);
    return () => { window.clearTimeout(show); window.clearTimeout(timer); };
  }, [animating, roundActive, roundBattleId, roundTurn]);

  useEffect(() => () => {
    sequenceRef.current += 1;
    for (const audio of activeAudioRef.current) audio.pause();
    activeAudioRef.current.clear();
    void audioContextRef.current?.close();
    if (entranceTimerRef.current) window.clearTimeout(entranceTimerRef.current);
  }, []);

  const unlockCombatAudio = () => {
    setAudioUnlocked(true);
    const AudioContextConstructor = window.AudioContext
      ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextConstructor) return;
    const context = audioContextRef.current ?? new AudioContextConstructor();
    audioContextRef.current = context;
    void context.resume();
    // Un buffer vuoto avviato direttamente dal gesto dell'utente mantiene
    // sbloccati anche i cue HTMLAudio riprodotti dopo il preload dei frame.
    const source = context.createBufferSource();
    source.buffer = context.createBuffer(1, 1, context.sampleRate);
    source.connect(context.destination);
    source.start();
  };

  useEffect(() => {
    audioSettingsRef.current = { muted, volume };
    updateActiveAudioSettings(activeAudioRef.current, muted, volume);
  }, [muted, volume]);

  const playAudio = (cue: FamiliarCombatPresentationCue) => {
    const settings = audioSettingsRef.current;
    if (!cue.audioPath || settings.muted || settings.volume <= 0 || playedAudioEventIdsRef.current.has(cue.eventId)) return;
    playedAudioEventIdsRef.current.add(cue.eventId);
    const audio = new Audio(cue.audioPath);
    audio.preload = "auto";
    audio.volume = Math.min(1, Math.max(0, settings.volume));
    activeAudioRef.current.add(audio);
    const release = () => {
      activeAudioRef.current.delete(audio);
    };
    audio.addEventListener("ended", release, { once: true });
    audio.addEventListener("error", release, { once: true });
    void audio.play().catch(release);
  };

  const updateHealthForEvent = (event: FamiliarCombatTimelineEvent, health: VisibleHealth, currentBattle: NonNullable<FamiliarCombatState["activeBattle"]>) => {
    const amount = Math.max(0, Number(event.amount) || 0);
    if (!amount) return health;
    const targetKey = event.targetId === currentBattle.player.familiarId ? "player" : "opponent";
    const maximum = targetKey === "player" ? currentBattle.player.maxHp : currentBattle.opponent.maxHp;
    const isHealing = event.actionKind === "heal";
    const isDamage = (event.phase === "reaction" && ["physical", "magic"].includes(event.actionKind))
      || (event.phase === "status" && ["burn", "poison"].includes(event.statusId ?? ""));
    if (!isHealing && !isDamage) return health;
    return { ...health, [targetKey]: isHealing ? Math.min(maximum, health[targetKey] + amount) : Math.max(0, health[targetKey] - amount) };
  };

  const animateTimeline = async (timeline: readonly FamiliarCombatTimelineEvent[], nextState: FamiliarCombatState, currentBattle: NonNullable<FamiliarCombatState["activeBattle"]>) => {
    const sequence = ++sequenceRef.current;
    const eventOpponentStage = opponentStageForLevel(currentBattle.opponent.level);
    let health: VisibleHealth = {
      battleId: currentBattle.id,
      player: currentBattle.player.hp,
      opponent: currentBattle.opponent.hp,
    };
    setPresentationBattle(currentBattle);
    setVisibleHealth(health);
    pendingPresentationStateRef.current = nextState;
    setAnimating(true);
    await preloadFamiglioCombatImages(timeline.flatMap((event) => {
      const cue = familiarCombatPresentationCue(event, combatMoveById(event.moveId));
      return [
        spritePath(currentBattle.player.familiarId, growthStage, poseFor(currentBattle.player.familiarId, currentBattle.player.familiarId, event, currentBattle.outcome, false), colorVariant),
        spritePath(currentBattle.opponent.familiarId, eventOpponentStage, poseFor(currentBattle.opponent.familiarId, currentBattle.player.familiarId, event, currentBattle.outcome, false)),
        cue.vfx?.path,
      ];
    }));
    if (sequenceRef.current !== sequence) return;
    for (const event of timeline) {
      if (sequenceRef.current !== sequence) return;
      const cue = familiarCombatPresentationCue(event, combatMoveById(event.moveId));
      if (event.phase === "advance") setContactActors((current) => [...new Set([...current, event.actorId])]);
      if (event.phase === "return") setContactActors((current) => current.filter((id) => id !== event.actorId));
      setCurrentEvent(event);
      playAudio(cue);
      health = updateHealthForEvent(event, health, currentBattle);
      setVisibleHealth(health);
      await wait(Math.max(220, cue.durationMs * familiarCombatPhaseDurationScale(event.actorId) * 1.53 / animationSpeedRef.current));
    }
    if (sequenceRef.current !== sequence) return;
    setCurrentEvent(null);
    setContactActors([]);
    const resolved = nextState.activeBattle;
    if (resolved) setVisibleHealth({ battleId: resolved.id, player: resolved.player.hp, opponent: resolved.opponent.hp });
    pendingPresentationStateRef.current = null;
    turnLockRef.current = false;
    setPresentationBattle(null);
    setAnimating(false);
  };

  const chooseCircuit = (circuitId: (typeof FAMILIAR_COMBAT_CIRCUITS)[number]["id"]) => {
    const circuitOpponents = familiarCombatOpponents(familiarId, testMode ? undefined : circuitId);
    setSelectedCircuitId(circuitId);
    setBattleFormat("duel");
    setTowerRun(null);
    if (!circuitOpponents.includes(safeOpponentId)) setSelectedOpponentId(circuitOpponents[0] ?? "");
    setSetupTab("opponents");
  };

  const chooseTeamBattle = () => {
    setBattleFormat("team");
    setTowerRun(null);
    completePlayerTeam();
    setSetupTab("opponents");
  };

  const chooseTower = () => {
    towerRunSerialRef.current += 1;
    const run = towerRun ?? createFamiliarTowerRun(familiarId, progress.combatLevel, `${state.seed}:${progress.battlesCompleted}:${towerRunSerialRef.current}`);
    const floor = familiarTowerFloor(run);
    if (!floor) return;
    setBattleFormat("tower");
    setTowerRun(run);
    try { window.localStorage.setItem(towerStorageKey, JSON.stringify(run)); } catch { /* Salvataggio opzionale. */ }
    setSelectedCircuitId(floor.circuitId);
    setSelectedOpponentId(floor.opponentId);
    if (floor.teamBattle) completePlayerTeam();
    setSetupTab("mode");
  };

  const chooseCampaign = () => {
    const firstOpen = FAMILIAR_COMBAT_CAMPAIGN.find((level) => familiarCampaignIsUnlocked(progress, level, testMode) && !familiarCampaignIsComplete(progress, level))
      ?? [...FAMILIAR_COMBAT_CAMPAIGN].reverse().find((level) => familiarCampaignIsUnlocked(progress, level, testMode))
      ?? FAMILIAR_COMBAT_CAMPAIGN[0];
    setBattleFormat("campaign");
    setTowerRun(null);
    setSelectedCampaignNumber(firstOpen.number);
    setSelectedCircuitId(firstOpen.circuitId);
    setDifficulty(firstOpen.difficulty);
    setSelectedOpponentId(familiarCampaignOpponent(firstOpen, familiarId));
    setSetupTab("campaign");
  };

  const prepareCampaignLevel = (level: (typeof FAMILIAR_COMBAT_CAMPAIGN)[number]) => {
    if (!familiarCampaignIsUnlocked(progress, level, testMode)) return;
    setSelectedCampaignNumber(level.number);
    setSelectedCircuitId(level.circuitId);
    setDifficulty(level.difficulty);
    setSelectedOpponentId(familiarCampaignOpponent(level, familiarId));
    if (level.teamBattle) completePlayerTeam();
    setSetupTab("moves");
  };

  const setupSteps: readonly { id: ArenaSetupTab; label: string; icon: string }[] = [
    { id: "familiar", label: "Famiglio", icon: "/famiglio/rebuild/combat/ui/step-famiglio.png" },
    { id: "arenas", label: battleFormat === "tower" ? "Torre" : battleFormat === "campaign" ? "Campagna" : "Arena", icon: "/famiglio/rebuild/combat/ui/step-arena.png" },
    ...(battleFormat === "campaign" ? [{ id: "campaign" as const, label: "Storia", icon: "/famiglio/rebuild/combat/ui/step-rivale.png" }] : battleFormat === "tower" ? [] : [{ id: "opponents" as const, label: "Rivale", icon: "/famiglio/rebuild/combat/ui/step-rivale.png" }]),
    ...(battleFormat === "campaign" ? [] : [{ id: "mode" as const, label: "Modalità", icon: "/famiglio/rebuild/combat/ui/step-modalita.png" }]),
    { id: "moves", label: "Mosse", icon: "/famiglio/rebuild/combat/ui/step-mosse.png" },
    { id: "ready", label: "Battaglia", icon: "/famiglio/rebuild/combat/ui/step-battaglia.png" },
  ];
  const setupStepIndex = setupSteps.findIndex((step) => step.id === setupTab);
  const goToPreviousSetupStep = () => {
    const previous = setupSteps[Math.max(0, setupStepIndex - 1)];
    if (previous) setSetupTab(previous.id);
  };

  const beginBattle = () => {
    if (activityGate && !activityGate.allowed) {
      setLocalMessage(activityGate.reason ?? "Il Famiglio non è pronto a combattere.");
      return;
    }
    const towerFloor = battleFormat === "tower" ? familiarTowerFloor(towerRun) : null;
    const campaignLevel = battleFormat === "campaign" ? selectedCampaignLevel : null;
    const opponentId = campaignLevel ? familiarCampaignOpponent(campaignLevel, familiarId) : towerFloor?.opponentId ?? safeOpponentId;
    const circuitId = campaignLevel?.circuitId ?? towerFloor?.circuitId ?? selectedCircuit.id;
    if (!opponentId) return;
    unlockCombatAudio();
    playedAudioEventIdsRef.current.clear();
    const result = startFamiliarCombatBattle(state, {
      playerId: familiarId,
      playerTeamIds: teamBattle ? teamIds : [familiarId],
      opponentId,
      opponentTeamIds,
      circuitId,
      difficulty: campaignLevel?.difficulty ?? difficulty,
      opponentLevel: campaignLevel?.opponentLevel ?? towerFloor?.opponentLevel ?? (testMode ? progress.combatLevel : undefined),
      encounterId: campaignLevel?.id ?? (towerFloor ? `${towerRun?.id}:floor-${towerFloor.floor}` : undefined),
      ignoreUnlocks: testMode || Boolean(towerFloor) || Boolean(campaignLevel),
      playerStatBonus,
      playerEvolutionPath,
      maxTurns: campaignLevel?.turnLimit ?? null,
      bossPhases: teamBattle ? 1 : campaignLevel?.bossPhases ?? 1,
      teamBattle,
    });
    if (!result.ok) {
      setLocalMessage(result.error);
      return;
    }
    const started = result.state.activeBattle;
    if (started) {
      setVisibleHealth({ battleId: started.id, player: started.player.hp, opponent: started.opponent.hp });
      void preloadFamiglioCombatImages([
        campaignLevel?.arenaSrc ?? towerFloor?.backgroundSrc ?? ARENA_BACKGROUNDS[circuitId] ?? FAMILIAR_COMBAT_CIRCUITS.find((entry) => entry.id === circuitId)?.backgroundSrc ?? selectedCircuit.backgroundSrc,
        spritePath(started.player.familiarId, growthStage, "entrance", colorVariant),
        spritePath(started.opponent.familiarId, opponentStageForLevel(started.opponent.level), "entrance"),
      ]);
      if (!shownInitiativeBattleIdsRef.current.has(started.id)) {
        shownInitiativeBattleIdsRef.current.add(started.id);
        setInitiativeBattleId(started.id);
      } else {
        setInitiativeBattleId(null);
      }
    }
    setLocalMessage(null);
    setEntering(true);
    if (entranceTimerRef.current) window.clearTimeout(entranceTimerRef.current);
    entranceTimerRef.current = window.setTimeout(() => setEntering(false), 900);
    setState(result.state);
  };

  const rotateCombatant = (nextFamiliarId: string) => {
    if (animating || turnLockRef.current) return;
    const result = switchFamiliarCombatant(state, nextFamiliarId);
    if (!result.ok) { setLocalMessage(result.error); return; }
    setLocalMessage(null);
    setState(result.state);
  };

  const performSelectedMove = (moveId: string) => {
    if (animating || turnLockRef.current || !battle || battle.outcome !== "active") return;
    setInitiativeBattleId(null);
    const currentBattle = state.activeBattle;
    if (!currentBattle) return;
    unlockCombatAudio();
    const result = performFamiliarCombatTurn(state, moveId);
    if (!result.ok) {
      setLocalMessage(result.error);
      return;
    }
    turnLockRef.current = true;
    setLocalMessage(null);
    setState(result.state);
    void animateTimeline(result.timeline, result.state, currentBattle);
  };

  const changeEquippedMove = (slot: number, moveId: string) => {
    if (!moveId) return;
    const result = equipFamiliarCombatMove(state, familiarId, moveId, slot);
    if (result.ok) {
      setLocalMessage(null);
      setState(result.state);
    } else setLocalMessage(result.error);
  };

  const collectReward = () => {
    if (battle?.outcome === "victory") onBattleVictory?.(battle.id);
    // Il motore crea una ricompensa solo al primo successo di un incontro. Prima
    // un piano della Torre o un livello di Campagna già vinto (stesso rivale,
    // arena e modalità) chiudeva la battaglia senza avanzare: il giocatore
    // restava bloccato sullo stesso piano. Ora l'avanzamento non dipende più
    // dalla presenza della ricompensa.
    let claimedState = state;
    if (state.pendingReward) {
      const result = claimFamiliarCombatReward(state);
      if (result.ok) {
        setLocalMessage(null);
        onReward(result.reward);
        onMissionActivity?.("familiar_battle", result.reward.battleId);
      } else setLocalMessage(result.error);
      claimedState = result.state;
    } else {
      setLocalMessage(null);
      if (battle) onMissionActivity?.("familiar_battle", battle.id);
    }
    if (battle?.outcome === "victory" && battleFormat === "tower" && towerRun) onMissionActivity?.("familiar_tower_floor", `${towerRun.id}:floor-${towerRun.currentFloor}`);
    const cleared = closeFamiliarCombatBattle(claimedState);
    if (battle?.outcome !== "victory") {
      setState(cleared);
      return;
    }
    if (battleFormat === "tower" && towerRun) {
      const nextRun = advanceFamiliarTower(towerRun);
      if (nextRun) {
        const floor = familiarTowerFloor(nextRun);
        setTowerRun(nextRun);
        try { window.localStorage.setItem(towerStorageKey, JSON.stringify(nextRun)); } catch { /* Salvataggio opzionale. */ }
        if (floor) {
          setSelectedCircuitId(floor.circuitId);
          setSelectedOpponentId(floor.opponentId);
          if (floor.teamBattle) completePlayerTeam();
        }
        setSetupTab("ready");
      } else {
        setTowerRun(null);
        try { window.localStorage.removeItem(towerStorageKey); } catch { /* Nessun blocco. */ }
        setBattleFormat("duel");
        setSetupTab("arenas");
      }
    } else if (battleFormat === "campaign") {
      const nextNumber = Math.min(20, selectedCampaignNumber + 1);
      const nextLevel = FAMILIAR_COMBAT_CAMPAIGN[nextNumber - 1];
      setSelectedCampaignNumber(nextNumber);
      if (nextLevel) {
        setSelectedCircuitId(nextLevel.circuitId);
        setDifficulty(nextLevel.difficulty);
        setSelectedOpponentId(familiarCampaignOpponent(nextLevel, familiarId));
        if (nextLevel.teamBattle) completePlayerTeam();
      }
      setSetupTab("campaign");
    }
    setState(cleared);
  };

  const finishBattleAtHome = () => {
    sequenceRef.current += 1;
    if (battle?.outcome === "victory") onBattleVictory?.(battle.id);
    let nextState = state;
    if (state.pendingReward) {
      const result = claimFamiliarCombatReward(state);
      if (result.ok) {
        onReward(result.reward);
        onMissionActivity?.("familiar_battle", result.reward.battleId);
        if (battleFormat === "tower" && towerRun) onMissionActivity?.("familiar_tower_floor", `${towerRun.id}:floor-${towerRun.currentFloor}`);
        nextState = result.state;
      }
    }
    // Una ritirata non conta come battaglia disputata per le missioni.
    if (!state.pendingReward && battle && battle.outcome !== "retreat") onMissionActivity?.("familiar_battle", battle.id);
    setState(closeFamiliarCombatBattle(nextState));
    if (battle?.outcome === "victory" && battleFormat === "tower" && towerRun) {
      const nextRun = advanceFamiliarTower(towerRun);
      setTowerRun(nextRun);
      try {
        if (nextRun) window.localStorage.setItem(towerStorageKey, JSON.stringify(nextRun));
        else window.localStorage.removeItem(towerStorageKey);
      } catch { /* L'avanzamento resta valido nella sessione corrente. */ }
    }
    onReturnHome();
  };

  const rematch = () => {
    // Rivincita dopo una sconfitta o una ritirata (esito neutro).
    if (!battle || (battle.outcome !== "defeat" && battle.outcome !== "retreat")) return;
    if (battle.outcome !== "retreat") onMissionActivity?.("familiar_battle", battle.id);
    const clearedState = closeFamiliarCombatBattle(state);
    const result = startFamiliarCombatBattle(clearedState, {
      playerId: familiarId,
      playerTeamIds: battle.teamFamiliarIds,
      opponentId: battle.opponentTeamFamiliarIds[0] ?? battle.opponent.familiarId,
      opponentTeamIds: battle.opponentTeamFamiliarIds,
      circuitId: battle.circuitId,
      difficulty: battle.difficulty,
      opponentLevel: battle.opponent.level,
      // La rivincita deve restare lo stesso incontro: senza encounterId un
      // livello di Campagna vinto alla rivincita non risultava completato
      // (e perdeva arena/Custode), e senza ignoreUnlocks la rivincita di un
      // livello oltre gli sblocchi del circuito veniva rifiutata.
      encounterId: battle.encounterId,
      ignoreUnlocks: testMode || battleFormat === "tower" || Boolean(battleCampaignLevel),
      playerStatBonus,
      playerEvolutionPath,
      maxTurns: battleCampaignLevel?.turnLimit ?? battle.maxTurns,
      bossPhases: battle.teamBattle ? 1 : battleCampaignLevel?.bossPhases ?? battle.bossPhasesTotal,
      teamBattle: battle.teamBattle,
    });
    if (!result.ok) {
      setLocalMessage(result.error);
      setState(clearedState);
      return;
    }
    const started = result.state.activeBattle;
    if (started) setVisibleHealth({ battleId: started.id, player: started.player.hp, opponent: started.opponent.hp });
    playedAudioEventIdsRef.current.clear();
    setCurrentEvent(null);
    setContactActors([]);
    setPresentationBattle(null);
    setLocalMessage(null);
    setEntering(true);
    if (entranceTimerRef.current) window.clearTimeout(entranceTimerRef.current);
    entranceTimerRef.current = window.setTimeout(() => setEntering(false), 900);
    setState(result.state);
  };

  const leaveBattle = () => {
    setRetreatConfirmOpen(false);
    sequenceRef.current += 1;
    pendingPresentationStateRef.current = null;
    for (const audio of activeAudioRef.current) audio.pause();
    activeAudioRef.current.clear();
    playedAudioEventIdsRef.current.clear();
    setAnimating(false);
    setCurrentEvent(null);
    setContactActors([]);
    setPresentationBattle(null);
    setState(battle?.outcome === "active" ? retreatFromFamiliarCombat(state) : closeFamiliarCombatBattle(state));
  };

  const skipPresentation = () => {
    sequenceRef.current += 1;
    for (const audio of activeAudioRef.current) audio.pause();
    activeAudioRef.current.clear();
    const completedState = pendingPresentationStateRef.current;
    pendingPresentationStateRef.current = null;
    if (completedState) setState(completedState);
    setCurrentEvent(null);
    setContactActors([]);
    setPresentationBattle(null);
    setEntering(false);
    setAnimating(false);
    const resolved = completedState?.activeBattle ?? state.activeBattle;
    if (resolved) setVisibleHealth({ battleId: resolved.id, player: resolved.player.hp, opponent: resolved.opponent.hp });
  };

  useEffect(() => {
    // Qualunque percorso chiuda la presentazione (fine, salto, ritiro) libera il turno.
    if (!animating) turnLockRef.current = false;
  }, [animating]);

  useEffect(() => {
    animationSpeedRef.current = animationSpeed;
  }, [animationSpeed]);

  useEffect(() => {
    if (!animating || currentEvent || presentationBattle) return;
    const unlock = window.setTimeout(() => setAnimating(false), 0);
    return () => window.clearTimeout(unlock);
  }, [animating, currentEvent, presentationBattle]);

  // Finestre modali della battaglia: prima restavano senza focus (la tastiera
  // restava sul link "Vai al contenuto" della pagina), senza Esc e senza
  // trappola del Tab, pur dichiarando aria-modal.
  const openDialog = !animating && battle && battle.outcome !== "active"
    ? "result"
    : battle?.outcome === "active" && retreatConfirmOpen
      ? "retreat"
      : battle?.outcome === "active" && selectedMoveInfo
        ? "move"
        : battle?.outcome === "active" && battleInfoPanel
          ? "info"
          : initiativeOpen
            ? "initiative"
            : null;
  useEffect(() => {
    if (!openDialog) {
      const back = dialogReturnFocusRef.current;
      dialogReturnFocusRef.current = null;
      if (back?.isConnected && !(back as HTMLButtonElement).disabled) back.focus({ preventScroll: true });
      return;
    }
    const active = document.activeElement as HTMLElement | null;
    if (!dialogReturnFocusRef.current && active && !active.closest("[role='dialog']")) dialogReturnFocusRef.current = active;
    const frame = window.requestAnimationFrame(() => {
      const dialogs = arenaRef.current?.querySelectorAll<HTMLElement>("[role='dialog']");
      const dialog = dialogs?.[dialogs.length - 1];
      if (dialog && !dialog.contains(document.activeElement)) dialog.querySelector<HTMLElement>("button:not(:disabled)")?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [openDialog]);

  const handleDialogKeys = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (!openDialog) return;
    if (event.key === "Escape") {
      if (openDialog === "retreat") setRetreatConfirmOpen(false);
      else if (openDialog === "move") setSelectedMoveInfoId(null);
      else if (openDialog === "info") setBattleInfoPanel(null);
      else if (openDialog === "initiative") setInitiativeBattleId(null);
      else return;
      event.preventDefault();
      return;
    }
    if (event.key !== "Tab") return;
    const dialogs = arenaRef.current?.querySelectorAll<HTMLElement>("[role='dialog']");
    const dialog = dialogs?.[dialogs.length - 1];
    const focusable = Array.from(dialog?.querySelectorAll<HTMLElement>("button:not(:disabled), a[href], select, input, [tabindex]:not([tabindex='-1'])") ?? []);
    if (!focusable.length) return;
    const index = focusable.indexOf(document.activeElement as HTMLElement);
    if (event.shiftKey && index <= 0) { event.preventDefault(); focusable[focusable.length - 1].focus(); }
    else if (!event.shiftKey && (index < 0 || index === focusable.length - 1)) { event.preventDefault(); focusable[0].focus(); }
  };

  const selectedCircuitUnlocked = testMode || (progress.combatLevel >= selectedCircuit.minLevel && progress.wins >= selectedCircuit.unlockWins);
  const selectedDifficultyUnlocked = testMode || combatDifficultyIsUnlocked(progress, difficulty);

  return <section
    ref={arenaRef}
    onKeyDown={handleDialogKeys}
    className={`${styles.combat} ${battle ? battleStyles.root : ""}`}
    data-battle={Boolean(battle)}
    data-famiglio-audio-scope="combat"
    aria-label="Arena dei Famigli"
    onPointerDownCapture={(event) => {
      const control = (event.target as HTMLElement).closest("button, a, [role='button']") as HTMLButtonElement | HTMLAnchorElement | null;
      if (!control || ("disabled" in control && control.disabled)) return;
      unlockCombatAudio();
      playFamiliarInterfaceCue("confirm", !audioSettingsRef.current.muted, audioSettingsRef.current.volume);
    }}
    onChangeCapture={(event) => {
      if (!(event.target instanceof HTMLSelectElement)) return;
      unlockCombatAudio();
      playFamiliarInterfaceCue("select", !audioSettingsRef.current.muted, audioSettingsRef.current.volume);
    }}
  >
    <header className={styles.header} data-battle={Boolean(battle)}>
      <div>
        <small>Combattimenti tra Famigli</small>
        <h2>Arena del Nexus</h2>
        <p>Duelli progressivi, mosse personali e crescita di combattimento separata dall&apos;affetto.</p>
      </div>
      <div className={styles.headerActions}>
        <div className={styles.audioControls} aria-label="Audio del combattimento">
          <button type="button" aria-label={muted ? "Attiva audio" : "Disattiva audio"} title={muted ? "Attiva audio" : "Disattiva audio"} aria-pressed={muted} onClick={() => { setMuted((value) => !value); unlockCombatAudio(); }}>
            <Image className={styles.controlIcon} data-muted={muted} src="/famiglio/rebuild/combat/ui/control-audio.png" alt="" width={96} height={96} aria-hidden="true" />
            <span className={styles.controlLabel}>{muted ? "Audio spento" : "Audio attivo"}</span>
          </button>
          <label><span>Volume</span><input aria-label="Volume combattimento" type="range" min="0" max="1" step="0.05" value={volume} onChange={(event) => { setVolume(Number(event.target.value)); unlockCombatAudio(); }} /></label>
        </div>
        {battle ? <div className={styles.animationControls} aria-label="Controlli animazione">
          <button className={styles.speedControl} type="button" aria-label={`Velocità animazione ${animationSpeed}x`} title={`Velocità animazione ${animationSpeed}x`} onClick={() => setAnimationSpeed((value) => value === 1 ? 2 : 1)}>
            <Image className={styles.controlIcon} src="/famiglio/rebuild/combat/ui/control-speed.png" alt="" width={96} height={96} aria-hidden="true" /><small aria-hidden="true">{animationSpeed}x</small>
          </button>
          {animating ? <button type="button" aria-label="Salta animazione" title="Salta animazione" onClick={skipPresentation}><Image className={styles.controlIcon} src="/famiglio/rebuild/combat/ui/control-skip.png" alt="" width={96} height={96} aria-hidden="true" /></button> : null}
        </div> : null}
        <button className={styles.homeButton} type="button" disabled={animating || Boolean(battle)} title={battle ? "Concludi o abbandona il duello prima di rientrare" : undefined} onClick={onReturnHome}>Torna alla Casa</button>
      </div>
    </header>

    {!battle ? <div className={styles.progressRibbon}>
      <div><small>Famiglio</small><strong>{familiarName}</strong></div>
      <div><small>Combattimento</small><strong>Livello {progress.combatLevel}</strong></div>
      <div><small>Esperienza</small><strong>{levelProgress.required ? `${levelProgress.current}/${levelProgress.required} XP` : "Livello massimo"}</strong><span style={{ "--progress": `${levelProgress.percent}%` } as CSSProperties} /></div>
      <div><small>Incontri</small><strong>{progress.wins} V · {progress.losses} S</strong></div>
    </div> : null}

    {!battle ? <div className={styles.selectionViewport} data-step={setupTab}>
      <header className={styles.setupGuide}>
        <button type="button" className={styles.setupBack} onClick={goToPreviousSetupStep} disabled={setupStepIndex <= 0} aria-label="Torna al passaggio precedente" title="Indietro">&larr;</button>
        <div>
          <small>Preparazione battaglia</small>
          <strong>{setupSteps[setupStepIndex]?.label}</strong>
        </div>
        <ol aria-label={`Passaggio ${setupStepIndex + 1} di ${setupSteps.length}`}>
          {setupSteps.map((step, index) => <li key={step.id} data-current={index === setupStepIndex} data-complete={index < setupStepIndex}><span><Image src={step.icon} unoptimized alt="" width={128} height={128} aria-hidden="true" /></span><em>{step.label}</em></li>)}
        </ol>
        <button type="button" className={styles.setupHome} onClick={onReturnHome}>Casa</button>
      </header>

      {setupTab === "familiar" ? <section className={styles.playerSelector} aria-labelledby="player-selector-title">
        <header className={styles.setupHeading}>
          <div><small>La tua squadra</small><h3 id="player-selector-title">Scegli chi combatterà</h3></div>
          <span>{familiarOptions.length} Famigli disponibili · squadra {teamIds.length}/3</span>
        </header>
        <label className={styles.opponentDropdown}>
          <span>Famiglio combattente</span>
          <select value={familiarId} onChange={(event) => selectPreparedFamiliar(event.target.value)}>
            {familiarOptions.map((option) => <option key={option.id} value={option.id}>{option.name} · Lv {familiarCombatProgress(state, option.id).combatLevel}</option>)}
          </select>
        </label>
        <label className={styles.rosterSearch}>
          <span>Cerca nel roster</span>
          <input value={rosterQuery} onChange={(event) => { setRosterQuery(event.target.value); setRosterPage(0); }} placeholder="Nome del Famiglio" />
        </label>
        <div className={styles.familiarPickerLayout} data-single={familiarOptions.length === 1}>
          <div className={styles.familiarRosterPane}>
            <div className={styles.familiarRosterGrid} aria-label="Famigli selezionabili">
              {visibleFamiliarOptions.map((option) => {
                const optionProgress = familiarCombatProgress(state, option.id);
                const optionVisual = familiarHouseVisual(option.id);
                const inTeam = teamIds.includes(option.id);
                return <button type="button" key={option.id} data-selected={inTeam} aria-pressed={inTeam} onClick={() => option.id === familiarId ? undefined : toggleTeamMember(option.id)}>
                  <FamiglioCombatPreviewCanvas className={styles.familiarRosterCanvas} src={spritePath(option.id, option.growthStage, "idle", option.colorVariant)} label={option.name} naturalScale={optionVisual.scale} />
                  <span><strong>{option.name}</strong><small>{option.id === familiarId ? "Caposquadra" : inTeam ? "In squadra" : teamIds.length >= 3 ? "Squadra completa" : "Aggiungi"} · Lv {optionProgress.combatLevel}</small></span>
                </button>;
              })}
            </div>
            {!visibleFamiliarOptions.length ? <p className={styles.rosterEmpty}>Nessun Famiglio corrisponde alla ricerca.</p> : null}
            {rosterPageCount > 1 ? <nav className={styles.familiarPager} aria-label="Pagine del roster">
              <button type="button" disabled={safeRosterPage === 0} onClick={() => setRosterPage((page) => Math.max(0, page - 1))} aria-label="Pagina precedente">←</button>
              <span>{safeRosterPage + 1} / {rosterPageCount}</span>
              <button type="button" disabled={safeRosterPage >= rosterPageCount - 1} onClick={() => setRosterPage((page) => Math.min(rosterPageCount - 1, page + 1))} aria-label="Pagina successiva">→</button>
            </nav> : null}
          </div>
          <article className={styles.playerChoiceCard}>
            <div className={styles.playerChoicePortrait}>
              <FamiglioCombatPreviewCanvas className={styles.opponentPortraitCanvas} src={spritePath(familiarId, growthStage, "idle", colorVariant)} label={`Anteprima animata di ${familiarName}`} naturalScale={playerVisual.scale} />
            </div>
            <div className={styles.playerChoiceIdentity}><small>{RARITY_LABELS[playerEntry.rarity]}</small><h3>{familiarName}</h3><p>{titleCase(playerEntry.affinity)} · {titleCase(playerEntry.role)} · {stageLabel(growthStage)}</p></div>
            <StatGrid familiarId={familiarId} level={progress.combatLevel} />
            <div className={styles.playerChoiceMoves}><small>Mosse equipaggiate</small>{playerMoves.slice(0, 4).map((move) => <span key={move.id}>{move.name}</span>)}</div>
          </article>
        </div>
        <div className={styles.teamSummary} aria-label="Rosa per il 3 contro 3"><small>Squadra 3 contro 3</small><strong>{teamIds.map((id) => familiarOptions.find((option) => option.id === id)?.name ?? id).join(" · ")}</strong><span>{teamIds.length}/3</span></div>
        <button className={styles.setupContinue} type="button" onClick={() => setSetupTab("arenas")}>Conferma Famiglio</button>
      </section> : null}

      {setupTab === "arenas" ? <nav className={`${styles.circuitRail} ${styles.arenaCatalog}`} aria-label="Modalità e arene">
        <div className={styles.arenaCategoryTabs} role="tablist" aria-label="Categorie di combattimento">
          <button type="button" role="tab" aria-selected={arenaCategoryTab === "paths"} onClick={() => setArenaCategoryTab("paths")}>Campagna e Torre</button>
          <button type="button" role="tab" aria-selected={arenaCategoryTab === "team"} onClick={() => setArenaCategoryTab("team")}>3 contro 3</button>
          <button type="button" role="tab" aria-selected={arenaCategoryTab === "arenas"} onClick={() => setArenaCategoryTab("arenas")}>Arene</button>
          <button type="button" role="tab" aria-selected={arenaCategoryTab === "future"} onClick={() => setArenaCategoryTab("future")}>Prossimamente</button>
        </div>
        {arenaCategoryTab === "paths" ? <section className={styles.arenaCategory} aria-labelledby="story-modes-title">
          <header><small>Percorsi</small><h3 id="story-modes-title">Campagna e Torre</h3></header>
          <div className={styles.categoryCards}>
            <button type="button" className={styles.campaignChoice} onClick={chooseCampaign}>
              <span className={styles.campaignArtwork} aria-hidden="true"><Image src="/famiglio/rebuild/combat/campaign/arenas/05-trono-nulla-v1.webp" alt="" width={1600} height={900} unoptimized /></span>
              <span className={styles.circuitLabel}><strong>Campagna</strong><span>20 livelli · 5 capitoli</span></span>
            </button>
            <button type="button" className={styles.towerChoice} onClick={chooseTower}>
              <span className={styles.towerArtwork} aria-hidden="true"><Image src="/famiglio/rebuild/combat/ui/tower-nexus-icon-v1.webp" alt="" width={512} height={512} unoptimized /></span>
              <span className={styles.circuitLabel}><strong>Torre del Nexus</strong><span>10 piani · boss e ricompense</span></span>
            </button>
          </div>
        </section> : null}
        {arenaCategoryTab === "team" ? <section className={styles.arenaCategory} aria-labelledby="team-modes-title">
          <header><small>Squadre</small><h3 id="team-modes-title">Sfide e modalità</h3></header>
          <div className={styles.categoryCards}>
            <button type="button" className={styles.teamChoice} onClick={chooseTeamBattle}>
              <span className={styles.circuitThumb} style={{ backgroundImage: `url(${ARENA_BACKGROUNDS["grotte-celesti"]})` }} aria-hidden="true" />
              <span className={styles.circuitLabel}><strong>3 contro 3</strong><span>Rotazione tattica</span></span>
            </button>
          </div>
        </section> : null}
        {arenaCategoryTab === "arenas" ? <section className={`${styles.arenaCategory} ${styles.arenaCategoryWide}`} aria-labelledby="arenas-title">
          <header><small>Campi di lotta</small><h3 id="arenas-title">Arene e livelli</h3></header>
          <div className={styles.arenaCards}>
            {FAMILIAR_COMBAT_CIRCUITS.map((circuit) => {
              const unlocked = testMode || (progress.combatLevel >= circuit.minLevel && progress.wins >= circuit.unlockWins);
              return <button type="button" key={circuit.id} data-selected={circuit.id === selectedCircuit.id} aria-pressed={circuit.id === selectedCircuit.id} onClick={() => chooseCircuit(circuit.id)}>
                <span className={styles.circuitThumb} style={{ backgroundImage: `url(${ARENA_BACKGROUNDS[circuit.id] ?? circuit.backgroundSrc})` }} aria-hidden="true" />
                <span className={styles.circuitLabel}><strong>{circuit.name}</strong><span>Livelli {circuit.minLevel}–{circuit.maxLevel}{unlocked ? "" : ` · ${circuit.unlockWins} vittorie`}</span></span>
              </button>;
            })}
          </div>
        </section> : null}
        {arenaCategoryTab === "future" ? <section className={styles.arenaCategory} aria-labelledby="future-modes-title">
          <header><small>In preparazione</small><h3 id="future-modes-title">Nuove modalità</h3></header>
          <div className={styles.categoryCards}>
            <article className={styles.comingMode} data-theme="duo"><Image src={ARENA_BACKGROUNDS["grotte-celesti"]} alt="" unoptimized width={640} height={360}/><div><small>IN ARRIVO · SFIDE A SQUADRE</small><strong>Duello in coppia</strong><span>Due legami. Una sola squadra.</span></div></article>
            <article className={styles.comingMode} data-theme="event"><Image src={ARENA_BACKGROUNDS["soglia-leggendaria"] ?? ARENA_BACKGROUNDS["valle-titani"]} alt="" unoptimized width={640} height={360}/><div><small>IN ARRIVO · EVENTI SPECIALI</small><strong>Evento del Nexus</strong><span>Nuove sfide e ricompense stagionali.</span></div></article>
          </div>
        </section> : null}
      </nav> : null}

      {setupTab === "campaign" ? <section className={styles.campaignSetup} aria-labelledby="campaign-title">
        <header className={styles.setupHeading}>
          <div><small>Campagna del Legame Corrotto</small><h3 id="campaign-title">Venti soglie contro il Nulla</h3></div>
          <span>{progress.completedEncounters.filter((id) => id.startsWith("campaign-")).length}/20 completati</span>
        </header>
        <div className={styles.campaignMap}>
          {FAMILIAR_COMBAT_CAMPAIGN.map((level) => {
            const unlocked = familiarCampaignIsUnlocked(progress, level, testMode);
            const complete = familiarCampaignIsComplete(progress, level);
            const selected = selectedCampaignNumber === level.number;
            const levelState = complete ? "complete" : !unlocked ? "locked" : level.number === nextCampaignLevelNumber ? "current" : "available";
            const stateLabel = levelState === "complete" ? "completato" : levelState === "locked" ? "non disponibile" : levelState === "current" ? "prossimo livello" : "disponibile";
            return <button key={level.id} type="button" disabled={!unlocked} data-selected={selected} data-complete={complete} data-state={levelState} data-rank={level.npc.rank} aria-label={`Livello ${level.number}: ${level.title}, ${stateLabel}`} onClick={() => setSelectedCampaignNumber(level.number)}>
              <span>{String(level.number).padStart(2, "0")}</span><strong>{level.title}</strong><small>{level.npc.name}</small>
            </button>;
          })}
        </div>
        {selectedCampaignLevel ? <article className={styles.campaignBriefing} style={{ "--campaign-arena": `url(${selectedCampaignLevel.arenaSrc})` } as CSSProperties}>
          <div className={styles.campaignNpc}>
            <FamiglioCampaignNpcCanvas className={styles.campaignNpcCanvas} src={selectedCampaignLevel.npc.spriteSrc} hue={selectedCampaignLevel.npc.costumeHue} label={`${selectedCampaignLevel.npc.name}, ${selectedCampaignLevel.npc.title}`} />
            <span><strong>{selectedCampaignLevel.npc.name}</strong><small>{selectedCampaignLevel.npc.title}</small></span>
          </div>
          <div className={styles.comicBubble} role="note"><strong>{selectedCampaignLevel.npc.name}</strong><p>{selectedCampaignLevel.introLine}</p></div>
          <dl className={styles.campaignFacts}><div><dt>Livello</dt><dd>{selectedCampaignLevel.opponentLevel}</dd></div><div><dt>Difficoltà</dt><dd>{FAMILIAR_COMBAT_DIFFICULTIES.find((entry) => entry.id === selectedCampaignLevel.difficulty)?.label}</dd></div><div><dt>Capitolo</dt><dd>{selectedCampaignLevel.chapter}/5</dd></div></dl>
          <div className={styles.campaignObjective}>
            <small>Obiettivo dello scontro</small>
            <strong>{selectedCampaignLevel.objectiveLabel}</strong>
            <span>{/* In Resistenza il limite di turni è la condizione di vittoria, non una scadenza. */}{selectedCampaignLevel.turnLimit ? selectedCampaignLevel.objective === "resistenza" ? `Resisti ${selectedCampaignLevel.turnLimit} turni per vincere` : `${selectedCampaignLevel.turnLimit} turni massimi` : selectedCampaignLevel.bossPhases > 1 ? `${selectedCampaignLevel.bossPhases} fasi del comandante` : "Duello completo"}</span>
          </div>
          <button className={styles.setupContinue} type="button" disabled={!familiarCampaignIsUnlocked(progress, selectedCampaignLevel, testMode)} onClick={() => prepareCampaignLevel(selectedCampaignLevel)}>Prepara lo scontro</button>
        </article> : null}
      </section> : null}

      {setupTab === "opponents" ? <section className={styles.opponentSelector} aria-labelledby="opponent-roster-title">
        <header className={styles.opponentSelectorHeader}>
          <div>
            <small>Avversari del circuito</small>
            <h3 id="opponent-roster-title">Scegli il prossimo rivale</h3>
          </div>
          <span className={styles.rosterCount}><strong>{opponentRoster.length}</strong> Famigli disponibili</span>
        </header>
        <label className={styles.opponentDropdown}>
          <span>Famiglio avversario</span>
          <select value={safeOpponentId} onChange={(event) => setSelectedOpponentId(event.target.value)}>
            {opponentRoster.map(({ entry, preview, guardian }) => <option value={entry.id} key={entry.id}>{entry.name} · {RARITY_LABELS[entry.rarity]} · Lv {preview.level}{guardian ? " · Guardiano" : ""}</option>)}
          </select>
        </label>
        <div className={styles.opponentRail} aria-label={`Dettagli dell'avversario selezionato in ${selectedCircuit.name}`}>
          {opponentRoster.filter(({ entry }) => entry.id === safeOpponentId).map(({ entry, preview, visual, growthStage: opponentStage, guardian }) => <button
            type="button"
            key={entry.id}
            className={styles.opponentCard}
            data-selected={entry.id === safeOpponentId}
            data-rarity={entry.rarity}
            aria-pressed={entry.id === safeOpponentId}
            tabIndex={entry.id === safeOpponentId ? 0 : -1}
            aria-label={`${entry.name}, ${RARITY_LABELS[entry.rarity]}, affinità ${entry.affinity}, ruolo ${entry.role}, livello ${preview.level}, ${preview.stats.hp} HP, ${preview.stats.attack} attacco, ${preview.stats.defense} difesa, ${preview.stats.speed} velocità`}
            onClick={() => setSelectedOpponentId(entry.id)}
            onKeyDown={(event) => {
              if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
              const cards = Array.from(event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("button") ?? []);
              const currentIndex = cards.indexOf(event.currentTarget);
              if (currentIndex < 0 || !cards.length) return;
              event.preventDefault();
              const nextIndex = event.key === "Home"
                ? 0
                : event.key === "End"
                  ? cards.length - 1
                  : (currentIndex + (event.key === "ArrowRight" ? 1 : -1) + cards.length) % cards.length;
              const nextCard = cards[nextIndex];
              const nextOpponent = opponentRoster[nextIndex];
              if (nextCard && nextOpponent) {
                setSelectedOpponentId(nextOpponent.entry.id);
                nextCard.focus();
                nextCard.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
              }
            }}
          >
            <span className={styles.opponentCardTopline}>
              <span data-rarity={entry.rarity}>{RARITY_LABELS[entry.rarity]}</span>
              {guardian ? <strong>Guardiano</strong> : <span>Lv {preview.level}</span>}
            </span>
            <span className={styles.opponentIdentity}>
              <span className={styles.opponentPortrait}>
                <FamiglioCombatPreviewCanvas
                  className={styles.opponentPortraitCanvas}
                  src={spritePath(entry.id, opponentStage, "idle")}
                  label={`Anteprima animata di ${entry.name}`}
                  naturalScale={visual.scale}
                />
              </span>
              <span className={styles.opponentNameBlock}>
                <strong>{entry.name}</strong>
                <span>{titleCase(entry.affinity)} · {titleCase(entry.role)}</span>
                <small>Livello {preview.level}</small>
              </span>
            </span>
            <span className={styles.opponentStats} aria-label="Statistiche di combattimento">
              <span><small>HP</small><strong>{preview.stats.hp}</strong></span>
              <span><small>ATK</small><strong>{preview.stats.attack}</strong></span>
              <span><small>DEF</small><strong>{preview.stats.defense}</strong></span>
              <span><small>VEL</small><strong>{preview.stats.speed}</strong></span>
            </span>
            <span className={styles.opponentTactics}>
              <small>Stile di lotta</small>
              <strong>{ROLE_BATTLE_COPY[entry.role]}</strong>
            </span>
            <span className={styles.opponentMovesLabel}>Mosse previste</span>
            <span className={styles.opponentMoveChips}>
              {preview.moves.slice(0, 4).map((move) => <span key={move.id}>
                <strong>{move.name}</strong>
                <small className={styles.opponentMoveDescription}>{move.description}</small>
                <em>{moveCompactStats(move)}</em>
              </span>)}
            </span>
          </button>)}
        </div>
        <button className={styles.setupContinue} type="button" disabled={!safeOpponentId} onClick={() => setSetupTab("mode")}>Conferma rivale</button>
      </section> : null}

      {setupTab === "mode" ? <section className={styles.modeSetup} aria-labelledby="combat-mode-title">
        <header className={styles.setupHeading}>
          <div><small>Regole dell&apos;incontro</small><h3 id="combat-mode-title">Scegli la modalità</h3></div>
        </header>
        <div className={styles.modeGrid} aria-label="Difficoltà">
          {FAMILIAR_COMBAT_DIFFICULTIES.map((option) => {
            const unlocked = testMode || combatDifficultyIsUnlocked(progress, option.id);
            return <button type="button" key={option.id} aria-pressed={difficulty === option.id} data-selected={difficulty === option.id} disabled={!unlocked} onClick={() => { setDifficulty(option.id); setSetupTab("moves"); }}>
              <strong>{option.label}</strong>
              <span>{DIFFICULTY_COPY[option.id]}</span>
              <small>{unlocked ? "Disponibile" : "Non ancora disponibile"}</small>
            </button>;
          })}
        </div>
      </section> : null}

      {setupTab === "ready" ? <section className={styles.selectionGrid}>
        <article className={styles.challengePicker}>
          <div className={styles.pickerHeader}>
            <div><small>{battleFormat === "tower" ? `Torre · piano ${towerRun?.currentFloor ?? 1}/10` : battleFormat === "campaign" ? `Campagna · livello ${selectedCampaignLevel?.number ?? 1}/20` : teamBattle ? "Sfida a squadre" : "Sfida selezionata"}</small><h3>{teamBattle ? "3 contro 3" : opponentEntry?.name ?? "Nessun incontro"}</h3></div>
            <span>{testMode ? `${opponentIds.length} avversari di prova` : `${opponentIds.length} nel circuito`}</span>
          </div>
          {opponentEntry ? <div className={styles.duelPreview} style={{ backgroundImage: `url(${selectedCampaignLevel?.arenaSrc ?? activeTowerFloor?.backgroundSrc ?? ARENA_BACKGROUNDS[selectedCircuit.id] ?? selectedCircuit.backgroundSrc})` }}>
            <span className={styles.readyArenaPlate}>{selectedCampaignLevel?.title ?? selectedCircuit.name}</span>
            <div className={styles.previewFamiliar}><FamiglioCombatPreviewCanvas className={styles.previewFamiliarCanvas} src={spritePath(familiarId, growthStage, "idle", colorVariant)} label={familiarName} naturalScale={playerVisual.scale} /><strong>{familiarName}</strong></div>
            <b>VS</b>
            <div className={styles.previewFamiliar} data-side="opponent"><FamiglioCombatPreviewCanvas className={styles.previewFamiliarCanvas} src={spritePath(opponentEntry.id, opponentGrowthStage, "idle")} label={opponentEntry.name} naturalScale={opponentVisual.scale} flip /><strong>{opponentEntry.name}</strong></div>
          </div> : null}
          {opponentEntry ? <div className={styles.selectedOpponentMeta}>
            <span>{RARITY_LABELS[opponentEntry.rarity]}</span>
            <span>{titleCase(opponentEntry.affinity)}</span>
            <span>{titleCase(opponentEntry.role)}</span>
            <strong>Lv {proposedOpponentLevel}</strong>
          </div> : null}
          <div className={styles.readySummary}><span>Arena <strong>{selectedCircuit.name}</strong></span><span>Formato <strong>{teamBattle ? "3 contro 3" : "Duello"}</strong></span><span>Modalità <strong>{FAMILIAR_COMBAT_DIFFICULTIES.find((entry) => entry.id === difficulty)?.label}</strong></span><span>Mosse <strong>{playerMoves.length}/4</strong></span></div>
          {battleFormat === "tower" && towerRun ? <div className={styles.towerProgress} aria-label={`Piano ${towerRun.currentFloor} di 10`}>
            {towerRun.floors.map((floor) => <span key={floor.floor} data-current={floor.floor === towerRun.currentFloor} data-complete={floor.floor < towerRun.currentFloor} data-rank={floor.rank}>{floor.floor}</span>)}
          </div> : null}
          <button className={styles.startButton} type="button" disabled={activityGate?.allowed === false || !safeOpponentId || (teamBattle && teamIds.length < Math.min(3, familiarOptions.length)) || (battleFormat !== "campaign" && (!selectedCircuitUnlocked || !selectedDifficultyUnlocked))} onClick={beginBattle}>{activityGate?.allowed === false ? "Famiglio non pronto" : teamBattle && teamIds.length < Math.min(3, familiarOptions.length) ? "Completa la squadra" : battleFormat === "campaign" || (selectedCircuitUnlocked && selectedDifficultyUnlocked) ? teamBattle ? "Inizia il 3 contro 3" : "Inizia il duello" : "Sfida non ancora disponibile"}</button>
        </article>
      </section> : null}

      {setupTab === "moves" ? <section className={styles.combatDossiers} aria-label="Dossier dei combattenti">
        <article>
          <header><div><small>Il tuo Famiglio · {stageLabel(growthStage)}</small><h3>{familiarName}</h3></div><span data-rarity={playerEntry.rarity}>{RARITY_LABELS[playerEntry.rarity]}</span></header>
          <p>{titleCase(playerEntry.affinity)} · {titleCase(playerEntry.role)}</p>
          <StatGrid familiarId={familiarId} level={progress.combatLevel} />
          <div className={styles.loadout}>
            <strong>Quattro slot di combattimento</strong>
            {[0, 1, 2, 3].map((slot) => {
              const locked = slot >= learnedMoves.length;
              // Il motore tiene sempre equipaggiata la mossa base gratuita: il suo
              // slot resta fisso invece di far scegliere una sostituzione rifiutata.
              const equippedId = progress.equippedMoveIds[slot];
              const baseSlot = Boolean(equippedId && familiarCombatMoveIsBase(familiarId, equippedId));
              return <label key={slot} data-locked={locked} data-base={baseSlot} title={baseSlot ? "La mossa base resta sempre equipaggiata: garantisce un'azione gratuita in ogni turno." : undefined}><span>{baseSlot ? `Slot ${slot + 1} · Base fissa` : `Slot ${slot + 1}`}</span><select value={equippedId ?? ""} disabled={baseSlot || locked || !learnedMoves.length || slot > progress.equippedMoveIds.length} onChange={(event) => changeEquippedMove(slot, event.target.value)}><option value="" disabled>{locked ? "Mossa da sbloccare" : "Slot libero"}</option>{learnedMoves.map((move) => <option key={move.id} value={move.id}>{move.name}</option>)}</select></label>;
            })}
          </div>
          <details className={styles.moveArchive}><summary>Archivio mosse apprese ({learnedMoves.length})</summary>{learnedMoves.map((move) => <div key={move.id}><strong>{move.name}</strong><span>{moveSubtitle(move)}</span></div>)}</details>
        </article>
        {opponentEntry ? <article>
          <header><div><small>Avversario · Livello {proposedOpponentLevel}</small><h3>{opponentEntry.name}</h3></div><span data-rarity={opponentEntry.rarity}>{RARITY_LABELS[opponentEntry.rarity]}</span></header>
          <p>{titleCase(opponentEntry.affinity)} · {titleCase(opponentEntry.role)}</p>
          <StatGrid familiarId={opponentEntry.id} level={proposedOpponentLevel} previewStats={opponentPreview?.stats} />
          <div className={styles.moveList}><strong>Mosse osservabili</strong>{opponentMoves.slice(0, 4).map((move) => <div key={move.id}><span>{move.name}</span><small>{moveSubtitle(move)}</small></div>)}</div>
        </article> : null}
        <button className={styles.setupContinue} type="button" disabled={!progress.equippedMoveIds.length} onClick={() => setSetupTab("ready")}>Conferma le mosse</button>
      </section> : null}
    </div> : <section className={battleStyles.battleViewport} data-animating={animating}>
      <div className={battleStyles.battleColumn}>
        <div className={battleStyles.battleStage}>
          <div className={battleStyles.battleHud} data-side="player" data-critical={playerHpPercent <= 25}>
            <div className={battleStyles.fighterStatusTags} aria-label={`Stati di ${battlePlayerName}`}>
              {battle.player.statuses.map((status) => <span key={status.id}>{status.name}<small>{status.remainingTurns}t</small></span>)}
            </div>
            <div className={battleStyles.hudHeading}>
              <span><strong>{battlePlayerName}</strong><small>{titleCase(battlePlayerEntry?.affinity ?? "natura")} · {titleCase(battlePlayerEntry?.role ?? "assaltatore")}</small></span>
              <b>Lv {battle.player.level}</b>
            </div>
            <div className={battleStyles.hudHealth}>
              <span><Image className={battleStyles.resourceIcon} src="/famiglio/rebuild/combat/ui/battle-hp-icon-v1.png" alt="" width={64} height={64} unoptimized />HP</span><div><i style={{ width: `${playerHpPercent}%` }} /></div><strong>{Math.max(0, playerHp)} / {battle.player.maxHp}</strong>
            </div>
            <div className={battleStyles.hudEnergy}>
              <span><Image className={battleStyles.resourceIcon} src="/famiglio/rebuild/combat/ui/battle-energy-icon-v1.png" alt="" width={64} height={64} unoptimized />EN</span><div><i style={{ width: `${playerEnergyPercent}%` }} /></div><strong>{battle.player.energy} / {battle.player.maxEnergy}</strong>
            </div>
          </div>
          <div
            className={battleStyles.battleScene}
            style={{ backgroundImage: `url(${battleBackground})`, "--phase-duration": `${phaseDuration}ms` } as CSSProperties}
            aria-label={`${battleCircuit.name}: ${battlePlayerName} contro ${battleOpponentEntry?.name ?? "avversario"}`}
          >
            <FamiglioBattleCanvas
              className={battleStyles.battleCanvas}
              backgroundSrc={battleBackground}
              player={{
                id: battle.player.familiarId,
                name: battlePlayerName,
                spriteSrc: spritePath(battle.player.familiarId, battlePlayerOption?.growthStage ?? opponentStageForLevel(battle.player.level), playerBattlePose, battlePlayerOption?.colorVariant),
                naturalScale: playerVisual.scale,
              }}
              opponent={{
                id: battle.opponent.familiarId,
                name: battleOpponentEntry?.name ?? "Avversario",
                spriteSrc: spritePath(battle.opponent.familiarId, opponentGrowthStage, opponentBattlePose),
                naturalScale: opponentVisual.scale,
              }}
              event={currentEvent}
              cue={presentationCue}
              contactActors={contactActors}
              entering={entering}
              phaseDurationMs={phaseDuration}
              label={`${battleCircuit.name}: ${battlePlayerName} contro ${battleOpponentEntry?.name ?? "avversario"}`}
              opponentCorrupted={Boolean(battleCampaignLevel)}
              corruptionIntensity={battleCampaignLevel?.corruptionIntensity}
              campaignNpc={battleCampaignLevel ? { src: battleCampaignLevel.npc.spriteSrc, name: battleCampaignLevel.npc.name, pose: campaignNpcPose } : null}
            />
            <div className={battleStyles.arenaPlate}><small>{battleCampaignLevel?.title ?? battleCircuit.name}</small><strong>{/* Obiettivo a turni sempre visibile: "Resisti" vince allo scadere, "Rapidità" perde. */}{battle.maxTurns ? battleCampaignLevel?.objective === "resistenza" ? `Resisti · turno ${Math.min(battle.turn, battle.maxTurns)}/${battle.maxTurns}` : `Turno ${Math.min(battle.turn, battle.maxTurns)}/${battle.maxTurns}` : battleDifficultyLabel}</strong></div>
            {roundNotice === battle.turn && !initiativeOpen && !animating ? <div className={battleStyles.roundNotice} role="status"><small>{battle.bossPhasesTotal > 1 ? `Fase ${battle.bossPhasesTotal - battle.bossPhasesRemaining + 1}/${battle.bossPhasesTotal}` : "Round"}</small><strong>{battle.turn}</strong></div> : null}
          </div>
          <div className={battleStyles.battleHud} data-side="opponent" data-critical={opponentHpPercent <= 25}>
            <div className={battleStyles.fighterStatusTags} aria-label={`Stati di ${battleOpponentEntry?.name ?? "avversario"}`}>
              {battle.opponent.statuses.map((status) => <span key={status.id}>{status.name}<small>{status.remainingTurns}t</small></span>)}
            </div>
            <div className={battleStyles.hudHeading}>
              <span><strong>{battleOpponentEntry?.name}</strong><small>{titleCase(battleOpponentEntry?.affinity ?? "natura")} · {titleCase(battleOpponentEntry?.role ?? "assaltatore")}</small></span>
              <b>Lv {battle.opponent.level}</b>
            </div>
            <div className={battleStyles.hudHealth}>
              <span><Image className={battleStyles.resourceIcon} src="/famiglio/rebuild/combat/ui/battle-hp-icon-v1.png" alt="" width={64} height={64} unoptimized />HP</span><div><i style={{ width: `${opponentHpPercent}%` }} /></div><strong>{Math.max(0, opponentHp)} / {battle.opponent.maxHp}</strong>
            </div>
            <div className={battleStyles.hudEnergy}>
              <span><Image className={battleStyles.resourceIcon} src="/famiglio/rebuild/combat/ui/battle-energy-icon-v1.png" alt="" width={64} height={64} unoptimized />EN</span><div><i style={{ width: `${opponentEnergyPercent}%` }} /></div><strong>{battle.opponent.energy} / {battle.opponent.maxEnergy}</strong>
            </div>
          </div>
          <aside className={battleStyles.battleControls}>
        {battle.outcome === "active" ? <>
          <div className={battleStyles.battleUtilityDock}>
            <div className={battleStyles.battleUtilityTray} aria-label="Dettagli del combattimento">
              {/* L'intestazione dell'Arena (audio, velocità, salta) è nascosta in
                  battaglia: senza questi comandi il giocatore non poteva più
                  silenziare né accelerare o saltare le animazioni del turno. */}
              <button type="button" className={battleStyles.battleUtilityButton} data-control="audio" aria-label={muted ? "Attiva audio" : "Disattiva audio"} title={muted ? "Attiva audio" : "Disattiva audio"} aria-pressed={muted} onClick={() => { setMuted((value) => !value); unlockCombatAudio(); }}>
                <Image className={battleStyles.battleUtilityIcon} data-muted={muted} src="/famiglio/rebuild/combat/ui/control-audio.png" width={96} height={96} alt="" aria-hidden="true" />
              </button>
              <button type="button" className={battleStyles.battleUtilityButton} data-control="speed" aria-label={`Velocità animazione ${animationSpeed}x`} title={`Velocità animazione ${animationSpeed}x`} aria-pressed={animationSpeed === 2} onClick={() => setAnimationSpeed((value) => value === 1 ? 2 : 1)}>
                <Image className={battleStyles.battleUtilityIcon} src="/famiglio/rebuild/combat/ui/control-speed.png" width={96} height={96} alt="" aria-hidden="true" />
                <span aria-hidden="true">{animationSpeed}x</span>
              </button>
              <button type="button" className={battleStyles.battleUtilityButton} data-control="skip" aria-label="Salta animazione" title="Salta animazione" disabled={!animating} onClick={skipPresentation}>
                <Image className={battleStyles.battleUtilityIcon} src="/famiglio/rebuild/combat/ui/control-skip.png" width={96} height={96} alt="" aria-hidden="true" />
              </button>
              <button type="button" className={battleStyles.battleUtilityButton} aria-label="Apri gli stati attivi" aria-haspopup="dialog" onClick={() => setBattleInfoPanel("status")}>
                <Image className={battleStyles.battleUtilityIcon} src="/famiglio/rebuild/combat/ui/battle-status-icon-v1.png" width={64} height={64} unoptimized alt="" aria-hidden="true" />
                <span>{battle.player.statuses.length + battle.opponent.statuses.length}</span>
              </button>
              <button type="button" className={battleStyles.battleUtilityButton} aria-label="Apri la cronaca del combattimento" aria-haspopup="dialog" onClick={() => setBattleInfoPanel("log")}>
                <Image className={battleStyles.battleUtilityIcon} src="/famiglio/rebuild/combat/ui/battle-log-icon-v1.png" width={64} height={64} unoptimized alt="" aria-hidden="true" />
              </button>
            </div>
            <button
              className={battleStyles.retreatButton}
              type="button"
              disabled={animating}
              aria-label="Chiedi conferma per ritirarti"
              aria-haspopup="dialog"
              title="Ritirati dal duello"
              onClick={() => setRetreatConfirmOpen(true)}
            >
              <Image className={battleStyles.retreatIcon} src="/famiglio/rebuild/combat/ui/battle-retreat-icon-v2.png" width={96} height={96} unoptimized alt="" aria-hidden="true" />
            </button>
          </div>
          {battle.playerBench.length ? <div className={battleStyles.teamSwitchDock} aria-label="Rotazione della squadra">
            <span><small>Rotazione · {FAMILIAR_COMBAT_SWITCH_ENERGY_COST} EN</small><strong>{battle.switchCooldown > 0 ? `Disponibile tra ${battle.switchCooldown} turni` : battle.player.energy < FAMILIAR_COMBAT_SWITCH_ENERGY_COST ? "Energia insufficiente" : "Scegli chi entra"}</strong></span>
            <div>{battle.playerBench.map((member) => {
              const option = familiarOptions.find((entry) => entry.id === member.familiarId);
              const entry = familiarCombatEntry(member.familiarId);
              return <button type="button" key={member.familiarId} disabled={animating || member.hp <= 0 || battle.switchCooldown > 0 || battle.player.energy < FAMILIAR_COMBAT_SWITCH_ENERGY_COST} onClick={() => rotateCombatant(member.familiarId)}>
                <FamiglioCombatPreviewCanvas className={battleStyles.teamSwitchPortrait} src={spritePath(member.familiarId, option?.growthStage ?? opponentStageForLevel(member.level), "idle", option?.colorVariant)} label={entry?.name ?? member.familiarId} naturalScale={familiarHouseVisual(member.familiarId).scale} />
                <span><strong>{entry?.name ?? member.familiarId}</strong><small>{member.hp}/{member.maxHp} HP</small></span>
              </button>;
            })}</div>
          </div> : null}
          {battle.opponentBench.length ? <div className={battleStyles.opponentTeamDock} aria-label="Squadra rivale">
            <span><small>Squadra rivale</small><strong>{1 + battle.opponentBench.filter((member) => member.hp > 0).length} ancora in lotta</strong></span>
            <div>{battle.opponentBench.map((member) => {
              const entry = familiarCombatEntry(member.familiarId);
              return <span key={member.familiarId} data-defeated={member.hp <= 0}>
                <FamiglioCombatPreviewCanvas className={battleStyles.teamSwitchPortrait} src={spritePath(member.familiarId, opponentStageForLevel(member.level), "idle")} label={entry?.name ?? member.familiarId} naturalScale={familiarHouseVisual(member.familiarId).scale} flip />
                <small>{entry?.name ?? member.familiarId} · {member.hp}/{member.maxHp} HP</small>
              </span>;
            })}</div>
          </div> : null}
          <div className={battleStyles.battleMoveGrid}>
            {[0, 1, 2, 3].map((index) => {
              const move = playerMoves[index];
              const uses = move ? (battle.player.moveUses[move.id] ?? familiarCombatMoveMaxUses(move.id)) : 0;
              const maxUses = move ? familiarCombatMoveMaxUses(move.id) : 0;
              const energyCost = move ? familiarCombatMoveEnergyCost(battle.player.familiarId, move.id) : 0;
              const energyLocked = Boolean(move && battle.player.energy < energyCost);
              const baseMove = Boolean(move && familiarCombatMoveIsBase(battle.player.familiarId, move.id));
              const cooldownLocked = Boolean(move && !baseMove && battle.lastPlayerMoveId === move.id && familiarCombatMoveHasCooldown(move.id));
              const effectiveness = move && battleOpponentEntry
                ? affinityMultiplier(move.affinity, battleOpponentEntry.affinity)
                : 1;
              const effectivenessLabel = effectiveness > 1 ? "Efficace" : effectiveness < 1 ? "Resistita" : "Neutrale";
              const damagePreview = move ? familiarCombatDamagePreview(battle.player, battle.opponent, move.id) : 0;
              const repetitionLocked = Boolean(move && !baseMove && battle.lastPlayerMoveId === move.id && battle.playerMoveStreak >= 2);
              const usesLocked = Boolean(move && maxUses > 0 && uses <= 0);
              const availabilityLabel = !move
                ? "Continua a combattere per apprenderla"
                : usesLocked
                  ? "Utilizzi terminati"
                  : energyLocked
                    ? `Energia insufficiente · servono ${energyCost} EN`
                    : cooldownLocked
                      ? "In ricarica · scegli un'altra mossa"
                      : repetitionLocked
                        ? "Limite raggiunto · scegli un'altra mossa"
                        : `${energyCost === 0 ? "Base · gratis" : `${energyCost} EN`} · ${effectivenessLabel}${damagePreview ? ` · ~${damagePreview} danni` : ""} · ${maxUses > 0 ? `Usi ${uses}/${maxUses}` : "Usi illimitati"}`;
              const ready = Boolean(move && !usesLocked && !energyLocked && !cooldownLocked && !repetitionLocked);
              // Su touch il title non si vede: il motivo del blocco sostituisce l'etichetta del tipo.
              const blockedReason = !move ? null : usesLocked ? "Usi finiti" : energyLocked ? `Servono ${energyCost} EN` : cooldownLocked ? "In ricarica" : repetitionLocked ? "Cambia mossa" : null;
              const visual = move ? moveVisual(move) : null;
              return <article className={battleStyles.battleMoveCommand} key={move?.id ?? `locked-${index}`} data-ready={ready} data-kind={visual?.kind ?? "locked"}>
                <button
                  className={battleStyles.moveAction}
                  type="button"
                  disabled={animating || !ready}
                  data-kind={move?.damageClass ?? "locked"}
                  data-energy-cost={energyCost}
                  data-cooldown-locked={cooldownLocked}
                  data-repetition-locked={repetitionLocked}
                  onClick={() => move && performSelectedMove(move.id)}
                  title={move ? `${move.name}: ${availabilityLabel}` : undefined}
                  aria-label={move ? `${move.name}, ${visual?.label ?? ""}: ${availabilityLabel}` : "Mossa da sbloccare"}
                >
                  <small>{String(index + 1).padStart(2, "0")}</small>
                  <strong><span>{move?.name ?? "Mossa da sbloccare"}</span>{visual ? <em className={`${battleStyles.moveKindLabel} ${blockedReason ? battleStyles.moveBlockedReason : ""}`}>{blockedReason ?? visual.label}</em> : null}</strong>
                </button>
                <button
                  className={battleStyles.moveInfoButton}
                  type="button"
                  disabled={!move}
                  aria-label={move ? `Informazioni sulla mossa ${move.name}` : "Mossa non ancora sbloccata"}
                  onClick={() => move && setSelectedMoveInfoId(move.id)}
                >{move ? "INFO" : "—"}</button>
              </article>;
            })}
          </div>
        </> : null}
          </aside>
          {initiativeOpen && battle.initiative ? <section className={`${battleStyles.battleInfoOverlay} ${battleStyles.initiativeOverlay}`} role="dialog" aria-modal="true" aria-labelledby="initiative-title">
            <article className={`${battleStyles.battleInfoCard} ${battleStyles.initiativeCard}`}>
              <header><span><small>Inizio del duello</small><h2 id="initiative-title">{"Tiro d'iniziativa"}</h2></span></header>
              <p>Ogni Famiglio lancia due dadi. Il totale più alto ottiene il primo attacco.</p>
              <div className={battleStyles.initiativeContest}>
                {[
                  { key: "player", name: battlePlayerName, dice: battle.initiative.playerDice, total: battle.initiative.playerTotal, critical: battle.initiative.playerCritical },
                  { key: "opponent", name: battleOpponentEntry?.name ?? "Avversario", dice: battle.initiative.opponentDice, total: battle.initiative.opponentTotal, critical: battle.initiative.opponentCritical },
                ].map((roll) => <section key={roll.key} data-winner={battle.initiative?.first === roll.key}>
                  <strong>{roll.name}</strong>
                  <div><InitiativeDie value={roll.dice[0]} /><InitiativeDie value={roll.dice[1]} /></div>
                  <span>Totale <b>{roll.total}</b></span>
                  {roll.critical ? <em>Doppio: primo colpo critico</em> : null}
                </section>)}
              </div>
              <p className={battleStyles.initiativeResult}><strong>{battle.initiative.first === "player" ? battlePlayerName : battleOpponentEntry?.name}</strong> attacca per primo.</p>
              <button className={battleStyles.initiativeContinue} type="button" onClick={() => {
                setInitiativeBattleId(null);
              }}>{"Entra nell'Arena"}</button>
            </article>
          </section> : null}
          {battle.outcome === "active" && battleInfoPanel ? <section className={battleStyles.battleInfoOverlay} role="dialog" aria-modal="true" aria-labelledby="battle-info-title">
            <article className={battleStyles.battleInfoCard} data-panel={battleInfoPanel}>
              <header>
                <span><small>ROUND {battle.turn}</small><h2 id="battle-info-title">{battleInfoPanel === "status" ? "Stati del combattimento" : "Cronaca dell'incontro"}</h2></span>
                <button type="button" onClick={() => setBattleInfoPanel(null)} aria-label="Chiudi la scheda">Chiudi</button>
              </header>
              {battleInfoPanel === "status" ? <div className={battleStyles.battleStatusDossier}>
                {[
                  { actor: battle.player, name: battlePlayerName, hp: Math.max(0, playerHp) },
                  { actor: battle.opponent, name: battleOpponentEntry?.name ?? "Avversario", hp: Math.max(0, opponentHp) },
                ].map(({ actor, name, hp }) => <section key={actor.familiarId}>
                  <header><strong>{name}</strong><span>{hp}/{actor.maxHp} HP · {actor.energy}/{actor.maxEnergy} EN</span></header>
                  {actor.statuses.length ? <div>{actor.statuses.map((status) => <article key={status.id} data-status={status.id}>
                    <strong>{STATUS_LABELS[status.id] ?? status.name}</strong>
                    <span>{status.remainingTurns} {status.remainingTurns === 1 ? "round restante" : "round restanti"}</span>
                    <p>{STATUS_DETAILS[status.id] ?? "Effetto temporaneo applicato durante il combattimento."}</p>
                    <small>Intensità {status.potency}%</small>
                  </article>)}</div> : <p className={battleStyles.noBattleStatus}>Nessuno stato attivo. Il Famiglio può agire normalmente.</p>}
                </section>)}
              </div> : <div className={battleStyles.battleChronicle} aria-live="polite">
                <p>Ultimi eventi registrati, dal meno recente al più recente.</p>
                <ol>{battle.log.slice(-8).map((line, index) => <li key={`${battle.turn}-${index}`}><span>{String(index + 1).padStart(2, "0")}</span><strong>{combatText(line)}</strong></li>)}</ol>
              </div>}
            </article>
          </section> : null}
          {battle.outcome === "active" && selectedMoveInfo ? <section className={battleStyles.battleInfoOverlay} role="dialog" aria-modal="true" aria-labelledby="move-info-title">
            <article className={`${battleStyles.battleInfoCard} ${battleStyles.moveInfoCard}`} data-panel="move">
              <header>
                <span><small>Scheda mossa</small><h2 id="move-info-title">{selectedMoveInfo.name}</h2></span>
                <button type="button" onClick={() => setSelectedMoveInfoId(null)} aria-label="Chiudi le informazioni sulla mossa">Chiudi</button>
              </header>
              <div className={battleStyles.moveInfoIntro}>
                <div className={battleStyles.movePreviewStage} style={{ backgroundImage: `url(${battleBackground})` }}>
                  <FamiglioCombatPreviewCanvas
                    key={`${battle.player.familiarId}-${selectedMoveInfo.id}`}
                    className={battleStyles.movePreviewCanvas}
                    src={spritePath(battle.player.familiarId, battlePlayerOption?.growthStage ?? opponentStageForLevel(battle.player.level), moveVisual(selectedMoveInfo).pose, battlePlayerOption?.colorVariant)}
                    label={`${battlePlayerName} esegue ${selectedMoveInfo.name}`}
                    naturalScale={playerVisual.scale}
                    fps={4}
                  />
                </div>
                <p className={battleStyles.moveInfoDescription}>{selectedMoveInfo.description}</p>
              </div>
              <dl className={battleStyles.moveInfoStats}>
                <div><dt>Categoria</dt><dd>{selectedMoveInfo.damageClass === "physical" ? "Fisica" : selectedMoveInfo.damageClass === "magic" ? "Magica" : selectedMoveInfo.damageClass === "restore" ? "Cura" : "Stato"}</dd></div>
                <div><dt>Affinità</dt><dd>{titleCase(selectedMoveInfo.affinity)}</dd></div>
                <div><dt>Energia</dt><dd>{familiarCombatMoveEnergyCost(battle.player.familiarId, selectedMoveInfo.id)} EN</dd></div>
                <div><dt>Potenza</dt><dd>{selectedMoveInfo.power || "—"}</dd></div>
                <div><dt>Precisione</dt><dd>{selectedMoveInfo.accuracy}%</dd></div>
                <div><dt>Priorità</dt><dd>{selectedMoveInfo.priority > 0 ? `+${selectedMoveInfo.priority}` : selectedMoveInfo.priority}</dd></div>
                <div><dt>Effetto</dt><dd>{selectedMoveInfo.status ? `${STATUS_LABELS[selectedMoveInfo.status] ?? titleCase(selectedMoveInfo.status)} ${selectedMoveInfo.statusChance ?? 100}%` : selectedMoveInfo.healingRatio ? `Cura ${Math.round(selectedMoveInfo.healingRatio * 100)}% HP` : "Danno diretto"}</dd></div>
                <div><dt>Utilizzi</dt><dd>{familiarCombatMoveMaxUses(selectedMoveInfo.id) > 0 ? `${battle.player.moveUses[selectedMoveInfo.id] ?? 0}/${familiarCombatMoveMaxUses(selectedMoveInfo.id)}` : "Illimitati"}</dd></div>
              </dl>
              <section className={battleStyles.moveInfoRules}>
                <h3>Regole durante il duello</h3>
                <p>{moveSubtitle(selectedMoveInfo)}.</p>
                <p>La stessa mossa speciale non può essere usata più di due volte consecutive. Le mosse con ricarica richiedono una scelta diversa prima di tornare disponibili.</p>
              </section>
            </article>
          </section> : null}
          {battle.outcome === "active" && retreatConfirmOpen ? <section className={battleStyles.battleInfoOverlay} role="dialog" aria-modal="true" aria-labelledby="retreat-confirm-title">
            <article className={`${battleStyles.battleInfoCard} ${battleStyles.retreatConfirmCard}`}>
              <Image className={battleStyles.retreatConfirmIcon} src="/famiglio/rebuild/combat/ui/battle-retreat-icon-v2.png" width={192} height={192} unoptimized alt="" aria-hidden="true" />
              <small>Abbandona il duello</small>
              <h2 id="retreat-confirm-title">Vuoi davvero ritirarti?</h2>
              <p>La battaglia terminerà come ritirata: nessuna sconfitta verrà registrata e non perderai oggetti, ma non riceverai esperienza o ricompense.</p>
              <div className={battleStyles.retreatConfirmActions}>
                <button type="button" onClick={() => setRetreatConfirmOpen(false)}>Continua a combattere</button>
                <button type="button" data-danger="true" onClick={leaveBattle}>Conferma ritiro</button>
              </div>
            </article>
          </section> : null}
        </div>
        <div className={battleStyles.turnBanner}><strong>{currentEvent ? combatText(currentEvent.message) : (entering ? "I Famigli entrano nell'Arena." : "Scegli una mossa.")}</strong></div>
      </div>
    </section>}

    {!animating && battle && battle.outcome !== "active" ? <section className={battleStyles.resultOverlay} data-outcome={battle.outcome} role="dialog" aria-modal="true" aria-labelledby="battle-result-title">
      <article className={battleStyles.resultScreen}>
        <div className={battleStyles.resultAura} aria-hidden="true"><span /></div>
        <small>{battle.outcome === "victory" ? (battleCampaignLevel?.objective === "resistenza" && battle.maxTurns && battle.turn >= battle.maxTurns ? "Obiettivo Resistenza completato" : "Trionfo del Legame") : battle.outcome === "retreat" ? "Rientro al sicuro" : "Il Legame non si spezza"}</small>
        <h2 id="battle-result-title">{battle.outcome === "victory" ? "Vittoria!" : battle.outcome === "retreat" ? "Ritirata" : "Sconfitta"}</h2>
        {battle.outcome === "retreat" ? <p className={battleStyles.retreatResultMessage}>Ti sei ritirato: nessuna sconfitta registrata.</p> : battleCampaignLevel ? <div className={battleStyles.resultDialogue}>
          <FamiglioCampaignNpcCanvas className={battleStyles.resultNpcCanvas} src={battleCampaignLevel.npc.spriteSrc} hue={battleCampaignLevel.npc.costumeHue} pose={battle.outcome === "victory" ? "defeat" : "victory"} label={battleCampaignLevel.npc.name} />
          <div className={battleStyles.comicBubble}><strong>{battleCampaignLevel.npc.name}</strong><p>{battle.outcome === "victory" ? battleCampaignLevel.victoryLine : battleCampaignLevel.defeatLine}</p></div>
        </div> : <p>{battle.outcome === "victory" ? (battleFormat === "tower" && towerRun ? `${familiarName} ha superato il piano ${towerRun.currentFloor} della Torre.` : `${familiarName} ha dominato l'Arena.`) : `${familiarName} è al sicuro e può prepararsi alla rivincita.`}</p>}
        <div className={battleStyles.resultFamiliar} data-outcome={battle.outcome} aria-label={battle.outcome === "victory" ? "Santuario della vittoria" : "Santuario della rivincita"}>
          <FamiglioCombatPreviewCanvas
            className={battleStyles.resultFamiliarCanvas}
            src={spritePath(familiarId, growthStage, battle.outcome === "victory" ? "victory" : battle.outcome === "retreat" ? "idle" : "exhausted", colorVariant)}
            label={`${familiarName}: ${battle.outcome === "victory" ? "vittoria" : battle.outcome === "retreat" ? "ritirata" : "sconfitta"}`}
            naturalScale={playerVisual.scale}
          />
        </div>
        {state.pendingReward ? <dl className={battleStyles.resultRewards}>
          <div><dt>XP</dt><dd>+{state.pendingReward.combatXp}</dd></div>
          <div><dt>Monete</dt><dd>+{state.pendingReward.nexusCoins}</dd></div>
          <div><dt>Sigilli</dt><dd>+{state.pendingReward.nightSigils}</dd></div>
          <div><dt>Frammenti</dt><dd>+{state.pendingReward.relicFragments}</dd></div>
        </dl> : <div className={battleStyles.defeatMessage}>{battle.outcome === "victory" ? "Esperienza acquisita · ricompensa di questo incontro già ottenuta" : battle.outcome === "retreat" ? "Nessuna sconfitta nel record · nessuna esperienza o ricompensa" : "Nessun oggetto perso"}</div>}
        <div className={battleStyles.resultActions}>
          {battle.outcome === "victory"
            ? <button type="button" onClick={collectReward}>{/* Nessun "Raccogli" quando il motore non ha creato una ricompensa (incontro già vinto, anche da un piano della Torre con lo stesso rivale). */}{battleFormat === "tower" && towerRun?.currentFloor !== 10 ? (state.pendingReward ? "Raccogli · prossimo piano" : "Prossimo piano") : state.pendingReward ? "Raccogli e continua" : "Continua"}</button>
            : <button type="button" onClick={rematch}>Rivincita</button>}
          <button type="button" onClick={finishBattleAtHome}>Torna alla Casa</button>
        </div>
      </article>
    </section> : null}

    <footer className={battle ? battleStyles.message : styles.message} aria-live="polite">
      <span>{audioUnlocked ? (muted ? "Audio disattivato" : "Audio pronto") : "L'audio si attiva al primo comando"}</span>
      <strong>{combatText(currentEvent?.message ?? localMessage ?? state.lastMessage)}</strong>
    </footer>
  </section>;
}
