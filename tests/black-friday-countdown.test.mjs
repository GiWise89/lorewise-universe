import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import {
  BLACK_FRIDAY_CAMPAIGN_ENDS_AT,
  BLACK_FRIDAY_CAMPAIGN_STARTS_AT,
  BLACK_FRIDAY_STARTS_AT,
  CYBER_MONDAY_STARTS_AT,
  BLACK_FRIDAY_TEASER_ENDS_AT,
  BLACK_FRIDAY_TEASER_STARTS_AT,
  blackFridayCampaign,
  getBlackFridayCampaignPhase,
  isBlackFridayTeaserActive,
} from "../lib/blackFridayTeaser.ts";

test("shows the Black Friday teaser only from 2 to 22 November 2026", () => {
  assert.equal(BLACK_FRIDAY_TEASER_STARTS_AT, "2026-11-02T00:00:00+01:00");
  assert.equal(BLACK_FRIDAY_TEASER_ENDS_AT, "2026-11-22T23:59:59.999+01:00");
  assert.equal(BLACK_FRIDAY_STARTS_AT, "2026-11-27T00:00:00+01:00");
  assert.equal(isBlackFridayTeaserActive("2026-11-01T23:59:59+01:00"), false);
  assert.equal(isBlackFridayTeaserActive("2026-11-02T00:00:00+01:00"), true);
  assert.equal(isBlackFridayTeaserActive("2026-11-22T23:59:59+01:00"), true);
  assert.equal(isBlackFridayTeaserActive("2026-11-23T00:00:00+01:00"), false);
});

test("moves from teaser to Black Friday and Cyber Monday on the agreed dates", () => {
  assert.equal(BLACK_FRIDAY_CAMPAIGN_STARTS_AT, "2026-11-23T00:00:00+01:00");
  assert.equal(CYBER_MONDAY_STARTS_AT, "2026-11-30T00:00:00+01:00");
  assert.equal(BLACK_FRIDAY_CAMPAIGN_ENDS_AT, "2026-11-30T23:59:59.999+01:00");
  assert.equal(getBlackFridayCampaignPhase("2026-11-22T23:59:59+01:00"), "teaser");
  assert.equal(getBlackFridayCampaignPhase("2026-11-23T00:00:00+01:00"), "black-friday");
  assert.equal(getBlackFridayCampaignPhase("2026-11-29T23:59:59+01:00"), "black-friday");
  assert.equal(getBlackFridayCampaignPhase("2026-11-30T00:00:00+01:00"), "cyber-monday");
  assert.equal(getBlackFridayCampaignPhase("2026-11-30T23:59:59+01:00"), "cyber-monday");
  assert.equal(getBlackFridayCampaignPhase("2026-12-01T00:00:00+01:00"), "ended");
});

test("offers three direct campaign paths", () => {
  assert.equal(blackFridayCampaign.shop.href, "/shop/catalogo");
  assert.equal(blackFridayCampaign.pass.href, "/abbonamento?focus=piani");
  assert.equal(blackFridayCampaign.cyber.href, "/vip-zone?area=downloads#cyber-nexus");
  assert.match(blackFridayCampaign.cyber.offer, /Universe Pass/);
  assert.equal(blackFridayCampaign.cyberWorks.length, 3);
});

test("packages three Cyber Nexus works in separate desktop and mobile compositions", async () => {
  const slugs = ["01-il-cuore-del-nexus", "02-la-citta-oltre-il-varco", "03-archivio-delle-stelle"];
  for (const slug of slugs) {
    const desktop = new URL(`../campaign/cyber-nexus/delivery/${slug}-desktop-4k.png`, import.meta.url);
    const mobile = new URL(`../campaign/cyber-nexus/delivery/${slug}-mobile-4k.png`, import.meta.url);
    const desktopPreview = new URL(`../public/promotions/black-friday/cyber-nexus/${slug}-desktop-preview.webp`, import.meta.url);
    const mobilePreview = new URL(`../public/promotions/black-friday/cyber-nexus/${slug}-mobile-preview.webp`, import.meta.url);
    const [desktopMeta, mobileMeta, desktopPreviewMeta, mobilePreviewMeta] = await Promise.all([
      sharp(fileURLToPath(desktop)).metadata(),
      sharp(fileURLToPath(mobile)).metadata(),
      sharp(fileURLToPath(desktopPreview)).metadata(),
      sharp(fileURLToPath(mobilePreview)).metadata(),
    ]);
    assert.deepEqual([desktopMeta.width, desktopMeta.height], [3840, 2160]);
    assert.deepEqual([mobileMeta.width, mobileMeta.height], [2160, 3840]);
    assert.deepEqual([desktopPreviewMeta.width, desktopPreviewMeta.height], [1280, 720]);
    assert.deepEqual([mobilePreviewMeta.width, mobilePreviewMeta.height], [720, 1280]);
  }
});

test("uses real generated imagery and keeps it fully visible", async () => {
  const assets = [
    "../public/promotions/black-friday/countdown-portal-hero-v1.webp",
    "../public/promotions/black-friday/countdown-sticker-frame-v1.webp",
    "../public/promotions/black-friday/countdown-clock-emblem-v1.webp",
    "../public/promotions/black-friday/campaign-hero-v1.webp",
    "../public/promotions/black-friday/path-shop-v1.webp",
    "../public/promotions/black-friday/path-pass-v1.webp",
    "../public/promotions/black-friday/path-cyber-nexus-v1.webp",
  ];
  for (const asset of assets) await access(new URL(asset, import.meta.url));

  for (const asset of [assets[1], assets[2], assets[4], assets[5], assets[6]]) {
    const metadata = await sharp(fileURLToPath(new URL(asset, import.meta.url))).metadata();
    assert.equal(metadata.hasAlpha, true);
  }

  const [experience, ribbon, styles] = await Promise.all([
    readFile(new URL("../components/BlackFridayCampaignExperience.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/CurrentDiscountRibbon.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(experience, /countdown-portal-hero-v1\.webp/);
  assert.match(experience, /countdown-sticker-frame-v1\.webp/);
  assert.match(experience, /campaign-hero-v1\.webp/);
  assert.match(experience, /path\.image/);
  assert.match(ribbon, /countdown-clock-emblem-v1\.webp/);
  assert.match(ribbon, /campaign-hero-v1\.webp/);
  assert.match(styles, /\.black-friday-hero-scene[^}]*object-fit:contain;/s);
  assert.match(styles, /\.black-friday-sticker-frame[^}]*object-fit:contain;/s);
  assert.match(styles, /\.black-friday-campaign-hero-inner > img[^}]*object-fit:contain;/s);
  assert.match(styles, /\.black-friday-path > img[^}]*object-fit:contain;/s);
  assert.match(styles, /\.black-friday-rules > img[^}]*object-fit:contain;/s);
});
