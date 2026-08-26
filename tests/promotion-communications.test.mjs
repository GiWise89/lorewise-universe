import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { horrorArtworkBundles } from "../lib/horrorArtworkBundles.ts";
import { renderMarketingEmail } from "../lib/marketingEmail.ts";
import {
  getPromotionCommunicationPack,
  promotionCommunicationPacks,
} from "../lib/promotionCommunications.ts";

test("gives every promotion an email and a channel-specific social kit", () => {
  assert.ok(promotionCommunicationPacks.length > 0);
  for (const pack of promotionCommunicationPacks) {
    assert.ok(pack.code);
    assert.ok(pack.title);
    assert.ok(pack.period);
    assert.ok(pack.landingPath.startsWith("/"));
    assert.ok(pack.email.subject);
    assert.ok(pack.email.heading);
    assert.ok(pack.email.body);
    assert.ok(pack.email.actionLabel);
    assert.equal(pack.email.actionUrl, pack.landingPath);
    assert.deepEqual(pack.social.map((post) => post.channel), ["instagram_facebook", "tiktok_reels", "discord"]);
    for (const post of pack.social) {
      assert.ok(post.copy);
      assert.ok(post.assets.length > 0);
      assert.equal(post.actionUrl, pack.landingPath);
    }
  }
});

test("uses the nine protected GiWise previews in the Halloween carousel and vertical sequence", () => {
  const pack = getPromotionCommunicationPack("GW-PROMO-HALLOWEEN-COLLECTIONS-2026");
  assert.ok(pack);
  const expectedAssets = horrorArtworkBundles.flatMap((bundle) => bundle.artworks.map((artwork) => artwork.image));
  assert.equal(expectedAssets.length, 9);
  assert.equal(new Set(expectedAssets).size, 9);
  assert.ok(expectedAssets.every((src) => src.startsWith("/artworks/previews/") && src.endsWith("-preview.jpg")));
  assert.deepEqual(pack.social[0].assets.map((asset) => asset.src), expectedAssets);
  assert.deepEqual(pack.social[1].assets.map((asset) => asset.src), expectedAssets);
});

test("renders the Halloween email with its direct collection path", () => {
  const pack = getPromotionCommunicationPack("GW-PROMO-HALLOWEEN-COLLECTIONS-2026");
  assert.ok(pack);
  const rendered = renderMarketingEmail(pack.email, "https://example.test/unsubscribe");
  assert.equal(rendered.subject, pack.email.subject);
  assert.match(rendered.html, /Fede Corrotta/);
  assert.match(rendered.html, /Incubi Interiori/);
  assert.match(rendered.html, /Creature del Buio/);
  assert.match(rendered.html, /href="\/arte#collezioni-horror"/);
  assert.match(rendered.html, /https:\/\/example\.test\/unsubscribe/);
});

test("keeps local preview manual and all social artwork fully visible", async () => {
  const [dashboard, page, localPreviewPage, styles] = await Promise.all([
    readFile(new URL("../components/MarketingCampaignDashboard.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/gestione-comunicazioni/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/anteprima-comunicazioni/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(dashboard, /Solo anteprima · nessun invio/);
  assert.match(dashboard, /pubblicazione sempre manuale/);
  assert.match(dashboard, /Copia testo/);
  assert.match(page, /LOREWISE_LOCAL_CALENDAR_PREVIEW/);
  assert.match(page, /anteprima === "halloween"/);
  assert.match(localPreviewPage, /LOREWISE_LOCAL_CALENDAR_PREVIEW !== "true"/);
  assert.match(localPreviewPage, /GW-PROMO-HALLOWEEN-COLLECTIONS-2026/);
  const start = styles.indexOf(".marketing-social-assets img");
  const end = styles.indexOf("}", start);
  assert.ok(start >= 0);
  assert.match(styles.slice(start, end), /object-fit:contain/);
  assert.doesNotMatch(styles.slice(start, end), /object-fit:cover/);
});
