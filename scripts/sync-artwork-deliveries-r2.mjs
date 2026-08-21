import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import catalog from "../data/automatic-artwork-deliveries.json" with { type: "json" };

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const execute = process.argv.includes("--execute");
const onlyCode = process.argv.find((argument) => argument.startsWith("--code="))?.slice(7).toUpperCase();
const deliveries = onlyCode ? catalog.deliveries.filter((entry) => entry.code === onlyCode) : catalog.deliveries;
if (!deliveries.length) throw new Error("Nessun pacchetto corrisponde alla selezione.");

async function sha256File(filePath) {
  const hash = createHash("sha256");
  await new Promise((resolve, reject) => fs.createReadStream(filePath)
    .on("data", (chunk) => hash.update(chunk))
    .on("end", resolve)
    .on("error", reject));
  return hash.digest("hex");
}

for (const delivery of deliveries) {
  const filePath = path.resolve(root, "output", "artwork-deliveries", delivery.localPackage);
  if (!filePath.startsWith(path.resolve(root, "output", "artwork-deliveries") + path.sep)) throw new Error(`${delivery.code}: percorso non sicuro.`);
  const info = fs.statSync(filePath);
  const sha256 = await sha256File(filePath);
  if (info.size !== delivery.size || sha256 !== delivery.sha256) throw new Error(`${delivery.code}: ZIP locale non verificato.`);
}

const totalBytes = deliveries.reduce((sum, delivery) => sum + delivery.size, 0);
if (!execute) {
  console.log(JSON.stringify({ mode: "dry-run", packages: deliveries.length, totalBytes, verified: true }, null, 2));
  console.log("Nessun file caricato. Usa --execute soltanto con credenziali R2 private configurate.");
  process.exit(0);
}

const accountId = process.env.R2_ACCOUNT_ID?.trim();
const bucket = process.env.R2_BUCKET_NAME?.trim();
const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
if (!accountId || !bucket || !accessKeyId || !secretAccessKey) {
  throw new Error("Configura R2_ACCOUNT_ID, R2_BUCKET_NAME, R2_ACCESS_KEY_ID e R2_SECRET_ACCESS_KEY.");
}
const client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
});

const receipts = [];
for (let index = 0; index < deliveries.length; index += 1) {
  const delivery = deliveries[index];
  const filePath = path.resolve(root, "output", "artwork-deliveries", delivery.localPackage);
  const upload = new Upload({
    client,
    params: {
      Bucket: bucket,
      Key: delivery.objectKey,
      Body: fs.createReadStream(filePath),
      ContentType: delivery.contentType,
      ContentDisposition: `attachment; filename="${delivery.filename}"`,
      Metadata: { artworkcode: delivery.code, sha256: delivery.sha256, visibility: "private", source: "automatic-catalog" },
    },
    queueSize: 1,
    partSize: 8 * 1024 * 1024,
    leavePartsOnError: false,
  });
  await upload.done();
  const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: delivery.objectKey }));
  if (Number(head.ContentLength) !== delivery.size || head.Metadata?.sha256 !== delivery.sha256) {
    throw new Error(`${delivery.code}: controllo remoto non riuscito.`);
  }
  receipts.push({ code: delivery.code, objectKey: delivery.objectKey, size: delivery.size, sha256: delivery.sha256 });
  console.log(`${index + 1}/${deliveries.length} · ${delivery.code} sincronizzato e verificato`);
}

const receiptDirectory = path.join(root, "output", "r2-upload-receipts");
fs.mkdirSync(receiptDirectory, { recursive: true });
const receiptPath = path.join(receiptDirectory, `artwork-automatic-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
fs.writeFileSync(receiptPath, `${JSON.stringify({ bucket, uploadedAt: new Date().toISOString(), packages: receipts }, null, 2)}\n`);
console.log(`Sincronizzazione completata: ${receipts.length} pacchetti privati. Ricevuta: ${receiptPath}`);
