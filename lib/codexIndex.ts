import type { CodexEntry } from "@/lib/codex";
import { canonicalCodexUniverse, codexUniverseAliases, deriveCodexCategories } from "@/lib/codexTaxonomy";

export type CodexIndexEntry = {
  slug: string;
  origin: CodexEntry["catalog"]["origin"];
  displayTitle: string;
  imageSrc: string;
  imageWidth: number;
  imageHeight: number;
  category: string;
  categories: string[];
  descriptor: string;
  universe: string;
  summary: string;
  statusLabel: string;
  searchTerms: string[];
};

export function codexThumbnailSrc(source: string) {
  return source
    .replace(/^\/codex\/characters\//, "/codex/thumbnails/")
    .replace(/\.[^.]+$/, ".webp");
}

function compactSummary(value: string, maximum = 310) {
  if (value.length <= maximum) return value;
  const candidate = value.slice(0, maximum + 1);
  const sentenceEnd = Math.max(candidate.lastIndexOf(". "), candidate.lastIndexOf("! "), candidate.lastIndexOf("? "));
  const cut = sentenceEnd >= Math.floor(maximum * .5) ? sentenceEnd + 1 : candidate.lastIndexOf(" ");
  return `${candidate.slice(0, Math.max(cut, Math.floor(maximum * .7))).trim()}…`;
}

// L'indice interattivo non deve serializzare biografie, fonti, relazioni e
// cronologie di centinaia di dossier. Questi dati restano nelle singole pagine.
export function createCodexIndexEntries(entries: CodexEntry[]): CodexIndexEntry[] {
  return entries.map((entry) => {
    const categories = deriveCodexCategories(entry);
    const category = categories[0];
    const universe = canonicalCodexUniverse(entry.catalog.universe);
    const genericCopy = /appartiene a|figura appartenente|il percorso di .* viene letto/i.test(entry.summary.value);
    const inReview = entry.catalog.dossierStatus === "in-review" || genericCopy;
    return {
      slug: entry.slug,
      origin: entry.catalog.origin,
      displayTitle: entry.displayTitle,
      imageSrc: entry.image.src,
      imageWidth: entry.image.width,
      imageHeight: entry.image.height,
      category,
      categories,
      descriptor: entry.narrative[4]?.value ?? "Dossier enciclopedico",
      universe,
      summary: compactSummary(entry.summary.value),
      statusLabel: inReview ? "Revisione editoriale" : "Dossier verificato",
      searchTerms: [...new Set([...entry.searchTerms, entry.catalog.category, ...categories, ...codexUniverseAliases(entry.catalog.universe)])],
    };
  });
}
