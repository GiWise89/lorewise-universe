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
console.log(`Audit Codex superato: ${registry.length}/${registry.length} schede, ${registry.length}/${registry.length} immagini associate e byte-identiche, otto sezioni complete per ogni dossier.`);
