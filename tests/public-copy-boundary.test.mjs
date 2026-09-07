import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const publicSources = await Promise.all([
  "../app/account/page.tsx",
  "../app/shop/page.tsx",
  "../app/enciclopedia/page.tsx",
  "../app/enciclopedia/[slug]/page.tsx",
  "../components/CodexIndex.tsx",
].map((path) => readFile(new URL(path, import.meta.url), "utf8")));

test("public pages describe visitor benefits instead of internal workflow", () => {
  const source = publicSources.join("\n");
  for (const phrase of ["collaudo completo", "stato editoriale", "strumento editoriale", "Responsabile</strong>", "Perimetro verificato", "Metodo delle fonti", "prodotti verificati"]) {
    assert.doesNotMatch(source, new RegExp(phrase, "i"));
  }
});
