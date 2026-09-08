import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const root = new URL('../public/famiglio/rebuild/effects/', import.meta.url);
test('each mini-game has a different generated PNG background', () => {
  const hashes = ['light','rhythm','catch','memory'].map(mode => {
    const bytes=readFileSync(new URL(`minigame-${mode}-bg-v2.png`,root));
    assert.equal(bytes.subarray(1,4).toString(),'PNG');
    return createHash('sha256').update(bytes).digest('hex');
  });
  assert.equal(new Set(hashes).size,4);
});
test('all selection icons and gameplay sprites exist as PNG assets', () => {
  const names=[...['light','rhythm','catch','memory'].map(mode=>`minigame-${mode}-icon-v1.png`),
    ...['star','thorn','rune-diamond','rune-circle','rune-triangle','rune-star'].map(name=>`minigame-${name}-v2.png`)];
  for(const name of names) assert.equal(readFileSync(new URL(name,root)).subarray(1,4).toString(),'PNG',name);
});
test('selection is title and image only; explanation and back button belong to intro', () => {
  const source=readFileSync(new URL('../components/FamiglioDailyMiniGame.tsx',import.meta.url),'utf8');
  const picker=source.slice(source.indexOf('<div className={styles.modeChoices}>'),source.indexOf('function MiniGameSession'));
  assert.ok(picker.includes('gameIcon(kind)'));
  assert.ok(!picker.includes('RULES[kind]'));
  assert.ok(source.includes('onClick={onClose}>← Indietro'));
  assert.ok(source.includes('const [phase, setPhase] = useState<"intro" | "playing" | "paused">("intro")'));
  assert.ok(!source.includes('"♫"'));
  assert.ok(!source.includes('<span>✦</span>'));
});
