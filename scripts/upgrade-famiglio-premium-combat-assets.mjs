import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { unzipSync } from "fflate";

const projectRoot = process.cwd();
const sourceRoot = process.env.FAMIGLIO_PREMIUM_ASSET_SOURCE
  || path.join(projectRoot, "tamagochi asset");
const combatRoot = path.join(projectRoot, "public", "famiglio", "rebuild", "combat");
const vfxRoot = path.join(combatRoot, "vfx", "premium");
const audioRoot = path.join(combatRoot, "audio");
const careAudioRoot = path.join(projectRoot, "public", "famiglio", "rebuild", "audio", "care");
const manifestPath = path.join(combatRoot, "asset-manifest.json");

const MAGIC_ARCHIVE = "Magic VFX Pack 1.zip";
const SKYFALL_ARCHIVE = "Pixel Art Skyfall Spells & Arcane Impacts VFX Pack.zip";
const AUDIO_ARCHIVE = "50_RPG_Battle_Magic_SFX.zip";
const KENNEY_ARCHIVE = "kenney_impact-sounds.zip";
const MAGIC_ROOT = "Magic VFX Pack 1";
const SKYFALL_ROOT = "Pixel Art Skyfall Spells & Arcane Impacts VFX Pack";

const magicVfxPlan = [
  ["premium-asunder", "Asunder.png", "magic-asunder.png", 64, 80, 19, 24, "antico"],
  ["premium-black-hole", "Black Hole.png", "magic-black-hole.png", 64, 48, 45, 30, "arcano"],
  ["premium-douse", "Douse.png", "magic-douse.png", 96, 64, 27, 28, "marea"],
  ["premium-fireball", "Fireball.png", "magic-fireball.png", 96, 64, 14, 26, "ardore"],
  ["premium-impact", "Impact.png", "magic-impact.png", 64, 48, 4, 24, "physical"],
  ["premium-terra-spike", "Terra Spike.png", "magic-terra-spike.png", 96, 32, 24, 28, "natura"],
  ["premium-thunderbolt", "Thunderbolt.png", "magic-thunderbolt.png", 64, 80, 24, 28, "fulmine"],
  ["premium-vine-boom", "Vine Boom.png", "magic-vine-boom.png", 96, 32, 34, 30, "natura"],
  ["premium-whirlwind", "Whirlwind.png", "magic-whirlwind.png", 64, 48, 19, 26, "vento"],
].map(([id, source, output, frameWidth, frameHeight, frameCount, fps, element]) => ({
  id, source: `${MAGIC_ROOT}/Spritesheets/${source}`, output, frameWidth, frameHeight, frameCount, fps, element,
  purpose: id === "premium-impact" ? "impact" : "element-impact",
}));

const skyfallVfxPlan = [
  ["ultimate-natura", "tone_03_AcidTech", "skyfall-natura.png", "natura"],
  ["ultimate-marea", "tone_02_Ice", "skyfall-marea.png", "marea"],
  ["ultimate-ardore", "tone_01_Fire", "skyfall-ardore.png", "ardore"],
  ["ultimate-vento", "tone_04_InkBlue6", "skyfall-vento.png", "vento"],
  ["ultimate-arcano", "tone_06_Alien", "skyfall-arcano.png", "arcano"],
  ["ultimate-antico", "tone_05_Goldrush5", "skyfall-antico.png", "antico"],
].map(([id, folder, output, element]) => ({
  id, source: `${SKYFALL_ROOT}/${folder}/sprite_06.png`, output, frameWidth: 96, frameHeight: 96,
  frameCount: 24, fps: 28, element, purpose: "ultimate-impact",
}));

