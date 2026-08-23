import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { getReleasedEditorialEntries } from "../lib/editorialCalendar.ts";

const schedule = [
  { issue: "Cronaca 001", publishedAt: "2026-08-22" },
  { issue: "Cronaca 002", publishedAt: "2026-08-24" },
  { issue: "Cronaca 003", publishedAt: "2026-08-31" },
  { issue: "Cronaca 004", publishedAt: "2026-09-07" },
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
});

test("keeps every approved weekly announcement in the prepared calendar", () => {
  for (const marker of [
    'publishedAt: "2026-08-24"',
    'publishedAt: "2026-08-31"',
    'publishedAt: "2026-09-07"',
    "Lae’zel, prima del colore.",
    "Apre l’Archivio dei Custodi.",
    "Dal legame al paesaggio.",
    "Dopo mezzanotte cambia tutto.",
    "Due custodi, due memorie.",
    "Dal gruppo al tavolo tattico.",
  ]) assert.match(source, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

  assert.equal([...source.matchAll(/makeWeeklyChronicle\(\{/g)].length, 3);
  assert.match(source, /completa e approvata/);
  assert.doesNotMatch(source, /Salmo|Noyz Narcos|Kid Yugi|Biggie|2Pac/);
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
  ];
  await Promise.all(images.map((image) => access(new URL(image, import.meta.url))));
});

test("evaluates the calendar on every visit and switches archived issues without an endless feed", () => {
  assert.match(pageSource, /dynamic = "force-dynamic"/);
  assert.match(pageSource, /process\.env\.NODE_ENV !== "production"/);
  assert.match(pageSource, /params\.anteprima === "tutte"/);
  assert.match(pageSource, /2026-09-07T12:00:00\+02:00/);
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
