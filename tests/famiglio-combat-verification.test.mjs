// Battaglie verificate dal server: exploit simulati contro il replay autorevole.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import {
  familiarCombatOpponents,
  familiarCombatProgress,
  performFamiliarCombatTurn,
  restoreFamiliarCombatState,
  retreatFromFamiliarCombat,
  startFamiliarCombatBattle,
  switchFamiliarCombatant,
  totalCombatXpForLevel,
} from "../lib/famiglioCombat.ts";
import { FAMILIAR_COMBAT_CAMPAIGN } from "../lib/famiglioCombatCampaign.ts";
import {
  adoptServerCombatProgress,
  createFamiliarCombatJournal,
  familiarCombatReplayFromJournal,
  familiarCombatStartPlan,
  recordFamiliarCombatAction,
  replayFamiliarCombatBattle,
} from "../lib/famiglioCombatVerification.ts";
import {
  restoreFamiglioCombatLedger,
  submitFamiglioCombatReport,
  verifyFamiglioCombatReport,
} from "../lib/famiglioCombatServer.ts";
import { preserveServerOwnedCombat, sanitizeFamiglioRebuildCloudSave } from "../lib/famiglioRebuildCloud.ts";

const SEED = 424242;

function combatAtLevel(levels, extra = {}) {
  return JSON.parse(JSON.stringify(restoreFamiliarCombatState({
    seed: SEED,
    profiles: Object.fromEntries(Object.entries(levels).map(([id, level]) => [id, { combatXp: totalCombatXpForLevel(level), ...(extra[id] ?? {}) }])),
  })));
}

function house(combat, coins = 100) {
  return {
    rebuild: { stage: "home", selectedId: "cat", unlockedIds: ["cat", "rabbit", "bird"], familiarName: "Luna" },
    home: { needs: {}, inventory: {}, wallet: { nexusCoins: coins, totalEarned: coins, nightSigils: 0, relicFragments: 0, nightRewards: [], equippedNightRelicId: null } },
    adventure: {},
    combat,
    activeFamiliarId: "cat",
  };
}

function saveWith(combat, coins = 100) {
  const checked = sanitizeFamiglioRebuildCloudSave({ schemaVersion: 1, activeHouseIndex: 0, houses: [house(combat, coins), null, null], updatedAt: new Date().toISOString() });
  assert.equal(checked.ok, true);
  return checked.save;
}

const request = (overrides = {}) => ({
  mode: "duel", playerId: "cat", teamIds: ["cat"], circuitId: "prime-orme", difficulty: "normal",
  opponentId: "bird", campaignId: null, tower: null, needTier: "stabile", ...overrides,
});

function strongestUsableMove(state) {
  const battle = state.activeBattle;
  const moves = familiarCombatProgress(state, battle.player.familiarId).equippedMoveIds;
  for (const moveId of [...moves].reverse()) if (performFamiliarCombatTurn(state, moveId).ok) return { type: "move", moveId };
  throw new Error("nessuna mossa disponibile");
}

/** Gioca come il client: opzioni dal piano condiviso, diario delle azioni, replay finale. */
function playOnClient(combat, battleRequest, chooseAction = strongestUsableMove, { maxActions = 300 } = {}) {
  const clientState = restoreFamiliarCombatState(combat);
  const planned = familiarCombatStartPlan(clientState, battleRequest);
  assert.equal(planned.ok, true, planned.error);
  const started = startFamiliarCombatBattle(clientState, planned.plan.options);
  assert.equal(started.ok, true, started.error);
  let state = started.state;
  let journal = createFamiliarCombatJournal(state, battleRequest);
  for (let count = 0; state.activeBattle.outcome === "active" && count < maxActions; count += 1) {
    const before = state.activeBattle;
    const action = chooseAction(state);
    let next;
    if (action.type === "retreat") next = retreatFromFamiliarCombat(state);
    else {
      const result = action.type === "move" ? performFamiliarCombatTurn(state, action.moveId) : switchFamiliarCombatant(state, action.familiarId);
      assert.equal(result.ok, true, result.error);
      next = result.state;
    }
    journal = recordFamiliarCombatAction(journal, before, action, next.activeBattle);
    state = next;
  }
  return { state, replay: familiarCombatReplayFromJournal(journal) };
}

