import assert from "node:assert/strict";
import test from "node:test";
import { catalogArtworks } from "../lib/artCatalog.ts";
import { artworkCategories, artworkGenreLabels } from "../lib/artworkTaxonomy.ts";

test("assigns a reviewed specific category to every public artwork", () => {
  assert.equal(catalogArtworks.length, 76);
  assert.equal(Object.keys(artworkCategories).length, 76);

  for (const artwork of catalogArtworks) {
    const number = Number(artwork.code.slice(-3));
    assert.equal(artwork.category, artworkCategories[number], `${artwork.code}: categoria non sincronizzata`);
    assert.ok(artwork.category.includes(" · "), `${artwork.code}: categoria non specifica`);
    assert.ok(!artworkGenreLabels.includes(artwork.category), `${artwork.code}: categoria ancora generica`);
  }
});

test("keeps Obsession in the independent horror cinema exhibition category", () => {
  const obsession = catalogArtworks.find((artwork) => artwork.code === "LW-ART-080");
  assert.equal(obsession?.category, "Cinema horror indipendente · Fan art");
  assert.equal(obsession?.access, "exhibition-only");
});

test("Team Rocket is a protected exhibition-only fan art in the newest archive slot", () => {
  const artwork = catalogArtworks.find((entry) => entry.code === "LW-ART-081");
  assert.ok(artwork);
  assert.equal(artwork?.title, "Team Rocket · Jessie in scena");
  assert.equal(artwork?.kindLabel, "Fan art");
  assert.equal(artwork?.access, "exhibition-only");
  assert.equal(artwork?.genre, "Anime e manga");
});
