import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
const registry = read("data/codex/fuori-trama-registry.generated.json");
const originals = read("data/codex/original-dossiers.generated.json");
const thirdParty = read("data/codex/third-party-dossiers.generated.json");
const dossiers = [...originals, ...thirdParty];
const failures = [];
const dossierBySlug = new Map();

function normalizedFactValue(value) {
  return String(value).toLocaleLowerCase("it").replace(/[\s.,;:·—–-]+/g, " ").trim();
}

function withoutRepeatedFacts(facts, valuesAlreadyShown = new Set()) {
  const seen = new Set(valuesAlreadyShown);
  return facts.filter((fact) => {
    if (fact.label === "Pronuncia") return false;
    const value = normalizedFactValue(fact.value);
    if (!value || seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

function openingChapterGroups(dossier) {
  const identityOperationalLabels = /occupazione|ruolo|profilo registrato/i;
  const identityCore = withoutRepeatedFacts(dossier.identity.filter((fact) => !identityOperationalLabels.test(fact.label)));
  const identityValues = new Set(identityCore.map((fact) => normalizedFactValue(fact.value)));
  const identityOperational = withoutRepeatedFacts(dossier.identity.filter((fact) => identityOperationalLabels.test(fact.label)), identityValues);
  const allIdentityValues = new Set([...identityValues, ...identityOperational.map((fact) => normalizedFactValue(fact.value))]);
  const narrativeContextLabels = /universo|opera d.origine|categoria|formato|continuità|creatore|studio/i;
  const narrativeWithoutEquivalentUniverse = dossier.narrative.filter((fact) => {
    if (!/^universo$/i.test(fact.label)) return true;
    const work = dossier.narrative.find((candidate) => /opera d.origine/i.test(candidate.label));
    return !work || normalizedFactValue(work.value) !== normalizedFactValue(fact.value);
  });
  const narrativeContext = withoutRepeatedFacts(narrativeWithoutEquivalentUniverse.filter((fact) => narrativeContextLabels.test(fact.label)), new Set(allIdentityValues));
  const narrativeShownValues = new Set([...allIdentityValues, ...narrativeContext.map((fact) => normalizedFactValue(fact.value))]);
  const narrativeFunction = withoutRepeatedFacts(narrativeWithoutEquivalentUniverse.filter((fact) => !narrativeContextLabels.test(fact.label)), narrativeShownValues);
  return { identityCore, identityOperational, narrativeContext, narrativeFunction };
}

function publicStrings(value, key = "") {
  if (key === "src") return [];
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap((item) => publicStrings(item));
  if (value && typeof value === "object") return Object.entries(value).flatMap(([childKey, child]) => publicStrings(child, childKey));
  return [];
}

for (const dossier of dossiers) {
  if (dossierBySlug.has(dossier.slug)) failures.push(`${dossier.slug}: dossier duplicato`);
  dossierBySlug.set(dossier.slug, dossier);
  const groups = openingChapterGroups(dossier);
  for (const [group, facts] of Object.entries(groups)) if (!facts.length) failures.push(`${dossier.slug}: gruppo iniziale ${group} vuoto dopo la rimozione delle ripetizioni`);
  const displayedValues = [...groups.identityCore, ...groups.identityOperational, ...groups.narrativeContext, ...groups.narrativeFunction].map((fact) => normalizedFactValue(fact.value));
  if (new Set(displayedValues).size !== displayedValues.length) failures.push(`${dossier.slug}: valore ripetuto nei primi due capitoli`);
  const declaredSources = new Set((dossier.editorial?.sources || []).map((source) => source.id));
  const inspectSourceIds = (value) => {
    if (Array.isArray(value)) { value.forEach(inspectSourceIds); return; }
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value.sourceIds)) for (const sourceId of value.sourceIds) if (!declaredSources.has(sourceId)) failures.push(`${dossier.slug}: fonte ${sourceId} usata ma non dichiarata`);
    for (const child of Object.values(value)) inspectSourceIds(child);
  };
  inspectSourceIds(dossier);
}

for (const dossier of thirdParty) {
  const publicText = publicStrings(dossier).join("\n");
  if (/Fuori Trama|\bNexus\b|Forza\s+\d|Destrezza\s+\d|Intelligenza\s+\d|Carisma\s+\d|Ruolo tattico|Statistiche/.test(publicText)) failures.push(`${dossier.slug}: riferimento di gioco interno presente nella scheda di terzi`);
  if (dossier.giwiseModule) failures.push(`${dossier.slug}: modulo GiWise presente nella scheda di terzi`);
}

for (const record of registry) {
  const dossier = dossierBySlug.get(record.id);
  if (!dossier) { failures.push(`${record.id}: dossier assente`); continue; }
  if (dossier.image?.src !== record.codexImage) failures.push(`${record.id}: immagine non associata alla scheda`);
  for (const key of ["identity", "narrative", "relationships"]) if (!Array.isArray(dossier[key]) || dossier[key].length === 0) failures.push(`${record.id}: sezione ${key} vuota`);
  if (!dossier.biography?.paragraphs?.length || !dossier.biography?.chronology?.length) failures.push(`${record.id}: biografia incompleta`);
  if (!dossier.personality?.facts?.length) failures.push(`${record.id}: personalità incompleta`);
  if (!dossier.appearanceAndAbilities?.facts?.length || !dossier.appearanceAndAbilities?.limitations?.length) failures.push(`${record.id}: aspetto/capacità incompleto`);
  if (!dossier.production?.appearances?.length || !dossier.production?.facts?.length) failures.push(`${record.id}: apparizioni incomplete`);
  if (!dossier.editorial?.sources?.length) failures.push(`${record.id}: fonti assenti`);
  if (dossier.catalog?.dossierStatus !== "complete" || dossier.editorial?.missingFields?.length) failures.push(`${record.id}: stato editoriale non completo`);
  const asset = path.join(root, "assets", "codex-character-originals", record.codexImage.replace(/^\/codex\/characters\//, ""));
  const thumbnail = path.join(root, "public", record.codexImage
    .replace(/^\/codex\/characters\//, "codex/thumbnails/")
    .replace(/\.[^.]+$/, ".webp"));
  const display = path.join(root, "public", record.codexImage
    .replace(/^\/codex\/characters\//, "codex/display/")
    .replace(/\.[^.]+$/, ".webp"));
  if (!fs.existsSync(asset)) failures.push(`${record.id}: file immagine esportato assente`);
  else if (crypto.createHash("sha256").update(fs.readFileSync(asset)).digest("hex") !== record.sha256) failures.push(`${record.id}: SHA-256 immagine differente dall’originale associato`);
  if (!fs.existsSync(thumbnail) || fs.statSync(thumbnail).size < 1024) failures.push(`${record.id}: anteprima WebP ottimizzata assente`);
  if (!fs.existsSync(display) || fs.statSync(display).size < 4096) failures.push(`${record.id}: immagine WebP integrale del dossier assente`);
}

for (const dossier of dossiers) if (!registry.some((record) => record.id === dossier.slug)) failures.push(`${dossier.slug}: dossier senza record nel registro`);
if (registry.length !== 667) failures.push(`registro: attesi 667 record, trovati ${registry.length}`);
if (originals.length !== 223) failures.push(`originali: attesi 223 dossier, trovati ${originals.length}`);
if (thirdParty.length !== 444) failures.push(`terzi: attesi 444 dossier, trovati ${thirdParty.length}`);
if (dossiers.length !== registry.length) failures.push(`copertura: ${dossiers.length}/${registry.length}`);

if (failures.length) {
  console.error(`Audit Codex fallito (${failures.length} problemi):\n${failures.slice(0, 100).join("\n")}`);
  process.exit(1);
}
console.log(`Audit Codex superato: ${registry.length}/${registry.length} schede, ${registry.length}/${registry.length} immagini associate e byte-identiche, otto sezioni complete e nessun valore ripetuto nei primi due capitoli.`);
