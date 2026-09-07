import assert from "node:assert/strict";
import test from "node:test";
import {
  FAMILIAR_COMBAT_MAX_LEVEL,
  FAMILIAR_COMBAT_MAX_ENERGY,
  FAMILIAR_COMBAT_ENERGY_REGEN,
  claimFamiliarCombatReward,
  closeFamiliarCombatBattle,
  combatDifficultyIsUnlocked,
  combatLevelForXp,
  createFamiliarCombatProgress,
  createFamiliarCombatState,
  equipFamiliarCombatMove,
  familiarCombatLevelProgress,
  familiarCombatDamagePreview,
  familiarCombatMoveEnergyCost,
  familiarCombatMoveHasCooldown,
  familiarCombatMoveIsBase,
  familiarCombatMoveMaxUses,
  familiarCombatOpponentPreview,
  familiarCombatOpponents,
  familiarCombatProgress,
  familiarCombatStats,
  performFamiliarCombatTurn,
  restoreFamiliarCombatState,
  retreatFromFamiliarCombat,
  startFamiliarCombatBattle,
  totalCombatXpForLevel,
} from "../lib/famiglioCombat.ts";
import {
  FAMILIAR_COMBAT_CATALOG,
  FAMILIAR_COMBAT_CIRCUITS,
  MOVE_UNLOCK_BANDS,
} from "../lib/famiglioCombatCatalog.ts";

function stateAtLevel(familiarId, level, options = {}) {
  const state = createFamiliarCombatState(options.seed ?? "engine-tests");
  const base = createFamiliarCombatProgress(familiarId, state.seed);
  return restoreFamiliarCombatState({
    ...state,
    profiles: {
      [familiarId]: {
        ...base,
        combatLevel: level,
        combatXp: totalCombatXpForLevel(level),
        wins: options.wins ?? 0,
        unlockedDifficulties: options.difficulties ?? ["normal", "expert", "nexus"],
        equippedMoveIds: options.equippedMoveIds ?? base.equippedMoveIds,
      },
    },
  });
}

function startTestBattle(state, playerId, opponentId, overrides = {}) {
  const started = startFamiliarCombatBattle(state, {
    playerId,
    opponentId,
    circuitId: overrides.circuitId ?? FAMILIAR_COMBAT_CIRCUITS[0].id,
    difficulty: overrides.difficulty ?? "normal",
    opponentLevel: overrides.opponentLevel ?? 1,
    ignoreUnlocks: true,
  });
  assert.equal(started.ok, true, started.error);
  return started.state;
}

test("two initiative dice deterministically choose the first actor and mark doubles", () => {
  const initial = stateAtLevel("cat", 8, { seed: "initiative-contract" });
  const first = startTestBattle(initial, "cat", "bird");
  const second = startTestBattle(initial, "cat", "bird");
  const initiative = first.activeBattle.initiative;
  assert.deepEqual(initiative, second.activeBattle.initiative);
  assert.ok(initiative);
  for (const die of [...initiative.playerDice, ...initiative.opponentDice]) assert.ok(die >= 1 && die <= 6);
  assert.equal(initiative.playerTotal, initiative.playerDice[0] + initiative.playerDice[1]);
  assert.equal(initiative.opponentTotal, initiative.opponentDice[0] + initiative.opponentDice[1]);
  assert.equal(initiative.playerCritical, initiative.playerDice[0] === initiative.playerDice[1]);
  assert.equal(initiative.opponentCritical, initiative.opponentDice[0] === initiative.opponentDice[1]);
  if (initiative.playerTotal !== initiative.opponentTotal) {
    assert.equal(initiative.first, initiative.playerTotal > initiative.opponentTotal ? "player" : "opponent");
  }
  const moveId = familiarCombatProgress(first, "cat").equippedMoveIds[0];
  const turn = performFamiliarCombatTurn(first, moveId);
  assert.equal(turn.ok, true, turn.error);
  const firstAction = turn.timeline.find((event) => event.phase === "windup");
  assert.equal(firstAction.actorId, initiative.first === "player" ? "cat" : "bird");
});

function forceVictory(state, moveId) {
  assert.ok(state.activeBattle);
  state = {
    ...state,
    activeBattle: {
      ...state.activeBattle,
      opponent: { ...state.activeBattle.opponent, hp: 1 },
    },
  };
  const resolved = performFamiliarCombatTurn(state, moveId);
  assert.equal(resolved.ok, true, resolved.error);
  assert.equal(resolved.state.activeBattle?.outcome, "victory");
  return resolved;
}

