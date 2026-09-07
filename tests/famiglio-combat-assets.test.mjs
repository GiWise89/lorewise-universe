import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import sharp from "sharp";

const root = process.cwd();
const manifestPath = path.join(root, "public", "famiglio", "rebuild", "combat", "asset-manifest.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

function diskPath(publicPath) {
  assert.match(publicPath, /^\/famiglio\/rebuild\//);
  return path.join(root, "public", ...publicPath.split("/").filter(Boolean));
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

test("il manifest registra l'autorizzazione e l'inventario delle fonti", () => {
  assert.equal(manifest.schemaVersion, 3);
  assert.equal(manifest.policy.unknownLicenseAssetsShipped, false);
  assert.equal(manifest.policy.userAuthorizedAssetIntegration, true);
  assert.equal(manifest.policy.standaloneRedistributionAllowed, false);
  assert.match(manifest.policy.authorizationBasis, /conferma esplicita/i);
  for (const archive of [
    "Magic VFX Pack 1.zip",
    "Pixel Art Skyfall Spells & Arcane Impacts VFX Pack.zip",
    "50_RPG_Battle_Magic_SFX.zip",
    "kenney_impact-sounds.zip",
  ]) assert.ok(manifest.approvedSources.some((source) => source.archive === archive), archive);
  assert.ok(manifest.approvedSources.every((source) => source.distributableInsideProject === true));
  assert.ok(manifest.sourceInventory.length >= 9);
  assert.ok(manifest.sourceInventory.filter((source) => source.selected).length >= 7);
  assert.ok(manifest.sourceInventory.filter((source) => !source.selected).every((source) => source.reason));
});

test("i VFX sono spritesheet PNG con trasparenza reale, frame verificati e hash stabile", async () => {
  assert.equal(manifest.vfx.length, 62);
  let totalBytes = 0;
  for (const asset of manifest.vfx) {
    const filePath = diskPath(asset.path);
    const file = await readFile(filePath);
    const metadata = await sharp(file).metadata();
    const imageStats = await sharp(file).ensureAlpha().stats();
    const fileStats = await stat(filePath);
    const alpha = imageStats.channels[3];
    assert.equal(metadata.format, "png", asset.id);
    assert.equal(metadata.hasAlpha, true, asset.id);
    assert.equal(alpha.min, 0, `${asset.id}: deve contenere pixel trasparenti`);
    assert.ok(alpha.max > 0, `${asset.id}: deve contenere pixel visibili`);
    assert.equal(asset.alphaMin, alpha.min, asset.id);
    assert.equal(asset.alphaMax, alpha.max, asset.id);
    assert.equal(metadata.width, asset.width, asset.id);
    assert.equal(metadata.height, asset.height, asset.id);
    assert.equal(asset.width / asset.frameWidth, asset.columns, asset.id);
    assert.equal(asset.height / asset.frameHeight, asset.rows, asset.id);
    assert.equal(asset.columns, asset.frameCount, `${asset.id}: strip orizzontale`);
    assert.equal(asset.rows, 1, `${asset.id}: strip orizzontale`);
    assert.ok(asset.sourceLayout.columns * asset.sourceLayout.rows >= asset.frameCount, `${asset.id}: layout sorgente`);
    assert.ok(asset.frameCount > 0 && asset.frameCount <= asset.columns * asset.rows, asset.id);
    assert.ok(asset.visibleFrames >= Math.ceil(asset.frameCount * 0.7), `${asset.id}: frame visibili`);
    assert.ok(asset.fps >= 20 && asset.fps <= 32, `${asset.id}: fps`);
    assert.equal(fileStats.size, asset.bytes, asset.id);
    assert.equal(sha256(file), asset.sha256, asset.id);
    assert.match(asset.sourceArchive, /\.zip$/i, asset.id);
    assert.equal(asset.sourceSha256.length, 64, asset.id);
    assert.ok(fileStats.size < 500_000, `${asset.id} supera il budget PNG`);
    totalBytes += fileStats.size;
  }
  assert.ok(totalBytes < 5_500_000, `budget VFX totale: ${totalBytes}`);
});

test("i 17 SFX premium sono WAV stereo normalizzati, brevi e non silenziosi", async () => {
  assert.equal(manifest.audio.length, 17);
  let totalBytes = 0;
  for (const asset of manifest.audio) {
    const filePath = diskPath(asset.path);
    const file = await readFile(filePath);
    assert.equal(file.subarray(0, 4).toString("ascii"), "RIFF", asset.id);
    assert.equal(file.subarray(8, 12).toString("ascii"), "WAVE", asset.id);
    assert.equal(file.readUInt16LE(20), 1, `${asset.id}: PCM`);
    assert.equal(file.readUInt16LE(22), 2, `${asset.id}: canali`);
    assert.equal(file.readUInt32LE(24), 44100, `${asset.id}: sample rate`);
    assert.equal(file.readUInt16LE(34), 16, `${asset.id}: bit depth`);
    const frames = file.readUInt32LE(40) / (file.readUInt16LE(22) * 2);
    const durationMs = Math.round(frames / file.readUInt32LE(24) * 1000);
    assert.equal(durationMs, asset.durationMs, asset.id);
    assert.ok(durationMs >= 450 && durationMs <= 2400, `${asset.id}: durata ${durationMs}`);
    assert.ok(asset.peakAmplitude > 0.05 && asset.peakAmplitude <= 0.93, `${asset.id}: picco`);
    assert.ok(asset.rmsAmplitude > 0.02, `${asset.id}: RMS`);
    assert.equal(file.length, asset.bytes, asset.id);
    assert.equal(sha256(file), asset.sha256, asset.id);
    assert.equal(asset.origin, "user-licensed-source", asset.id);
    assert.match(asset.sourceEntry, /^\d{2}_.+\.wav$/);
    assert.ok(file.length < 500_000, `${asset.id} supera il budget audio`);
    totalBytes += file.length;
  }
  assert.ok(totalBytes < 5_000_000, `budget audio totale: ${totalBytes}`);
});

test("affinita, varianti elementali, stati e classi mossa referenziano asset reali", () => {
  const vfxIds = new Set(manifest.vfx.map((asset) => asset.id));
  const audioIds = new Set(manifest.audio.map((asset) => asset.id));
  assert.deepEqual(Object.keys(manifest.affinities).sort(), ["antico", "arcano", "ardore", "marea", "natura", "vento"]);
  assert.deepEqual(Object.keys(manifest.elements).sort(), ["antico", "arcano", "ardore", "fulmine", "ghiaccio", "marea", "natura", "veleno", "vento"]);
  assert.deepEqual(Object.keys(manifest.statuses).sort(), ["burn", "focus", "freeze", "guard", "paralysis", "poison", "regen", "sleep", "slow", "weaken"]);
  const affinityTriples = new Set();
  for (const mapping of Object.values(manifest.affinities)) {
    assert.ok(vfxIds.has(mapping.castVfx));
    assert.ok(vfxIds.has(mapping.projectileVfx));
    assert.ok(vfxIds.has(mapping.impactVfx));
    assert.ok(audioIds.has(mapping.audio));
    affinityTriples.add(`${mapping.castVfx}|${mapping.projectileVfx}|${mapping.impactVfx}`);
  }
  assert.equal(affinityTriples.size, 6, "ogni affinita deve avere un set visivo distinto");
  for (const mapping of Object.values(manifest.elements)) {
    assert.ok(vfxIds.has(mapping.castVfx));
    assert.ok(vfxIds.has(mapping.projectileVfx));
    assert.ok(vfxIds.has(mapping.impactVfx));
    assert.ok(audioIds.has(mapping.audio));
  }
  for (const mapping of Object.values(manifest.statuses)) {
    assert.ok(vfxIds.has(mapping.vfx));
    assert.ok(audioIds.has(mapping.audio));
  }
  assert.deepEqual(Object.keys(manifest.moveClasses).sort(), ["magic", "physical", "restore", "status"]);
  assert.deepEqual(Object.keys(manifest.ultimateEffects).sort(), ["antico", "arcano", "ardore", "marea", "natura", "vento"]);
  assert.ok(Object.values(manifest.ultimateEffects).every((id) => vfxIds.has(id)));
  assert.deepEqual(manifest.careAudio.map((asset) => asset.id).sort(), ["food", "medicine", "rest", "soap", "toy"]);
});

test("i cue Kenney per la cura sono OGG CC0 integri e collegati alle cinque azioni", async () => {
  for (const asset of manifest.careAudio) {
    const filePath = diskPath(asset.path);
    const file = await readFile(filePath);
    assert.equal(file.subarray(0, 4).toString("ascii"), "OggS", asset.id);
    assert.equal(file.length, asset.bytes, asset.id);
    assert.equal(sha256(file), asset.sha256, asset.id);
    assert.equal(asset.origin, "cc0-source", asset.id);
  }
  const source = await readFile(path.join(root, "lib", "nexusFamiliarAudio.ts"), "utf8");
  for (const asset of manifest.careAudio) assert.ok(source.includes(asset.path), asset.id);
  assert.match(source, /feed:\s*"food"/);
  assert.match(source, /play:\s*"toy"/);
  assert.match(source, /clean:\s*"soap"/);
  assert.match(source, /care:\s*"medicine"/);
  assert.match(source, /rest:\s*"rest"/);
  assert.match(source, /export function playFamiliarHomeActionCue/);

  const rebuild = await readFile(path.join(root, "components", "FamiglioNexusRebuild.tsx"), "utf8");
  assert.match(rebuild, /import \{[^}]*playFamiliarHomeActionCue[^}]*\} from "@\/lib\/nexusFamiliarAudio"/);
  assert.match(rebuild, /if \(performActiveHomeAction\(item\.id\)\) \{[\s\S]*?playFamiliarHomeActionCue\(activeFamiliarId, item\.id/);
  assert.match(rebuild, /if \(applyActiveInventoryItem\(item\.id\)\) \{[\s\S]*?playFamiliarHomeActionCue\(activeFamiliarId, item\.action/);
  assert.match(rebuild, /aria-label="Volume della Casa"/);
  assert.doesNotMatch(rebuild, /home-soft-loop\.(?:wav|ogg|mp3)/);

  const arena = await readFile(path.join(root, "components", "FamiglioCombatArena.tsx"), "utf8");
  assert.doesNotMatch(arena, /battle-loop\.(?:wav|ogg|mp3)/);
});

test("i percorsi core restano compatibili con l'arena esistente", () => {
  const expected = {
    cast: ["cast-frontal.png", "cast.wav"],
    motion: ["motion-arrow.png", "motion.wav"],
    impact: ["impact-light.png", "impact.wav"],
    hit: ["hit-heavy.png", "hit.wav"],
    win: ["win-wave.png", "win.wav"],
    lose: ["lose-fade.png", "lose.wav"],
  };
  const vfxById = Object.fromEntries(manifest.vfx.map((asset) => [asset.id, asset]));
  const audioById = Object.fromEntries(manifest.audio.map((asset) => [asset.id, asset]));
  for (const [id, [image, audio]] of Object.entries(expected)) {
    assert.ok(vfxById[id].path.endsWith(`/${image}`), id);
    assert.ok(audioById[id].path.endsWith(`/${audio}`), id);
  }
});