const audioPlan = [
  ["cast", "42_Charge_02.wav", "cast.wav", "cast", 1500],
  ["motion", "26_Wind_02.wav", "motion.wav", "motion", 1200],
  ["impact", "30_Earth_02.wav", "impact.wav", "impact", 1100],
  ["block", "33_Light_02.wav", "block.wav", "guard", 1100],
  ["hit", "29_Earth_01.wav", "hit.wav", "reaction", 850],
  ["win", "39_Ultima_02.wav", "win.wav", "result", 2100],
  ["lose", "36_Dark_02.wav", "lose.wav", "result", 1800],
  ["affinity-fire", "07_Fireball_01.wav", "affinity-fire.wav", "affinity", 1100],
  ["affinity-water", "23_Water_03.wav", "affinity-water.wav", "affinity", 1300],
  ["affinity-wind", "26_Wind_02.wav", "affinity-wind.wav", "affinity", 1200],
  ["affinity-nature", "30_Earth_02.wav", "affinity-nature.wav", "affinity", 1300],
  ["affinity-arcane", "36_Dark_02.wav", "affinity-arcane.wav", "affinity", 1400],
  ["affinity-ancient", "33_Light_02.wav", "affinity-ancient.wav", "affinity", 1400],
  ["affinity-ice", "14_Ice_explosion_02.wav", "affinity-ice.wav", "element", 1300],
  ["affinity-lightning", "18_Thunder_02.wav", "affinity-lightning.wav", "element", 1300],
  ["affinity-poison", "47_Poison_02.wav", "affinity-poison.wav", "element", 1200],
  ["heal", "32_Light_01.wav", "heal.wav", "restore", 1600],
].map(([id, source, output, purpose, maxDurationMs]) => ({ id, source, output, purpose, maxDurationMs }));

const careAudioPlan = [
  ["food", "Audio/impactSoft_medium_001.ogg", "food-soft.ogg"],
  ["soap", "Audio/impactGlass_light_002.ogg", "soap-sparkle.ogg"],
  ["toy", "Audio/footstep_grass_003.ogg", "toy-step.ogg"],
  ["medicine", "Audio/impactBell_heavy_004.ogg", "medicine-chime.ogg"],
  ["rest", "Audio/impactSoft_heavy_002.ogg", "rest-soft.ogg"],
].map(([id, source, output]) => ({ id, source, output }));

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

function unzip(bytes) {
  return unzipSync(new Uint8Array(bytes));
}

function required(entries, name) {
  const value = entries[name];
  if (!value) throw new Error(`Voce ZIP mancante: ${name}`);
  return Buffer.from(value);
}

function assertMagicLicense(entries) {
  const readme = required(entries, `${MAGIC_ROOT}/README.txt`);
  const normalized = new TextDecoder("utf-8").decode(readme).toLowerCase();
  for (const phrase of ["commercial and non-commercial projects", "cannot", "redistribute", "attribution is not required"]) {
    if (!normalized.includes(phrase)) throw new Error(`Licenza Magic VFX inattesa: manca '${phrase}'.`);
  }
  return readme;
}

async function prepareVfx(plan, source, sourceArchive) {
  const metadata = await sharp(source).metadata();
  const stats = await sharp(source).ensureAlpha().stats();
  if (!metadata.width || !metadata.height || metadata.width !== plan.frameWidth * plan.frameCount || metadata.height !== plan.frameHeight) {
    throw new Error(`${plan.id}: strip inattesa ${metadata.width}x${metadata.height}.`);
  }
  if (!metadata.hasAlpha || stats.channels[3].min !== 0 || stats.channels[3].max <= 0) {
    throw new Error(`${plan.id}: trasparenza reale assente.`);
  }
  const output = await sharp(source).ensureAlpha().png({ compressionLevel: 9, adaptiveFiltering: false }).toBuffer();
  const outputPath = path.join(vfxRoot, plan.output);
  await writeFile(outputPath, output);
  return {
    id: plan.id, purpose: plan.purpose, element: plan.element,
    path: `/famiglio/rebuild/combat/vfx/premium/${plan.output}`,
    sourceArchive, sourceEntry: plan.source, format: "image/png",
    width: metadata.width, height: metadata.height, frameWidth: plan.frameWidth, frameHeight: plan.frameHeight,
    columns: plan.frameCount, rows: 1, frameCount: plan.frameCount, visibleFrames: plan.frameCount, fps: plan.fps,
    sourceLayout: { width: metadata.width, height: metadata.height, columns: plan.frameCount, rows: 1 },
    alphaMin: stats.channels[3].min, alphaMax: stats.channels[3].max,
    bytes: output.byteLength, sha256: sha256(output), sourceSha256: sha256(source), origin: "user-licensed-source",
  };
}

