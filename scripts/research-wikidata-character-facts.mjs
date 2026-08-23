import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packsPath = path.join(root, "data", "codex", "research", "deep-character-packs.generated.json");
const packs = JSON.parse(fs.readFileSync(packsPath, "utf8"));
const registry = JSON.parse(fs.readFileSync(path.join(root, "data", "codex", "fuori-trama-registry.generated.json"), "utf8"));
const recordById = new Map(registry.map((record) => [record.id, record]));
const peopleFranchises = new Set(["Creator italiani", "Cucina & Intrattenimento", "Cinema e arti marziali", "Cinema classico", "Commedia italiana", "Bud Spencer & Terence Hill", "Stanlio e Ollio"]);
const fanArtFranchises = new Set(["Carte Extra · Fan Art", "GiWise Fan Art"]);
const userAgent = "LoreWise-Codex-Research/2.0 (editorial research; lorewise.archive@gmail.com)";

const aliases = {
  "marilu-bagge": "Muriel Bagge", "giustino-bagge": "Eustace Bagge", "re-ramses": "King Ramses",
  "lolly-superchicche": "Blossom Powerpuff Girls", "dolly-superchicche": "Bubbles Powerpuff Girls", "molly-superchicche": "Buttercup Powerpuff Girls",
  "principessa-gommarosa": "Princess Bubblegum", "re-ghiaccio": "Ice King", "bruto-popeye": "Bluto Popeye",
  "tiger-man": "Naoto Date Tiger Mask", "power-ranger-rosso": "Jason Lee Scott", "power-ranger-verde": "Tommy Oliver",
  "power-ranger-blu": "Billy Cranston", "power-ranger-rosa": "Kimberly Hart", "power-ranger-nero": "Zack Taylor",
  "power-ranger-bianco": "Tommy Oliver White Ranger", "power-ranger-giallo": "Trini Kwan", "mighty-morphin-megazord": "Dino Megazord",
  "koichi-zenigata": "Koichi Zenigata", "mila-hazuki": "You Hazuki", "shiro-takiki": "So Tachiki",
  "holly-oliver-hutton": "Tsubasa Ozora", "benji-price": "Genzo Wakabayashi", "beep-beep-road-runner": "Road Runner Looney Tunes",
  "takeshi-gian-goda": "Takeshi Goda", "principessa-peach": "Princess Peach", "fata-madrina-shrek": "Fairy Godmother Shrek",
  "creatura-di-frankenstein": "Frankenstein's monster", "statua-di-dio-solo-leveling": "Statue of God Solo Leveling",
  "annegato-minecraft": "Drowned Minecraft", "il-cavaliere-hollow-knight": "The Knight Hollow Knight",
  "morte-grim-adventures": "Grim Billy Mandy", "aiutante-di-babbo-natale": "Santa's Little Helper Simpsons"
};

