import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { unzipSync } from "fflate";

const root = process.cwd();
const outputRoot = path.join(root, "public", "famiglio", "rebuild", "collection");
const actions = ["idle", "walk", "feed", "play", "clean", "care", "sit", "groom", "sleep", "sleep-calm"];
const animalArchive = unzipSync(new Uint8Array(await readFile(path.join(root, "tamagochi asset", "AnimalPack.zip"))));
const fantasyArchive = unzipSync(new Uint8Array(await readFile(path.join(root, "tamagochi asset", "Fantasy RPG monster pack (by Franuka).zip"))));

const archiveFile = (archive, name) => {
  const value = archive[name];
  if (!value) throw new Error(`Asset mancante nell'archivio: ${name}`);
  return Buffer.from(value);
};

async function writeSet(id, sources) {
  const destination = path.join(outputRoot, id);
  await mkdir(destination, { recursive: true });
  for (const action of actions) {
    const source = sources[action] ?? sources.idle;
    const bytes = Buffer.isBuffer(source) ? source : await readFile(source);
    await writeFile(path.join(destination, `${action}.png`), bytes);
  }
}

for (const id of ["cat", "golden", "rabbit", "fox", "turtle", "parrot", "panda", "horse"]) {
  const starter = path.join(root, "public", "famiglio", "rebuild", "starters", id);
  await writeSet(id, Object.fromEntries(actions.map((action) => [action, path.join(starter, `${action}.png`)])));
}

const animalSets = {
  "polar-bear": { idle: "AnimalPack/Bear/Polar/IdleBear.png", walk: "AnimalPack/Bear/Polar/BearRun.png", feed: "AnimalPack/Bear/Polar/BearAttack.png", play: "AnimalPack/Bear/Polar/BearJump.png", sleep: "AnimalPack/Bear/Polar/BearSleep.png" },
  "brown-bear": { idle: "AnimalPack/Bear/Grizzly/BearIdle.png", walk: "AnimalPack/Bear/Grizzly/BearRun.png", feed: "AnimalPack/Bear/Grizzly/BearAttack.png", play: "AnimalPack/Bear/Grizzly/BearJump.png", sleep: "AnimalPack/Bear/Grizzly/BearSleep.png" },
  bird: { idle: "AnimalPack/Birds/Blue/IdleBird.png", walk: "AnimalPack/Birds/Blue/BirdWalk.png", feed: "AnimalPack/Birds/Blue/BirdAttack.png", play: "AnimalPack/Birds/Blue/BirdFly.png", sit: "AnimalPack/Birds/Blue/BirdSit.png", sleep: "AnimalPack/Birds/Blue/BirdSleep.png" },
  chicken: { idle: "AnimalPack/Chicken/Idle/LightBrownChickenIdle-Sheet.png", walk: "AnimalPack/Chicken/Walking/LightBrownChickenWalking-Sheet.png", feed: "AnimalPack/Chicken/Eating/LightBrownChickenEating-Sheet.png", play: "AnimalPack/Chicken/Chick/RunningChick.png", sit: "AnimalPack/Chicken/Sitting/SittingBrown.png", sleep: "AnimalPack/Chicken/Sleeping/LightBrownChickenSleeping.png" },
};
for (const [id, files] of Object.entries(animalSets)) {
  const set = Object.fromEntries(Object.entries(files).map(([action, source]) => [action, archiveFile(animalArchive, source)]));
  set.clean = set.sit ?? set.idle; set.care = set.sit ?? set.idle; set.groom = set.feed; set["sleep-calm"] = set.sleep;
  await writeSet(id, set);
}

