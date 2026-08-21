import { createHash } from "node:crypto";
import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { zipSync } from "fflate";
import sharp from "sharp";
import { VIP_ARTWORKS_PRIVATE } from "../data/vip-artworks.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.join(root, "vip media", "opere");
const outputRoot = path.join(root, "output", "artwork-deliveries");
const indexPath = path.join(outputRoot, "vip-delivery-index.json");
const selectedCode = process.argv.find((argument) => argument.startsWith("--code="))?.slice(7).toUpperCase();
const artworks = VIP_ARTWORKS_PRIVATE.filter((artwork) => artwork.mode === "commercial");

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex").toUpperCase();
}

function safeName(value) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
}

function tierFor(priceCents) {
  if (priceCents === 890) return { code: "essenziale", label: "Edizione Essenziale" };
  if (priceCents === 1290) return { code: "dettagliata", label: "Edizione Dettagliata" };
  return { code: "premium", label: "Edizione Premium" };
}

async function createWallpaper(source, width, height) {
  const background = await sharp(source)
    .flatten({ background: "#21110d" })
    .resize(width, height, { fit: "cover", position: "centre", kernel: sharp.kernel.lanczos3 })
    .blur(Math.max(18, Math.round(Math.min(width, height) / 60)))
    .modulate({ brightness: 0.5, saturation: 0.8 })
    .jpeg({ quality: 91, chromaSubsampling: "4:4:4", mozjpeg: true })
    .toBuffer();
  const foreground = await sharp(source)
    .resize(Math.round(width * 0.9), Math.round(height * 0.9), { fit: "inside", kernel: sharp.kernel.lanczos3 })
    .withIccProfile("srgb")
    .png({ compressionLevel: 9 })
    .toBuffer();
  const metadata = await sharp(foreground).metadata();
  return sharp(background).composite([{
    input: foreground,
    left: Math.round((width - metadata.width) / 2),
    top: Math.round((height - metadata.height) / 2),
  }]).withIccProfile("srgb").jpeg({ quality: 95, chromaSubsampling: "4:4:4", mozjpeg: true }).toBuffer();
}

const deliveries = [];
await mkdir(outputRoot, { recursive: true });

