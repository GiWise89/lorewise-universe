import test from "node:test";
import { getScheduledGuideEditorialNews } from "../lib/guideEditorial.ts";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import sharp from "sharp";

const source = await readFile(new URL("../lib/gameGuides.ts", import.meta.url), "utf8");
const experienceSource = await readFile(new URL("../components/GameGuideExperience.tsx", import.meta.url), "utf8");
const animal = JSON.parse(await readFile(new URL("../data/animal-crossing-guide.json", import.meta.url), "utf8"));
const minecraft = JSON.parse(await readFile(new URL("../data/minecraft-guide.json", import.meta.url), "utf8"));
const skyrim = JSON.parse(await readFile(new URL("../data/skyrim-guide.json", import.meta.url), "utf8"));
const worldOfWarcraft = JSON.parse(await readFile(new URL("../data/world-of-warcraft-guide.json", import.meta.url), "utf8"));
const theWitcher3 = JSON.parse(await readFile(new URL("../data/the-witcher-3-guide.json", import.meta.url), "utf8"));
const newGuideSlugs = ["hogwarts-legacy", "zelda-tears-of-the-kingdom", "the-sims-4", "red-dead-redemption-2", "monster-hunter-wilds", "diablo-iv", "pokemon-pokopia"];
const newGuides = await Promise.all(newGuideSlugs.map(async (slug) => JSON.parse(await readFile(new URL(`../data/${slug}-guide.json`, import.meta.url), "utf8"))));
const agreedGuideSlugs = ["the-mortuary-assistant", "cyberpunk-2077", "inazuma-eleven-victory-road"];
const agreedGuides = await Promise.all(agreedGuideSlugs.map(async (slug) => JSON.parse(await readFile(new URL(`../data/${slug}-guide.json`, import.meta.url), "utf8"))));
const yearEndGuideSlugs = ["south-park-scontri-di-retti", "stardew-valley", "the-wound-remembers"];
const yearEndGuides = await Promise.all(yearEndGuideSlugs.map(async (slug) => JSON.parse(await readFile(new URL(`../data/${slug}-guide.json`, import.meta.url), "utf8"))));
const baldursGate = source.slice(source.indexOf('id: "bg3-complete-guide-01"'), source.indexOf("export function isGuideVipNow"));

test("keeps navigation artwork lightweight without replacing source originals", async () => {
  const navigationAssets = ["lorewise-universe-logo", "lorewise-wax-seal", "arte", "giochi", "mondi", "commissioni", "vip", "shop", "account"];
  for (const asset of navigationAssets) {
    const info = await stat(new URL(`../public/brand/navigation/${asset}.webp`, import.meta.url));
    assert.ok(info.size < 50 * 1024, `${asset} must remain below 50 KB`);
  }
});

test("serves optimized WebP guide sprites and WoW scenes", async () => {
  const guideSprites = ["baldurs-gate-3", "minecraft", "skyrim", "world-of-warcraft", ...newGuideSlugs, "the-witcher-3"];
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
  assert.match(source, /minecraftGuide, skyrimGuide, worldOfWarcraftGuide/);
});

test("schedules Skyrim immediately after Minecraft and leaves future guides discoverable", () => {
  assert.equal(skyrim.vipFrom, "2026-09-07T00:00:00+02:00");
  assert.equal(skyrim.publicAt, "2026-09-14T00:00:00+02:00");
  assert.match(source, /skyrimGuideJson/);
  assert.match(source, /minecraftGuide, skyrimGuide, worldOfWarcraftGuide/);
});

