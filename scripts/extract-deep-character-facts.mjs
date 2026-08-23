import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packsPath = path.join(root, "data", "codex", "research", "deep-character-packs.generated.json");
const packs = JSON.parse(fs.readFileSync(packsPath, "utf8"));
const registry = JSON.parse(fs.readFileSync(path.join(root, "data", "codex", "fuori-trama-registry.generated.json"), "utf8"));
const recordById = new Map(registry.map((record) => [record.id, record]));
const peopleFranchises = new Set(["Creator italiani", "Cucina & Intrattenimento", "Cinema e arti marziali", "Cinema classico", "Commedia italiana", "Bud Spencer & Terence Hill", "Stanlio e Ollio"]);
const userAgent = "LoreWise-Codex-Research/2.0 (editorial research; lorewise.archive@gmail.com)";

const fieldRules = [
  [/^(name|nome|full.?name|nome.?completo)$/i, "Nome completo"],
  [/^(alias|aliases|alias.?noti|other.?names|altri.?nomi)$/i, "Alias"],
  [/^(first|first.?appearance|prima.?apparizione|debut|debutto)$/i, "Prima apparizione"],
  [/^(last|last.?appearance|ultima.?apparizione)$/i, "Ultima apparizione"],
  [/^(created.?by|creator|creatore|creata.?da|creato.?da|designer)$/i, "Creazione"],
  [/^(portrayed.?by|actor|actors|interprete|voice|voices|voiced.?by|doppiatore|doppiatori)$/i, "Interprete o voce"],
  [/^(species|specie|race|razza|kind)$/i, "Specie o natura"],
  [/^(gender|genere|sex|sesso)$/i, "Genere"],
  [/^(birth|born|nascita|date.?of.?birth|birthday)$/i, "Nascita"],
  [/^(death|died|morte|date.?of.?death)$/i, "Morte o stato conclusivo"],
  [/^(status|stato)$/i, "Stato"],
  [/^(origin|origine|home|homeworld|birthplace|luogo.?di.?nascita|nationality|nazionalit.)$/i, "Origine"],
  [/^(occupation|occupazione|profession|professione|job|ruolo)$/i, "Occupazione o ruolo"],
  [/^(affiliation|affiliations|affiliazione|organization|organizzazione|team|teams|faction|fazioni)$/i, "Affiliazioni"],
  [/^(family|famiglia|relatives|parenti|relationships|relazioni)$/i, "Famiglia e relazioni"],
  [/^(partner|partners|spouse|coniuge|significant.?other)$/i, "Partner"],
  [/^(children|figli|child)$/i, "Figli"],
  [/^(parents|genitori|parent)$/i, "Genitori"],
  [/^(abilities|ability|abilit.|powers|poteri|skills|competenze|weapons|armi)$/i, "Capacità e strumenti"],
  [/^(title|titles|titolo|titoli|rank|grado)$/i, "Titoli o grado"],
  [/^(series|serie|franchise|universe|universo|work|opera)$/i, "Serie o universo"],
  [/^(appears.?in|appearances|apparizioni|games|films|episodes)$/i, "Apparizioni documentate"]
];

const cleanMarkup = (value = "") => value
  .replace(/<ref[\s\S]*?<\/ref>/gi, " ")
  .replace(/<ref[^>]*\/>/gi, " ")
  .replace(/<!--.*?-->/g, " ")
  .replace(/\[\[(?:File|Image|Immagine):[^\]]+\]\]/gi, " ")
  .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2")
  .replace(/\[\[([^\]]+)\]\]/g, "$1")
  .replace(/\[(https?:\/\/\S+)\s+([^\]]+)\]/g, "$2")
  .replace(/\{\{(?:small|nowrap|plainlist|ubl|unbulleted list|hlist|flatlist)\|([^{}]+)\}\}/gi, "$1")
  .replace(/\{\{[^{}]*\}\}/g, " ")
  .replace(/<br\s*\/?>/gi, " · ")
  .replace(/<[^>]+>/g, " ")
  .replace(/'{2,}/g, "")
  .replace(/&nbsp;/g, " ")
  .replace(/&amp;/g, "&")
  .replace(/\s*[·,;]\s*[·,;]+/g, " · ")
  .replace(/\s+/g, " ")
  .trim();

async function requestJson(url, attempts = 4) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const response = await fetch(url, { headers: { "User-Agent": userAgent, Accept: "application/json" } });
    if (response.ok) return response.json();
    if (![429, 500, 502, 503, 504].includes(response.status) || attempt === attempts - 1) throw new Error(`${response.status} ${url}`);
    await new Promise((resolve) => setTimeout(resolve, 850 * (attempt + 1)));
  }
}

