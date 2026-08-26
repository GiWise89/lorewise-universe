import assert from "node:assert/strict";
import test from "node:test";
import { strFromU8, strToU8, unzipSync } from "fflate";
import { createVipDownloadArchive, getVipDownloadPackage, VIP_DOWNLOAD_PACKAGES } from "../lib/vipDownloads.ts";

test("declares twelve individual VIP packages and three complete collections", () => {
  assert.equal(Object.keys(VIP_DOWNLOAD_PACKAGES).length, 15);
  assert.equal(getVipDownloadPackage("twr-desktop-vip-01")?.sources.length, 1);
  assert.equal(getVipDownloadPackage("twr-vip-drop-01-completo")?.sources.length, 3);
  assert.equal(getVipDownloadPackage("lorewise-match-desktop-vip-01")?.sources.length, 1);
  assert.equal(getVipDownloadPackage("lorewise-match-vip-completo")?.sources.length, 3);
  assert.equal(getVipDownloadPackage("cyber-nexus-heart-desktop-vip")?.sources.length, 1);
  assert.equal(getVipDownloadPackage("cyber-nexus-vip-completo")?.sources.length, 6);
  assert.equal(getVipDownloadPackage("../../private"), null);
});

test("builds the complete Cyber Nexus ZIP without altering source bytes", async () => {
  const downloadPackage = getVipDownloadPackage("cyber-nexus-vip-completo");
  assert.ok(downloadPackage);
  const sourceFiles = new Map(downloadPackage.sources.map((source, index) => [source.mediaId, strToU8(`original-${index + 1}`)]));
  const originalsBefore = downloadPackage.sources.map((source) => Array.from(sourceFiles.get(source.mediaId)));
  const { archive, manifest } = await createVipDownloadArchive(downloadPackage, sourceFiles);
  const unpacked = unzipSync(archive);
  assert.equal(manifest.files.length, 6);
  assert.equal(manifest.files.every((file) => /^[a-f0-9]{64}$/.test(file.sha256)), true);
  assert.equal(strFromU8(unpacked["LEGGIMI.txt"]).includes("preparato automaticamente"), true);
  assert.equal(strFromU8(unpacked["CONDIZIONI-USO-PERSONALE.txt"]).includes("Non è consentito"), true);
  assert.equal(JSON.parse(strFromU8(unpacked["MANIFEST-SHA256.json"])).packageId, downloadPackage.id);
  assert.deepEqual(downloadPackage.sources.map((source) => Array.from(sourceFiles.get(source.mediaId))), originalsBefore);
  for (const source of downloadPackage.sources) assert.ok(unpacked[source.archiveName]);
});

test("refuses to create an incomplete VIP package", async () => {
  const downloadPackage = getVipDownloadPackage("twr-desktop-vip-01");
  assert.ok(downloadPackage);
  await assert.rejects(() => createVipDownloadArchive(downloadPackage, new Map()), /Manca il file VIP richiesto/);
});
