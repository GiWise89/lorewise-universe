"use client";
import {useCallback,useEffect,useRef,useState} from 'react';
import {COMPETITION_GAMES,competitionWeek,type CompetitionGame} from '@/lib/famiglioMiniGameCompetition';
import {FAMILIAR_MINIGAME_NAMES} from '@/lib/famiglioWeeklyLoop';
import styles from './FamiglioDailyMiniGame.module.css';
type Ranking={avatarUrl:string|null;trophies:number;name:string;score:number;position:number;you:boolean};
type Rankings={week:string;authenticated:boolean;boards:Partial<Record<CompetitionGame,Ranking[]>>;awards:{week:string;kind:CompetitionGame;coins:number;claimed:number}[]};
function CustodeAvatar({name,url}:{name:string;url:string|null}){
  const [failed,setFailed]=useState<string|null>(null);
  return <span className={styles.custodeAvatar}>{url&&failed!==url?
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={'Avatar di '+name} onError={()=>setFailed(url)} />:
    <span aria-label={'Iniziali di '+name}>{name.slice(0,2).toLocaleUpperCase('it')}</span>}</span>;
}
export function FamiglioLeaderboard({onClose,practice=false}:{onClose:()=>void;practice?:boolean}){
  const [kind,setKind]=useState<CompetitionGame>('light'),[data,setData]=useState<Rankings|null>(null),[loading,setLoading]=useState(false),[error,setError]=useState('');
  const dialog=useRef<HTMLElement>(null),abort=useRef<AbortController|null>(null);
  const refresh=useCallback(async()=>{
    if(practice){setData({week:competitionWeek(),authenticated:false,boards:{},awards:[]});return;}
    abort.current?.abort();const controller=new AbortController();abort.current=controller;
    setLoading(true);setError('');
    try{
      const response=await fetch('/api/famiglio/leaderboard',{cache:'no-store',signal:controller.signal});
      const body=await response.json() as Rankings & {error?:string};if(!response.ok)throw Error(body.error||"Classifica non disponibile.");
      if(!controller.signal.aborted)setData(body);
    }catch(error){if(!controller.signal.aborted)setError(error instanceof Error?error.message:'Classifica non disponibile.');}
    finally{if(!controller.signal.aborted)setLoading(false);}
  },[practice]);
  useEffect(()=>{
    const previous=document.activeElement as HTMLElement|null;dialog.current?.focus();
    const kickoff=window.setTimeout(()=>void refresh(),0);const timer=window.setInterval(()=>void refresh(),60000);
    return()=>{clearTimeout(kickoff);clearInterval(timer);abort.current?.abort();previous?.focus();};
  },[refresh]);
  const rows:Ranking[]=practice?[
    {name:'Custode Aurora',avatarUrl:null,trophies:3,score:126,position:1,you:false},
    {name:'Custode della Luna',avatarUrl:null,trophies:1,score:98,position:2,you:false},
    {name:'Custode delle Rune',avatarUrl:null,trophies:0,score:84,position:3,you:false},
  ]:data?.boards[kind]??[];
  return <div className={styles.backdrop}><section ref={dialog} tabIndex={-1} className={styles.sheet} role="dialog" aria-modal="true" aria-labelledby="leaderboard-title" onKeyDown={event=>{
    if(event.key==='Escape'){event.preventDefault();onClose();}
    if(event.key==='Tab'){
      const buttons=Array.from(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href]')??[]),index=buttons.indexOf(document.activeElement as HTMLElement);
      if(event.shiftKey&&index<=0){event.preventDefault();buttons.at(-1)?.focus();}
      else if(!event.shiftKey&&(index<0||index===buttons.length-1)){event.preventDefault();buttons[0]?.focus();}
    }
  }}><header><div><small>I migliori Custodi della settimana</small><h2 id="leaderboard-title">Classifiche dei minigiochi</h2></div><button onClick={onClose} aria-label="Torna ai minigiochi">←</button></header>
    <div className={styles.rankingContent}>
      <p className={styles.rankingPrize}><strong>100 Monete Nexus</strong> al primo di ogni minigioco</p>
      <p>Da lunedì a domenica, ora italiana. Conta il tuo miglior punteggio della settimana. A parità vince chi lo ha raggiunto prima.</p>
      <p>Il premio viene accreditato alla prossima apertura della Casa dopo la chiusura della settimana.</p>
      <nav className={styles.rankingGames} aria-label="Classifica per minigioco">{COMPETITION_GAMES.map(game=><button key={game} onClick={()=>setKind(game)} aria-pressed={kind===game}>{FAMILIAR_MINIGAME_NAMES[game]}</button>)}</nav>
      <h3>{FAMILIAR_MINIGAME_NAMES[kind]}</h3>
      {data?<p>Settimana dal {new Date(`${data.week}T12:00:00Z`).toLocaleDateString('it-IT',{timeZone:'Europe/Rome'})}</p>:null}
      {practice?<p role="status">Lista dimostrativa: nomi, record e trofei sono esempi. Le partite di prova non assegnano premi e non entrano in classifica.</p>:null}
      {!practice&&data&&!data.authenticated?<p><a href="/account">Accedi al LoreWise ID</a> per partecipare.</p>:null}
      {loading?<p role="status">Aggiornamento classifica…</p>:null}
      {error?<p role="alert">{error}</p>:null}
      {!error&&!loading&&data&&!rows.length?<p>Nessun record {practice?'nell’anteprima':'questa settimana'}. {practice?'':'Completa una partita per entrare in classifica!'}</p>:null}
      {rows.length?<ol className={styles.trophyList} aria-label="Classifica: migliori 20 record e la tua posizione">{rows.map(row=><li key={row.position} value={row.position} className={styles.trophyRow} data-place={row.position} data-you={row.you}>
        <span className={styles.rankMedal} aria-label={'Posizione '+row.position}>{row.position<=3?['🥇','🥈','🥉'][row.position-1]:row.position}</span>
        <CustodeAvatar name={row.name} url={row.avatarUrl}/>
        <div className={styles.custodeIdentity}><strong>{row.name}</strong>{row.you?<span className={styles.youBadge}>Tu</span>:null}<small>{row.trophies>0?'🏆 '+row.trophies+' '+(row.trophies===1?'settimana vinta':'settimane vinte'):'In cerca del primo trofeo'}</small></div>
        <div className={styles.custodeRecord}><strong>{row.score.toLocaleString('it-IT')}</strong><small>Record</small></div>
      </li>)}</ol>:null}
      {data?.awards.length?<div><h3>La tua bacheca dei trofei</h3><ul className={styles.trophyList}>{data.awards.map(award=><li className={styles.awardCard} key={award.week+'-'+award.kind}><span aria-hidden="true">🏆</span><div><strong>{FAMILIAR_MINIGAME_NAMES[award.kind]}</strong><small>1° posto · Settimana dal {new Date(award.week+'T12:00:00Z').toLocaleDateString('it-IT')}</small><small>+100 monete · {Number(award.claimed)?'Accreditate':'Alla prossima apertura della Casa'}</small></div></li>)}</ul></div>:null}
      {!practice?<button className={styles.leaderboardButton} disabled={loading} onClick={()=>void refresh()}>Aggiorna classifica</button>:null}
    </div>
  </section></div>;
}