const context = { ownedFamiliarIds: null };

test("una vittoria legittima viene verificata e accreditata esattamente una volta", () => {
  const combat = combatAtLevel({ cat: 15 });
  const save = saveWith(combat, 100);
  const client = playOnClient(combat, request());
  assert.equal(client.state.activeBattle.outcome, "victory");
  const localReward = client.state.pendingReward;
  assert.ok(localReward, "primo completamento");

  const first = verifyFamiglioCombatReport(save, 0, client.replay, context);
  assert.equal(first.status, "verified", first.error);
  assert.equal(first.result.outcome, "victory");
  assert.deepEqual(first.result.reward, localReward, "stesso premio del motore locale");
  const storedHouse = first.save.houses[0];
  assert.equal(storedHouse.home.wallet.nexusCoins, 100 + localReward.nexusCoins);
  const progress = familiarCombatProgress(restoreFamiliarCombatState(storedHouse.combat), "cat");
  const local = familiarCombatProgress(client.state, "cat");
  assert.equal(progress.wins, local.wins);
  assert.equal(progress.combatXp, local.combatXp);
  assert.ok(progress.claimedRewardKeys.includes(localReward.key));
  assert.equal(storedHouse.combat.activeBattle, null);
  assert.equal(restoreFamiglioCombatLedger(storedHouse.combatLedger).battles[0].battleId, client.replay.battleId);

  // Stesso replay inviato di nuovo: idempotente, nessun secondo accredito.
  const again = verifyFamiglioCombatReport(first.save, 0, client.replay, context);
  assert.equal(again.status, "duplicate");
  assert.deepEqual(again.result, first.result);

  // Una seconda vittoria sullo stesso incontro vale XP ma non un nuovo premio.
  const rematch = playOnClient(storedHouse.combat, request());
  const second = verifyFamiglioCombatReport(first.save, 0, rematch.replay, context);
  assert.equal(second.status, "verified");
  assert.equal(second.result.reward, null);
  assert.equal(second.save.houses[0].home.wallet.nexusCoins, 100 + localReward.nexusCoins);
});

test("vittoria contraffatta: l'esito lo decide il replay del server, non il client", () => {
  const combat = combatAtLevel({ cat: 1 });
  const strongest = familiarCombatOpponents("cat", "prime-orme").at(-1);
  const client = playOnClient(combat, request({ opponentId: strongest }));
  assert.equal(client.state.activeBattle.outcome, "defeat");
  // Il resoconto dichiara vittoria e premio: campi ignorati dal server.
  const forged = { ...client.replay, outcome: "victory", reward: { nexusCoins: 99999 }, localOutcome: "victory" };
  const verified = verifyFamiglioCombatReport(saveWith(combat), 0, forged, context);
  assert.equal(verified.status, "verified");
  assert.equal(verified.result.outcome, "defeat");
  assert.equal(verified.result.reward, null);
  assert.equal(verified.save.houses[0].home.wallet.nexusCoins, 100);
  const progress = familiarCombatProgress(restoreFamiliarCombatState(verified.save.houses[0].combat), "cat");
  assert.equal(progress.wins, 0);
  assert.equal(progress.losses, 1);

  // Una battaglia interrotta prima della fine non può diventare una vittoria.
  const truncated = { ...client.replay, actions: client.replay.actions.slice(0, 1) };
  const incomplete = verifyFamiglioCombatReport(saveWith(combat), 0, truncated, context);
  assert.equal(incomplete.status, "rejected");
  assert.equal(incomplete.code, "incomplete");
});

