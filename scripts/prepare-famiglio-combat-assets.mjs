import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import sharp from "sharp";
import { unzipSync } from "fflate";

const projectRoot = process.cwd();
const sourceRoot = process.env.FAMIGLIO_ASSET_SOURCE
  || "C:\\Users\\Luigi\\Documents\\asset game";
const outputRoot = path.join(projectRoot, "public", "famiglio", "rebuild", "combat");
const vfxRoot = path.join(outputRoot, "vfx");
const audioRoot = path.join(outputRoot, "audio");
const manifestPath = path.join(outputRoot, "asset-manifest.json");

const MAGUS_ARCHIVE = "2D VFX Pack - Slashes and Impacts - RPGMakerMV -MagusVFX.zip";
const MAGUS_NESTED_ARCHIVE = "SpriteSheets Styling 192x192.zip";
const ELEMENTAL_ARCHIVE = "VividMotion_ElementalArcana_Vol1.zip";
const STATUS_ARCHIVE = "Vivid_Motion_23_ Universal_Status_Effects.zip";
const AUDIO_ARCHIVE = "DarkFantasy_Sound.zip";

const coreVfxPlan = [
  { id: "cast", source: "019-Frontal100.png", output: "cast-frontal.png", purpose: "cast", frameWidth: 192, frameHeight: 192, frameCount: 15, fps: 24 },
  { id: "motion", source: "031-Arrow100.png", output: "motion-arrow.png", purpose: "motion", frameWidth: 192, frameHeight: 192, frameCount: 20, fps: 28 },
  { id: "projectile", source: "028-Bolt100.png", output: "projectile-bolt.png", purpose: "projectile", frameWidth: 192, frameHeight: 192, frameCount: 20, fps: 28 },
  { id: "impact", source: "025-Impact100.png", output: "impact-light.png", purpose: "impact", frameWidth: 192, frameHeight: 192, frameCount: 15, fps: 30 },
  { id: "block", source: "010-UpCircular100.png", output: "block-circle.png", purpose: "guard", frameWidth: 192, frameHeight: 192, frameCount: 20, fps: 24 },
  { id: "hit", source: "026-Impact200.png", output: "hit-heavy.png", purpose: "reaction", frameWidth: 192, frameHeight: 192, frameCount: 15, fps: 30 },
  { id: "win", source: "022-Wave100.png", output: "win-wave.png", purpose: "result", frameWidth: 192, frameHeight: 192, frameCount: 15, fps: 22 },
  { id: "lose", source: "001-DownCircular100_Orange.png", output: "lose-fade.png", purpose: "result", frameWidth: 192, frameHeight: 192, frameCount: 15, fps: 20 },
];

