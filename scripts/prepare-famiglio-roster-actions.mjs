import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { unzipSync } from "fflate";
import sharp from "sharp";

const starterRoot = path.join("public", "famiglio", "rebuild", "starters");
const archive = unzipSync(new Uint8Array(await readFile(path.join("tamagochi asset", "AnimalPack.zip"))));

function purchased(relativePath) {
  const value = archive[relativePath];
  if (!value) throw new Error(`Asset acquistato mancante: ${relativePath}`);
  return Buffer.from(value);
}

async function save(species, name, source) {
  const destination = path.join(starterRoot, species, `${name}.png`);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, source);
}

async function saveSet(species, sourceRoot, definitions, suffix = "") {
  for (const [name, sourceName] of Object.entries(definitions)) {
    await save(species, `${name}${suffix}`, purchased(`${sourceRoot}/${sourceName}`));
  }
}

await saveSet("golden", "AnimalPack/Dogs/Golden", {
  idle: "GoldenIdle.png",
  walk: "RunDog.png",
  sleep: "SleepDog.png",
  sit: "Sitting.png",
  groom: "GoldenSniff.png",
  feed: "GoldenSniff.png",
  play: "GoldenBarking.png",
  clean: "GoldenSniff.png",
  care: "LieDown.png",
});

const rabbitDefinitions = {
  idle: "Idle.png",
  walk: "Running.png",
  sleep: "Sleep.png",
  sit: "LieDown.png",
  groom: "Liking.png",
  feed: "Liking.png",
  play: "Jumping.png",
  clean: "Liking.png",
  care: "LieDown.png",
};
const rabbitRoots = {
  white: "AnimalPack/Bunny/BunnyWhite",
  brown: "AnimalPack/Bunny/BunnyBrown/BunnyBrownPaid",
  black: "AnimalPack/Bunny/BunnyBlack",
};
for (const [variant, sourceRoot] of Object.entries(rabbitRoots)) {
  await saveSet("rabbit", sourceRoot, rabbitDefinitions, `-${variant}`);
}
await saveSet("rabbit", rabbitRoots.white, rabbitDefinitions);

await saveSet("turtle", "AnimalPack/Turtle", {
  idle: "Idle.png",
  walk: "Walking.png",
  sleep: "Sleep.png",
  sit: "Sit.png",
  groom: "Hide.png",
  feed: "Attack.png",
  play: "Jump.png",
  clean: "Hide.png",
  care: "Sit.png",
});

const parrotDefinitions = {
  idle: "Idle.png",
  walk: "Walk.png",
  sleep: "Sleeping.png",
  sit: "Sitting.png",
  groom: "Sitting.png",
  feed: "Attack.png",
  play: "Fly.png",
  clean: "Sitting.png",
  care: "Sitting.png",
};
const parrotVariants = {
  blue: ["AnimalPack/Parrot/Parrot1", {
    idle: "ParrotBird.png", walk: "ParrotWalk.png", sleep: "ParrotSleep.png", sit: "ParrotSitting.png",
    groom: "ParrotSitting.png", feed: "ParrotAttack.png", play: "ParrotFly.png", clean: "ParrotSitting.png", care: "ParrotSitting.png",
  }],
  red: ["AnimalPack/Parrot/Parrot2", parrotDefinitions],
  green: ["AnimalPack/Parrot/Parrot3", parrotDefinitions],
  silver: ["AnimalPack/Parrot/Parrot4", parrotDefinitions],
  violet: ["AnimalPack/Parrot/Parrot5", parrotDefinitions],
};
for (const [variant, [sourceRoot, definitions]] of Object.entries(parrotVariants)) {
  await saveSet("parrot", sourceRoot, definitions, `-${variant}`);
}
await saveSet("parrot", parrotVariants.blue[0], parrotVariants.blue[1]);

await saveSet("panda", "AnimalPack/Panda", {
  idle: "PandaIdle.png",
  sleep: "PandaSleep.png",
  sit: "PandaSitting.png",
  groom: "PandaResting.png",
  feed: "PandaEating.png",
  play: "Happy.png",
  clean: "PandaYoga1.png",
  care: "PandaWave.png",
});

await saveSet("horse", "AnimalPack/Horse", {
  idle: "Idle.png",
  sleep: "Sleeping.png",
  sit: "LayDown.png",
  groom: "Idle.png",
  feed: "Eating.png",
  play: "Idle.png",
  clean: "Idle.png",
  care: "LayDown.png",
});

const foxSource = path.join("public", "famiglio", "behaviors", "wild", "fox.png");
const foxRows = {
  idle: [0, 4],
  walk: [2, 8],
  sit: [3, 11],
  groom: [6, 8],
  sleep: [5, 6],
  feed: [6, 8],
  play: [4, 4],
  clean: [3, 11],
  care: [3, 11],
};
for (const [name, [row, frames]] of Object.entries(foxRows)) {
  const strip = await sharp(foxSource).extract({ left: 0, top: row * 32, width: frames * 32, height: 32 }).png().toBuffer();
  await save("fox", name, strip);
}

for (const action of ["idle", "walk", "feed", "play", "clean", "care", "sit", "groom", "sleep", "sleep-calm"]) {
  await save("cat", action, await readFile(path.join(starterRoot, "cat", `${action}-grey.png`)));
}

console.log("Azioni vive preparate dagli asset acquistati per tutti gli otto Famigli iniziali.");
