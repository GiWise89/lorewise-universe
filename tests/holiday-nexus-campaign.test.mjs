import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

const [page, home, ribbon, experience, countdown, styles, chronicles, communications] = await Promise.all([
  readFile(new URL("../app/feste-nel-nexus/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../components/CurrentDiscountRibbon.tsx", import.meta.url), "utf8"),
  readFile(new URL("../components/HolidayNexusCampaignExperience.tsx", import.meta.url), "utf8"),
  readFile(new URL("../components/HolidayNexusCountdown.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  readFile(new URL("../lib/nexusChronicles.ts", import.meta.url), "utf8"),
  readFile(new URL("../lib/promotionCommunications.ts", import.meta.url), "utf8"),
]);

test("builds a dedicated timed Feste nel Nexus promotion screen", () => {
  assert.match(page, /campaignPhase/);
  assert.match(page, /query\?\.anteprima === "feste"/);
  assert.match(page, /LOREWISE_LOCAL_CALENDAR_PREVIEW/);
  assert.match(experience, /Regala un mondo/);
  assert.match(experience, /holidayNexusPromotion\.rates\.visitor/);
  assert.match(experience, /holidayNexusPromotion\.rates\.supporter/);
  assert.match(experience, /holidayNexusPromotion\.rates\.collector/);
  assert.match(countdown, /window\.setInterval/);
  assert.match(countdown, /role="timer"/);
});

test("uses real protected commission previews and never crops them", async () => {
  const assets = [
    "../public/commissions/previews-webp/lw-com-001-preview.webp",
    "../public/commissions/previews-webp/lw-com-011-preview.webp",
    "../public/commissions/previews-webp/lw-com-015-preview.webp",
    "../public/commissions/previews-webp/lw-com-013-preview.webp",
    "../public/commissions/previews-webp/lw-com-028-preview.webp",
    "../public/commissions/previews-webp/lw-com-014-preview.webp",
    "../public/brand/lorewise-universe-logo-concept-c.webp",
    "../public/brand/lorewise-wax-seal-v1.webp",
    "../public/promotions/holiday/christmas-nexus-background-v1.webp",
    "../public/promotions/holiday/christmas-snowman-frame-v1.webp",
    "../public/promotions/holiday/christmas-garland-divider-v1.webp",
    "../public/promotions/holiday/christmas-fairy-lights-edge-v1.webp",
  ];
  await Promise.all(assets.map((asset) => access(new URL(asset, import.meta.url))));
  for (const code of ["LW-COM-001", "LW-COM-011", "LW-COM-015", "LW-COM-013", "LW-COM-028", "LW-COM-014"]) {
    assert.match(experience, new RegExp(code));
  }
  const campaignStart = styles.indexOf("/* Feste nel Nexus:");
  const campaignEnd = styles.indexOf("/* The Famiglio route", campaignStart);
  const campaignStyles = styles.slice(campaignStart, campaignEnd);
  assert.match(campaignStyles, /object-fit:contain/g);
  assert.doesNotMatch(campaignStyles, /object-fit:cover/);
  assert.doesNotMatch(campaignStyles, /::before|::after/);
});

test("opens the Christmas campaign directly from the promotional ribbon on the home page", () => {
  assert.match(home, /previewHoliday/);
  assert.match(home, /query\?\.anteprima === "feste"/);
  assert.match(ribbon, /holiday-home-ribbon/);
  assert.match(ribbon, /christmas-garland-divider-v1\.webp/);
  assert.match(ribbon, /\/feste-nel-nexus/);
  assert.match(ribbon, /anteprima=feste/);
});

test("does not overlay the decorative Christmas frame on campaign content", () => {
  assert.doesNotMatch(experience, /christmas-snowman-frame-v1\.png/);
  assert.doesNotMatch(styles.slice(styles.indexOf("\/\* Feste nel Nexus:")), /holiday-nexus-hero-frame/);
});

test("surrounds the full campaign with real raster Christmas lights", () => {
  assert.match(experience, /holiday-nexus-light-field/);
  assert.match(styles, /christmas-fairy-lights-edge-v1\.webp/);
  assert.match(styles, /holiday-lights-glow/);
  assert.match(styles, /prefers-reduced-motion:reduce/);
});

test("centers the commission path heading instead of squeezing it to one side", () => {
  const campaignStyles = styles.slice(styles.indexOf("\/\* Feste nel Nexus:"));
  assert.match(campaignStyles, /\.holiday-nexus-paths > header \{ display:flex; flex-direction:column; align-items:center/);
  assert.match(campaignStyles, /\.holiday-nexus-paths > header h2 \{ width:100%; max-width:18ch; margin-inline:auto/);
});

test("routes Cronache, communications and all three offers through the dedicated screen", () => {
  assert.match(chronicles, /href: "\/feste-nel-nexus"/);
  assert.match(communications, /landingPath: "\/feste-nel-nexus"/);
  for (const packageName of ["Ritratto Essenziale", "Ritratto Completo", "Opera Narrativa"]) {
    assert.match(experience, new RegExp(packageName));
  }
  assert.match(experience, /request=preventivo/);
  assert.match(experience, /anteprima=feste/);
});
