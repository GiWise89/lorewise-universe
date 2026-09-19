// Duelli liberi a parità di livello: la rarità conta, ma non decide da sola.
// Tabelle complete: node scripts/fuzz-famiglio-combat.mjs --battles 0 --rarity [--rarity-seed X]
import assert from "node:assert/strict";
import test from "node:test";
import { runFamiliarRarityBalance } from "../scripts/fuzz-famiglio-combat.mjs";

const BANDS = {
  comune: [35, 50],
  raro: [45, 60],
  epico: [55, 70],
  leggendario: [65, 80],
};

test("fuori dalla campagna ogni rarità vince entro la propria fascia contro tutti gli avversari", () => {
  // Campione deterministico: ogni specie contro tutte le altre ai livelli 10, 30 e 50.
  const result = runFamiliarRarityBalance({ seed: "node-test-rarity" });
  assert.equal(result.games, 53 * 52 * 3);
  for (const [rarity, [minimum, maximum]] of Object.entries(BANDS)) {
    const { mean } = result.byRarity[rarity];
    assert.ok(mean >= minimum && mean <= maximum, `${rarity}: media ${mean}% fuori da ${minimum}-${maximum}%`);
  }
  const means = Object.keys(BANDS).map((rarity) => result.byRarity[rarity].mean);
  assert.deepEqual([...means].sort((left, right) => left - right), means, `la rarità deve restare un vantaggio: ${means.join(" < ")}`);
  for (const row of result.species) {
    assert.ok(row.winRate >= 30 && row.winRate <= 85, `${row.id} (${row.rarity}): ${row.winRate}%`);
  }
  assert.ok(result.avgTurns >= 7 && result.avgTurns <= 14, `durata media ${result.avgTurns} turni`);
  // Nessuna mossa monopolizza le scelte migliori del giocatore.
  assert.ok(result.mostUsedMoves[0].share <= 15, `${result.mostUsedMoves[0].id}: ${result.mostUsedMoves[0].share}% delle mosse`);
});
