import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
const registry = read("data/codex/fuori-trama-registry.generated.json");
const originals = new Set(read("data/codex/original-dossiers.generated.json").map((entry) => entry.slug));
const candidates = registry.filter((record) => !originals.has(record.id));
const peopleFranchises = new Set(["Creator italiani", "Cucina & Intrattenimento", "Cinema e arti marziali", "Cinema classico", "Commedia italiana", "Bud Spencer & Terence Hill", "Stanlio e Ollio"]);
const fanArtFranchises = new Set(["Carte Extra · Fan Art", "GiWise Fan Art"]);
const outputPath = path.join(root, "data", "codex", "research", "deep-character-packs.generated.json");
const existing = fs.existsSync(outputPath) ? read("data/codex/research/deep-character-packs.generated.json") : [];
const byId = new Map(existing.map((entry) => [entry.id, entry]));
const userAgent = "LoreWise-Codex-Research/2.0 (editorial research; lorewise.archive@gmail.com)";

const queryOverrides = {
  "fuffi-isabelle": "Isabelle Animal Crossing",
  "marco-e-mirco": "Timmy Tommy Animal Crossing",
  "alpaca-e-merino": "Reese Cyrus Animal Crossing",
  "agostina-e-filomena": "Mabel Sable Animal Crossing",
  "walter-white": "Walter White Breaking Bad character",
  "batman": "Batman DC Comics character",
  "fata-madrina-shrek": "Fairy Godmother Shrek character",
  "re-ramses": "King Ramses Courage the Cowardly Dog",
  "annegato-minecraft": "Drowned Minecraft mob",
  "satana-south-park": "Satan South Park character",
  "freezer": "Frieza Dragon Ball character",
  "m-bison-street-fighter": "M. Bison Street Fighter character",
  "vega-street-fighter": "Vega Street Fighter character",
  "king-tekken": "King Tekken character"
  ,"pennywise-1990": "Pennywise 1990 It miniseries character"
  ,"jigsaw-john-kramer": "John Kramer Jigsaw Saw character"
  ,"joe-swanson": "Joe Swanson Family Guy character"
  ,"fata-madrina-shrek": "Fairy Godmother Shrek character"
  ,"marilu-bagge": "Muriel Bagge Courage the Cowardly Dog character"
  ,"giustino-bagge": "Eustace Bagge Courage the Cowardly Dog character"
  ,"tiger-man": "Naoto Date Tiger Mask character"
  ,"bruto-popeye": "Bluto Popeye character"
  ,"lolly-superchicche": "Blossom Powerpuff Girls character"
  ,"dolly-superchicche": "Bubbles Powerpuff Girls character"
  ,"molly-superchicche": "Buttercup Powerpuff Girls character"
  ,"principessa-gommarosa": "Princess Bubblegum Adventure Time character"
  ,"vincent-vega": "Vincent Vega Pulp Fiction character"
  ,"jules-winnfield": "Jules Winnfield Pulp Fiction character"
  ,"baphomet": "Baphomet occult symbol"
  ,"creatura-di-frankenstein": "Frankenstein's monster character"
  ,"tyrannosaurus-rex": "Tyrannosaurus rex dinosaur"
  ,"brachiosaurus": "Brachiosaurus dinosaur"
  ,"bojack-horseman": "BoJack Horseman character"
  ,"cliff-huxtable": "Cliff Huxtable Cosby Show character"
};

const stopWords = new Set(["the", "and", "del", "della", "delle", "degli", "dei", "di", "il", "lo", "la", "le", "un", "una", "club", "serie", "character", "personaggio"]);
const normalize = (value = "") => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("it").replace(/[^a-z0-9]+/g, " ").trim();
const tokens = (value) => normalize(value).split(" ").filter((token) => token.length > 2 && !stopWords.has(token));
const cleanText = (value = "") => value
  .replace(/<style[\s\S]*?<\/style>/gi, " ")
  .replace(/<script[\s\S]*?<\/script>/gi, " ")
  .replace(/<sup[\s\S]*?<\/sup>/gi, " ")
  .replace(/<[^>]+>/g, " ")
  .replaceAll("&nbsp;", " ")
  .replaceAll("&amp;", "&")
  .replaceAll("&quot;", "\"")
  .replaceAll("&#039;", "'")
  .replaceAll(/\[[0-9]+\]/g, "")
  .replaceAll(/\s+/g, " ")
  .trim();

