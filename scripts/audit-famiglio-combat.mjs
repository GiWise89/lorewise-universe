import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import {
  claimFamiliarCombatReward,
  closeFamiliarCombatBattle,
  combatDifficultyIsUnlocked,
  createFamiliarCombatProgress,
  createFamiliarCombatState,
  familiarCombatOpponents,
  familiarCombatOpponentPreview,
  familiarCombatProgress,
  performFamiliarCombatTurn,
  restoreFamiliarCombatState,
  startFamiliarCombatBattle,
  totalCombatXpForLevel,
} from "../lib/famiglioCombat.ts";
import {
  FAMILIAR_COMBAT_CATALOG,
  FAMILIAR_COMBAT_CIRCUITS,
  FAMILIAR_COMBAT_DIFFICULTIES,
} from "../lib/famiglioCombatCatalog.ts";

const EXPECTED_FAMILIARS = 53;
const EXPECTED_DIRECTIONAL_MATCHUPS = EXPECTED_FAMILIARS * (EXPECTED_FAMILIARS - 1);

function assertActorIsBounded(actor, label) {
  assert.ok(Number.isFinite(actor.hp), `${label}: HP non finiti`);
  assert.ok(Number.isFinite(actor.maxHp) && actor.maxHp > 0, `${label}: HP massimi non validi`);
  assert.ok(actor.hp >= 0 && actor.hp <= actor.maxHp, `${label}: HP ${actor.hp}/${actor.maxHp} fuori limite`);
  for (const [stat, value] of Object.entries(actor.stats)) {
    assert.ok(Number.isFinite(value) && value > 0, `${label}: statistica ${stat} non valida`);
  }
}

function assertTimelineIsValid(timeline, playerId, opponentId, moveId, damageClass) {
  assert.ok(timeline.length >= 2, `${playerId} vs ${opponentId}: timeline incompleta`);
  const ids = new Set();
  timeline.forEach((event, index) => {
    assert.equal(event.order, index, `${playerId} vs ${opponentId}: ordine timeline errato`);
    assert.ok(!ids.has(event.id), `${playerId} vs ${opponentId}: evento duplicato ${event.id}`);
    ids.add(event.id);
    assert.ok(Number.isFinite(event.durationMs) && event.durationMs > 0, `${event.id}: durata non valida`);
    assert.ok(event.actorId === playerId || event.actorId === opponentId, `${event.id}: attore estraneo`);
    assert.ok(event.targetId === playerId || event.targetId === opponentId, `${event.id}: bersaglio estraneo`);
    assert.ok(event.vfxCue, `${event.id}: VFX mancante`);
    assert.ok(event.audioCue, `${event.id}: audio mancante`);
  });
  const playerPhases = timeline.filter((event) => event.moveId === moveId).map((event) => event.phase);
  assert.ok(playerPhases.includes("windup"), `${playerId}: preparazione assente`);
  if (damageClass === "physical") {
    assert.ok(playerPhases.includes("advance"), `${playerId}: corsa fisica assente`);
    assert.ok(playerPhases.includes("return"), `${playerId}: rientro fisico assente`);
    assert.ok(!playerPhases.includes("projectile"), `${playerId}: attacco fisico trasformato in proiettile`);
    const impact = timeline.find((event) => event.actorId === playerId && event.moveId === moveId && event.phase === "impact" && event.amount > 0);
    if (impact) {
      const reaction = timeline.find((event) => event.actorId === playerId && event.moveId === moveId && event.phase === "reaction");
      assert.ok(reaction, `${playerId}: reazione del difensore assente`);
      assert.equal(reaction.targetId, impact.targetId, `${playerId}: reazione mostrata sul combattente sbagliato`);
    }
  }
  if (damageClass === "magic") {
    assert.ok(playerPhases.includes("projectile"), `${playerId}: proiettile magico assente`);
    assert.ok(!playerPhases.includes("advance"), `${playerId}: magia trasformata in pattinata`);
    assert.ok(!playerPhases.includes("return"), `${playerId}: magia teletrasportata al centro prima del rientro`);
  }
  if (["status", "restore"].includes(damageClass)) {
    assert.ok(!playerPhases.includes("advance"), `${playerId}: azione da fermo trasformata in avanzata`);
    assert.ok(!playerPhases.includes("return"), `${playerId}: azione da fermo teletrasportata al centro`);
  }
}

