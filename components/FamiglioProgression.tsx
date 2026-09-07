"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { GROWTH_STAGES, type FamiliarGrowthStage } from "@/lib/famiglioHome";
import { familiarCombatEntry } from "@/lib/famiglioCombatCatalog";
import {
  familiarCombatMoveEnergyCost,
  familiarCombatProgress,
  type FamiliarCombatState,
} from "@/lib/famiglioCombat";
import {
  FAMILIAR_MILESTONES,
  MAX_FAMILIAR_LEVEL,
  familiarExperienceForLevel,
  familiarNextMilestone,
} from "@/lib/nexusFamiliarProgression";
import { familiarLevelForExperience } from "@/lib/nexusFamiliar";
import styles from "./FamiglioProgression.module.css";

type ProgressionTrack = "growth" | "moves" | "rewards";

const TRACKS: ReadonlyArray<{ id: ProgressionTrack; label: string; description: string }> = [
  { id: "growth", label: "Crescita", description: "Evoluzione del legame" },
  { id: "moves", label: "Mosse", description: "Tecniche di combattimento" },
  { id: "rewards", label: "Ricompense", description: "Bonus del Custode" },
];

const MOVE_SOURCE_LABEL = {
  species: "Specie",
  affinity: "Affinità",
  role: "Ruolo",
  ultimate: "Tecnica finale",
} as const;

const compactProgressionQuery = "(max-width: 380px), (max-height: 700px)";

