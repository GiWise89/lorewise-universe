import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { ALL_FAMILIARS, familiarAppearance, familiarPalettes } from "../lib/nexusFamiliarCatalog.ts";
import { FAMILIAR_GADGETS, familiarAppearanceWithGadget } from "../lib/nexusFamiliarGadgets.ts";
import { FAMILIAR_HABITAT_THEMES } from "../lib/nexusDayCycle.ts";
import { familiarFrameBottomRatio, familiarOpticalBottomRatio } from "../lib/nexusFamiliarMotion.ts";

const outputRoot = join(process.cwd(), ".tmp", "familiar-grounding");
const sizes = {
  Gatto: { desktop: 260, mobile: 168 }, Cane: { desktop: 500, mobile: 360 }, Lupo: { desktop: 330, mobile: 220 },
  Coniglio: { desktop: 185, mobile: 122 }, Volpe: { desktop: 190, mobile: 123 },
  Tartaruga: { desktop: 145, mobile: 96 }, Gallina: { desktop: 105, mobile: 70 },
  Pappagallo: { desktop: 110, mobile: 74 }, Orso: { desktop: 205, mobile: 136 },
};
const viewports = { desktop: { width: 384, height: 198, scale: .25 }, mobile: { width: 390, height: 201, scale: 1 } };