function stateWithMoveAtLevel50(familiarId, moveId, seed) {
  const state = createFamiliarCombatState(seed);
  const base = createFamiliarCombatProgress(familiarId, state.seed);
  return restoreFamiliarCombatState({
    ...state,
    profiles: {
      [familiarId]: {
        ...base,
        combatLevel: 50,
        combatXp: totalCombatXpForLevel(50),
        wins: 50,
        unlockedDifficulties: ["normal", "expert", "nexus"],
        equippedMoveIds: [moveId],
      },
    },
  });
}

function actionRepresentatives() {
  const all = FAMILIAR_COMBAT_CATALOG.flatMap((familiar) => familiar.moves.map((move) => ({ familiar, move })));
  const representatives = {
    physical: all.find(({ move }) => move.damageClass === "physical"),
    magic: all.find(({ move }) => move.damageClass === "magic"),
    guard: all.find(({ move }) => move.damageClass === "status" && move.animation === "guard"),
    status: all.find(({ move }) => move.damageClass === "status" && move.animation !== "guard"),
    heal: all.find(({ move }) => move.damageClass === "restore"),
  };
  for (const [kind, representative] of Object.entries(representatives)) assert.ok(representative, `Classe ${kind} non rappresentata`);
  return representatives;
}

function exerciseAllActionClasses() {
  const representatives = actionRepresentatives();
  const verified = [];
  for (const [expectedKind, representative] of Object.entries(representatives)) {
    const { familiar, move } = representative;
    const opponent = FAMILIAR_COMBAT_CATALOG.find((candidate) => candidate.id !== familiar.id);
    let state = stateWithMoveAtLevel50(familiar.id, move.id, `action-${expectedKind}`);
    const started = startFamiliarCombatBattle(state, {
      playerId: familiar.id,
      opponentId: opponent.id,
      circuitId: FAMILIAR_COMBAT_CIRCUITS[0].id,
      difficulty: "normal",
      opponentLevel: 30,
      ignoreUnlocks: true,
    });
    assert.equal(started.ok, true, `${expectedKind}: avvio fallito`);
    state = started.state;
    const result = performFamiliarCombatTurn(state, move.id);
    assert.equal(result.ok, true, `${expectedKind}: turno fallito`);
    const playerEvents = result.timeline.filter((event) => event.moveId === move.id);
    assert.ok(playerEvents.some((event) => event.actionKind === expectedKind), `${expectedKind}: classe semantica errata`);
    const phases = playerEvents.map((event) => event.phase);
    if (expectedKind === "physical") {
      assert.ok(phases.includes("advance"));
      assert.ok(!phases.includes("projectile"));
    } else if (expectedKind === "magic") {
      assert.ok(phases.includes("projectile"));
      assert.ok(!phases.includes("advance"));
    } else if (expectedKind === "guard") {
      assert.ok(phases.includes("guard"));
      assert.ok(!phases.includes("advance") && !phases.includes("projectile"));
    } else if (expectedKind === "status") {
      assert.ok(phases.includes("status"));
      assert.ok(!phases.includes("advance"));
    } else if (expectedKind === "heal") {
      assert.ok(phases.includes("status"));
      assert.ok(playerEvents.some((event) => event.amount > 0));
      assert.ok(!phases.includes("advance") && !phases.includes("projectile"));
    }
    verified.push(expectedKind);
  }
  return verified;
}

