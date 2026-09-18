import test from 'node:test';
import assert from 'node:assert/strict';
import { createFamiliarWeeklyLoopState, familiarWeekKey, restoreFamiliarWeeklyLoopState } from '../lib/famiglioWeeklyLoop.ts';
const now = new Date('2026-09-08T12:00:00Z');
const launch = '2026-09-08';
test('legacy daily record migrates only to its original mode', () => {
  const state = createFamiliarWeeklyLoopState(now, launch);
  state.miniGame.kind = 'catch'; state.miniGame.bestScore = 24;
  const restored = restoreFamiliarWeeklyLoopState(state, now, launch);
  assert.equal(restored.miniGame.scores.catch,24);
  assert.equal(restored.miniGame.scores.light,0);
});
test('mode records remain independent and the daily reward remains shared', () => {
  const state = createFamiliarWeeklyLoopState(now, launch);
  state.miniGame = {...state.miniGame, kind:'memory', bestScore:12, rewarded:true,
    scores:{light:31,catch:24,jump:17,memory:12}};
  const restored = restoreFamiliarWeeklyLoopState(state, now, launch);
  assert.deepEqual(restored.miniGame.scores,state.miniGame.scores);
  assert.equal(restored.miniGame.rewarded,true);
  assert.equal(restored.miniGame.bestScore,12);
});
test('daily records and shared reward reset on a new day', () => {
  const state = createFamiliarWeeklyLoopState(now, launch);
  state.miniGame.rewarded=true; state.miniGame.scores={light:30};
  const restored=restoreFamiliarWeeklyLoopState(state,new Date('2026-09-09T12:00:00Z'),launch);
  assert.deepEqual(restored.miniGame.scores,{});
  assert.equal(restored.miniGame.rewarded,false);
  assert.equal(restored.miniGame.bestScore,0);
});
test('lunar path missions reset every week even after the 52-week reward calendar ends', () => {
  const oldLaunch = '2025-09-08';
  const stale = createFamiliarWeeklyLoopState(new Date('2026-09-07T12:00:00Z'), oldLaunch);
  stale.steps = ['care', 'play', 'adventure', 'combat'];
  stale.chestClaimed = true;
  const nextWeek = new Date('2026-09-14T12:00:00Z');
  const restored = restoreFamiliarWeeklyLoopState(stale, nextWeek, oldLaunch);
  assert.notEqual(restored.weekKey, stale.weekKey);
  assert.equal(restored.weekKey, familiarWeekKey(nextWeek, oldLaunch));
  assert.deepEqual(restored.steps, []);
  assert.equal(restored.chestClaimed, false);
});