const officialByUniverse = new Map(Object.entries({
  "Mighty Morphin Power Rangers":"https://powerrangers.hasbro.com/", "Winx Club":"https://www.winxclub.com/", "Leone il cane fifone":"https://www.cartoonnetwork.com/",
  "Mucca e Pollo":"https://www.cartoonnetwork.com/", "Il laboratorio di Dexter":"https://www.cartoonnetwork.com/", "Le Superchicche":"https://www.cartoonnetwork.com/",
  "Lo straordinario mondo di Gumball":"https://www.cartoonnetwork.com/", "Adventure Time":"https://www.cartoonnetwork.com/", "Le tenebrose avventure di Billy e Mandy":"https://www.cartoonnetwork.com/",
  "Minecraft":"https://www.minecraft.net/", "Shrek":"https://www.dreamworks.com/movies/shrek", "Lupin the 3rd":"https://www.lupin-3rd.net/",
  "Naruto":"https://naruto-official.com/en", "South Park":"https://southpark.cc.com/", "Street Fighter":"https://www.streetfighter.com/6/", "Tekken":"https://tekken.com/",
  "Family Guy":"https://www.fox.com/family-guy/", "I Griffin":"https://www.fox.com/family-guy/", "The Simpsons":"https://www.disneyplus.com/series/the-simpsons/3ZoBZ52QHb4x",
  "I Simpson":"https://www.disneyplus.com/series/the-simpsons/3ZoBZ52QHb4x", "Grand Theft Auto V":"https://www.rockstargames.com/gta-v", "Popeye":"https://popeye.com/",
  "Crash Bandicoot":"https://www.crashbandicoot.com/", "Harry Potter":"https://www.harrypotter.com/", "Scooby-Doo":"https://www.warnerbros.com/brands/scooby-doo",
  "Doraemon":"https://dora-world.com/", "SpongeBob":"https://www.nick.com/shows/spongebob-squarepants", "Tartarughe Ninja":"https://www.nick.com/shows/teenage-mutant-ninja-turtles",
  "DC Comics":"https://www.dc.com/", "DC Comics / Batman":"https://www.dc.com/characters/batman", "Marvel":"https://www.marvel.com/characters",
  "Baldur’s Gate 3":"https://baldursgate3.game/", "Resident Evil":"https://game.capcom.com/residentevil/", "Dinosauri":"https://www.si.edu/spotlight/dinosaurs",
  "BoJack Horseman":"https://www.netflix.com/title/70300800", "Rick and Morty":"https://www.adultswim.com/videos/rick-and-morty",
  "Pulp Fiction":"https://www.miramax.com/movie/pulp-fiction/", "The Conjuring Universe":"https://www.warnerbros.com/movies/conjuring",
  "Breaking Bad":"https://www.amc.com/shows/breaking-bad--1002071", "Shameless US":"https://www.sho.com/shameless"
}));

const normalize = (value = "") => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("it").replace(/[^a-z0-9]+/g, " ").trim();
const tokens = (value) => normalize(value).split(" ").filter((token) => token.length > 2 && !["the","and","del","della","personaggio"].includes(token));

async function requestJson(url, attempts = 4) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const response = await fetch(url, { headers: { "User-Agent": userAgent, Accept: "application/json" } });
    if (response.ok) return response.json();
    if (![429,500,502,503,504].includes(response.status) || attempt === attempts - 1) throw new Error(`${response.status} ${url}`);
    await new Promise((resolve) => setTimeout(resolve, 850 * (attempt + 1)));
  }
}

function variants(record) {
  const parenthetical = [...record.name.matchAll(/\(([^)]+)\)/g)].map((match) => match[1]);
  const base = record.name.split(/\s+[—–]\s+|\s*\/\s*/)[0].replace(/\s*\([^)]*\)/g, "").trim();
  return [...new Set([aliases[record.id], ...parenthetical, base].filter(Boolean))];
}

function identityPattern(record) {
  if (peopleFranchises.has(record.franchise)) return /attore|attrice|regista|chef|cuoco|conduttore|creator|youtuber|streamer|doppiatore|comico|cantante|artista marziale/i;
  if (record.franchise === "Dinosauri") return /dinosaur|rettile|genere estinto|specie estinta|fossil/i;
  return /personaggio|fictional.*character|immaginari|antagonist|protagonist|supereroe|creatura|mostro|Pokémon/i;
}

async function findEntity(record) {
  const found = [];
  for (const variant of variants(record)) for (const language of ["it","en"]) {
    const parameters = new URLSearchParams({ action:"wbsearchentities", format:"json", search:variant, language, uselang:"it", limit:"8", origin:"*" });
    const payload = await requestJson(`https://www.wikidata.org/w/api.php?${parameters}`);
    for (const entry of payload.search || []) {
      const label = normalize(entry.label);
      const variantTokens = tokens(variant);
      const labelHits = variantTokens.filter((token) => label.includes(token)).length;
      const universeHits = tokens(record.franchise).filter((token) => normalize(entry.description || "").includes(token)).length;
      const validIdentity = identityPattern(record).test(entry.description || "");
      const score = labelHits * 10 + universeHits * 4 + (label === normalize(variant) ? 20 : 0) + (validIdentity ? 18 : -30);
      found.push({ entry, score, validIdentity });
    }
  }
  return found.filter((candidate) => candidate.validIdentity).sort((a,b) => b.score-a.score)[0];
}

