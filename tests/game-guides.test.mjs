import test from "node:test";
import { getScheduledGuideEditorialNews } from "../lib/guideEditorial.ts";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";

const source = await readFile(new URL("../lib/gameGuides.ts", import.meta.url), "utf8");
const animal = JSON.parse(await readFile(new URL("../data/animal-crossing-guide.json", import.meta.url), "utf8"));
const minecraft = JSON.parse(await readFile(new URL("../data/minecraft-guide.json", import.meta.url), "utf8"));
const skyrim = JSON.parse(await readFile(new URL("../data/skyrim-guide.json", import.meta.url), "utf8"));
const worldOfWarcraft = JSON.parse(await readFile(new URL("../data/world-of-warcraft-guide.json", import.meta.url), "utf8"));
const baldursGate = source.slice(source.indexOf('id: "bg3-complete-guide-01"'), source.indexOf("export function isGuideVipNow"));

test("keeps navigation artwork lightweight without replacing source originals", async () => {
  const navigationAssets = ["lorewise-universe-logo", "lorewise-wax-seal", "arte", "giochi", "mondi", "commissioni", "vip", "shop", "account"];
  for (const asset of navigationAssets) {
    const info = await stat(new URL(`../public/brand/navigation/${asset}.webp`, import.meta.url));
    assert.ok(info.size < 50 * 1024, `${asset} must remain below 50 KB`);
  }
});

test("serves optimized WebP guide sprites and WoW scenes", async () => {
  const guideSprites = ["baldurs-gate-3", "minecraft", "skyrim", "world-of-warcraft"];
  for (const guide of guideSprites) {
    const info = await stat(new URL(`../public/atlas/${guide}/guide-section-icons-v1.webp`, import.meta.url));
    assert.ok(info.size < 1024 * 1024, `${guide} sprite must remain below 1 MB`);
  }
  assert.ok(worldOfWarcraft.chapters.flatMap((chapter) => chapter.images).every((image) => !image.src.endsWith(".png")));
});

test("rotates Animal Crossing into the Atlas when Baldur's Gate 3 enters VIP", () => {
  assert.equal(animal.publicAt, "2026-08-24T00:00:00+02:00");
  assert.match(baldursGate, /vipFrom: "2026-08-24T00:00:00\+02:00"/);
  assert.match(baldursGate, /publicAt: "2026-08-31T00:00:00\+02:00"/);
});

test("schedules Minecraft as the weekly guide immediately after Baldur's Gate 3", () => {
  assert.equal(minecraft.vipFrom, "2026-08-31T00:00:00+02:00");
  assert.equal(minecraft.publicAt, "2026-09-07T00:00:00+02:00");
  assert.match(source, /minecraftGuideJson/);
  assert.match(source, /minecraftGuide, skyrimGuide, worldOfWarcraftGuide\]/);
});

test("schedules Skyrim immediately after Minecraft and leaves future guides discoverable", () => {
  assert.equal(skyrim.vipFrom, "2026-09-07T00:00:00+02:00");
  assert.equal(skyrim.publicAt, "2026-09-14T00:00:00+02:00");
  assert.match(source, /skyrimGuideJson/);
  assert.match(source, /minecraftGuide, skyrimGuide, worldOfWarcraftGuide\]/);
});

test("schedules World of Warcraft after Skyrim as the first living guide", () => {
  assert.equal(worldOfWarcraft.vipFrom, "2026-09-14T00:00:00+02:00");
  assert.equal(worldOfWarcraft.publicAt, "2026-09-21T00:00:00+02:00");
  assert.equal(worldOfWarcraft.livingGuide.enabled, true);
  assert.equal(worldOfWarcraft.livingGuide.cadence, "monthly");
  assert.equal(worldOfWarcraft.livingGuide.approvalRequired, true);
  assert.match(worldOfWarcraft.livingGuide.announcement, /prima Guida Viva/i);
});

