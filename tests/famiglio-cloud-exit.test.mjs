import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('cloud results always expose an exit and complete the score only once', () => {
  const source = readFileSync('components/FamiglioCloudGame.tsx', 'utf8');
  assert.match(source, /onClick=\{finish\}>Torna alla Casa/);
  assert.match(source, /run.finished\?<button type="button" onClick=\{finish\}>Esci/);
  assert.match(source, /if\(run.finished\)\{finish\(\);return;\}/);
  const body = source.match(/const finish=\(\)=>\{(.+?)\};/)[1];
  let submitted = { current: false }, scores = [], exits = 0;
  const finish = new Function('submitted', 'onComplete', 'onExit', 'run', body);
  for (let i = 0; i < 2; i++) finish(submitted, score => scores.push(score), () => exits++, { score: 12 });
  assert.deepEqual(scores, [12]);
  assert.equal(exits, 2);
  assert.match(readFileSync('components/FamiglioDailyMiniGame.tsx', 'utf8'), /onExit=\{props.onClose\}/);
  assert.match(readFileSync('components/FamiglioNexusRebuild.tsx', 'utf8'), /setMiniGameOpen\(false\);\s+setHomePanel\("care"\);\s+void recordCareMission\("play"\)/);
});
