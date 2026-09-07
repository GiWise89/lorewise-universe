import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { createNexusFamiliar, restFamiliar, useFamiliarItem } from "../lib/nexusFamiliar.ts";
import { FAMILIAR_DISCOVERIES, FAMILIAR_POSTCARDS, dominantFamiliarPersonality, recordFamiliarOutingLegacy } from "../lib/nexusFamiliarLegacy.ts";

const now = new Date("2026-08-30T10:00:00.000Z");

test("the diary begins with adoption and records real care", () => {
  const starter = createNexusFamiliar(now, "legacy-care");
  assert.deepEqual(starter.legacy.memories.map((entry) => entry.id), ["primo-incontro"]);
  const hungry = { ...starter, needs: { ...starter.needs, hunger: 20 } };
  const cared = useFamiliarItem(hungry, "food", now);
  assert.equal(cared.ok, true);
  assert.ok(cared.state.legacy.memories.some((entry) => entry.id === "prima-cura"));
  assert.equal(cared.state.legacy.personality.affection, starter.legacy.personality.affection + 2);
});

test("personality grows from actions instead of a static label", () => {
  const starter = createNexusFamiliar(now, "legacy-personality");
  const tired = { ...starter, needs: { ...starter.needs, energy: 20 } };
  const rested = restFamiliar(tired, now);
  assert.equal(rested.ok, true);
  assert.equal(rested.state.legacy.personality.calm, starter.legacy.personality.calm + 2);
  assert.equal(dominantFamiliarPersonality(rested.state.legacy), "calm");
});

test("outings reveal deterministic discoveries and then a real postcard", () => {
  let state = createNexusFamiliar(now, "legacy-outing");
  state = recordFamiliarOutingLegacy(state, "sentiero-luminoso", now);
  assert.equal(state.legacy.discoveries.length, 1);
  assert.ok(state.legacy.memories.some((entry) => entry.id === "prima-uscita"));
  state = recordFamiliarOutingLegacy(state, "sentiero-luminoso", new Date("2026-08-31T10:00:00.000Z"));
  assert.equal(state.legacy.discoveries.filter((entry) => entry.destinationId === "sentiero-luminoso").length, 2);
  assert.ok(state.legacy.postcards.some((entry) => entry.id === "cartolina-sentiero"));
});

test("premium legacy layouts use final raster assets and dedicated interactions", () => {
  const component = readFileSync(new URL("../components/NexusFamiliarLegacy.tsx", import.meta.url), "utf8");
  const css = readFileSync(new URL("../components/NexusFamiliarLegacy.module.css", import.meta.url), "utf8");
  assert.match(component, /diario-v2\.png/);
  assert.match(component, /personalita-v1\.png/);
  assert.match(component, /scoperte-v2\.png/);
  assert.match(component, /pergamena-diario-landscape-v1\.png/);
  assert.match(component, /pergamena-diario-portrait-v1\.png/);
  assert.match(component, /aria-modal="true"/);
  assert.match(component, /openMemoryIndex/);
  assert.match(component, /discoveryPortals/);
  assert.match(component, /discoveryDetailsOpen/);
  assert.doesNotMatch(component, /unlockedMemories\.slice\(-2\)/);
  assert.match(css, /transparent hotspot only opens the reader/);
  assert.match(css, /\.discoveryPortals button/);
  for (const path of [
    "public/famiglio/legacy/scenes/diario-v2.png",
    "public/famiglio/legacy/scenes/personalita-v1.png",
    "public/famiglio/legacy/scenes/scoperte-v2.png",
    "public/famiglio/legacy/pages/pergamena-diario-landscape-v1.png",
    "public/famiglio/legacy/pages/pergamena-diario-portrait-v1.png",
    ...FAMILIAR_DISCOVERIES.map((entry) => `public${entry.icon}`),
    ...FAMILIAR_POSTCARDS.map((entry) => `public${entry.image}`),
  ]) assert.equal(existsSync(new URL(`../${path}`, import.meta.url)), true, path);
});

test("the public Famiglio route mounts the rebuild while the legacy archive stays isolated", () => {
  const page = readFileSync(join(process.cwd(), "app", "famiglio", "page.tsx"), "utf8");
  assert.match(page, /FamiglioNexusRebuild/);
  assert.doesNotMatch(page, /NexusFamiliarLegacy/);
});

test("mobile diary opens as a closable full-screen portrait page", () => {
  const component = readFileSync(join(process.cwd(), "components", "NexusFamiliarLegacy.tsx"), "utf8");
  const styles = readFileSync(join(process.cwd(), "components", "NexusFamiliarLegacy.module.css"), "utf8");
  const mobile = styles.slice(styles.indexOf("@media (max-width: 640px)"));
  assert.match(component, /pergamena-diario-portrait-v1\.png/);
  assert.match(component, /aria-label="Chiudi il diario"/);
  assert.match(mobile, /\.diaryReaderBackdrop\s*\{[^}]*width:\s*100vw[^}]*height:\s*100dvh[^}]*overflow:\s*hidden/s);
  assert.match(mobile, /\.diaryReader\s*\{[^}]*width:\s*100vw[^}]*height:\s*100dvh/s);
  assert.match(mobile, /\.diaryReaderClose\s*\{[^}]*position:\s*fixed[^}]*z-index:\s*4/s);
  assert.match(mobile, /\.diaryReaderParchment\s*\{[^}]*width:\s*100%[^}]*height:\s*100%[^}]*object-fit:\s*fill/s);
  assert.match(mobile, /\.diaryReaderCopy\s*\{[^}]*width:\s*min\(72vw, 420px\)[^}]*overflow:\s*hidden/s);
});

test("mobile rewards use normal document flow without overlapping the milestone list", () => {
  const styles = readFileSync(new URL("../components/NexusFamiliarLegacy.module.css", import.meta.url), "utf8");
  const mobile = styles.slice(styles.indexOf("@media (max-width: 640px)"));
  assert.match(mobile, /\.rewardsScene\s*\{[^}]*display:\s*grid[^}]*gap:\s*\.7rem/s);
  assert.match(mobile, /\.rewardNext\s*\{[^}]*position:\s*relative[^}]*top:\s*auto/s);
  assert.match(mobile, /\.rewardTimeline\s*\{[^}]*position:\s*relative[^}]*margin:\s*0/s);
});
