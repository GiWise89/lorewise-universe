import {competitionWeek,COMPETITION_GAMES,verifyMatch,type CompetitionGame} from './famiglioMiniGameCompetition.ts';
import {sanitizeFamiglioRebuildCloudSave} from './famiglioRebuildCloud.ts';
export interface CompetitionDb {query(sql:string,values?:unknown[]):Promise<{rows:Record<string,unknown>[],rowCount?:number|null}>}
export const COMPETITION_SCHEMA=[
  `CREATE TABLE IF NOT EXISTS famiglio_matches (id TEXT PRIMARY KEY, customer_id TEXT NOT NULL, kind TEXT NOT NULL, seed BIGINT NOT NULL, started_at BIGINT NOT NULL, score INTEGER)`,
  `CREATE TABLE IF NOT EXISTS famiglio_records (week TEXT NOT NULL, kind TEXT NOT NULL, customer_id TEXT NOT NULL, nickname TEXT NOT NULL, score INTEGER NOT NULL, achieved_at BIGINT NOT NULL, PRIMARY KEY(week,kind,customer_id))`,
  `CREATE TABLE IF NOT EXISTS famiglio_weekly_awards (week TEXT NOT NULL, kind TEXT NOT NULL, customer_id TEXT NOT NULL, coins INTEGER NOT NULL DEFAULT 100 CHECK(coins=100), claimed INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(week,kind))`,
  `CREATE INDEX IF NOT EXISTS famiglio_records_ranking ON famiglio_records(week,kind,score DESC,achieved_at,customer_id)`,
  `CREATE INDEX IF NOT EXISTS famiglio_matches_owner ON famiglio_matches(customer_id,started_at)`
];
export async function ensureCompetition(db:CompetitionDb){for(const sql of COMPETITION_SCHEMA)await db.query(sql);}
async function transaction<T>(db:CompetitionDb,work:()=>Promise<T>){
  await db.query('BEGIN');
  try{
    // Shared with finalization: no late writes into a week whose winner is frozen.
    await db.query('SELECT pg_advisory_xact_lock(73196013)');
    const result=await work();await db.query('COMMIT');return result;
  }catch(error){await db.query('ROLLBACK');throw error;}
}
/** Troppe partite avviate: la rotta risponde 429 con questo messaggio invece del 503 generico. */
export class CompetitionRateLimitError extends Error {}
export async function startCompetition(db:CompetitionDb,userId:string,kind:CompetitionGame,now=Date.now()){
  // Le partite mai concluse scadono dopo un'ora (verifyMatch le rifiuta comunque): si eliminano
  // quelle dell'utente, così la tabella non cresce senza limiti a ogni avvio abbandonato.
  await db.query('DELETE FROM famiglio_matches WHERE customer_id=$1 AND score IS NULL AND started_at<$2',[userId,now-2*3600000]);
  const count=await db.query('SELECT COUNT(*) AS count FROM famiglio_matches WHERE customer_id=$1 AND started_at>$2',[userId,now-60000]);
  if(Number(count.rows[0]?.count)>=10)throw new CompetitionRateLimitError('Troppe partite avviate: attendi un minuto.');
  const id=crypto.randomUUID(),seed=crypto.getRandomValues(new Uint32Array(1))[0];
  await db.query('INSERT INTO famiglio_matches(id,customer_id,kind,seed,started_at) VALUES($1,$2,$3,$4,$5)',[id,userId,kind,seed,now]);
  return {id,seed};
}
export async function finishCompetition(db:CompetitionDb,userId:string,nickname:string,id:string,actions:unknown,clock=()=>Date.now()){
  return transaction(db,async()=>{
    const result=await db.query('SELECT * FROM famiglio_matches WHERE id=$1 AND customer_id=$2 FOR UPDATE',[id,userId]);
    const match=result.rows[0];if(!match)throw Error('Partita non trovata.');
    if(match.score!==null)return {score:Number(match.score)};
    const score=verifyMatch(match.kind as CompetitionGame,Number(match.seed),actions,clock()-Number(match.started_at));
    const now=clock(),week=competitionWeek(new Date(now));
    await db.query('UPDATE famiglio_matches SET score=$1 WHERE id=$2',[score,id]);
    if(score>0)await db.query(`INSERT INTO famiglio_records(week,kind,customer_id,nickname,score,achieved_at) VALUES($1,$2,$3,$4,$5,$6)
      ON CONFLICT(week,kind,customer_id) DO UPDATE SET score=excluded.score,achieved_at=excluded.achieved_at,nickname=excluded.nickname
      WHERE excluded.score>famiglio_records.score`,[week,match.kind,userId,nickname,score,now]);
    return {score};
  });
}
async function finalize(db:CompetitionDb,week:string){
  await db.query(`INSERT INTO famiglio_weekly_awards(week,kind,customer_id)
    SELECT r.week,r.kind,r.customer_id FROM famiglio_records r WHERE r.week<$1 AND NOT EXISTS(
      SELECT 1 FROM famiglio_records b WHERE b.week=r.week AND b.kind=r.kind AND
      (b.score>r.score OR (b.score=r.score AND b.achieved_at<r.achieved_at) OR (b.score=r.score AND b.achieved_at=r.achieved_at AND b.customer_id<r.customer_id)))
    ON CONFLICT(week,kind) DO NOTHING`,[week]);
}
export async function readCompetition(db:CompetitionDb,userId:string|null,clock=()=>Date.now()){
  return transaction(db,async()=>{
    const week=competitionWeek(new Date(clock()));await finalize(db,week);
    const boards:Record<string,unknown>={};
    for(const kind of COMPETITION_GAMES){
      const ranking=`SELECT nickname,score,customer_id,ROW_NUMBER() OVER(ORDER BY score DESC,achieved_at ASC,customer_id ASC) AS position FROM famiglio_records WHERE week=$1 AND kind=$2`;
      const rows=await db.query(`SELECT ranks.*,c.username,c.avatar_object_key,c.profile_visibility,c.status,
        (SELECT COUNT(*) FROM famiglio_weekly_awards a WHERE a.customer_id=ranks.customer_id AND a.kind=$4) AS trophies
        FROM (${ranking}) ranks LEFT JOIN customers c ON c.id=ranks.customer_id
        WHERE position<=20 OR ranks.customer_id=$3 ORDER BY position`,[week,kind,userId,kind]);
      boards[kind]=rows.rows.map(row=>({name:row.username||row.nickname,
        avatarUrl:row.username&&row.avatar_object_key&&row.profile_visibility==='public'&&row.status==='active'?`/api/profile-avatar/${encodeURIComponent(String(row.username))}`:null,
        trophies:Number(row.trophies),score:Number(row.score),position:Number(row.position),you:row.customer_id===userId}));
    }
    const awards=userId?(await db.query('SELECT week,kind,coins,claimed FROM famiglio_weekly_awards WHERE customer_id=$1 ORDER BY week DESC LIMIT 12',[userId])).rows:[];
    return {week,boards,awards,authenticated:Boolean(userId)};
  });
}
export async function creditCompetitionAwards(db:CompetitionDb,userId:string,clock=()=>Date.now()){
  return transaction(db,async()=>{
    await finalize(db,competitionWeek(new Date(clock())));
    const row=(await db.query('SELECT save_json,revision FROM nexus_pet_rebuild_saves WHERE customer_id=$1 FOR UPDATE',[userId])).rows[0];
    if(!row)return 0;
    const rewards=(await db.query('SELECT week,kind,coins FROM famiglio_weekly_awards WHERE customer_id=$1 AND claimed=0 FOR UPDATE',[userId])).rows;
    if(!rewards.length)return 0;
    const checked=sanitizeFamiglioRebuildCloudSave(JSON.parse(String(row.save_json)));if(!checked.ok)throw Error('Casa non valida per il premio.');
    const save=checked.save,index=save.houses[save.activeHouseIndex]?save.activeHouseIndex:save.houses.findIndex(Boolean);
    const house=save.houses[index];if(!house)return 0;
    const home=house.home as Record<string,unknown>,wallet=home.wallet as Record<string,unknown>;
    if(!wallet||!Number.isFinite(Number(wallet.nexusCoins))||!Number.isFinite(Number(wallet.totalEarned)))throw Error('Portamonete non disponibile.');
    const coins=rewards.length*100;
    house.home={...home,wallet:{...wallet,nexusCoins:Number(wallet.nexusCoins)+coins,totalEarned:Number(wallet.totalEarned)+coins},lastOutcome:`Classifiche settimanali: +${coins} Monete Nexus!`};
    save.updatedAt=new Date(clock()).toISOString();
    await db.query('UPDATE nexus_pet_rebuild_saves SET save_json=$1,revision=revision+1,updated_at=CURRENT_TIMESTAMP WHERE customer_id=$2',[JSON.stringify(save),userId]);
    await db.query('UPDATE famiglio_weekly_awards SET claimed=1 WHERE customer_id=$1 AND claimed=0',[userId]);
    return coins;
  });
}
