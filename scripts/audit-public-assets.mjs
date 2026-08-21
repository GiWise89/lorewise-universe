import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoots = ["app", "components"];
const extensions = new Set([".tsx", ".ts", ".css"]);
const failures = [];
const references = new Map();

function collect(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return collect(absolute);
    return extensions.has(path.extname(entry.name)) ? [absolute] : [];
  });
}

for (const file of sourceRoots.flatMap((directory) => collect(path.join(root, directory)))) {
  const text = fs.readFileSync(file, "utf8");
  for (const match of text.matchAll(/\/(?:[A-Za-z0-9_+.%-]+\/)*[A-Za-z0-9_+.%-]+\.(?:png|jpe?g|webp|svg)/gi)) {
    const publicPath = match[0];
    const diskPath = path.join(root, "public", publicPath.slice(1));
    if (!fs.existsSync(diskPath)) failures.push(`${path.relative(root, file)}: risorsa assente ${publicPath}`);
    else references.set(publicPath, fs.statSync(diskPath).size);
    if (publicPath.startsWith("/codex/characters/")) failures.push(`${path.relative(root, file)}: originale Codex esposto direttamente ${publicPath}`);
    if (/^\/(?:brand\/(?:icons|art-portals)|codex\/(?:seals|ornaments)|backgrounds)\/.*\.png$/i.test(publicPath)) failures.push(`${path.relative(root, file)}: variante WebP non utilizzata ${publicPath}`);
  }
}

for (const [publicPath, bytes] of references) {
  if (bytes > 3 * 1024 * 1024) failures.push(`${publicPath}: ${(bytes / 1024 / 1024).toFixed(2)} MB supera il limite di 3 MB per una risorsa caricata direttamente`);
}

if (failures.length) {
  console.error(`Audit risorse pubbliche fallito (${failures.length}):\n${failures.slice(0, 120).join("\n")}`);
  process.exit(1);
}

const total = [...references.values()].reduce((sum, bytes) => sum + bytes, 0);
console.log(`Audit risorse pubbliche superato: ${references.size} file statici referenziati, ${(total / 1024 / 1024).toFixed(2)} MB complessivi unici, nessun originale Codex caricato direttamente e nessuna risorsa singola oltre 3 MB.`);
