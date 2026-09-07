import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  FAMIGLIO_REBUILD_CLOUD_SCHEMA_VERSION,
  sanitizeFamiglioRebuildCloudSave,
} from "../lib/famiglioRebuildCloud.ts";

function house(name = "Luna") {
  return {
    rebuild: { stage: "home", selectedId: "cat", unlockedIds: ["cat"], familiarName: name },
    home: { needs: {}, inventory: {} },
    adventure: {},
    combat: {},
    activeFamiliarId: "cat",
  };
}

test("the rebuilt Nexus Pet save keeps exactly three independent account Houses", () => {
  const checked = sanitizeFamiglioRebuildCloudSave({
    schemaVersion: FAMIGLIO_REBUILD_CLOUD_SCHEMA_VERSION,
    activeHouseIndex: 1,
    houses: [house("Luna"), house("Sole"), null],
    updatedAt: new Date().toISOString(),
  });
  assert.equal(checked.ok, true);
  if (checked.ok) {
    assert.equal(checked.save.houses.length, 3);
    assert.equal(checked.save.activeHouseIndex, 1);
  }
});

test("the rebuilt Nexus Pet save rejects malformed and oversized payloads", () => {
  assert.equal(sanitizeFamiglioRebuildCloudSave({ schemaVersion: 1, activeHouseIndex: 0, houses: [house()] }).ok, false);
  assert.equal(sanitizeFamiglioRebuildCloudSave({ schemaVersion: 1, activeHouseIndex: 3, houses: [house(), null, null] }).ok, false);
  assert.equal(sanitizeFamiglioRebuildCloudSave({ schemaVersion: 1, activeHouseIndex: 0, houses: [house(), null, null], padding: "x".repeat(600_000) }).ok, false);
});

test("the account route is private, revisioned and isolated from the legacy Famiglio record", async () => {
  const source = await readFile(new URL("../app/api/famiglio/rebuild/route.ts", import.meta.url), "utf8");
  assert.match(source, /getLoreWiseUser\(\)/);
  assert.match(source, /nexus_pet_rebuild_saves/);
  assert.match(source, /baseRevision/);
  assert.match(source, /private, no-store/);
  assert.doesNotMatch(source, /nexus_familiars\b/);
});

test("the current Nexus Pet hydrates and saves the rebuilt account snapshot", async () => {
  const source = await readFile(new URL("../components/FamiglioNexusRebuild.tsx", import.meta.url), "utf8");
  assert.match(source, /fetch\("\/api\/famiglio\/rebuild"/);
  assert.match(source, /schemaVersion: 1 as const/);
  assert.match(source, /setHomeState\(active\.home\)/);
  assert.match(source, /setAdventureState\(active\.adventure\)/);
  assert.match(source, /setCombatState\(active\.combat\)/);
  assert.match(source, /cloudReloadToken/);
  assert.match(source, /response\.status === 409[\s\S]*setCloudReloadToken/);
});

test("the rebuilt Famiglio PiP follows site navigation and stays outside the House", async () => {
  const pip = await readFile(new URL("../components/NexusPetNavigationPip.tsx", import.meta.url), "utf8");
  const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
  const home = await readFile(new URL("../components/FamiglioNexusRebuild.tsx", import.meta.url), "utf8");
  assert.match(layout, /<NexusPetNavigationPip \/>/);
  assert.match(pip, /pathname\.startsWith\("\/famiglio"\)/);
  assert.match(pip, /lorewise\.famiglio-rebuild\.v1/);
  assert.match(pip, /\/api\/famiglio\/rebuild/);
  assert.match(pip, /familiarAnimatedPreview/);
  assert.doesNotMatch(home, /famiglio-pip-panel/);
});
