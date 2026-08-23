import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getStore } from "@netlify/blobs";
import catalog from "../data/automatic-artwork-deliveries.json" with { type: "json" };

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteID = "11a8e4a6-d1a6-4bbd-ae2e-8e823786e760";
const execute = process.argv.includes("--execute");
const code = process.argv.find((argument) => argument.startsWith("--code="))?.slice(7).toUpperCase();
if (!code) throw new Error("Indica il codice con --code=LW-ART-000.");
const delivery = catalog.deliveries.find((entry) => entry.code === code);
if (!delivery) throw new Error(`${code}: consegna automatica non presente nel catalogo.`);
const packagePath = path.resolve(root, "output", "artwork-deliveries", delivery.localPackage);
if (!packagePath.startsWith(path.resolve(root, "output", "artwork-deliveries") + path.sep)) throw new Error(`${code}: percorso non sicuro.`);
const bytes = fs.readFileSync(packagePath);
const localSha256 = createHash("sha256").update(bytes).digest("hex");
if (bytes.length !== delivery.size || localSha256 !== delivery.sha256) throw new Error(`${code}: pacchetto locale non verificato.`);

if (!execute) {
  console.log(JSON.stringify({ mode: "dry-run", code, objectKey: delivery.objectKey, size: bytes.length, sha256: localSha256, verified: true }, null, 2));
  process.exit(0);
}

const configPath = path.join(os.homedir(), "AppData", "Roaming", "netlify", "Config", "config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const activeUser = config.users?.[config.userId] ?? Object.values(config.users ?? {})[0];
const token = activeUser?.auth?.token;
if (!token) throw new Error("Sessione Netlify non trovata. Esegui prima `netlify login`.");
const store = getStore({ name: "lorewise-private-deliveries", siteID, token, consistency: "strong" });
const metadata = { size: bytes.length, contentType: delivery.contentType, customMetadata: { artworkcode: code, sha256: localSha256, visibility: "private", source: "automatic-catalog" } };
await store.set(delivery.objectKey, bytes, { metadata });
await store.setJSON(`__metadata__/${delivery.objectKey}.json`, metadata);
const remote = await store.get(delivery.objectKey, { type: "arrayBuffer", consistency: "strong" });
if (!remote) throw new Error(`${code}: oggetto remoto assente dopo il caricamento.`);
const remoteBytes = Buffer.from(remote);
const remoteSha256 = createHash("sha256").update(remoteBytes).digest("hex");
if (remoteBytes.length !== delivery.size || remoteSha256 !== delivery.sha256) throw new Error(`${code}: verifica remota di dimensione o SHA-256 fallita.`);
console.log(JSON.stringify({ uploaded: true, store: "lorewise-private-deliveries", code, objectKey: delivery.objectKey, size: remoteBytes.length, sha256: remoteSha256, verified: true }, null, 2));
