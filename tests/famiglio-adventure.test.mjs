import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import sharp from "sharp";
import {
  FAMILIAR_DUNGEONS,
  FAMILIAR_EXPEDITION_EVENTS,
  claimFamiliarAdventureReward,
  completeFamiliarExpedition,
  createFamiliarAdventureState,
  dungeonIsUnlocked,
  familiarAdventureProgress,
  familiarExpeditionsToday,
  familiarExpeditionEvent,
  expeditionChoiceIsAvailable,
  familiarBattleMoves,
  familiarCombatProfile,
  growthStageForFamiliar,
  openFamiliarExpeditionEncounter,
  performFamiliarBattleMove,
  restoreFamiliarAdventureState,
  resolveFamiliarExpeditionChoice,
  startFamiliarExpedition,
  syncFamiliarAdventureGrowth,
} from "../lib/famiglioAdventure.ts";
import { FAMILIAR_COLLECTION, REQUIRED_COLLECTION_ACTIONS } from "../lib/famiglioMarketExpansion.ts";

const root = process.cwd();
const battleActions = ["entrance", "idle", "run", "physical", "magic", "guard", "hit", "win", "lose"];
const stages = ["cucciolo", "giovane", "adulto"];

test("every familiar has one complete original combat profile", () => {
  assert.equal(FAMILIAR_COLLECTION.length, 53);
  const signatures = new Set();
  for (const familiar of FAMILIAR_COLLECTION) {
    const profile = familiarCombatProfile(familiar.id, "adulto");
    assert.equal(profile.familiarId, familiar.id);
    assert.ok(profile.maxTenacity >= 100);
    assert.ok(profile.power > 20);
    assert.ok(profile.defense > 15);
    assert.ok(profile.speed > 15);
    assert.notEqual(profile.signatureName, "Tecnica del Nexus");
    signatures.add(profile.signatureName);
  }
  assert.equal(signatures.size, 53);
});

test("growth needs both bond experience and real care days", () => {
  assert.equal(growthStageForFamiliar(3_500, 0), "cucciolo");
  assert.equal(growthStageForFamiliar(899, 20), "cucciolo");
  assert.equal(growthStageForFamiliar(900, 14), "giovane");
  assert.equal(growthStageForFamiliar(3_500, 34), "giovane");
  assert.equal(growthStageForFamiliar(3_500, 35), "adulto");
  let state = createFamiliarAdventureState();
  state = syncFamiliarAdventureGrowth(state, "cat", 3_500, 35);
  assert.equal(familiarAdventureProgress(state, "cat").stage, "adulto");
  assert.equal(familiarAdventureProgress(state, "rabbit").stage, "cucciolo");
});

test("young and adult combat moves unlock without copying a third-party ruleset", () => {
  assert.deepEqual(familiarBattleMoves("cat", "cucciolo").filter((move) => move.unlocked).map((move) => move.id), ["instinct", "guard"]);
  assert.deepEqual(familiarBattleMoves("cat", "giovane").filter((move) => move.unlocked).map((move) => move.id), ["instinct", "technique", "guard"]);
  assert.deepEqual(familiarBattleMoves("cat", "adulto").filter((move) => move.unlocked).map((move) => move.id), ["instinct", "technique", "guard", "bond"]);
});

test("the four dungeon timers remain real and stage-gated", () => {
  assert.deepEqual(FAMILIAR_DUNGEONS.map((dungeon) => dungeon.durationMinutes), [5, 10, 15, 20]);
  assert.ok(FAMILIAR_DUNGEONS.every((dungeon) => dungeon.reward.bondXp === 0));
  assert.equal(dungeonIsUnlocked("cucciolo", FAMILIAR_DUNGEONS[0]), true);
  assert.equal(dungeonIsUnlocked("cucciolo", FAMILIAR_DUNGEONS[1]), false);
  assert.equal(dungeonIsUnlocked("giovane", FAMILIAR_DUNGEONS[2]), true);
  assert.equal(dungeonIsUnlocked("giovane", FAMILIAR_DUNGEONS[3]), false);
  assert.equal(dungeonIsUnlocked("adulto", FAMILIAR_DUNGEONS[3]), true);
});