test("premi contraffatti nel PUT: progressi, incontri e premi riscattati restano quelli del server", () => {
  const combat = combatAtLevel({ cat: 3 });
  const current = saveWith(combat);
  const forgedCombat = JSON.parse(JSON.stringify(combat));
  Object.assign(forgedCombat.profiles.cat, {
    combatXp: totalCombatXpForLevel(50), combatLevel: 50, wins: 999, losses: 0, battlesCompleted: 999,
    completedEncounters: FAMILIAR_COMBAT_CAMPAIGN.map((level) => level.id), claimedRewardKeys: ["prime-orme:normal:bird"],
    unlockedDifficulties: ["normal", "expert", "nexus"],
  });
  forgedCombat.profiles.golden = { combatXp: totalCombatXpForLevel(40), wins: 50 };
  forgedCombat.pendingReward = { key: "prime-orme:normal:bird", familiarId: "cat", nexusCoins: 5000 };
  forgedCombat.seed = 1;
  const incoming = saveWith(forgedCombat);
  incoming.houses[0].combatLedger = { battles: [], totals: { nexusCoins: 999999 } };
  const preserved = preserveServerOwnedCombat(incoming, current);
  const stored = restoreFamiliarCombatState(preserved.houses[0].combat);
  const cat = familiarCombatProgress(stored, "cat");
  const serverCat = familiarCombatProgress(restoreFamiliarCombatState(combat), "cat");
  assert.equal(cat.combatLevel, serverCat.combatLevel);
  assert.equal(cat.combatXp, serverCat.combatXp);
  assert.equal(cat.wins, 0);
  assert.deepEqual(cat.completedEncounters, []);
  assert.deepEqual(cat.claimedRewardKeys, []);
  assert.equal(familiarCombatProgress(stored, "golden").combatLevel, 1, "un Famiglio nuovo parte da zero");
  assert.equal(stored.pendingReward, null);
  assert.equal(stored.seed, restoreFamiliarCombatState(combat).seed);
  assert.equal(preserved.houses[0].combatLedger, undefined, "il registro non si scrive dal client");

  // Le mosse equipaggiate restano del client, se già apprese.
  const loadout = [...serverCat.learnedMoveIds].reverse().slice(0, 4);
  if (!loadout.includes(serverCat.learnedMoveIds[0])) loadout[3] = serverCat.learnedMoveIds[0];
  const withLoadout = JSON.parse(JSON.stringify(combat));
  withLoadout.profiles.cat.equippedMoveIds = loadout;
  const kept = restoreFamiliarCombatState(preserveServerOwnedCombat(saveWith(withLoadout), current).houses[0].combat);
  assert.deepEqual([...familiarCombatProgress(kept, "cat").equippedMoveIds].sort(), [...new Set(loadout)].sort());

  // Primo salvataggio dell'account: nessun progresso di combattimento dichiarato dal client.
  const first = restoreFamiliarCombatState(preserveServerOwnedCombat(incoming, null).houses[0].combat);
  assert.equal(familiarCombatProgress(first, "cat").combatLevel, 1);
  assert.equal(familiarCombatProgress(first, "cat").wins, 0);
});

test("lo stesso replay non viene mai pagato due volte, nemmeno dopo aver svuotato la Casa (D1)", async () => {
  const database = fakeD1();
  const combat = combatAtLevel({ cat: 15 });
  database.seedSave("user-1", saveWith(combat, 100), 1);
  const client = playOnClient(combat, request());

  const first = await submitFamiglioCombatReport(database, "user-1", 0, client.replay, []);
  assert.equal(first.status, "verified");
  assert.ok(first.result.reward);
  assert.equal(first.revision, 2);
  const again = await submitFamiglioCombatReport(database, "user-1", 0, client.replay, []);
  assert.equal(again.status, "duplicate");
  assert.equal(database.readSave("user-1").save.houses[0].home.wallet.nexusCoins, 100 + first.result.reward.nexusCoins);
  assert.equal(database.ledgerRows("user-1").length, 1);
  assert.equal(database.readSave("user-1").revision, 2);

  // Il client svuota la Casa e la ricrea con progressi azzerati: la vittoria è di
  // nuovo un primo completamento per il motore, ma il premio è già stato pagato.
  const reset = saveWith(combatAtLevel({ cat: 15 }), 0);
  database.seedSave("user-1", reset, 5);
  const replayed = await submitFamiglioCombatReport(database, "user-1", 0, client.replay, []);
  assert.equal(replayed.status, "verified");
  assert.equal(replayed.result.reward, null);
  assert.equal(replayed.result.rewardAlreadyPaid, true);
  assert.equal(database.readSave("user-1").save.houses[0].home.wallet.nexusCoins, 0);
});

