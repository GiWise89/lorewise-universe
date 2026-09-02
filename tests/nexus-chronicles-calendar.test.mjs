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
const panelSource = await readFile(new URL("../lib/nexusChroniclePanels.ts", import.meta.url), "utf8");
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
    'publishedAt: "2026-08-26"',
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
    "Le identità del nuovo conflitto sono state svelate nell’Area VIP.",
  ]) assert.match(source, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

  assert.equal([...source.matchAll(/makeWeeklyChronicle\(\{/g)].length, 5);
  assert.match(source, /La prossima guida verrà annunciata qui/);
  assert.doesNotMatch(source, /verifica editoriale|completa e approvata|prima della loro approvazione/);
  assert.match(source, /halloweenChroniclePromotion\("active"\)/);
  assert.match(source, /holidayChroniclePromotion/);
  assert.match(source, /isHolidayNexusPromotionActive\(now\)/);
  assert.match(source, /Feste nel Nexus · promozione attiva/);
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
    "../public/games/demon-match-three/gameplay-portal-backdrop-v1.webp",
    "../public/games/demon-match-three/gameplay-map-act-1-v1.webp",
    "../public/games/demon-match-three/gameplay-powerup-ready-v1.webp",
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
  assert.match(feedSource, /Catalogo delle Cronache/);
  assert.match(feedSource, /Date\.parse\(right\.publishedAt\) - Date\.parse\(left\.publishedAt\)/);
  assert.match(feedSource, /setActiveChronicleId/);
  assert.doesNotMatch(feedSource, /chronicles\.map\(\(chronicle, index\) => <ChronicleStory/);
});

test("organizes every Nexus novelty into one visible chapter at a time", () => {
  assert.match(panelSource, /type ChroniclePanel = "overview" \| "signals" \| "studio" \| "promotion" \| "guides" \| "benefits"/);
  assert.match(feedSource, /useState<ChroniclePanel>\(initialPanel\)/);
  assert.match(pageSource, /chroniclePanelFromQuery\(params\.sezione\)/);
  assert.match(pageSource, /initialPanel=\{initialPanel\}/);
  for (const path of ["in-primo-piano", "aggiornamenti", "laboratorio", "promozione", "guide-demo", "area-vip"]) {
    assert.match(panelSource, new RegExp(`query: "${path}"`));
    assert.match(feedSource, new RegExp(`id="${path}"`));
  }
  assert.match(feedSource, /window\.history\.replaceState/);
  assert.match(globalStyles, /\.nexus-panel-anchor \{[^}]*position:absolute;[^}]*width:0;[^}]*height:0;/s);
  assert.match(globalStyles, /\.nexus-promotion-heading \{[^}]*grid-column:2;[^}]*grid-row:1;/s);
  assert.match(globalStyles, /\.nexus-promotion-visual \{[^}]*grid-column:1;[^}]*grid-row:1;/s);
  assert.match(globalStyles, /@media \(max-width: 980px\) \{[\s\S]*\.nexus-promotion-heading \{ grid-column:1; grid-row:2; \}/);
  for (const panel of ["overview", "signals", "studio", "promotion", "guides", "benefits"]) {
    assert.match(feedSource, new RegExp(`hidden=\\{activePanel !== "${panel}"\\}`));
  }
  assert.match(feedSource, /studio-panel[\s\S]*<StudioWorkInProgress \/>/);
  assert.match(feedSource, /nexus-guide-status-visual/);
  assert.match(source, /caption: "INAZUMA ELEVEN: Victory Road · guida pubblica completa"/);
  assert.match(globalStyles, /\.nexus-chronicle-story \[role="tabpanel"\]\[hidden\] \{ display:none !important; \}/);
  assert.match(globalStyles, /\.nexus-chronicles-list \{[^}]*grid-template-columns:minmax\(0,1fr\);[^}]*min-width:0;[^}]*max-width:100%;/s);
  assert.match(globalStyles, /\.nexus-section-switcher \{[^}]*min-width:0;[^}]*max-width:100%;[^}]*overflow:hidden;/s);
  assert.match(globalStyles, /\.nexus-section-tabs \{[^}]*grid-template-columns:repeat\(6,minmax\(0,1fr\)\);/s);
});

test("catalogues every released novelty by category, date and direct address", () => {
  assert.match(pageSource, /Indice delle Novità/);
  assert.match(pageSource, /id="archivio-cronache"/);
  assert.match(pageSource, /initialCategory=\{activeArea === "categorie" \? initialCategory : "all"\}/);
  assert.match(pageSource, /initialChronicleId=\{params\.cronaca\}/);
  assert.match(source, /nexusChronicleCategoryFromQuery/);
  assert.match(feedSource, /nexusChronicleCategories\.map/);
  assert.match(feedSource, /activeCategory/);
  assert.match(feedSource, /visibleChronicles\.map/);
  assert.match(feedSource, /url\.searchParams\.set\("cronaca", chronicleId\)/);
  assert.match(feedSource, /url\.searchParams\.set\("categoria", category\)/);
  assert.match(feedSource, /Notizie ordinate dalla più recente/);
  assert.match(feedSource, /nexus-edition-controls/);
  assert.match(globalStyles, /\.nexus-edition-catalog \{[^}]*max-height:390px;[^}]*overflow-y:auto;/s);
  assert.match(globalStyles, /@media \(max-width:640px\) \{[\s\S]*\.nexus-edition-catalog \{[^}]*display:flex;[^}]*overflow-x:auto;[^}]*overflow-y:hidden;/s);
  assert.match(globalStyles, /\.nexus-news-directory/);
});

