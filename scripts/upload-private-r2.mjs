import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import installer from "../data/games/windows-installer.json" with { type: "json" };

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const execute = args.includes("--execute");
const value = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : "";
};
const fileArg = value("--file");
if (!fileArg) {
  console.error("Uso: npm run r2:upload-game -- --file \"C:\\percorso\\installer.exe\" [--execute]");
  process.exit(1);
}

const filePath = path.resolve(fileArg);
if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
  console.error(`File non trovato: ${filePath}`);
  process.exit(1);
}

const stat = fs.statSync(filePath);
const hash = crypto.createHash("sha256");
await new Promise((resolve, reject) => fs.createReadStream(filePath).on("data", (chunk) => hash.update(chunk)).on("end", resolve).on("error", reject));
const sha256 = hash.digest("hex").toUpperCase();
const errors = [];
if (path.basename(filePath) !== installer.filename) errors.push(`nome atteso: ${installer.filename}`);
if (stat.size !== installer.size) errors.push(`dimensione attesa: ${installer.size} byte`);
if (sha256 !== installer.sha256) errors.push(`SHA-256 atteso: ${installer.sha256}`);
if (errors.length) {
  console.error(`Installer rifiutato prima del trasferimento:\n- ${errors.join("\n- ")}`);
  process.exit(1);
}

const bucket = process.env.R2_BUCKET_NAME?.trim() || "";
const receipt = {
  action: "register_existing",
  productCode: installer.productCode,
  gameCode: installer.gameCode,
  platform: installer.platform,
  version: installer.version,
  objectKey: installer.objectKey,
  filename: installer.filename,
  contentType: installer.contentType,
  size: installer.size,
  sha256: installer.sha256,
};

if (!execute) {
  console.log(JSON.stringify({ mode: "dry-run", verified: true, bucket: bucket || "DA_CONFIGURARE", filePath, partSizeMiB: 16, receipt }, null, 2));
  console.log("Nessun file è stato caricato. Ripeti con --execute soltanto dopo aver configurato le credenziali R2 limitate al bucket privato.");
  process.exit(0);
}

const accountId = process.env.R2_ACCOUNT_ID?.trim();
const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
if (!accountId || !bucket || !accessKeyId || !secretAccessKey) {
  console.error("Configura R2_ACCOUNT_ID, R2_BUCKET_NAME, R2_ACCESS_KEY_ID e R2_SECRET_ACCESS_KEY nell'ambiente locale protetto.");
  process.exit(1);
}

const [{ S3Client, HeadObjectCommand }, { Upload }] = await Promise.all([
  import("@aws-sdk/client-s3"),
  import("@aws-sdk/lib-storage"),
]);
const client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
});
const upload = new Upload({
  client,
  params: {
    Bucket: bucket,
    Key: installer.objectKey,
    Body: fs.createReadStream(filePath),
    ContentType: installer.contentType,
    ContentDisposition: `attachment; filename="${installer.filename}"`,
    Metadata: {
      productcode: installer.productCode,
      gamecode: installer.gameCode,
      platform: installer.platform,
      version: installer.version,
      sha256: installer.sha256.toLowerCase(),
      visibility: "private",
    },
  },
  queueSize: 3,
  partSize: 16 * 1024 * 1024,
  leavePartsOnError: false,
});
let lastPercent = -1;
upload.on("httpUploadProgress", (progress) => {
  const percent = Math.floor(((progress.loaded ?? 0) / installer.size) * 100);
  if (percent >= lastPercent + 5 || percent === 100) {
    lastPercent = percent;
    console.log(`Trasferimento privato: ${Math.min(percent, 100)}%`);
  }
});
const completed = await upload.done();
const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: installer.objectKey }));
if (Number(head.ContentLength) !== installer.size || head.Metadata?.sha256?.toUpperCase() !== installer.sha256) {
  console.error("Il controllo remoto di dimensione o SHA-256 metadata non corrisponde. Non registrare il file in LoreWise.");
  process.exit(1);
}
const finalReceipt = { ...receipt, bucket, etag: completed.ETag ?? head.ETag ?? null, uploadedAt: new Date().toISOString(), remoteVerified: true };
const outputDirectory = path.join(root, "output", "r2-upload-receipts");
fs.mkdirSync(outputDirectory, { recursive: true });
const receiptPath = path.join(outputDirectory, `${installer.productCode}-${installer.version}.json`);
fs.writeFileSync(receiptPath, `${JSON.stringify(finalReceipt, null, 2)}\n`, "utf8");
console.log(JSON.stringify(finalReceipt, null, 2));
console.log(`Ricevuta verificata salvata in ${receiptPath}. Copiala nell'Archivio giochi Windows per registrare il file in quarantena.`);