test("una scrittura concorrente fa riverificare senza doppio accredito (D1)", async () => {
  const database = fakeD1();
  const combat = combatAtLevel({ cat: 15 });
  database.seedSave("user-2", saveWith(combat, 10), 3);
  database.bumpBeforeNextUpdate("user-2");
  const client = playOnClient(combat, request());
  const result = await submitFamiglioCombatReport(database, "user-2", 0, client.replay, []);
  assert.equal(result.status, "verified");
  assert.equal(result.revision, 5, "revisione riletta dopo il conflitto");
  assert.equal(database.ledgerRows("user-2").length, 1);
  assert.equal(database.readSave("user-2").save.houses[0].home.wallet.nexusCoins, 10 + result.result.reward.nexusCoins);
});

test("azioni manomesse vengono rifiutate", () => {
  const combat = combatAtLevel({ cat: 15 });
  const save = saveWith(combat);
  const client = playOnClient(combat, request());
  const unlearned = { ...client.replay, actions: [{ type: "move", moveId: "ancient-black-dragon-void-breath" }, ...client.replay.actions] };
  const verdict = verifyFamiglioCombatReport(save, 0, unlearned, context);
  assert.equal(verdict.status, "rejected");
  assert.ok(["illegal-action", "invalid"].includes(verdict.code));
  const extra = { ...client.replay, actions: [...client.replay.actions, client.replay.actions[0]] };
  assert.equal(verifyFamiglioCombatReport(save, 0, extra, context).code, "illegal-action", "azioni dopo la fine");
  const badSwitch = { ...client.replay, actions: [{ type: "switch", familiarId: "rabbit" }, ...client.replay.actions] };
  assert.equal(verifyFamiglioCombatReport(save, 0, badSwitch, context).code, "illegal-action", "rotazione in un duello");
  const retreatInMiddle = { ...client.replay, actions: [{ type: "retreat" }, ...client.replay.actions] };
  assert.equal(verifyFamiglioCombatReport(save, 0, retreatInMiddle, context).code, "invalid");
  assert.equal(verifyFamiglioCombatReport(save, 0, { ...client.replay, actions: "tutto vinto" }, context).code, "invalid");
});

test("statistiche, livelli e squadra manomessi non passano", () => {
  const serverCombat = combatAtLevel({ cat: 1 });
  const save = saveWith(serverCombat);
  // Il client ha alzato da sé il livello: le mosse che usa non sono apprese sul server.
  const forgedClient = combatAtLevel({ cat: 30 });
  const client = playOnClient(forgedClient, request({ opponentId: familiarCombatOpponents("cat", "prime-orme").at(-1) }));
  assert.equal(client.state.activeBattle.outcome, "victory");
  const verdict = verifyFamiglioCombatReport(save, 0, client.replay, context);
  assert.ok(verdict.status === "rejected" || verdict.result.outcome !== "victory", "il livello contraffatto non vince sul server");
  if (verdict.status === "rejected") assert.ok(["loadout", "illegal-action"].includes(verdict.code), verdict.code);

  // Statistiche e opzioni del motore inviate dal client vengono ignorate.
  const legit = playOnClient(serverCombat, request());
  const withStats = { ...legit.replay, request: { ...legit.replay.request, opponentLevel: 1, playerStatBonus: { attack: 400 }, ignoreUnlocks: true, needTier: "stabile" } };
  const stats = verifyFamiglioCombatReport(save, 0, withStats, context);
  assert.equal(stats.status, "verified");
  assert.equal(stats.result.outcome, legit.state.activeBattle.outcome);

  // Squadra con un Famiglio non posseduto dall'account.
  const team = { ...legit.replay, request: { ...legit.replay.request, mode: "team", teamIds: ["cat", "ancient-black-dragon"] } };
  const owned = verifyFamiglioCombatReport(save, 0, team, { ownedFamiliarIds: new Set(["cat", "rabbit", "bird"]) });
  assert.equal(owned.status, "rejected");
  assert.equal(owned.code, "team");

  // Mosse equipaggiate non ancora apprese.
  const loadout = { ...legit.replay, loadouts: { cat: ["ancient-black-dragon-void-breath"] } };
  assert.equal(verifyFamiglioCombatReport(save, 0, loadout, context).code, "loadout");

  // Circuito o capitolo non ancora sbloccati sul server.
  const locked = playOnClient(combatAtLevel({ cat: 35 }, { cat: { wins: 40 } }), request({ circuitId: "valle-titani", opponentId: familiarCombatOpponents("cat", "valle-titani")[0] }));
  assert.equal(verifyFamiglioCombatReport(save, 0, locked.replay, context).status, "rejected");
  const chapter = playOnClient(combatAtLevel({ cat: 30 }, { cat: { completedEncounters: FAMILIAR_COMBAT_CAMPAIGN.map((level) => level.id) } }), request({ mode: "campaign", campaignId: "campaign-05", circuitId: "", opponentId: "" }));
  const lockedChapter = verifyFamiglioCombatReport(save, 0, chapter.replay, context);
  assert.equal(lockedChapter.status, "rejected");
  assert.equal(lockedChapter.code, "locked");

  // Torre generata sopra il livello registrato.
  const tower = request({ mode: "tower", tower: { seed: "x", level: 40, floor: 1 }, circuitId: "", opponentId: "" });
  assert.equal(replayFamiliarCombatBattle(serverCombat, { version: 1, battleId: "battle-x-1", request: tower, loadouts: {}, actions: [] }).code, "invalid");
});

