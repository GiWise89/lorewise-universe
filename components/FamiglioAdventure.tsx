"use client";

import { useEffect, useState, type CSSProperties, type Dispatch, type SetStateAction } from "react";
import styles from "./FamiglioAdventure.module.css";
import {
  FAMILIAR_DAILY_EXPEDITION_LIMIT,
  FAMILIAR_DUNGEONS,
  claimFamiliarAdventureReward,
  completeFamiliarExpedition,
  dungeonIsUnlocked,
  expeditionChoiceIsAvailable,
  expeditionRemainingMs,
  familiarAdventureProgress,
  familiarExpeditionEvent,
  familiarExpeditionsToday,
  resolveFamiliarExpeditionChoice,
  startFamiliarExpedition,
  type FamiliarAdventureReward,
  type FamiliarAdventureState,
  type FamiliarDungeon,
  type FamiliarDungeonId,
} from "@/lib/famiglioAdventure";
import type { FamiliarGrowthStage } from "@/lib/famiglioHome";
import { FAMILIAR_COLLECTION } from "@/lib/famiglioMarketExpansion";
import { STARTER_EGGS } from "@/lib/famiglioRebuild";

type FamiglioAdventureProps = {
  familiarId: string;
  familiarName: string;
  colorVariant: string | null;
  growthStage: FamiliarGrowthStage;
  state: FamiliarAdventureState;
  setState: Dispatch<SetStateAction<FamiliarAdventureState>>;
  testMode: boolean;
  onReward: (reward: FamiliarAdventureReward) => void;
  onMissionActivity?: (activity: "familiar_expedition", sourceKey: string) => void;
  onReturnHome: () => void;
  activityGate?: { allowed: boolean; reason: string | null; warnings: string[] };
};

type RewardValues = Pick<FamiliarAdventureReward, "nexusCoins" | "nightSigils" | "relicFragments" | "adventureXp">;

function formatRemaining(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1_000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function stageLabel(stage: FamiliarGrowthStage) {
  return stage === "cucciolo" ? "Cucciolo" : stage === "giovane" ? "Giovane" : "Adulto";
}

function historyDate(timestamp: number) {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Rome",
  }).format(new Date(timestamp));
}

function RewardChips({ reward }: { reward: RewardValues }) {
  return <ul className={styles.rewardChips} aria-label="Ricompense garantite">
    <li><span aria-hidden="true">✦</span><strong>{reward.adventureXp}</strong> XP esplorazione</li>
    <li><span aria-hidden="true">◉</span><strong>{reward.nexusCoins}</strong> Monete</li>
    {reward.nightSigils > 0 ? <li><span aria-hidden="true">◆</span><strong>{reward.nightSigils}</strong> Sigilli</li> : null}
    {reward.relicFragments > 0 ? <li><span aria-hidden="true">◇</span><strong>{reward.relicFragments}</strong> Frammenti</li> : null}
  </ul>;
}

function dungeonById(dungeonId: FamiliarDungeonId | undefined | null): FamiliarDungeon | null {
  return FAMILIAR_DUNGEONS.find((entry) => entry.id === dungeonId) ?? null;
}

