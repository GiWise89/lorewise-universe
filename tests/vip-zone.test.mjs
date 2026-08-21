import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Miniflare } from "miniflare";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { getVipDownload, getVipMedia, VIP_AREAS, VIP_EDITORIAL_STATUS, VIP_EXPANSION, VIP_FUORI_TRAMA_DROP, VIP_MEDIA } from "../lib/vipZone.ts";
import { VIP_ARTWORKS, VIP_ART_DROP } from "../data/vip-artworks.ts";
import { VIP_ATELIER, VIP_ATELIER_MEDIA_PRIVATE } from "../data/vip-atelier.ts";
import { VIP_DOWNLOAD_LIBRARY } from "../data/vip-downloads.ts";
import { buildVipMemberProfile, evaluateVipAccess } from "../lib/vipMember.ts";
import { universePassBenefitFromCode } from "../lib/universePass.ts";

test("keeps VIP media streams valid when imported blob size metadata is missing", async () => {
  const source = await readFile(new URL("../app/api/vip-media/route.ts", import.meta.url), "utf8");
  assert.match(source, /object\.size > 0/);
  assert.doesNotMatch(source, /"Content-Length": String\(object\.size\)/);
  assert.match(source, /LOREWISE_LOCAL_VIP_MEDIA_URL/);
});

test("reads every protected VIP image from the persisted local R2 archive", async () => {
  const miniflare = new Miniflare({
    resourcePersistencePath: fileURLToPath(new URL("../.wrangler/state/v3", import.meta.url)),
    workers: [{
      config: {
        name: "lorewise-vip-test",
        type: "worker",
        compatibilityDate: "2026-08-21",
        manifest: {
          mainModule: "index.js",
          modules: { "index.js": { type: "esm", contents: "export default { async fetch() { return new Response('VIP test'); } }" } },
        },
        env: { COMMISSION_UPLOADS: { type: "r2", name: "site-creator-r2" } },
      },
    }],
  });
  try {
    const bucket = await miniflare.getR2Bucket("COMMISSION_UPLOADS");
    const missing = [];
    for (const media of Object.values(VIP_MEDIA)) {
      const object = await bucket.head(media.objectKey);
      if (!object || object.size <= 0) missing.push(media.objectKey);
    }
    assert.deepEqual(missing, []);
  } finally {
    await miniflare.dispose();
  }
});

test("keeps mobile VIP badges and journal labels inside their controls", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\.vip-area-nav button b,\.vip-area-nav \.is-locked b \{ position:static;/);
  assert.match(css, /\.journal-switch-tabs \{ top:56px; overflow:visible; grid-template-columns:repeat\(2,minmax\(0,1fr\)\); \}/);
});

test("separates signed-out, Supporter and Collector VIP access", () => {
  assert.deepEqual(evaluateVipAccess({ authenticated: false, accountActive: false, passActive: false }), { allowed: false, reason: "signed-out" });
  assert.deepEqual(evaluateVipAccess({ authenticated: true, accountActive: true, passActive: false }), { allowed: false, reason: "pass-required" });

  const supporter = buildVipMemberProfile(universePassBenefitFromCode("LW-PASS-SUPPORTER"));
  const collector = buildVipMemberProfile(universePassBenefitFromCode("LW-PASS-COLLECTOR"));
  assert.equal(supporter.collectorDossiers, false);
  assert.equal(supporter.artworkDiscountPercent, 10);
  assert.equal(collector.collectorDossiers, true);
  assert.equal(collector.artworkDiscountPercent, 20);
  assert.match(collector.accessLabel, /dossier estesi/i);
});

test("keeps the authenticated owner Collector grant available in local previews without Netlify DB", async () => {
  const source = await readFile(new URL("../lib/vipAccess.ts", import.meta.url), "utf8");
  const localGrant = source.indexOf("permanentOwnerPass && !netlifyDatabaseIsConfigured() && await isLocalLoreWiseRequest()");
  const databaseSync = source.indexOf("await syncLoreWiseCustomer(user)");

  assert.notEqual(localGrant, -1);
  assert.notEqual(databaseSync, -1);
  assert.ok(localGrant < databaseSync);
  assert.match(source, /isPermanentCollectorEmail\(user\.email\)/);
  assert.match(source, /universePassBenefitFromCode\("LW-PASS-COLLECTOR"\)/);
});