test("seme o contatore disallineati: la battaglia non corrisponde e viene rifiutata", () => {
  const server = combatAtLevel({ cat: 15 });
  const otherSeed = { ...server, seed: SEED + 1 };
  const desynced = playOnClient(otherSeed, request());
  const verdict = verifyFamiglioCombatReport(saveWith(server), 0, desynced.replay, context);
  assert.equal(verdict.status, "rejected");
  assert.equal(verdict.code, "desync");
  assert.ok(verdict.combat, "il server restituisce i progressi autorevoli da riadottare");

  const ahead = combatAtLevel({ cat: 15 }, { cat: { battlesCompleted: 7 } });
  const aheadReplay = playOnClient(ahead, request()).replay;
  assert.equal(verifyFamiglioCombatReport(saveWith(server), 0, aheadReplay, context).code, "desync");
  const forgedId = { ...playOnClient(server, request()).replay, battleId: "battle-deadbeef-1" };
  assert.equal(verifyFamiglioCombatReport(saveWith(server), 0, forgedId, context).code, "desync");
});

test("la ritirata verificata è neutra: nessuna sconfitta, nessun premio", () => {
  const combat = combatAtLevel({ cat: 15 });
  let moved = false;
  const client = playOnClient(combat, request(), (state) => {
    if (moved) return { type: "retreat" };
    moved = true;
    return strongestUsableMove(state);
  });
  assert.equal(client.state.activeBattle.outcome, "retreat");
  const verdict = verifyFamiglioCombatReport(saveWith(combat), 0, client.replay, context);
  assert.equal(verdict.status, "verified");
  assert.equal(verdict.result.outcome, "retreat");
  assert.equal(verdict.result.reward, null);
  const progress = familiarCombatProgress(restoreFamiliarCombatState(verdict.save.houses[0].combat), "cat");
  assert.equal(progress.losses, 0);
  assert.equal(progress.wins, 0);
  assert.equal(restoreFamiglioCombatLedger(verdict.save.houses[0].combatLedger).totals.retreats, 1);
});

test("i piani della Torre si verificano in ordine e la Campagna si sblocca solo con vittorie verificate", () => {
  const combat = combatAtLevel({ cat: 12 });
  const towerRequest = (floor) => request({ mode: "tower", tower: { seed: "torre-test", level: 12, floor }, circuitId: "", opponentId: "" });
  const skipped = playOnClient(combat, towerRequest(2));
  const skip = verifyFamiglioCombatReport(saveWith(combat), 0, skipped.replay, context);
  assert.equal(skip.status, "rejected");
  assert.equal(skip.code, "tower-order");

  const floorOne = playOnClient(combat, towerRequest(1));
  const first = verifyFamiglioCombatReport(saveWith(combat), 0, floorOne.replay, context);
  assert.equal(first.status, "verified");
  if (first.result.outcome === "victory") {
    const next = playOnClient(first.save.houses[0].combat, towerRequest(2));
    assert.equal(verifyFamiglioCombatReport(first.save, 0, next.replay, context).status, "verified");
  }

  const chapterOne = playOnClient(combat, request({ mode: "campaign", campaignId: "campaign-01", circuitId: "", opponentId: "" }));
  const campaign = verifyFamiglioCombatReport(saveWith(combat), 0, chapterOne.replay, context);
  assert.equal(campaign.status, "verified");
  const completed = familiarCombatProgress(restoreFamiliarCombatState(campaign.save.houses[0].combat), "cat").completedEncounters.includes("campaign-01");
  assert.equal(completed, campaign.result.outcome === "victory");
});

