"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { FAMILIAR_MINIGAME_NAMES, type FamiliarMiniGameKind } from "@/lib/famiglioWeeklyLoop";
import { memoryCue, miniGameStage, type MiniGameRun } from "@/lib/famiglioMiniGameEngine";
import { FamiglioCloudGame } from "./FamiglioCloudGame";
import { useFamiglioMiniGameAudio } from "./useFamiglioMiniGameAudio";
import { useFamiglioRankedMatch } from "./useFamiglioRankedMatch";
import { FamiglioLeaderboard } from "./FamiglioLeaderboard";
import { FamiglioPaceNotice } from "./FamiglioPaceNotice";
import styles from "./FamiglioDailyMiniGame.module.css";
const RULES = {
  light: "Tocca la lucciola prima che la sua luce si esaurisca. A ogni cattura cambia posto. Ogni 10 secondi accelera ancora, anche se sbagli. Se la lasci scadere perdi una vita. La dorata vale +3 e scompare prima: è facoltativa, ma la normale resta da catturare.",
  catch: "Tocca una corsia per spostare il Famiglio. Raccogli le stelle (+1) e lascia cadere le spine rosse: se le prendi perdi una vita e 1 punto. Una stella lasciata cadere costa una vita. Ogni 10 secondi stelle e spine scendono più veloci e più vicine. Nella pioggia di stelle segui il percorso luminoso fra le spine.",
  memory: "Osserva le rune illuminate, poi ripeti lo stesso ordine. Ogni sequenza completata si allunga. Ogni 10 secondi aumenta la velocità delle nuove sequenze. Ogni sequenza sbagliata costa una vita. Dal ritmo 3, alcuni turni SPECCHIO chiedono di rispondere al contrario: sono annunciati prima.",
};
type MiniGameProps = {
  practice?: boolean; kind: FamiliarMiniGameKind; familiarName: string; familiarSprite: string; durationSeconds?: number;
  familiarVisual?: ReactNode;
  bestScore?: number; scores?: Partial<Record<FamiliarMiniGameKind, number>>; rewarded?: boolean; onClose: () => void; onComplete: (score: number, kind: FamiliarMiniGameKind) => void;
};
const MODES: FamiliarMiniGameKind[] = ["light", "jump", "catch", "memory"];
const gameIcon = (kind: FamiliarMiniGameKind) => `/famiglio/rebuild/effects/minigame-${kind}-icon-v1.png`;
const gameAsset = (name: string) => `/famiglio/rebuild/effects/minigame-${name}-v2.png`;
const RUNE_ASSETS = ["rune-diamond", "rune-circle", "rune-triangle", "rune-star"];
export function FamiglioDailyMiniGame(props: MiniGameProps) {
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [selected, setSelected] = useState<FamiliarMiniGameKind | null>(null);
  const picker = useRef<HTMLElement>(null);
  useEffect(() => {
    if (selected || leaderboardOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    picker.current?.focus();
    return () => previous?.focus();
  }, [selected, leaderboardOpen]);
  const best = (kind: FamiliarMiniGameKind) => props.scores?.[kind] ?? (kind === props.kind ? props.bestScore ?? 0 : 0);
  if (leaderboardOpen) return <FamiglioLeaderboard practice={props.practice} onClose={() => setLeaderboardOpen(false)} />;
  if (selected === "jump") return <FamiglioCloudGame practice={props.practice} familiarName={props.familiarName} pet={props.familiarVisual ?? <img src={props.familiarSprite} alt={props.familiarName} />} bestScore={best("jump")} rewarded={props.rewarded ?? false} onClose={() => setSelected(null)} onExit={props.onClose} onComplete={score => props.onComplete(score, "jump")} />;
  if (selected) return <MiniGameSession key={selected} {...props} kind={selected} bestScore={best(selected)} onClose={() => setSelected(null)} />;
  return <div className={styles.backdrop}><section ref={picker} tabIndex={-1} className={`${styles.sheet} ${styles.picker}`} role="dialog" aria-modal="true" aria-labelledby="game-picker-title" onKeyDown={event => {
    if (event.key === "Escape") { event.preventDefault(); props.onClose(); }
    if (event.key === "Tab") {
      const buttons = Array.from(picker.current?.querySelectorAll<HTMLButtonElement>("button") ?? []);
      const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
      if (event.shiftKey && index <= 0) { event.preventDefault(); buttons.at(-1)?.focus(); }
      else if (!event.shiftKey && (index < 0 || index === buttons.length-1)) { event.preventDefault(); buttons[0]?.focus(); }
    }
  }}><header><div><small>Gioca con {props.familiarName}</small><h2 id="game-picker-title">Scegli il minigioco</h2></div><button type="button" onClick={props.onClose} aria-label="Chiudi la scelta dei minigiochi">×</button></header>
    <button type="button" className={styles.leaderboardButton} onClick={() => setLeaderboardOpen(true)}>Classifiche settimanali · 100 monete al primo</button>
    <p className={styles.pickerHint}>Scegli un gioco per scoprire come si gioca.</p>
    <div className={styles.modeChoices}>{MODES.map(kind => <button type="button" key={kind} onClick={() => setSelected(kind)}><img className={styles.gameIcon} src={gameIcon(kind)} alt="" /><strong>{FAMILIAR_MINIGAME_NAMES[kind]}</strong></button>)}</div>
  </section></div>;
}
function MiniGameSession({ practice = false, kind, familiarName, familiarSprite, familiarVisual, bestScore = 0, rewarded = false, onClose, onComplete }: Omit<MiniGameProps, "kind"> & { kind: Exclude<FamiliarMiniGameKind, "jump"> }) {
  const match = useFamiglioRankedMatch(kind, practice);
  const run = match.run as MiniGameRun;
  const {dispatch} = match;
  const [phase, setPhase] = useState<"intro" | "playing" | "paused">("intro");
  const [quitting, setQuitting] = useState(false);
  const submitted = useRef(false);
  const dialog = useRef<HTMLElement>(null);
  const active = phase === "playing" && !run.finished && !quitting;
  const audio = useFamiglioMiniGameAudio(active,kind === "memory");
  const {sound}=audio;
  const previousCounts = useRef({hits:0,misses:0});
  const cue = memoryCue(run);
  const pet = familiarVisual ?? <img src={familiarSprite} alt={familiarName} />;
  const strike = (index: number) => { if (active) { if(kind === "memory" && !cue.showing)sound("rune",index); dispatch({type:"input",value:index}); } };
  const start = async () => { audio.unlock(); if(await match.start()){setQuitting(false); setPhase("playing");} };
  useEffect(()=>{if(active&&kind === "memory"&&cue.pad>=0)sound("rune",cue.pad);},[active,kind,cue.pad,sound]);
  useEffect(()=>{const old=previousCounts.current;if(active&&kind!=="memory"){if(run.hits>old.hits)sound(kind === "light"?"light":"collect");if(run.misses>old.misses)sound("error");}previousCounts.current={hits:run.hits,misses:run.misses};},[active,kind,run.hits,run.misses,sound]);
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    dialog.current?.focus();
    return () => previousFocus?.focus();
  }, []);
  // Il pulsante "Gioca" o "Riprendi" scompare all'avvio: senza questo i tasti 1-4 ed Esc
  // arrivavano al body e non muovevano il Famiglio né mettevano in pausa.
  useEffect(() => {
    if (active && !dialog.current?.contains(document.activeElement)) dialog.current?.focus();
  }, [active]);
  useEffect(() => {
    if (!active) return;
    let last = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now(); const delta = Math.min(100, now-last); last = now;
      dispatch({type:"step",value:delta});
    }, 40);
    const hide = () => { if (document.hidden) setPhase("paused"); };
    document.addEventListener("visibilitychange", hide);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", hide); };
  }, [active, kind, dispatch]);
  const close = () => { if (phase === "intro") onClose(); else if (!run.finished) { setPhase("paused"); setQuitting(true); } };
  const reward = rewarded ? 0 : 8 + Math.min(20, run.score);
  return <div className={styles.backdrop}>
    <section ref={dialog} tabIndex={-1} className={styles.sheet} data-kind={kind} data-famiglio-audio-scope="combat" role="dialog" aria-modal="true" aria-labelledby="minigame-title" onKeyDown={event => {
      if (event.key === "Escape") { event.preventDefault(); close(); }
      if (event.key === "Tab") {
        const buttons = Array.from(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled)') ?? []);
        const index = buttons.indexOf(document.activeElement as HTMLElement);
        if (event.shiftKey && index <= 0) { event.preventDefault(); buttons.at(-1)?.focus(); }
        else if (!event.shiftKey && (index === buttons.length-1 || index < 0)) { event.preventDefault(); buttons[0]?.focus(); }
      }
      const key = ["1","2","3","4"].indexOf(event.key);
      if (key >= 0 && kind !== "light" && !event.repeat) { event.preventDefault(); strike(key); }
    }}>
      <header><div><small>{rewarded ? "Allenamento · premio di oggi già raccolto" : "Gioco del giorno · premio giornaliero"}</small><h2 id="minigame-title">{FAMILIAR_MINIGAME_NAMES[kind]}</h2></div>{!run.finished ? <button onClick={close} aria-label="Torna alla scelta dei minigiochi">←</button> : null}</header>
      {phase !== "intro" ? <div className={styles.hud}><span aria-label={`${run.lives} vite rimaste su 3`}>Vite <b>{run.lives}/3</b></span><span><b>{run.score}</b> punti</span><span>Record oggi <b>{Math.max(bestScore,run.score)}</b></span><span>Ritmo <b>{miniGameStage(run.elapsed)+1}</b></span>{active ? <button onClick={() => setPhase("paused")} aria-label="Pausa">Ⅱ</button> : null}</div> : null}
      <div className={styles.soundBar}><button type="button" onClick={audio.toggle} aria-pressed={!audio.muted} aria-label={audio.muted?"Attiva musica ed effetti":"Disattiva musica ed effetti"}><img src="/famiglio/rebuild/combat/ui/control-audio.png" alt="" />{audio.muted?"Audio spento":"Audio acceso"}</button></div>
      {phase !== "intro" ? <FamiglioPaceNotice elapsed={run.elapsed} active={active} sound={sound} message={run.finished ? "" : kind === "memory" && run.mirror ? "SPECCHIO · Rispondi dall’ultima runa alla prima" : kind === "catch" && (run.rainRemaining > 0 || run.notes.some(note => note.rain)) ? "PIOGGIA DI STELLE · Segui il percorso!" : run.golden ? "DORATA +3 · La normale resta da catturare" : ""} /> : null}
      <div className={styles.arena}>
        {phase !== "intro" ? <>
          {kind === "light" ? <><div className={styles.pet} style={{ left: `${run.target.x}%`, top: "80%" }}>{pet}</div><button disabled={!active} className={styles.target} style={{ left: `${run.target.x}%`, top: `${run.target.y}%` }} onClick={() => strike(0)} aria-label="Cattura la lucciola"><img className={styles.targetSprite} src={gameIcon("light")} alt="" /><progress max={2000} value={Math.max(0,run.target.expires-run.elapsed)} /></button></> : null}
          {kind === "light" && run.golden ? <button type="button" disabled={!active} className={`${styles.target} ${styles.goldenTarget}`} style={{left:`${run.golden.x}%`,top:`${run.golden.y}%`}} aria-label="Cattura la lucciola dorata: 3 punti" onClick={() => {if(active) dispatch({type:"gold",value:0});}}><img className={styles.targetSprite} src={gameIcon("light")} alt="" /><strong>+3</strong></button> : null}
          {kind === "catch" ? <div className={styles.lanes}>
            {[0,1,2,3].map(index => <button key={index} disabled={!active} aria-label={`Corsia ${index+1}`} className={styles.lane} data-selected={kind === "catch" && run.lane === index} onPointerDown={event => { if (event.pointerType !== "mouse" || event.button === 0) { event.preventDefault(); strike(index); } }} onClick={event => { if (event.detail === 0) strike(index); }}><span>{index+1}</span></button>)}
            <div className={styles.hitLine}>RACCOGLI LE STELLE</div>
            {run.notes.map(note => <img key={note.id} className={styles.note} data-hazard={note.hazard} data-rain={note.rain && !note.hazard} style={{ left: `${12.5+25*note.lane}%`, top: `${8+70*(run.elapsed-note.born)/note.travel}%` }} src={note.hazard ? gameAsset("thorn") : gameAsset("star")} alt="" />)}
            <div className={styles.pet} style={{ left: kind === "catch" ? `${12.5+25*run.lane}%` : "50%", top: kind === "catch" ? "78%" : "20%" }}>{pet}</div>
          </div> : null}
          {kind === "memory" ? <div className={styles.memory} data-mirror={run.mirror}><p>{cue.showing ? (run.mirror ? "Guarda: poi rispondi al contrario…" : "Guarda la sequenza…") : `${run.mirror ? "Al contrario" : "Tocca a te"} · ${run.memoryIndex}/${run.sequence.length}`}</p><output className={styles.memoryFeedback} aria-live="polite">{run.feedbackUntil > run.elapsed ? run.feedback : ""}</output><div className={styles.pads}>{RUNE_ASSETS.map((rune,index) => <button key={rune} disabled={!active || cue.showing} data-lit={cue.pad === index} onClick={() => strike(index)} aria-label={`Runa ${index+1}: ${["rombo","cerchio","triangolo","stella"][index]}`}><img src={gameAsset(rune)} alt="" /><small>{index+1}</small></button>)}</div><div className={styles.petPortrait}>{pet}</div></div> : null}
          {run.traps.map(trap => <button key={trap.id} type="button" className={styles.trap} disabled={!active} style={{ left: `${trap.x}%`, top: `${trap.y}%` }} aria-label="Trappola cacca: perdi un punto se la premi" onClick={() => { if (active) dispatch({type:"trap",value:trap.id}); }}><span className={styles.poopIcon} aria-hidden="true" /><progress max={2000} value={Math.max(0,trap.expires-run.elapsed)} /></button>)}
          {kind !== "memory" ? <output className={styles.feedback} aria-live="polite">{run.feedbackUntil > run.elapsed ? run.feedback : ""}</output> : null}
        </> : null}
        {phase === "intro" ? <div className={styles.overlay}><img className={styles.gameIcon} src={gameIcon(kind)} alt="" /><h3>Come si gioca</h3><p>{RULES[kind]}</p>{kind === "light" ? <p className={styles.trapRule}><span className={styles.poopIcon} aria-hidden="true" />Evita le caselle con la cacca: se le premi perdi una vita e 1 punto!</p> : null}<small>3 vite, senza limite di tempo · difficoltà crescente ogni 10 secondi · {familiarName} · Record oggi: {bestScore}</small><p>{rewarded ? "Migliora il record di oggi. Nessuna moneta aggiuntiva." : "Prima partita del giorno: 8 monete + 1 per punto, fino a 28. Un solo premio al giorno, condiviso tra i quattro giochi."}</p><p role="status">{match.status}</p><div className={styles.introActions}><button type="button" onClick={onClose}>← Indietro</button><button type="button" disabled={match.starting} onClick={() => void start()}>{match.starting?"Preparazione…":"Gioca"}</button></div></div> : null}
        {phase === "paused" && !run.finished ? <div className={styles.overlay}><h3>{quitting ? "Lasciare la partita?" : "In pausa"}</h3><p>{quitting ? "Questa partita non assegnerà premi. Potrai ricominciare." : "Il tempo si è fermato."}</p><button onClick={() => void start()}>Riprendi</button><button onClick={onClose}>Esci senza premio</button></div> : null}
        {run.finished ? <div className={styles.overlay}><span className={styles.medal} aria-label={`${run.score >= 20 ? 3 : run.score >= 10 ? 2 : 1} stelle`}>{Array.from({length:run.score >= 20 ? 3 : run.score >= 10 ? 2 : 1},(_,index) => <img key={index} src={gameAsset("star")} alt="" />)}</span><h3>{run.score > bestScore ? "Nuovo record di oggi!" : "Partita completata"}</h3><strong>{run.score} punti</strong><p>{run.hits} riusciti · {run.misses} errori · combo migliore {run.bestCombo}</p><p>{rewarded ? "Premio già raccolto. Il record verrà aggiornato." : `Hai guadagnato ${reward} Monete Nexus.`}</p><p role="status">{match.status}</p>{match.status.startsWith("Record non registrato") ? <button onClick={() => void match.retry()}>Riprova registrazione</button> : null}<button disabled={match.saving} onClick={() => { if (!submitted.current) { submitted.current = true; onComplete(run.score, kind); } }}>{rewarded ? "Torna alla Casa" : `Raccogli ${reward} monete e torna alla Casa`}</button></div> : null}
      </div>
      {!run.finished && phase !== "intro" ? <p className={styles.matchStatus}>{match.status}</p> : null}
      <footer>{kind === "light" ? "Tocca la luce prima che scompaia" : "Tocca le corsie o le rune · tastiera: 1 2 3 4"}</footer>
    </section>
  </div>;
}
