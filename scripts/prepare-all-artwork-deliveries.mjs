import { createHash } from "node:crypto";
import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { zipSync } from "fflate";
import sharp from "sharp";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.join(root, "Vetrina Disegni");
const outputRoot = path.join(root, "output", "artwork-deliveries");
const sourceMap = JSON.parse(await readFile(path.join(root, "scripts", "artwork-source-map.json"), "utf8"));
const commercialNumbers = new Set([2, 3, 4, 5, 6, 13, 16, 17, 20, 24, 28, 30, 33, 35, 36, 37, 39, 41, 46, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 63, 64, 65, 67, 71]);
const essentialNumbers = new Set([6, 16, 33, 39]);
const detailedNumbers = new Set([4, 17, 20, 28, 35, 41, 48, 50, 52, 55, 59, 60, 63, 65, 67, 71]);
const selectedCode = process.argv.find((argument) => argument.startsWith("--code="))?.split("=")[1]?.toUpperCase();

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex").toUpperCase();
}

function safeName(value) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
}

function extractEditorialMetadata() {
  const filename = path.join(root, "lib", "artworkEditorial.ts");
  const source = ts.createSourceFile(filename, ts.sys.readFile(filename), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  let catalog;
  const visit = (node) => {
    if (ts.isVariableDeclaration(node) && node.name.getText(source) === "artworkEditorialCopy" && ts.isObjectLiteralExpression(node.initializer)) catalog = node.initializer;
    ts.forEachChild(node, visit);
  };
  visit(source);
  if (!catalog) throw new Error("Catalogo editoriale delle opere non trovato.");
  const metadata = new Map();
  for (const property of catalog.properties) {
    if (!ts.isPropertyAssignment(property) || !ts.isObjectLiteralExpression(property.initializer)) continue;
    const number = Number(property.name.getText(source));
    const fields = {};
    for (const field of property.initializer.properties) {
      if (!ts.isPropertyAssignment(field)) continue;
      const key = field.name.getText(source).replaceAll('"', "");
      if (ts.isStringLiteral(field.initializer) || ts.isNoSubstitutionTemplateLiteral(field.initializer)) fields[key] = field.initializer.text;
    }
    if (fields.title && fields.year) metadata.set(number, fields);
  }
  return metadata;
}

async function createWallpaper(source, width, height) {
  const background = await sharp(source)
    .flatten({ background: "#2b0d2f" })
    .resize(width, height, { fit: "cover", position: "centre", kernel: sharp.kernel.lanczos3 })
    .blur(Math.max(18, Math.round(Math.min(width, height) / 60)))
    .modulate({ brightness: 0.52, saturation: 0.82 })
    .jpeg({ quality: 92, chromaSubsampling: "4:4:4", mozjpeg: true })
    .toBuffer();
  const foreground = await sharp(source)
    .resize(Math.round(width * 0.9), Math.round(height * 0.9), { fit: "inside", kernel: sharp.kernel.lanczos3 })
    .withIccProfile("srgb")
    .png({ compressionLevel: 9 })
    .toBuffer();
  const foregroundMetadata = await sharp(foreground).metadata();
  const left = Math.round((width - foregroundMetadata.width) / 2);
  const top = Math.round((height - foregroundMetadata.height) / 2);
  return sharp(background)
    .composite([{ input: foreground, left, top }])
    .withIccProfile("srgb")
    .jpeg({ quality: 95, chromaSubsampling: "4:4:4", mozjpeg: true })
    .toBuffer();
}

function tierFor(number) {
  if (essentialNumbers.has(number)) return { code: "essenziale", label: "Edizione Essenziale" };
  if (detailedNumbers.has(number)) return { code: "dettagliata", label: "Edizione Dettagliata" };
  return { code: "premium", label: "Edizione Premium" };
}

const editorial = extractEditorialMetadata();
const index = [];
await mkdir(outputRoot, { recursive: true });

for (const number of [...commercialNumbers].sort((a, b) => a - b)) {
  const code = `LW-ART-${String(number).padStart(3, "0")}`;
  if (selectedCode && selectedCode !== code) continue;
  const sourceEntry = sourceMap.find((entry) => entry.code === code);
  const details = editorial.get(number);
  if (!sourceEntry || !details) throw new Error(`${code}: sorgente o metadati mancanti.`);
  const source = path.resolve(sourceRoot, sourceEntry.file);
  if (!source.startsWith(sourceRoot + path.sep)) throw new Error(`${code}: percorso sorgente non sicuro.`);
  const originalBytes = await readFile(source);
  const originalHash = sha256(originalBytes);
  const tier = tierFor(number);
  const titleToken = safeName(details.title);
  const deliveryRoot = path.join(outputRoot, code);
  const staging = path.join(deliveryRoot, "staging");
  await rm(deliveryRoot, { recursive: true, force: true });
  await mkdir(staging, { recursive: true });

  const originalExtension = path.extname(sourceEntry.file).toLowerCase() || ".png";
  const originalName = `${code}-${titleToken}-ORIGINALE-RICEVUTO${originalExtension}`;
  const srgbPngName = `${code}-${titleToken}-sRGB.png`;
  const srgbJpgName = `${code}-${titleToken}-sRGB.jpg`;
  await cp(source, path.join(staging, originalName));
  await sharp(source).flatten({ background: "#f8f1e8" }).withIccProfile("srgb").png({ compressionLevel: 9, palette: false }).toFile(path.join(staging, srgbPngName));
  await sharp(source).flatten({ background: "#f8f1e8" }).withIccProfile("srgb").jpeg({ quality: 98, chromaSubsampling: "4:4:4", mozjpeg: true }).toFile(path.join(staging, srgbJpgName));
  await writeFile(path.join(staging, `${code}-sfondo-desktop-2560x1440.jpg`), await createWallpaper(source, 2560, 1440));
  await writeFile(path.join(staging, `${code}-sfondo-smartphone-1440x2560.jpg`), await createWallpaper(source, 1440, 2560));

  const license = `LOREWISE UNIVERSE · GIWISE STUDIO\nLICENZA PERSONALE DIGITALE\n\nOpera: ${details.title}\nCodice: ${code}\nAnno: ${details.year}\nEdizione: ${tier.label}\n\nLa licenza è personale, non esclusiva e non trasferibile. Il diritto d'autore e la proprietà intellettuale restano a GiWise Studio.\n\nUSI CONSENTITI\n- Conservazione sui dispositivi personali e utilizzo come sfondo.\n- Fino a 3 stampe fisiche esclusivamente personali.\n- Versione ridotta come immagine profilo con attribuzione a GiWise Studio.\n\nUSI VIETATI\n- Rivendita, redistribuzione o pubblicazione dei file in piena risoluzione.\n- Merchandising, pubblicità, loghi o altri impieghi commerciali.\n- NFT, sublicenze o trasferimento ad altre persone.\n- Addestramento di sistemi di intelligenza artificiale o inserimento in dataset.\n- Rimozione della firma o delle informazioni sul diritto d'autore.\n\nIl certificato nominativo viene generato separatamente nell'Area personale LoreWise ID.\n`;
  const readme = `${details.title} · ${tier.label}\n\nCONTENUTO\n- originale ricevuto conservato byte per byte;\n- PNG appiattito con profilo colore sRGB;\n- JPG sRGB ad alta qualità e compatibilità;\n- sfondo desktop 2560 × 1440 con opera integralmente visibile;\n- sfondo smartphone 1440 × 2560 con opera integralmente visibile;\n- licenza personale e manifesto SHA-256.\n\nNessun file di lavorazione o livello sorgente è incluso. Il certificato nominativo è separato e collegato all'ordine.\nAssistenza: lorewise.archive@gmail.com\n`;
  await writeFile(path.join(staging, "CONDIZIONI-LICENZA-PERSONALE.txt"), license, "utf8");
  await writeFile(path.join(staging, "LEGGIMI.txt"), readme, "utf8");

  const namesBeforeManifest = (await readdir(staging)).sort();
  const manifestFiles = [];
  for (const name of namesBeforeManifest) {
    const bytes = await readFile(path.join(staging, name));
    manifestFiles.push({ file: name, size: bytes.length, sha256: sha256(bytes) });
  }
  const manifest = { artworkCode: code, title: details.title, year: details.year, edition: tier.label, sourceFile: sourceEntry.file, sourceSha256: originalHash, sourceUntouched: true, files: manifestFiles };
  await writeFile(path.join(staging, "MANIFEST-SHA256.json"), JSON.stringify(manifest, null, 2), "utf8");

  const zipEntries = {};
  for (const name of (await readdir(staging)).sort()) zipEntries[name] = new Uint8Array(await readFile(path.join(staging, name)));
  const archiveName = `${code}-pacchetto-${tier.code}.zip`;
  const archivePath = path.join(deliveryRoot, archiveName);
  const archiveBytes = zipSync(zipEntries, { level: 9 });
  await writeFile(archivePath, archiveBytes);
  const sourceHashAfter = sha256(await readFile(source));
  if (sourceHashAfter !== originalHash) throw new Error(`${code}: la sorgente originale è stata modificata.`);
  index.push({ code, title: details.title, year: details.year, edition: tier.label, package: path.relative(outputRoot, archivePath).replaceAll("\\", "/"), packageSize: archiveBytes.length, packageSha256: sha256(archiveBytes), source: sourceEntry.file, sourceSha256: originalHash });
  console.log(`${code} · ${details.title} · ${(archiveBytes.length / 1024 / 1024).toFixed(2)} MiB`);
}

if (selectedCode && !index.length) throw new Error(`Codice commerciale non riconosciuto: ${selectedCode}`);
const indexPath = path.join(outputRoot, "delivery-index.json");
if (selectedCode) {
  const previous = JSON.parse(await readFile(indexPath, "utf8"));
  const deliveriesByCode = new Map(previous.deliveries.map((delivery) => [delivery.code, delivery]));
  for (const delivery of index) deliveriesByCode.set(delivery.code, delivery);
  const deliveries = [...deliveriesByCode.values()].sort((a, b) => a.code.localeCompare(b.code));
  await writeFile(indexPath, JSON.stringify({ generatedAt: new Date().toISOString(), count: deliveries.length, deliveries }, null, 2), "utf8");
} else {
  await writeFile(indexPath, JSON.stringify({ generatedAt: new Date().toISOString(), count: index.length, deliveries: index }, null, 2), "utf8");
}
console.log(`Pacchetti preparati: ${index.length}. Originali verificati e invariati.`);
