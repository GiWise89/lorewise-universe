import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { Miniflare } from "miniflare";
import installer from "../data/games/windows-installer.json" with { type: "json" };

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fileArg = process.argv[2]?.trim();
const execute = process.argv.includes("--execute-local");
if (!fileArg) throw new Error("Indica il percorso dell’installer Windows verificato.");
const filePath = path.resolve(fileArg);
if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) throw new Error("Installer non trovato.");

const stat = fs.statSync(filePath);
const hash = crypto.createHash("sha256");
await new Promise((resolve, reject) => fs.createReadStream(filePath)
  .on("data", (chunk) => hash.update(chunk)).on("end", resolve).on("error", reject));
const sha256 = hash.digest("hex").toUpperCase();
if (path.basename(filePath) !== installer.filename || stat.size !== installer.size || sha256 !== installer.sha256) {
  throw new Error("L’installer non coincide con nome, dimensione e SHA-256 approvati.");
}
if (!execute) {
  console.log(JSON.stringify({ mode: "dry-run", verified: true, filePath, size: stat.size, sha256 }, null, 2));
  console.log("Nessun dato scritto. Ripeti con --execute-local per il solo deposito R2 locale.");
  process.exit(0);
}

const miniflare = new Miniflare({
  resourcePersistencePath: path.join(root, ".wrangler", "state", "v3"),
  workers: [{
    config: {
      name: "lorewise-local-delivery",
      type: "worker",
      compatibilityDate: "2026-08-20",
      manifest: {
        mainModule: "index.js",
        modules: { "index.js": { type: "esm", contents: "export default { async fetch() { return new Response('LoreWise local delivery'); } }" } },
      },
      env: { COMMISSION_UPLOADS: { type: "r2", name: "site-creator-r2" } },
    },
  }],
});

try {
  const bucket = await miniflare.getR2Bucket("COMMISSION_UPLOADS");
  const objectOptions = {
      httpMetadata: {
        contentType: installer.contentType,
        contentDisposition: `attachment; filename="${installer.filename}"`,
      },
      customMetadata: {
        productCode: installer.productCode,
        gameCode: installer.gameCode,
        platform: installer.platform,
        version: installer.version,
        sha256: installer.sha256.toLowerCase(),
        visibility: "private",
        environment: "local-e2e-only",
      },
  };
  const multipart = await bucket.createMultipartUpload(installer.objectKey, objectOptions);
  const parts = [];
  const partSize = 64 * 1024 * 1024;
  const handle = await fs.promises.open(filePath, "r");
  try {
    let position = 0;
    let partNumber = 1;
    while (position < stat.size) {
      const bytesToRead = Math.min(partSize, stat.size - position);
      const buffer = Buffer.allocUnsafe(bytesToRead);
      const { bytesRead } = await handle.read(buffer, 0, bytesToRead, position);
      if (bytesRead !== bytesToRead) throw new Error("Lettura incompleta dell’installer durante il deposito locale.");
      parts.push(await multipart.uploadPart(partNumber, buffer));
      position += bytesRead;
      partNumber += 1;
      console.log(`Deposito R2 locale: ${Math.floor((position / stat.size) * 100)}%`);
    }
    await multipart.complete(parts);
  } catch (error) {
    await multipart.abort().catch(() => undefined);
    throw error;
  } finally {
    await handle.close();
  }
  const stored = await bucket.head(installer.objectKey);
  if (!stored || stored.size !== installer.size || stored.customMetadata?.sha256?.toUpperCase() !== installer.sha256) {
    await bucket.delete(installer.objectKey);
    throw new Error("Il controllo del deposito R2 locale non corrisponde all’installer approvato.");
  }

  const d1Directory = path.join(root, ".wrangler", "state", "v3", "d1", "miniflare-D1DatabaseObject");
  const databaseFile = fs.readdirSync(d1Directory).find((name) => name.endsWith(".sqlite") && name !== "metadata.sqlite");
  if (!databaseFile) throw new Error("Database LoreWise locale non trovato.");
  const database = new DatabaseSync(path.join(d1Directory, databaseFile));
  database.exec("PRAGMA busy_timeout = 10000");
  const admin = database.prepare("SELECT id FROM customers WHERE role = 'admin' AND status = 'active' ORDER BY created_at ASC LIMIT 1").get();
  if (!admin?.id) {
    database.close();
    await bucket.delete(installer.objectKey);
    throw new Error("Amministratore LoreWise locale non trovato.");
  }
  database.prepare(`INSERT INTO game_delivery_files
    (id, product_code, game_code, platform, version, object_key, filename, content_type, size, sha256,
     signature_status, scan_status, install_test_status, update_test_status, status, approved_by, approved_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'unsigned_disclosed', 'passed', 'passed',
      'deferred_first_release', 'approved', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT(product_code) DO UPDATE SET version = excluded.version, object_key = excluded.object_key,
      filename = excluded.filename, content_type = excluded.content_type, size = excluded.size, sha256 = excluded.sha256,
      signature_status = excluded.signature_status, scan_status = excluded.scan_status,
      install_test_status = excluded.install_test_status, update_test_status = excluded.update_test_status,
      status = excluded.status, approved_by = excluded.approved_by, approved_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP`)
    .run(crypto.randomUUID(), installer.productCode, installer.gameCode, installer.platform, installer.version,
      installer.objectKey, installer.filename, installer.contentType, installer.size, installer.sha256.toLowerCase(), admin.id);
  database.close();
  console.log(JSON.stringify({
    mode: "local-e2e", productCode: installer.productCode, objectKey: installer.objectKey,
    size: stored.size, sha256: stored.customMetadata?.sha256, status: "approved",
  }, null, 2));
} finally {
  await miniflare.dispose();
}
