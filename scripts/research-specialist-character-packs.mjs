import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
const packsPath = path.join(root, "data", "codex", "research", "deep-character-packs.generated.json");
const packs = read("data/codex/research/deep-character-packs.generated.json");
const registry = read("data/codex/fuori-trama-registry.generated.json");
const recordById = new Map(registry.map((record) => [record.id, record]));
const generatedDossiers = read("data/codex/third-party-dossiers.generated.json");
const existingWebDomainsById = new Map(generatedDossiers.map((dossier) => [dossier.slug, new Set(dossier.editorial.sources.map((source) => {
  try { return /^https?:/.test(source.location) ? new URL(source.location).hostname : null; } catch { return null; }
}).filter(Boolean))]));
const userAgent = "LoreWise-Codex-Research/2.0 (editorial research; lorewise.archive@gmail.com)";

const specialistSites = new Map(Object.entries({
  "Baldur’s Gate 3": "https://bg3.wiki/w/api.php",
  "Futurama": "https://futurama.fandom.com/api.php",
  "Grand Theft Auto V": "https://gta.fandom.com/api.php",
  "Inazuma Eleven": "https://inazuma-eleven.fandom.com/api.php",
  "I Simpson": "https://simpsons.fandom.com/api.php",
  "The Simpsons": "https://simpsons.fandom.com/api.php",
  "I Griffin": "https://familyguy.fandom.com/api.php",
  "Family Guy": "https://familyguy.fandom.com/api.php",
  "American Dad!": "https://americandad.fandom.com/api.php",
  "Il laboratorio di Dexter": "https://dexterslab.fandom.com/api.php",
  "Due fantagenitori": "https://fairlyoddparents.fandom.com/api.php",
  "Tartarughe Ninja": "https://turtlepedia.fandom.com/api.php",
  "Silent Hill": "https://silenthill.fandom.com/api.php",
  "Mucca e Pollo": "https://cowandchicken.fandom.com/api.php",
  "Winx Club": "https://winx.fandom.com/api.php",
  "Shrek": "https://shrek.fandom.com/api.php",
  "Leone il cane fifone": "https://courage.fandom.com/api.php",
  "Lupin the 3rd": "https://lupin.fandom.com/api.php",
  "Mighty Morphin Power Rangers": "https://powerrangers.fandom.com/api.php",
  "Crash Bandicoot": "https://crashbandicoot.fandom.com/api.php",
  "Popeye": "https://popeye.fandom.com/api.php",
  "Le Superchicche": "https://powerpuffgirls.fandom.com/api.php",
  "Lo straordinario mondo di Gumball": "https://theamazingworldofgumball.fandom.com/api.php",
  "Doraemon": "https://doraemon.fandom.com/api.php",
  "Adventure Time": "https://adventuretime.fandom.com/api.php",
  "Le tenebrose avventure di Billy e Mandy": "https://grimadventures.fandom.com/api.php",
  "Minecraft": "https://minecraft.wiki/api.php",
  "Attack on Titan": "https://attackontitan.fandom.com/api.php",
  "Fallout": "https://fallout.fandom.com/api.php",
  "Mai dire...": "https://nonciclopedia.org/api.php"
}));
const officialSites = new Map(Object.entries({
  "Baldur’s Gate 3": "https://baldursgate3.game/",
  "Futurama": "https://www.hulu.com/series/futurama",
  "Grand Theft Auto V": "https://www.rockstargames.com/gta-v",
  "Inazuma Eleven": "https://www.inazuma.jp/victory-road/en/",
  "I Simpson": "https://www.disneyplus.com/series/the-simpsons/3ZoBZ52QHb4x",
  "The Simpsons": "https://www.disneyplus.com/series/the-simpsons/3ZoBZ52QHb4x",
  "I Griffin": "https://www.fox.com/family-guy/",
  "Family Guy": "https://www.fox.com/family-guy/",
  "American Dad!": "https://www.tbs.com/shows/american-dad",
  "Il laboratorio di Dexter": "https://www.cartoonnetwork.com/",
  "Due fantagenitori": "https://www.nick.com/",
  "Tartarughe Ninja": "https://www.nick.com/shows/teenage-mutant-ninja-turtles",
  "Silent Hill": "https://www.konami.com/games/silenthill/",
  "Mucca e Pollo": "https://www.cartoonnetwork.com/",
  "Winx Club": "https://www.winxclub.com/",
  "Shrek": "https://www.dreamworks.com/movies/shrek",
  "Leone il cane fifone": "https://www.cartoonnetwork.com/",
  "Lupin the 3rd": "https://www.lupin-3rd.net/",
  "Mighty Morphin Power Rangers": "https://powerrangers.hasbro.com/",
  "Crash Bandicoot": "https://www.crashbandicoot.com/",
  "Popeye": "https://popeye.com/",
  "Le Superchicche": "https://www.cartoonnetwork.com/",
  "Lo straordinario mondo di Gumball": "https://www.cartoonnetwork.com/",
  "Doraemon": "https://dora-world.com/",
  "Adventure Time": "https://www.cartoonnetwork.com/",
  "Le tenebrose avventure di Billy e Mandy": "https://www.cartoonnetwork.com/",
  "Minecraft": "https://www.minecraft.net/",
  "Attack on Titan": "https://shingeki.tv/final/",
  "Fallout": "https://fallout.bethesda.net/",
  "Mai dire...": "https://www.mediasetinfinity.mediaset.it/"
}));

