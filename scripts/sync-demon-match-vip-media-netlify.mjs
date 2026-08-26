import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getStore } from "@netlify/blobs";
import { Miniflare } from "miniflare";

const SITE_ID = "11a8e4a6-d1a6-4bbd-ae2e-8e823786e760";
const STORE_NAME = "lorewise-private-deliveries";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.join(root, "tmp", "demon-match-vip-previews");
const execute = process.argv.includes("--execute");
const seedLocal = process.argv.includes("--local");
const files = [
  { id: "demon-match-duality", name: "nora-varek-duality-v1.webp" },
  { id: "demon-match-nora", name: "nora-order-of-dawn-v1.webp" },
  { id: "demon-match-varek", name: "varek-shadow-lineage-v1.webp" },
].map((item) => ({
  ...item,
  key: `vip-zone/games/demon-match-three/${item.name}`,
  bytes: fs.readFileSync(path.join(sourceRoot, item.name)),
}));

function readNetlifyToken() {
  const configPath = path.join(os.homedir(), "AppData", "Roaming", "netlify", "Config", "config.json");
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const activeUser = config.users?.[config.userId] ?? Object.values(config.users ?? {})[0];
  const token = activeUser?.auth?.token;
  if (!token) throw new Error("Sessione Netlify non trovata.");
  return token;
}

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const prepared = files.map((file) => ({ id: file.id, key: file.key, size: file.bytes.length, sha256: sha256(file.bytes) }));

if (seedLocal) {
  const miniflare = new Miniflare({
    resourcePersistencePath: path.join(root, ".wrangler", "state", "v3"),
    workers: [{
      config: {
        name: "lorewise-demon-match-vip-local",
        type: "worker",
        compatibilityDate: "2026-08-21",
        manifest: { mainModule: "index.js", modules: { "index.js": { type: "esm", contents: "export default { async fetch() { return new Response('VIP seed'); } }" } } },
        env: { COMMISSION_UPLOADS: { type: "r2", name: "site-creator-r2" } },
      },
    }],
  });
  try {
    const bucket = await miniflare.getR2Bucket("COMMISSION_UPLOADS");
    for (const file of files) await bucket.put(file.key, file.bytes, { httpMetadata: { contentType: "image/webp" } });
    console.log(JSON.stringify({ mode: "local-r2", stored: files.length }, null, 2));
  } finally {
    await miniflare.dispose();
  }
} else if (!execute) {
  console.log(JSON.stringify({ mode: "dry-run", files: prepared }, null, 2));
} else {
  const store = getStore({ name: STORE_NAME, siteID: SITE_ID, token: readNetlifyToken(), consistency: "strong" });
  const uploaded = [];
  for (const file of files) {
    const digest = sha256(file.bytes);
    const metadata = { size: file.bytes.length, contentType: "image/webp", customMetadata: { mediaid: file.id, role: "protected-preview", sha256: digest, visibility: "private" } };
    await store.set(file.key, file.bytes, { metadata });
    await store.setJSON(`__metadata__/${file.key}.json`, metadata);
    const remote = await store.get(file.key, { type: "arrayBuffer", consistency: "strong" });
    if (!remote || Buffer.from(remote).length !== file.bytes.length || sha256(Buffer.from(remote)) !== digest) {
      throw new Error(`Verifica remota fallita per ${file.id}.`);
    }
    uploaded.push({ id: file.id, key: file.key, size: file.bytes.length, sha256: digest, verified: true });
  }
  console.log(JSON.stringify({ mode: "execute", store: STORE_NAME, uploaded }, null, 2));
}
