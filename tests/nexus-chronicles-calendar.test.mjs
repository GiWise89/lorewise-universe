import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { getReleasedEditorialEntries } from "../lib/editorialCalendar.ts";

const schedule = [
  { issue: "Cronaca 001", publishedAt: "2026-08-22" },
  { issue: "Cronaca 002", publishedAt: "2026-08-24" },
  { issue: "Cronaca 003", publishedAt: "2026-08-31" },
  { issue: "Cronaca 004", publishedAt: "2026-09-07" },
  { issue: "Cronaca 005", publishedAt: "2026-09-14" },
  { issue: "Cronaca 006", publishedAt: "2026-09-21" },
  { issue: "Cronaca 007", publishedAt: "2026-09-28" },
  { issue: "Cronaca 008", publishedAt: "2026-10-05" },
  { issue: "Cronaca 009", publishedAt: "2026-10-12" },
  { issue: "Cronaca 010", publishedAt: "2026-10-19" },
  { issue: "Cronaca 011", publishedAt: "2026-10-26" },
  { issue: "Cronaca 012", publishedAt: "2026-11-02" },
  { issue: "Cronaca 013", publishedAt: "2026-11-09" },
  { issue: "Cronaca 014", publishedAt: "2026-11-16" },
  { issue: "Cronaca 015", publishedAt: "2026-11-23" },
  { issue: "Cronaca 016", publishedAt: "2026-11-30" },
  { issue: "Cronaca 017", publishedAt: "2026-12-07" },
];

const source = await readFile(new URL("../lib/nexusChronicles.ts", import.meta.url), "utf8");
const pageSource = await readFile(new URL("../app/cronache-del-nexus/page.tsx", import.meta.url), "utf8");
const feedSource = await readFile(new URL("../components/NexusChroniclesFeed.tsx", import.meta.url), "utf8");
const globalStyles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

test("publishes the prepared Nexus chronicles automatically at Italian midnight", () => {
  assert.deepEqual(
    getReleasedEditorialEntries(schedule, new Date("2026-08-23T12:00:00+02:00")).map((entry) => entry.issue),
    ["Cronaca 001"],
  );
  assert.deepEqual(
    getReleasedEditorialEntries(schedule, new Date("2026-08-24T00:00:00+02:00")).map((entry) => entry.issue),
    ["Cronaca 002", "Cronaca 001"],
  );
  assert.deepEqual(
    getReleasedEditorialEntries(schedule, new Date("2026-08-31T00:00:00+02:00")).map((entry) => entry.issue),
    ["Cronaca 003", "Cronaca 002", "Cronaca 001"],
  );
  assert.deepEqual(
    getReleasedEditorialEntries(schedule, new Date("2026-09-07T00:00:00+02:00")).map((entry) => entry.issue),
    ["Cronaca 004", "Cronaca 003", "Cronaca 002", "Cronaca 001"],
  );
  assert.equal(getReleasedEditorialEntries(schedule, new Date("2026-11-08T22:59:59Z"))[0].issue, "Cronaca 012");
  assert.equal(getReleasedEditorialEntries(schedule, new Date("2026-11-08T23:00:00Z"))[0].issue, "Cronaca 013");
  assert.equal(getReleasedEditorialEntries(schedule, new Date("2026-12-06T22:59:59Z"))[0].issue, "Cronaca 016");
  assert.equal(getReleasedEditorialEntries(schedule, new Date("2026-12-06T23:00:00Z"))[0].issue, "Cronaca 017");
});

