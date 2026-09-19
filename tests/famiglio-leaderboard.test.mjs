import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {competitionWeek,createMatchEngine,applyMatchAction,verifyMatch} from '../lib/famiglioMiniGameCompetition.ts';
import {ensureCompetition,startCompetition,finishCompetition,readCompetition,creditCompetitionAwards} from '../lib/famiglioLeaderboardStore.ts';

async function database(){
  const sqlite=new DatabaseSync(':memory:');
  const db={async query(sql,values=[]){
    if(sql.includes('pg_advisory_xact_lock'))return {rows:[]};
    const ordered=[];
    const statement=sqlite.prepare(sql.replace(/ FOR UPDATE/g,'').replace(/\$(\d+)/g,(_,n)=>{ordered.push(values[Number(n)-1]);return '?';}));
    if(statement.columns().length)return {rows:statement.all(...ordered)};
    return {rows:[],rowCount:Number(statement.run(...ordered).changes)};
  }};
  await ensureCompetition(db);
  sqlite.exec('CREATE TABLE customers(id TEXT PRIMARY KEY,username TEXT,avatar_object_key TEXT,profile_visibility TEXT,status TEXT)');
  sqlite.exec('CREATE TABLE nexus_pet_rebuild_saves(customer_id TEXT PRIMARY KEY,save_json TEXT,revision INTEGER,updated_at TEXT)');
  return {db,sqlite};
}
function completed(kind='light',seed=12){
  const e=createMatchEngine(kind,seed),actions=[];
  const push=a=>{actions.push(a);applyMatchAction(e,a);};
  // Nella Luce un colpo prima di LIGHT_MIN_REACTION_MS dalla comparsa viene ignorato.
  push({type:'step',value:100});push({type:'step',value:100});
  push({type:'input',value:0});
  while(!e.run.finished)push({type:'step',value:100});
  return {actions,elapsed:e.run.elapsed,score:e.run.score};
}
const save=()=>({schemaVersion:1,activeHouseIndex:0,houses:[{rebuild:{stage:'home',unlockedIds:['cat']},home:{needs:{},wallet:{nexusCoins:10,totalEarned:15}},adventure:{},combat:{}},null,null],updatedAt:'2026-09-13T12:00:00Z'});