const ELEMENT_ROOT = "VividMotion_ElementalArcana_Vol1";
const elementalVfxPlan = [
  { id: "veleno-cast", source: `${ELEMENT_ROOT}/Acid/Asset_PoisonCastVFX.png`, output: "element-veleno-cast.png", purpose: "cast", element: "veleno", frameWidth: 128, frameHeight: 128, frameCount: 32, fps: 24 },
  { id: "veleno-projectile", source: `${ELEMENT_ROOT}/Acid/Asset_ToxicSludgeProjectile.png`, output: "element-veleno-projectile.png", purpose: "projectile", element: "veleno", frameWidth: 64, frameHeight: 64, frameCount: 48, fps: 30 },
  { id: "veleno-impact", source: `${ELEMENT_ROOT}/Acid/Asset_PoisonImpactHit.png`, output: "element-veleno-impact.png", purpose: "impact", element: "veleno", frameWidth: 64, frameHeight: 64, frameCount: 32, fps: 30 },
  { id: "vento-cast", source: `${ELEMENT_ROOT}/Air/Asset_WindCast.png`, output: "element-vento-cast.png", purpose: "cast", element: "vento", frameWidth: 128, frameHeight: 128, frameCount: 32, fps: 24 },
  { id: "vento-projectile", source: `${ELEMENT_ROOT}/Air/Asset_WindBladeProjectile.png`, output: "element-vento-projectile.png", purpose: "projectile", element: "vento", frameWidth: 64, frameHeight: 64, frameCount: 48, fps: 30 },
  { id: "vento-impact", source: `${ELEMENT_ROOT}/Air/Asset_WindImpact.png`, output: "element-vento-impact.png", purpose: "impact", element: "vento", frameWidth: 64, frameHeight: 64, frameCount: 32, fps: 30 },
  { id: "arcano-cast", source: `${ELEMENT_ROOT}/Arcane/Asset_ArcaneCastVFX.png`, output: "element-arcano-cast.png", purpose: "cast", element: "arcano", frameWidth: 128, frameHeight: 128, frameCount: 32, fps: 24 },
  { id: "arcano-projectile", source: `${ELEMENT_ROOT}/Arcane/Asset_ArcaneBoltProjectile.png`, output: "element-arcano-projectile.png", purpose: "projectile", element: "arcano", frameWidth: 64, frameHeight: 64, frameCount: 48, fps: 30 },
  { id: "arcano-impact", source: `${ELEMENT_ROOT}/Arcane/Asset_ArcaneImpactHit.png`, output: "element-arcano-impact.png", purpose: "impact", element: "arcano", frameWidth: 64, frameHeight: 64, frameCount: 32, fps: 30 },
  { id: "natura-cast", source: `${ELEMENT_ROOT}/Earth/Asset_NatureCastVFX.png`, output: "element-natura-cast.png", purpose: "cast", element: "natura", frameWidth: 128, frameHeight: 128, frameCount: 32, fps: 24 },
  { id: "natura-projectile", source: `${ELEMENT_ROOT}/Earth/Asset_GaiaSeedProjectile.png`, output: "element-natura-projectile.png", purpose: "projectile", element: "natura", frameWidth: 64, frameHeight: 64, frameCount: 48, fps: 30 },
  { id: "natura-impact", source: `${ELEMENT_ROOT}/Earth/Asset_NatureImpactHit.png`, output: "element-natura-impact.png", purpose: "impact", element: "natura", frameWidth: 64, frameHeight: 64, frameCount: 32, fps: 30 },
  { id: "ardore-cast", source: `${ELEMENT_ROOT}/Fire/Asset_VividFireCastSpell.png`, output: "element-ardore-cast.png", purpose: "cast", element: "ardore", frameWidth: 120, frameHeight: 120, frameCount: 24, fps: 24 },
  { id: "ardore-projectile", source: `${ELEMENT_ROOT}/Fire/Asset_FireBoltProjectile.png`, output: "element-ardore-projectile.png", purpose: "projectile", element: "ardore", frameWidth: 64, frameHeight: 64, frameCount: 48, fps: 30 },
  { id: "ardore-impact", source: `${ELEMENT_ROOT}/Fire/Asset_FireImpactHit.png`, output: "element-ardore-impact.png", purpose: "impact", element: "ardore", frameWidth: 64, frameHeight: 64, frameCount: 32, fps: 30 },
  { id: "antico-cast", source: `${ELEMENT_ROOT}/Holy/Asset_HolyCastVFX.png`, output: "element-antico-cast.png", purpose: "cast", element: "antico", frameWidth: 128, frameHeight: 128, frameCount: 32, fps: 24 },
  { id: "antico-projectile", source: `${ELEMENT_ROOT}/Holy/Asset_HolyLightProjectile.png`, output: "element-antico-projectile.png", purpose: "projectile", element: "antico", frameWidth: 64, frameHeight: 64, frameCount: 48, fps: 30 },
  { id: "antico-impact", source: `${ELEMENT_ROOT}/Holy/Asset_HolyImpactHit.png`, output: "element-antico-impact.png", purpose: "impact", element: "antico", frameWidth: 64, frameHeight: 64, frameCount: 32, fps: 30 },
  { id: "ghiaccio-cast", source: `${ELEMENT_ROOT}/Ice/Asset_IceCastVFX.png`, output: "element-ghiaccio-cast.png", purpose: "cast", element: "ghiaccio", frameWidth: 64, frameHeight: 64, frameCount: 32, fps: 24 },
  { id: "ghiaccio-projectile", source: `${ELEMENT_ROOT}/Ice/Asset_IceShardProjectile.png`, output: "element-ghiaccio-projectile.png", purpose: "projectile", element: "ghiaccio", frameWidth: 120, frameHeight: 120, frameCount: 48, fps: 30 },
  { id: "ghiaccio-impact", source: `${ELEMENT_ROOT}/Ice/Asset_IceImpactHit.png`, output: "element-ghiaccio-impact.png", purpose: "impact", element: "ghiaccio", frameWidth: 64, frameHeight: 64, frameCount: 16, fps: 28 },
  { id: "fulmine-cast", source: `${ELEMENT_ROOT}/Lighting/Asset_LightningCastVFX.png`, output: "element-fulmine-cast.png", purpose: "cast", element: "fulmine", frameWidth: 128, frameHeight: 128, frameCount: 32, fps: 28 },
  { id: "fulmine-projectile", source: `${ELEMENT_ROOT}/Lighting/Asset_LightningBoltProjectile.png`, output: "element-fulmine-projectile.png", purpose: "projectile", element: "fulmine", frameWidth: 64, frameHeight: 64, frameCount: 48, fps: 32 },
  { id: "fulmine-impact", source: `${ELEMENT_ROOT}/Lighting/Asset_LightningImpactHit.png`, output: "element-fulmine-impact.png", purpose: "impact", element: "fulmine", frameWidth: 64, frameHeight: 64, frameCount: 32, fps: 32 },
  { id: "marea-cast", source: `${ELEMENT_ROOT}/Water/Asset_WaterCastVFX.png`, output: "element-marea-cast.png", purpose: "cast", element: "marea", frameWidth: 128, frameHeight: 128, frameCount: 32, fps: 24 },
  { id: "marea-projectile", source: `${ELEMENT_ROOT}/Water/Asset_WaterOrbProjectile.png`, output: "element-marea-projectile.png", purpose: "projectile", element: "marea", frameWidth: 64, frameHeight: 64, frameCount: 48, fps: 30 },
  { id: "marea-impact", source: `${ELEMENT_ROOT}/Water/Asset_WaterImpactHit.png`, output: "element-marea-impact.png", purpose: "impact", element: "marea", frameWidth: 64, frameHeight: 64, frameCount: 32, fps: 30 },
];