test("all 53 Famigli can face the other 52 through the six progressive circuits", () => {
  assert.equal(FAMILIAR_COMBAT_CATALOG.length, 53);
  assert.equal(FAMILIAR_COMBAT_CIRCUITS.length, 6);
  for (const familiar of FAMILIAR_COMBAT_CATALOG) {
    assert.equal(familiarCombatOpponents(familiar.id).length, 52);
    assert.equal(familiarCombatOpponents(familiar.id).includes(familiar.id), false);
    const campaignOpponents = new Set(FAMILIAR_COMBAT_CIRCUITS.flatMap((circuit) => familiarCombatOpponents(familiar.id, circuit.id)));
    assert.equal(campaignOpponents.size, 52, `${familiar.id} non incontra l'intero roster`);
  }
});

test("combat level 1-50 and stat growth are independent per familiar", () => {
  const state = createFamiliarCombatState("separate-track");
  const cat = familiarCombatProgress(state, "cat");
  const dragon = familiarCombatProgress(state, "adult-red-dragon");
  assert.equal(cat.combatLevel, 1);
  assert.equal(dragon.combatLevel, 1);
  assert.equal("bondXp" in cat, false);
  assert.equal("adventureXp" in cat, false);
  assert.equal(combatLevelForXp(totalCombatXpForLevel(50)), FAMILIAR_COMBAT_MAX_LEVEL);
  assert.ok(familiarCombatStats("cat", 50).hp > familiarCombatStats("cat", 1).hp);
  assert.ok(familiarCombatStats("adult-red-dragon", 1).attack > familiarCombatStats("cat", 1).attack);
  const capped = familiarCombatLevelProgress({ ...cat, combatLevel: 50, combatXp: totalCombatXpForLevel(50) });
  assert.deepEqual(capped, { current: 0, required: 0, percent: 100 });
});

test("seeded move learning is permanent, species-specific, and respects all six level bands", () => {
  const first = createFamiliarCombatProgress("faerie-dragon", 9137);
  const same = createFamiliarCombatProgress("faerie-dragon", 9137);
  const differentSpecies = createFamiliarCombatProgress("cat", 9137);
  assert.deepEqual(first.learnedSchedule, same.learnedSchedule);
  assert.notDeepEqual(first.learnedSchedule.map((entry) => entry.moveId), differentSpecies.learnedSchedule.map((entry) => entry.moveId));
  assert.equal(first.learnedSchedule.length, MOVE_UNLOCK_BANDS.length);
  first.learnedSchedule.forEach((unlock, index) => {
    assert.ok(unlock.level >= MOVE_UNLOCK_BANDS[index][0]);
    assert.ok(unlock.level <= MOVE_UNLOCK_BANDS[index][1]);
  });
  const restored = restoreFamiliarCombatState({
    ...createFamiliarCombatState(9137),
    profiles: { "faerie-dragon": first },
  });
  assert.deepEqual(familiarCombatProgress(restored, "faerie-dragon").learnedSchedule, first.learnedSchedule);
});

test("four equipped slots and the move archive remain separate and valid", () => {
  const entry = FAMILIAR_COMBAT_CATALOG.find((candidate) => candidate.id === "cat");
  assert.ok(entry);
  let state = stateAtLevel("cat", 50, { equippedMoveIds: entry.moves.slice(0, 4).map((move) => move.id) });
  let profile = familiarCombatProgress(state, "cat");
  assert.equal(profile.learnedMoveIds.length, 8);
  assert.equal(profile.equippedMoveIds.length, 4);
  assert.equal(profile.archivedMoveIds.length, 4);
  const moved = equipFamiliarCombatMove(state, "cat", entry.ultimateMoveId, 0);
  assert.equal(moved.ok, true, moved.error);
  state = moved.state;
  profile = familiarCombatProgress(state, "cat");
  assert.equal(profile.equippedMoveIds[0], entry.ultimateMoveId);
  assert.equal(profile.equippedMoveIds.length, 4);
  assert.equal(new Set([...profile.equippedMoveIds, ...profile.archivedMoveIds]).size, profile.learnedMoveIds.length);
});

test("selecting an equipped move swaps the two slots without deleting either move", () => {
  const entry = FAMILIAR_COMBAT_CATALOG.find((candidate) => candidate.id === "cat");
  assert.ok(entry);
  const first = entry.moves[0].id;
  const second = entry.moves[1].id;
  const state = stateAtLevel("cat", 1, { equippedMoveIds: [first, second] });
  const swapped = equipFamiliarCombatMove(state, "cat", second, 0);
  assert.equal(swapped.ok, true, swapped.error);
  assert.deepEqual(familiarCombatProgress(swapped.state, "cat").equippedMoveIds.slice(0, 2), [second, first]);
});