async function frameFor(appearance, behavior, displaySize) {
  const sequence = appearance.behaviors[behavior];
  const source = join(process.cwd(), "public", sequence.spritePath.replace(/^\//, ""));
  const metadata = await sharp(source).metadata();
  const frameWidth = Math.floor(metadata.width / sequence.columns);
  const frameHeight = Math.floor(metadata.height / sequence.rows);
  const frame = behavior === "rest" ? sequence.holdFrame ?? sequence.frames - 1 : 0;
  return sharp(source)
    .extract({ left: frame * frameWidth, top: sequence.row * frameHeight, width: frameWidth, height: frameHeight })
    .resize(displaySize, displaySize, { kernel: "nearest", fit: "fill" })
    .png()
    .toBuffer();
}

async function actionFrameFor(appearance, row, displaySize) {
  const source = join(process.cwd(), "public", appearance.spritePath.replace(/^\//, ""));
  const metadata = await sharp(source).metadata();
  const frameWidth = Math.floor(metadata.width / appearance.columns);
  const frameHeight = Math.floor(metadata.height / appearance.rows);
  return sharp(source)
    .extract({ left: 0, top: row * frameHeight, width: frameWidth, height: frameHeight })
    .resize(displaySize, displaySize, { kernel: "nearest", fit: "fill" })
    .png()
    .toBuffer();
}

async function renderCell(theme, appearance, pose, viewportName) {
  const viewport = viewports[viewportName];
  const baseSize = sizes[appearance.family]?.[viewportName] ?? sizes.Gatto[viewportName];
  const behavior = typeof pose === "string" ? pose : "idle";
  const logicalActionRow = typeof pose === "number" ? pose : null;
  const actionKey = logicalActionRow === null ? null : ["food", "soap", "toy", "medicine"][logicalActionRow];
  const actionRow = actionKey === null ? null : appearance.actionRows?.[actionKey] ?? logicalActionRow;
  const displaySize = Math.round(baseSize * viewport.scale);
  const ratio = familiarOpticalBottomRatio(appearance.family, behavior, actionRow);
  const groundY = Math.round(viewport.height * theme.groundLinePercent / 100);
  const spriteTop = Math.round(groundY - displaySize * (1 - ratio));
  const spriteLeft = Math.round((viewport.width - displaySize) / 2);
  const background = join(process.cwd(), "public", theme.backgrounds.giorno.replace(/^\//, ""));
  const sprite = actionRow === null ? await frameFor(appearance, behavior, displaySize) : await actionFrameFor(appearance, actionRow, displaySize);
  const sourceLeft = Math.max(0, -spriteLeft);
  const sourceTop = Math.max(0, -spriteTop);
  const targetLeft = Math.max(0, spriteLeft);
  const targetTop = Math.max(0, spriteTop);
  const visibleWidth = Math.min(displaySize - sourceLeft, viewport.width - targetLeft);
  const visibleHeight = Math.min(displaySize - sourceTop, viewport.height - targetTop);
  const visibleSprite = await sharp(sprite).extract({ left: sourceLeft, top: sourceTop, width: visibleWidth, height: visibleHeight }).png().toBuffer();
  const label = Buffer.from(`<svg width="${viewport.width}" height="${viewport.height}"><style>text{font:700 12px Arial;fill:#fff;paint-order:stroke;stroke:#080510;stroke-width:3px}</style><text x="10" y="18">${appearance.family} · ${theme.name}</text><line x1="0" x2="${viewport.width}" y1="${groundY}" y2="${groundY}" stroke="#00ff9d" stroke-width="2" opacity=".8"/></svg>`);
  return sharp(background)
    .resize(viewport.width, viewport.height, { fit: "fill" })
    .composite([{ input: visibleSprite, left: targetLeft, top: targetTop }, { input: label, left: 0, top: 0 }])
    .png()
    .toBuffer();
}

async function renderMatrix(viewportName, pose) {
  const viewport = viewports[viewportName];
  const cells = [];
  for (let row = 0; row < FAMILIAR_HABITAT_THEMES.length; row += 1) {
    for (let column = 0; column < ALL_FAMILIARS.length; column += 1) {
      cells.push({ input: await renderCell(FAMILIAR_HABITAT_THEMES[row], ALL_FAMILIARS[column], pose, viewportName), left: column * viewport.width, top: row * viewport.height });
    }
  }
  const poseName = typeof pose === "number" ? `action-${pose}` : pose;
  const target = join(outputRoot, `${viewportName}-${poseName}.png`);
  await sharp({ create: { width: viewport.width * ALL_FAMILIARS.length, height: viewport.height * FAMILIAR_HABITAT_THEMES.length, channels: 4, background: "#090610" } }).composite(cells).png().toFile(target);
  return target;
}

async function opaqueMetrics(buffer) {
  const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let bottom = -1;
  let opaquePixels = 0;
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      if (data[(y * info.width + x) * info.channels + 3] > 8) {
        opaquePixels += 1;
        bottom = Math.max(bottom, y);
      }
    }
  }
  return {
    bottomRatio: bottom < 0 ? 1 : (info.height - 1 - bottom) / info.height,
    opaqueFraction: opaquePixels / (info.width * info.height),
  };
}

async function verifyEveryFrame() {
  const checks = [];
  for (const base of ALL_FAMILIARS) {
    for (const palette of familiarPalettes(base.id)) {
      const paletteAppearance = familiarAppearance(palette.id);
      for (const gadgetId of [null, ...FAMILIAR_GADGETS.map((gadget) => gadget.id)]) {
      const appearance = familiarAppearanceWithGadget(paletteAppearance, gadgetId);
      const auditId = gadgetId ? `${appearance.id}+${gadgetId}` : appearance.id;
      for (const behavior of ["idle", "walk", "sit", "groom", "rest"]) {
        const sequence = appearance.behaviors[behavior];
        for (let frame = 0; frame < sequence.frames; frame += 1) {
          const source = join(process.cwd(), "public", sequence.spritePath.replace(/^\//, ""));
          const metadata = await sharp(source).metadata();
          const width = Math.floor(metadata.width / sequence.columns);
          const height = Math.floor(metadata.height / sequence.rows);
          const buffer = await sharp(source).extract({ left: frame * width, top: sequence.row * height, width, height }).png().toBuffer();
          const metrics = await opaqueMetrics(buffer);
          const actual = metrics.bottomRatio;
          const configured = sequence.groundRatios?.[frame] ?? familiarFrameBottomRatio(base.family, behavior, null, frame);
          checks.push({ appearance: auditId, family: base.family, pose: behavior, frame, actual, configured, opaqueFraction: metrics.opaqueFraction, delta: Math.abs(actual - configured) });
        }
      }
      const source = join(process.cwd(), "public", appearance.spritePath.replace(/^\//, ""));
      const metadata = await sharp(source).metadata();
      const width = Math.floor(metadata.width / appearance.columns);
      const height = Math.floor(metadata.height / appearance.rows);
      for (let row = 0; row < 5; row += 1) {
        for (let frame = 0; frame < appearance.columns; frame += 1) {
          const buffer = await sharp(source).extract({ left: frame * width, top: row * height, width, height }).png().toBuffer();
          const metrics = await opaqueMetrics(buffer);
          const actual = metrics.bottomRatio;
          const configured = appearance.actionGroundRatios?.[row]?.[frame] ?? familiarFrameBottomRatio(base.family, "idle", row, frame);
          checks.push({ appearance: auditId, family: base.family, pose: `action-${row}`, frame, actual, configured, opaqueFraction: metrics.opaqueFraction, delta: Math.abs(actual - configured) });
        }
      }
      }
    }
  }
  return checks;
}

await mkdir(outputRoot, { recursive: true });
const outputs = [];
const poses = ["idle", "walk", "sit", "groom", "rest", 0, 1, 2, 3];
for (const viewportName of Object.keys(viewports)) for (const pose of poses) outputs.push(await renderMatrix(viewportName, pose));
const overviews = [];
for (const viewportName of Object.keys(viewports)) {
  const tiles = [];
  for (let index = 0; index < poses.length; index += 1) {
    const pose = poses[index];
    const poseName = typeof pose === "number" ? `action-${pose}` : pose;
    const input = join(outputRoot, `${viewportName}-${poseName}.png`);
    const tile = await sharp(input).resize(1728, 495, { fit: "fill" }).png().toBuffer();
    tiles.push({ input: tile, left: index % 3 * 1728, top: Math.floor(index / 3) * 495 });
  }
  const target = join(outputRoot, `${viewportName}-overview.png`);
  await sharp({ create: { width: 5184, height: 1485, channels: 4, background: "#090610" } }).composite(tiles).png().toFile(target);
  overviews.push(target);
}
const frameChecks = await verifyEveryFrame();
const worstFrameDelta = frameChecks.reduce((worst, check) => check.delta > worst.delta ? check : worst, frameChecks[0]);
const idleOpacityByAppearance = new Map();
for (const check of frameChecks) {
  if (check.pose !== "idle" || check.opaqueFraction <= 0) continue;
  const values = idleOpacityByAppearance.get(check.appearance) ?? [];
  values.push(check.opaqueFraction);
  idleOpacityByAppearance.set(check.appearance, values);
}
const scaleChecks = frameChecks.map((check) => {
  const idleValues = [...(idleOpacityByAppearance.get(check.appearance) ?? [check.opaqueFraction])].sort((a, b) => a - b);
  const idleOpacity = idleValues[Math.floor(idleValues.length / 2)] || check.opaqueFraction || 1;
  return { ...check, opacityRatioToIdle: check.opaqueFraction / idleOpacity };
});
const scaleOutliers = scaleChecks.filter((check) => check.opaqueFraction > 0 && (check.opacityRatioToIdle < .35 || check.opacityRatioToIdle > 3.2));
const report = {
  checkedAt: new Date().toISOString(),
  species: ALL_FAMILIARS.map((entry) => entry.family),
  themes: FAMILIAR_HABITAT_THEMES.map((entry) => ({ id: entry.id, groundLinePercent: entry.groundLinePercent })),
  viewports: Object.keys(viewports),
  poses: poses.map((pose) => typeof pose === "number" ? `action-${pose}` : pose),
  combinations: ALL_FAMILIARS.length * FAMILIAR_HABITAT_THEMES.length * Object.keys(viewports).length * poses.length,
  frameChecks: frameChecks.length,
  worstFrameDelta,
  blankFrames: frameChecks.filter((check) => check.actual === 1),
  groundingOutliers: frameChecks.filter((check) => check.actual !== 1 && check.delta > .025),
  scaleOutliers,
  outputs,
  overviews,
};
await writeFile(join(outputRoot, "report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (report.blankFrames.length || report.groundingOutliers.length || report.scaleOutliers.length) {
  console.error(`FAMIGLIO GROUNDING AUDIT: FAIL · ${report.blankFrames.length} frame vuoti · ${report.groundingOutliers.length} scarti dal pavimento · ${report.scaleOutliers.length} cambi di scala anomali`);
  process.exitCode = 1;
} else {
  console.log(`FAMIGLIO GROUNDING AUDIT: PASS · ${report.frameChecks} frame · nessun corpo che scompare, cambia scala o si stacca dal pavimento`);
}
