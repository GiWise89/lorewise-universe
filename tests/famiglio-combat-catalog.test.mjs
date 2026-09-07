import assert from "node:assert/strict";
import test from "node:test";
import { FAMILIAR_COLLECTION } from "../lib/famiglioMarketExpansion.ts";
import {
  AFFINITY_RELATIONS,
  COMBAT_LEVEL_CAP,
  COMBAT_MOVES_BY_ID,
  FAMILIAR_COMBAT_CATALOG,
  FAMILIAR_COMBAT_CIRCUITS,
  FAMILIAR_COMBAT_DIFFICULTIES,
  FAMILIAR_MOVE_SLOTS,
  MOVE_UNLOCK_BANDS,
  affinityMultiplier,
  combatShopCardFor,
  combatStatsAtLevel,
  createSeededMoveSchedule,
  defaultEquippedMovesAtLevel,
  familiarCombatEntry,
  movesKnownAtLevel,
  validateFamiliarCombatCatalog,
} from "../lib/famiglioCombatCatalog.ts";

test("the combat catalog covers the 53 canonical Famigli exactly once", () => {
  assert.equal(FAMILIAR_COLLECTION.length, 53);
  assert.equal(FAMILIAR_COMBAT_CATALOG.length, 53);
  assert.deepEqual(
    [...FAMILIAR_COMBAT_CATALOG.map((entry) => entry.id)].sort(),
    [...FAMILIAR_COLLECTION.map((entry) => entry.id)].sort(),
  );
  assert.equal(new Set(FAMILIAR_COMBAT_CATALOG.map((entry) => entry.id)).size, 53);
  assert.deepEqual(validateFamiliarCombatCatalog(), { ok: true, errors: [] });
});

test("rarities follow the approved 12 common, 18 rare, 14 epic and 9 legendary distribution", () => {
  const counts = Object.fromEntries(["comune", "raro", "epico", "leggendario"].map((rarity) => [rarity, FAMILIAR_COMBAT_CATALOG.filter((entry) => entry.rarity === rarity).length]));
  assert.deepEqual(counts, { comune: 12, raro: 18, epico: 14, leggendario: 9 });
  for (const combatEntry of FAMILIAR_COMBAT_CATALOG) {
    assert.equal(FAMILIAR_COLLECTION.find((entry) => entry.id === combatEntry.id)?.rarity, combatEntry.rarity, `${combatEntry.id} must use the same rarity in the market and combat`);
  }
});

test("every species has individual stats, growth and a complete move identity", () => {
  const finalNames = new Set();
  const statSignatures = new Set();
  for (const entry of FAMILIAR_COMBAT_CATALOG) {
    assert.ok(["natura", "marea", "ardore", "vento", "arcano", "antico"].includes(entry.affinity));
    assert.ok(["assaltatore", "guardiano", "mistico", "agile", "sostegno", "colosso"].includes(entry.role));
    assert.equal(entry.initialMoveIds.length, 2);
    assert.equal(entry.initialEquippedMoveIds.length, 2);
    assert.equal(entry.moves.length, 8);
    assert.equal(entry.moves.filter((move) => move.source === "species").length, 4);
    assert.equal(entry.moves.filter((move) => move.source === "affinity").length, 2);
    assert.equal(entry.moves.filter((move) => move.source === "role").length, 1);
    assert.equal(entry.moves.filter((move) => move.source === "ultimate").length, 1);
    assert.ok(entry.moves.every((move) => move.accuracy >= 1 && move.accuracy <= 100));
    assert.ok(entry.moves.every((move) => COMBAT_MOVES_BY_ID[move.id]));
    assert.ok(entry.moves.some((move) => move.animation === "charge"));
    const ultimate = entry.moves.find((move) => move.id === entry.ultimateMoveId);
    assert.ok(ultimate);
    assert.equal(ultimate.source, "ultimate");
    finalNames.add(ultimate.name);
    statSignatures.add(JSON.stringify([entry.baseStats, entry.growth]));
  }
  assert.equal(finalNames.size, 53);
  assert.equal(statSignatures.size, 53);
});

test("the learned move system distributes every visible combat condition", () => {
  const statuses = new Set(FAMILIAR_COMBAT_CATALOG.flatMap((entry) => entry.moves.map((move) => move.status).filter(Boolean)));
  for (const status of ["burn", "freeze", "poison", "paralysis", "sleep", "slow", "weaken", "guard", "regen", "focus"]) {
    assert.ok(statuses.has(status), `stato non assegnato ad alcuna mossa: ${status}`);
  }
});

