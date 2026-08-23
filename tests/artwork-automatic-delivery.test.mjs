import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { automaticArtworkDeliveryCount, automaticArtworkDeliveryReady, getAutomaticArtworkDelivery } from "../lib/automaticArtworkDelivery.ts";
import { commercialOriginalArtworks } from "../lib/artCatalog.ts";
import { VIP_ARTWORKS_PRIVATE } from "../data/vip-artworks.ts";
import { resolveArtworkProduct } from "../lib/commercialCatalog.ts";
import catalog from "../data/automatic-artwork-deliveries.json" with { type: "json" };

const root = path.resolve(import.meta.dirname, "..");

async function fileHash(filePath) {
  const hash = createHash("sha256");
  await new Promise((resolve, reject) => fs.createReadStream(filePath)
    .on("data", (chunk) => hash.update(chunk))
    .on("end", resolve)
    .on("error", reject));
  return hash.digest("hex");
}

test("covers every commercial original with one automatic package", () => {
  const vipCodes = VIP_ARTWORKS_PRIVATE.filter((artwork) => artwork.mode === "commercial").map((artwork) => artwork.code);
  assert.equal(automaticArtworkDeliveryCount(), 50);
  assert.equal(catalog.count, commercialOriginalArtworks.length + vipCodes.length);
  assert.deepEqual(
    catalog.deliveries.map((delivery) => delivery.code),
    [...commercialOriginalArtworks.map((artwork) => artwork.code), ...vipCodes].sort(),
  );
  assert.equal(getAutomaticArtworkDelivery("LW-ART-001"), null);
  assert.equal(getAutomaticArtworkDelivery("LW-VIP-EXH-001"), null);
  assert.equal(getAutomaticArtworkDelivery("../../private"), null);
});

test("all automatic packages match their approved size and SHA-256", async () => {
  for (const delivery of catalog.deliveries) {
    const filePath = path.resolve(root, "output", "artwork-deliveries", delivery.localPackage);
    assert.equal(filePath.startsWith(path.resolve(root, "output", "artwork-deliveries") + path.sep), true);
    const info = fs.statSync(filePath);
    assert.equal(info.size, delivery.size, `${delivery.code}: dimensione`);
    assert.equal(await fileHash(filePath), delivery.sha256, `${delivery.code}: SHA-256`);
  }
});

test("remote readiness requires exact private-object metadata outside trial mode", async () => {
  const delivery = getAutomaticArtworkDelivery("LW-ART-003");
  assert.ok(delivery);
  const validBucket = { head: async () => ({ size: delivery.size, customMetadata: { sha256: delivery.sha256 } }) };
  const wrongBucket = { head: async () => ({ size: delivery.size + 1, customMetadata: { sha256: delivery.sha256 } }) };
  assert.equal(await automaticArtworkDeliveryReady(validBucket, delivery.code), true);
  assert.equal(await automaticArtworkDeliveryReady(wrongBucket, delivery.code), false);
  assert.equal(await automaticArtworkDeliveryReady(undefined, delivery.code), false);
  assert.equal(await automaticArtworkDeliveryReady(undefined, delivery.code, true), true);
});

test("VIP originals use the shared artwork checkout and automatic delivery", () => {
  const product = resolveArtworkProduct("LW-VIP-ART-003");
  assert.ok(product);
  assert.equal(product.productType, "artwork");
  assert.equal(product.resourceType, "artwork");
  assert.equal(product.amountCents, 1790);
  assert.equal(product.downloadLimit, 3);
  assert.ok(getAutomaticArtworkDelivery(product.code));
  assert.equal(resolveArtworkProduct("LW-VIP-EXH-001"), null);
});