test("schedules World of Warcraft after Skyrim as the first living guide", () => {
  assert.equal(worldOfWarcraft.vipFrom, "2026-09-14T00:00:00+02:00");
  assert.equal(worldOfWarcraft.publicAt, "2026-09-21T00:00:00+02:00");
  assert.equal(worldOfWarcraft.livingGuide.enabled, true);
  assert.equal(worldOfWarcraft.livingGuide.cadence, "monthly");
  assert.equal(worldOfWarcraft.livingGuide.approvalRequired, true);
  assert.match(worldOfWarcraft.livingGuide.announcement, /prima Guida Viva/i);
  assert.deepEqual(worldOfWarcraft.livingGuide.scope, {
    expansion: "Midnight",
    contentUpdate: "Curse of Ula’tek",
    season: "Stagione 2",
  });
  assert.equal(worldOfWarcraft.livingGuide.lastCheckedAt, "2026-08-24");
  assert.ok(worldOfWarcraft.livingGuide.monitoredSourceUrls.some((url) => url.includes("24296142")));
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

  const completedCalendar = getScheduledGuideEditorialNews(
    [...newGuides, theWitcher3, ...agreedGuides].map((guide) => ({ slug: guide.slug, vipFrom: guide.vipFrom, publicAt: guide.publicAt })),
    new Date("2026-12-07T12:00:00+01:00"),
  );
  assert.equal(completedCalendar.current, null);
  assert.equal(completedCalendar.next, null);
  assert.equal(completedCalendar.latestPublic?.slug, "inazuma-eleven-victory-road");
});

test("keeps World of Warcraft at the premium living-guide standard", () => {
  assert.equal(worldOfWarcraft.chapters.length, 16);
  assert.equal(worldOfWarcraft.sections.length, 6);
  assert.equal(worldOfWarcraft.chapters.reduce((total, chapter) => total + chapter.blocks.length, 0), 48);
  assert.ok(worldOfWarcraft.chapters.every((chapter) => chapter.blocks.length === 3));
  assert.ok(worldOfWarcraft.chapters.every((chapter) => chapter.blocks.some((block) => block.steps || block.table || block.scenarios || block.spoilerDetails)));
  assert.equal(worldOfWarcraft.sections.filter((section) => section.iconSprite?.src === "/atlas/world-of-warcraft/guide-section-icons-v1.webp").length, 6);
  assert.equal(new Set(worldOfWarcraft.sections.map((section) => section.iconSprite?.position)).size, 6);
  assert.equal(worldOfWarcraft.updatedAt, "24 agosto 2026");
  const mythicChapter = worldOfWarcraft.chapters.find((chapter) => chapter.id === "mythic-plus");
  assert.match(JSON.stringify(mythicChapter), /Altar of Fangs/);
  assert.match(JSON.stringify(mythicChapter), /Temple of Sethraliss/);
  const livingRoutine = JSON.stringify(worldOfWarcraft.chapters.find((chapter) => chapter.id === "living-routine"));
  assert.match(livingRoutine, /Midnight · Curse of Ula’tek · Stagione 2/i);
  assert.doesNotMatch(livingRoutine, /notifica mensile|centro notifiche|approvazione editoriale|protocollo/i);
  assert.ok(worldOfWarcraft.sources.some((source) => source.href.includes("24293281")));
  assert.ok(worldOfWarcraft.sources.some((source) => source.href.includes("24296142")));
});

test("schedules the approved guides around the dedicated Halloween week", () => {
  const expected = [
    ["hogwarts-legacy", "2026-09-21T00:00:00+02:00", "2026-09-28T00:00:00+02:00"],
    ["zelda-tears-of-the-kingdom", "2026-09-28T00:00:00+02:00", "2026-10-05T00:00:00+02:00"],
    ["the-sims-4", "2026-10-05T00:00:00+02:00", "2026-10-12T00:00:00+02:00"],
    ["red-dead-redemption-2", "2026-10-12T00:00:00+02:00", "2026-10-19T00:00:00+02:00"],
    ["monster-hunter-wilds", "2026-10-19T00:00:00+02:00", "2026-10-26T00:00:00+01:00"],
    ["diablo-iv", "2026-11-02T00:00:00+01:00", "2026-11-09T00:00:00+01:00"],
    ["pokemon-pokopia", "2026-11-09T00:00:00+01:00", "2026-11-16T00:00:00+01:00"],
  ];
  assert.deepEqual(newGuides.map((guide) => [guide.slug, guide.vipFrom, guide.publicAt]), expected);
  assert.deepEqual(
    agreedGuides.map((guide) => [guide.slug, guide.vipFrom, guide.publicAt]),
    [
      ["the-mortuary-assistant", "2026-10-26T00:00:00+01:00", "2026-11-02T00:00:00+01:00"],
      ["cyberpunk-2077", "2026-11-23T00:00:00+01:00", "2026-11-30T00:00:00+01:00"],
      ["inazuma-eleven-victory-road", "2026-11-30T00:00:00+01:00", "2026-12-07T00:00:00+01:00"],
    ],
  );
});

