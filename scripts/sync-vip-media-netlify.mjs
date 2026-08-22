import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { getStore } from "@netlify/blobs";
import { Miniflare } from "miniflare";

const SITE_ID = "11a8e4a6-d1a6-4bbd-ae2e-8e823786e760";
const STORE_NAME = "lorewise-private-deliveries";
const execute = process.argv.includes("--execute");
const root = path.resolve(new URL("..", import.meta.url).pathname.replace(/^\/(?:([A-Za-z]:))/, "$1"));

function readNetlifyToken() {
  const configPath = path.join(os.homedir(), "AppData", "Roaming", "netlify", "Config", "config.json");
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const activeUser = config.users?.[config.userId] ?? Object.values(config.users ?? {})[0];
  const token = activeUser?.auth?.token;
  if (!token) throw new Error("Sessione Netlify non trovata. Esegui prima `netlify login`.");
  return token;
}

const miniflare = new Miniflare({
  resourcePersistencePath: path.join(root, ".wrangler", "state", "v3"),
  workers: [{
    config: {
      name: "lorewise-vip-media-sync",
      type: "worker",
      compatibilityDate: "2026-08-21",
      manifest: {
        mainModule: "index.js",
        modules: { "index.js": { type: "esm", contents: "export default { async fetch() { return new Response('LoreWise VIP sync'); } }" } },
      },
      env: { COMMISSION_UPLOADS: { type: "r2", name: "site-creator-r2" } },
    },
  }],
});

try {
  const source = await miniflare.getR2Bucket("COMMISSION_UPLOADS");
  const remote = getStore({ name: STORE_NAME, siteID: SITE_ID, token: readNetlifyToken(), consistency: "strong" });
  const listed = await source.list({ prefix: "vip-zone/" });
  const sourceKeys = listed.objects.map((object) => object.key).sort();
  const remoteList = await remote.list({ prefix: "vip-zone/" });
  const remoteKeys = new Set(remoteList.blobs.map((blob) => blob.key));
  const missing = sourceKeys.filter((key) => !remoteKeys.has(key));

  console.log(JSON.stringify({ mode: execute ? "execute" : "audit", source: sourceKeys.length, remote: remoteKeys.size, missing: missing.length }, null, 2));
  if (!execute) {
    if (missing.length) console.log(missing.slice(0, 12).join("\n"));
    process.exit(0);
  }

  let uploaded = 0;
  for (const key of sourceKeys) {
    const object = await source.get(key);
    if (!object) throw new Error(`File locale non trovato durante il trasferimento: ${key}`);
    const bytes = await object.arrayBuffer();
    const contentType = object.httpMetadata?.contentType ?? "application/octet-stream";
    const customMetadata = object.customMetadata ?? {};
    await remote.set(key, bytes, { metadata: { size: bytes.byteLength, contentType, customMetadata } });
    await remote.setJSON(`__metadata__/${key}.json`, { size: bytes.byteLength, contentType, customMetadata });
    const verified = await remote.getMetadata(key, { consistency: "strong" });
    if (!verified) throw new Error(`Verifica remota fallita: ${key}`);
    uploaded += 1;
  }

  const finalList = await remote.list({ prefix: "vip-zone/" });
  console.log(JSON.stringify({ uploaded, remoteAfter: finalList.blobs.length, verified: uploaded === sourceKeys.length }, null, 2));
} finally {
  await miniflare.dispose();
}