test("every destination rotates among three distinct narrative events", () => {
  for (const dungeon of FAMILIAR_DUNGEONS) {
    const events = FAMILIAR_EXPEDITION_EVENTS.filter((event) => event.dungeonId === dungeon.id);
    assert.equal(events.length, 3);
    assert.equal(new Set(events.flatMap((event) => event.choices.map((choice) => choice.id))).size, 6);
  }
});

test("an adult familiar can start each of the four expedition choices", () => {
  const now = Date.UTC(2026, 8, 5, 12, 0, 0);
  for (const dungeon of FAMILIAR_DUNGEONS) {
    const prepared = syncFamiliarAdventureGrowth(createFamiliarAdventureState(), "cat", 3_500, 35);
    const departed = startFamiliarExpedition(prepared, "cat", dungeon.id, now);
    assert.equal(departed.ok, true, dungeon.name);
    assert.equal(departed.state.expedition?.dungeonId, dungeon.id);
    assert.equal(departed.state.expedition?.endsAt, now + dungeon.durationMinutes * 60_000);
  }
});

test("a familiar can start at most three expeditions per Rome day", () => {
  const dayOne = Date.UTC(2026, 8, 5, 10, 0, 0);
  let state = syncFamiliarAdventureGrowth(createFamiliarAdventureState(), "cat", 3_500, 35);

  for (let index = 0; index < 3; index += 1) {
    const startedAt = dayOne + index * 6 * 60_000;
    const departed = startFamiliarExpedition(state, "cat", "twilight-woods", startedAt);
    assert.equal(departed.ok, true);
    const completed = completeFamiliarExpedition(departed.state, startedAt + 5 * 60_000);
    assert.equal(completed.ok, true);
    const claimed = claimFamiliarAdventureReward(completed.state, startedAt + 5 * 60_000 + 1);
    assert.equal(claimed.ok, true);
    state = claimed.state;
  }

  assert.equal(familiarExpeditionsToday(state, dayOne), 3);
  const fourth = startFamiliarExpedition(state, "cat", "twilight-woods", dayOne + 30 * 60_000);
  assert.equal(fourth.ok, false);
  assert.match(fourth.error, /3 spedizioni/);
  const switchedFamiliar = startFamiliarExpedition(state, "rabbit", "twilight-woods", dayOne + 31 * 60_000);
  assert.equal(switchedFamiliar.ok, false, "il limite giornaliero non si aggira cambiando Famiglio");

  const nextDay = Date.UTC(2026, 8, 6, 10, 0, 0);
  assert.equal(familiarExpeditionsToday(state, nextDay), 0);
  assert.equal(startFamiliarExpedition(state, "cat", "twilight-woods", nextDay).ok, true);
});

test("an expedition waits for its timer and then prepares a reward without combat", () => {
  const start = Date.UTC(2026, 8, 4, 12, 0, 0);
  const prepared = syncFamiliarAdventureGrowth(createFamiliarAdventureState(), "cat", 3_500, 35);
  const departed = startFamiliarExpedition(prepared, "cat", "twilight-woods", start);
  assert.equal(departed.ok, true);
  assert.equal(departed.state.expedition.endsAt - start, 5 * 60_000);
  assert.equal(completeFamiliarExpedition(departed.state, start + 299_999).ok, false);
  const completed = completeFamiliarExpedition(departed.state, start + 300_000);
  assert.equal(completed.ok, true);
  assert.equal(completed.state.battle, null);
  assert.equal(completed.state.pendingReward.familiarId, "cat");
  assert.equal(completed.state.pendingReward.bondXp, 0);
  assert.equal(completeFamiliarExpedition(completed.state, start + 300_001).ok, false);
});