const STATUS_ROOT = "Vivid_Motion_23_ Universal_Status_Effects";
const statusVfxPlan = [
  ["status-armatura", "ArmorEffect", "ArmorEffect_Sheet_64x64.png", "guard"],
  ["status-focus", "BlessedEffect", "BlessedEffect_Sheet_64x64.png", "focus"],
  ["status-burn", "BurnEffect", "BurnEffect_Sheet_64x64.png", "burn"],
  ["status-freeze", "FreezeEffect", "FreezeEffect_Sheet_64x64.png", "freeze"],
  ["status-poison", "PoisonBubble", "PoisonBubble_Sheet_64x64.png", "poison"],
  ["status-sleep", "SleepEffect", "SleepEffect_Sheet_64x64.png", "sleep"],
  ["status-heal", "HealEffect", "HealEffect_Sheet_64x64.png", "heal"],
  ["status-regen", "RegenEffect", "RegenEffect_Sheet_64x64.png", "regen"],
  ["status-guard", "ShieldEffect", "ShieldEffect_Sheet_64x64.png", "guard"],
  ["status-shock", "ShockEffect", "ShockEffect_Sheet_64x64.png", "shock"],
  ["status-slow", "SlowEffect", "SlowEffect_Sheet_64x64.png", "slow"],
  ["status-weaken", "WeakenEffect", "WeakenEffect_Sheet_64x64.png", "weaken"],
].map(([id, folder, file, status]) => ({ id, source: `${STATUS_ROOT}/${folder}/Spritesheets/${file}`, output: `${id}.png`, purpose: "status", status, frameWidth: 64, frameHeight: 64, frameCount: 16, fps: 20 }));