export function FamiglioAdventure({ familiarId, familiarName, colorVariant, growthStage, state, setState, testMode, onReward, onMissionActivity, onReturnHome, activityGate }: FamiglioAdventureProps) {
  const [now, setNow] = useState(() => Date.now());
  const [dungeonPage, setDungeonPage] = useState(0);
  const [compactLayout, setCompactLayout] = useState(false);
  const displayedFamiliarId = state.expedition?.familiarId ?? state.pendingReward?.familiarId ?? familiarId;
  const displayedFamiliar = FAMILIAR_COLLECTION.find((entry) => entry.id === displayedFamiliarId);
  const displayedFamiliarName = displayedFamiliarId === familiarId ? familiarName : displayedFamiliar?.name ?? familiarName;
  const progress = familiarAdventureProgress(state, displayedFamiliarId);
  const expeditionsToday = familiarExpeditionsToday(state, now);
  const dailyLimitReached = expeditionsToday >= FAMILIAR_DAILY_EXPEDITION_LIMIT;
  const expeditionDungeon = dungeonById(state.expedition?.dungeonId);
  const rewardDungeon = dungeonById(state.pendingReward?.dungeonId);
  const remaining = expeditionRemainingMs(state, now);
  const expeditionReady = Boolean(state.expedition && remaining === 0);
  const expeditionEvent = familiarExpeditionEvent(state);
  const choiceAvailable = expeditionChoiceIsAvailable(state, now, testMode);
  const starter = STARTER_EGGS.find((entry) => entry.id === displayedFamiliarId);
  const starterVariant = displayedFamiliarId === familiarId ? colorVariant : null;
  const travelSprite = starter && starterVariant
    ? `/famiglio/rebuild/starters/${starter.id}/walk-${starterVariant}.png`
    : `/famiglio/rebuild/collection/${displayedFamiliarId}/growth/${progress.stage}/house/walk.png`;
  const travelFrameCount = starter && starterVariant
    ? (({ cat: 7, rabbit: 8, parrot: 6 } as Partial<Record<(typeof STARTER_EGGS)[number]["id"], number>>)[starter.id] ?? 4)
    : 4;
  const travelFrameEnd = `${travelFrameCount / Math.max(1, travelFrameCount - 1) * 100}%`;
  const history = state.history.filter((entry) => entry.familiarId === familiarId).slice(0, 4);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 720px)");
    const update = () => setCompactLayout(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!state.expedition || state.pendingReward) return;
    const interval = window.setInterval(() => {
      const instant = Date.now();
      setNow(instant);
      setState((current) => {
        if (!current.expedition || current.pendingReward || current.expedition.endsAt > instant) return current;
        const completed = completeFamiliarExpedition(current, instant);
        return completed.ok ? completed.state : { ...current, lastMessage: completed.error };
      });
    }, 1_000);
    return () => window.clearInterval(interval);
  }, [setState, state.expedition, state.pendingReward]);

  useEffect(() => {
    if (!state.battle) return;
    setState((current) => current.battle ? {
      ...current,
      battle: null,
      expedition: null,
      pendingReward: null,
      lastMessage: "Le vecchie battaglie sono state spostate nella sezione Lotte.",
    } : current);
  }, [setState, state.battle]);

  const start = (dungeonId: FamiliarDungeonId) => {
    if (activityGate && !activityGate.allowed) {
      setState((current) => ({ ...current, lastMessage: activityGate.reason ?? "Il Famiglio non e pronto a partire." }));
      return;
    }
    setState((current) => {
      const result = startFamiliarExpedition(current, familiarId, dungeonId);
      return result.ok ? result.state : { ...current, lastMessage: result.error };
    });
    setNow((current) => current + 1);
  };

  const completePreviewTimer = () => {
    if (!testMode) return;
    const completedAt = now;
    setState((current) => current.expedition && !current.pendingReward
      ? completeFamiliarExpedition({
        ...current,
        expedition: { ...current.expedition, endsAt: completedAt - 1 },
      }, completedAt).state
      : current);
    setNow(completedAt);
  };

  const completeExpedition = () => {
    const completedAt = now;
    setState((current) => {
      const result = completeFamiliarExpedition(current, completedAt);
      return result.ok ? result.state : { ...current, lastMessage: result.error };
    });
    setNow(completedAt);
  };

  const resolveChoice = (choiceId: string) => {
    setState((current) => {
      const result = resolveFamiliarExpeditionChoice(current, choiceId, now, testMode);
      return result.ok ? result.state : { ...current, lastMessage: result.error };
    });
  };

  const claimReward = () => {
    const result = claimFamiliarAdventureReward(state, now);
    if (!result.ok) {
      setState((current) => ({ ...current, lastMessage: result.error }));
      return;
    }
    setState(result.state);
    onReward(result.reward);
    const completionId = result.state.history[0]?.id ?? `${result.reward.familiarId}:${result.reward.dungeonId}:${now}`;
    onMissionActivity?.("familiar_expedition", completionId);
  };

  return <section className={styles.adventure} aria-label="Spedizioni del Nexus">
    <header className={styles.header}>
      <div>
        <small>Esplorazione fuori dalla Casa</small>
        <h2>Spedizioni del Nexus</h2>
        <p>{familiarName} esplora a tempo e riporta ricompense. Le Lotte hanno una sezione separata.</p>
      </div>
      <button type="button" onClick={onReturnHome}>Torna alla Casa</button>
    </header>

    <div className={styles.progressRibbon}>
      <div><small>Famiglio</small><strong>{familiarName}</strong></div>
      <div><small>Crescita</small><strong>{stageLabel(progress.stage || growthStage)}</strong></div>
      <div><small>Esplorazione</small><strong>{progress.adventureXp} XP</strong></div>
      <div><small>Spedizioni oggi</small><strong>{expeditionsToday}/{FAMILIAR_DAILY_EXPEDITION_LIMIT}</strong></div>
    </div>

    <main className={styles.workspace}>
      {!state.expedition && !state.pendingReward ? <section className={styles.dungeonSelection}>
        <div className={styles.intro} data-limit-reached={dailyLimitReached || activityGate?.allowed === false}>
          <span aria-hidden="true">✦</span>
          <div><strong>{dailyLimitReached ? "Spedizioni di oggi completate" : activityGate?.allowed === false ? "Prima prenditi cura del Famiglio" : "Scegli una spedizione"}</strong><p>{dailyLimitReached ? "Hai utilizzato le 3 partenze disponibili. Nuove spedizioni saranno disponibili domani." : activityGate?.allowed === false ? activityGate.reason : "Il timer continua anche fuori da questa schermata. Al rientro riscatti direttamente la ricompensa."}</p></div>
        </div>
        <div className={styles.dungeonGrid}>
          {(compactLayout ? FAMILIAR_DUNGEONS.slice(dungeonPage, dungeonPage + 1) : FAMILIAR_DUNGEONS).map((dungeon) => {
            const unlocked = dungeonIsUnlocked(progress.stage, dungeon);
            return <article className={styles.dungeonCard} key={dungeon.id} style={{ backgroundImage: `linear-gradient(180deg, rgba(14,9,25,.08) 10%, rgba(14,9,25,.97) 84%), url(${dungeon.backgroundSrc})` }}>
              <div className={styles.dungeonCopy}>
                <small>{dungeon.durationMinutes} minuti · da {stageLabel(dungeon.minimumStage)}</small>
                <h3>{dungeon.name}</h3>
                <p>{dungeon.description}</p>
              </div>
              <RewardChips reward={dungeon.reward} />
              <button type="button" disabled={!unlocked || dailyLimitReached || activityGate?.allowed === false} onClick={() => start(dungeon.id)}>{dailyLimitReached ? "Limite raggiunto" : activityGate?.allowed === false ? "Non pronto" : unlocked ? "Parti" : `Richiede ${stageLabel(dungeon.minimumStage)}`}</button>
            </article>;
          })}
          {compactLayout ? <nav className={styles.dungeonPager} aria-label="Pagine delle spedizioni">
            <button type="button" disabled={dungeonPage === 0} onClick={() => setDungeonPage((page) => Math.max(0, page - 1))}>‹</button>
            <strong>{dungeonPage + 1} / {FAMILIAR_DUNGEONS.length}</strong>
            <button type="button" disabled={dungeonPage >= FAMILIAR_DUNGEONS.length - 1} onClick={() => setDungeonPage((page) => Math.min(FAMILIAR_DUNGEONS.length - 1, page + 1))}>›</button>
          </nav> : null}
        </div>
      </section> : null}

      {state.expedition && !state.pendingReward && expeditionDungeon ? <section className={styles.expeditionPanel}>
        <div className={styles.expeditionScene} style={{ backgroundImage: `url(${expeditionDungeon.backgroundSrc})` }}>
          <div
            className={styles.travelFamiliar}
            style={{
              backgroundImage: `url(${travelSprite})`,
              "--travel-frame-count": travelFrameCount,
              "--travel-frame-end": travelFrameEnd,
            } as CSSProperties}
            aria-label={`${displayedFamiliarName} in cammino`}
          />
          <div className={styles.expeditionShade} />
          <div className={styles.expeditionCopy}>
            <small>{expeditionReady ? "Rientro pronto" : "Spedizione in corso"}</small>
            <h3>{expeditionDungeon.name}</h3>
            <strong role="timer" aria-live="polite">{expeditionReady ? "Completata" : formatRemaining(remaining)}</strong>
            <p>{expeditionReady ? `${displayedFamiliarName} è tornato con ciò che ha trovato.` : `${displayedFamiliarName} continua a esplorare. Il timer non si interrompe se torni alla Casa.`}</p>
          </div>
        </div>
        {expeditionEvent ? <section className={styles.expeditionChoice} data-resolved={Boolean(state.expedition.choiceId)}>
          <div><small>Imprevisto del viaggio</small><h3>{expeditionEvent.title}</h3><p>{state.expedition.choiceOutcome ?? expeditionEvent.prompt}</p></div>
          {!state.expedition.choiceId && choiceAvailable ? <div className={styles.choiceGrid}>{expeditionEvent.choices.map((choice) => <button type="button" key={choice.id} onClick={() => resolveChoice(choice.id)}><strong>{choice.label}</strong><span>{choice.description}</span><small>Ricompensa ×{choice.rewardMultiplier.toFixed(2)}</small></button>)}</div> : null}
          {!state.expedition.choiceId && !choiceAvailable ? <span className={styles.choiceWaiting}>L&apos;imprevisto comparirà durante il viaggio.</span> : null}
          {state.expedition.choiceId ? <strong className={styles.choiceResolved}>Scelta compiuta · ricompensa ×{state.expedition.rewardMultiplier.toFixed(2)}</strong> : null}
        </section> : null}
        <div className={styles.expeditionDetails}>
          <div><small>Luogo</small><strong>{expeditionDungeon.name}</strong></div>
          <div><small>Stato</small><strong>{expeditionReady ? "Pronto al rientro" : "Esplorazione attiva"}</strong></div>
          <RewardChips reward={{
            nexusCoins: Math.round(expeditionDungeon.reward.nexusCoins * (state.expedition.rewardMultiplier || 1)),
            nightSigils: Math.round(expeditionDungeon.reward.nightSigils * (state.expedition.rewardMultiplier || 1)),
            relicFragments: Math.round(expeditionDungeon.reward.relicFragments * (state.expedition.rewardMultiplier || 1)),
            adventureXp: Math.round(expeditionDungeon.reward.adventureXp * (state.expedition.rewardMultiplier || 1)),
          }} />
        </div>
        <div className={styles.expeditionActions}>
          {testMode && !expeditionReady ? <button type="button" onClick={completePreviewTimer}>Completa subito · prova</button> : null}
          {expeditionReady ? <button type="button" onClick={completeExpedition}>Concludi la spedizione</button> : null}
          <button type="button" className={styles.secondaryButton} onClick={onReturnHome}>Continua altrove</button>
        </div>
      </section> : null}

      {state.pendingReward && rewardDungeon ? <section className={styles.rewardPanel}>
        <div className={styles.rewardArtwork} style={{ backgroundImage: `linear-gradient(90deg, rgba(18,10,31,.94), rgba(18,10,31,.45)), url(${rewardDungeon.backgroundSrc})` }}>
          <small>Spedizione completata</small>
          <h3>{rewardDungeon.name}</h3>
          <p>{displayedFamiliarName} è rientrato. La ricompensa resta qui finché non la riscatti.</p>
        </div>
        <div className={styles.rewardReceipt}>
          <div><small>Ricompensa pronta</small><strong>Rientro completato</strong><p>Il bottino della spedizione è pronto. L’esperienza ottenuta appartiene all’esplorazione e non modifica l’affetto.</p></div>
          <RewardChips reward={state.pendingReward} />
          <button type="button" onClick={claimReward}>Riscatta ricompensa</button>
        </div>
      </section> : null}

      <details className={styles.historyPanel} aria-label="Cronologia spedizioni">
        <summary><div><small>Diario di viaggio</small><h3>Cronologia spedizioni</h3></div><span>{history.length} recenti</span></summary>
        {history.length ? <ol>
          {history.map((entry) => {
            const dungeon = dungeonById(entry.dungeonId);
            return <li key={entry.id}>
              <div><strong>{dungeon?.name ?? "Sentiero del Nexus"}</strong><time dateTime={new Date(entry.completedAt).toISOString()}>{historyDate(entry.completedAt)}</time></div>
              <span>+{entry.adventureXp} XP · {entry.nexusCoins} Monete{entry.nightSigils ? ` · ${entry.nightSigils} Sigilli` : ""}{entry.relicFragments ? ` · ${entry.relicFragments} Frammenti` : ""}</span>
            </li>;
          })}
        </ol> : <p className={styles.emptyHistory}>La prima spedizione completata comparirà qui.</p>}
      </details>
    </main>

    <footer className={styles.message} aria-live="polite">{state.lastMessage}</footer>
  </section>;
}
