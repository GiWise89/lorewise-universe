import { readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { unzipSync } from "fflate";
import sharp from "sharp";

const archivePath = join(process.cwd(), "tamagochi asset", "AnimalPack.zip");
const outputRoot = join(process.cwd(), "public", "famiglio", "professional", "animal-mega-pack");
const archive = unzipSync(new Uint8Array(await readFile(archivePath)));

const familiars = [
  {
    id: "moon-rabbit",
    sourceRoot: "AnimalPack/Bunny/BunnyWhite",
    behaviors: { idle: ["Idle.png", 12], walk: ["Running.png", 8], sit: ["LieDown.png", 6], groom: ["Liking.png", 5], rest: ["Sleep.png", 6] },
    actions: [["Liking.png", 5], ["AttackScratch.png", 8], ["Jumping.png", 11], ["HurtIdle.png", 8], ["Running.png", 8]],
  },
  {
    id: "pocket-dragon",
    sourceRoot: "AnimalPack/Turtle",
    behaviors: { idle: ["Idle.png", 8], walk: ["Walking.png", 8], sit: ["Sit.png", 7], groom: ["Hide.png", 13], rest: ["Sleep.png", 12] },
    actions: [["Attack.png", 10], ["Hide.png", 13], ["Jump.png", 14], ["Hurt.png", 12], ["Walking.png", 8]],
  },
  {
    id: "ember-red-panda",
    sourceRoot: "AnimalPack/Chicken",
    behaviors: {
      idle: ["Idle/LightBrownChickenIdle-Sheet.png", 2], walk: ["Walking/LightBrownChickenWalking-Sheet.png", 4],
      sit: ["Sitting/SittingBrown.png", 4], groom: ["Eating/LightBrownChickenEating-Sheet.png", 6], rest: ["Sleeping/LightBrownChickenSleeping.png", 1],
    },
    actions: [
      ["Eating/LightBrownChickenEating-Sheet.png", 6], ["Sitting/SittingBrown.png", 4],
      ["Walking/LightBrownChickenWalking-Sheet.png", 4], ["Hurt/ChikenHurtBrown.png", 8], ["Idle/LightBrownChickenIdle-Sheet.png", 2],
    ],
  },
  {
    id: "astral-fawn",
    sourceRoot: "AnimalPack/Parrot/Parrot1",
    behaviors: { idle: ["ParrotBird.png", 6], walk: ["ParrotWalk.png", 6], sit: ["ParrotSitting.png", 6], groom: ["ParrotFly.png", 8], rest: ["ParrotSleep.png", 8] },
    actions: [["ParrotAttack.png", 6], ["ParrotFly.png", 8], ["FlyAttack.png", 7], ["ParrotHurt.png", 12], ["ParrotWalk.png", 6]],
  },
  {
    id: "nexus-axolotl",
    sourceRoot: "AnimalPack/Bear/Grizzly",
    behaviors: { idle: ["BearIdle.png", 6], walk: ["BearRun.png", 5], sit: ["BearJump.png", 11], groom: ["BearHurt.png", 4], rest: ["BearSleep.png", 8] },
    actions: [["BearAttack.png", 9], ["BearIdle.png", 6], ["BearJump.png", 11], ["BearHurt.png", 10], ["BearRun.png", 5]],
  },
];

function asset(path) {
  const bytes = archive[path];
  if (!bytes) throw new Error(`Asset mancante nell'Animal Mega Pack: ${path}`);
  return Buffer.from(bytes);
}

async function normalizedFrame(source, frame, frames, cellSize = 64) {
  const metadata = await sharp(source).metadata();
  const sourceHeight = metadata.height ?? 0;
  const sourceWidth = Math.floor((metadata.width ?? 0) / frames);
  if (!sourceHeight || !sourceWidth) throw new Error("Sprite non leggibile");
  const tile = await sharp(source)
    .extract({ left: (frame % frames) * sourceWidth, top: 0, width: sourceWidth, height: sourceHeight })
    // Replica esattamente il modo in cui il frame originale viene mostrato
    // dal componente CSS. In questo modo il corpo non cambia scala passando
    // dalla posa normale al foglio delle azioni da 64 px.
    .resize(cellSize, cellSize, { kernel: "nearest", fit: "fill" })
    .png()
    .toBuffer();
  return {
    input: tile,
    left: 0,
    top: 0,
  };
}

async function buildActionSheet(familiar) {
  const columns = 8;
  const rows = 5;
  const cellSize = 64;
  const layers = [];
  for (let row = 0; row < rows; row += 1) {
    const [relative, frames] = familiar.actions[row];
    const source = asset(`${familiar.sourceRoot}/${relative}`);
    for (let column = 0; column < columns; column += 1) {
      const frame = await normalizedFrame(source, column, frames, cellSize);
      layers.push({ ...frame, left: frame.left + column * cellSize, top: frame.top + row * cellSize });
    }
  }
  return sharp({ create: { width: columns * cellSize, height: rows * cellSize, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(layers)
    .png()
    .toBuffer();
}

async function bottomRatios(source, frames, rows = 1, row = 0) {
  const metadata = await sharp(source).metadata();
  const width = Math.floor((metadata.width ?? 0) / frames);
  const height = Math.floor((metadata.height ?? 0) / rows);
  const ratios = [];
  for (let frame = 0; frame < frames; frame += 1) {
    const { data, info } = await sharp(source)
      .extract({ left: frame * width, top: row * height, width, height })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    let bottom = -1;
    for (let y = info.height - 1; y >= 0 && bottom < 0; y -= 1) {
      for (let x = 0; x < info.width; x += 1) {
        if (data[(y * info.width + x) * info.channels + 3] >= 20) { bottom = y; break; }
      }
    }
    ratios.push(bottom < 0 ? 1 : Number(((info.height - 1 - bottom) / info.height).toFixed(6)));
  }
  return ratios;
}

const grounding = {};

for (const familiar of familiars) {
  const targetRoot = join(outputRoot, familiar.id);
  await mkdir(targetRoot, { recursive: true });
  for (const [behavior, [relative]] of Object.entries(familiar.behaviors)) {
    const source = asset(`${familiar.sourceRoot}/${relative}`);
    await writeFile(join(targetRoot, `${behavior}.png`), source);
  }
  const actions = await buildActionSheet(familiar);
  await writeFile(join(targetRoot, "actions.png"), actions);
  grounding[familiar.id] = {
    behaviors: Object.fromEntries(await Promise.all(Object.entries(familiar.behaviors).map(async ([behavior, [relative, frames]]) => [behavior, await bottomRatios(asset(`${familiar.sourceRoot}/${relative}`), frames)]))),
    actions: await Promise.all(Array.from({ length: 5 }, (_, row) => bottomRatios(actions, 8, 5, row))),
  };
}

await writeFile(join(process.cwd(), "lib", "nexusFamiliarProfessionalGrounding.json"), `${JSON.stringify(grounding, null, 2)}\n`);

const bowlSheet = asset("AnimalPack/Bunny/BunnyStuffs/FoodBowl.png");
const bowlFrame = await sharp(bowlSheet)
  .extract({ left: 0, top: 0, width: 16, height: 16 })
  .png()
  .toBuffer();
const bowl = await sharp(bowlFrame)
  .trim()
  .resize({ width: 48, kernel: "nearest" })
  .png()
  .toBuffer();
const bowlTarget = join(process.cwd(), "public", "famiglio", "props", "actions", "food.png");
await mkdir(dirname(bowlTarget), { recursive: true });
await writeFile(bowlTarget, bowl);

console.log(JSON.stringify({ archivePath, outputRoot, familiars: familiars.map(({ id }) => id), bowlTarget }, null, 2));