test("keeps every approved weekly announcement in the prepared calendar", () => {
  for (const marker of [
    'publishedAt: "2026-08-24"',
    'publishedAt: "2026-08-31"',
    'publishedAt: "2026-09-07"',
    'publishedAt: "2026-09-14"',
    'publishedAt: "2026-09-21"',
    'publishedAt: "2026-09-28"',
    'publishedAt: "2026-10-05"',
    'publishedAt: "2026-10-12"',
    'publishedAt: "2026-10-19"',
    'publishedAt: "2026-10-26"',
    'publishedAt: "2026-11-02"',
    'publishedAt: "2026-11-09"',
    'publishedAt: "2026-11-16"',
    'publishedAt: "2026-11-23"',
    'publishedAt: "2026-11-30"',
    'publishedAt: "2026-12-07"',
    "Lae’zel, prima del colore.",
    "Apre l’Archivio dei Custodi.",
    "Dal legame al paesaggio.",
    "Dopo mezzanotte cambia tutto.",
    "Due custodi, due memorie.",
    "Dal gruppo al tavolo tattico.",
    "Il turno di Halloween comincia a River Fields.",
    "Il Sentiero riapre l’Atlante.",
    "Night City non concede una seconda prima impressione.",
    "La strada verso la vittoria attraversa il Nexus.",
    "La squadra dei sogni entra nell’Atlante.",
  ]) assert.match(source, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

  assert.equal([...source.matchAll(/makeWeeklyChronicle\(\{/g)].length, 4);
  assert.match(source, /La prossima guida verrà annunciata qui/);
  assert.doesNotMatch(source, /verifica editoriale|completa e approvata|prima della loro approvazione/);
  assert.match(source, /halloweenChroniclePromotion\("active"\)/);
  assert.match(source, /La mia versione corrotta/);
  assert.match(source, /corruptedPortraitPromotion\.rates\.visitor/);
  assert.match(source, /corruptedPortraitPromotion\.rates\.supporter/);
  assert.match(source, /corruptedPortraitPromotion\.rates\.collector/);
  assert.match(source, /commissioni\?focus=/);
  assert.doesNotMatch(source, /Salmo|Noyz Narcos|Kid Yugi|Biggie|2Pac/);
  assert.doesNotMatch(source, /calendario editoriale|rotazione editoriale automatica|stato editoriale|controlli editoriali|verifica finale/i);
  assert.doesNotMatch(feedSource, /eventi e percorsi monitorati|rotazione editoriale automatica/i);
});

test("uses only public, existing images in scheduled public announcements", async () => {
  const images = [
    "../public/brand/icons/dove-nascono-i-mondi-concept-v1.webp",
    "../public/creative-journal/previews/lw-wip-010-preview.jpg",
    "../public/brand/icons/lorewise-vip-official-v1.webp",
    "../public/brand/icons/arte-concept-v1.webp",
    "../public/codex/seals/lorewise-codex-emblem-v1.webp",
    "../public/codex/display/nhevara.webp",
    "../public/games/lorewise-fuori-trama-next/gameplay-current-tactical-battle.webp",
    "../public/brand/icons/commissioni-concept-v1.webp",
    "../public/universe-pass/benefits-sketch-constellation-v1.webp",
    "../public/promotions/halloween-corrupted-portrait-premium-v1.webp",
    "../public/decorations/halloween/moon-amber-mist-optimized-v1.webp",
    "../public/atlas/world-of-warcraft/official/01-returning-orientation.webp",
    "../public/atlas/hogwarts-legacy/cover.webp",
    "../public/atlas/zelda-tears-of-the-kingdom/cover.webp",
    "../public/atlas/the-sims-4/cover.webp",
    "../public/atlas/red-dead-redemption-2/cover.webp",
    "../public/atlas/monster-hunter-wilds/cover.webp",
    "../public/atlas/diablo-iv/cover.webp",
    "../public/atlas/pokemon-pokopia/cover.webp",
    "../public/atlas/the-witcher-3/cover.webp",
    "../public/atlas/the-mortuary-assistant/cover.webp",
    "../public/atlas/cyberpunk-2077/cover.webp",
    "../public/atlas/inazuma-eleven-victory-road/cover.webp",
  ];
  await Promise.all(images.map((image) => access(new URL(image, import.meta.url))));
});

test("evaluates the calendar on every visit and switches archived issues without an endless feed", () => {
  assert.match(pageSource, /dynamic = "force-dynamic"/);
  assert.match(pageSource, /process\.env\.NODE_ENV !== "production"/);
  assert.match(pageSource, /params\.anteprima === "tutte"/);
  assert.match(pageSource, /2026-12-07T12:00:00\+01:00/);
  assert.match(feedSource, /Archivio delle Cronache/);
  assert.match(feedSource, /setActiveChronicleId/);
  assert.doesNotMatch(feedSource, /chronicles\.map\(\(chronicle, index\) => <ChronicleStory/);
});

test("never crops images in Nexus announcements, guide previews or Atlas galleries", () => {
  for (const selector of [
    ".nexus-signal-image img",
    ".nexus-guide-preview-image img",
    ".nexus-atlas-gallery figure img",
  ]) {
    const start = globalStyles.indexOf(selector);
    const end = globalStyles.indexOf("}", start);
    assert.ok(start >= 0, `missing ${selector}`);
    assert.match(globalStyles.slice(start, end), /object-fit:contain/);
    assert.doesNotMatch(globalStyles.slice(start, end), /object-fit:cover/);
  }
  assert.match(globalStyles, /\.nexus-chronicle-story\.is-games \.nexus-chronicle-visual img \{[^}]*width:100%;[^}]*object-fit:contain;/s);
  assert.match(globalStyles, /\.nexus-chronicle-story\.is-games \.nexus-signal-image \{[^}]*min-height:clamp\(260px,24vw,390px\);/s);
  assert.match(globalStyles, /\.nexus-promotion-visual img \{[^}]*object-fit:contain;/s);
});

test("renders every promotion as a themed premium screen", () => {
  assert.match(feedSource, /nexus-chronicle-promotion is-/);
  assert.match(feedSource, /nexus-promotion-visual/);
  for (const theme of ["opening", "halloween", "ended", "standard"]) {
    assert.match(source, new RegExp(`theme: "${theme}"`));
  }
  assert.match(globalStyles, /\.nexus-chronicle-promotion\.is-halloween/);
  assert.match(globalStyles, /\.nexus-chronicle-promotion\.is-standard/);
});

test("gives every scheduled announcement a direct internal path button", () => {
  assert.match(feedSource, /className="nexus-signal-link"/);
  assert.match(feedSource, /href=\{signal\.href\}/);
  for (const path of [
    "/dove-nascono-i-mondi/laezel-guerriera-astrale",
    "/vip-zone?area=downloads#downloads",
    "/vip-zone?area=atelier#atelier",
    "/enciclopedia#indice-codex",
    "/dove-nascono-i-mondi/giochi/lorewise-fuori-trama-next",
  ]) assert.match(source, new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.equal([...source.matchAll(/action: "Apri /g)].length >= 8, true);
});

test("keeps a permanent premium register with every declared Pass event", () => {
  assert.match(source, /export const nexusBenefitEvents/);
  for (const code of [
    "VIP-WEEKLY-GUIDE",
    "ATLAS-PUBLIC-ROTATION",
    "VIP-ART-CREDITS",
    "VIP-ATELIER",
    "VIP-DOWNLOADS",
    "TWR-ROGO",
    "FUORI-TRAMA-PARTICIPATION",
    "COMMISSIONS-OPENING",
    "HALLOWEEN-HORROR-COLLECTIONS",
  ]) assert.match(source, new RegExp(`code: "${code}"`));
  assert.match(feedSource, /Registro premium permanente/);
  assert.match(feedSource, /chronicle\.benefitEvents\.map/);
  assert.match(feedSource, /selectedBenefitEvent\.status/);
  assert.match(feedSource, /selectedBenefitEvent\.timing/);
  assert.match(feedSource, /href=\{selectedBenefitEvent\.href\}/);
  assert.match(feedSource, /activeBenefitView/);
  assert.match(feedSource, /activeBenefitEventCode/);
  assert.match(feedSource, /nexus-benefit-event-switcher/);
  assert.match(feedSource, /nexus-benefit-event-stage/);
  assert.doesNotMatch(feedSource, /nexus-benefit-event-grid/);
});