test("il client riallinea i progressi al server e il diario resiste ai salvataggi più vecchi", () => {
  const server = restoreFamiliarCombatState(combatAtLevel({ cat: 10 }));
  const local = restoreFamiliarCombatState(combatAtLevel({ cat: 30 }));
  const adopted = adoptServerCombatProgress(local, server);
  assert.equal(familiarCombatProgress(adopted, "cat").combatLevel, 10);

  const combat = combatAtLevel({ cat: 15 });
  const state = startFamiliarCombatBattle(restoreFamiliarCombatState(combat), familiarCombatStartPlan(restoreFamiliarCombatState(combat), request()).plan.options).state;
  let journal = createFamiliarCombatJournal(state, request());
  const firstAction = strongestUsableMove(state);
  const afterFirst = performFamiliarCombatTurn(state, firstAction.moveId).state;
  journal = recordFamiliarCombatAction(journal, state.activeBattle, firstAction, afterFirst.activeBattle);
  // Lo stato torna indietro (salvataggio cloud più vecchio): il diario si tronca.
  const again = performFamiliarCombatTurn(state, firstAction.moveId).state;
  journal = recordFamiliarCombatAction(journal, state.activeBattle, firstAction, again.activeBattle);
  assert.equal(journal.actions.length, 1);
  assert.equal(journal.broken, false);
  // Uno stato sconosciuto rende il diario non ricostruibile invece di inviarne uno falso.
  const foreign = { ...afterFirst.activeBattle, turn: 99 };
  assert.equal(recordFamiliarCombatAction(journal, foreign, firstAction, foreign).broken, true);
});

test("battaglie legittime casuali (duello, 3 contro 3, Torre, Campagna) vengono sempre verificate con lo stesso esito", () => {
  let seed = 97;
  const random = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const team = ["cat", "rabbit", "bird"];
  const modes = [
    () => request({ opponentId: familiarCombatOpponents("cat", "prime-orme")[Math.floor(random() * 5)] }),
    () => request({ mode: "team", teamIds: team, opponentId: familiarCombatOpponents("cat", "prime-orme")[Math.floor(random() * 5)] }),
    () => request({ mode: "tower", tower: { seed: `fuzz-${Math.floor(random() * 1000)}`, level: 10, floor: 1 }, circuitId: "", opponentId: "", teamIds: team }),
    () => request({ mode: "campaign", campaignId: FAMILIAR_COMBAT_CAMPAIGN[Math.floor(random() * 4)].id, circuitId: "", opponentId: "", teamIds: team }),
  ];
  const chooser = (state) => {
    const battle = state.activeBattle;
    if (random() < .01) return { type: "retreat" };
    const bench = battle.playerBench.find((member) => member.hp > 0);
    if (bench && random() < .2 && switchFamiliarCombatant(state, bench.familiarId).ok) return { type: "switch", familiarId: bench.familiarId };
    const moves = familiarCombatProgress(state, battle.player.familiarId).equippedMoveIds.filter((moveId) => performFamiliarCombatTurn(state, moveId).ok);
    return { type: "move", moveId: moves[Math.floor(random() * moves.length)] };
  };
  const counts = { victory: 0, defeat: 0, retreat: 0 };
  for (let index = 0; index < 60; index += 1) {
    const levels = { cat: 10 + Math.floor(random() * 6), rabbit: 8, bird: 9 };
    const completed = FAMILIAR_COMBAT_CAMPAIGN.slice(0, 3).map((level) => level.id);
    const combat = combatAtLevel(levels, { cat: { completedEncounters: completed, battlesCompleted: index } });
    const battleRequest = modes[index % modes.length]();
    const client = playOnClient(combat, battleRequest, chooser);
    const verdict = verifyFamiglioCombatReport(saveWith(combat), 0, client.replay, context);
    assert.equal(verdict.status, "verified", `${battleRequest.mode}: ${verdict.error}`);
    assert.equal(verdict.result.outcome, client.state.activeBattle.outcome, battleRequest.mode);
    assert.deepEqual(verdict.result.reward, client.state.pendingReward ?? null);
    const server = restoreFamiliarCombatState(verdict.save.houses[0].combat);
    for (const id of client.state.activeBattle.teamFamiliarIds) {
      const local = familiarCombatProgress(client.state, id);
      const remote = familiarCombatProgress(server, id);
      for (const field of ["combatXp", "combatLevel", "wins", "losses", "battlesCompleted"]) assert.equal(remote[field], local[field], `${battleRequest.mode} ${id}.${field}`);
      assert.deepEqual(remote.completedEncounters, local.completedEncounters);
    }
    counts[verdict.result.outcome] += 1;
  }
  assert.ok(counts.victory > 0 && counts.defeat + counts.retreat > 0, JSON.stringify(counts));
});

