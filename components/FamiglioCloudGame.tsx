"use client";
import {useEffect,useRef,useState,type ReactNode} from "react";
import {type CloudRun,cloudEnemyLabel,cloudRuneCanActivate,cloudRuneX,cloudRunSpeed,cloudSpeedStage,CLOUD_PLATFORM_SURFACE_OFFSET,CLOUD_PLAYER_X,CLOUD_VIEW_HEIGHT,CLOUD_VIEW_WIDTH} from "@/lib/famiglioCloudJump";
import {useFamiglioRankedMatch} from "./useFamiglioRankedMatch";
import {FamiglioPaceNotice} from "./FamiglioPaceNotice";
import ui from "./FamiglioDailyMiniGame.module.css";
import styles from "./FamiglioCloudGame.module.css";
import {useFamiglioMiniGameAudio} from "./useFamiglioMiniGameAudio";
import {FamiglioCampaignNpcCanvas} from "./FamiglioCampaignNpcCanvas";
import {CLOUD_NPCS} from "@/lib/famiglioCloudJump";
const art=(name:string)=>`/famiglio/rebuild/effects/minigame-jump-${name}-v1.png`;
const platformArt=(width:number)=>`/famiglio/rebuild/effects/minigame-jump-platform-${width<220?"short":width<300?"medium":"long"}-v5.png`;
export function FamiglioCloudGame({pet,familiarName,bestScore,rewarded,onClose,onExit,onComplete,practice=false}:{practice?:boolean;pet:ReactNode;familiarName:string;bestScore:number;rewarded:boolean;onClose:()=>void;onExit:()=>void;onComplete:(score:number)=>void}){
 const match=useFamiglioRankedMatch("jump",practice),run=match.run as CloudRun,{dispatch}=match;
 const [phase,setPhase]=useState<"intro"|"playing"|"paused">("intro"),[quitting,setQuitting]=useState(false);
 const dialog=useRef<HTMLElement>(null),submitted=useRef(false),counts=useRef({hits:0,misses:0});
 const active=phase==="playing"&&!run.finished,audio=useFamiglioMiniGameAudio(active),{sound}=audio;
 const jump=()=>{if(active){if(run.grounded||run.coyote>0)sound("jump");dispatch({type:"input",value:0});}};
 useEffect(()=>{const old=counts.current;if(active){if(run.hits>old.hits)sound("collect");if(run.misses>old.misses)sound("error");}counts.current={hits:run.hits,misses:run.misses};},[active,run.hits,run.misses,sound]);
 const finish=()=>{if(!submitted.current){submitted.current=true;onComplete(run.score);}onExit();};
 const close=()=>{if(run.finished){finish();return;}if(phase==="intro")onClose();else{setPhase("paused");setQuitting(true);}};
 useEffect(()=>{const before=document.activeElement as HTMLElement|null;dialog.current?.focus();return()=>before?.focus();},[]);
 useEffect(()=>{if(!active)return;let last=performance.now(),frame=0;const tick=(now:number)=>{const dt=Math.min(100,now-last);last=now;dispatch({type:"step",value:dt});frame=requestAnimationFrame(tick);};frame=requestAnimationFrame(tick);const hide=()=>{if(document.hidden)setPhase("paused");};document.addEventListener("visibilitychange",hide);return()=>{cancelAnimationFrame(frame);document.removeEventListener("visibilitychange",hide);};},[active,dispatch]);
 const start=async()=>{audio.unlock();if(await match.start()){setQuitting(false);setPhase("playing");}};
 const reward=rewarded?0:8+Math.min(20,run.score);
 const visiblePlatforms=run.platforms.filter(platform=>{const x=platform.x-run.camera;return x+platform.width>0&&x<CLOUD_VIEW_WIDTH;});
 const visiblePlatformIds=new Set(visiblePlatforms.map(platform=>platform.id));
 const percentX=(worldX:number)=>`${((worldX-run.camera)/CLOUD_VIEW_WIDTH)*100}%`,percentY=(worldY:number)=>`${(worldY/CLOUD_VIEW_HEIGHT)*100}%`;
 const playerWorldX=run.camera+CLOUD_PLAYER_X;
 const support=run.platforms.find(platform=>playerWorldX>=platform.x+6&&playerWorldX<=platform.x+platform.width-6&&Math.abs(run.y-platform.y)<2);
 const edgeDistance=support?support.x+support.width-playerWorldX:Number.POSITIVE_INFINITY;
 const secondsToGap=edgeDistance/cloudRunSpeed(run.elapsed);
 const jumpWarning=active&&run.grounded&&edgeDistance>0&&secondsToGap<=.72;
 return <div className={ui.backdrop}><section ref={dialog} tabIndex={-1} className={ui.sheet} role="dialog" aria-modal="true" aria-labelledby="cloud-title" data-famiglio-audio-scope="combat" onKeyDown={event=>{if(event.key==="Escape"){event.preventDefault();close();}if(active&&(event.code==="Space"||event.key==="ArrowUp")){event.preventDefault();if(!event.repeat)jump();}}}>
  <header><div><small>Gioca con {familiarName}</small><h2 id="cloud-title">Salto tra le nuvole</h2></div>{run.finished?<button type="button" disabled={match.saving} onClick={finish}>Esci</button>:<button type="button" onClick={close} aria-label="Torna alla scelta dei minigiochi">←</button>}</header>
  {phase!=="intro"?<div className={ui.hud}><span><b>{run.score}</b> punti</span><span>Vite <b>{run.lives}/3</b></span><span>Ritmo <b>{cloudSpeedStage(run.elapsed)+1}</b></span>{active?<button type="button" onClick={()=>setPhase("paused")} aria-label="Pausa">Ⅱ</button>:null}</div>:null}
  <div className={ui.soundBar}><button type="button" onClick={audio.toggle} aria-pressed={!audio.muted} aria-label={audio.muted?"Attiva musica ed effetti":"Disattiva musica ed effetti"}><img src="/famiglio/rebuild/combat/ui/control-audio.png" alt=""/>{audio.muted?"Audio spento":"Audio acceso"}</button></div>
  {phase!=="intro"?<FamiglioPaceNotice elapsed={run.elapsed} active={active} sound={sound}/>:null}
  <div className={styles.scene}><img className={styles.background} src={art("bg")} alt=""/>
   {phase!=="intro"?<div className={styles.world}>
    {visiblePlatforms.map(platform=><div key={platform.id} className={styles.platform} style={{left:percentX(platform.x),top:percentY(platform.y-CLOUD_PLATFORM_SURFACE_OFFSET),width:`${platform.width/CLOUD_VIEW_WIDTH*100}%`}}><img className={styles.platformArt} src={platformArt(platform.width)} alt=""/></div>)}
    {run.platforms.filter(platform=>platform.gem&&visiblePlatformIds.has(platform.id)).map(platform=><img key={platform.id} className={styles.gem} src={art("gem")} alt="" style={{left:percentX(platform.x+platform.width*.42),top:percentY(platform.y-66)}}/>)}
    {run.enemies.filter(enemy=>visiblePlatformIds.has(enemy.platformId)).map(enemy=>{const npc=CLOUD_NPCS[enemy.npcIndex];const behaviorLabel=enemy.behavior==="caster"&&!cloudRuneCanActivate(enemy,run)?"Evocatore":cloudEnemyLabel(enemy);const hit=enemy.hitAt!==null&&run.elapsed-enemy.hitAt<1200;return <div key={enemy.id} className={styles.enemy} data-passed={enemy.passed} data-hit={hit} data-behavior={enemy.behavior} style={{left:percentX(enemy.x),top:percentY(enemy.y)}}><FamiglioCampaignNpcCanvas src={npc.spriteSrc} label={`${npc.name}${hit?": colpito":""}`} pose={hit?"anger":"command"} hitFlash={hit} grounded/>{hit?<><small>COLPITO!</small><span className={styles.impactBurst} aria-hidden="true">✦</span></>:enemy.warnedAt!==null&&run.elapsed-enemy.warnedAt<1000?<small>{behaviorLabel}</small>:<small>{behaviorLabel}</small>}</div>;})}
    {run.enemies.filter(enemy=>enemy.behavior==="caster"&&cloudRuneCanActivate(enemy,run)&&enemy.warnedAt!==null&&!enemy.passed&&visiblePlatformIds.has(enemy.platformId)).map(enemy=><div key={`rune-${enemy.id}`} className={styles.guardianRune} data-armed={run.elapsed-enemy.warnedAt!>=1000} style={{left:percentX(cloudRuneX(enemy)),top:percentY(enemy.y)}} aria-label={run.elapsed-enemy.warnedAt!>=1000?"Runa attiva: salta":"Runa in preparazione"}><span>◇</span></div>)}
    <div className={styles.pet} data-airborne={!run.grounded} style={{left:`${CLOUD_PLAYER_X/CLOUD_VIEW_WIDTH*100}%`,top:percentY(run.y)}}>{pet}</div>
    {jumpWarning&&support?<strong className={styles.jumpCue} style={{left:percentX(support.x+support.width)}}>SALTA ORA</strong>:null}
    {active?<button className={styles.jumpSurface} aria-label="Salta tra le nuvole" onPointerDown={event=>{if(event.pointerType==="touch"||event.button===0){event.preventDefault();jump();}}}/>:null}<output className={styles.feedback} aria-live="polite">{run.feedbackUntil>run.elapsed?run.feedback:""}</output>
   </div>:null}
   {phase==="intro"?<div className={`${ui.overlay} ${styles.explanation}`}><img src="/famiglio/rebuild/effects/minigame-jump-icon-v1.png" alt=""/><h3>Come si gioca</h3><p>Salta sulle piattaforme: ogni bordo dorato è una superficie dritta e calpestabile. Le nuvole corte e lunghe arrivano sempre complete.</p><p>Evita i Guardiani del Velo: le Sentinelle stanno ferme, le Pattuglie si muovono e gli Evocatori preparano una runa a terra. Salta la runa e il guardiano: il simbolo a terra avvisa prima di attivarsi. Ogni 10 secondi il ritmo aumenta ancora, senza fermarsi a una velocità fissa. Cadute e contatti costano una vita; ogni atterraggio vale +1 e ogni gemma +2. Hai 3 vite, senza limite di tempo.</p><small>Record oggi: {bestScore} · {rewarded?"Premio già raccolto: migliora il record.":"Un solo premio giornaliero condiviso tra i quattro giochi."}</small><p role="status">{match.status}</p><div className={ui.introActions}><button type="button" onClick={onClose}>← Indietro</button><button type="button" disabled={match.starting} onClick={()=>void start()}>{match.starting?"Preparazione…":"Gioca"}</button></div></div>:null}
   {phase==="paused"&&!run.finished?<div className={ui.overlay}><h3>{quitting?"Lasciare la partita?":"In pausa"}</h3><p>Il tempo è fermo. Uscendo non raccoglierai il premio di questa partita.</p><button type="button" onClick={()=>{audio.unlock();setQuitting(false);setPhase("playing");}}>Riprendi</button><button type="button" onClick={onClose}>Esci senza premio</button></div>:null}
   {run.finished?<div className={ui.overlay}><img src={art("gem")} alt=""/><h3>{run.score>bestScore?"Nuovo record!":"Viaggio concluso"}</h3><strong>{run.score} punti</strong><p>{rewarded?"Salva il tuo record di oggi.":`Hai guadagnato ${reward} Monete Nexus.`}</p><p role="status">{match.status}</p>{match.status.startsWith("Record non registrato")?<button onClick={()=>void match.retry()}>Riprova registrazione</button>:null}<button type="button" disabled={match.saving} onClick={finish}>Torna alla Casa</button></div>:null}
  </div>{!run.finished&&phase!=="intro"?<p className={ui.matchStatus}>{match.status}</p>:null}<footer>Tocca lo scenario per saltare · tastiera: Spazio o ↑</footer>
 </section></div>;
}