test("defines the approved spoiler-safe VIP expansion reveal", () => {
  assert.equal(VIP_EXPANSION.title, "Il Rogo delle Dieci Porte");
  assert.equal(VIP_EXPANSION.faction.name, "La Corte del Rogo Profondo");
  assert.deepEqual(VIP_EXPANSION.characters.map((character) => character.name), ["Vharokh", "Velisara"]);
  assert.equal(VIP_EXPANSION.status, "In progettazione");
  assert.equal(VIP_EXPANSION.release, "Dicembre 2026");
  const editorialText = JSON.stringify(VIP_EXPANSION).toLocaleLowerCase("it");
  assert.doesNotMatch(editorialText, /multiplayer|arena delle cicatrici/);
  assert.doesNotMatch(editorialText, /nel finale|alla fine|finale del gioco/);
});

test("allows only declared private VIP media identifiers", () => {
  assert.equal(Object.keys(VIP_MEDIA).length, 83);
  assert.equal(getVipMedia("rogo-key-art")?.contentType, "image/png");
  assert.equal(getVipMedia("vharokh-dossier")?.objectKey.includes("vharokh-sagoma"), true);
  assert.equal(getVipMedia("velisara-dossier")?.objectKey.includes("velisara-sagoma"), true);
  assert.equal(getVipDownload("desktop-vip-01")?.downloadName.includes("desktop-vip-01"), true);
  assert.equal(getVipDownload("desktop-vip-02")?.downloadName.includes("desktop-vip-02"), true);
  assert.equal(getVipDownload("desktop-vip-03")?.downloadName.includes("desktop-vip-03"), true);
  assert.equal(getVipDownload("lorewise-match-01")?.downloadName.includes("lorewise-match"), true);
  assert.equal(getVipMedia("lorewise-match-01-preview")?.contentType, "image/webp");
  assert.equal(getVipDownload("rogo-key-art"), null);
  assert.equal(getVipMedia("../../public/secret"), null);
  assert.equal(getVipMedia(null), null);
});

test("offers the three original desktop files as VIP rewards", () => {
  assert.deepEqual(VIP_EXPANSION.rewards.map((reward) => reward.resolution), ["1672 × 941", "1672 × 941", "1536 × 1024"]);
  assert.equal(VIP_EXPANSION.rewards.every((reward) => reward.credit === "Opera originale GiWise Studio"), true);
  assert.equal(new Set(VIP_EXPANSION.rewards.map((reward) => reward.packageId)).size, 3);
  assert.equal(VIP_EXPANSION.downloadBundle.packageId, "twr-vip-drop-01-completo");
});

test("keeps downloads in a standalone VIP library with two collections", () => {
  assert.deepEqual(VIP_DOWNLOAD_LIBRARY.collections.map((collection) => collection.id), ["the-wound-remembers", "lorewise-match"]);
  assert.equal(VIP_DOWNLOAD_LIBRARY.collections.flatMap((collection) => collection.items).length, 6);
  assert.deepEqual(VIP_DOWNLOAD_LIBRARY.collections.map((collection) => collection.bundle.packageId), ["twr-vip-drop-01-completo", "lorewise-match-vip-completo"]);
  assert.equal(VIP_DOWNLOAD_LIBRARY.collections.flatMap((collection) => collection.items).every((item) => getVipMedia(item.image)?.contentType === "image/webp"), true);
  assert.equal(VIP_DOWNLOAD_LIBRARY.collections.flatMap((collection) => collection.items).every((item) => Boolean(getVipDownload(item.downloadAsset))), true);
});

test("organizes the VIP archive into explicit editorial areas", () => {
  assert.deepEqual(VIP_AREAS.map((area) => area.id), ["games", "art", "atelier", "downloads"]);
  assert.equal(VIP_AREAS.find((area) => area.id === "games")?.available, true);
  assert.equal(VIP_AREAS.find((area) => area.id === "art")?.available, true);
  assert.equal(VIP_AREAS.find((area) => area.id === "atelier")?.available, true);
  assert.equal(VIP_AREAS.every((area) => area.update.length > 0), true);
  assert.equal(VIP_EDITORIAL_STATUS.lastUpdated, "21 agosto 2026");
  assert.equal(VIP_EDITORIAL_STATUS.nextDrop, "In preparazione");
});