test("each expedition offers a timed choice that changes only its final reward", () => {
  const start = Date.UTC(2026, 8, 4, 12, 0, 0);
  let state = syncFamiliarAdventureGrowth(createFamiliarAdventureState(), "cat", 3_500, 35);
  state = startFamiliarExpedition(state, "cat", "twilight-woods", start).state;
  const event = familiarExpeditionEvent(state);
  assert.ok(event);
  assert.equal(expeditionChoiceIsAvailable(state, start + 89_999), false);
  assert.equal(expeditionChoiceIsAvailable(state, start + 90_000), true);
  const choice = event.choices.find((entry) => entry.rewardMultiplier > 1);
  const resolved = resolveFamiliarExpeditionChoice(state, choice.id, start + 90_000);
  assert.equal(resolved.ok, true);
  state = completeFamiliarExpedition(resolved.state, resolved.state.expedition.endsAt).state;
  assert.equal(state.pendingReward.nexusCoins, Math.round(FAMILIAR_DUNGEONS[0].reward.nexusCoins * choice.rewardMultiplier));
  assert.equal(state.battle, null);
});

test("an exploration reward is claimed once and never grants affection XP", () => {
  const start = Date.UTC(2026, 8, 4, 12, 0, 0);
  let state = syncFamiliarAdventureGrowth(createFamiliarAdventureState(), "cat", 3_500, 35);
  state = startFamiliarExpedition(state, "cat", "twilight-woods", start).state;
  state = completeFamiliarExpedition(state, start + 300_000).state;
  assert.equal(familiarAdventureProgress(state, "cat").adventureXp, 0);
  const claimed = claimFamiliarAdventureReward(state, start + 300_100);
  assert.equal(claimed.ok, true);
  assert.equal(claimed.reward.adventureXp, FAMILIAR_DUNGEONS[0].reward.adventureXp);
  assert.equal(familiarAdventureProgress(claimed.state, "cat").adventureXp, FAMILIAR_DUNGEONS[0].reward.adventureXp);
  assert.equal(familiarAdventureProgress(claimed.state, "cat").bondXp, 3_500);
  assert.equal(claimed.state.history.length, 1);
  assert.equal(claimed.state.history[0].dungeonId, "twilight-woods");
  assert.equal(claimFamiliarAdventureReward(claimed.state).ok, false);
});

test("legacy battle exports remain compatible but are no longer the expedition completion path", () => {
  const start = Date.UTC(2026, 8, 4, 12, 0, 0);
  let state = syncFamiliarAdventureGrowth(createFamiliarAdventureState(), "adult-red-dragon", 3_500, 35);
  state = startFamiliarExpedition(state, "adult-red-dragon", "twilight-woods", start).state;
  state = openFamiliarExpeditionEncounter(state, start + 300_000).state;
  for (let turn = 0; turn < 12 && state.battle?.outcome === "active"; turn += 1) {
    state = performFamiliarBattleMove(state, turn % 2 === 0 ? "bond" : "technique").state;
  }
  assert.equal(state.battle?.outcome, "victory");
  assert.ok(state.pendingReward);
  const claimed = claimFamiliarAdventureReward(state);
  assert.equal(claimed.ok, true);
  assert.equal(claimed.reward.nexusCoins, FAMILIAR_DUNGEONS[0].reward.nexusCoins);
  assert.equal(claimFamiliarAdventureReward(claimed.state).ok, false);
});

test("adventure saves keep separate progress for every familiar", () => {
  let state = createFamiliarAdventureState();
  state = syncFamiliarAdventureGrowth(state, "cat", 3_500, 35);
  state = syncFamiliarAdventureGrowth(state, "brachiosaurus", 900, 14);
  const restored = restoreFamiliarAdventureState(JSON.parse(JSON.stringify(state)));
  assert.equal(familiarAdventureProgress(restored, "cat").stage, "adulto");
  assert.equal(familiarAdventureProgress(restored, "brachiosaurus").stage, "giovane");
  assert.equal(familiarAdventureProgress(restored, "faerie-dragon").stage, "cucciolo");
  assert.deepEqual(restored.history, []);
});

