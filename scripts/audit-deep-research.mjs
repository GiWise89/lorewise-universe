import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dossiers = JSON.parse(fs.readFileSync(path.join(root, "data", "codex", "third-party-dossiers.generated.json"), "utf8"));
const registry = JSON.parse(fs.readFileSync(path.join(root, "data", "codex", "fuori-trama-registry.generated.json"), "utf8"));
const originals = JSON.parse(fs.readFileSync(path.join(root, "data", "codex", "original-dossiers.generated.json"), "utf8"));
const researchPacksText = fs.readFileSync(path.join(root, "data", "codex", "research", "deep-character-packs.generated.json"), "utf8");
const registryById = new Map(registry.map((record) => [record.id, record]));
const originalIds = new Set(originals.map((record) => record.slug));
const expectedIds = new Set(registry.filter((record) => !originalIds.has(record.id)).map((record) => record.id));
const fanArtFranchises = new Set(["Carte Extra · Fan Art", "GiWise Fan Art"]);
const realPersonFranchises = new Set(["Creator italiani", "Cucina & Intrattenimento", "Cinema e arti marziali", "Cinema classico", "Commedia italiana", "Bud Spencer & Terence Hill", "Stanlio e Ollio", "Aldo, Giovanni e Giacomo", "CoopTV"]);
const allowedLabels = new Set(["Ricerca approfondita · fonti incrociate", "Opera derivata approfondita · canone separato"]);
const genericHeadings = new Set(["Percorso e funzione", "Confini della scheda"]);
const failures = [];

if (dossiers.length !== expectedIds.size) failures.push(`copertura: attesi ${expectedIds.size} dossier di terzi, generati ${dossiers.length}`);

for (const dossier of dossiers) {
  const record = registryById.get(dossier.slug);
  if (!record) {
    failures.push(`${dossier.slug}: record di catalogo assente`);
    continue;
  }
  expectedIds.delete(dossier.slug);
  const isDerived = fanArtFranchises.has(record.franchise);
  const expectedLabel = isDerived ? "Opera derivata approfondita · canone separato" : "Ricerca approfondita · fonti incrociate";
  const paragraphValues = dossier.biography.paragraphs.map((paragraph) => paragraph.value.trim().toLocaleLowerCase("it"));
  const chronologyValues = dossier.biography.chronology.map((event) => event.description.trim().toLocaleLowerCase("it"));
  const sourceIds = new Set(dossier.editorial.sources.map((source) => source.id));
  const webSources = dossier.editorial.sources.filter((source) => /^https?:\/\//.test(source.location || ""));
  const sourceDomains = new Set(webSources.map((source) => new URL(source.location).hostname.replace(/^www\./, "")));
  const valuesWithSources = [
    dossier.summary,
    ...dossier.identity.map((fact) => fact.value),
    ...dossier.narrative.map((fact) => fact.value),
    ...dossier.biography.paragraphs,
    ...dossier.biography.chronology,
    ...dossier.production.facts.map((fact) => fact.value),
  ];
  const nature = dossier.identity.find((fact) => fact.label === "Specie o natura")?.value || "";
  const classification = dossier.narrative.find((fact) => fact.label === "Classificazione")?.value || "";

  if (!allowedLabels.has(dossier.editorial.verificationLabel) || dossier.editorial.verificationLabel !== expectedLabel) failures.push(`${dossier.slug}: etichetta di ricerca errata`);
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dossier.editorial.lastReviewed || "")) failures.push(`${dossier.slug}: data di revisione assente o invalida`);
  if (!dossier.editorial.researchScope || !dossier.editorial.sourcePolicy) failures.push(`${dossier.slug}: perimetro o politica delle fonti assente`);
  if (dossier.biography.paragraphs.length < 4 || dossier.biography.chronology.length < 4) failures.push(`${dossier.slug}: servono almeno quattro capitoli e quattro fasi cronologiche`);
  if (dossier.biography.paragraphs.some((paragraph) => paragraph.value.trim().length < 100)) failures.push(`${dossier.slug}: capitolo troppo breve per essere informativo`);
  if (dossier.biography.chronology.some((event) => event.description.trim().length < 60)) failures.push(`${dossier.slug}: fase cronologica troppo breve`);
  if (new Set(paragraphValues).size !== paragraphValues.length) failures.push(`${dossier.slug}: capitoli duplicati`);
  if (new Set(chronologyValues).size !== chronologyValues.length) failures.push(`${dossier.slug}: fasi cronologiche duplicate`);
  if (dossier.biography.paragraphs.some((paragraph) => genericHeadings.has(paragraph.heading))) failures.push(`${dossier.slug}: conserva un capitolo generico del vecchio modello`);
  if (dossier.editorial.sources.length < 3) failures.push(`${dossier.slug}: fonti dichiarate insufficienti`);
  if (!isDerived && (webSources.length < 2 || sourceDomains.size < 2)) failures.push(`${dossier.slug}: ricerca canonica senza almeno due fonti web indipendenti`);
  if (isDerived && !/non canonic|canone/i.test(`${dossier.summary.value} ${dossier.catalog.continuity} ${dossier.editorial.sourcePolicy}`)) failures.push(`${dossier.slug}: opera derivata senza separazione esplicita dal canone`);
  if (realPersonFranchises.has(record.franchise) && (!/person[ae] real[ei]/i.test(`${nature} ${classification}`) || /personaggio di finzione/i.test(`${nature} ${classification}`))) failures.push(`${dossier.slug}: persona reale classificata come soggetto di finzione`);
  if (dossier.slug === "gesu-cristo" && (!/storica e religiosa/i.test(`${nature} ${classification}`) || /finzione/i.test(`${nature} ${classification}`))) failures.push("gesu-cristo: profilo storico-religioso classificato in modo scorretto");
  if (dossier.slug === "baphomet" && (!/simbolo/i.test(`${nature} ${classification}`) || /personaggio di finzione/i.test(`${nature} ${classification}`))) failures.push("baphomet: simbolo storico classificato come personaggio");
  for (const value of valuesWithSources) {
    for (const sourceId of value.sourceIds || []) if (!sourceIds.has(sourceId)) failures.push(`${dossier.slug}: riferimento alla fonte inesistente ${sourceId}`);
  }
}

if (expectedIds.size) failures.push(`dossier mancanti: ${[...expectedIds].join(", ")}`);
if (/"extract"\s*:|"sections"\s*:\s*\[[^\]]*"text"/s.test(researchPacksText)) failures.push("pacchetti di ricerca: conservano estratti lunghi invece dei soli fatti strutturati");

if (failures.length) {
  console.error(`Audit ricerca approfondita fallito (${failures.length} problemi):`);
  failures.slice(0, 200).forEach((failure) => console.error(`- ${failure}`));
  if (failures.length > 200) console.error(`- ... altri ${failures.length - 200} problemi`);
  process.exit(1);
}

const canonicalCount = dossiers.filter((dossier) => dossier.editorial.verificationLabel === "Ricerca approfondita · fonti incrociate").length;
const derivedCount = dossiers.length - canonicalCount;
console.log(`${dossiers.length}/${dossiers.length} dossier verificati: ${canonicalCount} canonici o biografici con fonti incrociate, ${derivedCount} opere derivate con canone separato.`);