test("a physical turn emits the complete synchronized contact choreography", () => {
  const entry = FAMILIAR_COMBAT_CATALOG.find((candidate) => candidate.id === "cat");
  const physical = entry.moves.find((move) => move.damageClass === "physical");
  let state = stateAtLevel("cat", 20, { equippedMoveIds: [physical.id] });
  state = startTestBattle(state, "cat", "bird", { opponentLevel: 10 });
  const result = performFamiliarCombatTurn(state, physical.id);
  assert.equal(result.ok, true, result.error);
  const phases = result.timeline.filter((event) => event.moveId === physical.id).map((event) => event.phase);
  assert.deepEqual(phases.slice(0, 5), ["windup", "advance", "impact", "reaction", "return"]);
  const impact = result.timeline.find((event) => event.moveId === physical.id && event.phase === "impact" && event.amount > 0);
  const reaction = result.timeline.find((event) => event.moveId === physical.id && event.phase === "reaction");
  assert.ok(impact);
  assert.ok(reaction);
  assert.equal(reaction.targetId, impact.targetId, "la reazione deve restare sul difensore colpito");
  assert.equal(reaction.actorId, impact.actorId, "la reazione appartiene alla stessa azione dell'attaccante");
  assert.ok(result.timeline.every((event) => event.durationMs > 0 && event.vfxCue && event.audioCue));
});

test("a ranged spell uses a projectile phase and never turns into a skating charge", () => {
  const entry = FAMILIAR_COMBAT_CATALOG.find((candidate) => candidate.id === "cat");
  const spell = entry.moves.find((move) => move.damageClass === "magic" && move.animation === "projectile");
  let state = stateAtLevel("cat", 20, { equippedMoveIds: [spell.id] });
  state = startTestBattle(state, "cat", "bird", { opponentLevel: 10 });
  const result = performFamiliarCombatTurn(state, spell.id);
  assert.equal(result.ok, true, result.error);
  const phases = result.timeline.filter((event) => event.actorId === "cat" && event.moveId === spell.id).map((event) => event.phase);
  assert.ok(phases.includes("projectile"));
  assert.equal(phases.includes("advance"), false);
  assert.ok(phases.includes("impact"));
  assert.equal(phases.includes("return"), false, "un colpo da fermo non deve teletrasportare l'attaccante al centro per poi farlo rientrare");
});

test("schivata e colpo mancato sono occasionali, deterministici e non infliggono danni", () => {
  const entry = FAMILIAR_COMBAT_CATALOG.find((candidate) => candidate.id === "cat");
  const physical = entry.moves.find((move) => move.damageClass === "physical");
  let missedTurn = null;
  for (let seed = 1; seed <= 256; seed += 1) {
    let state = stateAtLevel("cat", 20, { seed: `miss-${seed}`, equippedMoveIds: [physical.id] });
    state = startTestBattle(state, "cat", "bird", { opponentLevel: 10 });
    const result = performFamiliarCombatTurn(state, physical.id);
    if (result.ok && result.timeline.some((event) => event.missed)) {
      missedTurn = result;
      break;
    }
  }
  assert.ok(missedTurn, "una sequenza deterministica deve poter produrre un colpo mancato");
  const miss = missedTurn.timeline.find((event) => event.missed);
  assert.equal(miss.phase, "impact");
  assert.equal(miss.amount, 0);
  assert.equal(miss.durationMs, 1_460);
  assert.match(miss.message, /schiva|manca/i);
  assert.equal(missedTurn.timeline.some((event) => event.phase === "reaction" && event.actorId === miss.actorId && event.moveId === miss.moveId), false);
});