async function requestJson(url, attempts = 4) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const response = await fetch(url, { headers: { "User-Agent": userAgent, Accept: "application/json" } });
    if (response.ok) return response.json();
    if (![429, 500, 502, 503, 504].includes(response.status) || attempt === attempts - 1) throw new Error(`${response.status} ${url}`);
    await new Promise((resolve) => setTimeout(resolve, 900 * (attempt + 1)));
  }
}

async function searchWikipedia(language, query) {
  const parameters = new URLSearchParams({ action: "query", format: "json", formatversion: "2", generator: "search", gsrsearch: query, gsrlimit: "6", prop: "extracts|pageprops|info", exintro: "1", explaintext: "1", exchars: "2600", inprop: "url", origin: "*" });
  const payload = await requestJson(`https://${language}.wikipedia.org/w/api.php?${parameters}`);
  return payload.query?.pages || [];
}

function scorePage(page, record) {
  const title = normalize(page.title);
  const haystack = normalize(`${page.title} ${page.extract || ""}`);
  const nameTokens = tokens(record.name);
  const universeTokens = tokens(record.franchise);
  const titleHits = nameTokens.filter((token) => title.includes(token)).length;
  const universeHits = universeTokens.filter((token) => haystack.includes(token)).length;
  let score = titleHits * 8 + universeHits * 3;
  if (title === normalize(record.name)) score += 18;
  if (nameTokens.length && titleHits === nameTokens.length) score += 12;
  if (/personaggio|fictional|character|videogioco|video game|serie|film|fumetto|comics|attore|attrice|chef|youtuber|conduttore/i.test(page.extract || "")) score += 4;
  const identityPattern = peopleFranchises.has(record.franchise)
    ? /attore|attrice|regista|chef|cuoco|conduttore|creator|youtuber|streamer|doppiatore|comico|cantante|personaggio televisivo/i
    : record.franchise === "Dinosauri"
      ? /dinosaur|rettile|genere estinto|specie estinta|fossil/i
      : /personaggio|fictional.*character|immaginari|antagonist|protagonist|supereroe|creatura|mostro|Pokémon/i;
  if (!fanArtFranchises.has(record.franchise) && !identityPattern.test(page.extract || "")) score -= 24;
  if (universeTokens.length && universeHits === 0 && !peopleFranchises.has(record.franchise)) score -= 18;
  if (page.pageprops?.disambiguation !== undefined) score -= 30;
  if (!page.extract || page.extract.length < 160) score -= 12;
  return score;
}

function queryCandidates(record) {
  const rawName = record.name.replace(/[“”]/g, "\"");
  const beforeDash = rawName.split(/\s+[—–]\s+/)[0].trim();
  const beforeSlash = beforeDash.split(/\s*\/\s*/)[0].trim();
  const parenthetical = [...rawName.matchAll(/\(([^)]+)\)/g)].map((match) => match[1].trim());
  const withoutParenthetical = beforeSlash.replace(/\s*\([^)]*\)/g, "").trim();
  return [...new Set([
    queryOverrides[record.id],
    `${withoutParenthetical} ${record.franchise}`,
    ...parenthetical.map((alias) => `${alias} ${record.franchise}`),
    withoutParenthetical,
  ].filter(Boolean))];
}

async function selectWikipediaPage(record) {
  const queries = queryCandidates(record);
  const collected = [];
  for (const query of queries) {
    const languageResults = await Promise.all(["it", "en"].map(async (language) => {
      try {
        const pages = await searchWikipedia(language, query);
        return pages.map((page) => ({ language, page, score: scorePage(page, record), query }));
      } catch (error) {
        return [{ language, error: error instanceof Error ? error.message : String(error), score: -100, query }];
      }
    }));
    collected.push(...languageResults.flat().filter((entry) => entry.page));
    if (collected.some((entry) => entry.score >= 30)) break;
  }
  const unique = new Map();
  for (const entry of collected) {
    const key = `${entry.language}:${entry.page.pageid}`;
    if (!unique.has(key) || unique.get(key).score < entry.score) unique.set(key, entry);
  }
  const ranked = [...unique.values()].sort((a, b) => b.score - a.score);
  return { query: ranked[0]?.query || queries[0], selected: ranked[0], alternatives: ranked.slice(1, 4).map((entry) => ({ language: entry.language, title: entry.page.title, url: entry.page.fullurl, score: entry.score })) };
}