for (const artwork of artworks) {
  if (selectedCode && selectedCode !== artwork.code) continue;
  if (!artwork.priceCents) throw new Error(`${artwork.code}: prezzo commerciale mancante.`);
  const source = path.resolve(sourceRoot, artwork.sourceFile);
  if (!source.startsWith(sourceRoot + path.sep)) throw new Error(`${artwork.code}: percorso sorgente non sicuro.`);
  const sourceBytes = await readFile(source);
  const sourceHash = sha256(sourceBytes);
  const tier = tierFor(artwork.priceCents);
  const titleToken = safeName(artwork.title);
  const deliveryRoot = path.join(outputRoot, artwork.code);
  const staging = path.join(deliveryRoot, "staging");
  await rm(deliveryRoot, { recursive: true, force: true });
  await mkdir(staging, { recursive: true });

  const extension = path.extname(artwork.sourceFile).toLowerCase() || ".png";
  const originalName = `${artwork.code}-${titleToken}-ORIGINALE-RICEVUTO${extension}`;
  await cp(source, path.join(staging, originalName));
  await sharp(source).flatten({ background: "#f8f1e8" }).withIccProfile("srgb").png({ compressionLevel: 9, palette: false }).toFile(path.join(staging, `${artwork.code}-${titleToken}-sRGB.png`));
  await sharp(source).flatten({ background: "#f8f1e8" }).withIccProfile("srgb").jpeg({ quality: 98, chromaSubsampling: "4:4:4", mozjpeg: true }).toFile(path.join(staging, `${artwork.code}-${titleToken}-sRGB.jpg`));
  await writeFile(path.join(staging, `${artwork.code}-sfondo-desktop-2560x1440.jpg`), await createWallpaper(source, 2560, 1440));
  await writeFile(path.join(staging, `${artwork.code}-sfondo-smartphone-1440x2560.jpg`), await createWallpaper(source, 1440, 2560));

  const license = `LOREWISE UNIVERSE · GIWISE STUDIO\nLICENZA PERSONALE DIGITALE VIP\n\nOpera: ${artwork.title}\nCodice: ${artwork.code}\nEdizione: ${tier.label}\n\nLa licenza è personale, non esclusiva e non trasferibile. Il diritto d'autore e la proprietà intellettuale restano a GiWise Studio.\n\nUSI CONSENTITI\n- Conservazione sui dispositivi personali e utilizzo come sfondo.\n- Fino a 3 stampe fisiche esclusivamente personali.\n- Versione ridotta come immagine profilo con attribuzione a GiWise Studio.\n\nUSI VIETATI\n- Rivendita, redistribuzione o pubblicazione dei file in piena risoluzione.\n- Merchandising, pubblicità, loghi o altri impieghi commerciali.\n- NFT, sublicenze o trasferimento ad altre persone.\n- Addestramento di sistemi di intelligenza artificiale o inserimento in dataset.\n- Rimozione della firma o delle informazioni sul diritto d'autore.\n`;
  const readme = `${artwork.title} · ${tier.label}\n\nPacchetto automatico riservato a una licenza LoreWise ID verificata.\n\nCONTENUTO\n- originale ricevuto conservato byte per byte;\n- PNG e JPG con profilo colore sRGB;\n- sfondi desktop e smartphone con opera integralmente visibile;\n- licenza personale e manifesto SHA-256.\n\nNessun livello o file di lavorazione è incluso.\nAssistenza: lorewise.archive@gmail.com\n`;
  await writeFile(path.join(staging, "CONDIZIONI-LICENZA-PERSONALE.txt"), license, "utf8");
  await writeFile(path.join(staging, "LEGGIMI.txt"), readme, "utf8");

  const manifestFiles = [];
  for (const name of (await readdir(staging)).sort()) {
    const bytes = await readFile(path.join(staging, name));
    manifestFiles.push({ file: name, size: bytes.length, sha256: sha256(bytes) });
  }
  const manifest = { artworkCode: artwork.code, title: artwork.title, edition: tier.label, sourceFile: artwork.sourceFile, sourceSha256: sourceHash, sourceUntouched: true, files: manifestFiles };
  await writeFile(path.join(staging, "MANIFEST-SHA256.json"), JSON.stringify(manifest, null, 2), "utf8");

  const zipEntries = {};
  for (const name of (await readdir(staging)).sort()) zipEntries[name] = new Uint8Array(await readFile(path.join(staging, name)));
  const archiveName = `${artwork.code}-pacchetto-${tier.code}.zip`;
  const archivePath = path.join(deliveryRoot, archiveName);
  const archiveBytes = zipSync(zipEntries, { level: 9 });
  await writeFile(archivePath, archiveBytes);
  if (sha256(await readFile(source)) !== sourceHash) throw new Error(`${artwork.code}: la sorgente originale è stata modificata.`);
  deliveries.push({ code: artwork.code, title: artwork.title, edition: tier.label, package: path.relative(outputRoot, archivePath).replaceAll("\\", "/"), packageSize: archiveBytes.length, packageSha256: sha256(archiveBytes), source: artwork.sourceFile, sourceSha256: sourceHash, sourceRoot: "vip media/opere" });
  await rm(staging, { recursive: true, force: true });
  console.log(`${artwork.code} · ${artwork.title} · ${(archiveBytes.length / 1024 / 1024).toFixed(2)} MiB`);
}

if (selectedCode && !deliveries.length) throw new Error(`Codice VIP commerciale non riconosciuto: ${selectedCode}`);
if (selectedCode) {
  const previous = JSON.parse(await readFile(indexPath, "utf8").catch(() => '{"deliveries":[]}'));
  const byCode = new Map(previous.deliveries.map((delivery) => [delivery.code, delivery]));
  for (const delivery of deliveries) byCode.set(delivery.code, delivery);
  const merged = [...byCode.values()].sort((a, b) => a.code.localeCompare(b.code));
  await writeFile(indexPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), count: merged.length, deliveries: merged }, null, 2)}\n`, "utf8");
} else {
  await writeFile(indexPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), count: deliveries.length, deliveries }, null, 2)}\n`, "utf8");
}
console.log(`Pacchetti VIP preparati: ${deliveries.length}. Originali verificati e invariati.`);
