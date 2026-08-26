import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getStore } from "@netlify/blobs";
import { VIP_WALLPAPERS_PRIVATE } from "../data/vip-downloads.ts";

const SITE_ID = "11a8e4a6-d1a6-4bbd-ae2e-8e823786e760";
const STORE_NAME = "lorewise-private-deliveries";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const previewRoot = path.join(root, "tmp", "vip-wallpaper-previews");
const execute = process.argv.includes("--execute");
const collection = process.argv.find((argument) => argument.startsWith("--collection="))?.slice(13);

if (collection !== "cyber-nexus") throw new Error("Per questo trasferimento indica --collection=cyber-nexus.");

function readNetlifyToken() {
  const configPath = path.join(os.homedir(), "AppData", "Roaming", "netlify", "Config", "config.json");
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const activeUser = config.users?.[config.userId] ?? Object.values(config.users ?? {})[0];
  const token = activeUser?.auth?.token;
  if (!token) throw new Error("Sessione Netlify non trovata. Esegui prima `netlify login`.");
  return token;
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function safeRead(relativePath, allowedRoot) {
  const absolutePath = path.resolve(root, relativePath);
  if (!absolutePath.startsWith(allowedRoot + path.sep) || !fs.existsSync(absolutePath)) throw new Error(`File locale non valido: ${relativePath}`);
  return fs.readFileSync(absolutePath);
}

const cyberWallpapers = VIP_WALLPAPERS_PRIVATE.filter((wallpaper) => wallpaper.mediaId.startsWith("cyber-nexus-"));
if (cyberWallpapers.length !== 6) throw new Error(`Attesi 6 sfondi Cyber Nexus, trovati ${cyberWallpapers.length}.`);

const files = cyberWallpapers.flatMap((wallpaper) => {
  const originalBytes = safeRead(wallpaper.sourcePath, path.join(root, "campaign", "cyber-nexus", "delivery"));
  const previewPath = path.join(previewRoot, `${wallpaper.previewId}.webp`);
  if (!previewPath.startsWith(previewRoot + path.sep) || !fs.existsSync(previewPath)) throw new Error(`Anteprima protetta non trovata: ${wallpaper.previewId}.`);
  const previewBytes = fs.readFileSync(previewPath);
  return [
    { id: wallpaper.mediaId, key: wallpaper.originalKey, bytes: originalBytes, contentType: "image/png", role: "original-private" },
    { id: wallpaper.previewId, key: wallpaper.previewKey, bytes: previewBytes, contentType: "image/webp", role: "protected-preview" },
  ];
});

const prepared = files.map((file) => ({ id: file.id, key: file.key, role: file.role, size: file.bytes.length, sha256: sha256(file.bytes) }));

if (!execute) {
  console.log(JSON.stringify({ mode: "dry-run", collection, files: prepared.length, prepared }, null, 2));
} else {
  const store = getStore({ name: STORE_NAME, siteID: SITE_ID, token: readNetlifyToken(), consistency: "strong" });
  const uploaded = [];
  for (const file of files) {
    const localSha256 = sha256(file.bytes);
    const metadata = { size: file.bytes.length, contentType: file.contentType, customMetadata: { collection, mediaid: file.id, role: file.role, sha256: localSha256, visibility: "private" } };
    await store.set(file.key, file.bytes, { metadata });
    await store.setJSON(`__metadata__/${file.key}.json`, metadata);
    const remote = await store.get(file.key, { type: "arrayBuffer", consistency: "strong" });
    if (!remote) throw new Error(`Oggetto remoto assente dopo il caricamento: ${file.key}`);
    const remoteBytes = Buffer.from(remote);
    const remoteSha256 = sha256(remoteBytes);
    if (remoteBytes.length !== file.bytes.length || remoteSha256 !== localSha256) throw new Error(`Verifica remota fallita per ${file.key}.`);
    uploaded.push({ key: file.key, role: file.role, size: remoteBytes.length, sha256: remoteSha256, verified: true });
  }
  const remoteOriginals = await store.list({ prefix: "vip-zone/downloads/cyber-nexus/" });
  const remotePreviews = await store.list({ prefix: "vip-zone/downloads/previews/cyber-nexus" });
  console.log(JSON.stringify({
    mode: "execute",
    store: STORE_NAME,
    collection,
    uploaded: uploaded.length,
    originalsPresent: remoteOriginals.blobs.length,
    previewsPresent: remotePreviews.blobs.length,
    verified: uploaded.length === 12 && remoteOriginals.blobs.length === 6 && remotePreviews.blobs.length === 6,
    files: uploaded,
  }, null, 2));
}