test("poison, sleep and paralysis alter the turn instead of being decorative labels", () => {
  const cat = FAMILIAR_COMBAT_CATALOG.find((candidate) => candidate.id === "cat");
  const moveId = cat.initialMoveIds[0];
  let base = stateAtLevel("cat", 20, { equippedMoveIds: [moveId] });
  base = startTestBattle(base, "cat", "turtle", { opponentLevel: 10 });

  const withPoison = {
    ...base,
    activeBattle: {
      ...base.activeBattle,
      player: { ...base.activeBattle.player, statuses: [{ id: "poison", name: "Veleno", remainingTurns: 3, potency: 4, sourceMoveId: "test-poison" }] },
    },
  };
  const poisonedTurn = performFamiliarCombatTurn(withPoison, moveId);
  assert.equal(poisonedTurn.ok, true, poisonedTurn.error);
  const poisonTick = poisonedTurn.timeline.find((event) => event.statusId === "poison" && event.amount > 0);
  assert.ok(poisonTick, "il veleno deve infliggere danni a fine turno");
  assert.equal(poisonedTurn.state.activeBattle.player.statuses.find((status) => status.id === "poison")?.remainingTurns, 2);

  const withSleep = {
    ...base,
    activeBattle: {
      ...base.activeBattle,
      player: { ...base.activeBattle.player, statuses: [{ id: "sleep", name: "Sonno", remainingTurns: 2, potency: 100, sourceMoveId: "test-sleep" }] },
    },
  };
  const sleepingTurn = performFamiliarCombatTurn(withSleep, moveId);
  assert.equal(sleepingTurn.ok, true, sleepingTurn.error);
  assert.ok(sleepingTurn.timeline.some((event) => event.actorId === "cat" && event.statusId === "sleep" && /dorme/i.test(event.message)));
  assert.equal(sleepingTurn.timeline.some((event) => event.actorId === "cat" && event.moveId === moveId && event.phase === "windup"), false);

  let paralysisTurn = null;
  for (let rngState = 1; rngState <= 128; rngState += 1) {
    const withParalysis = {
      ...base,
      activeBattle: {
        ...base.activeBattle,
        rngState,
        player: { ...base.activeBattle.player, statuses: [{ id: "paralysis", name: "Paralisi", remainingTurns: 2, potency: 40, sourceMoveId: "test-paralysis" }] },
      },
    };
    const result = performFamiliarCombatTurn(withParalysis, moveId);
    if (result.ok && result.timeline.some((event) => event.actorId === "cat" && event.statusId === "paralysis")) {
      paralysisTurn = result;
      break;
    }
  }
  assert.ok(paralysisTurn, "la paralisi deve poter far perdere l'azione con RNG deterministico");
  assert.equal(paralysisTurn.timeline.some((event) => event.actorId === "cat" && event.moveId === moveId && event.phase === "windup"), false);
});

test("offensive moves are unlimited while tactical moves keep finite uses", () => {
  const entry = FAMILIAR_COMBAT_CATALOG.find((candidate) => candidate.id === "cat");
  const physical = entry.moves[0];
  const limited = entry.moves.find((move) => move.source === "ultimate");
  assert.equal(familiarCombatMoveMaxUses(physical.id), 0);
  assert.equal(familiarCombatMoveMaxUses(limited.id), 2);
  let state = stateAtLevel("cat", 50, { equippedMoveIds: [physical.id, limited.id] });
  state = startTestBattle(state, "cat", "tyrannosaurus", { opponentLevel: 50 });
  const initial = state.activeBattle;
  assert.ok(familiarCombatDamagePreview(initial.player, initial.opponent, physical.id) > 0);
  state = { ...state, activeBattle: { ...initial, player: { ...initial.player, moveUses: { ...initial.player.moveUses, [limited.id]: 1 } } } };
  const used = performFamiliarCombatTurn(state, limited.id);
  assert.equal(used.ok, true, used.error);
  assert.equal(used.state.activeBattle.player.moveUses[limited.id], 0);
  const resetCooldown = { ...used.state, activeBattle: { ...used.state.activeBattle, lastPlayerMoveId: null, playerMoveStreak: 0 } };
  const exhausted = performFamiliarCombatTurn(resetCooldown, limited.id);
  assert.equal(exhausted.ok, false);
  assert.match(exhausted.error, /terminati/i);
});