test('weekly reset follows Monday midnight in Rome including summer and winter DST changes',()=>{
  assert.equal(competitionWeek(new Date('2026-09-13T21:59:59Z')),'2026-09-07');
  assert.equal(competitionWeek(new Date('2026-09-13T22:00:00Z')),'2026-09-14');
  assert.equal(competitionWeek(new Date('2026-10-25T22:59:59Z')),'2026-10-19');
  assert.equal(competitionWeek(new Date('2026-10-25T23:00:00Z')),'2026-10-26');
});
test('records are reconstructed from completed play; incomplete, accelerated and rapid input traces fail',()=>{
  const trace=completed();assert.equal(verifyMatch('light',12,trace.actions,trace.elapsed),1);
  assert.throws(()=>verifyMatch('light',12,trace.actions,0));
  assert.throws(()=>verifyMatch('light',12,[],90000));
  assert.throws(()=>verifyMatch('light',12,[{type:'input',value:0},{type:'input',value:0}],90000));
});
test('a session belongs to one user, can be submitted twice safely, and stores a verified score',async()=>{
  const {db,sqlite}=await database();const now=Date.parse('2026-09-13T12:00:00Z');
  const session=await startCompetition(db,'user-a','light',now);
  const trace=completed('light',session.seed);
  await assert.rejects(()=>finishCompetition(db,'user-b','B',session.id,trace.actions,()=>now+trace.elapsed));
  const first=await finishCompetition(db,'user-a','A',session.id,trace.actions,()=>now+trace.elapsed);
  assert.equal(first.score,1);
  assert.deepEqual(await finishCompetition(db,'user-a','A',session.id,[],()=>now+10000),first);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM famiglio_records').get().n,1);sqlite.close();
});
test('each game resets independently; ties go to the earlier record and prizes credit exactly once',async()=>{
  const {db,sqlite}=await database();
  for(const [kind,id,score,time] of [['light','a',20,1],['light','b',20,2],['catch','b',18,3]])
    await db.query('INSERT INTO famiglio_records VALUES($1,$2,$3,$4,$5,$6)',['2026-09-07',kind,id,id,score,time]);
  const next=()=>Date.parse('2026-09-14T12:00:00Z');
  const board=await readCompetition(db,'a',next);
  assert.deepEqual(board.boards.light,[]);assert.equal(board.awards.length,1);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM famiglio_weekly_awards').get().n,2);
  for(const id of ['a','b'])await db.query('INSERT INTO nexus_pet_rebuild_saves(customer_id,save_json,revision) VALUES($1,$2,$3)',[id,JSON.stringify(save()),1]);
  assert.equal(await creditCompetitionAwards(db,'a',next),100);
  assert.equal(await creditCompetitionAwards(db,'a',next),0);
  assert.equal(await creditCompetitionAwards(db,'b',next),100);
  const row=sqlite.prepare("SELECT * FROM nexus_pet_rebuild_saves WHERE customer_id='a'").get();
  assert.equal(row.revision,2);assert.equal(JSON.parse(row.save_json).houses[0].home.wallet.nexusCoins,110);
  sqlite.close();
});
test('reward failure rolls back both the wallet and reward consumption',async()=>{
  const {db,sqlite}=await database();const next=()=>Date.parse('2026-09-14T12:00:00Z');
  await db.query('INSERT INTO famiglio_weekly_awards(week,kind,customer_id) VALUES($1,$2,$3)',['2026-09-07','light','a']);
  await db.query('INSERT INTO nexus_pet_rebuild_saves(customer_id,save_json,revision) VALUES($1,$2,$3)',['a',JSON.stringify(save()),1]);
  const failing={query(sql,values){if(sql.startsWith('UPDATE famiglio_weekly_awards'))throw Error('offline');return db.query(sql,values);}};
  await assert.rejects(()=>creditCompetitionAwards(failing,'a',next));
  assert.equal(sqlite.prepare('SELECT revision FROM nexus_pet_rebuild_saves').get().revision,1);
  assert.equal(sqlite.prepare('SELECT claimed FROM famiglio_weekly_awards').get().claimed,0);
  assert.equal(await creditCompetitionAwards(db,'a',next),100);sqlite.close();
});
test('top twenty includes the current user outside the first page without exposing account ids',async()=>{
  const {db,sqlite}=await database();
  for(let i=0;i<25;i++)await db.query('INSERT INTO famiglio_records VALUES($1,$2,$3,$4,$5,$6)',['2026-09-07','memory',`u${i}`,`Custode ${i}`,100-i,i]);
  const board=await readCompetition(db,'u24',()=>Date.parse('2026-09-13T12:00:00Z'));
  assert.equal(board.boards.memory.length,21);assert.equal(board.boards.memory.at(-1).position,25);assert.equal(board.boards.memory.at(-1).you,true);
  assert.equal('customer_id' in board.boards.memory[0],false);sqlite.close();
});
test('a lower score never overwrites a weekly best or its tie-break time',async()=>{
  const {db,sqlite}=await database();const now=Date.parse('2026-09-13T12:00:00Z');
  await db.query('INSERT INTO famiglio_records VALUES($1,$2,$3,$4,$5,$6)',['2026-09-07','light','a','A',50,1]);
  const session=await startCompetition(db,'a','light',now),trace=completed('light',session.seed);
  await finishCompetition(db,'a','A',session.id,trace.actions,()=>now+trace.elapsed);
  const record=sqlite.prepare('SELECT score,achieved_at FROM famiglio_records').get();
  assert.equal(record.score,50);assert.equal(record.achieved_at,1);sqlite.close();
});
test('a match crossing midnight belongs to the week in which it finishes',async()=>{
  const {db,sqlite}=await database();const now=Date.parse('2026-09-13T21:59:58Z');
  const session=await startCompetition(db,'a','light',now),trace=completed('light',session.seed);
  await finishCompetition(db,'a','A',session.id,trace.actions,()=>now+trace.elapsed);
  assert.equal(sqlite.prepare('SELECT week FROM famiglio_records').get().week,'2026-09-14');sqlite.close();
});

test('ranking uses current username, only public active avatars, and trophies from closed weeks for the selected game',async()=>{
  const {db,sqlite}=await database();
  for(const [id,visibility,status] of [['a','public','active'],['b','private','active'],['c','public','inactive']]){
    await db.query('INSERT INTO customers VALUES($1,$2,$3,$4,$5)',[id,'new-'+id,'secret-key',visibility,status]);
    await db.query('INSERT INTO famiglio_records VALUES($1,$2,$3,$4,$5,$6)',['2026-09-14','light',id,'old-'+id,30,1]);
  }
  for(const [week,kind] of [['2026-09-07','light'],['2026-09-07','catch']])
    await db.query('INSERT INTO famiglio_records VALUES($1,$2,$3,$4,$5,$6)',[week,kind,'a','old-a',20,1]);
  const result=await readCompetition(db,'a',()=>Date.parse('2026-09-14T12:00:00Z'));
  const rows=result.boards.light;
  assert.equal(rows[0].name,'new-a');
  assert.equal(rows[0].avatarUrl,'/api/profile-avatar/new-a');
  assert.equal(rows[0].trophies,1);
  assert.equal(rows[1].avatarUrl,null);
  assert.equal(rows[2].avatarUrl,null);
  assert.equal(rows[1].trophies,0);
  assert.equal(JSON.stringify(result).includes('secret-key'),false);
  sqlite.close();
});
