import { access, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const collectionRoot = path.join(root, "public", "famiglio", "rebuild", "collection");
const npcRoot = path.join(root, "public", "famiglio", "rebuild", "combat", "campaign", "npcs", "levels");
const stages = ["cucciolo", "giovane", "adulto"];
const battleActions = ["idle", "entrance", "run", "physical", "magic", "technique", "guard", "hit", "exhausted", "victory", "attack", "win", "lose"];
const houseActions = ["idle", "walk", "feed", "play", "clean", "care", "sit", "groom", "sleep", "sleep-calm"];

const failures = [];
const warnings = [];

async function inspectStrip(file, label) {
  try {
    await access(file);
    const meta = await sharp(file).metadata();
    if (!meta.width || !meta.height) failures.push(`${label}: dimensioni non leggibili`);
    else if (meta.width % meta.height !== 0) warnings.push(`${label}: foglio non divisibile in frame quadrati (${meta.width}x${meta.height})`);
    if (!meta.hasAlpha) warnings.push(`${label}: canale alpha assente`);
    return { width: meta.width ?? 0, height: meta.height ?? 0, frames: meta.height ? Math.round((meta.width ?? 0) / meta.height) : 0 };
  } catch {
    failures.push(`${label}: file mancante`);
    return null;
  }
}

const collectionEntries = (await readdir(collectionRoot, { withFileTypes: true })).filter((entry) => entry.isDirectory());
const familiarIds = [];
for (const entry of collectionEntries) {
  try {
    await access(path.join(collectionRoot, entry.name, "growth"));
    familiarIds.push(entry.name);
  } catch {
    // Cartelle legacy senza progressione non appartengono al catalogo ricostruito.
  }
}
familiarIds.sort();
if (familiarIds.length !== 53) failures.push(`Catalogo: attesi 53 Famigli, trovati ${familiarIds.length}`);

let inspected = 0;
for (const familiarId of familiarIds) {
  for (const stage of stages) {
    for (const action of battleActions) {
      await inspectStrip(path.join(collectionRoot, familiarId, "growth", stage, "battle-v2", `${action}.png`), `${familiarId}/${stage}/battle/${action}`);
      inspected += 1;
    }
    for (const action of houseActions) {
      await inspectStrip(path.join(collectionRoot, familiarId, "growth", stage, "house", `${action}.png`), `${familiarId}/${stage}/house/${action}`);
      inspected += 1;
    }
  }
}

const npcFiles = (await readdir(npcRoot)).filter((name) => name.endsWith(".png")).sort();
if (npcFiles.length !== 20) failures.push(`Campagna: attesi 20 NPC, trovati ${npcFiles.length}`);
for (const file of npcFiles) {
  try {
    const meta = await sharp(path.join(npcRoot, file)).metadata();
    const frameWidth = (meta.width ?? 0) / 8;
    const frameHeight = (meta.height ?? 0) / 6;
    if (!meta.width || !meta.height || !Number.isInteger(frameWidth) || frameWidth !== frameHeight) failures.push(`npc/${file}: atlante 8x6 non valido`);
    if (!meta.hasAlpha) warnings.push(`npc/${file}: canale alpha assente`);
  } catch {
    failures.push(`npc/${file}: file mancante o illeggibile`);
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  familiars: familiarIds.length,
  npcSheets: npcFiles.length,
  inspectedSequences: inspected + npcFiles.length,
  failures,
  warnings,
  passed: failures.length === 0,
};
await writeFile(path.join(root, "artifacts", "famiglio-quality-report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;