test("energy costs, regeneration and the free species move prevent low-HP softlocks", () => {
  const entry = FAMILIAR_COMBAT_CATALOG.find((candidate) => candidate.id === "cat");
  const [baseMoveId, poweredMoveId] = entry.initialEquippedMoveIds;
  assert.equal(familiarCombatMoveIsBase("cat", baseMoveId), true);
  assert.equal(familiarCombatMoveEnergyCost("cat", baseMoveId), 0);
  assert.ok(familiarCombatMoveEnergyCost("cat", poweredMoveId) > 0);

  let state = startTestBattle(stateAtLevel("cat", 20), "cat", "bird", { opponentLevel: 20 });
  state = {
    ...state,
    activeBattle: {
      ...state.activeBattle,
      lastPlayerMoveId: baseMoveId,
      playerMoveStreak: 2,
      player: { ...state.activeBattle.player, energy: 0, hp: 30 },
      opponent: { ...state.activeBattle.opponent, energy: 0, hp: 14 },
    },
  };
  const powered = performFamiliarCombatTurn(state, poweredMoveId);
  assert.equal(powered.ok, false);
  assert.match(powered.error, /energia insufficiente/i);
  const base = performFamiliarCombatTurn(state, baseMoveId);
  assert.equal(base.ok, true, base.error);
  assert.ok(base.state.activeBattle.player.energy >= FAMILIAR_COMBAT_ENERGY_REGEN || base.state.activeBattle.outcome !== "active");
  assert.ok(base.opponentMoveId, "anche l'IA deve avere sempre la propria mossa base gratuita");
});

test("all 53 Famigli have exactly one free initial species attack", () => {
  for (const entry of FAMILIAR_COMBAT_CATALOG) {
    const freeMoves = entry.moves.filter((move) => familiarCombatMoveEnergyCost(entry.id, move.id) === 0);
    assert.deepEqual(freeMoves.map((move) => move.id), [entry.initialMoveIds[0]], entry.id);
    assert.equal(freeMoves[0].damageClass, "physical", entry.id);
    assert.equal(familiarCombatMoveMaxUses(freeMoves[0].id), 0, entry.id);
  }
});

test("powerful moves spend energy and require one turn of recharge", () => {
  const entry = FAMILIAR_COMBAT_CATALOG.find((candidate) => candidate.id === "cat");
  const powerful = entry.moves.find((move) => move.power >= 55 && move.source !== "ultimate");
  let state = startTestBattle(stateAtLevel("cat", 50, { equippedMoveIds: [entry.moves[0].id, powerful.id] }), "cat", "golden", { opponentLevel: 50 });
  const cost = familiarCombatMoveEnergyCost("cat", powerful.id);
  assert.equal(familiarCombatMoveHasCooldown(powerful.id), true);
  const first = performFamiliarCombatTurn(state, powerful.id);
  assert.equal(first.ok, true, first.error);
  if (first.state.activeBattle?.outcome === "active") {
    assert.equal(first.state.activeBattle.player.energy, Math.min(FAMILIAR_COMBAT_MAX_ENERGY, FAMILIAR_COMBAT_MAX_ENERGY - cost + FAMILIAR_COMBAT_ENERGY_REGEN));
    const immediateRepeat = performFamiliarCombatTurn(first.state, powerful.id);
    assert.equal(immediateRepeat.ok, false);
    assert.match(immediateRepeat.error, /ricaricarsi/i);
  }
});

test("training bonuses and permanent paths enter the exact battle actor", () => {
  const base = createFamiliarCombatState("nexus-bonus");
  const unmodified = startFamiliarCombatBattle(base, { playerId: "cat", opponentId: "bird", circuitId: "prime-orme", ignoreUnlocks: true });
  const evolved = startFamiliarCombatBattle(base, {
    playerId: "cat",
    opponentId: "bird",
    circuitId: "prime-orme",
    ignoreUnlocks: true,
    playerStatBonus: { hp: 12, attack: 5, defense: 2, speed: 3 },
    playerEvolutionPath: "baluardo",
  });
  assert.equal(unmodified.ok && evolved.ok, true);
  assert.equal(evolved.state.activeBattle.player.maxHp, unmodified.state.activeBattle.player.maxHp + 12);
  assert.equal(evolved.state.activeBattle.player.stats.attack, unmodified.state.activeBattle.player.stats.attack + 5);
  assert.equal(evolved.state.activeBattle.player.evolutionPath, "baluardo");
  assert.ok(evolved.state.activeBattle.player.statuses.some((status) => status.id === "ward"));
});