function canonicalLabel(key) {
  const normalized = key.trim().replaceAll(/[_-]+/g, " ");
  return fieldRules.find(([pattern]) => pattern.test(normalized))?.[1] || null;
}

function parseFacts(wikitext) {
  const facts = [];
  const seen = new Set();
  const lines = wikitext.split(/\r?\n/);
  for (let index = 0; index < Math.min(lines.length, 600); index += 1) {
    const match = lines[index].match(/^\|\s*([^=|]{1,70})\s*=\s*(.*)$/);
    if (!match) continue;
    const label = canonicalLabel(match[1]);
    if (!label || seen.has(label)) continue;
    let rawValue = match[2];
    for (let continuation = index + 1; continuation < Math.min(lines.length, index + 12) && !/^\s*\|\s*[^=|]+\s*=/.test(lines[continuation]) && !/^\s*}}/.test(lines[continuation]); continuation += 1) rawValue += ` ${lines[continuation]}`;
    const value = cleanMarkup(rawValue).slice(0, 700);
    if (value.length < 2 || /^(unknown|n\/a|none|sconosciut[oa]|non noto)$/i.test(value)) continue;
    facts.push({ label, value });
    seen.add(label);
  }
  return facts;
}

async function extract(pack) {
  const api = pack.specialistApi || `https://${pack.language || "it"}.wikipedia.org/w/api.php`;
  const title = pack.title;
  const parameters = new URLSearchParams({ action: "parse", format: "json", page: title, prop: "wikitext", origin: "*" });
  const payload = await requestJson(`${api}?${parameters}`);
  const facts = parseFacts(payload.parse?.wikitext?.["*"] || "");
  pack.structuredFacts = facts;
  pack.sectionHeadings = (pack.sections || []).map((section) => section.heading).filter(Boolean);
  delete pack.extract;
  delete pack.sections;
}

function validateAndEnrich(pack) {
  const record = recordById.get(pack.id);
  if (!record) return;
  const description = pack.wikidata?.description || "";
  const isPerson = peopleFranchises.has(record.franchise);
  const isDinosaur = record.franchise === "Dinosauri";
  const identityPattern = isPerson
    ? /attore|attrice|regista|chef|cuoco|conduttore|creator|youtuber|streamer|doppiatore|comico|cantante|artista marziale/i
    : isDinosaur
      ? /dinosaur|rettile|genere estinto|specie estinta|fossil/i
      : /personaggio|fictional.*character|immaginari|antagonist|protagonist|supereroe|creatura|mostro|Pokémon/i;
  const wrongEntityPattern = /^(film|serie di romanzi|miniserie|romanzo|videogioco|serie televisiva|album|episodio|opera)/i;
  const specialistIdentity = pack.status === "specialist-pack-ready" && (pack.confidence || 0) >= 20;
  pack.identityValidated = (identityPattern.test(description) && !wrongEntityPattern.test(description)) || specialistIdentity;
  if (pack.identityValidated && description && !(pack.structuredFacts || []).some((fact) => fact.label === "Identificazione strutturata")) {
    pack.structuredFacts = [{ label: "Identificazione strutturata", value: description }, ...(pack.structuredFacts || [])];
  }
}

for (const pack of packs) {
  validateAndEnrich(pack);
  if (!pack.sectionHeadings && Array.isArray(pack.sections)) pack.sectionHeadings = pack.sections.map((section) => section.heading).filter(Boolean);
  delete pack.extract;
  delete pack.sections;
}
fs.writeFileSync(packsPath, `${JSON.stringify(packs, null, 2)}\n`, "utf8");

const pending = packs.filter((pack) => ["source-pack-ready", "specialist-pack-ready"].includes(pack.status) && !pack.structuredFacts);
let completed = 0;
for (let index = 0; index < pending.length; index += 3) {
  const batch = pending.slice(index, index + 3);
  await Promise.all(batch.map(async (pack) => {
    try { await extract(pack); validateAndEnrich(pack); }
    catch (error) { pack.factExtractionError = error instanceof Error ? error.message : String(error); }
  }));
  completed += batch.length;
  fs.writeFileSync(packsPath, `${JSON.stringify(packs, null, 2)}\n`, "utf8");
  if (completed % 30 === 0 || completed === pending.length) console.log(`Fatti strutturati: ${completed}/${pending.length}`);
  await new Promise((resolve) => setTimeout(resolve, 220));
}

const withFacts = packs.filter((pack) => pack.structuredFacts?.length).length;
console.log(`${withFacts}/${packs.length} pacchetti con fatti strutturati; i testi sorgente estesi sono stati rimossi dal repository.`);