test("all 53 familiars own every stage and battle sequence", async () => {
  const manifestPath = path.join(root, "artifacts", "famiglio-rebuild-qa", "familiar-growth-combat-manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  assert.equal(manifest.totals.familiars, 53);
  assert.equal(manifest.totals.stages, 3);
  assert.equal(manifest.totals.houseSequences, 1590);
  assert.ok(manifest.totals.battleSequences >= 53 * 3 * battleActions.length);
  assert.deepEqual(manifest.totals.invalid, []);
  for (const familiar of FAMILIAR_COLLECTION) for (const stage of stages) {
    const stageRoot = path.join(root, "public", familiar.spriteBase, "growth", stage);
    await access(path.join(stageRoot, "preview.webp"));
    for (const action of REQUIRED_COLLECTION_ACTIONS) await access(path.join(stageRoot, "house", `${action}.png`));
    for (const action of battleActions) await access(path.join(stageRoot, "battle", `${action}.png`));
  }
});

test("generated dungeon art is full 16 by 9 and every guardian is transparent", async () => {
  for (const dungeon of FAMILIAR_DUNGEONS) {
    const background = await sharp(path.join(root, "public", dungeon.backgroundSrc)).metadata();
    const enemy = await sharp(path.join(root, "public", dungeon.enemySpriteSrc)).metadata();
    assert.equal(background.width, 1280);
    assert.equal(background.height, 720);
    assert.equal(enemy.hasAlpha, true);
  }
});

test("desktop and mobile expedition UI uses one fitted workspace and never opens combat", async () => {
  const [component, styles, rebuild] = await Promise.all([
    readFile(path.join(root, "components", "FamiglioAdventure.tsx"), "utf8"),
    readFile(path.join(root, "components", "FamiglioAdventure.module.css"), "utf8"),
    readFile(path.join(root, "components", "FamiglioNexusRebuild.tsx"), "utf8"),
  ]);
  assert.match(component, /Spedizioni del Nexus/);
  assert.match(component, /completeFamiliarExpedition/);
  assert.match(component, /role="timer"/);
  assert.match(component, /Riscatta ricompensa/);
  assert.match(component, /Cronologia spedizioni/);
  assert.doesNotMatch(component, /openFamiliarExpeditionEncounter/);
  assert.doesNotMatch(component, /performFamiliarBattleMove/);
  assert.doesNotMatch(component, /Affronta il guardiano/);
  assert.match(styles, /@media \(max-width: 720px\)/);
  assert.match(styles, /\.adventure\s*\{[^}]*overflow:\s*hidden;/s);
  assert.match(styles, /\.workspace\s*\{[^}]*grid-template-rows:\s*minmax\(0,\s*1fr\) auto;[^}]*overflow:\s*hidden;/s);
  assert.match(styles, /\.expeditionPanel\s*\{[^}]*grid-template-columns:[^}]*overflow:\s*hidden;/s);
  assert.match(component, /<details className=\{styles\.historyPanel\}/);
  assert.match(component, /cat:\s*7,\s*rabbit:\s*8,\s*parrot:\s*6/);
  assert.match(component, /"--travel-frame-count":\s*travelFrameCount/);
  assert.match(styles, /background-size:\s*calc\(var\(--travel-frame-count, 4\) \* 100%\) 100%/);
  assert.match(styles, /background-position:\s*var\(--travel-frame-end, 133\.333%\) 0/);
  assert.match(component, /state\.expedition\?\.familiarId \?\? state\.pendingReward\?\.familiarId \?\? familiarId/);
  assert.match(component, /walk-\$\{starterVariant\}\.png/);
  assert.match(component, /aria-label=\{`\$\{displayedFamiliarName\} in cammino`\}/);
  assert.match(styles, /\.dungeonCopy\s*\{[\s\S]*?background:\s*linear-gradient/);
  assert.match(rebuild, /homePanel === "adventure"/);
  assert.match(rebuild, /<FamiglioAdventure[\s\S]*?colorVariant=\{state\.colorVariant\}/);
});