test("Normal, Expert and Nexus use different AI behavior in addition to stronger stats", () => {
  const base = stateAtLevel("cat", 30, { wins: 30 });
  const normal = startFamiliarCombatBattle(base, { playerId: "cat", opponentId: "bird", circuitId: "prime-orme", difficulty: "normal", opponentLevel: 20, ignoreUnlocks: true });
  const expert = startFamiliarCombatBattle(base, { playerId: "cat", opponentId: "bird", circuitId: "prime-orme", difficulty: "expert", opponentLevel: 20, ignoreUnlocks: true });
  const nexus = startFamiliarCombatBattle(base, { playerId: "cat", opponentId: "bird", circuitId: "prime-orme", difficulty: "nexus", opponentLevel: 20, ignoreUnlocks: true });
  assert.equal(normal.ok && normal.state.activeBattle.opponentStrategy, "balanced");
  assert.equal(expert.ok && expert.state.activeBattle.opponentStrategy, "tactical");
  assert.equal(nexus.ok && nexus.state.activeBattle.opponentStrategy, "adaptive");
  assert.ok(expert.state.activeBattle.opponent.stats.attack > normal.state.activeBattle.opponent.stats.attack);
  assert.ok(nexus.state.activeBattle.opponent.stats.attack > expert.state.activeBattle.opponent.stats.attack);
});

test("difficulty thresholds stay identical before and after save restore", () => {
  const base = createFamiliarCombatProgress("cat", "thresholds");
  assert.equal(combatDifficultyIsUnlocked({ ...base, wins: 7 }, "expert"), false);
  assert.equal(combatDifficultyIsUnlocked({ ...base, wins: 8 }, "expert"), true);
  assert.equal(combatDifficultyIsUnlocked({ ...base, wins: 23 }, "nexus"), false);
  assert.equal(combatDifficultyIsUnlocked({ ...base, wins: 24 }, "nexus"), true);

  let state = stateAtLevel("cat", 20, { wins: 23, difficulties: ["normal", "expert"] });
  const moveId = familiarCombatProgress(state, "cat").equippedMoveIds[0];
  state = startTestBattle(state, "cat", "bird", { opponentLevel: 1, difficulty: "normal" });
  state = forceVictory(state, moveId).state;
  const beforeReload = familiarCombatProgress(state, "cat");
  assert.equal(beforeReload.wins, 24);
  assert.deepEqual(beforeReload.unlockedDifficulties, ["normal", "expert", "nexus"]);
  const afterReload = familiarCombatProgress(restoreFamiliarCombatState(JSON.parse(JSON.stringify(state))), "cat");
  assert.deepEqual(afterReload.unlockedDifficulties, beforeReload.unlockedDifficulties);
  assert.equal(combatDifficultyIsUnlocked(afterReload, "nexus"), true);

  const sanitized = restoreFamiliarCombatState({
    ...createFamiliarCombatState("threshold-sanitize"),
    profiles: { cat: { ...base, wins: 0, unlockedDifficulties: ["normal", "expert", "nexus"] } },
  });
  assert.deepEqual(familiarCombatProgress(sanitized, "cat").unlockedDifficulties, ["normal"]);
});

test("opponent preview is the exact actor and move pool used by start and AI", () => {
  for (const circuit of FAMILIAR_COMBAT_CIRCUITS) {
    const opponentId = familiarCombatOpponents("cat", circuit.id).at(-1);
    assert.ok(opponentId);
    for (const difficulty of ["normal", "expert", "nexus"]) {
      const preview = familiarCombatOpponentPreview({ playerId: "cat", opponentId, circuitId: circuit.id, difficulty });
      assert.ok(preview);
      const started = startFamiliarCombatBattle(createFamiliarCombatState(`preview-${circuit.id}-${difficulty}`), {
        playerId: "cat",
        opponentId,
        circuitId: circuit.id,
        difficulty,
        ignoreUnlocks: true,
      });
      assert.equal(started.ok, true, started.error);
      assert.deepEqual(started.state.activeBattle.opponent, preview.actor);
      assert.equal(started.state.activeBattle.opponent.level, preview.level);
      assert.deepEqual(started.state.activeBattle.opponent.stats, preview.stats);
      assert.equal(started.state.activeBattle.opponentStrategy, preview.strategy);
      assert.ok(preview.moves.length >= 1 && preview.moves.length <= 4);
      assert.equal(preview.moveIds.length, preview.moves.length);
      assert.equal(new Set([...preview.moveIds, ...preview.archivedMoveIds]).size, preview.learnedMoveIds.length);
      const moveId = familiarCombatProgress(started.state, "cat").equippedMoveIds[0];
      const turn = performFamiliarCombatTurn(started.state, moveId);
      assert.equal(turn.ok, true, turn.error);
      assert.ok(preview.moveIds.includes(turn.opponentMoveId), `${circuit.id}/${difficulty}: AI ha usato una mossa fuori anteprima`);
    }
  }
  const normal = familiarCombatOpponentPreview({ playerId: "cat", opponentId: "bird", circuitId: "prime-orme", difficulty: "normal", opponentLevel: 20 });
  const nexus = familiarCombatOpponentPreview({ playerId: "cat", opponentId: "bird", circuitId: "prime-orme", difficulty: "nexus", opponentLevel: 20 });
  assert.ok(normal && nexus);
  assert.equal(normal.level, 20);
  assert.equal(nexus.level, 20);
  assert.ok(nexus.stats.attack > normal.stats.attack);
  assert.equal(familiarCombatOpponentPreview({ playerId: "cat", opponentId: "cat", circuitId: "prime-orme" }), null);
});

