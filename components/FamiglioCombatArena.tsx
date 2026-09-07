"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type Dispatch, type SetStateAction } from "react";
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
  familiarCombatLevelProgress,
  familiarCombatOpponentPreview,
  familiarCombatOpponents,
  familiarCombatProgress,
  performFamiliarCombatTurn,
  retreatFromFamiliarCombat,
  startFamiliarCombatBattle,
  type FamiliarCombatDifficulty,
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

function combatText(value: string) {
  return LOCALIZED_FAMILIARS.reduce((text, familiar) => text.replaceAll(familiar.id, familiar.name), value);
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
  const assetRevision = familiarId === "fiddle-dog" ? "?v=3" : "";
  return `/famiglio/rebuild/collection/${familiarId}/growth/${growthStage}/battle-v2${variantSegment}/${pose}.png${assetRevision}`;
}

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));
}

function InitiativeDie({ value }: { value: number }) {
  const safeValue = Math.min(6, Math.max(1, Math.round(value)));
  return <span
    className={styles.initiativeDie}
    style={{ "--die-position": `${(safeValue - 1) * 20}%` } as CSSProperties}
    role="img"
    aria-label={`Dado: ${safeValue}`}
  />;
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
  resultOutcome: "active" | "victory" | "defeat",
  entering: boolean,
) {
  if (!event) {
    if (entering) return "entrance";
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
  if (event.phase === "windup") return event.actionKind === "physical" ? "attack" : "technique";
  if (event.phase === "projectile") return "magic";
  if (event.phase === "impact") return event.actionKind === "physical" ? "physical" : "idle";
  if (event.phase === "status") return ["status", "heal"].includes(event.actionKind) ? "technique" : "idle";
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
  const [familiarPage, setFamiliarPage] = useState(0);
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
  const [battleFormat, setBattleFormat] = useState<"duel" | "tower" | "campaign">("duel");
  const [selectedCampaignNumber, setSelectedCampaignNumber] = useState(1);
  const [towerRun, setTowerRun] = useState<FamiliarTowerRun | null>(null);
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

  const opponentIds = useMemo(
    () => familiarCombatOpponents(familiarId, testMode ? undefined : selectedCircuit.id),
    [familiarId, selectedCircuit.id, testMode],
  );
  const familiarsPerPage = 8;
  const familiarPageCount = Math.max(1, Math.ceil(familiarOptions.length / familiarsPerPage));
  const visibleFamiliarOptions = familiarOptions.slice(familiarPage * familiarsPerPage, (familiarPage + 1) * familiarsPerPage);
  const selectPreparedFamiliar = (nextFamiliarId: string) => {
    const selectedIndex = familiarOptions.findIndex((entry) => entry.id === nextFamiliarId);
    if (selectedIndex >= 0) setFamiliarPage(Math.floor(selectedIndex / familiarsPerPage));
    onSelectFamiliar(nextFamiliarId);
  };
  const activeTowerFloor = battleFormat === "tower" ? familiarTowerFloor(towerRun) : null;
  const selectedCampaignLevel = battleFormat === "campaign" ? FAMILIAR_COMBAT_CAMPAIGN[selectedCampaignNumber - 1] ?? FAMILIAR_COMBAT_CAMPAIGN[0] : null;
  const nextCampaignLevelNumber = FAMILIAR_COMBAT_CAMPAIGN.find((level) => !familiarCampaignIsComplete(progress, level))?.number ?? 20;
  const selectedCampaignOpponentId = selectedCampaignLevel ? familiarCampaignOpponent(selectedCampaignLevel, familiarId) : null;
  const safeOpponentId = selectedCampaignOpponentId ?? activeTowerFloor?.opponentId ?? (opponentIds.includes(selectedOpponentId) ? selectedOpponentId : opponentIds[0] ?? "");
  const opponentEntry = familiarCombatEntry(safeOpponentId);
  const opponentPreview = safeOpponentId ? familiarCombatOpponentPreview({
    playerId: familiarId,
    opponentId: safeOpponentId,
    circuitId: selectedCircuit.id,
    difficulty,
    opponentLevel: selectedCampaignLevel?.opponentLevel ?? activeTowerFloor?.opponentLevel ?? (testMode ? progress.combatLevel : undefined),
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
  const playerMoves = progress.equippedMoveIds.map(combatMoveById).filter((move): move is CombatMove => Boolean(move));
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
  const playerVisual = familiarHouseVisual(familiarId);
  const opponentVisual = familiarHouseVisual(battle?.opponent.familiarId ?? safeOpponentId);
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

  useEffect(() => {
    if (!battle || battle.outcome !== "active") return;
    const show = window.setTimeout(() => setRoundNotice(battle.turn), 0);
    const timer = window.setTimeout(() => setRoundNotice((current) => current === battle.turn ? null : current), 1250);
    return () => { window.clearTimeout(show); window.clearTimeout(timer); };
  }, [battle]);

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
      await wait(Math.max(140, cue.durationMs / animationSpeed));
    }
    if (sequenceRef.current !== sequence) return;
    setCurrentEvent(null);
    setContactActors([]);
    const resolved = nextState.activeBattle;
    if (resolved) setVisibleHealth({ battleId: resolved.id, player: resolved.player.hp, opponent: resolved.opponent.hp });
    pendingPresentationStateRef.current = null;
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

  const chooseTower = () => {
    towerRunSerialRef.current += 1;
    const run = createFamiliarTowerRun(familiarId, progress.combatLevel, `${state.seed}:${progress.battlesCompleted}:${towerRunSerialRef.current}`);
    const floor = familiarTowerFloor(run);
    if (!floor) return;
    setBattleFormat("tower");
    setTowerRun(run);
    setSelectedCircuitId(floor.circuitId);
    setSelectedOpponentId(floor.opponentId);
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
    setSetupTab("moves");
  };

  const setupSteps: readonly { id: ArenaSetupTab; label: string; icon: string }[] = [
    { id: "familiar", label: "Famiglio", icon: "/famiglio/rebuild/combat/ui/step-famiglio.png" },
    { id: "arenas", label: battleFormat === "tower" ? "Torre" : battleFormat === "campaign" ? "Campagna" : "Arena", icon: "/famiglio/rebuild/combat/ui/step-arena.png" },
    ...(battleFormat === "campaign" ? [{ id: "campaign" as const, label: "Storia", icon: "/famiglio/rebuild/combat/ui/step-rivale.png" }] : battleFormat === "tower" ? [] : [{ id: "opponents" as const, label: "Rivale", icon: "/famiglio/rebuild/combat/ui/step-rivale.png" }]),
    ...(battleFormat === "campaign" ? [] : [{ id: "mode" as const, label: "Modalita", icon: "/famiglio/rebuild/combat/ui/step-modalita.png" }]),
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
      setLocalMessage(activityGate.reason ?? "Il Famiglio non e pronto a combattere.");
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
      opponentId,
      circuitId,
      difficulty: campaignLevel?.difficulty ?? difficulty,
      opponentLevel: campaignLevel?.opponentLevel ?? towerFloor?.opponentLevel ?? (testMode ? progress.combatLevel : undefined),
      encounterId: campaignLevel?.id ?? (towerFloor ? `${towerRun?.id}:floor-${towerFloor.floor}` : undefined),
      ignoreUnlocks: testMode || Boolean(towerFloor) || Boolean(campaignLevel),
      playerStatBonus,
      playerEvolutionPath,
      maxTurns: campaignLevel?.turnLimit ?? null,
      bossPhases: campaignLevel?.bossPhases ?? 1,
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

  const performSelectedMove = (moveId: string) => {
    if (animating || !battle || battle.outcome !== "active") return;
    setInitiativeBattleId(null);
    const currentBattle = state.activeBattle;
    if (!currentBattle) return;
    unlockCombatAudio();
    const result = performFamiliarCombatTurn(state, moveId);
    if (!result.ok) {
      setLocalMessage(result.error);
      return;
    }
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
    if (!state.pendingReward) {
      setLocalMessage(null);
      setState(closeFamiliarCombatBattle(state));
      return;
    }
    const result = claimFamiliarCombatReward(state);
    if (!result.ok) {
      setLocalMessage(result.error);
      setState(closeFamiliarCombatBattle(result.state));
      return;
    }
    setLocalMessage(null);
    onReward(result.reward);
    onMissionActivity?.("familiar_battle", result.reward.battleId);
    if (battleFormat === "tower" && towerRun) onMissionActivity?.("familiar_tower_floor", `${towerRun.id}:floor-${towerRun.currentFloor}`);
    const cleared = closeFamiliarCombatBattle(result.state);
    if (battleFormat === "tower" && towerRun) {
      const nextRun = advanceFamiliarTower(towerRun);
      if (nextRun) {
        const floor = familiarTowerFloor(nextRun);
        setTowerRun(nextRun);
        if (floor) {
          setSelectedCircuitId(floor.circuitId);
          setSelectedOpponentId(floor.opponentId);
        }
        setSetupTab("ready");
      } else {
        setTowerRun(null);
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
      }
      setSetupTab("campaign");
    }
    setState(cleared);
  };

  const finishBattleAtHome = () => {
    sequenceRef.current += 1;
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
    if (!state.pendingReward && battle) onMissionActivity?.("familiar_battle", battle.id);
    setState(closeFamiliarCombatBattle(nextState));
    onReturnHome();
  };

  const rematch = () => {
    if (!battle || battle.outcome !== "defeat") return;
    onMissionActivity?.("familiar_battle", battle.id);
    const clearedState = closeFamiliarCombatBattle(state);
    const result = startFamiliarCombatBattle(clearedState, {
      playerId: familiarId,
      opponentId: battle.opponent.familiarId,
      circuitId: battle.circuitId,
      difficulty: battle.difficulty,
      opponentLevel: battle.opponent.level,
      ignoreUnlocks: testMode || battleFormat === "tower",
      playerStatBonus,
      playerEvolutionPath,
      maxTurns: battleCampaignLevel?.turnLimit ?? battle.maxTurns,
      bossPhases: battleCampaignLevel?.bossPhases ?? battle.bossPhasesTotal,
    });
    if (!result.ok) {
      setLocalMessage(result.error);
      setState(clearedState);
      return;
    }
    const started = result.state.activeBattle;
    if (started) setVisibleHealth({ battleId: started.id, player: started.player.hp, opponent: started.opponent.hp });
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
    if (!animating || currentEvent || presentationBattle) return;
    const unlock = window.setTimeout(() => setAnimating(false), 0);
    return () => window.clearTimeout(unlock);
  }, [animating, currentEvent, presentationBattle]);

  const selectedCircuitUnlocked = testMode || (progress.combatLevel >= selectedCircuit.minLevel && progress.wins >= selectedCircuit.unlockWins);
  const selectedDifficultyUnlocked = testMode || combatDifficultyIsUnlocked(progress, difficulty);

  return <section
    className={styles.combat}
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
          <button className={styles.speedControl} type="button" aria-label={`Velocita animazione ${animationSpeed}x`} title={`Velocita animazione ${animationSpeed}x`} onClick={() => setAnimationSpeed((value) => value === 1 ? 2 : 1)}>
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
          {setupSteps.map((step, index) => <li key={step.id} data-current={index === setupStepIndex} data-complete={index < setupStepIndex}><span><Image src={step.icon} alt="" width={128} height={128} aria-hidden="true" /></span><em>{step.label}</em></li>)}
        </ol>
        <button type="button" className={styles.setupHome} onClick={onReturnHome}>Casa</button>
      </header>

      {setupTab === "familiar" ? <section className={styles.playerSelector} aria-labelledby="player-selector-title">
        <header className={styles.setupHeading}>
          <div><small>La tua squadra</small><h3 id="player-selector-title">Scegli chi combatterà</h3></div>
          <span>{familiarOptions.length} Famigli disponibili · pagina {familiarPage + 1}/{familiarPageCount}</span>
        </header>
        <label className={styles.opponentDropdown}>
          <span>Famiglio combattente</span>
          <select value={familiarId} onChange={(event) => selectPreparedFamiliar(event.target.value)}>
            {familiarOptions.map((option) => <option key={option.id} value={option.id}>{option.name} · Lv {familiarCombatProgress(state, option.id).combatLevel}</option>)}
          </select>
        </label>
        <div className={styles.familiarPickerLayout}>
          <div className={styles.familiarRosterPane}>
            <div className={styles.familiarRosterGrid} aria-label="Famigli selezionabili">
              {visibleFamiliarOptions.map((option) => {
                const optionProgress = familiarCombatProgress(state, option.id);
                const optionVisual = familiarHouseVisual(option.id);
                return <button type="button" key={option.id} data-selected={option.id === familiarId} aria-pressed={option.id === familiarId} onClick={() => selectPreparedFamiliar(option.id)}>
                  <FamiglioCombatPreviewCanvas className={styles.familiarRosterCanvas} src={spritePath(option.id, option.growthStage, "idle", option.colorVariant)} label={option.name} naturalScale={optionVisual.scale} />
                  <span><strong>{option.name}</strong><small>Lv {optionProgress.combatLevel}</small></span>
                </button>;
              })}
            </div>
            <div className={styles.familiarPager}>
              <button type="button" disabled={familiarPage <= 0} onClick={() => setFamiliarPage((page) => Math.max(0, page - 1))}>← Precedenti</button>
              <span>{familiarPage + 1} / {familiarPageCount}</span>
              <button type="button" disabled={familiarPage >= familiarPageCount - 1} onClick={() => setFamiliarPage((page) => Math.min(familiarPageCount - 1, page + 1))}>Successivi →</button>
            </div>
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
        <button className={styles.setupContinue} type="button" onClick={() => setSetupTab("arenas")}>Conferma Famiglio</button>
      </section> : null}

      {setupTab === "arenas" ? <nav className={styles.circuitRail} aria-label="Circuiti dell'Arena">
        <button type="button" className={styles.campaignChoice} onClick={chooseCampaign}>
          <span className={styles.campaignArtwork} aria-hidden="true">
            <Image src="/famiglio/rebuild/combat/campaign/arenas/05-trono-nulla-v1.webp" alt="" width={1600} height={900} unoptimized />
          </span>
          <span className={styles.circuitLabel}><strong>Campagna del Legame Corrotto</strong><span>20 livelli · 5 capitoli · storia narrata</span></span>
        </button>
        <button type="button" className={styles.towerChoice} onClick={chooseTower}>
          <span className={styles.towerArtwork} aria-hidden="true">
            <Image src="/famiglio/rebuild/combat/ui/tower-nexus-icon-v1.webp" alt="" width={512} height={512} unoptimized />
          </span>
          <span className={styles.circuitLabel}><strong>Torre del Nexus</strong><span>10 piani · mini-boss 4 e 8 · boss finale</span></span>
        </button>
        {FAMILIAR_COMBAT_CIRCUITS.map((circuit) => {
          const unlocked = testMode || (progress.combatLevel >= circuit.minLevel && progress.wins >= circuit.unlockWins);
          return <button type="button" key={circuit.id} data-selected={circuit.id === selectedCircuit.id} aria-pressed={circuit.id === selectedCircuit.id} onClick={() => chooseCircuit(circuit.id)}>
            <span className={styles.circuitThumb} style={{ backgroundImage: `url(${ARENA_BACKGROUNDS[circuit.id] ?? circuit.backgroundSrc})` }} aria-hidden="true" />
            <span className={styles.circuitLabel}>
              <strong>{circuit.name}</strong>
              <span>Livelli {circuit.minLevel}–{circuit.maxLevel}{unlocked ? "" : ` · ${circuit.unlockWins} vittorie`}</span>
            </span>
          </button>;
        })}
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
            <span>{selectedCampaignLevel.turnLimit ? `${selectedCampaignLevel.turnLimit} turni massimi` : selectedCampaignLevel.bossPhases > 1 ? `${selectedCampaignLevel.bossPhases} fasi del comandante` : "Duello completo"}</span>
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
            <div><small>{battleFormat === "tower" ? `Torre · piano ${towerRun?.currentFloor ?? 1}/10` : battleFormat === "campaign" ? `Campagna · livello ${selectedCampaignLevel?.number ?? 1}/20` : "Sfida selezionata"}</small><h3>{opponentEntry?.name ?? "Nessun incontro"}</h3></div>
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
          <div className={styles.readySummary}><span>Arena <strong>{selectedCircuit.name}</strong></span><span>Modalità <strong>{FAMILIAR_COMBAT_DIFFICULTIES.find((entry) => entry.id === difficulty)?.label}</strong></span><span>Mosse <strong>{playerMoves.length}/4</strong></span></div>
          {battleFormat === "tower" && towerRun ? <div className={styles.towerProgress} aria-label={`Piano ${towerRun.currentFloor} di 10`}>
            {towerRun.floors.map((floor) => <span key={floor.floor} data-current={floor.floor === towerRun.currentFloor} data-complete={floor.floor < towerRun.currentFloor} data-rank={floor.rank}>{floor.floor}</span>)}
          </div> : null}
          <button className={styles.startButton} type="button" disabled={activityGate?.allowed === false || !safeOpponentId || (battleFormat !== "campaign" && (!selectedCircuitUnlocked || !selectedDifficultyUnlocked))} onClick={beginBattle}>{activityGate?.allowed === false ? "Famiglio non pronto" : battleFormat === "campaign" || (selectedCircuitUnlocked && selectedDifficultyUnlocked) ? "Inizia il duello" : "Sfida non ancora disponibile"}</button>
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
              return <label key={slot} data-locked={locked}><span>Slot {slot + 1}</span><select value={progress.equippedMoveIds[slot] ?? ""} disabled={locked || !learnedMoves.length || slot > progress.equippedMoveIds.length} onChange={(event) => changeEquippedMove(slot, event.target.value)}><option value="" disabled>{locked ? "Mossa da sbloccare" : "Slot libero"}</option>{learnedMoves.map((move) => <option key={move.id} value={move.id}>{move.name}</option>)}</select></label>;
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
    </div> : <section className={styles.battleViewport} data-animating={animating}>
      <div className={styles.battleColumn}>
        <div className={styles.battleStage}>
          <div className={styles.battleHud} data-side="player" data-critical={playerHpPercent <= 25}>
            <div className={styles.hudHeading}>
              <span><strong>{familiarName}</strong><small>{titleCase(battlePlayerEntry?.affinity ?? "natura")} · {titleCase(battlePlayerEntry?.role ?? "assaltatore")}</small></span>
              <b>Lv {battle.player.level}</b>
            </div>
            <div className={styles.hudHealth}>
              <span><Image className={styles.resourceIcon} src="/famiglio/rebuild/combat/ui/battle-hp-icon-v1.png" alt="" width={64} height={64} unoptimized />HP</span><div><i style={{ width: `${playerHpPercent}%` }} /></div><strong>{Math.max(0, playerHp)} / {battle.player.maxHp}</strong>
            </div>
            <div className={styles.hudEnergy}>
              <span><Image className={styles.resourceIcon} src="/famiglio/rebuild/combat/ui/battle-energy-icon-v1.png" alt="" width={64} height={64} unoptimized />EN</span><div><i style={{ width: `${playerEnergyPercent}%` }} /></div><strong>{battle.player.energy} / {battle.player.maxEnergy}</strong>
            </div>
          </div>
          <div
            className={styles.battleScene}
            style={{ backgroundImage: `url(${battleBackground})`, "--phase-duration": `${phaseDuration}ms` } as CSSProperties}
            aria-label={`${battleCircuit.name}: ${familiarName} contro ${battleOpponentEntry?.name ?? "avversario"}`}
          >
            <FamiglioBattleCanvas
              className={styles.battleCanvas}
              backgroundSrc={battleBackground}
              player={{
                id: battle.player.familiarId,
                name: familiarName,
                spriteSrc: spritePath(battle.player.familiarId, growthStage, playerBattlePose, colorVariant),
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
              label={`${battleCircuit.name}: ${familiarName} contro ${battleOpponentEntry?.name ?? "avversario"}`}
              opponentCorrupted={Boolean(battleCampaignLevel)}
              corruptionIntensity={battleCampaignLevel?.corruptionIntensity}
              campaignNpc={battleCampaignLevel ? { src: battleCampaignLevel.npc.spriteSrc, name: battleCampaignLevel.npc.name, pose: campaignNpcPose } : null}
            />
            <div className={styles.fighterStatusTags} data-side="player" aria-label={`Stati di ${familiarName}`}>
              {battle.player.statuses.map((status) => <span key={status.id} data-status={status.id}>{status.name}<small>{status.remainingTurns}t</small></span>)}
            </div>
            <div className={styles.fighterStatusTags} data-side="opponent" aria-label={`Stati di ${battleOpponentEntry?.name ?? "avversario"}`}>
              {battle.opponent.statuses.map((status) => <span key={status.id} data-status={status.id}>{status.name}<small>{status.remainingTurns}t</small></span>)}
            </div>
            <div className={styles.arenaPlate}><small>{battleCircuit.name}</small><strong>{battleDifficultyLabel}</strong></div>
          </div>
          <div className={styles.battleHud} data-side="opponent" data-critical={opponentHpPercent <= 25}>
            <div className={styles.hudHeading}>
              <span><strong>{battleOpponentEntry?.name}</strong><small>{titleCase(battleOpponentEntry?.affinity ?? "natura")} · {titleCase(battleOpponentEntry?.role ?? "assaltatore")}</small></span>
              <b>Lv {battle.opponent.level}</b>
            </div>
            <div className={styles.hudHealth}>
              <span><Image className={styles.resourceIcon} src="/famiglio/rebuild/combat/ui/battle-hp-icon-v1.png" alt="" width={64} height={64} unoptimized />HP</span><div><i style={{ width: `${opponentHpPercent}%` }} /></div><strong>{Math.max(0, opponentHp)} / {battle.opponent.maxHp}</strong>
            </div>
            <div className={styles.hudEnergy}>
              <span><Image className={styles.resourceIcon} src="/famiglio/rebuild/combat/ui/battle-energy-icon-v1.png" alt="" width={64} height={64} unoptimized />EN</span><div><i style={{ width: `${opponentEnergyPercent}%` }} /></div><strong>{battle.opponent.energy} / {battle.opponent.maxEnergy}</strong>
            </div>
          </div>
          {roundNotice === battle.turn && !initiativeOpen ? <div className={styles.roundNotice} role="status"><small>{battle.bossPhasesTotal > 1 ? `Fase ${battle.bossPhasesTotal - battle.bossPhasesRemaining + 1}/${battle.bossPhasesTotal}` : "Round"}</small><strong>{battle.turn}</strong></div> : null}
          <aside className={styles.battleControls}>
        {battle.outcome === "active" ? <>
          <div className={styles.battleUtilityDock}>
            <div className={styles.battleUtilityTray} aria-label="Dettagli del combattimento">
              <button type="button" className={styles.battleUtilityButton} aria-label="Apri gli stati attivi" aria-haspopup="dialog" onClick={() => setBattleInfoPanel("status")}> 
                <Image className={styles.battleUtilityIcon} src="/famiglio/rebuild/combat/ui/battle-status-icon-v1.png" width={64} height={64} unoptimized alt="" aria-hidden="true" />
                <span>{battle.player.statuses.length + battle.opponent.statuses.length}</span>
              </button>
              <button type="button" className={styles.battleUtilityButton} aria-label="Apri la cronaca del combattimento" aria-haspopup="dialog" onClick={() => setBattleInfoPanel("log")}> 
                <Image className={styles.battleUtilityIcon} src="/famiglio/rebuild/combat/ui/battle-log-icon-v1.png" width={64} height={64} unoptimized alt="" aria-hidden="true" />
              </button>
            </div>
            <button
              className={styles.retreatButton}
              type="button"
              disabled={animating}
              aria-label="Chiedi conferma per ritirarti"
              aria-haspopup="dialog"
              title="Ritirati dal duello"
              onClick={() => setRetreatConfirmOpen(true)}
            >
              <Image className={styles.retreatIcon} src="/famiglio/rebuild/combat/ui/battle-retreat-icon-v2.png" width={96} height={96} unoptimized alt="" aria-hidden="true" />
            </button>
          </div>
          <div className={styles.battleMoveGrid}>
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
              return <article className={styles.battleMoveCommand} key={move?.id ?? `locked-${index}`} data-ready={ready}>
                <button
                  className={styles.moveAction}
                  type="button"
                  disabled={animating || !ready}
                  data-kind={move?.damageClass ?? "locked"}
                  data-energy-cost={energyCost}
                  data-cooldown-locked={cooldownLocked}
                  data-repetition-locked={repetitionLocked}
                  onClick={() => move && performSelectedMove(move.id)}
                  title={move ? `${move.name}: ${availabilityLabel}` : undefined}
                >
                  <small>{String(index + 1).padStart(2, "0")}</small>
                  <strong>{move?.name ?? "Mossa da sbloccare"}</strong>
                </button>
                <button
                  className={styles.moveInfoButton}
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
          {initiativeOpen && battle.initiative ? <section className={`${styles.battleInfoOverlay} ${styles.initiativeOverlay}`} role="dialog" aria-modal="true" aria-labelledby="initiative-title">
            <article className={`${styles.battleInfoCard} ${styles.initiativeCard}`}>
              <header><span><small>Inizio del duello</small><h2 id="initiative-title">{"Tiro d'iniziativa"}</h2></span></header>
              <p>Ogni Famiglio lancia due dadi. Il totale più alto ottiene il primo attacco.</p>
              <div className={styles.initiativeContest}>
                {[
                  { key: "player", name: familiarName, dice: battle.initiative.playerDice, total: battle.initiative.playerTotal, critical: battle.initiative.playerCritical },
                  { key: "opponent", name: battleOpponentEntry?.name ?? "Avversario", dice: battle.initiative.opponentDice, total: battle.initiative.opponentTotal, critical: battle.initiative.opponentCritical },
                ].map((roll) => <section key={roll.key} data-winner={battle.initiative?.first === roll.key}>
                  <strong>{roll.name}</strong>
                  <div><InitiativeDie value={roll.dice[0]} /><InitiativeDie value={roll.dice[1]} /></div>
                  <span>Totale <b>{roll.total}</b></span>
                  {roll.critical ? <em>Doppio: primo colpo critico</em> : null}
                </section>)}
              </div>
              <p className={styles.initiativeResult}><strong>{battle.initiative.first === "player" ? familiarName : battleOpponentEntry?.name}</strong> attacca per primo.</p>
              <button className={styles.initiativeContinue} type="button" onClick={() => {
                setInitiativeBattleId(null);
              }}>{"Entra nell'Arena"}</button>
            </article>
          </section> : null}
          {battle.outcome === "active" && battleInfoPanel ? <section className={styles.battleInfoOverlay} role="dialog" aria-modal="true" aria-labelledby="battle-info-title">
            <article className={styles.battleInfoCard} data-panel={battleInfoPanel}>
              <header>
                <span><small>ROUND {battle.turn}</small><h2 id="battle-info-title">{battleInfoPanel === "status" ? "Stati del combattimento" : "Cronaca dell'incontro"}</h2></span>
                <button type="button" onClick={() => setBattleInfoPanel(null)} aria-label="Chiudi la scheda">Chiudi</button>
              </header>
              {battleInfoPanel === "status" ? <div className={styles.battleStatusDossier}>
                {[
                  { actor: battle.player, name: familiarName, hp: Math.max(0, playerHp) },
                  { actor: battle.opponent, name: battleOpponentEntry?.name ?? "Avversario", hp: Math.max(0, opponentHp) },
                ].map(({ actor, name, hp }) => <section key={actor.familiarId}>
                  <header><strong>{name}</strong><span>{hp}/{actor.maxHp} HP · {actor.energy}/{actor.maxEnergy} EN</span></header>
                  {actor.statuses.length ? <div>{actor.statuses.map((status) => <article key={status.id} data-status={status.id}>
                    <strong>{STATUS_LABELS[status.id] ?? status.name}</strong>
                    <span>{status.remainingTurns} {status.remainingTurns === 1 ? "round restante" : "round restanti"}</span>
                    <p>{STATUS_DETAILS[status.id] ?? "Effetto temporaneo applicato durante il combattimento."}</p>
                    <small>Intensità {status.potency}%</small>
                  </article>)}</div> : <p className={styles.noBattleStatus}>Nessuno stato attivo. Il Famiglio può agire normalmente.</p>}
                </section>)}
              </div> : <div className={styles.battleChronicle} aria-live="polite">
                <p>Ultimi eventi registrati, dal meno recente al più recente.</p>
                <ol>{battle.log.slice(-8).map((line, index) => <li key={`${battle.turn}-${index}`}><span>{String(index + 1).padStart(2, "0")}</span><strong>{combatText(line)}</strong></li>)}</ol>
              </div>}
            </article>
          </section> : null}
          {battle.outcome === "active" && selectedMoveInfo ? <section className={styles.battleInfoOverlay} role="dialog" aria-modal="true" aria-labelledby="move-info-title">
            <article className={`${styles.battleInfoCard} ${styles.moveInfoCard}`} data-panel="move">
              <header>
                <span><small>Scheda mossa</small><h2 id="move-info-title">{selectedMoveInfo.name}</h2></span>
                <button type="button" onClick={() => setSelectedMoveInfoId(null)} aria-label="Chiudi le informazioni sulla mossa">Chiudi</button>
              </header>
              <p className={styles.moveInfoDescription}>{selectedMoveInfo.description}</p>
              <dl className={styles.moveInfoStats}>
                <div><dt>Categoria</dt><dd>{selectedMoveInfo.damageClass === "physical" ? "Fisica" : selectedMoveInfo.damageClass === "magic" ? "Magica" : selectedMoveInfo.damageClass === "restore" ? "Cura" : "Stato"}</dd></div>
                <div><dt>Affinità</dt><dd>{titleCase(selectedMoveInfo.affinity)}</dd></div>
                <div><dt>Energia</dt><dd>{familiarCombatMoveEnergyCost(battle.player.familiarId, selectedMoveInfo.id)} EN</dd></div>
                <div><dt>Potenza</dt><dd>{selectedMoveInfo.power || "—"}</dd></div>
                <div><dt>Precisione</dt><dd>{selectedMoveInfo.accuracy}%</dd></div>
                <div><dt>Priorità</dt><dd>{selectedMoveInfo.priority > 0 ? `+${selectedMoveInfo.priority}` : selectedMoveInfo.priority}</dd></div>
                <div><dt>Effetto</dt><dd>{selectedMoveInfo.status ? `${STATUS_LABELS[selectedMoveInfo.status] ?? titleCase(selectedMoveInfo.status)} ${selectedMoveInfo.statusChance ?? 100}%` : selectedMoveInfo.healingRatio ? `Cura ${Math.round(selectedMoveInfo.healingRatio * 100)}% HP` : "Danno diretto"}</dd></div>
                <div><dt>Utilizzi</dt><dd>{familiarCombatMoveMaxUses(selectedMoveInfo.id) > 0 ? `${battle.player.moveUses[selectedMoveInfo.id] ?? 0}/${familiarCombatMoveMaxUses(selectedMoveInfo.id)}` : "Illimitati"}</dd></div>
              </dl>
              <section className={styles.moveInfoRules}>
                <h3>Regole durante il duello</h3>
                <p>{moveSubtitle(selectedMoveInfo)}.</p>
                <p>La stessa mossa speciale non può essere usata più di due volte consecutive. Le mosse con ricarica richiedono una scelta diversa prima di tornare disponibili.</p>
              </section>
            </article>
          </section> : null}
          {battle.outcome === "active" && retreatConfirmOpen ? <section className={styles.battleInfoOverlay} role="dialog" aria-modal="true" aria-labelledby="retreat-confirm-title">
            <article className={`${styles.battleInfoCard} ${styles.retreatConfirmCard}`}>
              <Image className={styles.retreatConfirmIcon} src="/famiglio/rebuild/combat/ui/battle-retreat-icon-v2.png" width={192} height={192} unoptimized alt="" aria-hidden="true" />
              <small>Abbandona il duello</small>
              <h2 id="retreat-confirm-title">Vuoi davvero ritirarti?</h2>
              <p>La battaglia terminerà come ritirata. Non perderai oggetti, ma non riceverai esperienza o ricompense.</p>
              <div className={styles.retreatConfirmActions}>
                <button type="button" onClick={() => setRetreatConfirmOpen(false)}>Continua a combattere</button>
                <button type="button" data-danger="true" onClick={leaveBattle}>Conferma ritiro</button>
              </div>
            </article>
          </section> : null}
        </div>
        <div className={styles.turnBanner}><strong>{currentEvent ? combatText(currentEvent.message) : (entering ? "I Famigli entrano nell'Arena." : "Scegli una mossa.")}</strong></div>
      </div>
    </section>}

    {!animating && battle && battle.outcome !== "active" ? <section className={styles.resultOverlay} data-outcome={battle.outcome} role="dialog" aria-modal="true" aria-labelledby="battle-result-title">
      <article className={styles.resultScreen}>
        <div className={styles.resultAura} aria-hidden="true"><span /></div>
        <small>{battle.outcome === "victory" ? "Trionfo del Legame" : "Il Legame non si spezza"}</small>
        <h2 id="battle-result-title">{battle.outcome === "victory" ? "Vittoria!" : "Sconfitta"}</h2>
        {battleCampaignLevel ? <div className={styles.resultDialogue}>
          <FamiglioCampaignNpcCanvas className={styles.resultNpcCanvas} src={battleCampaignLevel.npc.spriteSrc} hue={battleCampaignLevel.npc.costumeHue} pose={battle.outcome === "victory" ? "defeat" : "victory"} label={battleCampaignLevel.npc.name} />
          <div className={styles.comicBubble}><strong>{battleCampaignLevel.npc.name}</strong><p>{battle.outcome === "victory" ? battleCampaignLevel.victoryLine : battleCampaignLevel.defeatLine}</p></div>
        </div> : <p>{battle.outcome === "victory" ? (battleFormat === "tower" && towerRun ? `${familiarName} ha superato il piano ${towerRun.currentFloor} della Torre.` : `${familiarName} ha dominato l'Arena.`) : `${familiarName} è al sicuro e può prepararsi alla rivincita.`}</p>}
        <div className={styles.resultFamiliar} data-outcome={battle.outcome} aria-label={battle.outcome === "victory" ? "Santuario della vittoria" : "Santuario della rivincita"}>
          <FamiglioCombatPreviewCanvas
            className={styles.resultFamiliarCanvas}
            src={spritePath(familiarId, growthStage, battle.outcome === "victory" ? "victory" : "exhausted", colorVariant)}
            label={`${familiarName}: ${battle.outcome === "victory" ? "vittoria" : "sconfitta"}`}
            naturalScale={playerVisual.scale}
          />
        </div>
        {state.pendingReward ? <dl className={styles.resultRewards}>
          <div><dt>XP</dt><dd>+{state.pendingReward.combatXp}</dd></div>
          <div><dt>Monete</dt><dd>+{state.pendingReward.nexusCoins}</dd></div>
          <div><dt>Sigilli</dt><dd>+{state.pendingReward.nightSigils}</dd></div>
          <div><dt>Frammenti</dt><dd>+{state.pendingReward.relicFragments}</dd></div>
        </dl> : <div className={styles.defeatMessage}>{battle.outcome === "victory" ? "Esperienza di combattimento acquisita" : "Nessun oggetto perso"}</div>}
        <div className={styles.resultActions}>
          {battle.outcome === "victory"
            ? <button type="button" onClick={collectReward}>{battleFormat === "tower" && towerRun?.currentFloor !== 10 ? "Raccogli · prossimo piano" : "Raccogli e continua"}</button>
            : <button type="button" onClick={rematch}>Rivincita</button>}
          <button type="button" onClick={finishBattleAtHome}>Torna alla Casa</button>
        </div>
      </article>
    </section> : null}

    <footer className={styles.message} aria-live="polite">
      <span>{audioUnlocked ? (muted ? "Audio disattivato" : "Audio pronto") : "L'audio si attiva al primo comando"}</span>
      <strong>{combatText(currentEvent?.message ?? localMessage ?? state.lastMessage)}</strong>
    </footer>
  </section>;
}