async function fetchFullExtract(language, title) {
  const parameters = new URLSearchParams({ action: "query", format: "json", formatversion: "2", prop: "extracts|info", titles: title, explaintext: "1", exsectionformat: "plain", inprop: "url", origin: "*" });
  const payload = await requestJson(`https://${language}.wikipedia.org/w/api.php?${parameters}`);
  return payload.query?.pages?.[0] || {};
}

async function fetchSections(language, title) {
  const sectionParameters = new URLSearchParams({ action: "parse", format: "json", page: title, prop: "sections", origin: "*" });
  const sectionPayload = await requestJson(`https://${language}.wikipedia.org/w/api.php?${sectionParameters}`);
  const sections = sectionPayload.parse?.sections || [];
  const relevant = sections.filter((section) => /biograf|storia|background|fictional|character|appear|apparizion|plot|trama|career|carriera|development|svilupp|role|ruolo/i.test(section.line)).slice(0, 5);
  const selected = relevant.length ? relevant : sections.filter((section) => section.toclevel <= 2).slice(0, 3);
  const results = [];
  for (const section of selected.slice(0, 3)) {
    const parameters = new URLSearchParams({ action: "parse", format: "json", page: title, section: section.index, prop: "text", disableeditsection: "1", origin: "*" });
    try {
      const payload = await requestJson(`https://${language}.wikipedia.org/w/api.php?${parameters}`);
      const text = cleanText(payload.parse?.text?.["*"] || "").slice(0, 5000);
      if (text.length >= 180) results.push({ heading: cleanText(section.line), text });
    } catch {}
  }
  return results;
}

async function fetchWikidata(wikibaseItem, language) {
  if (!wikibaseItem) return null;
  const parameters = new URLSearchParams({ action: "wbgetentities", format: "json", ids: wikibaseItem, props: "labels|descriptions|claims|sitelinks", languages: `${language}|it|en`, origin: "*" });
  const payload = await requestJson(`https://www.wikidata.org/w/api.php?${parameters}`);
  const entity = payload.entities?.[wikibaseItem];
  if (!entity || entity.missing !== undefined) return null;
  const officialWebsites = (entity.claims?.P856 || []).map((claim) => claim.mainsnak?.datavalue?.value).filter((value) => typeof value === "string");
  return {
    id: wikibaseItem,
    url: `https://www.wikidata.org/wiki/${wikibaseItem}`,
    label: entity.labels?.it?.value || entity.labels?.en?.value || wikibaseItem,
    description: entity.descriptions?.it?.value || entity.descriptions?.en?.value || "",
    officialWebsites: [...new Set(officialWebsites)],
    italianWikipediaTitle: entity.sitelinks?.itwiki?.title || null
  };
}

