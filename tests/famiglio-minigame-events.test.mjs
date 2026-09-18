import test from 'node:test';
import assert from 'node:assert/strict';
import {createMiniGame,advanceMiniGame,inputMiniGame,catchGoldenLight,memoryCue} from '../lib/famiglioMiniGameEngine.ts';
import {createCloudRun,advanceCloud,jumpCloud,cloudRuneX} from '../lib/famiglioCloudJump.ts';

test('golden light is separated, optional, worth three points once and leaves the normal light running',()=>{
  let s={...createMiniGame('light'),elapsed:12000,target:{x:50,y:40,expires:14000}};
  s=advanceMiniGame(s,0,()=>.3);
  assert.ok(s.golden);
  assert.ok(s.golden.expires<s.target.expires);
  assert.ok(Math.abs(s.golden.x-s.target.x)>=28||Math.abs(s.golden.y-s.target.y)>=28);
  const target=s.target;
  const collected=catchGoldenLight(s);
  assert.equal(collected.score,3);assert.equal(collected.hits,1);assert.equal(collected.target,target);
  assert.equal(catchGoldenLight(collected),collected);
  const expired=advanceMiniGame(s,s.golden.expires-s.elapsed,()=>.3);
  assert.equal(expired.golden,null);assert.equal(expired.lives,3);assert.equal(expired.score,0);
  assert.equal(inputMiniGame(s,0,()=>.3).golden,null);
  assert.equal(catchGoldenLight({...s,finished:true}).score,0);
});

test('a rain event drains old notes, then creates a collectable six-star path with separate thorns',()=>{
  let s={...createMiniGame('catch'),elapsed:19900,nextSpawn:19900};
  s=advanceMiniGame(s,0,()=>.25);
  let route=[],rainIds=new Set(),lastNotes=[];
  for(let i=0;i<1000&&route.length<6;i++){
    const upcoming=[...s.notes].sort((a,b)=>(a.born+a.travel)-(b.born+b.travel))[0];
    if(upcoming)s=inputMiniGame(s,upcoming.hazard?(upcoming.lane+1)%4:upcoming.lane);
    s=advanceMiniGame(s,20,()=>.25);
    for(const n of s.notes.filter(n=>n.rain&&!n.hazard&&!rainIds.has(n.id))){
      rainIds.add(n.id);route.push(n.lane);
      const hazard=s.notes.find(h=>h.rain&&h.hazard&&h.born===n.born);
      assert.ok(hazard);assert.notEqual(hazard.lane,n.lane);assert.equal(hazard.travel,n.travel);
    }
    lastNotes=s.notes;
  }
  assert.equal(route.length,6);assert.deepEqual(route,[0,1,2,3,2,1]);
  while(s.notes.some(n=>n.rain)){
    const next=s.notes.find(n=>n.rain&&!n.hazard);
    if(next)s=inputMiniGame(s,next.lane);
    s=advanceMiniGame(s,20,()=>.25);
  }
  assert.ok(lastNotes.length);assert.equal(s.lives,3);assert.equal(s.score,7);
});

test('mirror is announced before playback and checks reverse input, preserving its rule after a mistake',()=>{
  let s={...createMiniGame('memory'),elapsed:22000,memoryStart:0,memoryRound:2,sequence:[0,1],memoryIndex:1};
  s=inputMiniGame(s,1,()=>.75);
  assert.equal(s.mirror,true);assert.equal(s.memoryStart-s.elapsed,1600);
  assert.equal(memoryCue(s).pad,-1);
  s={...s,elapsed:s.memoryStart+4000};
  const wrong=inputMiniGame(s,0);
  assert.equal(wrong.lives,2);assert.equal(wrong.mirror,true);
  for(const pad of [3,1,0])s=inputMiniGame(s,pad,()=>.5);
  assert.equal(s.memoryRound,4);assert.equal(s.mirror,false);assert.equal(s.lives,3);
});

const scene=behavior=>{
  const s=createCloudRun();
  s.platforms=[{id:0,x:-24,width:2000,y:300,gem:false,landed:true,kind:'stable'}];
  s.enemies=[{id:9,platformId:0,x:260,anchorX:260,y:300,warnedAt:0,passed:false,npcIndex:2,hitAt:null,behavior}];
  return s;
};
test('patrols move only after warning and remain inside their platform',()=>{
  let s=scene('patrol');s=advanceCloud(s,250);
  assert.equal(s.enemies[0].x,260);
  s.elapsed=1100;s=advanceCloud(s,100);
  assert.notEqual(s.enemies[0].x,260);assert.ok(Math.abs(s.enemies[0].x-260)<=24);
  const fixed=advanceCloud({...scene('sentry'),elapsed:1100},100);
  assert.equal(fixed.enemies[0].x,260);
});
test('caster rune is harmless during preparation, hurts once when armed, and is avoidable with a jump',()=>{
  let s=scene('caster');s.camera=cloudRuneX(s.enemies[0])-160;
  assert.equal(advanceCloud(s,16).lives,3);
  s.elapsed=1200;
  const hit=advanceCloud(s,16);
  assert.equal(hit.lives,2);assert.match(hit.feedback,/Runa/);assert.equal(advanceCloud(hit,16).lives,2);
  let jumped=jumpCloud({...s,elapsed:500});
  jumped=advanceCloud(jumped,250);jumped.elapsed=1200;
  assert.equal(advanceCloud(jumped,16).lives,3);
});
