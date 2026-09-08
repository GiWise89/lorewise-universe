"use client";
import {useEffect,useRef,useState,type ReactNode} from "react";
import {advanceCloud,createCloudRun,jumpCloud,CLOUD_PLAYER_X} from "@/lib/famiglioCloudJump";
import ui from "./FamiglioDailyMiniGame.module.css";
import styles from "./FamiglioCloudGame.module.css";
import {useFamiglioMiniGameAudio} from "./useFamiglioMiniGameAudio";
import {FamiglioCampaignNpcCanvas} from "./FamiglioCampaignNpcCanvas";
const art=(name:string)=>`/famiglio/rebuild/effects/minigame-jump-${name}-v1.png`;
export function FamiglioCloudGame({pet,familiarName,bestScore,rewarded,onClose,onExit,onComplete}:{pet:ReactNode;familiarName:string;bestScore:number;rewarded:boolean;onClose:()=>void;onExit:()=>void;onComplete:(score:number)=>void}){
  const [run,setRun]=useState(()=>createCloudRun());
  const [phase,setPhase]=useState<"intro"|"playing"|"paused">("intro");
  const [quitting,setQuitting]=useState(false);
  const dialog=useRef<HTMLElement>(null),submitted=useRef(false);
  const active=phase==="playing"&&!run.finished;
  const audio=useFamiglioMiniGameAudio(active),counts=useRef({hits:0,misses:0});
  const {sound}=audio;
  const jump=()=>{if(active){if(run.grounded||run.coyote>0)sound("jump");setRun(s=>jumpCloud(s));}};
  useEffect(()=>{const old=counts.current;if(active){if(run.hits>old.hits)sound("collect");if(run.misses>old.misses)sound("error");}counts.current={hits:run.hits,misses:run.misses};},[active,run.hits,run.misses,sound]);
  const finish=()=>{if(!submitted.current){submitted.current=true;onComplete(run.score);}onExit();};
  const close=()=>{if(run.finished){finish();return;}if(phase==="intro")onClose();else if(!run.finished){setPhase("paused");setQuitting(true);}};
  useEffect(()=>{const before=document.activeElement as HTMLElement|null;dialog.current?.focus();return()=>before?.focus();},[]);
  useEffect(()=>{
    if(!active)return;
    let last=performance.now(),frame=0;
    const tick=(now:number)=>{const dt=Math.min(100,now-last);last=now;setRun(s=>advanceCloud(s,dt));frame=requestAnimationFrame(tick);};
    frame=requestAnimationFrame(tick);
    const hide=()=>{if(document.hidden)setPhase("paused");};document.addEventListener("visibilitychange",hide);
    return()=>{cancelAnimationFrame(frame);document.removeEventListener("visibilitychange",hide);};
  },[active]);
  const reward=rewarded?0:8+Math.min(20,run.score);
  return <div className={ui.backdrop}><section ref={dialog} tabIndex={-1} className={ui.sheet} role="dialog" aria-modal="true" aria-labelledby="cloud-title" data-famiglio-audio-scope="combat" onKeyDown={e=>{
    if(e.key==="Escape"){e.preventDefault();close();}
    if(active&&(e.code==="Space"||e.key==="ArrowUp")){e.preventDefault();if(!e.repeat)jump();}
    if(e.key==="Tab"){const buttons=Array.from(dialog.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')??[]),i=buttons.indexOf(document.activeElement as HTMLButtonElement);if(e.shiftKey&&i<=0){e.preventDefault();buttons.at(-1)?.focus();}else if(!e.shiftKey&&(i<0||i===buttons.length-1)){e.preventDefault();buttons[0]?.focus();}}
  }}>
    <header><div><small>Gioca con {familiarName}</small><h2 id="cloud-title">Salto tra le nuvole</h2></div>{run.finished?<button type="button" onClick={finish}>Esci</button>:<button onClick={close} aria-label="Torna alla scelta dei minigiochi">←</button>}</header>
    {phase!=="intro"?<div className={ui.hud}><span><b>{run.score}</b> punti</span><span>Vite <b>{run.lives}/3</b></span>{active?<button onClick={()=>setPhase("paused")} aria-label="Pausa">Ⅱ</button>:null}</div>:null}
    <div className={ui.soundBar}><button type="button" onClick={audio.toggle} aria-pressed={!audio.muted} aria-label={audio.muted?"Attiva musica ed effetti":"Disattiva musica ed effetti"}><img src="/famiglio/rebuild/combat/ui/control-audio.png" alt="" />{audio.muted?"Audio spento":"Audio acceso"}</button></div>
    <div className={styles.scene}>
      <img className={styles.background} src={art("bg")} alt="" />
      {phase!=="intro"?<div className={styles.world}>
        {run.platforms.filter(p=>!p.broken).map(p=><div key={p.id} className={styles.platform} data-kind={p.kind} data-crumbling={p.kind==='fragile'&&(p.contact??0)>0} style={{left:`${(p.x-run.camera)/6}%`,top:`${(p.y-6)/4}%`,width:`${p.width/6}%`,height:'12%'}}><img className={styles.cloud} src={`/famiglio/rebuild/effects/cloud-variants-v3/cloud${p.id%6+1}.png`} alt=""/>{p.kind==='fragile'?<small>!</small>:p.kind==='bonus'?<small>+4</small>:p.kind==='moving'?<small>↕</small>:null}</div>)}
        {run.platforms.filter(p=>p.gem).map(p=><img key={p.id} className={styles.gem} src={art("gem")} alt="" style={{left:`${(p.x+p.width*.35-run.camera)/6}%`,top:`${(p.y-65)/4}%`}}/>)}
        {run.enemies.filter(e=>!e.passed).map(enemy=><div key={enemy.id} className={styles.enemy} style={{left:`${(enemy.x-run.camera)/6}%`,top:`${enemy.y/4}%`}}><FamiglioCampaignNpcCanvas src="/famiglio/rebuild/combat/campaign/npcs/distinct-v3/07-jinra.png" label="Jinra, ostacolo volante" pose="command"/>{enemy.warnedAt!==null&&run.elapsed-enemy.warnedAt<1100?<small>Attento!</small>:null}</div>)}
        <div className={styles.pet} data-airborne={!run.grounded} style={{left:`${CLOUD_PLAYER_X/6}%`,top:`${run.y/4}%`}}>{pet}</div>
        {active?<button className={styles.jumpSurface} aria-label="Salta tra le nuvole" onPointerDown={e=>{if(e.button===0){e.preventDefault();jump();}}} onClick={e=>{if(e.detail===0)jump();}}/>:null}
        <output className={styles.feedback} aria-live="polite">{run.feedbackUntil>run.elapsed?run.feedback:""}</output>
      </div>:null}
      {phase==="intro"?<div className={`${ui.overlay} ${styles.explanation}`}><img src="/famiglio/rebuild/effects/minigame-jump-icon-v1.png" alt=""/><h3>Come si gioca</h3><p>Tocca per saltare. Le nuvole cambiano dimensione: quelle con ↕ si muovono, quelle con ! si dissolvono se ti fermi. Le nuvole alte offrono gemme da +4, ma puoi seguire il percorso basso.</p><p>Evita Jinra: il suo arrivo viene segnalato. Cadute e contatti costano una vita. Nuova nuvola: +1, gemma normale: +2. Hai 3 vite, senza limite di tempo.</p><small>Record oggi: {bestScore} · {rewarded?"Premio già raccolto: migliora il record.":"Un solo premio giornaliero condiviso tra i quattro giochi."}</small><div className={ui.introActions}><button onClick={onClose}>← Indietro</button><button onClick={()=>{audio.unlock();setPhase("playing");}}>Gioca</button></div></div>:null}
      {phase==="paused"&&!run.finished?<div className={ui.overlay}><h3>{quitting?"Lasciare la partita?":"In pausa"}</h3><p>Il tempo è fermo. Uscendo non raccoglierai il premio di questa partita.</p><button onClick={()=>{audio.unlock();setQuitting(false);setPhase("playing");}}>Riprendi</button><button onClick={onClose}>Esci senza premio</button></div>:null}
      {run.finished?<div className={ui.overlay}><img src={art("gem")} alt=""/><h3>{run.score>bestScore?"Nuovo record!":run.lives===0?"Viaggio concluso":"Tra le nuvole!"}</h3><strong>{run.score} punti</strong><p>{rewarded?"Salva il tuo record di oggi.":`Hai guadagnato ${reward} Monete Nexus.`}</p><button type="button" onClick={finish}>Torna alla Casa</button><small>{rewarded?"Il record viene salvato quando esci.":"Uscendo raccogli anche le monete della partita."}</small></div>:null}
    </div>
    <footer>Tocca lo scenario per saltare · tastiera: Spazio o ↑</footer>
  </section></div>;
}