function exercisePersistenceAndOneShotReward() {
  const player = FAMILIAR_COMBAT_CATALOG.find((entry) => entry.id === "cat");
  const opponent = FAMILIAR_COMBAT_CATALOG.find((entry) => entry.id === "bird");
  const moveId = player.initialMoveIds[0];
  let state = stateWithMoveAtLevel50(player.id, moveId, "reward-audit");
  let started = startFamiliarCombatBattle(state, {
    playerId: player.id,
    opponentId: opponent.id,
    circuitId: FAMILIAR_COMBAT_CIRCUITS[0].id,
    difficulty: "normal",
    opponentLevel: 1,
    ignoreUnlocks: true,
  });
  assert.equal(started.ok, true);
  state = {
    ...started.state,
    activeBattle: {
      ...started.state.activeBattle,
      opponent: { ...started.state.activeBattle.opponent, hp: 1 },
    },
  };
  const firstResult = performFamiliarCombatTurn(state, moveId);
  assert.equal(firstResult.ok, true);
  assert.equal(firstResult.state.activeBattle?.outcome, "victory");
  assert.ok(firstResult.state.pendingReward?.firstClear);

  const serialized = JSON.stringify(firstResult.state);
  const restored = restoreFamiliarCombatState(JSON.parse(serialized));
  const before = familiarCombatProgress(firstResult.state, player.id);
  const after = familiarCombatProgress(restored, player.id);
  assert.deepEqual(after.learnedSchedule, before.learnedSchedule, "restore ha cambiato il calendario mosse");
  assert.deepEqual(after.equippedMoveIds, before.equippedMoveIds, "restore ha cambiato le mosse equipaggiate");
  assert.deepEqual(after.completedEncounters, before.completedEncounters, "restore ha perso gli incontri conclusi");
  assert.equal(restored.activeBattle?.outcome, "victory");
  assert.deepEqual(restored.pendingReward, firstResult.state.pendingReward);

  const claimed = claimFamiliarCombatReward(restored);
  assert.equal(claimed.ok, true);
  assert.equal(claimFamiliarCombatReward(claimed.state).ok, false, "premio riscattabile due volte");
  state = closeFamiliarCombatBattle(claimed.state);
  started = startFamiliarCombatBattle(state, {
    playerId: player.id,
    opponentId: opponent.id,
    circuitId: FAMILIAR_COMBAT_CIRCUITS[0].id,
    difficulty: "normal",
    opponentLevel: 1,
    ignoreUnlocks: true,
  });
  assert.equal(started.ok, true);
  state = {
    ...started.state,
    activeBattle: {
      ...started.state.activeBattle,
      opponent: { ...started.state.activeBattle.opponent, hp: 1 },
    },
  };
  const repeat = performFamiliarCombatTurn(state, moveId);
  assert.equal(repeat.ok, true);
  assert.equal(repeat.state.activeBattle?.outcome, "victory");
  assert.equal(repeat.state.pendingReward, null, "premio first-clear duplicato nella rivincita");
  const thresholdBase = createFamiliarCombatProgress(player.id, "difficulty-audit");
  assert.equal(combatDifficultyIsUnlocked({ ...thresholdBase, wins: 7 }, "expert"), false);
  assert.equal(combatDifficultyIsUnlocked({ ...thresholdBase, wins: 8 }, "expert"), true);
  assert.equal(combatDifficultyIsUnlocked({ ...thresholdBase, wins: 23 }, "nexus"), false);
  assert.equal(combatDifficultyIsUnlocked({ ...thresholdBase, wins: 24 }, "nexus"), true);
  const thresholdRestored = restoreFamiliarCombatState({
    ...createFamiliarCombatState("difficulty-audit"),
    profiles: { [player.id]: { ...thresholdBase, wins: 24, unlockedDifficulties: ["normal"] } },
  });
  assert.deepEqual(familiarCombatProgress(thresholdRestored, player.id).unlockedDifficulties, ["normal", "expert", "nexus"]);
  return { restoreStable: true, rewardClaimedOnce: true, difficultyThresholdStable: true };
}