const audioPlan = [
  { id: "cast", source: "Skill_Spell03.wav", output: "cast.wav", purpose: "cast", maxDurationMs: 1600 },
  { id: "motion", source: "Skill_Wind02.wav", output: "motion.wav", purpose: "motion", maxDurationMs: 1500 },
  { id: "impact", source: "Skill_Hit01.wav", output: "impact.wav", purpose: "impact", maxDurationMs: 1200 },
  { id: "block", source: "Skill_Earth03.wav", output: "block.wav", purpose: "guard", maxDurationMs: 1200 },
  { id: "hit", source: "Weapon_Hit03.wav", output: "hit.wav", purpose: "reaction", maxDurationMs: 900 },
  { id: "win", source: "UI_LevelUp02.wav", output: "win.wav", purpose: "result", maxDurationMs: 2200 },
  { id: "lose", source: "Skill_Dark03.wav", output: "lose.wav", purpose: "result", maxDurationMs: 2400 },
  { id: "affinity-fire", source: "Skill_Fire03.wav", output: "affinity-fire.wav", purpose: "affinity", maxDurationMs: 1400 },
  { id: "affinity-water", source: "Skill_Ice01.wav", output: "affinity-water.wav", purpose: "affinity", maxDurationMs: 1100 },
  { id: "affinity-wind", source: "Skill_Wind02.wav", output: "affinity-wind.wav", purpose: "affinity", maxDurationMs: 1500 },
  { id: "affinity-nature", source: "Skill_Nature01.wav", output: "affinity-nature.wav", purpose: "affinity", maxDurationMs: 1800 },
  { id: "affinity-arcane", source: "Skill_Spell03.wav", output: "affinity-arcane.wav", purpose: "affinity", maxDurationMs: 1600 },
  { id: "affinity-ancient", source: "Skill_Spell05.wav", output: "affinity-ancient.wav", purpose: "affinity", maxDurationMs: 1500 },
  { id: "affinity-ice", source: "Skill_Ice03.wav", output: "affinity-ice.wav", purpose: "element", maxDurationMs: 1500 },
  { id: "affinity-lightning", source: "Skill_Electric03.wav", output: "affinity-lightning.wav", purpose: "element", maxDurationMs: 1400 },
  { id: "affinity-poison", source: "Skill_Poison03.wav", output: "affinity-poison.wav", purpose: "element", maxDurationMs: 1400 },
  { id: "heal", source: "Skill_Nature02.wav", output: "heal.wav", purpose: "restore", maxDurationMs: 2200 },
];

const sourceInventory = [
  { archive: MAGUS_ARCHIVE, kind: "vfx", selected: true, contents: "Impatti, scie, difese e risultati generici.", licenseStatus: "archive-license-verified" },
  { archive: ELEMENTAL_ARCHIVE, kind: "vfx", selected: true, contents: "27 spritesheet: cast, proiettile e impatto per vento, arcano, natura, fuoco, sacro, ghiaccio, fulmine, acqua e veleno.", licenseStatus: "user-confirmed-licensed-for-project" },
  { archive: STATUS_ARCHIVE, kind: "vfx", selected: true, contents: "12 spritesheet di cura, rigenerazione, difesa e stati alterati.", licenseStatus: "user-confirmed-licensed-for-project" },
  { archive: AUDIO_ARCHIVE, kind: "audio", selected: true, contents: "17 cue WAV scelti per cast, movimento, impatto, difesa, cura, elementi e risultati.", licenseStatus: "user-confirmed-licensed-for-project" },
  { archive: "Water VFX Spritesheets.zip", kind: "vfx", selected: false, contents: "Ampia libreria di fluidi.", licenseStatus: "user-confirmed-licensed-for-project", reason: "Non inclusa: il set acqua selezionato copre gia cast, viaggio e impatto con peso molto inferiore." },
  { archive: "VFX Free Pack.zip", kind: "vfx", selected: false, contents: "Effetti ad alta densita di frame.", licenseStatus: "user-confirmed-licensed-for-project", reason: "Non incluso: stile e peso non coerenti con la scala pixel dell'arena Famigli." },
  { archive: "Effect and Bullet 16x16.zip", kind: "vfx", selected: false, contents: "Proiettili 16x16.", licenseStatus: "user-confirmed-licensed-for-project", reason: "Non incluso: risoluzione insufficiente per desktop e schermi ad alta densita." },
  { archive: "Holy VFX 01-02.rar", kind: "vfx", selected: false, contents: "Effetti sacri.", licenseStatus: "user-confirmed-licensed-for-project", reason: "Non incluso: ridondante rispetto al set antico/sacro gia selezionato." },
  { archive: "Boss Battle Music Pack Vol. 2.zip", kind: "music", selected: false, contents: "Musica da boss.", licenseStatus: "user-confirmed-licensed-for-project", reason: "Non incluso in questa fase: la musica continua e separata dai cue SFX sincronizzati." },
];

