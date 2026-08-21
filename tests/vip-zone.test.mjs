import assert from "node:assert/strict";
import test from "node:test";
import { getVipDownload, getVipMedia, VIP_AREAS, VIP_EXPANSION, VIP_FUORI_TRAMA_DROP, VIP_MEDIA } from "../lib/vipZone.ts";
import { VIP_ARTWORKS, VIP_ART_DROP } from "../data/vip-artworks.ts";
import { VIP_ATELIER, VIP_ATELIER_MEDIA_PRIVATE } from "../data/vip-atelier.ts";
import { VIP_DOWNLOAD_LIBRARY } from "../data/vip-downloads.ts";

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
