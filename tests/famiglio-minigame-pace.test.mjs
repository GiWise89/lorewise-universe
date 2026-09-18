import test from 'node:test';
import assert from 'node:assert/strict';
import { createMiniGame, advanceMiniGame, inputMiniGame, memoryCue, miniGameStage } from '../lib/famiglioMiniGameEngine.ts';
import { createCloudRun, advanceCloud, cloudRunSpeed } from '../lib/famiglioCloudJump.ts';

test('difficulty changes at ten-second boundaries, never between them', () => {
  assert.equal(miniGameStage(9999), 0);
  assert.equal(miniGameStage(10000), 1);
  assert.equal(miniGameStage(19999), 1);
  assert.equal(miniGameStage(20000), 2);
});

test('light windows and catch travel/spawn intervals keep shrinking without score gains', () => {
  let previous = [Infinity, Infinity, Infinity];
  for (const elapsed of [0, 10000, 20000, 60000, 120000, 180000]) {
    const light = inputMiniGame({...createMiniGame('light'), elapsed}, 0, () => .3);
    const caught = advanceMiniGame({...createMiniGame('catch'), elapsed, nextSpawn: elapsed}, 0, () => .3);
    const timings = [light.target.expires - elapsed, caught.notes[0].travel, caught.nextSpawn - elapsed];
    timings.forEach((value, i) => { assert.ok(value > 0 && value < previous[i]); });
    previous = timings;
    assert.equal(caught.finished, false);
  }
});

test('memory accelerates new sequences but preserves playback across a stage boundary', () => {
  const base = {...createMiniGame('memory', 40, () => 0), memoryStart: 9800};
  assert.equal(memoryCue({...base, elapsed: 10100}).pad, 0);
  assert.equal(memoryCue({...base, elapsed: 10350}).pad, -1);
  const late = {...base, memoryStart: 60000, elapsed: 60900};
  assert.equal(memoryCue(late).showing, false);
  assert.equal(memoryCue({...base, memoryStart: 0, elapsed: 900}).showing, true);
  const long = {...base, sequence: Array(7).fill(0), elapsed: 30000, memoryIndex: 6};
  assert.equal(inputMiniGame(long, 0, () => 0).sequence.length, 8);
});

test('cloud speed continues beyond the old ceiling and warnings still precede fast collisions', () => {
  assert.ok(cloudRunSpeed(180000) > cloudRunSpeed(120000));
  let s = {...createCloudRun(), elapsed: 180000};
  const x = s.camera + 160;
  s.platforms = [{id:0,x:-24,width:2000,y:300,gem:false,landed:true,kind:'stable'}];
  s.enemies = [{id:1,platformId:0,x:x+500,y:300,warnedAt:null,passed:false,npcIndex:0,hitAt:null}];
  s = advanceCloud(s, 16, () => .5);
  assert.notEqual(s.enemies[0].warnedAt, null);
  for (let i=0; i<90 && s.lives===3; i++) s=advanceCloud(s,16,()=>.5);
  assert.equal(s.lives, 2);
  assert.equal(s.finished, false);
});