test("every opponent AI has one deterministic loadout of at most four moves and a separate complete archive", () => {
  for (const opponent of FAMILIAR_COMBAT_CATALOG) {
    const playerId = opponent.id === "cat" ? "bird" : "cat";
    for (const level of [1, 7, 20, 50]) {
      const options = {
        playerId,
        opponentId: opponent.id,
        circuitId: "prime-orme",
        difficulty: "nexus",
        opponentLevel: level,
      };
      const first = familiarCombatOpponentPreview(options);
      const second = familiarCombatOpponentPreview(options);
      assert.ok(first && second);
      assert.ok(first.moveIds.length >= 1 && first.moveIds.length <= 4, `${opponent.id} Lv${level}: loadout fuori limite`);
      assert.deepEqual(first.moveIds, second.moveIds, `${opponent.id} Lv${level}: loadout non deterministico`);
      assert.deepEqual(first.learnedMoveIds, second.learnedMoveIds, `${opponent.id} Lv${level}: archivio non deterministico`);
      assert.equal(new Set(first.moveIds).size, first.moveIds.length);
      assert.equal(new Set(first.learnedMoveIds).size, first.learnedMoveIds.length);
      assert.ok(first.moveIds.every((moveId) => first.learnedMoveIds.includes(moveId)));
      assert.ok(first.archivedMoveIds.every((moveId) => first.learnedMoveIds.includes(moveId) && !first.moveIds.includes(moveId)));
      assert.equal(first.moveIds.length + first.archivedMoveIds.length, first.learnedMoveIds.length);
      if (level === 50) {
        assert.equal(first.learnedMoveIds.length, opponent.moves.length);
        assert.equal(first.moveIds.length, 4);
        assert.equal(first.archivedMoveIds.length, opponent.moves.length - 4);
      }
    }
  }
});

test("XP is granted only when a battle ends and the first-clear reward is claimable once", () => {
  const cat = FAMILIAR_COMBAT_CATALOG.find((entry) => entry.id === "cat");
  const moveId = cat.initialMoveIds[0];
  let state = stateAtLevel("cat", 20);
  const beforeXp = familiarCombatProgress(state, "cat").combatXp;
  state = startTestBattle(state, "cat", "bird", { opponentLevel: 10 });
  const active = performFamiliarCombatTurn(state, moveId);
  assert.equal(active.ok, true, active.error);
  if (active.state.activeBattle.outcome === "active") {
    assert.equal(familiarCombatProgress(active.state, "cat").combatXp, beforeXp);
    state = active.state;
  } else {
    state = closeFamiliarCombatBattle(active.state);
    state = startTestBattle(state, "cat", "bird", { opponentLevel: 10 });
  }
  const won = forceVictory(state, moveId);
  state = won.state;
  assert.ok(familiarCombatProgress(state, "cat").combatXp > beforeXp);
  assert.ok(state.pendingReward?.firstClear);
  const claimed = claimFamiliarCombatReward(state);
  assert.equal(claimed.ok, true, claimed.error);
  assert.equal(claimFamiliarCombatReward(claimed.state).ok, false);
  const xpAfterFirst = familiarCombatProgress(claimed.state, "cat").combatXp;
  state = closeFamiliarCombatBattle(claimed.state);
  state = startTestBattle(state, "cat", "bird", { opponentLevel: 10 });
  state = forceVictory(state, moveId).state;
  assert.equal(state.pendingReward, null);
  assert.ok(familiarCombatProgress(state, "cat").combatXp > xpAfterFirst, "le rivincite concluse danno XP ma non duplicano il premio unico");
});