const affinities = {
  natura: { element: "natura", castVfx: "natura-cast", projectileVfx: "natura-projectile", impactVfx: "natura-impact", audio: "affinity-nature" },
  marea: { element: "marea", castVfx: "marea-cast", projectileVfx: "marea-projectile", impactVfx: "marea-impact", audio: "affinity-water" },
  ardore: { element: "ardore", castVfx: "ardore-cast", projectileVfx: "ardore-projectile", impactVfx: "ardore-impact", audio: "affinity-fire" },
  vento: { element: "vento", castVfx: "vento-cast", projectileVfx: "vento-projectile", impactVfx: "vento-impact", audio: "affinity-wind" },
  arcano: { element: "arcano", castVfx: "arcano-cast", projectileVfx: "arcano-projectile", impactVfx: "arcano-impact", audio: "affinity-arcane" },
  antico: { element: "antico", castVfx: "antico-cast", projectileVfx: "antico-projectile", impactVfx: "antico-impact", audio: "affinity-ancient" },
};

const elements = {
  ...affinities,
  ghiaccio: { element: "ghiaccio", castVfx: "ghiaccio-cast", projectileVfx: "ghiaccio-projectile", impactVfx: "ghiaccio-impact", audio: "affinity-ice" },
  fulmine: { element: "fulmine", castVfx: "fulmine-cast", projectileVfx: "fulmine-projectile", impactVfx: "fulmine-impact", audio: "affinity-lightning" },
  veleno: { element: "veleno", castVfx: "veleno-cast", projectileVfx: "veleno-projectile", impactVfx: "veleno-impact", audio: "affinity-poison" },
};

const statuses = {
  burn: { vfx: "status-burn", audio: "affinity-fire" },
  freeze: { vfx: "status-freeze", audio: "affinity-ice" },
  poison: { vfx: "status-poison", audio: "affinity-poison" },
  paralysis: { vfx: "status-shock", audio: "affinity-lightning" },
  sleep: { vfx: "status-sleep", audio: "cast" },
  slow: { vfx: "status-slow", audio: "affinity-water" },
  weaken: { vfx: "status-weaken", audio: "impact" },
  guard: { vfx: "status-guard", audio: "block" },
  regen: { vfx: "status-regen", audio: "heal" },
  focus: { vfx: "status-focus", audio: "cast" },
};

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function decodeText(bytes) {
  return new TextDecoder("utf-8").decode(bytes);
}

function assertMagusLicense(readme) {
  const normalized = readme.toLowerCase();
  for (const phrase of ["you can modify the assets", "you can only use these assets in commercial projects", "you can not redistribute or resale"]) {
    if (!normalized.includes(phrase)) throw new Error(`Licenza MagusVFX cambiata: manca '${phrase}'.`);
  }
}

function unzipSelection(bytes, wantedNames) {
  const wanted = new Set(wantedNames);
  const result = unzipSync(new Uint8Array(bytes), { filter: (entry) => wanted.has(entry.name) });
  for (const name of wanted) if (!result[name]) throw new Error(`Voce ZIP mancante: ${name}`);
  return result;
}

async function visibleFrameCount(png, plan) {
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const columns = info.width / plan.frameWidth;
  let visible = 0;
  for (let frame = 0; frame < plan.frameCount; frame += 1) {
    const startX = (frame % columns) * plan.frameWidth;
    const startY = Math.floor(frame / columns) * plan.frameHeight;
    let hasPixel = false;
    for (let y = startY; y < startY + plan.frameHeight && !hasPixel; y += 1) {
      for (let x = startX; x < startX + plan.frameWidth; x += 1) {
        const alpha = data[(y * info.width + x) * info.channels + 3];
        if (alpha > 0) {
          hasPixel = true;
          break;
        }
      }
    }
    if (hasPixel) visible += 1;
  }
  return visible;
}

