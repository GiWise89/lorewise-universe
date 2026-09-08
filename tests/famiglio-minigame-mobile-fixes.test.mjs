import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { advanceMiniGame, createMiniGame } from '../lib/famiglioMiniGameEngine.ts';

test('catch guarantees a falling thorn by the fourth object even with unlucky randomness', () => {
  let run = createMiniGame('catch', 40, () => .9);
  const seen = new Map();
  for(let i=0;i<60;i++) {
    run=advanceMiniGame(run,100,()=>.9);
    for(const note of run.notes) seen.set(note.id,note.hazard);
  }
  assert.equal(seen.get(1),false);
  assert.equal(seen.get(4),true);
});

test('collecting a thorn removes one point once; avoiding one does not penalize', () => {
  const state = {...createMiniGame('catch'),score:5,combo:3,nextSpawn:10000,notes:[{id:1,lane:1,born:0,travel:1500,hazard:true}]};
  const hit=advanceMiniGame(state,1500);
  assert.equal(hit.score,4);
  assert.equal(hit.combo,0);
  assert.equal(hit.misses,1);
  assert.equal(advanceMiniGame(hit,100).score,4);
  assert.equal(advanceMiniGame({...state,lane:2},1500).score,5);
  assert.equal(advanceMiniGame({...state,score:0},1500).score,0);
});

test('memory feedback has a separate in-flow row, not the global overlay', () => {
  const source=readFileSync('components/FamiglioDailyMiniGame.tsx','utf8');
  const css=readFileSync('components/FamiglioDailyMiniGame.module.css','utf8');
  assert.match(source, /<\/p><output className=\{styles.memoryFeedback\}/);
  assert.match(source, /kind !== "memory" \? <output className=\{styles.feedback\}/);
  assert.match(css,/\.memoryFeedback\{[^}]*position:static;[^}]*min-height:/);
});
