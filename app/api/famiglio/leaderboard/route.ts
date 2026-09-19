import {getDatabase} from '@netlify/database';
import {isFamiglioRequestOriginAllowed,readBoundedJson} from '@/lib/famiglioRequestOrigin';
import {getLoreWiseUser,isLocalLoreWiseRequest} from '@/lib/supabase/server';
import {netlifyDatabaseIsConfigured} from '@/lib/localAccountFallback';
import {COMPETITION_GAMES,type CompetitionGame} from '@/lib/famiglioMiniGameCompetition';
import {CompetitionRateLimitError,ensureCompetition,readCompetition,startCompetition,finishCompetition,type CompetitionDb} from '@/lib/famiglioLeaderboardStore';
export const dynamic='force-dynamic';
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
async function database(){
  if(await isLocalLoreWiseRequest()&&!netlifyDatabaseIsConfigured())throw Error('Classifiche condivise non disponibili in questa anteprima.');
  const client=await getDatabase().pool.connect();
  try{await ensureCompetition(client as unknown as CompetitionDb);return client;}catch(error){client.release();throw error;}
}
export async function GET(){
  let client:Awaited<ReturnType<typeof database>>|undefined;
  try{
    client=await database();const user=await getLoreWiseUser();
    return json(await readCompetition(client as unknown as CompetitionDb,user?.id??null));
  }catch{return json({error:'Classifiche momentaneamente non disponibili. Riprova più tardi.'},503);}
  finally{client?.release();}
}
export async function POST(request:Request){
  if(!isFamiglioRequestOriginAllowed(request))return json({error:'Origine non valida.'},403);
  let client:Awaited<ReturnType<typeof database>>|undefined;
  try{
    // Autenticazione prima di leggere il corpo: prima chiunque poteva far leggere e analizzare
    // fino a 3 MB di JSON senza essere collegato. Il tetto vale anche senza Content-Length.
    const user=await getLoreWiseUser();if(!user)return json({error:'Accedi al LoreWise ID per partecipare.'},401);
    const parsed=await readBoundedJson(request,3000000);
    if(!parsed.ok)return json({error:parsed.status===413?'Partita troppo grande.':'Richiesta non valida.'},parsed.status);
    const body=parsed.value as Record<string,unknown>;
    if(!body||typeof body!=='object')return json({error:'Richiesta non valida.'},400);
    client=await database();const db=client as unknown as CompetitionDb;
    if(body.action==='start'&&COMPETITION_GAMES.includes(body.kind as CompetitionGame)){
      try{return json(await startCompetition(db,user.id,body.kind as CompetitionGame));}
      catch(error){if(error instanceof CompetitionRateLimitError)return json({error:error.message},429);throw error;}
    }
    if(body.action==='finish'&&typeof body.id==='string'&&body.id.length<=80){
      // Never derive a public name from email or private profile fields.
      const profile=await db.query('SELECT username FROM customers WHERE id=$1',[user.id]);
      const username=String(profile.rows[0]?.username||'Custode').replace(/[<>\u0000-\u001f]/g,'').slice(0,32);
      try{return json(await finishCompetition(db,user.id,username,body.id,body.actions));}
      catch{return json({error:"Partita non verificabile: ricomincia una nuova partita per partecipare."},400);}
    }
    return json({error:'Richiesta non valida.'},400);
  }catch{return json({error:'Classifica non disponibile: riprova.'},503);}
  finally{client?.release();}
}