function subscribeToCompactProgression(onChange: () => void) {
  const query = window.matchMedia(compactProgressionQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function compactProgressionSnapshot() {
  return window.matchMedia(compactProgressionQuery).matches;
}

function PageControls({ page, pages, onPage }: { page: number; pages: number; onPage: (next: number) => void }) {
  if (pages <= 1) return null;
  return <nav className={styles.pager} aria-label="Pagine del percorso">
    <button type="button" disabled={page === 0} onClick={() => onPage(Math.max(0, page - 1))}>Precedenti</button>
    <span>{page + 1} / {pages}</span>
    <button type="button" disabled={page + 1 >= pages} onClick={() => onPage(Math.min(pages - 1, page + 1))}>Successivi</button>
  </nav>;
}

export function FamiglioProgression({
  familiarId,
  familiarName,
  bondXp,
  careDays,
  growthStage,
  combatState,
  onReturnHome,
}: {
  familiarId: string;
  familiarName: string;
  bondXp: number;
  careDays: number;
  growthStage: FamiliarGrowthStage;
  combatState: FamiliarCombatState;
  onReturnHome: () => void;
}) {
  const [track, setTrack] = useState<ProgressionTrack>("growth");
  const [page, setPage] = useState(0);
  const compact = useSyncExternalStore(subscribeToCompactProgression, compactProgressionSnapshot, () => false);
  const pageSize = compact ? 2 : 4;
  const bondLevel = familiarLevelForExperience(bondXp);
  const nextLevelXp = bondLevel >= MAX_FAMILIAR_LEVEL ? bondXp : familiarExperienceForLevel(bondLevel + 1);
  const combatProgress = familiarCombatProgress(combatState, familiarId);
  const combatEntry = familiarCombatEntry(familiarId);
  const nextMilestone = familiarNextMilestone(bondLevel);

  const moves = useMemo(() => {
    if (!combatEntry) return [];
    const unlockLevels = new Map<string, number>([
      ...combatEntry.initialMoveIds.map((moveId) => [moveId, 1] as const),
      ...combatProgress.learnedSchedule.map((entry) => [entry.moveId, entry.level] as const),
    ]);
    return combatEntry.moves
      .map((move) => ({
        ...move,
        unlockLevel: unlockLevels.get(move.id) ?? 1,
        learned: combatProgress.learnedMoveIds.includes(move.id),
        energy: familiarCombatMoveEnergyCost(familiarId, move.id),
      }))
      .sort((left, right) => left.unlockLevel - right.unlockLevel || left.name.localeCompare(right.name));
  }, [combatEntry, combatProgress.learnedMoveIds, combatProgress.learnedSchedule, familiarId]);

  const growthNodes = [
    { label: "Cucciolo", requirement: "Inizio del legame", xp: 0, reached: true },
    { label: "Giovane", requirement: `${GROWTH_STAGES.giovane.minimumXp} XP Legame`, xp: GROWTH_STAGES.giovane.minimumXp, reached: growthStage !== "cucciolo" },
    { label: "Adulto", requirement: `${GROWTH_STAGES.adulto.minimumXp} XP Legame`, xp: GROWTH_STAGES.adulto.minimumXp, reached: growthStage === "adulto" },
  ];
  const visibleMoves = moves.slice(page * pageSize, page * pageSize + pageSize);
  const visibleRewards = FAMILIAR_MILESTONES.slice(page * pageSize, page * pageSize + pageSize);
  const pages = track === "moves" ? Math.ceil(moves.length / pageSize) : track === "rewards" ? Math.ceil(FAMILIAR_MILESTONES.length / pageSize) : 1;
  const bondPercent = bondLevel >= MAX_FAMILIAR_LEVEL ? 100 : Math.max(0, Math.min(100, Math.round(((bondXp - familiarExperienceForLevel(bondLevel)) / Math.max(1, nextLevelXp - familiarExperienceForLevel(bondLevel))) * 100)));

  return <section className={styles.screen} aria-label="Percorso del Legame">
    <picture className={styles.journeyArt}>
      <source media="(max-width: 560px)" srcSet="/famiglio/rebuild/progression/percorso-legame-mobile-v1.png" />
      <img src="/famiglio/rebuild/progression/percorso-legame-desktop-v1.png" alt="" />
    </picture>
    <header className={styles.header}>
      <div>
        <small>Percorso del Legame</small>
        <h2>{familiarName}</h2>
        <p>Ogni traguardo indica esattamente cosa manca e cosa verrà ottenuto.</p>
      </div>
      <button type="button" onClick={onReturnHome}>Torna alla Casa</button>
    </header>

    <div className={styles.summary}>
      <div><small>Livello Legame</small><strong>{bondLevel}</strong><span>{bondXp} / {nextLevelXp} XP</span></div>
      <div><small>Livello Lotta</small><strong>{combatProgress.combatLevel}</strong><span>{combatProgress.wins} vittorie</span></div>
      <div><small>Evoluzione</small><strong>{GROWTH_STAGES[growthStage].label}</strong><span>{careDays} giorni di cura</span></div>
      <div><small>Prossimo premio</small><strong>{nextMilestone ? `Livello ${nextMilestone.level}` : "Completato"}</strong><span>{nextMilestone?.title ?? "Custode leggendario"}</span></div>
    </div>

    <nav className={styles.trackTabs} aria-label="Rami del Percorso del Legame">
      {TRACKS.map((item) => <button key={item.id} type="button" aria-pressed={track === item.id} onClick={() => { setTrack(item.id); setPage(0); }}><strong>{item.label}</strong><small>{item.description}</small></button>)}
    </nav>

    <div className={styles.trackBody} data-track={track}>
      {track === "growth" ? <>
        <div className={styles.nextTarget}>
          <span>Prossimo livello</span>
          <strong>{bondLevel >= MAX_FAMILIAR_LEVEL ? "Livello massimo raggiunto" : `Livello ${bondLevel + 1}`}</strong>
          <progress max="100" value={bondPercent}>{bondPercent}%</progress>
          <small>{bondLevel >= MAX_FAMILIAR_LEVEL ? "Il Legame è completo." : `Mancano ${Math.max(0, nextLevelXp - bondXp)} XP.`}</small>
        </div>
        <ol className={styles.pathList}>{growthNodes.map((node) => <li key={node.label} data-state={node.reached ? "complete" : bondXp < node.xp ? "locked" : "next"}><span>{node.reached ? "Ottenuto" : "Da raggiungere"}</span><strong>{node.label}</strong><small>{node.requirement}</small></li>)}</ol>
        <p className={styles.explanation}>Le cure assegnano poca esperienza: l&apos;evoluzione richiede costanza e non avviene dopo poche azioni.</p>
      </> : null}

      {track === "moves" ? <>
        <div className={styles.trackIntro}><strong>Arsenale di {familiarName}</strong><span>Le mosse si apprendono con il livello Lotta; impararle non le equipaggia automaticamente.</span></div>
        <ol className={styles.pathList}>{visibleMoves.map((move) => <li key={move.id} data-state={move.learned ? "complete" : move.unlockLevel === Math.min(...moves.filter((candidate) => !candidate.learned).map((candidate) => candidate.unlockLevel)) ? "next" : "locked"}><span>{move.learned ? "Appresa" : `Livello Lotta ${move.unlockLevel}`}</span><strong>{move.name}</strong><small>{MOVE_SOURCE_LABEL[move.source]} · {move.energy === 0 ? "Mossa base · 0 energia" : `${move.energy} energia`} · Precisione {move.accuracy}%</small></li>)}</ol>
        <PageControls page={page} pages={pages} onPage={setPage} />
      </> : null}

      {track === "rewards" ? <>
        <div className={styles.trackIntro}><strong>Ricompense del Custode</strong><span>Lo sconto migliore disponibile viene applicato; i bonus non si sommano tra loro.</span></div>
        <ol className={styles.pathList}>{visibleRewards.map((milestone) => <li key={milestone.level} data-state={bondLevel >= milestone.level ? "complete" : nextMilestone?.level === milestone.level ? "next" : "locked"}><span>{bondLevel >= milestone.level ? "Ottenuto" : `Livello ${milestone.level}`}</span><strong>{milestone.title}</strong><small>{milestone.benefit}</small><em>{milestone.rewardLabel}</em></li>)}</ol>
        <PageControls page={page} pages={pages} onPage={setPage} />
      </> : null}
    </div>
  </section>;
}
