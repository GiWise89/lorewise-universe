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

export type CodexIndexFacets = {
  categories: string[];
  universes: string[];
  statuses: string[];
  alphabet: Array<[string, number]>;
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
      statusLabel: inReview ? "In preparazione" : "Dossier completo",
      searchTerms: [...new Set([...entry.searchTerms, entry.catalog.category, ...categories, ...codexUniverseAliases(entry.catalog.universe)])],
    };
  });
}

export function createCodexIndexFacets(entries: CodexIndexEntry[]): CodexIndexFacets {
  const alphabet = new Map<string, number>();
  entries.forEach((entry) => {
    const initial = entry.displayTitle.normalize("NFD").replace(/[\u0300-\u036f]/g, "").match(/[A-Z]/i)?.[0]?.toLocaleUpperCase("it") || "#";
    alphabet.set(initial, (alphabet.get(initial) || 0) + 1);
  });
  return {
    categories: [...new Set(entries.flatMap((entry) => entry.categories))].sort(),
    universes: [...new Set(entries.map((entry) => entry.universe))].sort(),
    statuses: [...new Set(entries.map((entry) => entry.statusLabel))].sort(),
    alphabet: [...alphabet.entries()].sort(([first], [second]) => first.localeCompare(second, "it")),
  };
}
