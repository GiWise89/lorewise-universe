"use client";
import {useCallback,useEffect,useRef,useState} from 'react';
import {applyMatchAction,createMatchEngine,type CompetitionGame,type MatchAction} from '@/lib/famiglioMiniGameCompetition';

export function useFamiglioRankedMatch(kind:CompetitionGame,practice=false){
  const engine=useRef(createMatchEngine(kind,1));
  const [run,setRun]=useState(()=>createMatchEngine(kind,1).run);
  const [starting,setStarting]=useState(false);
  const [status,setStatus]=useState('');
  const [saving,setSaving]=useState(false);
  const session=useRef<string|null>(null),actions=useRef<MatchAction[]>([]),begun=useRef(false),lastInput=useRef(-Infinity),sent=useRef(false),alive=useRef(true);
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
  const start=async()=>{
    if(begun.current)return true;
    if(starting)return false;
    setStarting(true);
    let seed=crypto.getRandomValues(new Uint32Array(1))[0];
    if(!practice){
      try{
        const response=await fetch('/api/famiglio/leaderboard',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'start',kind}),signal:AbortSignal.timeout(15000)});
        const data=await response.json() as {id:string;seed:number;error?:string};
        if(!response.ok)throw Error(response.status===401?'Accedi al LoreWise ID per giocare e registrare il record.':data.error||'Classifica momentaneamente non disponibile. Riprova.');
        if(typeof data.id!=='string'||!Number.isSafeInteger(data.seed))throw Error('Preparazione della partita non riuscita. Riprova.');
        session.current=data.id;seed=data.seed;setStatus('Partita valida per la classifica settimanale');
      }catch(error){
        if(alive.current){setStatus(error instanceof Error&&error.name!=='TimeoutError'?error.message:'Collegamento alla classifica non disponibile. Riprova.');setStarting(false);}
        return false;
      }
    }else setStatus('Anteprima · questa partita non entra in classifica');
    if(!alive.current)return false;
    engine.current=createMatchEngine(kind,seed);setRun(engine.current.run);begun.current=true;setStarting(false);return true;
  };
  const dispatch=useCallback((action:MatchAction)=>{
    if(engine.current.run.finished)return;
    if(action.type==='step')action={...action,value:Math.max(1,Math.min(100,Math.round(action.value)))};
    else{
      if(engine.current.run.elapsed-lastInput.current<35)return;
      lastInput.current=engine.current.run.elapsed;
    }
    actions.current.push(action);
    if(actions.current.length>90000){session.current=null;actions.current=[];setStatus('Allenamento · partita oltre il limite di registrazione');}
    setRun(applyMatchAction(engine.current,action));
  },[]);
  const submit=useCallback(async()=>{
    if(!session.current||sent.current)return;
    sent.current=true;setSaving(true);setStatus('Registrazione del record…');
    try{
      const response=await fetch('/api/famiglio/leaderboard',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'finish',id:session.current,actions:actions.current}),signal:AbortSignal.timeout(15000)});
      const data=await response.json() as {score:number;error?:string};
      if(!response.ok)throw Error(data.error||'Record non registrato.');
      if(alive.current)setStatus(`Record settimanale registrato · ${data.score} punti`);
    }catch{sent.current=false;if(alive.current)setStatus('Record non registrato: puoi riprovare prima di uscire.');}
    finally{if(alive.current)setSaving(false);}
  },[]);
  useEffect(()=>{if(run.finished)void submit();},[run.finished,submit]);
  return {run,start,starting,dispatch,status,saving,retry:submit};
}
