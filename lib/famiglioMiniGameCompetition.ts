import {createMiniGame, advanceMiniGame, inputMiniGame, pressMiniGameTrap, catchGoldenLight, type MiniGameRun} from './famiglioMiniGameEngine.ts';
import {createCloudRun, advanceCloud, jumpCloud, type CloudRun} from './famiglioCloudJump.ts';
export const COMPETITION_GAMES = ['light','jump','catch','memory'] as const;
export type CompetitionGame = typeof COMPETITION_GAMES[number];
export type MatchAction = {type:'step'|'input'|'trap'|'gold'; value:number};
export type MatchEngine = {run:MiniGameRun|CloudRun; random:()=>number; kind:CompetitionGame};
export function competitionWeek(now=new Date()) {
  const date=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
  const day=new Date(`${date}T12:00:00Z`);
  day.setUTCDate(day.getUTCDate()-((day.getUTCDay()+6)%7));
  return day.toISOString().slice(0,10);
}
export function createMatchEngine(kind:CompetitionGame,seed:number):MatchEngine {
  let state=seed>>>0;
  const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
  return {kind,random,run:kind==='jump'?createCloudRun():createMiniGame(kind,40,random)};
}
export function applyMatchAction(engine:MatchEngine,action:MatchAction) {
  const {run,kind,random}=engine;
  if(run.finished)return run;
  if(action.type==='step') engine.run=kind==='jump'?advanceCloud(run as CloudRun,action.value,random):advanceMiniGame(run as MiniGameRun,action.value,random);
  else if(kind==='jump')engine.run=jumpCloud(run as CloudRun);
  else if(action.type==='gold')engine.run=catchGoldenLight(run as MiniGameRun);
  else if(action.type==='trap')engine.run=pressMiniGameTrap(run as MiniGameRun,action.value);
  else engine.run=inputMiniGame(run as MiniGameRun,action.value,random);
  return engine.run;
}
export function verifyMatch(kind:CompetitionGame,seed:number,actions:unknown,wallElapsed:number) {
  if(!Array.isArray(actions)||actions.length>90000||wallElapsed<0||wallElapsed>3600000)throw Error('Partita non valida o scaduta.');
  const engine=createMatchEngine(kind,seed);
  let lastInput=-Infinity;
  for(const raw of actions){
    const a=raw as MatchAction;
    if(!a||!['step','input','trap','gold'].includes(a.type)||!Number.isSafeInteger(a.value))throw Error('Comandi non validi.');
    if(a.type==='step'&&(a.value<1||a.value>100))throw Error('Avanzamento non valido.');
    if(a.type!=='step'){
      if(engine.run.elapsed-lastInput<35)throw Error('Comandi troppo ravvicinati.');
      lastInput=engine.run.elapsed;
      if(a.value<0||(a.type==='input'&&a.value>3))throw Error('Comando non valido.');
      if(kind==='jump'&&a.type!=='input')throw Error('Comando non valido.');
    }
    if(engine.run.finished)throw Error('Partita già conclusa.');
    applyMatchAction(engine,a);
  }
  if(!engine.run.finished||engine.run.elapsed>wallElapsed+1500)throw Error('Partita incompleta o durata non valida.');
  return engine.run.score;
}