test("updates Monday guide news and previews the following scheduled guide automatically", () => {
  const schedule = [
    { slug: animal.slug, vipFrom: animal.vipFrom, publicAt: animal.publicAt },
    { slug: "baldurs-gate-3", vipFrom: "2026-08-24T00:00:00+02:00", publicAt: "2026-08-31T00:00:00+02:00" },
    { slug: minecraft.slug, vipFrom: minecraft.vipFrom, publicAt: minecraft.publicAt },
    { slug: skyrim.slug, vipFrom: skyrim.vipFrom, publicAt: skyrim.publicAt },
    { slug: worldOfWarcraft.slug, vipFrom: worldOfWarcraft.vipFrom, publicAt: worldOfWarcraft.publicAt },
  ];
  const animalWeek = getScheduledGuideEditorialNews(schedule, new Date("2026-08-23T12:00:00+02:00"));
  assert.equal(animalWeek.current?.slug, "animal-crossing-new-horizons");
  assert.equal(animalWeek.next?.slug, "baldurs-gate-3");

  const baldursGateWeek = getScheduledGuideEditorialNews(schedule, new Date("2026-08-24T12:00:00+02:00"));
  assert.equal(baldursGateWeek.current?.slug, "baldurs-gate-3");
  assert.equal(baldursGateWeek.next?.slug, "minecraft");
  assert.equal(baldursGateWeek.latestPublic?.slug, "animal-crossing-new-horizons");

  const minecraftWeek = getScheduledGuideEditorialNews(schedule, new Date("2026-08-31T12:00:00+02:00"));
  assert.equal(minecraftWeek.current?.slug, "minecraft");
  assert.equal(minecraftWeek.next?.slug, "the-elder-scrolls-v-skyrim");
  assert.equal(minecraftWeek.latestPublic?.slug, "baldurs-gate-3");

  const skyrimWeek = getScheduledGuideEditorialNews(schedule, new Date("2026-09-07T12:00:00+02:00"));
  assert.equal(skyrimWeek.current?.slug, "the-elder-scrolls-v-skyrim");
  assert.equal(skyrimWeek.next?.slug, "world-of-warcraft");
});

test("keeps World of Warcraft at the premium living-guide standard", () => {
  assert.equal(worldOfWarcraft.chapters.length, 16);
  assert.equal(worldOfWarcraft.sections.length, 6);
  assert.equal(worldOfWarcraft.chapters.reduce((total, chapter) => total + chapter.blocks.length, 0), 48);
  assert.ok(worldOfWarcraft.chapters.every((chapter) => chapter.blocks.length === 3));
  assert.ok(worldOfWarcraft.chapters.every((chapter) => chapter.blocks.some((block) => block.steps || block.table || block.scenarios || block.spoilerDetails)));
  assert.equal(worldOfWarcraft.sections.filter((section) => section.iconSprite?.src === "/atlas/world-of-warcraft/guide-section-icons-v1.webp").length, 6);
  assert.equal(new Set(worldOfWarcraft.sections.map((section) => section.iconSprite?.position)).size, 6);
});

test("uses one distinct official high-resolution scene for every World of Warcraft chapter", () => {
  const images = worldOfWarcraft.chapters.flatMap((chapter) => chapter.images.map((image) => image.src));
  assert.equal(images.length, 16);
  assert.equal(new Set(images).size, 16);
  assert.ok(images.every((src) => src.startsWith("/atlas/world-of-warcraft/official/")));
});

test("keeps every World of Warcraft image aligned with its tutorial subject", () => {
  const editorialMap = {
    "choose-version": "01-returning-orientation.webp",
    "realm-faction-race": "02-silvermoon.webp",
    "classes-specializations": "03-devourer.webp",
    "talents-rotation": "04-rotation-cooldowns.webp",
    "interface-accessibility": "05-interface-hud.webp",
    "leveling-campaign": "06-eversong.webp",
    "world-warband-travel": "07-dragon-travel.webp",
    "gear-progression": "08-equipment-interface.webp",
    "professions-economy": "09-professions-interface.webp",
    dungeons: "10-dungeons-raids.webp",
    raids: "11-raid-voidspire.webp",
    "delves-prey-world": "12-prey.webp",
    "mythic-plus": "13-mythic-plus-combat.webp",
    pvp: "14-pvp-objectives.webp",
    "housing-collections-community": "15-housing.webp",
    "living-routine": "16-endeavors.webp"
  };

  for (const chapter of worldOfWarcraft.chapters) {
    assert.equal(
      chapter.images[0]?.src,
      `/atlas/world-of-warcraft/official/${editorialMap[chapter.id]}`,
      `${chapter.id} must keep its editorially approved image`
    );
  }
});

test("keeps Skyrim at the approved premium structured guide standard", () => {
  assert.equal(skyrim.chapters.length, 16);
  assert.equal(skyrim.sections.length, 6);
  assert.equal(skyrim.chapters.reduce((total, chapter) => total + chapter.blocks.length, 0), 48);
  assert.ok(skyrim.chapters.every((chapter) => chapter.blocks.length >= 3));
  assert.ok(skyrim.chapters.every((chapter) => chapter.blocks.some((block) => block.steps || block.table || block.scenarios || block.spoilerDetails)));
  assert.equal(skyrim.sections.filter((section) => section.iconSprite?.src === "/atlas/skyrim/guide-section-icons-v1.webp").length, 6);
  assert.equal(new Set(skyrim.sections.map((section) => section.iconSprite?.position)).size, 6);
});

test("uses one distinct official scene for every Skyrim tutorial chapter", () => {
  const images = skyrim.chapters.flatMap((chapter) => chapter.images.map((image) => image.src));
  assert.equal(images.length, 16);
  assert.equal(new Set(images).size, 16);
  assert.ok(images.every((src) => src.startsWith("/atlas/skyrim/official/")));
});