const fantasy = {
  "faerie-dragon": ["Dragons", "FaerieDragon", "fly"], "blue-wyrmling": ["Dragons", "BlueWyrmling", "walk"],
  "young-green-dragon": ["Dragons", "YoungGreenDragon", "fly"], owlbear: ["Feywild", "Owlbear", "walk"],
  griffin: ["Loyalists", "Griffin", "fly"], "elder-snail": ["Medieval Manuscripts", "ElderSnail", "walk"],
  "fiddle-dog": ["Medieval Manuscripts", "FiddleDog", "walk"], "guardian-rabbit": ["Medieval Manuscripts", "RabbitSoldier", "walk"],
  slime: ["Bog Dwellers", "Slime", "move"], kappa: ["Yokai", "Kappa", "walk"], "nexus-bat": ["Undead", "Bat", "fly"],
  "frost-salamander": ["Frostlands", "FrostSalamander", "walk"], "adult-red-dragon": ["Dragons", "AdultRedDragon", "fly"],
  "ancient-black-dragon": ["Dragons", "AncientBlackDragon", "fly"], "displacer-beast": ["Feywild", "DisplacerBeast", "walk"],
  "ice-golem": ["Frostlands", "IceGolem", "walk"], hellhound: ["Infernal", "Hellhound", "walk"], imp: ["Infernal", "Imp", "walk"],
  beholder: ["Bog Dwellers", "Beholder", "move"], bulette: ["Desertic", "Bulette", "walk"], "purple-worm": ["Desertic", "PurpleWorm", "move"],
};
for (const [id, [zone, base, locomotion]] of Object.entries(fantasy)) {
  const prefix = `1x/${zone}/${base}`;
  const idle = archiveFile(fantasyArchive, `${prefix}_idle.png`);
  const move = archiveFile(fantasyArchive, `${prefix}_${locomotion}.png`);
  const attackName = id === "beholder" ? `${prefix}_attack (purple).png` : `${prefix}_attack.png`;
  const attack = archiveFile(fantasyArchive, attackName);
  await writeSet(id, { idle, walk: move, feed: attack, play: move, clean: idle, care: idle, sit: idle, groom: idle, sleep: idle, "sleep-calm": idle });
}

for (const [id, sourceId] of [["fairy-rabbit", "rabbit"], ["demon-rabbit", "rabbit"], ["guardian-rabbit", "guardian-rabbit"]]) {
  if (id === sourceId) continue;
  const source = path.join(outputRoot, sourceId);
  await writeSet(id, Object.fromEntries(actions.map((action) => [action, path.join(source, `${action}.png`)])));
}

const catVariants = { classico: 1, nero: 2, rosso: 3, crema: 4, grigio: 5, siamese: 6 };
for (const [variant, number] of Object.entries(catVariants)) {
  const prefix = path.join(root, "tamagochi asset", "lavorazione", "sorgenti", "Pet Cats Pack", `Cat-${number}`, `Cat-${number}`);
  await writeSet(path.join("cat", "variants", variant), {
    idle: `${prefix}-Idle.png`, walk: `${prefix}-Walk.png`, feed: `${prefix}-Licking 1.png`, play: `${prefix}-Run.png`,
    clean: `${prefix}-Stretching.png`, care: `${prefix}-Laying.png`, sit: `${prefix}-Sitting.png`, groom: `${prefix}-Licking 2.png`,
    sleep: `${prefix}-Sleeping1.png`, "sleep-calm": `${prefix}-Sleeping2.png`,
  });
}

for (const [variant, sourceVariant] of Object.entries({ bianco: "white", marrone: "brown", nero: "black" })) {
  const starter = path.join(root, "public", "famiglio", "rebuild", "starters", "rabbit");
  await writeSet(path.join("rabbit", "variants", variant), Object.fromEntries(actions.map((action) => [action, path.join(starter, `${action}-${sourceVariant}.png`)])));
}
for (const [variant, sourceVariant] of Object.entries({ blu: "blue", rosso: "red", verde: "green", argento: "silver", viola: "violet" })) {
  const starter = path.join(root, "public", "famiglio", "rebuild", "starters", "parrot");
  await writeSet(path.join("parrot", "variants", variant), Object.fromEntries(actions.map((action) => [action, path.join(starter, `${action}-${sourceVariant}.png`)])));
}
for (const [variant, folder] of Object.entries({ verde: "Green", blu: "Blue", rosa: "Pink", viola: "Purple", giallo: "Yellow", bianco: "White", nero: "Black", arancio: "Orange" })) {
  const prefix = `AnimalPack/Birds/${folder}`;
  await writeSet(path.join("bird", "variants", variant), {
    idle: archiveFile(animalArchive, `${prefix}/IdleBird.png`), walk: archiveFile(animalArchive, `${prefix}/BirdWalk.png`),
    feed: archiveFile(animalArchive, `${prefix}/BirdAttack.png`), play: archiveFile(animalArchive, `${prefix}/BirdFly.png`),
    clean: archiveFile(animalArchive, `${prefix}/BirdSit.png`), care: archiveFile(animalArchive, `${prefix}/BirdSit.png`),
    sit: archiveFile(animalArchive, `${prefix}/BirdSit.png`), groom: archiveFile(animalArchive, `${prefix}/BirdSit.png`),
    sleep: archiveFile(animalArchive, `${prefix}/BirdSleep.png`), "sleep-calm": archiveFile(animalArchive, `${prefix}/BirdSleep.png`),
  });
}

console.log("Roster reale, magico e leggendario preparato con dieci sequenze per specie.");
