import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { resolveArtworkProduct } from "../lib/commercialCatalog.ts";
import {
  horrorArtworkBundles,
  isHorrorArtworkBundleActive,
} from "../lib/horrorArtworkBundles.ts";

test("defines the three approved Halloween collections with three GiWise originals each", () => {
  assert.equal(horrorArtworkBundles.length, 3);
  const allCodes = horrorArtworkBundles.flatMap((bundle) => bundle.artworkCodes);
  assert.equal(allCodes.length, 9);
  assert.equal(new Set(allCodes).size, 9);
  assert.deepEqual(horrorArtworkBundles.map((bundle) => ({ code: bundle.code, title: bundle.title, artworkCodes: [...bundle.artworkCodes] })), [
    { code: "LW-HORROR-BUNDLE-001", title: "Fede Corrotta", artworkCodes: ["LW-ART-036", "LW-ART-057", "LW-ART-067"] },
    { code: "LW-HORROR-BUNDLE-002", title: "Incubi Interiori", artworkCodes: ["LW-ART-020", "LW-ART-051", "LW-ART-059"] },
    { code: "LW-HORROR-BUNDLE-003", title: "Creature del Buio", artworkCodes: ["LW-ART-016", "LW-ART-046", "LW-ART-053"] },
  ]);
  for (const bundle of horrorArtworkBundles) {
    assert.equal(bundle.artworks.length, 3);
    assert.equal(bundle.amountCents, 2490);
    assert.ok(bundle.originalTotalCents > bundle.amountCents);
    assert.ok(bundle.artworks.every((artwork) => artwork.access === "commercial-original"));
  }
});

test("opens and closes the collections at the declared Italian instants", () => {
  assert.equal(isHorrorArtworkBundleActive("2026-09-30T21:59:59Z"), false);
  assert.equal(isHorrorArtworkBundleActive("2026-09-30T22:00:00Z"), true);
  assert.equal(isHorrorArtworkBundleActive("2026-11-01T22:59:59Z"), true);
  assert.equal(isHorrorArtworkBundleActive("2026-11-01T23:00:00Z"), false);
});

test("resolves each collection as one non-stackable commercial product", () => {
  for (const bundle of horrorArtworkBundles) {
    const product = resolveArtworkProduct(bundle.code);
    assert.equal(product?.amountCents, 2490);
    assert.equal(product?.discountEligible, false);
    assert.deepEqual(product?.bundleMembers, [...bundle.artworkCodes]);
  }
});

test("keeps every collection preview fully visible", async () => {
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const start = styles.indexOf(".horror-bundle-artworks img");
  const end = styles.indexOf("}", start);
  assert.ok(start >= 0);
  assert.match(styles.slice(start, end), /object-fit:contain/);
  assert.doesNotMatch(styles.slice(start, end), /object-fit:cover/);
});

test("states publicly that the collections contain only existing GiWise originals", async () => {
  const page = await readFile(new URL("../app/arte/page.tsx", import.meta.url), "utf8");
  assert.match(page, /Tre collezioni per entrare nell’ombra/);
  assert.match(page, /opere originali GiWise già presenti in vetrina/);
  assert.match(page, /nessuna immagine artificiale/);
});

test("uses the original Halloween backdrop and a real second-by-second promotion timer", async () => {
  await access(new URL("../public/backgrounds/halloween-art-collections-classic-v2.webp", import.meta.url));
  const [timer, page, styles] = await Promise.all([
    readFile(new URL("../components/HorrorPromotionTimer.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/arte/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(timer, /setInterval\(\(\) => setNow\(Date\.now\(\)\), 1000\)/);
  assert.match(timer, /HORROR_BUNDLE_STARTS_AT/);
  assert.match(timer, /HORROR_BUNDLE_ENDS_AT/);
  assert.match(page, /<HorrorPromotionTimer preview=\{localPreview\}/);
  assert.match(styles, /halloween-art-collections-classic-v2\.webp/);
});
