"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { FAMILIAR_DEVICE_COVERS, GROWTH_STAGES, type FamiliarGrowthStage } from "@/lib/famiglioHome";
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
import { FAMILIAR_ATTENDANCE_COLLECTIBLES, FAMILIAR_ATTENDANCE_SEASONS, seasonCoverRewards, familiarAttendanceRecovery, type FamiliarAttendanceState } from "@/lib/famiglioAttendanceYear";
import {albumRewardDate,albumSeasonProgress} from "@/lib/famiglioAlbumView";
import { FAMILIAR_WEEKLY_STEPS, type FamiliarWeeklyLoopState, type FamiliarWeeklyStep } from "@/lib/famiglioWeeklyLoop";
import styles from "./FamiglioProgression.module.css";

type ProgressionTrack = "weekly" | "growth" | "moves" | "rewards" | "album";

const TRACKS: ReadonlyArray<{ id: ProgressionTrack; label: string; description: string }> = [
  { id: "weekly", label: "Settimana", description: "Quattro tappe reali" },
  { id: "growth", label: "Crescita", description: "Evoluzione del legame" },
  { id: "moves", label: "Mosse", description: "Tecniche di combattimento" },
  { id: "rewards", label: "Ricompense", description: "Bonus del Custode" },
  { id: "album", label: "Album", description: "Collezione annuale" },
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
  attendance,
  weeklyLoop,
  onClaimWeeklyChest,
  onOpenAttendance,
  onNavigateStep,
  onReturnHome,
}: {
  familiarId: string;
  familiarName: string;
  bondXp: number;
  careDays: number;
  growthStage: FamiliarGrowthStage;
  combatState: FamiliarCombatState;
  attendance: FamiliarAttendanceState;
  weeklyLoop: FamiliarWeeklyLoopState;
  onClaimWeeklyChest: () => void;
  onOpenAttendance: () => void;
  onNavigateStep: (step: FamiliarWeeklyStep) => void;
  onReturnHome: () => void;
}) {
  const [track, setTrack] = useState<ProgressionTrack>("weekly");
  const [page, setPage] = useState(0);
  const [albumSeason, setAlbumSeason] = useState<string | null>(null);
  const [albumFilter,setAlbumFilter]=useState<"all"|"owned"|"missing">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedStep, setSelectedStep] = useState<FamiliarWeeklyStep>(() => FAMILIAR_WEEKLY_STEPS.find(step => !weeklyLoop.steps.includes(step)) ?? "care");
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
  const weeklyLabels = { care: "Prenditi cura", play: "Gioco quotidiano", adventure: "Completa una spedizione", combat: "Vinci una lotta" } as const;
  const currentSeason = FAMILIAR_ATTENDANCE_SEASONS.find((season) => FAMILIAR_ATTENDANCE_COLLECTIBLES.find((item) => item.week === Number(weeklyLoop.weekKey.match(/w(\d+)/)?.[1] || 1))?.seasonId === season.id) ?? FAMILIAR_ATTENDANCE_SEASONS[0];
  const recovery = familiarAttendanceRecovery(attendance);
  const week = Number(weeklyLoop.weekKey.match(/w(\d+)/)?.[1] || 1);
  const stepHelp = { care: "Nutri, pulisci o coccola il Famiglio nella Casa.", play: "Concludi una partita con il pulsante Gioca.", adventure: "Termina una spedizione e raccogli il bottino.", combat: "Concludi una vittoria e raccogli il premio." };
  const stepAction = { care: "Vai alla Casa", play: "Avvia il minigioco", adventure: "Vai alle spedizioni", combat: "Vai alle lotte" };
  const shownSeason = albumSeason ?? currentSeason.id;
  const albumItems = FAMILIAR_ATTENDANCE_COLLECTIBLES.filter(item => item.seasonId === shownSeason);
  const visibleAlbum=albumItems.filter(item=>albumFilter === "all" || attendance.collectibles.includes(item.id)===(albumFilter === "owned"));
  const selected = visibleAlbum.find(item => item.id === selectedId) ?? visibleAlbum.find(item => item.week === week) ?? visibleAlbum[0];
  const seasonProgress=albumSeasonProgress(shownSeason,attendance.collectibles);
  const seasonIndex=Math.max(0,FAMILIAR_ATTENDANCE_SEASONS.findIndex(season=>season.id===shownSeason));
  const season=FAMILIAR_ATTENDANCE_SEASONS[seasonIndex];
  const cover=FAMILIAR_DEVICE_COVERS.find(cover=>cover.id===seasonCoverRewards[seasonIndex])!;
  const remainingSteps=FAMILIAR_WEEKLY_STEPS.filter(step=>!weeklyLoop.steps.includes(step));
  const status = (item: typeof albumItems[number]) => attendance.collectibles.includes(item.id) ? "Ottenuto" : recovery.active ? "Da recuperare" : item.week === week ? "Questa settimana" : item.week > week ? "In arrivo" : "Non raccolto";

  return <section className={styles.screen} data-track={track} data-focused={track === "weekly" || track === "album"} aria-label="Percorso del Legame">
    <picture className={styles.journeyArt}>
      <source media="(max-width: 560px)" srcSet="/famiglio/rebuild/progression/percorso-legame-mobile-v1.png" />
      <img src="/famiglio/rebuild/progression/percorso-legame-desktop-v1.png" alt="" />
    </picture>
    <header className={styles.header}>
      <div>
        <small>Percorso del Legame</small>
        <h2>{familiarName}</h2>
        <p>Le attività della settimana e i ricordi da collezionare.</p>
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
      {TRACKS.map((item) => <button key={item.id} type="button" aria-pressed={track === item.id} onClick={() => { setTrack(item.id); setPage(0); }}><img className={styles.trackIcon} src={`/famiglio/rebuild/progression/lunar-${item.id}-v2.png`} alt="" /><strong>{item.label}</strong><small>{item.description}</small></button>)}
    </nav>

    <div className={styles.trackBody} data-track={track}>
      {track === "weekly" ? <>
        <div className={styles.trackIntro}><strong>Settimana {week} · {currentSeason.name}</strong><span>Tocca un’isola per scegliere la tua prossima avventura. Le quattro tappe si possono fare in qualsiasi ordine.</span></div>
        <p className={styles.nextAdventure}>{weeklyLoop.chestClaimed ? "Settimana completata: il tesoro è tuo." : remainingSteps.length ? `Mancano ${remainingSteps.length} tappe al tesoro: ${remainingSteps.map(step=>weeklyLabels[step]).join(" · ")}.` : "Tutte le tappe completate: apri il tesoro!"}</p>
        <div className={styles.lunarJourney}>
          <div className={styles.islandScene}><img className={styles.islandArtwork} src="/famiglio/rebuild/progression/lunar-islands-v2.png" alt="Quattro isole lunari collegate da un sentiero di stelle: casa, giardino dei giochi, rovine e altare di cristallo." />
            <ol className={styles.islandNodes}>{FAMILIAR_WEEKLY_STEPS.map((step,index) => <li key={step} data-step={step} data-complete={weeklyLoop.steps.includes(step)}><button type="button" aria-pressed={selectedStep === step} aria-label={`${weeklyLabels[step]}${weeklyLoop.steps.includes(step) ? ", completata" : ""}`} onClick={() => setSelectedStep(step)}><b>{weeklyLoop.steps.includes(step) ? "✓" : index+1}</b><span>{({care:"Cura",play:"Gioca",adventure:"Esplora",combat:"Lotta"})[step]}</span><small>{weeklyLoop.steps.includes(step)?"Fatto":"Da fare"}</small></button></li>)}</ol>
          </div>
          <aside className={styles.journeyDetails}>
            <div className={styles.selectedIsland} aria-live="polite"><small>{weeklyLoop.steps.includes(selectedStep) ? "✓ Tappa completata" : `Tappa ${FAMILIAR_WEEKLY_STEPS.indexOf(selectedStep)+1} · da esplorare`}</small><h3>{weeklyLabels[selectedStep]}</h3><p>{stepHelp[selectedStep]}</p><button type="button" onClick={() => onNavigateStep(selectedStep)}>{stepAction[selectedStep]}</button></div>
            <div className={styles.lunarTreasure} data-ready={!remainingSteps.length && !weeklyLoop.chestClaimed}><img src="/famiglio/rebuild/progression/lunar-rewards-v2.png" alt="" /><div><strong>{weeklyLoop.chestClaimed ? "Tesoro raccolto" : `${weeklyLoop.steps.length}/4 tappe · il tuo tesoro`}</strong><p>45 Monete Nexus<br />2 Frammenti di Reliquia</p></div><button type="button" disabled={weeklyLoop.steps.length < 4 || weeklyLoop.chestClaimed} onClick={onClaimWeeklyChest}>{weeklyLoop.chestClaimed ? "Riscosso ✓" : remainingSteps.length ? `Completa le ${remainingSteps.length} tappe mancanti` : "Apri il tesoro"}</button></div>
            <button className={styles.attendanceEntry} type="button" onClick={() => setTrack("album")}>Scopri i ricordi nell’Album →</button>
          </aside>
        </div>
      </> : null}
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
      {track === "album" ? <>
        <div className={styles.trackIntro}><strong>Album · {attendance.collectibles.length}/52 ricordi</strong><span>Le sagome sono i ricordi mancanti. Toccale per vedere il premio e la data in cui ottenerlo.</span></div>
        <nav className={styles.seasonPicker} aria-label="Stagioni dell’Album">{FAMILIAR_ATTENDANCE_SEASONS.map(season => <button key={season.id} aria-pressed={shownSeason === season.id} onClick={() => { setAlbumSeason(season.id); setSelectedId(null); }}><img src={season.cover} alt="" /><strong>{season.name}</strong><span>{albumSeasonProgress(season.id,attendance.collectibles).count}/13 raccolti</span></button>)}</nav>
        <section className={styles.setPrize} aria-label="Premio della collezione"><img src={season.cover} alt={`Illustrazione della stagione ${season.name}`} /><div><small>{seasonProgress.complete?"Collezione completata":"Premio del set · 13 ricordi"}</small><h3>Cover {cover.name}</h3><p>{seasonProgress.complete?"La cover è sbloccata. Torna alla Casa per sceglierla tra le cover del dispositivo.":`Raccogli ancora ${seasonProgress.missing} ricordi di questa stagione per sbloccare la cover ${cover.name} del dispositivo.`}</p><span>Un aspetto diverso per il tuo Nexus Pet, senza bonus alle statistiche.</span>{seasonProgress.complete?<button type="button" onClick={onReturnHome}>Vai alla Casa</button>:null}</div></section>
        <nav className={styles.albumFilters} aria-label="Filtra i ricordi">{([["all","Tutti"],["owned","Ottenuti"],["missing","Mancanti"]] as const).map(([id,label])=><button type="button" key={id} aria-pressed={albumFilter===id} onClick={()=>{setAlbumFilter(id);setSelectedId(null);}}>{label}</button>)}</nav>
        <div className={styles.albumLayout}>
          <div>
            <ol className={styles.albumGrid}>{visibleAlbum.map(item => <li key={item.id} data-owned={attendance.collectibles.includes(item.id)}><button type="button" aria-pressed={selected?.id === item.id} aria-label={`${item.name} · ${status(item)}`} onClick={() => setSelectedId(item.id)}><img src={item.icon} alt="" /><small>Settimana {item.week}</small><strong>{item.name}</strong><span>{status(item)}</span></button></li>)}</ol>
            {!visibleAlbum.length?<p className={styles.emptyAlbum}>{albumFilter==="owned"?"Non hai ancora ricordi di questa stagione. Apri il Registro presenze per iniziare.":"Hai raccolto tutti i ricordi di questa stagione!"}<button type="button" onClick={()=>setAlbumFilter("all")}>Mostra tutti</button></p>:null}
          </div>
          {selected?<div className={styles.albumDetail} aria-live="polite"><img src={selected.icon} alt={selected.name} /><div><small>Settimana {selected.week} · {status(selected)}</small><h3>{selected.name}</h3><p>{attendance.collectibles.includes(selected.id) ? "Questo ricordo fa parte della tua collezione." : recovery.active || selected.week < week ? "Dopo la fine dell’anno, ogni sette presenze consecutive recuperi un ricordo mancante, in ordine di settimana. Apri il Registro per vedere il prossimo ricordo e registrare la presenza." : `Riscatta il premio del 7° giorno il ${albumRewardDate(attendance.launchDate,selected.week)}, con almeno 7 presenze consecutive.`}</p><small>Ricordo da collezione: non si usa per nutrire, giocare o curare.</small><button type="button" onClick={onOpenAttendance}>Apri il Registro presenze</button></div></div>:null}
        </div>
      </> : null}
    </div>
  </section>;
}
