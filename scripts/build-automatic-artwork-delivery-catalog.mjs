import { createHash } from "node:crypto";
import { readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = path.join(root, "output", "artwork-deliveries");
const publicIndex = JSON.parse(await readFile(path.join(outputRoot, "delivery-index.json"), "utf8"));
const vipIndex = JSON.parse(await readFile(path.join(outputRoot, "vip-delivery-index.json"), "utf8"));
const indexedDeliveries = [...(publicIndex.deliveries ?? []), ...(vipIndex.deliveries ?? [])];
if (indexedDeliveries.length !== 50) {
  throw new Error(`Il catalogo automatico richiede 50 pacchetti verificati; trovati ${indexedDeliveries.length}.`);
}

const deliveries = [];
for (const entry of indexedDeliveries.sort((a, b) => a.code.localeCompare(b.code))) {
  if (!/^LW-(?:VIP-)?ART-\d{3}$/.test(entry.code) || typeof entry.package !== "string") {
    throw new Error("Voce di consegna non valida.");
  }
  const packagePath = path.resolve(outputRoot, entry.package);
  if (!packagePath.startsWith(outputRoot + path.sep)) throw new Error(`${entry.code}: percorso ZIP non sicuro.`);
  const info = await stat(packagePath);
  const bytes = await readFile(packagePath);
  const actualSha256 = createHash("sha256").update(bytes).digest("hex");
  if (info.size !== Number(entry.packageSize) || actualSha256 !== String(entry.packageSha256).toLowerCase()) {
    throw new Error(`${entry.code}: il pacchetto non coincide con l'indice verificato.`);
  }
  const filename = path.basename(packagePath);
  deliveries.push({
    code: entry.code,
    filename,
    contentType: "application/zip",
    size: info.size,
    sha256: actualSha256,
    objectKey: `art-deliveries/automatic/${entry.code.toLowerCase()}/${filename}`,
    localPackage: entry.package.replaceAll("\\", "/"),
  });
}

await writeFile(path.join(root, "data", "automatic-artwork-deliveries.json"), `${JSON.stringify({ schemaVersion: 1, count: deliveries.length, deliveries }, null, 2)}\n`, "utf8");
console.log(`Catalogo automatico creato: ${deliveries.length} pacchetti, originali non modificati.`);