function inspectWave(wave) {
  if (wave.subarray(0, 4).toString("ascii") !== "RIFF" || wave.subarray(8, 12).toString("ascii") !== "WAVE") throw new Error("File audio non RIFF/WAVE.");
  let offset = 12;
  let format = null;
  let data = null;
  while (offset + 8 <= wave.length) {
    const id = wave.subarray(offset, offset + 4).toString("ascii");
    const size = wave.readUInt32LE(offset + 4);
    const payload = offset + 8;
    if (payload + size > wave.length) throw new Error(`Chunk WAV ${id} fuori limite.`);
    if (id === "fmt ") format = { audioFormat: wave.readUInt16LE(payload), channels: wave.readUInt16LE(payload + 2), sampleRate: wave.readUInt32LE(payload + 4), blockAlign: wave.readUInt16LE(payload + 12), bitDepth: wave.readUInt16LE(payload + 14) };
    if (id === "data") data = { offset: payload, size };
    offset = payload + size + (size % 2);
  }
  if (!format || !data || format.audioFormat !== 1) throw new Error("WAV PCM non supportato.");
  if (![16, 24, 32].includes(format.bitDepth) || ![1, 2].includes(format.channels)) throw new Error(`Formato WAV non supportato: ${format.channels} canali, ${format.bitDepth} bit.`);
  const frameCount = Math.floor(data.size / format.blockAlign);
  return { ...format, ...data, frameCount, durationMs: Math.round(frameCount / format.sampleRate * 1000) };
}

function readPcmSample(wave, offset, bitDepth) {
  if (bitDepth === 16) return wave.readInt16LE(offset) / 32768;
  if (bitDepth === 24) return wave.readIntLE(offset, 3) / 8388608;
  return wave.readInt32LE(offset) / 2147483648;
}

function encodeNormalizedWave(source, maxDurationMs) {
  const info = inspectWave(source);
  const outputRate = 44100;
  if (info.sampleRate !== outputRate) throw new Error(`Sample rate inatteso: ${info.sampleRate}.`);
  const bytesPerSample = info.bitDepth / 8;
  const frameCount = Math.min(info.frameCount, Math.round(info.sampleRate * maxDurationMs / 1000));
  const channels = 2;
  const samples = new Float32Array(frameCount * channels);
  let peak = 0;
  for (let frame = 0; frame < frameCount; frame += 1) for (let channel = 0; channel < channels; channel += 1) {
    const sourceChannel = Math.min(channel, info.channels - 1);
    const inputOffset = info.offset + frame * info.blockAlign + sourceChannel * bytesPerSample;
    const value = readPcmSample(source, inputOffset, info.bitDepth);
    samples[frame * channels + channel] = value;
    peak = Math.max(peak, Math.abs(value));
  }
  if (peak < .0001) throw new Error("SFX silenzioso.");
  const gain = Math.min(1.25, .9 / peak);
  const fadeInFrames = Math.max(1, Math.round(outputRate * .006));
  const fadeOutFrames = Math.max(1, Math.round(outputRate * .07));
  const output = Buffer.alloc(44 + samples.length * 2);
  output.write("RIFF", 0, "ascii"); output.writeUInt32LE(output.length - 8, 4); output.write("WAVE", 8, "ascii");
  output.write("fmt ", 12, "ascii"); output.writeUInt32LE(16, 16); output.writeUInt16LE(1, 20); output.writeUInt16LE(channels, 22);
  output.writeUInt32LE(outputRate, 24); output.writeUInt32LE(outputRate * channels * 2, 28); output.writeUInt16LE(channels * 2, 32); output.writeUInt16LE(16, 34);
  output.write("data", 36, "ascii"); output.writeUInt32LE(samples.length * 2, 40);
  let sumSquares = 0;
  let outputPeak = 0;
  for (let frame = 0; frame < frameCount; frame += 1) {
    const envelope = Math.max(0, Math.min(1, frame / fadeInFrames, (frameCount - 1 - frame) / fadeOutFrames));
    for (let channel = 0; channel < channels; channel += 1) {
      const index = frame * channels + channel;
      const value = Math.max(-1, Math.min(1, samples[index] * gain * envelope));
      output.writeInt16LE(Math.round(value * 32767), 44 + index * 2);
      sumSquares += value * value;
      outputPeak = Math.max(outputPeak, Math.abs(value));
    }
  }
  return { output, peak: outputPeak, rms: Math.sqrt(sumSquares / samples.length) };
}

