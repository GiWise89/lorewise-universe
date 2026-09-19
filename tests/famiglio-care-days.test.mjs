import assert from "node:assert/strict";
import test from "node:test";
import { advanceFamiliarHome, applyFamiliarInventoryItem, createFamiliarHomeState, performHomeAction } from "../lib/famiglioHome.ts";

const ACTIONS = ["feed", "play", "clean", "care", "rest"];

// Completa la routine del giorno come farebbe il giocatore, con il tick al secondo della Casa
// che nel frattempo fa avanzare lo stato (e a mezzanotte azzera la routine).
function completeDay(home, dayStart) {
  let current = advanceFamiliarHome(home, dayStart);
  let at = dayStart;
  for (const action of ACTIONS) {
    at += 40 * 60_000;
    current = advanceFamiliarHome(current, at - 1_000);
    current = performHomeAction(current, action, at);
  }
  return current;
}

test("ogni giornata di cura completa aumenta i giorni di cura anche con il tick della Casa", () => {
  const first = new Date(2026, 8, 3, 9, 0).getTime();
  let home = { ...createFamiliarHomeState(first), needs: { hunger: 50, energy: 60, happiness: 50, hygiene: 50, affection: 50 } };
  for (let day = 0; day < 3; day += 1) {
    const start = new Date(2026, 8, 3 + day, 9, 0).getTime();
    // Il tick di mezzanotte porta la routine al nuovo giorno prima della prima cura.
    home = advanceFamiliarHome(home, new Date(2026, 8, 3 + day, 0, 0, 1).getTime());
    home = { ...home, needs: { hunger: 50, energy: 60, happiness: 50, hygiene: 50, affection: 50 } };
    home = completeDay(home, start);
  }
  assert.equal(home.growth.careStreak, 3);
});

test("un giorno saltato non azzera i giorni di cura e una routine incompleta non li aumenta", () => {
  let home = createFamiliarHomeState(new Date(2026, 8, 3, 9, 0).getTime());
  home = completeDay(home, new Date(2026, 8, 3, 9, 0).getTime());
  assert.equal(home.growth.careStreak, 1);
  const skipped = new Date(2026, 8, 5, 9, 0).getTime();
  home = { ...advanceFamiliarHome(home, skipped), needs: { hunger: 50, energy: 60, happiness: 50, hygiene: 50, affection: 50 } };
  home = performHomeAction(home, "care", skipped + 1_000);
  assert.equal(home.growth.careStreak, 1);
  home = completeDay(home, new Date(2026, 8, 6, 9, 0).getTime());
  assert.equal(home.growth.careStreak, 2);
});

test("usando un oggetto equipaggiato l'esito conserva desiderio e routine completata", () => {
  const now = new Date(2026, 8, 3, 9, 0).getTime();
  let home = createFamiliarHomeState(now);
  const wish = home.wish.action;
  // L'oggetto del desiderio (es. la Lanterna per la coccola) passa da applyFamiliarInventoryItem.
  const item = home.equippedItems[wish];
  const done = item ? applyFamiliarInventoryItem(home, item, now + 1_000) : performHomeAction(home, wish, now + 1_000);
  assert.match(done.lastOutcome, /Desiderio esaudito: \+5 monete Nexus/);
  home = createFamiliarHomeState(now);
  let at = now;
  for (const action of ACTIONS.slice(0, 4)) home = performHomeAction(home, action, at += 40 * 60_000);
  const rested = applyFamiliarInventoryItem(home, "purple-bed", at + 40 * 60_000);
  assert.match(rested.lastOutcome, /Routine del giorno completata/);
});

test("un riposo senza sonno mostra la reazione dedicata", () => {
  const now = new Date(2026, 8, 3, 9, 0).getTime();
  const home = { ...createFamiliarHomeState(now), needs: { hunger: 80, energy: 96, happiness: 80, hygiene: 80, affection: 80 } };
  const rested = performHomeAction(home, "rest", now + 1_000);
  assert.match(rested.lastOutcome, /Non ha molto sonno/);
});
