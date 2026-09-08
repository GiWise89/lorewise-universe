import test from 'node:test';
import assert from 'node:assert/strict';
import { createMiniGame, advanceMiniGame, inputMiniGame, memoryCue, pressMiniGameTrap } from '../lib/famiglioMiniGameEngine.ts';
const random = () => .3;
test('light expires without tapping and speeds up after catches', () => {
  let s = advanceMiniGame(createMiniGame('light'), 2100, random);
  assert.equal(s.misses,1); assert.equal(s.score,0);
  s = inputMiniGame(s,0,random); assert.equal(s.score,1);
  assert.ok(s.target.expires-s.elapsed < 2000);
});
test('rhythm only accepts the matching lane inside its visible hit window, once', () => {
  let s = createMiniGame('rhythm');
  s.notes = [{id:1,lane:2,born:0,travel:2400,hazard:false}];
  assert.equal(inputMiniGame(s,2).score,0);
  s.elapsed=2400;
  assert.equal(inputMiniGame(s,1).score,0);
  s=inputMiniGame(s,2); assert.equal(s.score,1); assert.equal(s.notes.length,0);
  assert.equal(inputMiniGame(s,2).score,1);
});
test('catch checks the pet lane and hazards at arrival, never on input', () => {
  let s=createMiniGame('catch'); s.nextSpawn=9999;
  s.notes=[{id:1,lane:2,born:0,travel:1500,hazard:false}];
  s=inputMiniGame(s,2); assert.equal(s.score,0);
  s=advanceMiniGame(s,1500); assert.equal(s.score,1);
  s.notes=[{id:2,lane:2,born:1500,travel:1500,hazard:true}];
  s=advanceMiniGame(s,1500); assert.equal(s.score,0); assert.equal(s.misses,1);
});
test('memory ignores input during playback, validates order and grows the sequence', () => {
  let s=createMiniGame('memory',40,random);
  assert.equal(memoryCue(s).showing,true); assert.equal(inputMiniGame(s,1).score,0);
  s.elapsed=2100; assert.equal(memoryCue(s).showing,false);
  s=inputMiniGame(s,1,random); s=inputMiniGame(s,1,random);
  assert.equal(s.score,2); assert.equal(s.sequence.length,3); assert.equal(s.memoryIndex,0);
  s.elapsed=s.memoryStart+2250; s=inputMiniGame(s,3);
  assert.equal(s.misses,1); assert.equal(memoryCue(s).showing,true);
});
test('finished games cannot award further points', () => {
  let s=createMiniGame('light');
  for(let i=0;i<3;i++) s=advanceMiniGame(s,2100);
  assert.equal(s.finished,true); assert.equal(inputMiniGame(s,0),s);
});
test('poop traps unlock at 20 points and stay enabled after losing a point', () => {
  for (const mode of ['light']) {
    let s=createMiniGame(mode); s.score=19;
    s=advanceMiniGame(s,40,random); assert.equal(s.traps.length,0);
    s.score=20; s=advanceMiniGame(s,40,random); assert.equal(s.traps.length,1);
    const id=s.traps[0].id;
    s=pressMiniGameTrap(s,id); assert.equal(s.score,19); assert.equal(s.traps.length,0);
    assert.equal(pressMiniGameTrap(s,id),s);
    s=advanceMiniGame(s,2700,random); assert.equal(s.traps.length,1);
  }
});
test('ignoring expired traps causes no penalty; finished traps cannot be pressed', () => {
  let s=createMiniGame('light'); s.score=20;
  s=advanceMiniGame(s,40,random); const id=s.traps[0].id;
  s=advanceMiniGame(s,2250,random); assert.equal(s.score,20);
  assert.equal(pressMiniGameTrap(s,id),s);
  s={...s,finished:true,lives:0};
  assert.equal(pressMiniGameTrap(s,s.traps[0]?.id),s);
});
test('light target relocation does not overlap a trap', () => {
  let s=createMiniGame('light'); s.score=20;
  s=advanceMiniGame(s,40,random);
  for(let i=0;i<10;i++) {
    s=inputMiniGame(s,0,random);
    assert.ok(Math.abs(s.target.x-s.traps[0].x)>=28 || Math.abs(s.target.y-s.traps[0].y)>=28);
  }
});
test('light decoys reshuffle with captures and independently on a fast timer', () => {
  let seed=41;
  const rng=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
  let s=createMiniGame('light'); s.score=20;
  s=advanceMiniGame(s,40,rng);
  const first=s.traps[0];
  s=inputMiniGame(s,0,rng);
  assert.notEqual(s.traps[0].id,first.id);
  assert.notDeepEqual([s.traps[0].x,s.traps[0].y],[first.x,first.y]);
  const second=s.traps[0];
  s=advanceMiniGame(s,s.nextTrap-s.elapsed+1,rng);
  assert.notEqual(s.traps[0].id,second.id);
  assert.ok(s.nextTrap-s.elapsed>=650 && s.nextTrap-s.elapsed<=1150);
});
test('multiple decoys stay apart from each other and the light over many captures', () => {
  let seed=101;
  const rng=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
  let s=createMiniGame('light',400); s.score=30;
  for(let i=0;i<200;i++) {
    s=inputMiniGame(s,0,rng);
    assert.equal(s.traps.length,2);
    const points=[s.target,...s.traps];
    for(let a=0;a<points.length;a++) for(let b=a+1;b<points.length;b++)
      assert.ok(Math.abs(points[a].x-points[b].x)>=28 || Math.abs(points[a].y-points[b].y)>=28);
    for(const t of s.traps) assert.ok(t.x>=14 && t.x<=86 && t.y>=20 && t.y<=68);
  }
});