async function main() {
  await mkdir(vfxRoot, { recursive: true });
  await mkdir(audioRoot, { recursive: true });
  await mkdir(careAudioRoot, { recursive: true });
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const magicArchive = await readFile(path.join(sourceRoot, MAGIC_ARCHIVE));
  const skyfallArchive = await readFile(path.join(sourceRoot, SKYFALL_ARCHIVE));
  const audioArchive = await readFile(path.join(sourceRoot, AUDIO_ARCHIVE));
  const kenneyArchive = await readFile(path.join(sourceRoot, KENNEY_ARCHIVE));
  const magicEntries = unzip(magicArchive);
  const skyfallEntries = unzip(skyfallArchive);
  const audioEntries = unzip(audioArchive);
  const kenneyEntries = unzip(kenneyArchive);
  const magicReadme = assertMagicLicense(magicEntries);
  const kenneyLicense = required(kenneyEntries, "License.txt");
  if (!new TextDecoder("utf-8").decode(kenneyLicense).includes("Creative Commons Zero")) throw new Error("Licenza CC0 Kenney non trovata.");

  const premiumVfx = [];
  for (const plan of magicVfxPlan) premiumVfx.push(await prepareVfx(plan, required(magicEntries, plan.source), MAGIC_ARCHIVE));
  for (const plan of skyfallVfxPlan) premiumVfx.push(await prepareVfx(plan, required(skyfallEntries, plan.source), SKYFALL_ARCHIVE));

  const premiumAudio = [];
  for (const plan of audioPlan) {
    const source = required(audioEntries, plan.source);
    const normalized = encodeNormalizedWave(source, plan.maxDurationMs);
    const info = inspectWave(normalized.output);
    await writeFile(path.join(audioRoot, plan.output), normalized.output);
    premiumAudio.push({
      id: plan.id, purpose: plan.purpose, path: `/famiglio/rebuild/combat/audio/${plan.output}`,
      sourceArchive: AUDIO_ARCHIVE, sourceEntry: plan.source, format: "audio/wav", channels: info.channels,
      sampleRate: info.sampleRate, bitDepth: info.bitDepth, durationMs: info.durationMs,
      peakAmplitude: Number(normalized.peak.toFixed(4)), rmsAmplitude: Number(normalized.rms.toFixed(4)),
      bytes: normalized.output.byteLength, sha256: sha256(normalized.output), sourceSha256: sha256(source), origin: "user-licensed-source",
    });
  }
  const careAudio = [];
  for (const plan of careAudioPlan) {
    const source = required(kenneyEntries, plan.source);
    await writeFile(path.join(careAudioRoot, plan.output), source);
    careAudio.push({
      id: plan.id, purpose: "care-feedback", path: `/famiglio/rebuild/audio/care/${plan.output}`,
      sourceArchive: KENNEY_ARCHIVE, sourceEntry: plan.source, format: "audio/ogg", bytes: source.byteLength,
      sha256: sha256(source), sourceSha256: sha256(source), origin: "cc0-source",
    });
  }

  const premiumIds = new Set(premiumVfx.map((asset) => asset.id));
  const audioIds = new Set(premiumAudio.map((asset) => asset.id));
  manifest.schemaVersion = 3;
  manifest.reviewedOn = "2026-09-06";
  manifest.policy.authorizationBasis = "Conferma esplicita dell'utente: asset acquistati e collocati in tamagochi asset il 2026-09-06; licenza interna verificata dove inclusa.";
  manifest.vfx = [...manifest.vfx.filter((asset) => !premiumIds.has(asset.id)), ...premiumVfx];
  manifest.audio = [...manifest.audio.filter((asset) => !audioIds.has(asset.id)), ...premiumAudio];
  manifest.approvedSources = [
    ...manifest.approvedSources.filter((source) => ![MAGIC_ARCHIVE, SKYFALL_ARCHIVE, AUDIO_ARCHIVE, KENNEY_ARCHIVE].includes(source.archive)),
    { archive: MAGIC_ARCHIVE, creator: "Thundersnow Pixel", licenseStatus: "archive-license-verified", licenseEvidenceEntry: `${MAGIC_ROOT}/README.txt`, licenseEvidenceSha256: sha256(magicReadme), archiveSha256: sha256(magicArchive), distributableInsideProject: true },
    { archive: SKYFALL_ARCHIVE, creator: "H7 Pixel Forge", licenseStatus: "official-store-license-verified", licenseUrl: "https://h7pixelforge.itch.io/pixel-art-skyfall-spells-arcane-impacts-vfx-pack", archiveSha256: sha256(skyfallArchive), distributableInsideProject: true },
    { archive: AUDIO_ARCHIVE, creator: "Leohpaz", licenseStatus: "user-purchased-for-project", archiveSha256: sha256(audioArchive), distributableInsideProject: true },
    { archive: KENNEY_ARCHIVE, creator: "Kenney", licenseStatus: "archive-license-verified-cc0", licenseEvidenceEntry: "License.txt", licenseEvidenceSha256: sha256(kenneyLicense), archiveSha256: sha256(kenneyArchive), distributableInsideProject: true },
  ];
  manifest.sourceInventory = [
    ...manifest.sourceInventory.filter((source) => ![MAGIC_ARCHIVE, SKYFALL_ARCHIVE, AUDIO_ARCHIVE, KENNEY_ARCHIVE].includes(source.archive)),
    { archive: MAGIC_ARCHIVE, kind: "vfx", selected: true, contents: "9 effetti magici pixel-art per impatti elementali e fisici.", licenseStatus: "archive-license-verified" },
    { archive: SKYFALL_ARCHIVE, kind: "vfx", selected: true, contents: "6 effetti Skyfall da 24 frame riservati alle mosse supreme.", licenseStatus: "user-purchased-for-project" },
    { archive: AUDIO_ARCHIVE, kind: "audio", selected: true, contents: "17 cue WAV selezionati, normalizzati e sincronizzati per combattimento.", licenseStatus: "user-purchased-for-project" },
    { archive: KENNEY_ARCHIVE, kind: "audio", selected: true, contents: "5 cue OGG CC0 per il feedback delle azioni di cura.", licenseStatus: "archive-license-verified-cc0" },
  ];
  manifest.elements.natura.impactVfx = "premium-vine-boom";
  manifest.elements.marea.impactVfx = "premium-douse";
  manifest.elements.ardore.impactVfx = "premium-fireball";
  manifest.elements.vento.impactVfx = "premium-whirlwind";
  manifest.elements.arcano.impactVfx = "premium-black-hole";
  manifest.elements.antico.impactVfx = "premium-asunder";
  manifest.elements.ghiaccio.impactVfx = "ultimate-marea";
  manifest.elements.fulmine.impactVfx = "premium-thunderbolt";
  manifest.elements.veleno.impactVfx = "ultimate-natura";
  for (const affinity of ["natura", "marea", "ardore", "vento", "arcano", "antico"]) {
    manifest.affinities[affinity].impactVfx = manifest.elements[affinity].impactVfx;
  }
  manifest.moveClasses.physical.impactVfx = "premium-impact";
  manifest.ultimateEffects = Object.fromEntries(skyfallVfxPlan.map((plan) => [plan.element, plan.id]));
  manifest.careAudio = careAudio;
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  process.stdout.write(`Integrati ${premiumVfx.length} VFX premium, ${premiumAudio.length} SFX da battaglia e ${careAudio.length} cue di cura.\n`);
}

await main();
