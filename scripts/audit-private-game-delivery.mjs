import fs from "node:fs";
import assert from "node:assert/strict";
import installer from "../data/games/windows-installer.json" with { type: "json" };

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const uploader = read("scripts/upload-private-r2.mjs");
const route = read("app/api/game-deliveries/admin/route.ts");
const admin = read("components/GameDeliveryAdmin.tsx");
const packageJson = JSON.parse(read("package.json"));

assert.equal(installer.productCode, "GS-GAME-001-WIN");
assert.equal(installer.size, 379498399);
assert.match(installer.sha256, /^[A-F0-9]{64}$/);
assert.match(installer.objectKey, /^game-deliveries\/gs-game-001\/windows-x64\/.+\.exe$/);
assert.equal(packageJson.scripts["r2:upload-game"], "node scripts/upload-private-r2.mjs");
assert.ok(packageJson.dependencies["@aws-sdk/client-s3"]);
assert.ok(packageJson.dependencies["@aws-sdk/lib-storage"]);
assert.match(uploader, /const execute = args\.includes\("--execute"\)/);
assert.match(uploader, /partSize: 16 \* 1024 \* 1024/);
assert.match(uploader, /leavePartsOnError: false/);
assert.match(uploader, /HeadObjectCommand/);
assert.match(uploader, /remoteVerified: true/);
assert.match(route, /body\.action !== "register_existing"/);
assert.match(route, /COMMISSION_UPLOADS!\.head\(verifiedWindowsInstaller\.objectKey\)/);
assert.doesNotMatch(route.slice(route.indexOf("export async function PATCH")), /\.arrayBuffer\(\)/);
assert.match(admin, /Registra la ricevuta del trasferimento privato/);
assert.match(admin, /nessun byte dell’EXE passa dal browser/);

console.log(`Consegna privata verificata: ${installer.filename}`);
console.log(`Dimensione: ${installer.size} byte | SHA-256: ${installer.sha256}`);
console.log("Multipart, ricevuta, quarantena e approvazione senza lettura integrale remota: OK");