test("keeps Minecraft at the same deep structured Atlas standard", () => {
  assert.equal(minecraft.chapters.length, 16);
  assert.equal(minecraft.sections.length, 6);
  assert.ok(minecraft.chapters.every((chapter) => chapter.blocks.length >= 3));
  assert.equal(minecraft.chapters.reduce((total, chapter) => total + chapter.blocks.length, 0), 48);
  assert.ok(minecraft.chapters.every((chapter) => chapter.blocks.some((block) => block.steps || block.table || block.scenarios)));
  assert.equal(minecraft.sections.filter((section) => section.iconSprite?.src === "/atlas/minecraft/guide-section-icons-v1.webp").length, 6);
  assert.equal(new Set(minecraft.sections.map((section) => section.iconSprite?.position)).size, 6);
});

test("uses one distinct editorially mapped official image for every Minecraft chapter", () => {
  const expected = {
    "first-night": "survival-night.webp",
    "base-and-respawn": "cover-building.webp",
    mining: "mining-cavern.webp",
    "crafting-storage": "village-pots.webp",
    "biomes-exploration": "exploration-biomes.webp",
    "farming-food": "sniffer-torchflowers.webp",
    "villages-trading": "desert-village.webp",
    "movement-navigation": "trial-parkour.webp",
    "combat-mobs": "trial-combat.webp",
    "equipment-enchanting": "armor-trims.webp",
    "nether-preparation": "ruined-portal-bats.webp",
    "nether-progression": "nether-blazes.webp",
    "the-end": "ender-dragon-finale.webp",
    "redstone-basics": "redstone-pistons.webp",
    "automation-building": "redstone-crafter.webp",
    "multiplayer-world-care": "multiplayer-portal.webp"
  };
  const images = minecraft.chapters.map((chapter) => chapter.images[0]?.src);
  assert.equal(images.length, 16);
  assert.equal(new Set(images).size, 16);
  for (const chapter of minecraft.chapters) {
    assert.equal(chapter.images[0]?.src, `/atlas/minecraft/official/${expected[chapter.id]}`);
  }
});

test("keeps the Baldur's Gate 3 guide as deep and structured as the Atlas standard", () => {
  assert.equal([...baldursGate.matchAll(/number: "\d{2}"/g)].length, 16);
  assert.equal([...baldursGate.matchAll(/\{ id: "(?:begin|combat|world|choices|modes|check)"/g)].length, 6);
  assert.ok([...baldursGate.matchAll(/label: "/g)].length >= 40);
  assert.match(baldursGate, /Patch 8 · verificata fino all’Hotfix 36/);
  assert.match(baldursGate, /Larian · modalità Onore e Personalizzata/);
  assert.match(baldursGate, /Larian · gestore mod e compatibilità/);
  assert.equal([...baldursGate.matchAll(/guide-section-icons-v1\.webp/g)].length, 6);
});

test("uses one distinct official high-resolution scene for every Baldur's Gate 3 chapter", () => {
  const chapterImages = [...baldursGate.matchAll(/src: "(\/atlas\/baldurs-gate-3\/official\/official-\d{2}\.webp)"/g)].map((match) => match[1]);
  assert.equal(chapterImages.length, 16);
  assert.equal(new Set(chapterImages).size, 16);
});

test("keeps each official scene aligned with the subject of its tutorial chapter", () => {
  const editorialMap = {
    character: "official-02.webp",           // protagonista personalizzato
    "party-combat": "official-03.webp",     // gruppo di quattro avventurieri
    "exploration-growth": "official-01.webp", // città osservata in verticale
    quests: "official-04.webp",              // artefatto e missione personale
    rules: "official-11.webp",               // interfaccia, iniziativa e probabilità
    classes: "official-10.webp",             // selezione della sottoclasse
    magic: "official-14.webp",               // lancio di magia in combattimento
    equipment: "official-05.webp",           // arma ed equipaggiamento in uso
    battlefield: "official-12.webp",         // esplosione e interazione ambientale
    companions: "official-07.webp",          // compagna e storia personale
    inventory: "official-19.webp",           // inventari affiancati del gruppo
    campaign: "official-06.webp",            // panorama della città e avanzamento
    dialogue: "official-08.webp",            // interazione e prova del personaggio
    difficulty: "official-17.webp",          // incontro ad alta difficoltà
    multiplayer: "official-15.webp",         // quattro avventurieri insieme
    "final-checklist": "official-13.webp",  // situazione caotica da diagnosticare
  };

  for (const [chapterId, filename] of Object.entries(editorialMap)) {
    const start = baldursGate.indexOf(`id: "${chapterId}"`);
    const end = baldursGate.indexOf("\n    {", start + 1);
    assert.ok(start >= 0, `missing chapter ${chapterId}`);
    assert.match(baldursGate.slice(start, end < 0 ? undefined : end), new RegExp(filename.replace(".", "\\.")), `${chapterId} must keep its editorially approved image`);
  }
});