async function packFramesHorizontally(png, plan) {
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const sourceColumns = info.width / plan.frameWidth;
  const outputWidth = plan.frameWidth * plan.frameCount;
  const output = Buffer.alloc(outputWidth * plan.frameHeight * 4);
  for (let frame = 0; frame < plan.frameCount; frame += 1) {
    const sourceX = (frame % sourceColumns) * plan.frameWidth;
    const sourceY = Math.floor(frame / sourceColumns) * plan.frameHeight;
    for (let y = 0; y < plan.frameHeight; y += 1) {
      const sourceStart = ((sourceY + y) * info.width + sourceX) * 4;
      const targetStart = (y * outputWidth + frame * plan.frameWidth) * 4;
      data.copy(output, targetStart, sourceStart, sourceStart + plan.frameWidth * 4);
    }
  }
  return sharp(output, { raw: { width: outputWidth, height: plan.frameHeight, channels: 4 } })
    .png({ compressionLevel: 9, adaptiveFiltering: false, palette: false })
    .toBuffer();
}

async function prepareVfxAsset(plan, sourceBytes, sourceArchive) {
  const input = Buffer.from(sourceBytes);
  const sourceMetadata = await sharp(input).metadata();
  const sourceStats = await sharp(input).ensureAlpha().stats();
  const sourceAlpha = sourceStats.channels[3];
  if (!sourceMetadata.hasAlpha || sourceAlpha.min !== 0 || sourceAlpha.max <= 0) throw new Error(`${plan.id}: il sorgente non possiede trasparenza reale.`);
  const sourcePng = await sharp(input).ensureAlpha().png({ compressionLevel: 9, adaptiveFiltering: false, palette: false }).toBuffer();
  const sourceLayout = await sharp(sourcePng).metadata();
  if (!sourceLayout.width || !sourceLayout.height || sourceLayout.width % plan.frameWidth !== 0 || sourceLayout.height % plan.frameHeight !== 0) throw new Error(`${plan.id}: griglia inattesa ${sourceLayout.width}x${sourceLayout.height}.`);
  const sourceColumns = sourceLayout.width / plan.frameWidth;
  const sourceRows = sourceLayout.height / plan.frameHeight;
  if (plan.frameCount > sourceColumns * sourceRows) throw new Error(`${plan.id}: frame oltre la capacita della griglia.`);
  const visibleFrames = await visibleFrameCount(sourcePng, plan);
  if (visibleFrames < Math.ceil(plan.frameCount * 0.7)) throw new Error(`${plan.id}: solo ${visibleFrames}/${plan.frameCount} frame visibili.`);
  const optimized = await packFramesHorizontally(sourcePng, plan);
  const metadata = await sharp(optimized).metadata();
  const stats = await sharp(optimized).stats();
  const alpha = stats.channels[3];
  await writeFile(path.join(vfxRoot, plan.output), optimized);
  return {
    id: plan.id,
    purpose: plan.purpose,
    ...(plan.element ? { element: plan.element } : {}),
    ...(plan.status ? { status: plan.status } : {}),
    path: `/famiglio/rebuild/combat/vfx/${plan.output}`,
    sourceArchive,
    sourceEntry: plan.source,
    format: "image/png",
    width: metadata.width,
    height: metadata.height,
    frameWidth: plan.frameWidth,
    frameHeight: plan.frameHeight,
    columns: plan.frameCount,
    rows: 1,
    frameCount: plan.frameCount,
    visibleFrames,
    sourceLayout: {
      width: sourceLayout.width,
      height: sourceLayout.height,
      columns: sourceColumns,
      rows: sourceRows,
    },
    fps: plan.fps,
    alphaMin: alpha.min,
    alphaMax: alpha.max,
    bytes: optimized.byteLength,
    sha256: sha256(optimized),
    sourceSha256: sha256(input),
  };
}

