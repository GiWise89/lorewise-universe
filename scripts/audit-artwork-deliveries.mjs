import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { unzipSync } from "fflate";
import sourceMap from "./artwork-source-map.json" with { type: "json" };

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = path.join(root, "output", "artwork-deliveries");
const sourceRoot = path.join(root, "Vetrina Disegni");
const index = JSON.parse(await readFile(path.join(outputRoot, "delivery-index.json"), "utf8"));
const failures = [];
const requiredPatterns = [/ORIGINALE-RICEVUTO\./i, /-sRGB\.png$/i, /-sRGB\.jpg$/i, /sfondo-desktop-2560x1440\.jpg$/i, /sfondo-smartphone-1440x2560\.jpg$/i, /^CONDIZIONI-LICENZA-PERSONALE\.txt$/i, /^LEGGIMI\.txt$/i, /^MANIFEST-SHA256\.json$/i];
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex").toUpperCase();

if (index.count !== 39 || index.deliveries?.length !== 39) failures.push(`Indice incompleto: ${index.count ?? 0}/39 pacchetti.`);
for (const delivery of index.deliveries ?? []) {
  const archivePath = path.join(outputRoot, delivery.package);
  const archive = await readFile(archivePath).catch(() => null);
  if (!archive) { failures.push(`${delivery.code}: archivio assente.`); continue; }
  if (hash(archive) !== delivery.packageSha256) failures.push(`${delivery.code}: hash ZIP non corrispondente.`);
  const entries = Object.keys(unzipSync(new Uint8Array(archive)));
  for (const pattern of requiredPatterns) if (!entries.some((entry) => pattern.test(entry))) failures.push(`${delivery.code}: manca ${pattern}.`);
  const sourceEntry = sourceMap.find((entry) => entry.code === delivery.code);
  const permittedSourceRoot = sourceEntry?.root === "project" ? root : sourceRoot;
  const source = path.resolve(permittedSourceRoot, delivery.source);
  if (!source.startsWith(permittedSourceRoot + path.sep)) { failures.push(`${delivery.code}: sorgente fuori archivio.`); continue; }
  const sourceBytes = await readFile(source).catch(() => null);
  if (!sourceBytes || hash(sourceBytes) !== delivery.sourceSha256) failures.push(`${delivery.code}: sorgente assente o modificata.`);
  const info = await stat(archivePath).catch(() => null);
  if (!info?.size) failures.push(`${delivery.code}: archivio vuoto.`);
}

if (failures.length) {
  console.error(`Audit consegne Arte fallito (${failures.length}):\n${failures.join("\n")}`);
  process.exit(1);
}
const total = index.deliveries.reduce((sum, item) => sum + item.packageSize, 0);
console.log(`Audit consegne Arte superato: 39/39 pacchetti commerciali, ${(total / 1024 / 1024).toFixed(2)} MiB, originali invariati, copie sRGB e sfondi integrali presenti.`);
