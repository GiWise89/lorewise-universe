import test from 'node:test';
import assert from 'node:assert/strict';
import { createMiniGame, advanceMiniGame, inputMiniGame, pressMiniGameTrap } from '../lib/famiglioMiniGameEngine.ts';
import { createCloudRun, advanceCloud, jumpCloud } from '../lib/famiglioCloudJump.ts';
import { readFileSync } from 'node:fs';

test('all active games start with three lives and can pass the old deadline', () => {
  for(const mode of ['light','catch','memory']) {
    let s=createMiniGame(mode);
    assert.equal(s.lives,3);
    s={...s,elapsed:41000,nextSpawn:999999,target:{...s.target,expires:999999}};
    s=advanceMiniGame(s,100);
    assert.equal(s.finished,false,mode);
    assert.equal(s.elapsed,41100);
  }
  let s={...createCloudRun(),elapsed:41000};
  s=advanceCloud(s,100);
  assert.equal(s.finished,false);
  assert.equal(s.lives,3);
});

test('light expires three times or three decoy clicks end the game', () => {
  let s=createMiniGame('light');
  for(let i=0;i<3;i++) s=advanceMiniGame(s,2100);
  assert.equal(s.lives,0);assert.equal(s.finished,true);
  assert.equal(inputMiniGame(s,0),s);
  s=createMiniGame('light');
  for(let i=0;i<3;i++) s=pressMiniGameTrap({...s,traps:[{id:i,x:20,y:30,expires:500}]},i);
  assert.equal(s.finished,true);assert.equal(s.lives,0);
});

test('catch loses lives for thorns and missed stars, never for dodged thorns', () => {
  const state={...createMiniGame('catch'),nextSpawn:999999};
  const note={id:1,lane:1,born:0,travel:100,hazard:true};
  assert.equal(advanceMiniGame({...state,notes:[note]},100).lives,2);
  assert.equal(advanceMiniGame({...state,lane:2,notes:[note]},100).lives,3);
  assert.equal(advanceMiniGame({...state,lane:2,notes:[{...note,hazard:false}]},100).lives,2);
  const dead=advanceMiniGame({...state,lives:1,notes:[note,{...note,id:2,hazard:false}]},100);
  assert.equal(dead.finished,true);assert.equal(dead.lives,0);assert.equal(dead.score,0);
});

test('memory waits for input without a time penalty and ends on the third wrong sequence', () => {
  let s=createMiniGame('memory',40,()=>0);
  s=advanceMiniGame(s,120000);
  assert.equal(s.lives,3);assert.equal(s.finished,false);assert.deepEqual(s.traps,[]);
  for(let i=0;i<3;i++) {
    s={...s,elapsed:s.memoryStart+s.sequence.length*750};
    s=inputMiniGame(s,3);
  }
  assert.equal(s.finished,true);assert.equal(s.lives,0);
});

test('cloud platforms stay playable in a three-minute run without timer or runaway speed', () => {
  let s=createCloudRun();
  for(let i=0;i<11250&&!s.finished;i++) {
    s.enemies=[];
    for(const platform of s.platforms)if(platform.kind==="fragile")platform.kind="stable";
    const x=s.camera+160,p=s.platforms.find(p=>!p.broken&&x>=p.x-12&&x<=p.x+p.width+12&&Math.abs(p.y-s.y)<3);
    if(s.grounded&&p&&p.x+p.width-x<14)s=jumpCloud(s);
    s=advanceCloud(s,16,()=>.5);
  }
  assert.equal(s.finished,false);assert.equal(s.lives,3);assert.ok(s.elapsed>=180000);
});

test('game HUDs show lives rather than countdown and explain unlimited play', () => {
  for(const file of ['components/FamiglioCloudGame.tsx','components/FamiglioDailyMiniGame.tsx']) {
    const source=readFileSync(file,'utf8');
    assert.match(source,/run.lives/);
    assert.match(source,/senza limite di tempo/);
    assert.doesNotMatch(source,/run.duration-run.elapsed/);
  }
});
