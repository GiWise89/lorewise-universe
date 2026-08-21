import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "..");
const registry = JSON.parse(fs.readFileSync(path.join(projectRoot, "data", "codex", "fuori-trama-registry.generated.json"), "utf8"));
const researchRoot = path.join(projectRoot, "data", "codex", "research");
const outputPath = path.join(researchRoot, "encyclopedic-discovery.generated.json");
const originals = new Set(["The Wound Remembers", "LoreWise Originals"]);
const candidates = registry.filter((record) => !originals.has(record.franchise));
const existing = fs.existsSync(outputPath) ? JSON.parse(fs.readFileSync(outputPath, "utf8")) : [];
const byId = new Map(existing.map((record) => [record.id, record]));

fs.mkdirSync(researchRoot, { recursive: true });

const queryOverrides = {
  "fuffi-isabelle": "Fuffi Animal Crossing",
  "marco-e-mirco": "Marco e Mirco Animal Crossing",
  "alpaca-e-merino": "Alpaca Merino Animal Crossing",
  "agostina-e-filomena": "Agostina Filomena Animal Crossing",
  "satana-south-park": "Satan South Park character",
  "freezer": "Freezer Dragon Ball",
  "m-bison-street-fighter": "M. Bison Street Fighter",
  "vega-street-fighter": "Vega Street Fighter character",
  "king-tekken": "King Tekken character",
};

const clean = (value) => value
  .replaceAll(/<[^>]+>/g, " ")
  .replaceAll(/\s+/g, " ")
  .trim();

async function wikipediaSearch(language, query) {
  const parameters = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    generator: "search",
    gsrsearch: query,
    gsrlimit: "3",
    prop: "extracts|pageprops|info",
    exintro: "1",
    explaintext: "1",
    exchars: "2200",
    inprop: "url",
    origin: "*",
  });
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await fetch(`https://${language}.wikipedia.org/w/api.php?${parameters}`, {
      headers: { "User-Agent": "LoreWise-Codex-Research/1.0 (lorewise.archive@gmail.com)" },
    });
    if (response.ok) {
      const payload = await response.json();
      return payload.query?.pages ?? [];
    }
    if (response.status !== 429 || attempt === 4) throw new Error(`${language} Wikipedia ${response.status}`);
    await new Promise((resolve) => setTimeout(resolve, 1200 * (attempt + 1)));
  }
  return [];
}

function scorePage(page, record) {
  const haystack = `${page.title} ${page.extract ?? ""}`.toLocaleLowerCase("it");
  const nameTokens = record.name.toLocaleLowerCase("it").split(/[^\p{L}\p{N}]+/u).filter((token) => token.length > 2);
  const franchiseTokens = record.franchise.toLocaleLowerCase("it").split(/[^\p{L}\p{N}]+/u).filter((token) => token.length > 2);
  let score = nameTokens.reduce((total, token) => total + (haystack.includes(token) ? 3 : 0), 0);
  score += franchiseTokens.reduce((total, token) => total + (haystack.includes(token) ? 2 : 0), 0);
  if (page.pageprops?.disambiguation !== undefined) score -= 8;
  if (!page.extract) score -= 4;
  return score;
}

async function research(record) {
  const query = queryOverrides[record.id] ?? `${record.name} ${record.franchise}`;
  let language = "it";
  let pages = await wikipediaSearch(language, query);
  let ranked = pages.map((page) => ({ page, score: scorePage(page, record) })).sort((a, b) => b.score - a.score);
  if (!ranked.length || ranked[0].score < 3) {
    language = "en";
    pages = await wikipediaSearch(language, query);
    ranked = pages.map((page) => ({ page, score: scorePage(page, record) })).sort((a, b) => b.score - a.score);
  }
  const selected = ranked[0];
  return {
    id: record.id,
    name: record.name,
    franchise: record.franchise,
    query,
    status: selected && selected.score >= 3 ? "candidate-found" : "manual-review",
    language,
    title: selected?.page.title ?? null,
    url: selected?.page.fullurl ?? null,
    wikibaseItem: selected?.page.pageprops?.wikibase_item ?? null,
    extract: selected?.page.extract ? clean(selected.page.extract) : null,
    matchScore: selected?.score ?? null,
    alternatives: ranked.slice(1).map(({ page, score }) => ({ title: page.title, url: page.fullurl, score })),
    note: "Fonte secondaria usata soltanto per disambiguazione e scoperta. Il dossier richiede comunque fonti ufficiali o opere primarie.",
  };
}

let completed = 0;
const pending = candidates.filter((record) => !byId.has(record.id) || byId.get(record.id)?.status === "request-error");
for (let index = 0; index < pending.length; index += 2) {
  const batch = pending.slice(index, index + 2);
  const results = await Promise.all(batch.map(async (record) => {
    try {
      return await research(record);
    } catch (error) {
      return { id: record.id, name: record.name, franchise: record.franchise, status: "request-error", error: error instanceof Error ? error.message : String(error) };
    }
  }));
  for (const result of results) byId.set(result.id, result);
  completed += results.length;
  fs.writeFileSync(outputPath, `${JSON.stringify([...byId.values()], null, 2)}\n`, "utf8");
  if (completed % 40 === 0 || completed === pending.length) console.log(`Ricerca preliminare: ${completed}/${pending.length}`);
  await new Promise((resolve) => setTimeout(resolve, 600));
}

const output = [...byId.values()];
const summary = Map.groupBy(output, (record) => record.status);
console.log(JSON.stringify(Object.fromEntries([...summary].map(([status, records]) => [status, records.length])), null, 2));
