import assert from "node:assert/strict";
import test from "node:test";
import {
  applyFamiliarTimePassage,
  createNexusFamiliar,
  decorateFamiliarDen,
  familiarCondition,
  familiarGrowthStage,
  familiarLevelForExperience,
  grantFamiliarItems,
  normalizeNexusFamiliar,
  renameFamiliar,
  restFamiliar,
  useFamiliarItem,
} from "../lib/nexusFamiliar.ts";

const born = new Date("2026-08-27T08:00:00.000Z");

test("creates a complete starter familiar with all nine foundations", () => {
  const state = createNexusFamiliar(born, "familiar-test");
  assert.equal(state.familiarId, "familiar-test");
  assert.equal(state.sex, "unspecified");
  assert.deepEqual(Object.keys(state.needs), ["hunger", "hygiene", "energy", "happiness", "health"]);
  assert.deepEqual({ ...state.inventory, decorations: undefined }, { food: 5, soap: 3, medicine: 1, toy: 1, decorations: undefined });
  assert.equal(state.experience, 0);
  assert.equal(state.level, 1);
  assert.equal(state.growthStage, "cucciolo");
  assert.equal(state.den.theme, "rifugio-iniziale");
  assert.deepEqual(state.dailyProgress, { date: "2026-08-27", careExperience: 0, outingsStarted: 0 });
  assert.equal(familiarCondition(state.needs), "sereno");
});

test("creates a familiar with the chosen name, sex and palette", () => {
  const state = createNexusFamiliar(born, "familiar-identity", "cat-luna", { name: "  Nebbia   Lunare  ", sex: "female" });
  assert.equal(state.name, "Nebbia Lunare");
  assert.equal(state.sex, "female");
  assert.equal(state.appearanceId, "cat-luna");
});

test("applies bounded offline decay and can make an uncared familiar dormant", () => {
  const state = createNexusFamiliar(born, "familiar-decay");
  const afterDay = applyFamiliarTimePassage(state, new Date("2026-08-28T08:00:00.000Z"));
  assert.ok(afterDay.needs.hunger < state.needs.hunger);
  assert.ok(afterDay.needs.hygiene < state.needs.hygiene);
  assert.ok(afterDay.needs.energy < state.needs.energy);
  assert.ok(afterDay.needs.happiness < state.needs.happiness);

  const neglected = { ...state, needs: { hunger: 2, hygiene: 2, energy: 2, happiness: 2, health: 20 } };
  const dormant = applyFamiliarTimePassage(neglected, new Date("2026-08-30T08:00:00.000Z"));
  assert.equal(dormant.needs.health, 0);
  assert.equal(familiarCondition(dormant.needs), "dormiente");
});

test("uses food, soap, medicine and toys from inventory without exceeding need limits", () => {
  const initial = createNexusFamiliar(born, "familiar-items");
  const hungry = { ...initial, needs: { hunger: 20, hygiene: 20, energy: 60, happiness: 20, health: 40 } };
  const fed = useFamiliarItem(hungry, "food", born);
  assert.equal(fed.ok, true);
  assert.equal(fed.state.inventory.food, 4);
  assert.equal(fed.state.needs.hunger, 50);

  const washed = useFamiliarItem(fed.state, "soap", born);
  assert.equal(washed.ok, true);
  assert.equal(washed.state.needs.hygiene, 58);

  const healed = useFamiliarItem(washed.state, "medicine", born);
  assert.equal(healed.ok, true);
  assert.equal(healed.state.needs.health, 91);

  const played = useFamiliarItem(healed.state, "toy", born);
  assert.equal(played.ok, true);
  assert.equal(played.state.needs.happiness, 54);
  assert.equal(played.state.needs.energy, 55);
  assert.ok(played.state.experience > 0);
});