test("builds the Atelier as protected narrative processes rather than an anonymous gallery", () => {
  assert.equal(VIP_ATELIER.processes.length, 2);
  assert.equal(VIP_ATELIER.processes.reduce((total, process) => total + process.phases.length, 0), 8);
  assert.equal(VIP_ATELIER.notebook.length, 4);
  assert.equal(VIP_ATELIER.notebook.reduce((total, entry) => total + entry.mediaIds.length, 0), 5);
  assert.equal(VIP_ATELIER.studies.length, 2);
  assert.equal(VIP_ATELIER_MEDIA_PRIVATE.length, 15);
  assert.equal(new Set(VIP_ATELIER_MEDIA_PRIVATE.map((media) => media.mediaId)).size, 15);
  assert.equal(VIP_ATELIER_MEDIA_PRIVATE.every((media) => getVipMedia(media.mediaId)?.contentType === "image/webp"), true);
  assert.doesNotMatch(JSON.stringify(VIP_ATELIER), /sourceFile|bozze progetti|bozze e compl/);
});

test("separates commercial VIP originals from exhibition-only works", () => {
  const commercial = VIP_ARTWORKS.filter((artwork) => artwork.mode === "commercial");
  const exhibition = VIP_ARTWORKS.filter((artwork) => artwork.mode === "exhibition");
  assert.equal(VIP_ARTWORKS.length, 48);
  assert.equal(commercial.length, 11);
  assert.equal(exhibition.length, 37);
  assert.equal(VIP_ARTWORKS.every((artwork) => artwork.title && !artwork.title.startsWith("Opera ")), true);
  assert.equal(VIP_ARTWORKS.every((artwork) => artwork.lore.length > 40), true);
  assert.equal(commercial.every((artwork) => typeof artwork.priceCents === "number" && artwork.priceCents > 0), true);
  assert.equal(exhibition.every((artwork) => !("priceCents" in artwork)), true);
  assert.equal(VIP_ART_DROP.featuredCode, "LW-VIP-ART-003");
  assert.equal(VIP_ARTWORKS.every((artwork) => getVipMedia(artwork.mediaId)?.contentType === "image/webp"), true);
});

test("publishes one spoiler-safe Fuori Trama development novelty", () => {
  assert.equal(VIP_FUORI_TRAMA_DROP.code, "FT-ROSTER-CANTANTI-01");
  assert.equal(VIP_FUORI_TRAMA_DROP.game, "Fuori Trama");
  assert.equal(VIP_FUORI_TRAMA_DROP.title, "Cantanti fuori trama");
  assert.deepEqual(VIP_FUORI_TRAMA_DROP.roster.map((character) => character.name), ["Salmo", "Noyz Narcos", "Kid Yugi", "Biggie", "2Pac"]);
  assert.match(VIP_FUORI_TRAMA_DROP.closing, /gratuito per tutti/i);
  assert.match(VIP_FUORI_TRAMA_DROP.closing, /non un accesso esclusivo al gioco/i);
  assert.match(VIP_FUORI_TRAMA_DROP.promise, /tantissimi altri cantanti/i);
  assert.equal(VIP_FUORI_TRAMA_DROP.communityVote.code, "FT-CANTANTI-COMMUNITY-01");
  assert.match(VIP_FUORI_TRAMA_DROP.communityVote.description, /candidatura vale anche come tuo voto/i);
  assert.match(VIP_FUORI_TRAMA_DROP.communityVote.rule, /due cantanti più votati/i);
  assert.match(VIP_FUORI_TRAMA_DROP.communityVote.rule, /verifica dei diritti/i);
  assert.match(VIP_FUORI_TRAMA_DROP.rightsNote, /audit dei diritti/i);
  assert.equal(VIP_FUORI_TRAMA_DROP.roster.every((character) => getVipMedia(character.image)?.contentType === "image/jpeg"), true);
});