export function runFamiliarCombatRosterAudit() {
  assert.equal(FAMILIAR_COMBAT_CATALOG.length, EXPECTED_FAMILIARS);
  assert.equal(FAMILIAR_COMBAT_CIRCUITS.length, 6);
  assert.equal(FAMILIAR_COMBAT_DIFFICULTIES.length, 3);
  const circuitCounts = Object.fromEntries(FAMILIAR_COMBAT_CIRCUITS.map((circuit) => [circuit.id, 0]));
  const difficultyCounts = Object.fromEntries(FAMILIAR_COMBAT_DIFFICULTIES.map((difficulty) => [difficulty.id, 0]));
  let directionalMatchups = 0;
  let turns = 0;
  let timelineEvents = 0;
  let opponentPreviews = 0;
  let maxOpponentLoadout = 0;
  let opponentLoadoutsChecked = 0;

  for (let playerIndex = 0; playerIndex < FAMILIAR_COMBAT_CATALOG.length; playerIndex += 1) {
    const player = FAMILIAR_COMBAT_CATALOG[playerIndex];
    const campaignRoster = new Set(FAMILIAR_COMBAT_CIRCUITS.flatMap((circuit) => familiarCombatOpponents(player.id, circuit.id)));
    assert.equal(campaignRoster.size, EXPECTED_FAMILIARS - 1, `${player.id}: i sei circuiti non coprono tutti gli avversari`);
    assert.ok(!campaignRoster.has(player.id), `${player.id}: presente come proprio avversario nei circuiti`);
    const selfMatch = startFamiliarCombatBattle(createFamiliarCombatState(`self-${player.id}`), {
      playerId: player.id,
      opponentId: player.id,
      circuitId: FAMILIAR_COMBAT_CIRCUITS[0].id,
      ignoreUnlocks: true,
    });
    assert.equal(selfMatch.ok, false, `${player.id}: self-match accettato`);

    const opponents = FAMILIAR_COMBAT_CATALOG.filter((candidate) => candidate.id !== player.id);
    assert.equal(opponents.length, EXPECTED_FAMILIARS - 1);
    for (let opponentIndex = 0; opponentIndex < opponents.length; opponentIndex += 1) {
      const opponent = opponents[opponentIndex];
      const matrixIndex = playerIndex * opponents.length + opponentIndex;
      const circuit = FAMILIAR_COMBAT_CIRCUITS[matrixIndex % FAMILIAR_COMBAT_CIRCUITS.length];
      const difficulty = FAMILIAR_COMBAT_DIFFICULTIES[Math.floor(matrixIndex / FAMILIAR_COMBAT_CIRCUITS.length) % FAMILIAR_COMBAT_DIFFICULTIES.length];
      let state = createFamiliarCombatState(`matrix-${player.id}-${opponent.id}`);
      const preview = familiarCombatOpponentPreview({
        playerId: player.id,
        opponentId: opponent.id,
        circuitId: circuit.id,
        difficulty: difficulty.id,
        opponentLevel: 1,
      });
      assert.ok(preview, `${player.id} vs ${opponent.id}: anteprima avversario assente`);
      assert.ok(preview.moveIds.length >= 1 && preview.moveIds.length <= 4, `${player.id} vs ${opponent.id}: loadout IA fuori limite`);
      assert.equal(preview.moveIds.length + preview.archivedMoveIds.length, preview.learnedMoveIds.length, `${player.id} vs ${opponent.id}: archivio IA incompleto`);
      const started = startFamiliarCombatBattle(state, {
        playerId: player.id,
        opponentId: opponent.id,
        circuitId: circuit.id,
        difficulty: difficulty.id,
        opponentLevel: 1,
        ignoreUnlocks: true,
      });
      assert.equal(started.ok, true, `${player.id} vs ${opponent.id}: ${started.error ?? "avvio fallito"}`);
      state = started.state;
      assert.deepEqual(state.activeBattle.opponent, preview.actor, `${player.id} vs ${opponent.id}: anteprima e attore reale divergono`);
      assert.notEqual(state.activeBattle.player.familiarId, state.activeBattle.opponent.familiarId);
      assertActorIsBounded(state.activeBattle.player, `${player.id} giocatore`);
      assertActorIsBounded(state.activeBattle.opponent, `${opponent.id} avversario`);
      const moveId = familiarCombatProgress(state, player.id).equippedMoveIds[0];
      const move = player.moves.find((candidate) => candidate.id === moveId);
      assert.ok(move, `${player.id}: mossa iniziale assente`);
      const result = performFamiliarCombatTurn(state, moveId);
      assert.equal(result.ok, true, `${player.id} vs ${opponent.id}: turno non valido`);
      assert.ok(preview.moveIds.includes(result.opponentMoveId), `${player.id} vs ${opponent.id}: IA ha usato una mossa fuori loadout`);
      assertTimelineIsValid(result.timeline, player.id, opponent.id, moveId, move.damageClass);
      assertActorIsBounded(result.state.activeBattle.player, `${player.id} dopo turno`);
      assertActorIsBounded(result.state.activeBattle.opponent, `${opponent.id} dopo turno`);
      directionalMatchups += 1;
      turns += 1;
      timelineEvents += result.timeline.length;
      opponentPreviews += 1;
      opponentLoadoutsChecked += 1;
      maxOpponentLoadout = Math.max(maxOpponentLoadout, preview.moveIds.length);
      circuitCounts[circuit.id] += 1;
      difficultyCounts[difficulty.id] += 1;
    }
  }

  assert.equal(directionalMatchups, EXPECTED_DIRECTIONAL_MATCHUPS);
  assert.ok(Object.values(circuitCounts).every((count) => count > 0), "un circuito non è stato esercitato");
  assert.ok(Object.values(difficultyCounts).every((count) => count > 0), "una difficoltà non è stata esercitata");
  for (const opponent of FAMILIAR_COMBAT_CATALOG) {
    const playerId = opponent.id === "cat" ? "bird" : "cat";
    const preview = familiarCombatOpponentPreview({
      playerId,
      opponentId: opponent.id,
      circuitId: FAMILIAR_COMBAT_CIRCUITS.at(-1).id,
      difficulty: "nexus",
      opponentLevel: 50,
    });
    assert.ok(preview, `${opponent.id}: anteprima loadout finale assente`);
    assert.equal(preview.moveIds.length, 4, `${opponent.id}: loadout finale non contiene quattro mosse`);
    assert.equal(preview.learnedMoveIds.length, opponent.moves.length, `${opponent.id}: archivio finale incompleto`);
    assert.equal(preview.moveIds.length + preview.archivedMoveIds.length, preview.learnedMoveIds.length);
    opponentLoadoutsChecked += 1;
    maxOpponentLoadout = Math.max(maxOpponentLoadout, preview.moveIds.length);
  }
  const actionClasses = exerciseAllActionClasses();
  const persistence = exercisePersistenceAndOneShotReward();
  return {
    familiars: FAMILIAR_COMBAT_CATALOG.length,
    directionalMatchups,
    turns,
    timelineEvents,
    opponentPreviews,
    maxOpponentLoadout,
    opponentLoadoutsChecked,
    selfMatchesRejected: FAMILIAR_COMBAT_CATALOG.length,
    circuits: circuitCounts,
    difficulties: difficultyCounts,
    actionClasses,
    ...persistence,
  };
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  const startedAt = performance.now();
  const summary = runFamiliarCombatRosterAudit();
  console.log(JSON.stringify({ ...summary, durationMs: Math.round((performance.now() - startedAt) * 10) / 10 }, null, 2));
}
