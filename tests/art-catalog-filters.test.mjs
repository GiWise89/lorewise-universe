import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("keeps the art filters in one closable responsive panel", async () => {
  const source = await readFile(new URL("../components/ArtCatalog.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(source, /useState<FilterPanel \| null>\(null\)/);
  assert.equal((source.match(/aria-controls="art-filter-panel"/g) ?? []).length, 4);
  assert.match(source, /Chiudi filtri/);
  assert.match(source, /setOpenPanel\(\(current\) => current === panel \? null : panel\)/);
  assert.doesNotMatch(source, /<details>|<summary>/);
  assert.match(source, /featuredArchiveCodes = \["LW-ART-081", "LW-ART-080"\]/);
  assert.match(source, /Nuova in vetrina/);

  assert.match(css, /\.art-filter-panel \{ display: grid;/);
  assert.match(source, /\{openPanel \? <section className="art-filter-panel"/);
  assert.doesNotMatch(source, /className="art-filter-panel"[^>]*hidden=/);
  assert.match(css, /@media \(max-width: 640px\)[\s\S]*?\.art-filter-panel-control label \{ grid-template-columns: 1fr;/);
  assert.doesNotMatch(css, /\.art-index-nav details\[open\] label/);
});