const queryOverrides = {
  "gale-bg3": "Gale",
  "laezel-bg3": "Lae'zel",
  "wyll-bg3": "Wyll",
  "karlach-bg3": "Karlach",
  "mark-evans": "Endou Mamoru",
  "axel-blaze": "Gouenji Shuuya",
  "jude-sharp": "Kidou Yuuto",
  "nathan-swift": "Kazemaru Ichirouta",
  "shawn-frost": "Fubuki Shirou",
  "xavier-foster": "Kiyama Hiroto",
  "aiutante-di-babbo-natale": "Santa's Little Helper",
  "il-rosso": "The Red Guy",
  "raffaello-tmnt": "Raphael",
  "principessa-gommarosa": "Princess Bubblegum",
  "re-ghiaccio": "Ice King",
  "takeshi-gian-goda": "Takeshi Gouda",
  "koichi-zenigata": "Koichi Zenigata",
  "mighty-morphin-megazord": "Dino Megazord",
  "morte-grim-adventures": "Grim",
  "annegato-minecraft": "Drowned"
};

const normalize = (value = "") => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("it").replace(/[^a-z0-9]+/g, " ").trim();
const tokens = (value) => normalize(value).split(" ").filter((token) => token.length > 2 && !["the", "and", "del", "della", "personaggio"].includes(token));
const cleanText = (value = "") => value.replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<sup[\s\S]*?<\/sup>/gi, " ").replace(/<[^>]+>/g, " ").replaceAll("&nbsp;", " ").replaceAll("&amp;", "&").replaceAll("&quot;", "\"").replaceAll("&#039;", "'").replaceAll(/\s+/g, " ").trim();

async function requestJson(url, attempts = 4) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const response = await fetch(url, { headers: { "User-Agent": userAgent, Accept: "application/json" } });
    if (response.ok) return response.json();
    if (![429, 500, 502, 503, 504].includes(response.status) || attempt === attempts - 1) throw new Error(`${response.status} ${url}`);
    await new Promise((resolve) => setTimeout(resolve, 900 * (attempt + 1)));
  }
}

function nameVariants(record) {
  const parenthetical = [...record.name.matchAll(/\(([^)]+)\)/g)].map((match) => match[1]);
  const base = record.name.split(/\s+[—–]\s+|\s*\/\s*/)[0].replace(/\s*\([^)]*\)/g, "").trim();
  return [...new Set([queryOverrides[record.id], ...parenthetical, base].filter(Boolean))];
}

async function searchSpecialist(api, record) {
  const results = [];
  for (const query of nameVariants(record)) {
    const parameters = new URLSearchParams({ action: "query", format: "json", formatversion: "2", generator: "search", gsrsearch: query, gsrlimit: "6", prop: "extracts|info", exintro: "1", explaintext: "1", exchars: "1200", inprop: "url", origin: "*" });
    const payload = await requestJson(`${api}?${parameters}`);
    for (const page of payload.query?.pages || []) {
      const title = normalize(page.title);
      const variantTokens = tokens(query);
      const hits = variantTokens.filter((token) => title.includes(token)).length;
      results.push({ page, query, score: hits * 10 + (title === normalize(query) ? 20 : 0) + (page.extract?.length > 300 ? 5 : 0) });
    }
    if (results.some((entry) => entry.score >= 25)) break;
  }
  return results.sort((a, b) => b.score - a.score)[0];
}

