import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = path.join(root, "public");
const clientRoot = path.join(root, "dist", "client");
const serverEntry = path.join(root, "dist", "server", "index.js");
const failures = [];
const approvedPngs = new Set([
  "brand/lorewise-universe-logo-concept-c.png",
  "brand/lorewise-wax-seal-v1.png",
  // This referenced background has no WebP equivalent; its 1.8 MB size remains under the per-file budget.
  "backgrounds/halloween-corrupted-portrait-bg-v1.png",
]);

function collect(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? collect(absolute) : [absolute];
  });
}

function totalBytes(files) {
  return files.reduce((sum, file) => sum + fs.statSync(file).size, 0);
}

const publicFiles = collect(publicRoot);
const clientFiles = collect(clientRoot);
const publicBytes = totalBytes(publicFiles);
const clientBytes = totalBytes(clientFiles);

for (const file of publicFiles) {
  const relative = path.relative(publicRoot, file).replaceAll("\\", "/");
  const extension = path.extname(file).toLowerCase();
  const bytes = fs.statSync(file).size;
  if (extension === ".png" && !approvedPngs.has(relative)) failures.push(`${relative}: PNG sorgente rimasto nell'area pubblica`);
  if ([".exe", ".zip", ".7z", ".rar", ".psd", ".psb"].includes(extension)) failures.push(`${relative}: pacchetto o sorgente privato esposto`);
  if (bytes > 3 * 1024 * 1024) failures.push(`${relative}: ${(bytes / 1024 / 1024).toFixed(2)} MB supera il limite pubblico di 3 MB`);
}

if (!fs.existsSync(serverEntry)) failures.push("dist/server/index.js assente: eseguire prima la build");
else if (fs.statSync(serverEntry).size > 16 * 1024 * 1024) failures.push("dist/server/index.js supera 16 MB");
// The archive is intentionally media-rich; per-file and rendered-page audits protect runtime cost.
if (publicBytes > 280 * 1024 * 1024) failures.push(`public supera 280 MB (${(publicBytes / 1024 / 1024).toFixed(2)} MB)`);
if (clientBytes > 280 * 1024 * 1024) failures.push(`dist/client supera 280 MB (${(clientBytes / 1024 / 1024).toFixed(2)} MB)`);

if (failures.length) {
  console.error(`Audit pacchetto di pubblicazione fallito (${failures.length}):\n${failures.join("\n")}`);
  process.exit(1);
}

console.log(
  `Audit pacchetto superato: ${publicFiles.length} file pubblici (${(publicBytes / 1024 / 1024).toFixed(2)} MB), ` +
  `${clientFiles.length} file nel client di produzione (${(clientBytes / 1024 / 1024).toFixed(2)} MB), ` +
  `soltanto i PNG esplicitamente approvati, nessun archivio privato o file pubblico oltre 3 MB.`,
);