test("seeded learning is stable, permanent and stays inside all six approved bands", () => {
  const schedules = new Set();
  for (const entry of FAMILIAR_COMBAT_CATALOG) {
    const seed = `save-slot:${entry.id}`;
    const first = createSeededMoveSchedule(entry.id, seed);
    const second = createSeededMoveSchedule(entry.id, seed);
    assert.deepEqual(first, second);
    assert.equal(first.length, 6);
    first.forEach((unlock, index) => {
      const [minimum, maximum] = MOVE_UNLOCK_BANDS[index];
      assert.ok(unlock.level >= minimum && unlock.level <= maximum);
    });
    assert.equal(movesKnownAtLevel(entry.id, 1, seed).length, 2);
    assert.equal(movesKnownAtLevel(entry.id, 48, seed).length, 8);
    assert.equal(defaultEquippedMovesAtLevel(entry.id, 50, seed).length, FAMILIAR_MOVE_SLOTS);
    schedules.add(first.map((unlock) => unlock.level).join(","));
  }
  assert.ok(schedules.size > 20, "the species must not share one uniform learning schedule");
});

test("stats grow independently up to combat level 50", () => {
  for (const entry of FAMILIAR_COMBAT_CATALOG) {
    assert.deepEqual(combatStatsAtLevel(entry.id, 1), entry.baseStats);
    const maximum = combatStatsAtLevel(entry.id, COMBAT_LEVEL_CAP);
    assert.ok(maximum.hp > entry.baseStats.hp);
    assert.ok(maximum.attack > entry.baseStats.attack);
    assert.ok(maximum.defense > entry.baseStats.defense);
    assert.ok(maximum.speed > entry.baseStats.speed);
    assert.deepEqual(combatStatsAtLevel(entry.id, 99), maximum);
  }
  assert.equal(combatStatsAtLevel("missing", 1), null);
  assert.equal(familiarCombatEntry("missing"), null);
});

test("affinity advantages and resistances are reciprocal and neutral otherwise", () => {
  for (const [attacker, defender] of Object.entries(AFFINITY_RELATIONS)) {
    assert.equal(affinityMultiplier(attacker, defender), 1.25);
    assert.equal(affinityMultiplier(defender, attacker), 0.8);
    assert.equal(affinityMultiplier(attacker, attacker), 1);
  }
  assert.equal(affinityMultiplier("natura", "vento"), 1);
});

test("six progressive circuits and three behavioral difficulties are complete", () => {
  assert.equal(FAMILIAR_COMBAT_CIRCUITS.length, 6);
  assert.deepEqual(FAMILIAR_COMBAT_CIRCUITS.map((entry) => [entry.minLevel, entry.maxLevel]), [[1, 7], [6, 14], [13, 22], [21, 32], [31, 42], [41, 50]]);
  assert.deepEqual(FAMILIAR_COMBAT_DIFFICULTIES.map((entry) => entry.label), ["Normale", "Esperto", "Nexus"]);
  assert.ok(FAMILIAR_COMBAT_DIFFICULTIES[2].ai.lookahead > FAMILIAR_COMBAT_DIFFICULTIES[0].ai.lookahead);
  assert.ok(FAMILIAR_COMBAT_DIFFICULTIES[2].ai.statusPreference > FAMILIAR_COMBAT_DIFFICULTIES[0].ai.statusPreference);
  for (const circuit of FAMILIAR_COMBAT_CIRCUITS) {
    assert.ok(circuit.opponentIds.length > 0);
    assert.ok(circuit.opponentIds.includes(circuit.bossId));
    assert.ok(circuit.backgroundSrc.endsWith(".webp"));
  }
});

test("shop cards expose combat values while legendary Famigli remain earned rewards", () => {
  for (const entry of FAMILIAR_COMBAT_CATALOG) {
    const card = combatShopCardFor(entry.id);
    assert.ok(card);
    assert.equal(card.initialHp, entry.baseStats.hp);
    assert.equal(card.initialAttack, entry.baseStats.attack);
    assert.equal(card.initialDefense, entry.baseStats.defense);
    assert.equal(card.initialSpeed, entry.baseStats.speed);
    assert.equal(card.affinity, entry.affinity);
    assert.equal(card.purchasable, entry.rarity !== "leggendario");
    if (entry.rarity === "leggendario") assert.match(card.acquisition, /Soglia Leggendaria/);
  }
  assert.equal(combatShopCardFor("missing"), null);
});