test("refuses unavailable or unnecessary objects", () => {
  const initial = createNexusFamiliar(born, "familiar-empty");
  const noFood = { ...initial, inventory: { ...initial.inventory, food: 0 } };
  const missing = useFamiliarItem(noFood, "food", born);
  assert.equal(missing.ok, false);
  assert.equal(missing.state.inventory.food, 0);
  const healthy = useFamiliarItem(initial, "medicine", born);
  assert.equal(healthy.ok, false);
  assert.equal(healthy.state.inventory.medicine, 1);
  assert.equal(useFamiliarItem({ ...initial, needs: { ...initial.needs, hunger: 95 } }, "food", born).ok, false);
});

test("caps daily care experience without blocking necessary care", () => {
  const initial = createNexusFamiliar(born, "familiar-care-cap");
  const needy = { ...initial, needs: { hunger: 10, hygiene: 10, energy: 10, happiness: 10, health: 40 } };
  const fed = useFamiliarItem(needy, "food", born);
  const washed = useFamiliarItem(fed.state, "soap", born);
  const played = useFamiliarItem(washed.state, "toy", born);
  const rested = restFamiliar(played.state, born);
  assert.equal(rested.ok, true);
  assert.equal(rested.state.dailyProgress.careExperience, 80);
  assert.equal(rested.state.experience, 80);
  const nextDay = applyFamiliarTimePassage(rested.state, new Date("2026-08-28T08:00:00.000Z"));
  assert.deepEqual(nextDay.dailyProgress, { date: "2026-08-28", careExperience: 0, outingsStarted: 0 });
});

test("restores energy, renames the familiar and keeps removed den objects unavailable", () => {
  const initial = createNexusFamiliar(born, "familiar-den");
  const tired = { ...initial, needs: { ...initial.needs, energy: 30 } };
  const rested = restFamiliar(tired, born);
  assert.equal(rested.ok, true);
  assert.equal(rested.state.needs.energy, 72);

  const renamed = renameFamiliar(rested.state, "  Ombra   Dolce  ", born);
  assert.equal(renamed.ok, true);
  assert.equal(renamed.state.name, "Ombra Dolce");

  const decorated = decorateFamiliarDen(renamed.state, "bed", "cuccia-di-viaggio", born);
  assert.equal(decorated.ok, false);
  assert.equal(decorated.state.den.equipped.bed, undefined);
  assert.equal(decorateFamiliarDen(decorated.state, "wall", "quadro-non-sbloccato", born).ok, false);
});

test("calculates experience levels and growth stages without skipping care-day requirements", () => {
  assert.equal(familiarLevelForExperience(0), 1);
  assert.equal(familiarLevelForExperience(100), 3);
  assert.equal(familiarGrowthStage(14, 100), "cucciolo");
  assert.equal(familiarGrowthStage(15, 13), "cucciolo");
  assert.equal(familiarGrowthStage(15, 14), "giovane");
  assert.equal(familiarGrowthStage(35, 34), "giovane");
  assert.equal(familiarGrowthStage(35, 35), "adulto");
});

test("normalizes corrupted values and grants future mission rewards safely", () => {
  const initial = createNexusFamiliar(born, "familiar-normalize");
  const corrupted = {
    ...initial,
    needs: { hunger: 180, hygiene: -10, energy: Number.NaN, happiness: 45, health: 120 },
    experience: -50,
    inventory: { ...initial.inventory, food: -8, soap: 1.8 },
    caredDays: ["2026-08-27", "2026-08-27", "non-valida"],
  };
  const normalized = normalizeNexusFamiliar(corrupted, born);
  assert.deepEqual(normalized.needs, { hunger: 100, hygiene: 0, energy: 0, happiness: 45, health: 100 });
  assert.equal(normalized.inventory.food, 0);
  assert.equal(normalized.inventory.soap, 1);
  assert.deepEqual(normalized.caredDays, ["2026-08-27"]);

  const rewarded = grantFamiliarItems(normalized, { food: 3, soap: 2 }, born);
  assert.equal(rewarded.inventory.food, 3);
  assert.equal(rewarded.inventory.soap, 3);
});