async function fetchFull(api, title) {
  const parameters = new URLSearchParams({ action: "parse", format: "json", page: title, prop: "text|displaytitle", disableeditsection: "1", origin: "*" });
  const payload = await requestJson(`${api}?${parameters}`);
  return { title: cleanText(payload.parse?.displaytitle || title), extract: cleanText(payload.parse?.text?.["*"] || "") };
}

async function fetchSections(api, title) {
  const parameters = new URLSearchParams({ action: "parse", format: "json", page: title, prop: "sections", origin: "*" });
  const payload = await requestJson(`${api}?${parameters}`);
  const sections = (payload.parse?.sections || []).filter((section) => /biograf|storia|background|history|appear|plot|trama|personality|personalit|role|ruolo/i.test(section.line)).slice(0, 4);
  const output = [];
  for (const section of sections.slice(0, 3)) {
    const sectionParameters = new URLSearchParams({ action: "parse", format: "json", page: title, section: section.index, prop: "text", disableeditsection: "1", origin: "*" });
    try {
      const sectionPayload = await requestJson(`${api}?${sectionParameters}`);
      const text = cleanText(sectionPayload.parse?.text?.["*"] || "").slice(0, 5000);
      if (text.length >= 180) output.push({ heading: cleanText(section.line), text });
    } catch {}
  }
  return output;
}

async function fetchWikidata(record) {
  for (const query of nameVariants(record)) {
    const parameters = new URLSearchParams({ action: "wbsearchentities", format: "json", search: `${query} ${record.franchise}`, language: "en", uselang: "it", limit: "5", origin: "*" });
    const payload = await requestJson(`https://www.wikidata.org/w/api.php?${parameters}`);
    const ranked = (payload.search || []).map((entry) => {
      const haystack = normalize(`${entry.label} ${entry.description || ""}`);
      const nameHits = tokens(query).filter((token) => haystack.includes(token)).length;
      const universeHits = tokens(record.franchise).filter((token) => haystack.includes(token)).length;
      return { entry, score: nameHits * 8 + universeHits * 3 };
    }).sort((a, b) => b.score - a.score);
    if (ranked[0]?.score >= 8) return { id: ranked[0].entry.id, url: ranked[0].entry.concepturi, label: ranked[0].entry.label, description: ranked[0].entry.description || "" };
  }
  return null;
}

const pending = packs.filter((pack) => pack.status === "manual-review" && specialistSites.has(pack.franchise));
let completed = 0;
for (const pack of pending) {
  const record = recordById.get(pack.id);
  const api = specialistSites.get(pack.franchise);
  try {
    const selected = await searchSpecialist(api, record);
    if (!selected || selected.score < 15) continue;
    const page = await fetchFull(api, selected.page.title);
    const extract = cleanText(page.extract || selected.page.extract || "").slice(0, 14000);
    const sections = await fetchSections(api, selected.page.title);
    const wikidata = await fetchWikidata(record);
    const officialUrl = officialSites.get(pack.franchise);
    const sourceDomains = new Set([selected.page.fullurl ? new URL(selected.page.fullurl).hostname : new URL(api).hostname, wikidata?.url ? new URL(wikidata.url).hostname : null, officialUrl ? new URL(officialUrl).hostname : null, ...(existingWebDomainsById.get(pack.id) || [])].filter(Boolean));
    if (extract.length >= 500 && sourceDomains.size >= 2) Object.assign(pack, { status: "specialist-pack-ready", confidence: selected.score, title: page.title || selected.page.title, url: selected.page.fullurl, extract, sections, wikidata, officialUrl, specialistApi: api, reviewedAt: "2026-08-23" });
  } catch (error) {
    pack.specialistError = error instanceof Error ? error.message : String(error);
  }
  completed += 1;
  if (completed % 10 === 0 || completed === pending.length) console.log(`Archivi specialistici: ${completed}/${pending.length}`);
  fs.writeFileSync(packsPath, `${JSON.stringify(packs, null, 2)}\n`, "utf8");
  await new Promise((resolve) => setTimeout(resolve, 250));
}

const summary = Object.fromEntries([...Map.groupBy(packs, (entry) => entry.status)].map(([status, records]) => [status, records.length]));
console.log(JSON.stringify(summary, null, 2));