test("defeat and retreat preserve inventory by design and cannot farm combat XP", () => {
  const cat = FAMILIAR_COMBAT_CATALOG.find((entry) => entry.id === "cat");
  let state = stateAtLevel("cat", 1);
  const before = familiarCombatProgress(state, "cat");
  state = startTestBattle(state, "cat", "adult-red-dragon", { opponentLevel: 50, difficulty: "nexus" });
  const retreated = retreatFromFamiliarCombat(state);
  const afterRetreat = familiarCombatProgress(retreated, "cat");
  assert.equal(afterRetreat.combatXp, before.combatXp);
  assert.equal(afterRetreat.losses, before.losses + 1);
  assert.equal(retreated.pendingReward, null);
  assert.equal("inventory" in retreated, false);

  state = closeFamiliarCombatBattle(retreated);
  state = startTestBattle(state, "cat", "adult-red-dragon", { opponentLevel: 50, difficulty: "nexus" });
  state = { ...state, activeBattle: { ...state.activeBattle, player: { ...state.activeBattle.player, hp: 1 } } };
  for (let turn = 0; turn < 4 && state.activeBattle?.outcome === "active"; turn += 1) {
    const result = performFamiliarCombatTurn(state, cat.initialMoveIds[0]);
    assert.equal(result.ok, true, result.error);
    state = result.state;
  }
  assert.equal(state.activeBattle?.outcome, "defeat");
  assert.ok(familiarCombatProgress(state, "cat").combatXp > afterRetreat.combatXp, "una lotta davvero conclusa assegna il piccolo XP di sconfitta");
  assert.equal(state.pendingReward, null);
});

test("the same move cannot be used more than twice in a row by player or opponent", () => {
  const cat = FAMILIAR_COMBAT_CATALOG.find((entry) => entry.id === "cat");
  assert.ok(cat);
  const firstMove = cat.moves.find((move) => !familiarCombatMoveIsBase("cat", move.id) && !familiarCombatMoveHasCooldown(move.id)).id;
  const secondMove = cat.initialMoveIds[0];
  let state = startTestBattle(stateAtLevel("cat", 20, { equippedMoveIds: [firstMove, secondMove] }), "cat", "golden", { opponentLevel: 20 });
  assert.ok(firstMove && secondMove);
  state = {
    ...state,
    activeBattle: {
      ...state.activeBattle,
      lastPlayerMoveId: firstMove,
      playerMoveStreak: 2,
    },
  };
  const blocked = performFamiliarCombatTurn(state, firstMove);
  assert.equal(blocked.ok, false);
  assert.match(blocked.error, /due utilizzi consecutivi/i);
  const allowed = performFamiliarCombatTurn(state, secondMove);
  assert.equal(allowed.ok, true, allowed.error);

  state = startTestBattle(stateAtLevel("cat", 35), "cat", "golden", { opponentLevel: 35, difficulty: "nexus" });
  const playerMoves = familiarCombatProgress(state, "cat").equippedMoveIds;
  const opponentChoices = [];
  for (let turn = 0; turn < 8 && state.activeBattle?.outcome === "active"; turn += 1) {
    state = {
      ...state,
      activeBattle: {
        ...state.activeBattle,
        player: { ...state.activeBattle.player, hp: 9999, maxHp: 9999 },
        opponent: { ...state.activeBattle.opponent, hp: 9999, maxHp: 9999 },
      },
    };
    const result = performFamiliarCombatTurn(state, playerMoves[turn % Math.min(2, playerMoves.length)]);
    assert.equal(result.ok, true, result.error);
    opponentChoices.push(result.opponentMoveId);
    state = result.state;
  }
  for (let index = 2; index < opponentChoices.length; index += 1) {
    assert.notDeepEqual(opponentChoices.slice(index - 2, index + 1), [opponentChoices[index], opponentChoices[index], opponentChoices[index]]);
  }
});

test("save restore sanitizes invalid entries without rerolling schedules or completed rewards", () => {
  const original = stateAtLevel("cat", 30, { wins: 24 });
  const profile = familiarCombatProgress(original, "cat");
  const restored = restoreFamiliarCombatState(JSON.parse(JSON.stringify({
    ...original,
    profiles: {
      ...original.profiles,
      cat: { ...profile, claimedRewardKeys: ["prime-orme:normal:bird"], completedEncounters: ["prime-orme:normal:bird"] },
      intruder: { familiarId: "intruder", combatLevel: 50 },
    },
  })));
  assert.equal(restored.profiles.intruder, undefined);
  assert.deepEqual(restored.profiles.cat.learnedSchedule, profile.learnedSchedule);
  assert.deepEqual(restored.profiles.cat.claimedRewardKeys, ["prime-orme:normal:bird"]);
  assert.ok(restored.profiles.cat.unlockedDifficulties.includes("expert"));
  assert.ok(restored.profiles.cat.unlockedDifficulties.includes("nexus"));
});