async function fetchEntity(id) {
  const parameters = new URLSearchParams({ action:"wbgetentities", format:"json", ids:id, props:"labels|descriptions|claims|sitelinks", languages:"it|en", origin:"*" });
  const payload = await requestJson(`https://www.wikidata.org/w/api.php?${parameters}`);
  return payload.entities?.[id];
}

async function labelsFor(ids) {
  if (!ids.length) return new Map();
  const output = new Map();
  for (let index=0; index<ids.length; index+=50) {
    const parameters = new URLSearchParams({ action:"wbgetentities", format:"json", ids:ids.slice(index,index+50).join("|"), props:"labels", languages:"it|en", origin:"*" });
    const payload = await requestJson(`https://www.wikidata.org/w/api.php?${parameters}`);
    for (const [id,entity] of Object.entries(payload.entities || {})) output.set(id, entity.labels?.it?.value || entity.labels?.en?.value || id);
  }
  return output;
}

const propertyLabels = new Map([["P31","Specie o natura"],["P106","Occupazione o ruolo"],["P1441","Apparizioni documentate"],["P170","Creazione"],["P725","Interprete o voce"],["P463","Affiliazioni"],["P26","Partner"],["P22","Genitori"],["P25","Genitori"],["P3373","Famiglia e relazioni"],["P40","Figli"],["P1038","Famiglia e relazioni"],["P1552","Capacità e strumenti"]]);

async function buildFacts(record, candidate) {
  const entity = await fetchEntity(candidate.entry.id);
  const claimIds = [];
  for (const property of propertyLabels.keys()) for (const claim of entity.claims?.[property] || []) {
    const value = claim.mainsnak?.datavalue?.value;
    if (value?.id) claimIds.push(value.id);
  }
  const labelMap = await labelsFor([...new Set(claimIds)]);
  const grouped = new Map();
  for (const [property,label] of propertyLabels) for (const claim of entity.claims?.[property] || []) {
    const value = claim.mainsnak?.datavalue?.value;
    const rendered = value?.id ? labelMap.get(value.id) : typeof value === "string" ? value : null;
    if (rendered) grouped.set(label, [...(grouped.get(label)||[]), rendered]);
  }
  const description = entity.descriptions?.it?.value || entity.descriptions?.en?.value || candidate.entry.description || "";
  const facts = [
    {label:"Nome completo",value:entity.labels?.it?.value || entity.labels?.en?.value || candidate.entry.label},
    {label:"Identificazione strutturata",value:description},
    {label:"Serie o universo",value:record.franchise},
    ...[...grouped].map(([label,values])=>({label,value:[...new Set(values)].slice(0,12).join(" · ")}))
  ];
  const officialWebsites = (entity.claims?.P856 || []).map((claim)=>claim.mainsnak?.datavalue?.value).filter((value)=>typeof value === "string");
  return { facts, entity:{id:candidate.entry.id,url:`https://www.wikidata.org/wiki/${candidate.entry.id}`,label:facts[0].value,description,officialWebsites} };
}

const pending = packs.filter((pack)=>{
  const record=recordById.get(pack.id);
  return record && !fanArtFranchises.has(record.franchise) && (!pack.identityValidated || (pack.structuredFacts?.length||0)<3);
});
let completed=0;
for (const pack of pending) {
  const record=recordById.get(pack.id);
  try {
    const candidate=await findEntity(record);
    if (candidate && candidate.score>=18) {
      const {facts,entity}=await buildFacts(record,candidate);
      pack.status="wikidata-direct-ready";
      pack.identityValidated=true;
      pack.structuredFacts=facts;
      pack.wikidata=entity;
      pack.officialUrl=entity.officialWebsites[0] || officialByUniverse.get(record.franchise) || null;
      pack.reviewedAt="2026-08-23";
    }
  } catch (error) { pack.wikidataDirectError=error instanceof Error?error.message:String(error); }
  completed+=1;
  if (completed%20===0||completed===pending.length) console.log(`Entità strutturate: ${completed}/${pending.length}`);
  fs.writeFileSync(packsPath,`${JSON.stringify(packs,null,2)}\n`,`utf8`);
  await new Promise((resolve)=>setTimeout(resolve,180));
}

console.log(Object.fromEntries([...Map.groupBy(packs,(entry)=>entry.status)].map(([status,records])=>[status,records.length])));