test("links every completed guide to an explicit official purchase or free download action", () => {
  const jsonGuides = [animal, minecraft, skyrim, worldOfWarcraft, ...newGuides, theWitcher3, ...agreedGuides];
  for (const guide of jsonGuides) {
    assert.match(guide.storeUrl, /^https:\/\//, `${guide.slug} official store URL`);
    if (guide.slug === "the-sims-4") assert.equal(guide.storeLabel, "Scarica gratis The Sims 4");
    else assert.match(guide.storeLabel, /^Acquista /, `${guide.slug} purchase label`);
  }
  assert.match(baldursGate, /storeLabel: "Acquista Baldur’s Gate 3"/);
  assert.match(experienceSource, /Store ufficiale esterno/);
});

test("keeps the three agreed guides complete with official uncropped chapter imagery and dedicated visual identities", async () => {
  const allowedHosts = /steamstatic\.com|inazuma\.jp|cdprojektred\.com|cdn\.cdpr\.app/;
  for (const guide of agreedGuides) {
    assert.equal(guide.chapters.length, 16, `${guide.slug} chapters`);
    assert.equal(guide.sections.length, 6, `${guide.slug} sections`);
    assert.equal(guide.chapters.reduce((total, chapter) => total + chapter.blocks.length, 0), 48, `${guide.slug} blocks`);
    assert.equal(new Set(guide.chapters.map((chapter) => chapter.images[0]?.src)).size, 16, `${guide.slug} distinct images`);
    assert.ok(guide.chapters.every((chapter) => chapter.blocks.length === 3));
    assert.ok(guide.chapters.every((chapter) => chapter.blocks.some((block) => block.steps) && chapter.blocks.some((block) => block.tips) && chapter.blocks.some((block) => block.scenarios)));
    assert.ok(guide.chapters.every((chapter) => allowedHosts.test(chapter.images[0]?.sourceUrl ?? "")), `${guide.slug} official web images`);
    assert.equal(guide.theme, guide.slug, `${guide.slug} dedicated theme`);
    assert.equal(new Set(guide.sections.map((section) => section.generatedIcon?.src)).size, 6, `${guide.slug} six dedicated icons`);
    for (const section of guide.sections) {
      assert.match(section.generatedIcon?.src ?? "", new RegExp(`^/atlas/${guide.slug}/generated-icons-v1/\\d{2}-`));
      assert.match(section.generatedIcon?.caption ?? "", /ImageGen/);
      const iconFile = new URL(`../public${section.generatedIcon.src}`, import.meta.url);
      const iconMetadata = await sharp(await readFile(iconFile)).metadata();
      assert.equal(iconMetadata.width, 512);
      assert.equal(iconMetadata.height, 512);
      assert.ok(iconMetadata.hasAlpha, `${section.generatedIcon.src} alpha`);
      assert.ok((await stat(iconFile)).size < 320 * 1024, `${section.generatedIcon.src} optimized`);
    }
    assert.doesNotMatch(JSON.stringify({ description: guide.description, sections: guide.sections, chapters: guide.chapters }), /controllo mensile|centro notifiche|approvazione editoriale|monitoraggio delle fonti|funzionamento interno/i);
    for (const chapter of guide.chapters) {
      const file = new URL(`../public${chapter.images[0].src}`, import.meta.url);
      const metadata = await sharp(await readFile(file)).metadata();
      assert.equal(metadata.width, 1600, `${guide.slug}/${chapter.id} width`);
      assert.equal(metadata.height, 900, `${guide.slug}/${chapter.id} height`);
      assert.ok((await stat(file)).size < 3 * 1024 * 1024, `${guide.slug}/${chapter.id} size`);
    }
  }
});

test("delivers the three year-end guides as complete, themed and uncropped experiences", async () => {
  assert.deepEqual(yearEndGuides.map((guide) => [guide.slug, guide.vipFrom, guide.publicAt]), [
    ["south-park-scontri-di-retti", "2026-12-07T00:00:00+01:00", "2026-12-14T00:00:00+01:00"],
    ["stardew-valley", "2026-12-14T00:00:00+01:00", "2026-12-21T00:00:00+01:00"],
    ["the-wound-remembers", "2026-12-21T00:00:00+01:00", "2026-12-28T00:00:00+01:00"],
  ]);
  for (const guide of yearEndGuides) {
    assert.equal(guide.chapters.length, 16, `${guide.slug} chapters`);
    assert.equal(guide.sections.length, 6, `${guide.slug} sections`);
    assert.equal(guide.chapters.reduce((total, chapter) => total + chapter.blocks.length, 0), 48, `${guide.slug} blocks`);
    assert.ok(guide.chapters.every((chapter) => chapter.images[0]?.src), `${guide.slug} chapter images`);
    assert.equal(new Set(guide.sections.map((section) => section.generatedIcon?.src)).size, 6, `${guide.slug} generated icons`);
    assert.ok(guide.chapters.every((chapter) => chapter.blocks.some((block) => block.steps) && chapter.blocks.some((block) => block.tips) && chapter.blocks.some((block) => block.scenarios)));
    assert.equal(guide.theme, guide.slug);
    assert.doesNotMatch(JSON.stringify(guide), /approvazione editoriale|monitoraggio delle fonti|processo tecnico|funzionamento interno/i);
    for (const chapter of guide.chapters) {
      const imageFile = new URL(`../public${chapter.images[0].src}`, import.meta.url);
      const metadata = await sharp(await readFile(imageFile)).metadata();
      assert.equal(metadata.width, 1600);
      assert.equal(metadata.height, 900);
      assert.ok((await stat(imageFile)).size < 3 * 1024 * 1024);
    }
    for (const section of guide.sections) {
      const iconFile = new URL(`../public${section.generatedIcon.src}`, import.meta.url);
      const metadata = await sharp(await readFile(iconFile)).metadata();
      assert.equal(metadata.width, 512);
      assert.equal(metadata.height, 512);
      assert.equal(metadata.hasAlpha, true);
      assert.ok((await stat(iconFile)).size < 320 * 1024);
    }
  }
  assert.match(experienceSource, /south-park-scontri-di-retti/);
  assert.match(experienceSource, /stardew-valley/);
  assert.match(experienceSource, /the-wound-remembers/);
});

test("keeps every Inazuma image tied to the subject of its chapter", () => {
  const inazuma = agreedGuides.find((guide) => guide.slug === "inazuma-eleven-victory-road");
  assert.ok(inazuma);
  assert.match(inazuma.cover.sourceUrl, /capsule_616x353\.jpg$/);
  assert.doesNotMatch(inazuma.cover.sourceUrl, /ss_9a85e644/);
  const expectedSources = {
    "editions-platforms": /header\.jpg$/,
    "first-setup": /ss_1279f2e/,
    "story-mode": /img_synopsis_01_2510/,
    "match-basics": /stit_zone_o_2510/,
    "focus-zone": /stit_forcus_2510/,
    "special-moves": /ss_9a85e644/,
    "tactics-commander": /stit_tactics_2510/,
    "team-building": /ss_a1280082/,
    "abilearn-passives": /img_enhancement-system_01_2510/,
    "chronicle-mode": /img_chronicle-battle-route_01_2510/,
    "scouting-collection": /img_chronicle-players_01_2510/,
    "competition-online": /ss_8c0e596b/,
    "bond-station": /img_kizuna-town_02_2510/,
    "crossplay-crosssave": /img_friends_01_2510/,
    "dlc-updates": /ss_e78a4001/,
    completion: /stit_chain_2510/,
  };
  for (const chapter of inazuma.chapters) {
    assert.match(chapter.images[0].sourceUrl, expectedSources[chapter.id], chapter.id);
  }
  const southPark = yearEndGuides.find((guide) => guide.slug === "south-park-scontri-di-retti");
  assert.match(southPark.chapters.find((chapter) => chapter.id === "dlc-path").images[0].alt, /Casa Bonita.*Bring the Crunch/i);
  assert.match(southPark.chapters.find((chapter) => chapter.id === "completion-danger-deck").images[0].alt, /Danger Deck/i);

});

test("keeps every The Wound Remembers image tied to the system explained by its chapter", () => {
  const wound = yearEndGuides.find((guide) => guide.slug === "the-wound-remembers");
  const expectedSubjects = {
    "first-access": /Santuario.*stato del viaggio/i,
    "collection-basics": /Collezione.*Costruttore/i,
    "pacts-factions": /Fazioni del mazzo/i,
    "deck-twenty": /Mazzo completo da venti carte/i,
    "campaign-ten-acts": /Mappa dei dieci atti/i,
    "lanes-intent": /tre corsie/i,
    "essence-tempo": /Essenza.*velocità.*fine turno/i,
    "status-signatures": /Carte.*effetti.*intento/i,
    "nemeses-bosses": /Orveth Incisore.*Nemesi/i,
    "expedition-route": /Spedizione nelle Profondità/i,
    "relics-events": /Reliquie attive.*eventi/i,
    "forge-fusions": /Varkhul.*Forgia/i,
    "evolutions-crafting": /Potenziale evolutivo/i,
    "familiars-habitat": /Tre Famigli reali/i,
    "arena-bestiary": /battaglia reale/i,
    "cloud-live-game": /Santuario.*profilo.*stato del viaggio/i,
  };
  for (const chapter of wound.chapters) {
    assert.match(chapter.images[0].alt, expectedSubjects[chapter.id], chapter.id);
  }
});

test("keeps every new guide at the detailed premium Atlas standard", async () => {
  for (const guide of newGuides) {
    assert.equal(guide.chapters.length, 16, `${guide.slug} chapters`);
    assert.equal(guide.sections.length, 6, `${guide.slug} sections`);
    assert.equal(guide.chapters.reduce((total, chapter) => total + chapter.blocks.length, 0), 48, `${guide.slug} blocks`);
    assert.equal(new Set(guide.chapters.map((chapter) => chapter.images[0]?.src)).size, 16, `${guide.slug} distinct images`);
    assert.ok(guide.chapters.every((chapter) => chapter.blocks.some((block) => block.steps) && chapter.blocks.some((block) => block.tips) && chapter.blocks.some((block) => block.scenarios)));
    for (const chapter of guide.chapters) {
      const image = await stat(new URL(`../public${chapter.images[0].src}`, import.meta.url));
      assert.ok(image.size < 3 * 1024 * 1024, `${chapter.images[0].src} must remain below 3 MB`);
      const metadata = await sharp(await readFile(new URL(`../public${chapter.images[0].src}`, import.meta.url))).metadata();
      assert.equal(metadata.width, 1600, `${chapter.images[0].src} width`);
      assert.equal(metadata.height, 900, `${chapter.images[0].src} height`);
    }
  }
});

test("uses website-sourced images and original generated section icons in every new guide", async () => {
  const allowedHosts = /cdn-hogwartslegacy\.warnerbrosgames\.com|assets\.nintendo\.com|media\.contentapi\.ea\.com|image\.api\.playstation\.com|steamstatic\.com|monsterhunter\.com|blz-contentstack-images\.akamaized\.net/;
  for (const guide of newGuides) {
    const sources = guide.chapters.map((chapter) => chapter.images[0]?.sourceUrl ?? "");
    assert.equal(sources.length, 16);
    assert.ok(sources.every((url) => allowedHosts.test(url)), `${guide.slug} must use declared website media`);
    assert.ok(sources.every((url) => !/youtube\/subassets\/poster|\/articles\/|trailer|news_/i.test(url)), `${guide.slug} must not use trailers, news cards, or promotional article artwork`);
    if (["the-sims-4", "monster-hunter-wilds", "diablo-iv"].includes(guide.slug)) {
      assert.ok(sources.every((url) => /steamstatic\.com/i.test(url)), `${guide.slug} must use gameplay screenshots only`);
    }
    assert.ok(guide.chapters.every((chapter) => /sito ufficiale/i.test(chapter.images[0]?.caption ?? "")));
    const sprite = await stat(new URL(`../public/atlas/${guide.slug}/guide-section-icons-v1.webp`, import.meta.url));
    assert.ok(sprite.size > 10 * 1024 && sprite.size < 1024 * 1024, `${guide.slug} must include a generated icon sprite`);
    assert.equal(new Set(guide.sections.map((section) => section.generatedIcon?.src)).size, 6, `${guide.slug} must use six separate section icons`);
    for (const section of guide.sections) {
      assert.match(section.generatedIcon?.src ?? "", new RegExp(`^/atlas/${guide.slug}/section-icons-imagegen-v1/\\d{2}-`));
      assert.match(section.generatedIcon?.caption ?? "", /ImageGen/);
      const icon = await stat(new URL(`../public${section.generatedIcon.src}`, import.meta.url));
      assert.ok(icon.size > 2 * 1024 && icon.size < 256 * 1024, `${section.generatedIcon.src} must be an optimized icon`);
    }
    const imageGenSource = await stat(new URL(`../assets/atlas-icon-sources/${guide.slug}-imagegen-v1.png`, import.meta.url));
    assert.ok(imageGenSource.size > 1024 * 1024, `${guide.slug} must retain its ImageGen source atlas`);
  }
});

test("marks only continuously evolving new games as approval-based living guides", () => {
  const livingSlugs = newGuides.filter((guide) => guide.livingGuide?.enabled).map((guide) => guide.slug);
  assert.deepEqual(livingSlugs, ["the-sims-4", "monster-hunter-wilds", "diablo-iv", "pokemon-pokopia"]);
  assert.ok(newGuides.filter((guide) => guide.livingGuide).every((guide) => guide.livingGuide.approvalRequired && guide.livingGuide.cadence === "monthly"));
});

test("keeps The Witcher 3 at the expanded twenty-chapter standard", async () => {
  const editorialSubjects = {
    "settings-accessibility": /HUD|leggibilità/i,
    "saves-cross-progression": /salvataggi|piattaforme/i,
    combat: /posizionamento|difesa/i,
    signs: /Segni/i,
    alchemy: /Alchimia/i,
    "skills-builds": /abilità|build/i,
    "equipment-crafting": /inventario|equipaggiamento/i,
    "economy-merchants": /mercanti|vendite/i,
    "contracts-bestiary": /indizi|mostro/i,
    gwent: /Gwent/i,
    "main-campaign": /Ciri|campagna/i,
    "side-quests": /relazioni|missioni/i,
    "hearts-of-stone": /Hearts of Stone/i,
    "blood-and-wine": /Blood and Wine|Toussaint/i,
    "new-game-plus-photo": /Photo Mode/i,
    "mods-redkit-future": /REDkit|mod/i,
  };
  assert.equal(theWitcher3.chapters.length, 20);
  assert.equal(theWitcher3.sections.length, 6);
  assert.equal(theWitcher3.chapters.reduce((total, chapter) => total + chapter.blocks.length, 0), 60);
  assert.equal(new Set(theWitcher3.chapters.map((chapter) => chapter.images[0]?.src)).size, 20);
  assert.ok(theWitcher3.chapters.every((chapter) => chapter.blocks.length === 3));
  assert.ok(theWitcher3.chapters.every((chapter) => chapter.blocks.some((block) => block.steps || block.table || block.scenarios || block.spoilerDetails)));
  assert.equal(theWitcher3.vipFrom, "2026-11-16T00:00:00+01:00");
  assert.equal(theWitcher3.publicAt, "2026-11-23T00:00:00+01:00");
  assert.equal(theWitcher3.storeUrl, "https://www.thewitcher.com/us/en/buy");
  assert.equal(theWitcher3.livingGuide.enabled, true);
  assert.match(theWitcher3.livingGuide.scope.season, /Songs of the Past/);
  for (const chapter of theWitcher3.chapters) {
    assert.match(chapter.images[0]?.sourceUrl ?? "", /steamstatic\.com|thewitcher\.com|imgur\.com|geeks\.news|interfaceingame\.com|rpgsite\.net|steamusercontent\.com|steamuserimages-a\.akamaihd\.net|player\.one|gram\.pl/);
    if (editorialSubjects[chapter.id]) {
      assert.match(`${chapter.images[0]?.alt ?? ""} ${chapter.images[0]?.caption ?? ""}`, editorialSubjects[chapter.id], chapter.id);
    }
    const file = new URL(`../public${chapter.images[0].src}`, import.meta.url);
    const metadata = await sharp(await readFile(file)).metadata();
    assert.equal(metadata.width, 1600, chapter.id);
    assert.equal(metadata.height, 900, chapter.id);
    assert.ok((await stat(file)).size < 3 * 1024 * 1024, chapter.id);
  }
});

test("does not expose guide maintenance mechanics to readers", () => {
  assert.doesNotMatch(experienceSource, /controllo mensile|prossimo controllo|solo dopo approvazione|centro notifiche/i);
});

test("uses six individually generated and optimized Witcher section icons", async () => {
  assert.equal(new Set(theWitcher3.sections.map((section) => section.generatedIcon?.src)).size, 6);
  for (const section of theWitcher3.sections) {
    assert.match(section.generatedIcon?.src ?? "", /^\/atlas\/the-witcher-3\/section-icons-imagegen-v1\/\d{2}-/);
    assert.match(section.generatedIcon?.caption ?? "", /ImageGen/);
    const icon = await stat(new URL(`../public${section.generatedIcon.src}`, import.meta.url));
    assert.ok(icon.size > 2 * 1024 && icon.size < 256 * 1024);
  }
  const atlas = await stat(new URL("../assets/atlas-icon-sources/the-witcher-3-imagegen-v1.png", import.meta.url));
  assert.ok(atlas.size > 1024 * 1024);
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
  assert.match(skyrim.versionLabel, /aggiornamento 20 agosto 2026/);
  assert.equal(skyrim.updatedAt, "24 agosto 2026");
  const creationsBlock = skyrim.chapters.find((chapter) => chapter.id === "survival-creations")?.blocks.find((block) => block.label === "Creations e mod");
  assert.match(creationsBlock?.text ?? "", /15 GB/);
  assert.ok(creationsBlock?.tips?.some((tip) => /obiettivi o trofei/.test(tip)));
  assert.ok(skyrim.sources.some((source) => source.href === "https://elderscrolls.bethesda.net/en-US/news/skyrim-update-august-20"));
  assert.ok(skyrim.sources.every((source) => !source.href.includes("uesp.net")));
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
