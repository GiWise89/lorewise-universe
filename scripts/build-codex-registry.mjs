import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "..");
const fuoriTramaRoot = process.env.FUORI_TRAMA_ROOT
  ? path.resolve(process.env.FUORI_TRAMA_ROOT)
  : "C:\\Users\\Luigi\\Documents\\proggetti GiWise Studio\\LoreWise App\\lorewise-v1-starter\\fuori-trama-next";
const registryPath = path.join(fuoriTramaRoot, "src", "data", "characters.json");
const sourcePublicRoot = path.join(fuoriTramaRoot, "public");
const destinationRoot = path.join(projectRoot, "assets", "codex-character-originals", "fuori-trama");
const dataRoot = path.join(projectRoot, "data", "codex");
const generatedRegistryPath = path.join(dataRoot, "fuori-trama-registry.generated.json");
const auditPath = path.join(dataRoot, "fuori-trama-registry.audit.json");
const manifestPath = path.join(dataRoot, "fuori-trama-import-manifest.generated.json");

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function pngDimensions(buffer) {
  if (buffer.length < 24 || buffer.toString("ascii", 1, 4) !== "PNG") return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function jpegDimensions(buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
  let offset = 2;
  const sofMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
  while (offset + 8 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buffer[offset + 1];
    if (marker === 0xd8 || marker === 0xd9) {
      offset += 2;
      continue;
    }
    const segmentLength = buffer.readUInt16BE(offset + 2);
    if (sofMarkers.has(marker)) {
      return { width: buffer.readUInt16BE(offset + 7), height: buffer.readUInt16BE(offset + 5) };
    }
    if (segmentLength < 2) break;
    offset += 2 + segmentLength;
  }
  return null;
}

function webpDimensions(buffer) {
  if (buffer.length < 30 || buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WEBP") return null;
  const kind = buffer.toString("ascii", 12, 16);
  if (kind === "VP8X") {
    return {
      width: 1 + buffer.readUIntLE(24, 3),
      height: 1 + buffer.readUIntLE(27, 3),
    };
  }
  if (kind === "VP8 ") {
    return {
      width: buffer.readUInt16LE(26) & 0x3fff,
      height: buffer.readUInt16LE(28) & 0x3fff,
    };
  }
  if (kind === "VP8L" && buffer[20] === 0x2f) {
    const b0 = buffer[21];
    const b1 = buffer[22];
    const b2 = buffer[23];
    const b3 = buffer[24];
    return {
      width: 1 + b0 + ((b1 & 0x3f) << 8),
      height: 1 + (b1 >> 6) + (b2 << 2) + ((b3 & 0x0f) << 10),
    };
  }
  return null;
}

function imageDimensions(buffer, extension) {
  if (extension === ".png") return pngDimensions(buffer);
  if (extension === ".jpg" || extension === ".jpeg") return jpegDimensions(buffer);
  if (extension === ".webp") return webpDimensions(buffer);
  return null;
}

function sourcePathFor(image) {
  const relativePath = image.replace(/^\/fuori-trama-next\//, "").replaceAll("/", path.sep);
  return path.join(sourcePublicRoot, relativePath);
}

if (!fs.existsSync(registryPath)) {
  throw new Error(`Registro Fuori Trama non trovato: ${registryPath}`);
}

const characters = JSON.parse(fs.readFileSync(registryPath, "utf8"));
if (!Array.isArray(characters)) throw new Error("characters.json deve contenere un array.");

fs.mkdirSync(destinationRoot, { recursive: true });
fs.mkdirSync(dataRoot, { recursive: true });

const seenIds = new Set();
const seenImages = new Set();
const missing = [];
const invalidDimensions = [];
const records = [];

for (const character of characters) {
  if (seenIds.has(character.id)) throw new Error(`ID duplicato: ${character.id}`);
  if (seenImages.has(character.image)) throw new Error(`Immagine associata a più schede: ${character.image}`);
  seenIds.add(character.id);
  seenImages.add(character.image);

  const sourcePath = sourcePathFor(character.image);
  if (!fs.existsSync(sourcePath)) {
    missing.push({ id: character.id, image: character.image, sourcePath });
    continue;
  }

  const extension = path.extname(sourcePath).toLowerCase();
  const buffer = fs.readFileSync(sourcePath);
  const dimensions = imageDimensions(buffer, extension);
  if (!dimensions?.width || !dimensions?.height) {
    invalidDimensions.push({ id: character.id, image: character.image, sourcePath });
    continue;
  }

  const destinationFilename = `${character.id}${extension}`;
  const destinationPath = path.join(destinationRoot, destinationFilename);
  fs.copyFileSync(sourcePath, destinationPath);
  const copiedBuffer = fs.readFileSync(destinationPath);
  const sourceHash = sha256(buffer);
  const copiedHash = sha256(copiedBuffer);
  if (sourceHash !== copiedHash) throw new Error(`Copia non identica per ${character.id}`);

  records.push({
    id: character.id,
    name: character.name,
    franchise: character.franchise,
    category: character.category,
    description: character.description,
    traits: character.traits ?? [],
    abilities: character.abilities ?? [],
    stats: character.stats ?? null,
    sourceCard: character.sourceCard ?? null,
    sourceImage: character.image,
    codexImage: `/codex/characters/fuori-trama/${destinationFilename}`,
    width: dimensions.width,
    height: dimensions.height,
    bytes: buffer.length,
    sha256: sourceHash,
  });
}

const nameGroups = Map.groupBy(records, (record) => record.name);
const duplicateNames = [...nameGroups]
  .filter(([, group]) => group.length > 1)
  .map(([name, group]) => ({ name, ids: group.map((record) => record.id) }));
const franchiseGroups = Map.groupBy(records, (record) => record.franchise);
const franchises = [...franchiseGroups]
  .map(([name, group]) => ({ name, count: group.length }))
  .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "it"));

const audit = {
  generatedAt: new Date().toISOString(),
  sourceRegistry: registryPath,
  totalCharacters: characters.length,
  exportedCharacters: records.length,
  uniqueIds: seenIds.size,
  uniqueSourceImages: seenImages.size,
  missing,
  invalidDimensions,
  duplicateNames,
  franchises,
  byteIdenticalCopies: records.length,
};

const originalFranchises = new Set(["The Wound Remembers", "LoreWise Originals"]);
const curatedDossiers = new Map([
  ["giwise-twr-viandante-sangue-cavo", "nhevara-madreferita"],
  ["giwise-twr-viandante-tomba-affamata", "kharvoss-re-sepolto"],
  ["pennywise-modern", "pennywise-it"],
]);
const manifest = records.map((record, index) => ({
  dossierCode: `LW-CX-${String(index + 1).padStart(4, "0")}`,
  registryId: record.id,
  slug: curatedDossiers.get(record.id) ?? record.id,
  name: record.name,
  franchise: record.franchise,
  origin: originalFranchises.has(record.franchise) ? "giwise-original" : "documented-third-party",
  image: record.codexImage,
  imageSha256: record.sha256,
  researchStatus: curatedDossiers.has(record.id) ? "complete" : "pending",
  dossierStatus: curatedDossiers.has(record.id) ? "complete" : "in-review",
}));

fs.writeFileSync(generatedRegistryPath, `${JSON.stringify(records, null, 2)}\n`, "utf8");
fs.writeFileSync(auditPath, `${JSON.stringify(audit, null, 2)}\n`, "utf8");
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

if (missing.length || invalidDimensions.length || records.length !== characters.length) {
  throw new Error(`Esportazione incompleta: ${records.length}/${characters.length}. Controlla ${auditPath}`);
}

console.log(`Esportate ${records.length} immagini senza ricompressione.`);
console.log(`Registro: ${generatedRegistryPath}`);
console.log(`Audit: ${auditPath}`);
console.log(`Manifest: ${manifestPath}`);
