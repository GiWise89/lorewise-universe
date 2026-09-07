import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const page = await readFile(new URL("../app/cronache-del-nexus/page.tsx", import.meta.url), "utf8");
const styles = await readFile(new URL("../app/cronache-del-nexus/news.css", import.meta.url), "utf8");

test("organizes Novità dal Nexus into five finite editorial sections", () => {
  for (const section of ["novita", "giochi", "arte", "promozioni", "in-arrivo"]) {
    assert.match(page, new RegExp(`id="${section}"`));
    assert.match(page, new RegExp(`id: "${section}"`));
    assert.match(page, new RegExp(`activeSection === "${section}"`));
  }
  assert.match(page, /sezione=\$\{item\.id\}/);
  assert.match(page, /aria-current=\{activeSection === item\.id \? "page" : undefined\}/);
  assert.doesNotMatch(page, /NexusNewsSpotlight|NexusChroniclesFeed|vista=archivio|infinite/i);
  assert.equal((page.match(/nexus-edition-section/g) ?? []).length, 5);
});

test("uses five dedicated generated illustrations and protected artwork previews without cropping", async () => {
  const images = ["nexus-hero-v1.webp", "novita-famigli-v1.webp", "giochi-crocevia-v1.webp", "arte-atelier-v1.webp", "promozioni-invito-v1.webp"];
  for (const image of images) {
    assert.match(page, new RegExp(image.replace(".", "\\.")));
    const bytes = await readFile(new URL(`../public/novita/nexus-sections/${image}`, import.meta.url));
    assert.ok(bytes.length > 100_000);
  }
  assert.match(styles, /object-fit:contain/);
  assert.doesNotMatch(styles, /object-fit:\s*cover/);
  assert.match(styles, /\.nexus-art-frame img \{ object-fit:contain!important;/);
});

test("keeps typography readable and layouts non-overlapping on mobile", () => {
  assert.match(styles, /font-size:clamp\(1rem/);
  assert.match(styles, /font:700 clamp\(3rem,6vw,5\.6rem\)/);
  assert.match(styles, /font-size:\.9rem/);
  assert.match(styles, /\.nexus-edition-hero-copy \{ width:min\(1180px,calc\(100% - 40px\)\); margin-inline:auto;/);
  assert.match(styles, /@media \(max-width:620px\)/);
  assert.match(styles, /\.nexus-edition-split,.nexus-art-intro,.nexus-edition-heading \{ grid-template-columns:1fr; \}/);
  assert.match(styles, /\.nexus-art-ribbon > a \{ grid-template-columns:1fr;/);
});

test("shows current games, latest art, promotions and direct next paths", () => {
  assert.match(page, /gameProjects\.slice\(0, 3\)/);
  assert.match(page, /catalogArtworks\.slice\(-3\)\.reverse\(\)/);
  assert.match(page, /getActiveCommissionPromotion/);
  assert.match(page, /WELCOME_COMMISSION_OFFER/);
  assert.match(page, /LoreWise Codex/);
  assert.match(page, /Dove nascono i mondi/);
  assert.match(page, /LoreWise VIP/);
});
