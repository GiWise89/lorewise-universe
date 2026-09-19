import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { heavyGameMetadataKeys, isPublicBrowserHost, slimAccountMetadata } from "../lib/accountMetadataSlim.ts";

test("toglie dai metadati solo i salvataggi di gioco e rinnova la sessione", async () => {
  const calls = [];
  const client = { auth: {
    updateUser: async (payload) => { calls.push(["update", payload]); return { error: null }; },
    refreshSession: async () => { calls.push(["refresh"]); return { error: null }; },
  } };
  const user = { user_metadata: { full_name: "Lettrice", nexus_pet_rebuild_save: { houses: [] }, nexus_pet_rebuild_revision: 4, nexus_familiar_state: null } };
  assert.deepEqual(heavyGameMetadataKeys(user), ["nexus_pet_rebuild_save", "nexus_pet_rebuild_revision"]);
  assert.equal(await slimAccountMetadata(client, user), true);
  assert.deepEqual(calls, [["update", { data: { nexus_pet_rebuild_save: null, nexus_pet_rebuild_revision: null } }], ["refresh"]]);
  calls.length = 0;
  assert.equal(await slimAccountMetadata(client, { user_metadata: { full_name: "Lettrice" } }), false);
  assert.deepEqual(calls, []);
});

test("alleggerisce solo sui domini pubblici", () => {
  assert.equal(isPublicBrowserHost("lorewisenexus.it"), true);
  for (const host of ["localhost", "127.0.0.1", "192.168.1.7", "10.0.0.3"]) assert.equal(isPublicBrowserHost(host), false);
});

test("le rotte del Famiglio non scrivono più nei metadati dell'account", async () => {
  for (const route of ["famiglio/route.ts", "famiglio/slots/route.ts", "famiglio/command/route.ts", "famiglio/rebuild/route.ts", "famiglio/rebuild/attendance/route.ts", "famiglio/rebuild/streak/route.ts"]) {
    const source = await readFile(new URL(`../app/api/${route}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /auth\.updateUser/, route);
  }
  for (const entry of ["../app/api/account/session/route.ts", "../components/AccountAccessPanel.tsx", "../app/auth/callback/page.tsx"]) {
    assert.match(await readFile(new URL(entry, import.meta.url), "utf8"), /slimAccountMetadata/, entry);
  }
});
