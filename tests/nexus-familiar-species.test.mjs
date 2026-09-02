import assert from "node:assert/strict";
import test from "node:test";
import { familiarSpeciesProfile } from "../lib/nexusFamiliarSpecies.ts";

const families = ["Gatto", "Cane", "Lupo", "Coniglio", "Volpe"];

test("the five principal species have distinct preferences and narratives", () => {
  const profiles = families.map(familiarSpeciesProfile);
  assert.equal(new Set(profiles.map((profile) => profile.preference)).size, families.length);
  assert.equal(new Set(profiles.map((profile) => profile.departure)).size, families.length);
  assert.equal(new Set(profiles.map((profile) => profile.returnHome)).size, families.length);
});

test("every principal species defines complete care reactions and safe autonomous behavior", () => {
  for (const profile of families.map(familiarSpeciesProfile)) {
    assert.deepEqual(Object.keys(profile.careMessages).sort(), ["food", "medicine", "rest", "soap", "toy"]);
    assert.ok(profile.autonomousBehaviors.length >= 3);
    assert.ok(profile.autonomousBehaviors.every((behavior) => ["idle", "walk", "sit", "groom", "rest"].includes(behavior)));
  }
});