test("rotta, PUT e interfaccia usano la verifica del server", async () => {
  const route = await readFile(new URL("../app/api/famiglio/rebuild/combat/route.ts", import.meta.url), "utf8");
  assert.match(route, /isFamiglioRequestOriginAllowed\(request\)/);
  assert.match(route, /readBoundedJson\(request, FAMILIAR_COMBAT_REPLAY_MAX_BYTES\)/);
  assert.match(route, /getFamiglioUser\(\)/);
  assert.match(route, /saveLocalGameData/);
  assert.doesNotMatch(route, /updateUser/);
  const put = await readFile(new URL("../app/api/famiglio/rebuild/route.ts", import.meta.url), "utf8");
  assert.equal(put.match(/preserveServerOwnedCombat\(preserveServerOwnedAttendance/g)?.length, 2);
  const arena = await readFile(new URL("../components/FamiglioCombatArena.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(arena, /onReward\(/, "l'Arena non accredita più premi da sola");
  assert.match(arena, /recordBattleAction\(currentBattle, \{ type: "move", moveId \}/);
  assert.match(arena, /familiarCombatStartPlan\(baseState, request/);
  const nexus = await readFile(new URL("../components/FamiglioNexusRebuild.tsx", import.meta.url), "utf8");
  assert.match(nexus, /fetch\("\/api\/famiglio\/rebuild\/combat"/);
  assert.match(nexus, /status: "offline"/);
  assert.match(nexus, /writeFamiglioCombatReports/);
});

// ------------------------------------------------------------ D1 finto su node:sqlite

function fakeD1() {
  const db = new DatabaseSync(":memory:");
  db.exec(`CREATE TABLE nexus_pet_rebuild_saves (customer_id TEXT PRIMARY KEY, save_json TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
  const pendingBumps = new Set();
  const statement = (sql) => {
    let params = [];
    const execute = () => {
      if (/^\s*UPDATE nexus_pet_rebuild_saves/.test(sql)) {
        const customer = params[2];
        if (pendingBumps.delete(customer)) db.prepare("UPDATE nexus_pet_rebuild_saves SET revision = revision + 1 WHERE customer_id = ?").run(customer);
      }
      const result = db.prepare(sql).run(...params);
      return { success: true, meta: { changes: Number(result.changes) } };
    };
    const api = {
      bind(...values) { params = values; return api; },
      async first() { return db.prepare(sql).get(...params) ?? null; },
      async all() { return { results: db.prepare(sql).all(...params) }; },
      async run() { return execute(); },
      execute,
    };
    return api;
  };
  return {
    prepare: statement,
    async batch(statements) {
      db.exec("BEGIN");
      try {
        const results = statements.map((entry) => entry.execute());
        db.exec("COMMIT");
        return results;
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    },
    seedSave(customer, save, revision) {
      db.prepare(`INSERT INTO nexus_pet_rebuild_saves (customer_id, save_json, revision) VALUES (?, ?, ?)
        ON CONFLICT(customer_id) DO UPDATE SET save_json = excluded.save_json, revision = excluded.revision`).run(customer, JSON.stringify(save), revision);
    },
    readSave(customer) {
      const row = db.prepare("SELECT save_json, revision FROM nexus_pet_rebuild_saves WHERE customer_id = ?").get(customer);
      return { save: JSON.parse(row.save_json), revision: row.revision };
    },
    ledgerRows(customer) {
      return db.prepare("SELECT * FROM nexus_pet_combat_battles WHERE customer_id = ?").all(customer);
    },
    bumpBeforeNextUpdate(customer) { pendingBumps.add(customer); },
  };
}