test("keeps highlights, chronological archive and categories on separate views", () => {
  assert.match(pageSource, /type NexusNewsArea = "evidenza" \| "archivio" \| "categorie"/);
  assert.match(pageSource, /newsAreaFromQuery\(params\.vista\)/);
  assert.match(pageSource, /vista=evidenza#novita-in-primo-piano/);
  assert.match(pageSource, /vista=archivio#archivio-cronache/);
  assert.match(pageSource, /vista=categorie#archivio-cronache/);
  assert.match(pageSource, /activeArea === "evidenza" \? <NexusNewsSpotlight/);
  assert.match(pageSource, /activeArea !== "evidenza" \? <section className="nexus-chronicles-archive/);
  assert.match(feedSource, /showCategories = true/);
  assert.match(feedSource, /\{showCategories \? <div className="nexus-chronicles-filters"/);
  assert.match(globalStyles, /\.nexus-news-directory a\[aria-current="page"\]/);
});

test("never crops images in Nexus announcements, guide previews or Atlas galleries", () => {
  for (const selector of [
    ".nexus-signal-image img",
    ".nexus-guide-preview-image img",
    ".nexus-atlas-gallery figure img",
    ".nexus-guide-status-visual img",
  ]) {
    const start = globalStyles.indexOf(selector);
    const end = globalStyles.indexOf("}", start);
    assert.ok(start >= 0, `missing ${selector}`);
    assert.match(globalStyles.slice(start, end), /object-fit:contain/);
    assert.doesNotMatch(globalStyles.slice(start, end), /object-fit:cover/);
  }
  assert.match(globalStyles, /\.nexus-chronicle-story\.is-games \.nexus-chronicle-visual img \{[^}]*width:100%;[^}]*object-fit:contain;/s);
  assert.match(globalStyles, /\.nexus-chronicle-story\.is-games \.nexus-signal-image \{[^}]*min-height:clamp\(520px,58vw,800px\);/s);
  assert.match(globalStyles, /\.nexus-promotion-visual img \{[^}]*object-fit:contain;/s);
  assert.match(globalStyles, /\.nexus-promotion-visual \{[^}]*width:100%;[^}]*max-width:100%;[^}]*min-width:0;[^}]*box-sizing:border-box;[^}]*overflow:hidden;/s);
  assert.match(globalStyles, /\.nexus-promotion-visual img \{[^}]*width:100%;[^}]*max-width:100%;[^}]*height:auto;[^}]*max-height:none;/s);
  assert.match(globalStyles, /\.nexus-promotion-visual figcaption \{[^}]*position:static;/s);
});

test("keeps the Demon Match reveal usable on narrow mobile screens", () => {
  assert.match(globalStyles, /\.game-dossier-demon-match \.game-dossier-hero-art \{[^}]*object-fit:contain;/s);
  assert.match(globalStyles, /\.vip-demon-match-art img \{[^}]*object-fit:contain;/s);
  assert.match(globalStyles, /\.vip-demon-match-dossiers img \{[^}]*object-fit:contain;/s);
  assert.match(globalStyles, /@media \(max-width:760px\) \{[\s\S]*\.game-protagonist-pair,\.vip-demon-match-dossiers \{ grid-template-columns:1fr; \}/);
  assert.match(globalStyles, /@media \(max-width:520px\) \{[\s\S]*\.game-protagonist-intro > div > a,[\s\S]*\.nexus-vip-location > a \{ width:100%; \}/);
  assert.match(globalStyles, /@media \(max-width:520px\) \{[\s\S]*\.vip-demon-match-development li \{ grid-template-columns:36px minmax\(0,1fr\);/);
  assert.match(globalStyles, /@media \(max-width:520px\) \{[\s\S]*\.pass-game-demon \{ min-height:500px; \}/);
});

test("renders every promotion as a themed premium screen", () => {
  assert.match(feedSource, /nexus-chronicle-promotion is-/);
  assert.match(feedSource, /nexus-promotion-visual/);
  for (const theme of ["opening", "halloween", "holiday", "ended", "standard"]) {
    assert.match(source, new RegExp(`theme: "${theme}"`));
  }
  assert.match(globalStyles, /\.nexus-chronicle-promotion\.is-halloween/);
  assert.match(globalStyles, /\.nexus-chronicle-promotion\.is-holiday/);
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
    "DEMON-MATCH-ANDROID-DEMO",
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