async function research(record) {
  if (fanArtFranchises.has(record.franchise)) return { id: record.id, name: record.name, franchise: record.franchise, query: record.name, status: "internal-derived-work", confidence: 100, reviewedAt: "2026-08-23" };
  const { query, selected, alternatives } = await selectWikipediaPage(record);
  if (!selected || selected.score < 18) return { id: record.id, name: record.name, franchise: record.franchise, query, status: "manual-review", confidence: selected?.score || 0, alternatives, reviewedAt: "2026-08-23" };
  let resolvedLanguage = selected.language;
  let page = await fetchFullExtract(resolvedLanguage, selected.page.title);
  let sections = await fetchSections(resolvedLanguage, selected.page.title);
  const wikidata = await fetchWikidata(selected.page.pageprops?.wikibase_item, selected.language);
  if (resolvedLanguage === "en" && wikidata?.italianWikipediaTitle) {
    const italianPage = await fetchFullExtract("it", wikidata.italianWikipediaTitle);
    const italianExtract = cleanText(italianPage.extract || "");
    if (italianExtract.length >= 500) {
      resolvedLanguage = "it";
      page = italianPage;
      sections = await fetchSections("it", wikidata.italianWikipediaTitle);
    }
  }
  const extract = cleanText(page.extract || selected.page.extract || "").slice(0, 14000);
  const selectedTitle = normalize(page.title || selected.page.title);
  const candidateNames = queryCandidates(record).map((query) => normalize(query.replace(record.franchise, ""))).filter(Boolean);
  const titleIdentityConfirmed = candidateNames.some((candidate) => candidate.split(" ").filter((token) => token.length > 2).some((token) => selectedTitle.includes(token)));
  const sourceDomains = new Set([new URL(page.fullurl || selected.page.fullurl).hostname, wikidata?.url ? new URL(wikidata.url).hostname : null, ...(wikidata?.officialWebsites || []).map((url) => { try { return new URL(url).hostname; } catch { return null; } })].filter(Boolean));
  const identityPattern = peopleFranchises.has(record.franchise)
    ? /attore|attrice|regista|chef|cuoco|conduttore|creator|youtuber|streamer|doppiatore|comico|cantante|personaggio televisivo/i
    : record.franchise === "Dinosauri"
      ? /dinosaur|rettile|genere estinto|specie estinta|fossil/i
      : /personaggio|fictional.*character|immaginari|antagonist|protagonist|supereroe|creatura|mostro|Pokémon/i;
  const universeConfirmed = peopleFranchises.has(record.franchise) || tokens(record.franchise).some((token) => normalize(extract).includes(token));
  const status = extract.length >= 500 && selected.score >= 18 && titleIdentityConfirmed && identityPattern.test(extract) && universeConfirmed && sourceDomains.size >= 2 ? "source-pack-ready" : "manual-review";
  return {
    id: record.id,
    name: record.name,
    franchise: record.franchise,
    query,
    status,
    confidence: selected.score,
    language: resolvedLanguage,
    title: page.title || selected.page.title,
    url: page.fullurl || selected.page.fullurl,
    wikibaseItem: selected.page.pageprops?.wikibase_item || null,
    extract,
    sections,
    wikidata,
    alternatives,
    reviewedAt: "2026-08-23"
  };
}

for (const record of candidates) {
  const pack = byId.get(record.id);
  if (!pack || pack.status !== "source-pack-ready") continue;
  const identityPattern = peopleFranchises.has(record.franchise)
    ? /attore|attrice|regista|chef|cuoco|conduttore|creator|youtuber|streamer|doppiatore|comico|cantante|personaggio televisivo/i
    : record.franchise === "Dinosauri"
      ? /dinosaur|rettile|genere estinto|specie estinta|fossil/i
      : /personaggio|fictional.*character|immaginari|antagonist|protagonist|supereroe|creatura|mostro|Pokémon/i;
  const universeConfirmed = peopleFranchises.has(record.franchise) || tokens(record.franchise).some((token) => normalize(pack.extract || "").includes(token));
  if (!identityPattern.test(pack.extract || "") || !universeConfirmed) byId.set(record.id, { ...pack, status: "manual-review", rejection: "identity-or-universe-not-confirmed" });
}

const pending = candidates.filter((record) => !byId.has(record.id) || ["request-error", "manual-review"].includes(byId.get(record.id)?.status) || (byId.get(record.id)?.status === "source-pack-ready" && byId.get(record.id)?.language === "en"));
let completed = 0;
for (let index = 0; index < pending.length; index += 3) {
  const batch = pending.slice(index, index + 3);
  const results = await Promise.all(batch.map(async (record) => {
    try { return await research(record); }
    catch (error) { return { id: record.id, name: record.name, franchise: record.franchise, status: "request-error", error: error instanceof Error ? error.message : String(error), reviewedAt: "2026-08-23" }; }
  }));
  for (const result of results) byId.set(result.id, result);
  completed += results.length;
  fs.writeFileSync(outputPath, `${JSON.stringify([...byId.values()], null, 2)}\n`, "utf8");
  if (completed % 30 === 0 || completed === pending.length) console.log(`Pacchetti di ricerca: ${completed}/${pending.length}`);
  await new Promise((resolve) => setTimeout(resolve, 250));
}

const summary = Object.fromEntries([...Map.groupBy([...byId.values()], (entry) => entry.status)].map(([status, records]) => [status, records.length]));
console.log(JSON.stringify(summary, null, 2));