async function prepareVfx() {
  await mkdir(vfxRoot, { recursive: true });
  const assets = [];
  const magusBytes = await readFile(path.join(sourceRoot, MAGUS_ARCHIVE));
  const magusOuter = unzipSelection(magusBytes, ["ReadMe.txt", MAGUS_NESTED_ARCHIVE]);
  assertMagusLicense(decodeText(magusOuter["ReadMe.txt"]));
  const magusNested = unzipSelection(magusOuter[MAGUS_NESTED_ARCHIVE], coreVfxPlan.map((asset) => asset.source));
  for (const plan of coreVfxPlan) assets.push(await prepareVfxAsset(plan, magusNested[plan.source], MAGUS_ARCHIVE));
  const elementalBytes = await readFile(path.join(sourceRoot, ELEMENTAL_ARCHIVE));
  const elemental = unzipSelection(elementalBytes, elementalVfxPlan.map((asset) => asset.source));
  for (const plan of elementalVfxPlan) assets.push(await prepareVfxAsset(plan, elemental[plan.source], ELEMENTAL_ARCHIVE));
  const statusBytes = await readFile(path.join(sourceRoot, STATUS_ARCHIVE));
  const status = unzipSelection(statusBytes, statusVfxPlan.map((asset) => asset.source));
  for (const plan of statusVfxPlan) assets.push(await prepareVfxAsset(plan, status[plan.source], STATUS_ARCHIVE));
  return {
    assets,
    sources: {
      magus: { archiveSha256: sha256(magusBytes), licenseEvidenceSha256: sha256(magusOuter["ReadMe.txt"]) },
      elemental: { archiveSha256: sha256(elementalBytes) },
      status: { archiveSha256: sha256(statusBytes) },
    },
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
    if (id === "fmt ") format = { audioFormat: wave.readUInt16LE(payload), channels: wave.readUInt16LE(payload + 2), sampleRate: wave.readUInt32LE(payload + 4), byteRate: wave.readUInt32LE(payload + 8), blockAlign: wave.readUInt16LE(payload + 12), bitDepth: wave.readUInt16LE(payload + 14) };
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
  const bytesPerSample = info.bitDepth / 8;
  const frameCount = Math.min(info.frameCount, Math.round(info.sampleRate * maxDurationMs / 1000));
  const samples = new Float32Array(frameCount * info.channels);
  let peak = 0;
  for (let frame = 0; frame < frameCount; frame += 1) for (let channel = 0; channel < info.channels; channel += 1) {
    const inputOffset = info.offset + frame * info.blockAlign + channel * bytesPerSample;
    const value = readPcmSample(source, inputOffset, info.bitDepth);
    samples[frame * info.channels + channel] = value;
    peak = Math.max(peak, Math.abs(value));
  }
  if (peak < 0.0001) throw new Error("SFX silenzioso.");
  const gain = Math.min(1.35, 0.92 / peak);
  const fadeInFrames = Math.max(1, Math.round(info.sampleRate * 0.006));
  const fadeOutFrames = Math.max(1, Math.round(info.sampleRate * 0.08));
  const output = Buffer.alloc(44 + samples.length * 2);
  output.write("RIFF", 0, "ascii");
  output.writeUInt32LE(output.length - 8, 4);
  output.write("WAVE", 8, "ascii");
  output.write("fmt ", 12, "ascii");
  output.writeUInt32LE(16, 16);
  output.writeUInt16LE(1, 20);
  output.writeUInt16LE(info.channels, 22);
  output.writeUInt32LE(info.sampleRate, 24);
  output.writeUInt32LE(info.sampleRate * info.channels * 2, 28);
  output.writeUInt16LE(info.channels * 2, 32);
  output.writeUInt16LE(16, 34);
  output.write("data", 36, "ascii");
  output.writeUInt32LE(samples.length * 2, 40);
  let sumSquares = 0;
  let outputPeak = 0;
  for (let frame = 0; frame < frameCount; frame += 1) {
    const fadeIn = Math.min(1, frame / fadeInFrames);
    const fadeOut = Math.min(1, (frameCount - 1 - frame) / fadeOutFrames);
    const envelope = Math.max(0, Math.min(fadeIn, fadeOut));
    for (let channel = 0; channel < info.channels; channel += 1) {
      const index = frame * info.channels + channel;
      const value = Math.max(-1, Math.min(1, samples[index] * gain * envelope));
      output.writeInt16LE(Math.round(value * 32767), 44 + index * 2);
      sumSquares += value * value;
      outputPeak = Math.max(outputPeak, Math.abs(value));
    }
  }
  return { output, peak: outputPeak, rms: Math.sqrt(sumSquares / samples.length) };
}

async function prepareAudio() {
  await mkdir(audioRoot, { recursive: true });
  const archiveBytes = await readFile(path.join(sourceRoot, AUDIO_ARCHIVE));
  const plans = audioPlan.map((plan) => ({ ...plan, sourceEntry: `DarkFantasy_Sound/WAV/${plan.source}` }));
  const entries = unzipSelection(archiveBytes, plans.map((plan) => plan.sourceEntry));
  const assets = [];
  for (const plan of plans) {
    const source = Buffer.from(entries[plan.sourceEntry]);
    const normalized = encodeNormalizedWave(source, plan.maxDurationMs);
    const outputInfo = inspectWave(normalized.output);
    await writeFile(path.join(audioRoot, plan.output), normalized.output);
    assets.push({ id: plan.id, purpose: plan.purpose, path: `/famiglio/rebuild/combat/audio/${plan.output}`, sourceArchive: AUDIO_ARCHIVE, sourceEntry: plan.sourceEntry, format: "audio/wav", channels: outputInfo.channels, sampleRate: outputInfo.sampleRate, bitDepth: outputInfo.bitDepth, durationMs: outputInfo.durationMs, peakAmplitude: Number(normalized.peak.toFixed(4)), rmsAmplitude: Number(normalized.rms.toFixed(4)), bytes: normalized.output.byteLength, sha256: sha256(normalized.output), sourceSha256: sha256(source), origin: "user-licensed-source" });
  }
  return { assets, archiveSha256: sha256(archiveBytes) };
}

async function main() {
  await mkdir(outputRoot, { recursive: true });
  const vfx = await prepareVfx();
  const audio = await prepareAudio();
  const manifest = {
    schemaVersion: 2,
    reviewedOn: "2026-09-04",
    policy: { unknownLicenseAssetsShipped: false, userAuthorizedAssetIntegration: true, standaloneRedistributionAllowed: false, authorizationBasis: "Conferma esplicita dell'utente del 2026-09-04: tutti gli effetti in Documents/asset game sono licenziati per il progetto.", note: "Gli asset selezionati sono incorporati nel gioco e non redistribuiti come pacchetto autonomo." },
    approvedSources: [
      { archive: MAGUS_ARCHIVE, creator: "MagusVFX", licenseStatus: "archive-license-verified", licenseEvidenceEntry: "ReadMe.txt", licenseEvidenceSha256: vfx.sources.magus.licenseEvidenceSha256, archiveSha256: vfx.sources.magus.archiveSha256, distributableInsideProject: true },
      { archive: ELEMENTAL_ARCHIVE, creator: "VividMotion", licenseStatus: "user-confirmed-licensed-for-project", archiveSha256: vfx.sources.elemental.archiveSha256, distributableInsideProject: true },
      { archive: STATUS_ARCHIVE, creator: "VividMotion", licenseStatus: "user-confirmed-licensed-for-project", archiveSha256: vfx.sources.status.archiveSha256, distributableInsideProject: true },
      { archive: AUDIO_ARCHIVE, creator: "DarkFantasy Sound", licenseStatus: "user-confirmed-licensed-for-project", archiveSha256: audio.archiveSha256, distributableInsideProject: true },
    ],
    sourceInventory,
    vfx: vfx.assets,
    audio: audio.assets,
    choreography: {
      cast: { vfx: "cast", audio: "cast", placement: "actor" },
      motion: { vfx: "motion", projectileVfx: "projectile", audio: "motion", placement: "travel" },
      impact: { vfx: "impact", audio: "impact", placement: "target" },
      block: { vfx: "status-guard", audio: "block", placement: "target" },
      hit: { vfx: "hit", audio: "hit", placement: "target" },
      heal: { vfx: "status-heal", audio: "heal", placement: "actor" },
      win: { vfx: "win", audio: "win", placement: "actor" },
      lose: { vfx: "lose", audio: "lose", placement: "actor" },
    },
    moveClasses: {
      physical: { windupVfx: "motion", impactVfx: "impact", audio: "impact" },
      magic: { useAffinitySet: true },
      status: { useStatusSet: true, fallbackVfx: "status-focus", audio: "cast" },
      restore: { windupVfx: "status-heal", impactVfx: "status-regen", audio: "heal" },
    },
    affinities,
    elements,
    statuses,
  };
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  process.stdout.write(`Preparati ${vfx.assets.length} VFX trasparenti e ${audio.assets.length} SFX verificati. Manifest: ${manifestPath}\n`);
}

await main();
