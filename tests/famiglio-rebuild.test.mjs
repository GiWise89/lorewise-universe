import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import sharp from "sharp";
import {
  RITUAL_PHASE_DURATION_MS,
  STARTER_COLOR_OPTIONS,
  STARTER_EGGS,
  advanceRitual,
  beginHatching,
  cancelHatching,
  createRebuildState,
  customizeFamiliar,
  enterFamiliarHome,
  selectStarter,
} from "../lib/famiglioRebuild.ts";
import {
  DAILY_ROUTINE_REWARD_COINS,
  DAILY_WISH_REWARD_COINS,
  FAMILIAR_ITEM_CATALOG,
  FAMILIAR_MARKET_OFFERS,
  FAMILIAR_DEVICE_COVERS,
  FAMILIAR_REST_PRESETS,
  availableFamiliarDeviceCovers,
  availableFamiliarMarketOffers,
  availableSeasonalPremiumCovers,
  advanceFamiliarHome,
  createFamiliarHomeState,
  dailyRoutineProgress,
  familiarMood,
  growthProgress,
  performHomeAction,
  restoreFamiliarHome,
  applyFamiliarInventoryItem,
  equipFamiliarInventoryItem,
  grantFamiliarHomeMissionReward,
  purchaseFamiliarMarketOffer,
  purchaseFamiliarDeviceCover,
  equipFamiliarDeviceCover,
  exchangeNightMarketOffer,
  cureFamiliarHome,
} from "../lib/famiglioHome.ts";
import {
  FAMILIAR_BUNDLES,
  FAMILIAR_COLLECTION,
  FAMILIAR_PRICE_EUR_BY_RARITY,
  MERCHANT_ROOMS,
  NIGHT_MARKET_OFFERS,
  PREMIUM_COVERS,
  PREMIUM_COVER_PRICE_EUR,
  REQUIRED_COLLECTION_ACTIONS,
  availablePremiumCovers,
  familiarAnimatedPreview,
  nightMarketIsOpen,
} from "../lib/famiglioMarketExpansion.ts";
import { FAMILIAR_SPRITE_ROSTER, REQUIRED_FAMILIAR_ACTIONS } from "../lib/famiglioSpriteRoster.ts";
import {
  FAMILIAR_PERSONALITIES,
  autonomousBehaviorDuration,
  chooseAutonomousBehavior,
  chooseAutonomousDecision,
} from "../lib/famiglioAutonomy.ts";
import { FAMILIAR_HOUSE_VISUALS } from "../lib/famiglioHouseVisuals.ts";
import { FAMILIAR_MEAL_PROFILES, familiarMealAsset, familiarMealProgress } from "../lib/famiglioFoodProfiles.ts";
import { FAMILIAR_GUIDES } from "../lib/famiglioTutorial.ts";

test("meal consumption has three full cycles followed by a settling pose", () => {
  for (const elapsed of [-1, 0, 1_000, NaN]) {
    assert.deepEqual(familiarMealProgress(elapsed), { bites: 0, settling: false, finished: false });
  }
  assert.equal(familiarMealProgress(1_334).bites, 1);
  assert.equal(familiarMealProgress(2_667).bites, 2);
  assert.deepEqual(familiarMealProgress(4_000), { bites: 3, settling: true, finished: false });
  assert.equal(familiarMealProgress(4_799).finished, false);
  assert.deepEqual(familiarMealProgress(4_800), { bites: 3, settling: true, finished: true });
  assert.equal(familiarMealProgress(60_000).bites, 3);
});

test("feeding reserves travel time and clears the action from the arrival-based clock", () => {
  const home = createFamiliarHomeState(1_000);
  assert.equal(performHomeAction(home, "feed", 1_000).actionEndsAt, 7_000);
  const component = readFileSync(join(process.cwd(), "components", "FamiglioNexusRebuild.tsx"), "utf8");
  assert.match(component, /currentAction === "feed" && mealProgress.finished/);
  assert.match(component, /mealFinishedRef.current\(\)/);
  assert.match(component, /const displayFacing = spriteAction === "feed" \? -1/);
});

test("rest offers three real durations and keeps its room visible when complete", () => {
  assert.deepEqual(FAMILIAR_REST_PRESETS.map((preset) => [preset.name, preset.durationMs]), [
    ["Pisolino", 60_000],
    ["Riposo ristoratore", 900_000],
    ["Sonno profondo", 1_800_000],
  ]);
  const base = { ...createFamiliarHomeState(1_000), needs: { ...createFamiliarHomeState(1_000).needs, energy: 20 } };
  const deep = performHomeAction(base, "rest", 1_000, null, "deep");
  assert.equal(deep.actionEndsAt, 1_801_000);
  assert.ok(deep.needs.energy >= 62);
  const finished = advanceFamiliarHome(deep, 1_801_001);
  assert.equal(finished.activeAction, null);
  assert.equal(finished.roomAction, "rest");
});

test("home actions keep enough time for travel and the complete mobile animation", () => {
  const start = createFamiliarHomeState(1_000);
  assert.equal(performHomeAction(start, "play", 1_000).actionEndsAt, 9_500);
  assert.equal(performHomeAction(start, "clean", 1_000).actionEndsAt, 8_500);
  assert.equal(performHomeAction(start, "care", 1_000).actionEndsAt, 8_500);
});

test("neglect can cause deterministic illness and Nora medicine cures exactly once", () => {
  const base = createFamiliarHomeState(1_000);
  let sick = { ...base, needs: { ...base.needs, hygiene: 5, energy: 5 }, health: { status: "healthy", sickSince: null, lastCheckAt: 0 } };
  for (let index = 1; index <= 100 && sick.health.status !== "sick"; index += 1) {
    sick = advanceFamiliarHome({ ...sick, health: { ...sick.health, lastCheckAt: 0 } }, index * 6 * 60 * 60 * 1_000);
  }
  assert.equal(sick.health.status, "sick");
  const stocked = { ...sick, inventory: { ...sick.inventory, quantities: { ...sick.inventory.quantities, "comfort-balm": 2 } } };
  const cured = cureFamiliarHome(stocked, sick.lastUpdatedAt + 1);
  assert.equal(cured.health.status, "healthy");
  assert.equal(cured.activeAction, "care");
  assert.equal(cured.activeItemId, "comfort-balm");
  assert.equal(cured.actionEndsAt, sick.lastUpdatedAt + 7_501);
  assert.equal(cured.inventory.quantities["comfort-balm"], 1);
  assert.equal(cureFamiliarHome(cured, sick.lastUpdatedAt + 2).inventory.quantities["comfort-balm"], 1);
  assert.deepEqual(FAMILIAR_MARKET_OFFERS.filter((offer) => offer.itemId === "comfort-balm").map((offer) => offer.quantity), [1, 5]);
});

function pngDimensions(path) {
  const png = readFileSync(path);
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
}

test("the rebuild offers exactly the eight approved identifiable starters", () => {
  assert.deepEqual(STARTER_EGGS.map((egg) => egg.familiar), [
    "Gatto",
    "Golden Retriever",
    "Coniglio",
    "Volpe",
    "Tartaruga",
    "Pappagallo",
    "Panda",
    "Cavallo",
  ]);
  assert.equal(new Set(STARTER_EGGS.map((egg) => egg.color)).size, 8);
  assert.equal(new Set(STARTER_EGGS.map((egg) => egg.sigil)).size, 8);
});

test("the egg hatches automatically after three forty-second phases", () => {
  let state = beginHatching(selectStarter(createRebuildState(), "panda"));

  for (let phase = 0; phase < 3; phase += 1) {
    for (let second = 0; second < RITUAL_PHASE_DURATION_MS / 1000; second += 1) state = advanceRitual(state, 1000);
  }

  assert.equal(state.stage, "hatched");
  assert.equal(state.totalElapsedMs, 120_000);
  assert.deepEqual(state.unlockedIds, ["panda"]);
});

test("the ritual can return to confirmation without losing prepared identity", () => {
  let state = beginHatching(selectStarter(createRebuildState(), "cat"));
  state = customizeFamiliar(state, { familiarName: "Luna", familiarSex: "female", colorVariant: "black" });
  state = advanceRitual(state, 10_000);
  state = cancelHatching(state);
  assert.equal(state.stage, "confirming");
  assert.equal(state.totalElapsedMs, 0);
  assert.equal(state.familiarName, "Luna");
  assert.equal(state.colorVariant, "black");
});

test("the egg does not hatch before the full two minutes", () => {
  let state = beginHatching(selectStarter(createRebuildState(), "cat"));
  for (let second = 0; second < 119; second += 1) state = advanceRitual(state, 1000);
  assert.equal(state.stage, "hatching");
  state = advanceRitual(state, 1000);
  assert.equal(state.stage, "hatched");
});

test("name, sex and real color variants can be prepared during hatching", () => {
  let state = beginHatching(selectStarter(createRebuildState(), "cat"));
  state = customizeFamiliar(state, { familiarName: "Luna", familiarSex: "female", colorVariant: "siamese" });
  assert.equal(state.familiarName, "Luna");
  assert.equal(state.familiarSex, "female");
  assert.equal(state.colorVariant, "siamese");
  assert.equal(STARTER_COLOR_OPTIONS.cat.length, 4);
  assert.equal(STARTER_COLOR_OPTIONS.rabbit.length, 3);
  assert.equal(STARTER_COLOR_OPTIONS.parrot.length, 5);
});

test("the new route is isolated from the previous Famiglio component", () => {
  const page = readFileSync(join(process.cwd(), "app", "famiglio", "page.tsx"), "utf8");
  const rootLayout = readFileSync(join(process.cwd(), "app", "layout.tsx"), "utf8");
  assert.match(page, /FamiglioNexusRebuild/);
  assert.doesNotMatch(page, /NexusFamiliarExperience|NexusFamiliarLegacy/);
  assert.doesNotMatch(rootLayout, /NexusFamiliarCompanion/);
});

test("all rebuild motion is Canvas-driven and its CSS contains no animation system", () => {
  const component = readFileSync(join(process.cwd(), "components", "FamiglioNexusRebuild.tsx"), "utf8");
  const css = readFileSync(join(process.cwd(), "components", "FamiglioNexusRebuild.module.css"), "utf8");
  assert.match(component, /<canvas/);
  assert.match(component, /requestAnimationFrame/);
  assert.match(component, /while \(accumulator >= FIXED_STEP_MS\)/);
  assert.doesNotMatch(css, /@keyframes|\banimation\s*:|\btransition\s*:/i);
});

test("the hatching ritual scrolls a generated pixel-art panorama in Canvas", () => {
  const component = readFileSync(join(process.cwd(), "components", "FamiglioNexusRebuild.tsx"), "utf8");
  const panorama = statSync(join(process.cwd(), "public", "famiglio", "rebuild", "ritual-sky-panorama-v1.png"));
  assert.match(component, /ritual-sky-panorama-v1\.png/);
  assert.match(component, /context\.drawImage\(ritualSky/);
  assert.doesNotMatch(component, /function drawScrollingRitualSky/);
  assert.ok(panorama.size > 1_000_000);
});

test("the generated panorama also backgrounds confirmation and birth", () => {
  const component = readFileSync(join(process.cwd(), "components", "FamiglioNexusRebuild.tsx"), "utf8");
  assert.match(component, /if \(ritualSky\)/);
  assert.match(component, /current\.stage === "hatched" \? \.72/);
  assert.doesNotMatch(component, /if \(active && ritualSky\)/);
});

test("the ritual egg keeps a slow weighted movement", () => {
  const component = readFileSync(join(process.cwd(), "components", "FamiglioNexusRebuild.tsx"), "utf8");
  assert.match(component, /simulationTime \/ 320/);
  assert.match(component, /current\.ritualPhaseIndex === 0 \? 430 : 520/);
  assert.match(component, /active \? 460 : 300/);
});

test("the rebuild renders the purchased egg sprite sheet instead of placeholder eggs", () => {
  const component = readFileSync(join(process.cwd(), "components", "FamiglioNexusRebuild.tsx"), "utf8");
  const spriteSheet = statSync(join(process.cwd(), "public", "famiglio", "rebuild", "egg-sprite-sheet.png"));
  assert.match(component, /egg-sprite-sheet\.png/);
  assert.match(component, /drawImage\(/);
  assert.doesNotMatch(component, /bezierCurveTo/);
  assert.ok(spriteSheet.size > 1_000_000);
});

test("every starter has a real idle sprite for the birth reveal", () => {
  for (const egg of STARTER_EGGS) {
    const sprite = statSync(join(process.cwd(), "public", "famiglio", "rebuild", "starters", egg.id, "idle.png"));
    assert.ok(sprite.size > 400, `${egg.familiar} must have a non-empty idle sprite`);
  }
});

test("opening an egg reveals the real familiar preview before the ritual", () => {
  const component = readFileSync(join(process.cwd(), "components", "FamiglioNexusRebuild.tsx"), "utf8");
  assert.match(component, /state\.stage === "confirming"[\s\S]*<FamiliarPreview egg=\{selectedEgg\}/);
  assert.match(component, /Forma custodita/);
  assert.match(component, /Anteprima animata/);
});

test("device controls navigate eggs and expose a working back action", () => {
  const component = readFileSync(join(process.cwd(), "components", "FamiglioNexusRebuild.tsx"), "utf8");
  assert.match(component, /moveDeviceSelection\(-1\)/);
  assert.match(component, /moveDeviceSelection\(1\)/);
  assert.match(component, /activateDeviceSelection/);
  assert.match(component, /← Indietro/);
  assert.match(component, /cancelHatching/);
});

test("real color choices include visible palette previews", () => {
  const component = readFileSync(join(process.cwd(), "components", "FamiglioNexusRebuild.tsx"), "utf8");
  assert.match(component, /colorPreview/);
  for (const species of ["cat", "rabbit", "parrot"]) {
    assert.ok(STARTER_COLOR_OPTIONS[species].every((option) => option.colors.length >= 1));
  }
});

test("the generated Nexus Pet emblem is integrated as the device mark", () => {
  const component = readFileSync(join(process.cwd(), "components", "FamiglioNexusRebuild.tsx"), "utf8");
  const css = readFileSync(join(process.cwd(), "components", "FamiglioNexusRebuild.module.css"), "utf8");
  const iconPath = join(process.cwd(), "public", "famiglio", "rebuild", "nexus-pet-emblem-v2.png");
  assert.match(component, /aria-label="Emblema Nexus Pet"/);
  assert.match(css, /nexus-pet-emblem-v2\.png/);
  assert.deepEqual(pngDimensions(iconPath), { width: 128, height: 128 });
});

test("egg selection uses simple light and relief without rings or decorative sigils", () => {
  const css = readFileSync(join(process.cwd(), "components", "FamiglioNexusRebuild.module.css"), "utf8");
  assert.match(css, /\.eggChoiceActive \.miniEgg[\s\S]*drop-shadow/);
  assert.doesNotMatch(css, /VINCOLO ATTIVO|clip-path:\s*polygon/);
  assert.doesNotMatch(css, /\.eggChoiceActive\s*\{[\s\S]*?border-color:\s*var\(--screen-dark\)/);
});

test("starter name and egg type are rendered as readable plaques", () => {
  const css = readFileSync(join(process.cwd(), "components", "FamiglioNexusRebuild.module.css"), "utf8");
  assert.match(css, /\.eggChoice strong[\s\S]*font-size:\s*\.9rem/);
  assert.match(css, /\.eggChoice span[\s\S]*font-size:\s*\.74rem/);
});

test("every starter has idle, walk, sleep and care sprite sequences", () => {
  for (const egg of STARTER_EGGS) {
    const spriteSet = FAMILIAR_SPRITE_ROSTER[egg.id];
    for (const action of REQUIRED_FAMILIAR_ACTIONS) {
      const sequence = spriteSet.actions[action];
      const assetPath = join(process.cwd(), "public", ...sequence.src.split("/").filter(Boolean));
      const dimensions = pngDimensions(assetPath);
      assert.equal(dimensions.width, sequence.frameWidth * sequence.frames, `${egg.familiar}: ${action} width`);
      assert.equal(dimensions.height, sequence.frameHeight, `${egg.familiar}: ${action} height`);
      assert.ok(statSync(assetPath).size > 200, `${egg.familiar}: ${action} must not be empty`);
    }
  }
  assert.equal(FAMILIAR_SPRITE_ROSTER.panda.actions.walk.origin, "generated");
  assert.equal(FAMILIAR_SPRITE_ROSTER.horse.actions.walk.origin, "generated");
});

test("birth enters the persistent familiar home without skipping the reveal", () => {
  const hatched = { ...selectStarter(createRebuildState(), "cat"), stage: "hatched", unlockedIds: ["cat"] };
  assert.equal(enterFamiliarHome(hatched).stage, "home");
  assert.equal(enterFamiliarHome(createRebuildState()).stage, "choosing");
});

test("home actions improve the correct needs and rest restores energy over time", () => {
  const initial = createFamiliarHomeState(1_000);
  const fed = performHomeAction(initial, "feed", 1_000);
  assert.ok(fed.needs.hunger > initial.needs.hunger);
  assert.equal(fed.roomAction, "feed");
  const resting = performHomeAction(initial, "rest", 1_000);
  const advanced = advanceFamiliarHome(resting, 11_000);
  assert.ok(advanced.needs.energy > resting.needs.energy);
  assert.equal(advanced.roomAction, "rest");
});

test("the familiar naturally soils the room and Pulisci removes the waste", () => {
  const initial = {
    ...createFamiliarHomeState(1_000),
    toilet: { urgency: 99, wasteCount: 0, lastEventAt: null },
  };
  const afterOneHour = advanceFamiliarHome(initial, 3_601_000);
  assert.equal(afterOneHour.toilet.wasteCount, 1);
  assert.ok(afterOneHour.toilet.urgency < 30);
  assert.ok(afterOneHour.needs.hygiene < initial.needs.hygiene);
  assert.match(afterOneHour.lastOutcome, /fatto i bisogni/i);

  const cleaned = performHomeAction(afterOneHour, "clean", 3_601_001);
  assert.equal(cleaned.toilet.wasteCount, 0);
  assert.match(cleaned.lastOutcome, /pulito i bisogni/i);
});

test("pending bathroom waste never interrupts another home action", () => {
  const component = readFileSync(join(process.cwd(), "components", "FamiglioNexusRebuild.tsx"), "utf8");
  assert.match(component, /room=\{homeState\.roomAction\}/);
  assert.doesNotMatch(component, /room=\{homeState\.toilet\.wasteCount > 0 \? "clean"/);
});

test("natural waste stays in the bathroom, uses generated animation and makes Pulisci blink", async () => {
  const component = readFileSync(join(process.cwd(), "components", "FamiglioNexusRebuild.tsx"), "utf8");
  const css = readFileSync(join(process.cwd(), "components", "FamiglioNexusRebuild.module.css"), "utf8");
  const asset = join(process.cwd(), "public", "famiglio", "rebuild", "effects", "cute-toilet-waste-v1.png");
  const metadata = await sharp(asset).metadata();
  assert.deepEqual({ width: metadata.width, height: metadata.height, alpha: metadata.hasAlpha }, { width: 512, height: 128, alpha: true });
  assert.match(component, /room=\{homeState\.roomAction\}/);
  assert.match(component, /cute-toilet-waste-v1\.png/);
  assert.match(component, /data-alert-phase/);
  assert.match(css, /@media \(max-width: 620px\)[\s\S]*?\.homeActionWasteAlert\[data-alert-phase="1"\]/);
  assert.doesNotMatch(component, />Da pulire<\/small>/);
});

test("home persistence restores bounded needs and clears stale actions", () => {
  const restored = restoreFamiliarHome({
    needs: { hunger: 140, energy: -20, happiness: 65, hygiene: 72, affection: 81 },
    activeAction: "play",
    actionEndsAt: 2_000,
    lastUpdatedAt: 1_000,
  }, 3_000);
  assert.ok(restored.needs.hunger <= 100);
  assert.ok(restored.needs.energy >= 0);
  assert.equal(restored.activeAction, null);
  assert.equal(restored.activeItemId, null);
});

test("the shared home scene keeps each action paired with its own object", () => {
  const component = readFileSync(join(process.cwd(), "components", "FamiglioNexusRebuild.tsx"), "utf8");
  assert.match(component, /requestedItem\?\.action === currentAction/);
  assert.match(component, /currentAction === "play"\s*\? "blue-ball"/);
  assert.match(component, /now - sceneOpenedAtRef\.current >= 4_000/);
});

test("the home uses twenty regular rooms and five generated 03:00 variants", async () => {
  const component = readFileSync(join(process.cwd(), "components", "FamiglioNexusRebuild.tsx"), "utf8");
  for (const room of ["home", "feed", "clean", "play", "rest"]) {
    for (const phase of ["morning", "afternoon", "evening", "night"]) {
      const metadata = await sharp(join(process.cwd(), "public", "famiglio", "rebuild", "rooms", `${room}-${phase}.webp`)).metadata();
      assert.deepEqual({ width: metadata.width, height: metadata.height }, { width: 512, height: 288 }, `${room}-${phase}`);
      const stats = await sharp(join(process.cwd(), "public", "famiglio", "rebuild", "rooms", `${room}-${phase}.webp`)).stats();
      assert.equal(stats.isOpaque, true, `${room}-${phase} must decode completely without truncated pixels`);
    }
  }
  for (const room of ["home", "feed", "clean", "play", "rest"]) {
    const metadata = await sharp(join(process.cwd(), "public", "famiglio", "rebuild", "rooms", `${room}-witching.webp`)).metadata();
    assert.deepEqual({ width: metadata.width, height: metadata.height }, { width: 512, height: 288 }, `${room}-witching`);
    const stats = await sharp(join(process.cwd(), "public", "famiglio", "rebuild", "rooms", `${room}-witching.webp`)).stats();
    assert.equal(stats.isOpaque, true, `${room}-witching must decode completely without truncated pixels`);
  }
  assert.match(component, /HOME_DAY_PHASES/);
  assert.match(component, /\$\{room\}-\$\{phase\}\.webp/);
  assert.match(component, /isWitchingHalfHour\(date\)/);
  assert.match(component, /date\.getHours\(\) === 3 && date\.getMinutes\(\) < 30/);
  assert.match(component, /assets\[`\$\{roomId\}-witching`\]/);
  assert.doesNotMatch(component, /drawRoomDayLighting/);
  assert.match(component, /drawInventoryObject/);
  assert.match(component, /displayedItemId/);
  assert.doesNotMatch(component, /nexus-sanctuary-v1/);
});

test("generated market objects have real transparent padding instead of square backgrounds", async () => {
  const ids = ["energy-biscuit", "comfort-balm", "magic-feather", "crystal-orb", "moon-compass", "sigil-pouch", "phoenix-feather", "memory-crown", "runic-tablet", "soul-gem", "memory-hourglass"];
  for (const id of ids) {
    const asset = join(process.cwd(), "public", "famiglio", "rebuild", "market", "items", `${id}-transparent.png`);
    const { data, info } = await sharp(asset).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    assert.deepEqual({ width: info.width, height: info.height }, { width: 96, height: 96 });
    const cornerAlpha = [3, (info.width - 1) * 4 + 3, (info.height - 1) * info.width * 4 + 3, (info.width * info.height - 1) * 4 + 3].map((offset) => data[offset]);
    assert.deepEqual(cornerAlpha, [0, 0, 0, 0], `${id} must not retain a background panel`);
  }
});

test("the starter inventory and unlocked Mirra accessories use verified transparent pixel assets", async () => {
  assert.equal(FAMILIAR_ITEM_CATALOG.length, 28);
  assert.deepEqual(new Set(FAMILIAR_ITEM_CATALOG.map((item) => item.action)), new Set(["feed", "play", "clean", "care", "rest"]));
  const expectedDimensions = {
    "moon-meal": { width: 16, height: 16 },
    "blue-ball": { width: 20, height: 16 },
    "mission-ball": { width: 20, height: 16 },
    "cleansing-tonic": { width: 32, height: 32 },
    "bond-lantern": { width: 32, height: 32 },
    "purple-bed": { width: 50, height: 28 },
    "arcane-gramophone": { width: 64, height: 64 },
    "prism-lantern": { width: 32, height: 32 },
    "energy-biscuit": { width: 96, height: 96 },
    "comfort-balm": { width: 64, height: 64 },
    "magic-feather": { width: 96, height: 96 },
    "crystal-orb": { width: 96, height: 96 },
  };
  for (const item of FAMILIAR_ITEM_CATALOG) {
    const assetPath = join(process.cwd(), "public", ...item.assetSrc.split("/").filter(Boolean));
    assert.ok(statSync(assetPath).size > 0, `${item.name} must use a real asset`);
    const dimensions = pngDimensions(assetPath);
    assert.ok(dimensions.width > 0 && dimensions.height > 0, `${item.name} must have measurable artwork`);
    if (expectedDimensions[item.id]) assert.deepEqual(dimensions, expectedDimensions[item.id]);
    const { data, info } = await sharp(assetPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const cornerAlpha = [3, (info.width - 1) * 4 + 3, (info.height - 1) * info.width * 4 + 3, (info.width * info.height - 1) * 4 + 3].map((offset) => data[offset]);
    const transparentPixels = data.filter((_, offset) => offset % 4 === 3 && data[offset] === 0).length;
    assert.ok(cornerAlpha.some((alpha) => alpha === 0), `${item.name} must expose transparent corners`);
    assert.ok(transparentPixels / (info.width * info.height) >= .01, `${item.name} must not draw a square background in the room`);
  }
  for (const asset of ["moon-meal-dog.png", "moon-meal-herbivore.png", "moon-meal-seeds.png", "moon-meal-bamboo.png"]) {
    assert.ok(statSync(join(process.cwd(), "public", "famiglio", "rebuild", "inventory", asset)).size > 0);
  }
  const animatedMirra = FAMILIAR_ITEM_CATALOG.filter((item) => item.animationSrc?.includes("/market/mirra/"));
  assert.equal(animatedMirra.length, 8);
  for (const item of animatedMirra) {
    const sheetPath = join(process.cwd(), "public", ...item.animationSrc.split("/").filter(Boolean));
    assert.deepEqual(pngDimensions(sheetPath), { width: 256, height: 64 }, `${item.name} must contain four 64px animation frames`);
  }
});

test("inventory items apply bonuses and empty food or hygiene supplies block their actions", () => {
  const initial = createFamiliarHomeState(1_000);
  const meal = applyFamiliarInventoryItem({ ...initial, needs: { ...initial.needs, hunger: 20 } }, "moon-meal", 2_000);
  assert.equal(meal.inventory.quantities["moon-meal"], 3);
  assert.equal(meal.inventory.totalItemsUsed, 1);
  assert.equal(meal.activeItemId, "moon-meal");
  assert.ok(meal.needs.hunger >= 56);

  const ball = applyFamiliarInventoryItem(initial, "blue-ball", 2_000);
  assert.equal(ball.inventory.quantities["blue-ball"], 1);
  assert.equal(ball.activeItemId, "blue-ball");

  const empty = {
    ...initial,
    inventory: { ...initial.inventory, quantities: { ...initial.inventory.quantities, "moon-meal": 0 } },
  };
  const rejected = applyFamiliarInventoryItem(empty, "moon-meal", 2_000);
  assert.equal(rejected.activeAction, null);
  assert.match(rejected.lastOutcome, /rifornisciti al Mercato/i);
  assert.equal(performHomeAction(rejected, "feed", 3_000).activeAction, null);
});

test("permanent Mirra items can be equipped and persist across restore", () => {
  const base = createFamiliarHomeState(1_000);
  const purchased = {
    ...base,
    inventory: {
      ...base.inventory,
      quantities: { ...base.inventory.quantities, "comet-ball": 1 },
    },
  };
  const equipped = equipFamiliarInventoryItem(purchased, "comet-ball");
  assert.equal(equipped.equippedItems.play, "comet-ball");
  assert.match(equipped.lastOutcome, /selezionato/i);
  assert.equal(restoreFamiliarHome(equipped, 1_000).equippedItems.play, "comet-ball");
  assert.equal(equipFamiliarInventoryItem(base, "comet-ball").equippedItems.play, "blue-ball");
});

test("home actions cannot overlap, cool down only the repeated action and respect energy and stock", () => {
  const first = performHomeAction(createFamiliarHomeState(1_000), "care", 1_000);
  const busy = performHomeAction(first, "play", 2_000);
  assert.equal(busy.activeAction, "care");
  assert.equal(busy.growth.bondXp, first.growth.bondXp);
  assert.equal(restoreFamiliarHome(first, 2_000).activeAction, "care");

  const second = performHomeAction(first, "care", 9_000);
  assert.equal(second.actionBurstCount, 2);
  assert.equal(second.actionCooldowns.care, 136_500);
  const repeatedBlocked = performHomeAction(second, "care", 17_000);
  assert.equal(repeatedBlocked.activeAction, null);
  assert.match(repeatedBlocked.lastOutcome, /ripetuto/i);
  const otherAction = performHomeAction(second, "rest", 17_000);
  assert.equal(otherAction.activeAction, "rest");
  assert.equal(performHomeAction(repeatedBlocked, "care", 136_501).activeAction, "care");

  const lowEnergy = { ...createFamiliarHomeState(20_000), needs: { ...createFamiliarHomeState(20_000).needs, energy: 4 } };
  assert.equal(performHomeAction(lowEnergy, "play", 20_000).activeAction, null);
  assert.equal(performHomeAction(lowEnergy, "clean", 20_000).activeAction, null);
  assert.equal(performHomeAction(lowEnergy, "care", 20_000).activeAction, "care");
  assert.equal(performHomeAction(lowEnergy, "rest", 20_000).activeAction, "rest");

  const noSupplies = {
    ...createFamiliarHomeState(30_000),
    inventory: {
      ...createFamiliarHomeState(30_000).inventory,
      quantities: { ...createFamiliarHomeState(30_000).inventory.quantities, "moon-meal": 0, "energy-biscuit": 0, "cleansing-tonic": 0 },
    },
  };
  assert.equal(performHomeAction(noSupplies, "feed", 30_000).activeAction, null);
  assert.equal(performHomeAction(noSupplies, "clean", 30_000).activeAction, null);
});

test("daily home XP stops at its cap without blocking need recovery", () => {
  let state = createFamiliarHomeState(new Date(2026, 8, 6, 8).getTime());
  state = { ...state, actionXpEarned: 39, needs: { ...state.needs, happiness: 10 } };
  const used = performHomeAction(state, "play", new Date(2026, 8, 6, 8, 1).getTime());
  assert.equal(used.actionXpEarned, 40);
  assert.equal(used.growth.bondXp, 1);
  assert.ok(used.needs.happiness > 10);
  const nextDay = advanceFamiliarHome(used, new Date(2026, 8, 7, 8).getTime());
  assert.equal(nextDay.actionXpEarned, 0);
});

test("every Nora, Mirra and Night Market product has a working backpack action", () => {
  const base = createFamiliarHomeState(1_000);
  const soldItemIds = [...FAMILIAR_MARKET_OFFERS.map((offer) => offer.itemId), ...NIGHT_MARKET_OFFERS.map((offer) => offer.itemId)];
  for (const itemId of soldItemIds) {
    const item = FAMILIAR_ITEM_CATALOG.find((candidate) => candidate.id === itemId);
    assert.ok(item, `${itemId} must exist in the functional inventory catalog`);
    const stocked = {
      ...base,
      inventory: { ...base.inventory, quantities: { ...base.inventory.quantities, [itemId]: 2 } },
    };
    const used = applyFamiliarInventoryItem(stocked, itemId, 2_000);
    assert.equal(used.activeItemId, itemId);
    if (NIGHT_MARKET_OFFERS.some((offer) => offer.itemId === itemId)) {
      assert.equal(used.wallet.equippedNightRelicId, itemId);
      assert.equal(used.roomAction, null);
    } else {
      assert.equal(used.roomAction, item.action);
    }
    assert.notEqual(used.lastOutcome, stocked.lastOutcome);
  }
});

test("every cat color keeps the selected identity and scale across home actions", () => {
  const component = readFileSync(join(process.cwd(), "components", "FamiglioNexusRebuild.tsx"), "utf8");
  for (const variant of ["grey", "black", "brown", "siamese"]) {
    for (const action of ["idle", "walk", "feed", "play", "clean", "care", "sleep", "sleep-calm", "sit", "groom"]) {
      const suffix = `${action}-${variant}.png`;
      const dimensions = pngDimensions(join(process.cwd(), "public", "famiglio", "rebuild", "starters", "cat", suffix));
      assert.equal(dimensions.height, 32, `${variant} ${action} must use the same 32px cat family`);
      assert.equal(dimensions.width % 32, 0, `${variant} ${action} must have complete frames`);
    }
  }
  assert.match(component, /\$\{action\}-\$\{catVariant\}\.png/);
  assert.equal(FAMILIAR_SPRITE_ROSTER.cat.actions.feed.frames, 8);
  assert.equal(FAMILIAR_SPRITE_ROSTER.cat.actions.play.frames, 13);
  assert.equal(FAMILIAR_SPRITE_ROSTER.cat.actions.clean.frames, 3);
  assert.equal(FAMILIAR_SPRITE_ROSTER.cat.actions.care.frames, 14);
  assert.equal(FAMILIAR_SPRITE_ROSTER.cat.actions.sit.frames, 3);
  assert.equal(FAMILIAR_SPRITE_ROSTER.cat.actions.groom.frames, 18);
  assert.equal(FAMILIAR_SPRITE_ROSTER.cat.actions["sleep-calm"].frames, 3);
});

test("starter colors take precedence over generic collection sprites in the House", () => {
  const component = readFileSync(join(process.cwd(), "components", "FamiglioNexusRebuild.tsx"), "utf8");
  assert.match(component, /const starterIsActive = STARTER_EGGS\.some/);
  assert.match(component, /const activeCollectionFamiliar = starterIsActive\s*\? null\s*:\s*testCollectionFamiliar \?\? FAMILIAR_COLLECTION\.find/);
  assert.match(component, /colorVariant=\{state\.colorVariant\}/);
  assert.match(component, /previewParams\.get\("color"\)/);
});

test("the device header shows every spendable Famiglio currency with its own icon", () => {
  const component = readFileSync(join(process.cwd(), "components", "FamiglioNexusRebuild.tsx"), "utf8");
  const css = readFileSync(join(process.cwd(), "components", "FamiglioNexusRebuild.module.css"), "utf8");
  assert.match(component, /className=\{styles\.walletStrip\}/);
  assert.match(component, /className=\{styles\.walletTrigger\}/);
  assert.match(component, /id="famiglio-wallet-popover"/);
  assert.match(component, /aria-expanded=\{walletOpen\}/);
  assert.match(component, /homeState\.wallet\.nexusCoins/);
  assert.match(component, /homeState\.wallet\.nightSigils/);
  assert.match(component, /homeState\.wallet\.relicFragments/);
  assert.match(css, /\.walletStrip\s*\{\s*display:\s*none !important;/);
  assert.match(css, /\.walletPopover\s*\{[\s\S]*?position:\s*absolute;/);
});

test("the four device header controls use dedicated transparent artwork", async () => {
  const component = readFileSync(join(process.cwd(), "components", "FamiglioNexusRebuild.tsx"), "utf8");
  const guide = readFileSync(join(process.cwd(), "components", "FamiglioGuideOverlay.module.css"), "utf8");
  const names = ["header-wallet-v1.png", "header-houses-v1.png", "header-guide-v1.png", "header-exit-v1.png"];
  for (const name of names) {
    const asset = join(process.cwd(), "public", "famiglio", "rebuild", "header-controls", name);
    const metadata = await sharp(asset).metadata();
    const alpha = await sharp(asset).ensureAlpha().extractChannel(3).stats();
    assert.equal(metadata.width, 128, `${name} width`);
    assert.equal(metadata.height, 128, `${name} height`);
    assert.equal(metadata.hasAlpha, true, `${name} alpha`);
    assert.equal(alpha.channels[0].min, 0, `${name} transparent background`);
  }
  assert.match(component, /HEADER_CONTROL_ICONS\.wallet/);
  assert.match(component, /HEADER_CONTROL_ICONS\.houses/);
  assert.match(component, /HEADER_CONTROL_ICONS\.exit/);
  assert.match(guide, /header-guide-v1\.png/);
});

test("mobile ritual choices keep gender and colour controls in ordered full-width rows", () => {
  const component = readFileSync(join(process.cwd(), "components", "FamiglioNexusRebuild.tsx"), "utf8");
  const css = readFileSync(join(process.cwd(), "components", "FamiglioNexusRebuild.module.css"), "utf8");
  assert.match(component, /data-choice="sex"/);
  assert.match(component, /data-choice="color"/);
  assert.match(css, /\.choiceField\[data-choice="sex"\],[\s\S]*grid-column: 1 \/ -1/);
  assert.match(css, /data-choice="sex"\][\s\S]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(css, /overflow-wrap: anywhere/);
});

test("every Famiglio sleep pose uses its body component to stay centred on its bed", () => {
  const component = readFileSync(join(process.cwd(), "components", "FamiglioNexusRebuild.tsx"), "utf8");
  assert.match(component, /HOUSE_BED_CUSHION_CENTER_OFFSET = \.52/);
  assert.match(component, /groundY - petSize \* \(HOUSE_SLEEP_SURFACE_OFFSETS\[restItemId\]/);
  assert.match(component, /if \(area > largest\.area\)/);
  assert.match(component, /spriteDrawX/);
  assert.match(component, /HOME_ACTION_TARGETS[\s\S]*?rest: \.58/);
  assert.match(component, /HOME_OBJECT_ANCHORS[\s\S]*?rest: \.58/);
});

test("care buttons show a live numeric timer without repeating waiting labels", () => {
  const component = readFileSync(join(process.cwd(), "components", "FamiglioNexusRebuild.tsx"), "utf8");
  assert.match(component, /data-timer=\{availability\.code === "cooldown"/);
  assert.doesNotMatch(component, /: "In attesa"/);
  assert.doesNotMatch(component, /`Attendi \$\{homeActionWaitLabel/);
  assert.doesNotMatch(component, /`In corso \$\{homeActionWaitLabel/);
});

test("Iris shows four covers per page on desktop and two on mobile", () => {
  const component = readFileSync(join(process.cwd(), "components", "FamiglioNexusRebuild.tsx"), "utf8");
  assert.match(component, /const coversPerPage = compactFamiliarCatalog \? 2 : 4/);
  assert.match(component, /covers\.slice\(currentPage \* coversPerPage, currentPage \* coversPerPage \+ coversPerPage\)/);
});

test("alternate starter colours preserve the exact original silhouette in every action", async () => {
  const variants = {
    cat: ["grey", "black", "brown", "siamese"],
    rabbit: ["white", "brown", "black"],
    parrot: ["blue", "red", "green", "silver", "violet"],
  };
  for (const [species, colours] of Object.entries(variants)) {
    const directory = join(process.cwd(), "public", "famiglio", "rebuild", "starters", species);
    for (const action of REQUIRED_FAMILIAR_ACTIONS) {
      const originalAlpha = await sharp(join(directory, `${action}.png`)).ensureAlpha().extractChannel(3).raw().toBuffer();
      for (const colour of colours) {
        const variantAlpha = await sharp(join(directory, `${action}-${colour}.png`)).ensureAlpha().extractChannel(3).raw().toBuffer();
        assert.deepEqual(variantAlpha, originalAlpha, `${species}/${colour}/${action} changed the original animal shape`);
      }
    }
  }
});

test("home interaction speeds keep play lively while sleep remains calm", () => {
  const component = readFileSync(join(process.cwd(), "components", "FamiglioNexusRebuild.tsx"), "utf8");
  assert.match(component, /play: 7/);
  assert.match(component, /walk: 6/);
  assert.match(component, /sleep: 2/);
  assert.match(component, /"sleep-calm": 2/);
});

test("local previews keep the night market open for complete testing", () => {
  const component = readFileSync(join(process.cwd(), "components", "FamiglioNexusRebuild.tsx"), "utf8");
  assert.match(component, /const nightMarketOpen = localHouseTrial \|\| allTestMode \|\| nightMarketIsOpen/);
});

test("rabbit and parrot keep every purchased color during every home action", () => {
  const variants = {
    rabbit: ["white", "brown", "black"],
    parrot: ["blue", "red", "green", "silver", "violet"],
  };
  for (const [species, colors] of Object.entries(variants)) {
    const frameSize = FAMILIAR_SPRITE_ROSTER[species].actions.idle.frameWidth;
    for (const color of colors) {
      for (const action of REQUIRED_FAMILIAR_ACTIONS) {
        const dimensions = pngDimensions(join(process.cwd(), "public", "famiglio", "rebuild", "starters", species, `${action}-${color}.png`));
        assert.equal(dimensions.height, frameSize, `${species} ${color} ${action} height`);
        assert.equal(dimensions.width, frameSize * FAMILIAR_SPRITE_ROSTER[species].actions[action].frames, `${species} ${color} ${action} width`);
      }
    }
  }
});

test("the Tamagotchi core tracks mood, routine, consequences and growth", () => {
  let home = createFamiliarHomeState(1_000);
  assert.equal(familiarMood(home.needs), "content");
  for (const action of ["feed", "play", "clean", "care", "rest"]) {
    home = performHomeAction(home, action, home.lastUpdatedAt + 180_001);
  }
  assert.equal(home.routine.completedActions.length, 5);
  assert.equal(dailyRoutineProgress(home.routine), 100);
  assert.ok(home.growth.bondXp > 0);
  assert.ok(growthProgress(home.growth) > 0);
  const overfed = performHomeAction({ ...home, needs: { ...home.needs, hunger: 100 } }, "feed", home.lastUpdatedAt + 180_001);
  assert.match(overfed.lastOutcome, /già sazio/);
  assert.ok(overfed.needs.happiness < home.needs.happiness);
  const exhausted = performHomeAction({ ...home, needs: { ...home.needs, energy: 4 } }, "play", home.lastUpdatedAt + 180_001);
  assert.match(exhausted.lastOutcome, /punti Energia/);
});

test("old home saves migrate to the persistent Tamagotchi model", () => {
  const migrated = restoreFamiliarHome({
    needs: { hunger: 70, energy: 60, happiness: 50, hygiene: 40, affection: 30 },
    lastUpdatedAt: 1_000,
  }, 2_000);
  assert.equal(migrated.growth.stage, "cucciolo");
  assert.deepEqual(migrated.routine.completedActions, []);
  assert.equal(typeof migrated.lastOutcome, "string");
  assert.equal(migrated.wallet.nexusCoins, 0);
  assert.ok(migrated.diary.length >= 1);
});

test("the daily wish stays stable, rewards its real action once and enters the diary", () => {
  const start = new Date(2026, 8, 3, 10, 0).getTime();
  let home = createFamiliarHomeState(start);
  const wishAction = home.wish.action;
  assert.equal(createFamiliarHomeState(start + 3_600_000).wish.action, wishAction);
  home = performHomeAction(home, wishAction, start + 1_000);
  assert.equal(home.wallet.nexusCoins, DAILY_WISH_REWARD_COINS);
  assert.ok(home.wish.fulfilledAt);
  assert.equal(home.diary.filter((entry) => entry.kind === "wish").length, 1);
  home = performHomeAction(home, wishAction, start + 8_000);
  assert.equal(home.wallet.nexusCoins, DAILY_WISH_REWARD_COINS);
  assert.equal(home.diary.filter((entry) => entry.kind === "wish").length, 1);
});

test("a complete care day grants one routine reward and growth milestones become memories", () => {
  const start = new Date(2026, 8, 3, 10, 0).getTime();
  let home = { ...createFamiliarHomeState(start), growth: { bondXp: 870, stage: "cucciolo", careStreak: 0 } };
  for (const action of ["feed", "play", "clean", "care", "rest"]) {
    home = performHomeAction(home, action, home.lastUpdatedAt + 180_001);
  }
  assert.equal(home.wallet.nexusCoins, DAILY_WISH_REWARD_COINS + DAILY_ROUTINE_REWARD_COINS);
  assert.equal(home.diary.filter((entry) => entry.kind === "routine").length, 1);
  assert.equal(home.growth.stage, "giovane");
  assert.equal(home.diary.filter((entry) => entry.kind === "growth").length, 1);
});

test("the home exposes the daily wish, earned wallet and a dedicated diary screen", () => {
  const component = readFileSync(join(process.cwd(), "components", "FamiglioNexusRebuild.tsx"), "utf8");
  assert.match(component, /Desiderio di oggi/);
  assert.match(component, /Apri diario/);
  assert.match(component, /Diario di \{familiarDisplayName\}/);
  assert.match(component, /homeState\.wallet\.nexusCoins/);
  assert.match(component, /visibleDiaryEntries\.map/);
  assert.match(component, /DIARY_PAGE_SIZE/);
  assert.match(component, /item\.id === homeState\.wish\.action/);
});

test("mission rewards update the new home wallet, bond and diary exactly once per claim", () => {
  const start = createFamiliarHomeState(1_000);
  const rewarded = grantFamiliarHomeMissionReward(start, { title: "Passeggiata in galleria", coins: 6, experience: 15 }, 2_000);
  assert.equal(rewarded.wallet.nexusCoins, start.wallet.nexusCoins + 6);
  assert.equal(rewarded.growth.bondXp, start.growth.bondXp + 15);
  assert.equal(rewarded.diary[0].kind, "mission");
  assert.match(rewarded.diary[0].detail, /\+6 monete Nexus e \+15 XP/);
});

test("retrying the same mission claim never duplicates its reward", () => {
  const start = createFamiliarHomeState(1_000);
  const reward = { title: "Passeggiata in galleria", coins: 6, experience: 15, item: "toy", quantity: 2 };
  const once = grantFamiliarHomeMissionReward(start, reward, 2_000, "2026-09-07:explore-art-2");
  const retried = grantFamiliarHomeMissionReward(once, reward, 3_000, "2026-09-07:explore-art-2");
  assert.equal(retried, once);
  assert.equal(retried.wallet.nexusCoins, start.wallet.nexusCoins + 6);
  assert.equal(retried.growth.bondXp, start.growth.bondXp + 15);
  assert.equal(retried.inventory.quantities["mission-ball"], 2);
});

test("every displayed mission material maps to a usable rebuilt inventory item", () => {
  const mappings = [
    ["food", "moon-meal"],
    ["soap", "cleansing-tonic"],
    ["medicine", "comfort-balm"],
    ["toy", "mission-ball"],
  ];
  for (const [item, inventoryId] of mappings) {
    const start = createFamiliarHomeState(1_000);
    const rewarded = grantFamiliarHomeMissionReward(start, { title: "Missione", coins: 0, experience: 0, item, quantity: 2 }, 2_000, `claim-${item}`);
    assert.equal(rewarded.inventory.quantities[inventoryId], start.inventory.quantities[inventoryId] + 2);
  }
});

test("the Nexus market spends earned coins and places purchased supplies in the backpack", () => {
  const base = createFamiliarHomeState(1_000);
  const funded = { ...base, wallet: { ...base.wallet, nexusCoins: 20, totalEarned: 20 } };
  const offer = FAMILIAR_MARKET_OFFERS[0];
  const purchased = purchaseFamiliarMarketOffer(funded, offer.id);
  assert.equal(purchased.wallet.nexusCoins, 20 - offer.priceCoins);
  assert.equal(purchased.inventory.quantities[offer.itemId], funded.inventory.quantities[offer.itemId] + offer.quantity);
  const denied = purchaseFamiliarMarketOffer(base, offer.id);
  assert.equal(denied.inventory.quantities[offer.itemId], base.inventory.quantities[offer.itemId]);

  const permanentOffer = FAMILIAR_MARKET_OFFERS.find((candidate) => candidate.id === "comet-ball");
  const firstPermanentPurchase = purchaseFamiliarMarketOffer(funded, permanentOffer.id);
  const duplicate = purchaseFamiliarMarketOffer(firstPermanentPurchase, permanentOffer.id);
  assert.equal(duplicate.wallet.nexusCoins, firstPermanentPurchase.wallet.nexusCoins);
  assert.match(duplicate.lastOutcome, /già nel tuo zaino/i);
});

test("merchant catalogues expand at Giovane and Adulto without exposing everything at birth", () => {
  const mirraStarterIds = ["comet-ball", "emerald-ball", "ribbon-star", "moon-moth", "heart-brush", "cuddle-cushion", "moon-mat", "cloud-mat"];
  assert.deepEqual(availableFamiliarMarketOffers("arcane", "cucciolo").map((offer) => offer.id), mirraStarterIds);
  assert.deepEqual(availableFamiliarMarketOffers("arcane", "giovane").map((offer) => offer.id), [...mirraStarterIds, "arcane-gramophone", "magic-feather"]);
  assert.equal(availableFamiliarMarketOffers("arcane", "adulto").length, 12);
  const initial = createFamiliarHomeState(1_000);
  assert.ok(availableFamiliarMarketOffers("arcane", "cucciolo").every((offer) => initial.inventory.quantities[offer.itemId] === 0));
  assert.equal(availableFamiliarMarketOffers("daily", "cucciolo").length, 4);
  assert.equal(availableFamiliarMarketOffers("daily", "giovane").length, 6);
  assert.equal(availableFamiliarMarketOffers("daily", "adulto").length, 7);
  assert.equal(availableFamiliarDeviceCovers("cucciolo").length, 11);
  assert.equal(availableFamiliarDeviceCovers("giovane").length, 17);
  assert.equal(availableFamiliarDeviceCovers("adulto").length, 23);

  const base = createFamiliarHomeState(1_000);
  const funded = { ...base, wallet: { ...base.wallet, nexusCoins: 100, totalEarned: 100 } };
  const locked = purchaseFamiliarMarketOffer(funded, "arcane-gramophone");
  assert.equal(locked.wallet.nexusCoins, 100);
  assert.equal(locked.inventory.quantities["arcane-gramophone"], 0);
  assert.match(locked.lastOutcome, /stadio Giovane/);

  const lockedCover = purchaseFamiliarDeviceCover(funded, "ivory-gold");
  assert.equal(lockedCover.wallet.nexusCoins, 100);
  assert.ok(!lockedCover.deviceCover.ownedIds.includes("ivory-gold"));
  assert.match(lockedCover.lastOutcome, /stadio Adulto/);

  const young = { ...funded, growth: { ...funded.growth, bondXp: 900, stage: "giovane", careStreak: 14 } };
  const purchased = purchaseFamiliarMarketOffer(young, "arcane-gramophone");
  assert.equal(purchased.wallet.nexusCoins, 62);
  assert.equal(purchased.inventory.quantities["arcane-gramophone"], 1);
});

test("the larger Giovane pantry bundle has its own purchased pantry artwork", () => {
  const feast = FAMILIAR_MARKET_OFFERS.find((offer) => offer.id === "pantry-feast");
  assert.equal(feast?.quantity, 5);
  assert.equal(feast?.artSrc, "/famiglio/rebuild/inventory/young-pantry.png");
  const assetPath = join(process.cwd(), "public", "famiglio", "rebuild", "inventory", "young-pantry.png");
  assert.ok(statSync(assetPath).size > 0);
  assert.deepEqual(pngDimensions(assetPath), { width: 64, height: 96 });
});

test("Iris sells twenty-three persistent solid-color device covers with Nexus coins", () => {
  const base = createFamiliarHomeState(1_000);
  assert.equal(base.deviceCover.activeId, "nexus-violet");
  const funded = { ...base, wallet: { ...base.wallet, nexusCoins: 100, totalEarned: 100 } };
  const purchased = purchaseFamiliarDeviceCover(funded, "midnight-blue");
  assert.equal(purchased.wallet.nexusCoins, 55);
  assert.equal(purchased.deviceCover.activeId, "midnight-blue");
  assert.ok(purchased.deviceCover.ownedIds.includes("midnight-blue"));
  const equipped = equipFamiliarDeviceCover(purchased, "nexus-violet");
  assert.equal(equipped.deviceCover.activeId, "nexus-violet");
  assert.equal(equipped.wallet.nexusCoins, 55);
  assert.equal(FAMILIAR_DEVICE_COVERS.length, 23);
  for (const requiredColor of ["Arancione", "Rosso", "Verde chiaro", "Marrone", "Giallo", "Nero"]) {
    const cover = FAMILIAR_DEVICE_COVERS.find((candidate) => candidate.name === requiredColor);
    assert.equal(cover?.unlockStage, "cucciolo", `${requiredColor} deve essere subito visibile da Iris`);
  }
  assert.equal(FAMILIAR_DEVICE_COVERS.filter((cover) => cover.name.toLowerCase().includes("viola")).length, 1);
  assert.ok(FAMILIAR_DEVICE_COVERS.some((cover) => cover.id === "lime-neon"));
  assert.ok(FAMILIAR_DEVICE_COVERS.some((cover) => cover.id === "magenta-pulse"));
  assert.ok(FAMILIAR_DEVICE_COVERS.some((cover) => cover.id === "laser-cyan"));
  assert.deepEqual(availableSeasonalPremiumCovers(new Date(2026, 8, 3)), []);
  assert.deepEqual(availableSeasonalPremiumCovers(new Date(2026, 9, 31)).map((cover) => cover.id), ["halloween"]);
  assert.deepEqual(availableSeasonalPremiumCovers(new Date(2026, 11, 31)).map((cover) => cover.id), ["christmas", "new-year"]);
});

test("the rebuild market separates coin supplies from protected real-money checkout", () => {
  const component = readFileSync(join(process.cwd(), "components", "FamiglioNexusRebuild.tsx"), "utf8");
  const styles = readFileSync(join(process.cwd(), "components", "FamiglioNexusRebuild.module.css"), "utf8");
  assert.match(component, /La corte dei mercanti/);
  assert.match(component, /MARKET_VENDORS\.map/);
  assert.match(component, /Bancarella quotidiana/);
  assert.match(component, /Emporio arcano/);
  assert.match(component, /Bottega dei Colori/);
  assert.match(component, /purchaseFamiliarDeviceCover/);
  assert.match(component, /previewDeviceCoverId/);
  assert.match(component, /nessuna moneta spesa/);
  assert.match(component, /coverCurrentState}>In uso/);
  assert.match(component, /const coversPerPage = compactFamiliarCatalog \? 2 : 4/);
  assert.match(component, /covers\.slice\(currentPage \* coversPerPage, currentPage \* coversPerPage \+ coversPerPage\)/);
  assert.match(component, /aria-label="Pagine delle cover"/);
  assert.match(component, />\{previewing \? "Annulla" : "Prova"\}<\/button>/);
  assert.match(component, />\{owned \? "Applica" : "Compra"\}<\/button>/);
  assert.doesNotMatch(component, /Mancano \$\{missingCoins\}/);
  assert.match(component, /data-cover=\{activeDeviceCover\.id\}/);
  assert.match(component, /familiarMealAsset\(activeFamiliarId\)/);
  assert.doesNotMatch(component, /FamiglioNexusCenter|setHomePanel\("nexus"\)|Centro del Nexus/);
  assert.match(styles, /\.coverActions\s*\{/);
  assert.match(styles, /\.deviceShell\s*\{[\s\S]*?background:\s*var\(--shell-a\);/);
  assert.match(component, /Atelier dello Specchio/);
  assert.match(component, /<strong>Medusa<\/strong>/);
  assert.match(component, /Atelier Medusa/);
  assert.match(component, /Serpenti dello Specchio/);
  assert.match(component, /Prezzi in euro, contenuto sempre visibile e nessuna estrazione casuale/);
  assert.match(component, /1 cover premium permanente/);
  assert.match(component, /aria-pressed=\{previewing\}/);
  assert.match(component, /premiumCoverCatalog/);
  assert.match(component, /familiarAnimatedPreview\(entry\)/);
  assert.match(component, /artKind: "familiar"/);
  assert.equal(FAMILIAR_BUNDLES.length, 4);
  assert.deepEqual(FAMILIAR_BUNDLES.map((bundle) => bundle.familiars.length), [10, 14, 9, 12]);
  assert.deepEqual(FAMILIAR_BUNDLES.map((bundle) => bundle.priceEuro), [7.99, 11.99, 7.99, 9.99]);
  assert.match(component, /startFamiliarCheckout/);
  assert.match(component, /purchasedOfferIds/);
  assert.doesNotMatch(component, />Acquisto non attivo</);
  assert.match(component, /requestedWing === "court" \|\| requestedWing === "atelier" \|\| requestedWing === "night"/);
  assert.match(component, /Prezzi in euro, contenuto sempre visibile/);
  assert.match(component, /Mercato notturno/);
  assert.match(component, /name: "Ronin itinerante"/);
  assert.match(component, /name: "Lich collezionista"/);
  assert.match(component, /Sigilli Notturni/);
  assert.match(component, /Frammenti raccolti: 0 \/ 6/);
  assert.match(component, /NIGHT_MARKET_MERCHANTS\.map/);
  assert.match(component, /aria-label="Sala del Mercato notturno"/);
  assert.match(styles, /\.nightMarketSceneCanvas\s*\{[\s\S]*?night-hall\.png/);
  assert.match(styles, /\.nightMerchantSprite\s*\{[\s\S]*?background-size:\s*400% 100%/);
  assert.doesNotMatch(component, /name: "Orin"/);
  assert.match(component, /purchaseFamiliarMarketOffer\(homeState, offer\.id\)/);
  assert.match(component, /aria-label=\{`Informazioni su \$\{offer\.name\}`\}/);
  assert.match(component, /aria-label=\{`Informazioni su \$\{cover\.name\}`\}/);
  assert.match(component, /aria-label=\{`Informazioni su \$\{merchant\.sampleName\}`\}/);
  assert.match(component, /createPortal/);
  assert.match(component, /role="dialog" aria-modal="true"/);
  assert.match(component, /<dt>Utilizzo<\/dt>/);
  assert.match(component, /<dt>Effetto<\/dt>/);
  assert.match(component, /<dt>Quantità<\/dt>/);
  assert.match(component, /<dt>Prezzo<\/dt>/);
  assert.match(component, /1 oggetto permanente/);
  assert.match(component, /1 cover permanente/);
  assert.match(component, /12 Sigilli Notturni/);
  assert.match(component, /6 frammenti evento/);
  assert.match(styles, /\.marketInfoButton\s*\{/);
  assert.match(styles, /\.marketInfoSheet\s*\{[\s\S]*?position:\s*fixed;/);
  assert.match(styles, /\.marketInfoSheet\s*\{[\s\S]*?top:\s*50%;[\s\S]*?left:\s*50%;/);
  assert.match(component, /requestedGrowth === "giovane"/);
  assert.match(component, /requestedGrowth === "adulto"/);
  assert.match(component, /requestedVendor === "daily" \|\| requestedVendor === "arcane" \|\| requestedVendor === "cosmetics"/);
  assert.match(component, /if \(!storageReady \|\| previewSessionRef\.current\) return/);
  assert.match(component, /const MERCHANT_IDLE_SEQUENCES/);
  assert.match(component, /const MERCHANT_REACTION_SEQUENCE/);
  assert.match(component, /setInterval\(\(\) => setMarketIdleTick/);
  assert.match(component, /backgroundPosition: `\$\{merchantFrame/);
  assert.match(component, /showMerchantReaction\("cosmetics"/);
  assert.match(component, /showMerchantReaction\(merchant\.id/);
  assert.match(styles, /\.marketScreen\s*\{[\s\S]*?height:\s*100%;[\s\S]*?overflow:\s*hidden;/);
  assert.match(styles, /background-image:\s*url\("\/famiglio\/rebuild\/market\/hall\.png"\)/);
  for (const asset of ["hall.png", "night-hall.png", "medusa-atelier-v1.png", "medusa-idle-v1.png", "medusa-pattern-serpenti-v1.png", "medusa-pattern-vaporwave-cosmico-v1.png", "nora-bartender.png", "mirra-alchemist.png", "iris-tintora.png", "ronin-idle.png", "lich-idle.png", "ronin-idle-market.png", "lich-idle-market.png", "ronin-katana.png", "lich-crown.png"]) {
    assert.ok(statSync(join(process.cwd(), "public", "famiglio", "rebuild", "market", asset)).size > 0);
  }
  for (const familiar of FAMILIAR_COLLECTION) {
    assert.ok(statSync(join(process.cwd(), "public", familiar.spriteBase, "preview.png")).size > 0);
    assert.ok(statSync(join(process.cwd(), "public", familiar.spriteBase, "preview.webp")).size > 0);
  }
  assert.doesNotMatch(component, /openPaidFamiliarCheckout/);
});

test("the rebuild exposes a real daily mission board and records care actions", () => {
  const component = readFileSync(join(process.cwd(), "components", "FamiglioNexusRebuild.tsx"), "utf8");
  const styles = readFileSync(join(process.cwd(), "components", "FamiglioNexusRebuild.module.css"), "utf8");
  assert.match(component, /Missioni del Nexus/);
  assert.match(component, /dailyFamiliarMissions\("anteprima-lorewise"/);
  assert.match(component, /previousRomeDateKey\(date\)/);
  assert.match(component, /useState<DailyMissionView\[]>\(initialMissionPreview\.missions\)/);
  assert.match(component, /aria-label="Scegli la missione giornaliera"/);
  assert.match(component, /data-selected=\{selectedMissionIndex === index\}/);
  assert.match(component, /Missioni già disponibili · sincronizzazione dei progressi in corso/);
  assert.match(component, /fetch\("\/api\/famiglio\/missions"/);
  assert.match(component, /recordGameMission\("familiar_care", action\)/);
  assert.match(component, /I progressi vengono registrati soltanto dopo un'azione realmente completata/);
  assert.match(styles, /\.missionScreen\s*\{[\s\S]*?height:\s*100%;[\s\S]*?overflow:\s*hidden;/);
  assert.match(styles, /\.missionGrid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(3/);
  assert.match(styles, /\.missionGrid\s*\{[\s\S]*?ritual-sky-panorama-v1\.png/);
  assert.match(styles, /\.missionCard h3[\s\S]*?clamp\(\.88rem/);
  assert.match(styles, /\.missionTabs\s*\{\s*display:\s*none/);
  assert.match(styles, /\.missionCard\[data-selected="false"\]\s*\{\s*display:\s*none/);
});

test("every Famiglio screen is locked to one viewport without nested scrolling", () => {
  const component = readFileSync(join(process.cwd(), "components", "FamiglioNexusRebuild.tsx"), "utf8");
  const styles = readFileSync(join(process.cwd(), "components", "FamiglioNexusRebuild.module.css"), "utf8");
  assert.match(component, /document\.documentElement\.classList\.add\("famiglio-immersive"\)/);
  assert.match(styles, /position:\s*fixed;[\s\S]*height:\s*100dvh;/);
  assert.match(styles, /\.stage\s*\{[\s\S]*?overflow:\s*hidden;/);
  assert.match(styles, /\.diaryEntries\s*\{[\s\S]*?overflow:\s*hidden;/);
  assert.doesNotMatch(styles, /overflow:\s*(?:auto|scroll)/);
});

test("autonomous familiars make need-aware living choices", () => {
  const healthy = { hunger: 80, energy: 80, happiness: 80, hygiene: 80, affection: 80 };
  assert.equal(chooseAutonomousBehavior({ ...healthy, energy: 20 }, "idle", .8), "sleep");
  assert.equal(chooseAutonomousBehavior({ ...healthy, hygiene: 20 }, "idle", .8), "groom");
  assert.equal(chooseAutonomousBehavior(healthy, "idle", .1), "roam");
  assert.equal(chooseAutonomousBehavior(healthy, "idle", .45), "sit");
  assert.equal(chooseAutonomousBehavior(healthy, "sit", .45), "idle");
  assert.ok(autonomousBehaviorDuration("groom", .5) >= 3_200);
});

test("all eight starters have distinct autonomous personalities", () => {
  assert.deepEqual(Object.keys(FAMILIAR_PERSONALITIES).sort(), STARTER_EGGS.map((egg) => egg.id).sort());
  assert.equal(new Set(Object.values(FAMILIAR_PERSONALITIES).map((personality) => personality.title)).size, 8);
  assert.ok(FAMILIAR_PERSONALITIES.horse.movementSpeed > FAMILIAR_PERSONALITIES.turtle.movementSpeed);
  assert.ok(FAMILIAR_PERSONALITIES.fox.roamBias > FAMILIAR_PERSONALITIES.panda.roamBias);
});

test("the autonomous director turns every critical need into a visible intention", () => {
  const healthy = { hunger: 80, energy: 80, happiness: 80, hygiene: 80, affection: 80 };
  const hungry = chooseAutonomousDecision("cat", { ...healthy, hunger: 12 }, "idle", .5);
  const tired = chooseAutonomousDecision("golden", { ...healthy, energy: 12 }, "idle", .5);
  const bored = chooseAutonomousDecision("rabbit", { ...healthy, happiness: 12 }, "idle", .5);
  const lonely = chooseAutonomousDecision("turtle", { ...healthy, affection: 12 }, "idle", .5);
  const dirty = chooseAutonomousDecision("parrot", { ...healthy, hygiene: 12 }, "idle", .5);
  assert.deepEqual(
    [hungry.behavior, tired.behavior, bored.behavior, lonely.behavior, dirty.behavior],
    ["seek-food", "sleep", "seek-play", "seek-affection", "groom"],
  );
  assert.equal(hungry.signal, "food");
  assert.equal(tired.signal, "energy");
  assert.equal(bored.signal, "play");
  assert.equal(lonely.signal, "affection");
  assert.equal(dirty.signal, "hygiene");
  assert.equal(chooseAutonomousDecision("cat", { ...healthy, hunger: 21 }, "idle", .5).signal, null);
  assert.ok(tired.movementSpeed < FAMILIAR_PERSONALITIES.golden.movementSpeed);
  const component = readFileSync(join(process.cwd(), "components", "FamiglioNexusRebuild.tsx"), "utf8");
  assert.match(component, /buttonIcon = HOME_ACTIONS\.find/);
  assert.match(component, /food: "feed"[\s\S]*energy: "rest"[\s\S]*play: "play"[\s\S]*hygiene: "clean"[\s\S]*affection: "care"/);
});

test("every idle familiar uses the autonomous behavior director", () => {
  const component = readFileSync(join(process.cwd(), "components", "FamiglioNexusRebuild.tsx"), "utf8");
  const contract = readFileSync(join(process.cwd(), "FAMIGLIO_LIVING_CONTRACT.md"), "utf8");
  assert.match(component, /chooseAutonomousDecision\(egg\.id, needsRef\.current, autonomous\.behavior\)/);
  assert.match(component, /nextTarget = \.15 \+ Math\.random\(\) \* \.7/);
  assert.match(component, /autonomousBehavior === "sit"[\s\S]*autonomousBehavior === "groom"/);
  assert.doesNotMatch(component, /targetRef\.current = action \? HOME_ACTION_TARGETS\[action\] : \.5/);
  assert.match(contract, /Cammina soltanto mentre cambia realmente posizione/);
  assert.match(contract, /sprite coerenti per: `idle`, `walk`, `sit`, `groom`, `sleep`/);
});

test("walking is limited to real movement and autonomous rest has no Z overlay", () => {
  const component = readFileSync(join(process.cwd(), "components", "FamiglioNexusRebuild.tsx"), "utf8");
  assert.match(component, /const moving = Math\.abs\(targetRef\.current - positionRef\.current\) > \.008/);
  assert.match(component, /moving[\s\S]*\? "walk"/);
  assert.doesNotMatch(component, /targetRef\.current = targetRef\.current > \.5 \? \.28 : \.72/);
  assert.match(component, /currentAction === "rest"[\s\S]*\? "sleep"/);
  assert.match(component, /autonomousBehavior === "sleep"[\s\S]*\? "sleep-calm"/);
  assert.doesNotMatch(component, /fillText\("Z"/);
});

test("all autonomous sleep sheets preserve the species frame geometry", () => {
  for (const egg of STARTER_EGGS) {
    const sleep = FAMILIAR_SPRITE_ROSTER[egg.id].actions.sleep;
    const calmPath = join(process.cwd(), "public", "famiglio", "rebuild", "starters", egg.id, "sleep-calm.png");
    assert.deepEqual(pngDimensions(calmPath), {
      width: sleep.frameWidth * sleep.frames,
      height: sleep.frameHeight,
    });
  }
});

test("action objects use one fixed interaction point and all familiar sheets remain body-only", () => {
  const component = readFileSync(join(process.cwd(), "components", "FamiglioNexusRebuild.tsx"), "utf8");
  assert.match(component, /const HOME_OBJECT_ANCHORS/);
  assert.match(component, /const fixedObjectCenterX = actionAnchor[\s\S]*HOME_OBJECT_ANCHORS\[actionAnchor\]/);
  assert.doesNotMatch(component, /actionUsesEmbeddedDefaultObject/);
  assert.doesNotMatch(component, /customObjectMotion/);
  assert.match(component, /requestedItem\?\.action === currentAction[\s\S]*const displayedItemId = actionItemId[\s\S]*\? "moon-meal"[\s\S]*\? "blue-ball"/);
  assert.match(component, /drawInventoryObject\(context, inventoryAssets\[displayedItemId\], displayedItemId, fixedObjectCenterX/);
  const mealDraw = component.indexOf('displayedItemId === "moon-meal"');
  const familiarDraw = component.indexOf("context.drawImage(\n        sprite,");
  assert.ok(mealDraw >= 0 && familiarDraw > mealDraw, "la ciotola deve essere disegnata dietro al Famiglio");
  assert.match(component, /drawHomeActionEffect\(context, moving \? null : currentAction/);
  assert.doesNotMatch(component, /centerX \+ facingRef\.current \* petSize \* \.7/);
});

test("the play ball stays on one horizontal anchor and only bounces vertically", () => {
  const component = readFileSync(join(process.cwd(), "components", "FamiglioNexusRebuild.tsx"), "utf8");
  assert.match(component, /const playPhase = elapsedPresence \* \.0045/);
  assert.match(component, /const animatedCenterX = centerX/);
  assert.doesNotMatch(component, /centerX \+ Math\.sin\(playPhase\)/);
  assert.match(component, /groundY - petSize \* \(\.1 \+ Math\.abs\(Math\.sin\(playPhase \* 1\.35\)\) \* \.12\)/);
  assert.match(component, /const drawY = animatedGroundY - height/);
});

test("room preparation removes theatrical frames and outputs full-bleed 16 by 9 art", () => {
  const script = readFileSync(join(process.cwd(), "scripts", "prepare-famiglio-room-art.mjs"), "utf8");
  assert.match(script, /feed: "feed-clear\.png"/);
  assert.match(script, /play: "play-clear\.png"/);
  assert.match(script, /\.extract\(roomCrop\[id\]\)/);
  assert.match(script, /width: 512, height: 288, fit: "fill"/);
  assert.doesNotMatch(script, /left: 40/);
  assert.doesNotMatch(script, /fit: "contain"/);
});

test("desktop and mobile preserve the complete 16 by 9 room without stretching it", () => {
  const component = readFileSync(join(process.cwd(), "components", "FamiglioNexusRebuild.tsx"), "utf8");
  assert.match(component, /const roomWidth = Math\.min\(width, height \* 16 \/ 9\)/);
  assert.match(component, /const roomHeight = roomWidth \* 9 \/ 16/);
  assert.match(component, /const roomX = \(width - roomWidth\) \* \.5/);
  assert.match(component, /drawPurchasedHome\(context, assets, roomRef\.current, roomX, roomY, roomWidth, roomHeight, roomTimeRef\.current \?\? new Date\(\)\)/);
  assert.match(component, /const roomGroundRatio = HOME_ROOM_GROUND_RATIOS\[roomRef\.current \?\? "home"\]/);
});

test("every room keeps Famigli and action objects on its declared floor line", () => {
  const component = readFileSync(join(process.cwd(), "components", "FamiglioNexusRebuild.tsx"), "utf8");
  assert.match(component, /const HOME_ROOM_GROUND_RATIOS/);
  assert.match(component, /HOME_ROOM_GROUND_RATIOS\[roomRef\.current \?\? "home"\]/);
  assert.match(component, /const drawY = animatedGroundY - height/);
  assert.match(component, /currentAction === "rest" && inventoryAssets\?\.\[restItemId\]/);
  assert.match(component, /requestedItem\?\.action === "rest"[\s\S]*?requestedItem\.id[\s\S]*?: "purple-bed"/);
  assert.match(component, /displayedItemId !== "purple-bed"/);
  assert.match(component, /const configuredGroundY = groundY \+ roomHeight \* \(collectionVisual\?\.groundOffset \?\? 0\)/);
  assert.match(component, /const familiarGroundY = configuredGroundY/);
  assert.match(component, /const spriteDrawY = currentAction === "rest" && !moving[\s\S]*HOUSE_BED_CUSHION_CENTER_OFFSET/);
  assert.doesNotMatch(component, /compactRoom \? \.68 : \.86/);
});

test("the familiar status bar stays at the top of the room on desktop and mobile", () => {
  const styles = readFileSync(join(process.cwd(), "components", "FamiglioNexusRebuild.module.css"), "utf8");
  assert.match(styles, /\.homeNameplate\s*\{[\s\S]*?top:\s*14px;[\s\S]*?bottom:\s*auto;/);
  assert.match(styles, /\.homeNameplate\s*\{\s*top:\s*4px;[\s\S]*?bottom:\s*auto;/);
});

test("mobile home navigation uses generated Tamagotchi icons with accessible names", () => {
  const component = readFileSync(join(process.cwd(), "components", "FamiglioNexusRebuild.tsx"), "utf8");
  const styles = readFileSync(join(process.cwd(), "components", "FamiglioNexusRebuild.module.css"), "utf8");
  assert.match(component, /nav-inventory-v1\.png/);
  assert.match(component, /nav-diary-v1\.png/);
  assert.match(component, /nav-missions-v1\.png/);
  assert.match(component, /nav-market-v1\.png/);
  assert.match(component, /aria-label="Apri zaino"/);
  assert.match(component, /aria-label="Apri mercato"/);
  assert.match(styles, /\.dailyNavIcon/);
});

test("Medusa exposes fifteen fixed-price premium micro-pattern covers", () => {
  assert.equal(PREMIUM_COVERS.length, 15);
  assert.equal(PREMIUM_COVER_PRICE_EUR, .99);
  assert.equal(availablePremiumCovers(new Date(2026, 8, 4)).length, 15);
  assert.equal(new Set(PREMIUM_COVERS.map((cover) => cover.artDesktop)).size, 15);
  assert.ok(PREMIUM_COVERS.some((cover) => cover.id === "creepy-micro"));
  assert.ok(PREMIUM_COVERS.some((cover) => cover.id === "cosmic-vaporwave-micro"));
  for (const cover of PREMIUM_COVERS) {
    const desktop = join(process.cwd(), "public", ...cover.artDesktop.split("/").filter(Boolean));
    const mobile = join(process.cwd(), "public", ...cover.artMobile.split("/").filter(Boolean));
    assert.ok(statSync(desktop).size > 40_000);
    assert.ok(statSync(mobile).size > 40_000);
    const dimensions = pngDimensions(desktop);
    assert.equal(dimensions.width, dimensions.height, `${cover.name}: il micromotivo deve essere quadrato`);
    assert.ok(dimensions.width >= 1024, `${cover.name}: il micromotivo deve restare ad alta risoluzione`);
    assert.equal(cover.artDesktop, cover.artMobile);
  }
});

test("every merchant has a dedicated room and stable four-frame character strip", () => {
  for (const merchant of Object.values(MERCHANT_ROOMS)) {
    const room = join(process.cwd(), "public", ...merchant.roomSrc.split("/").filter(Boolean));
    const sprite = join(process.cwd(), "public", ...merchant.spriteSrc.split("/").filter(Boolean));
    assert.deepEqual(pngDimensions(room), { width: 960, height: 640 });
    assert.deepEqual(pngDimensions(sprite), { width: 512, height: 128 });
  }
});

test("Medusa catalogues the complete agreed roster and every required action strip", () => {
  assert.equal(FAMILIAR_COLLECTION.length, 53);
  assert.equal(FAMILIAR_COLLECTION.filter((entry) => entry.category === "real").length, 18);
  assert.equal(FAMILIAR_COLLECTION.filter((entry) => entry.category === "magical").length, 14);
  assert.equal(FAMILIAR_COLLECTION.filter((entry) => entry.category === "legendary").length, 9);
  assert.equal(FAMILIAR_COLLECTION.filter((entry) => entry.category === "dinosaur").length, 12);
  assert.deepEqual(FAMILIAR_PRICE_EUR_BY_RARITY, { comune: 0.99, raro: 1.49, epico: 1.99, leggendario: 2.99 });
  assert.ok(FAMILIAR_COLLECTION.every((entry) => entry.priceEuro === FAMILIAR_PRICE_EUR_BY_RARITY[entry.rarity]));
  assert.ok(FAMILIAR_COLLECTION.every((entry) => entry.priceEuro <= 2.99));
  for (const familiar of FAMILIAR_COLLECTION) {
    for (const action of REQUIRED_COLLECTION_ACTIONS) {
      const asset = join(process.cwd(), "public", ...`${familiar.spriteBase}/${action}.png`.split("/").filter(Boolean));
      assert.ok(statSync(asset).size > 0, `${familiar.id} ${action}`);
    }
    for (const variant of familiar.variants ?? []) for (const action of REQUIRED_COLLECTION_ACTIONS) {
      const asset = join(process.cwd(), "public", "famiglio", "rebuild", "collection", familiar.id, "variants", variant, `${action}.png`);
      assert.ok(statSync(asset).size > 0, `${familiar.id} ${variant} ${action}`);
    }
  }
});

test("every Famiglio uses one species-appropriate pixel meal instead of inheriting the starter bowl", () => {
  assert.deepEqual(
    Object.keys(FAMILIAR_MEAL_PROFILES).sort(),
    FAMILIAR_COLLECTION.map((entry) => entry.id).sort(),
  );
  for (const familiar of FAMILIAR_COLLECTION) {
    const profile = FAMILIAR_MEAL_PROFILES[familiar.id];
    assert.ok(["fish", "protein", "greens", "seeds", "bamboo"].includes(profile.kind), `${familiar.id} has an invalid meal kind`);
    assert.equal(familiarMealAsset(familiar.id), profile.assetSrc);
    const asset = join(process.cwd(), "public", ...profile.assetSrc.split("/").filter(Boolean));
    assert.ok(statSync(asset).size > 0, `${familiar.id} meal asset is missing`);
  }
  assert.notEqual(familiarMealAsset("rabbit"), familiarMealAsset("cat"));
  assert.notEqual(familiarMealAsset("tyrannosaurus"), familiarMealAsset("triceratops"));
  assert.notEqual(familiarMealAsset("panda"), familiarMealAsset("polar-bear"));
});

test("missions fund the night market and exchanges are deterministic and permanent", () => {
  const base = createFamiliarHomeState(1_000);
  const rewarded = grantFamiliarHomeMissionReward(base, { title: "Missione prova", coins: 5, experience: 120 }, 2_000);
  assert.equal(rewarded.wallet.nightSigils, 1);
  const young = { ...rewarded, growth: { ...rewarded.growth, bondXp: 900, stage: "giovane", careStreak: 14 }, wallet: { ...rewarded.wallet, nightSigils: 20, relicFragments: 8 } };
  const offer = NIGHT_MARKET_OFFERS.find((candidate) => candidate.id === "moon-compass");
  const exchanged = exchangeNightMarketOffer(young, offer.id, 3_000);
  assert.equal(exchanged.wallet.nightSigils, 12);
  assert.ok(exchanged.wallet.nightRewards.includes(offer.id));
  assert.equal(exchanged.inventory.quantities[offer.itemId], 1);
  assert.equal(exchanged.wallet.equippedNightRelicId, offer.id);
  const used = applyFamiliarInventoryItem(exchanged, offer.itemId, 3_500);
  assert.equal(used.activeItemId, offer.itemId);
  const duplicate = exchangeNightMarketOffer(exchanged, offer.id, 4_000);
  assert.equal(duplicate.wallet.nightSigils, 12);

  for (const nightOffer of NIGHT_MARKET_OFFERS) {
    const funded = {
      ...base,
      growth: { ...base.growth, bondXp: 3_500, stage: "adulto", careStreak: 35 },
      wallet: { ...base.wallet, nightSigils: 100, relicFragments: 100 },
    };
    const bought = exchangeNightMarketOffer(funded, nightOffer.id, 5_000);
    assert.equal(bought.inventory.quantities[nightOffer.itemId], 1, `${nightOffer.name} must enter the backpack`);
    assert.equal(applyFamiliarInventoryItem(bought, nightOffer.itemId, 5_500).activeItemId, nightOffer.itemId);
  }

  const legacyOwned = restoreFamiliarHome({
    ...base,
    wallet: { ...base.wallet, nightRewards: [offer.id] },
    inventory: { ...base.inventory, quantities: { ...base.inventory.quantities, [offer.itemId]: 0 } },
  }, 6_000);
  assert.equal(legacyOwned.inventory.quantities[offer.itemId], 1);

  const withPouch = {
    ...base,
    wallet: { ...base.wallet, nightRewards: ["sigil-pouch"], equippedNightRelicId: "sigil-pouch" },
    inventory: { ...base.inventory, quantities: { ...base.inventory.quantities, "sigil-pouch": 1 } },
  };
  const pouchReward = grantFamiliarHomeMissionReward(withPouch, { title: "Missione notturna", coins: 0, experience: 5 }, 7_000);
  assert.equal(pouchReward.wallet.nightSigils, 2);
});

test("a completed action keeps the last action room visible", () => {
  const finished = advanceFamiliarHome(performHomeAction(createFamiliarHomeState(1_000), "play", 1_000), 20_000);
  assert.equal(finished.activeAction, null);
  assert.equal(finished.roomAction, "play");
});

test("the screen preview shortcuts are restricted to localhost and the private LAN", () => {
  const component = readFileSync(join(process.cwd(), "components", "FamiglioNexusRebuild.tsx"), "utf8");
  assert.match(component, /const previewParams = new URLSearchParams/);
  assert.match(component, /previewStage = isLocalPreview \? previewParams\.get/);
  assert.match(component, /requestedSpecies = previewParams\.get\("species"\)/);
  assert.match(component, /STARTER_EGGS\.find\(\(egg\) => egg\.id === requestedSpecies\)/);
  assert.match(component, /previewStage === "choosing"/);
  assert.match(component, /previewStage === "diary"/);
  assert.match(component, /previewParams\.get\("test"\) === "all"/);
  assert.match(component, /previewParams\.get\("time"\)/);
  assert.match(component, /previewParams\.get\("room"\)/);
  assert.match(component, /previewParams\.get\("item"\)/);
  assert.match(component, /nexusCoins: 9_999/);
  assert.match(component, /previewHostname === "127\.0\.0\.1"[\s\S]*previewHostname === "localhost"[\s\S]*isPrivateLanHost/);
  assert.match(component, /const isPrivateLanHost =/);
});

test("market info sheets render above the immersive device shell", () => {
  const styles = readFileSync(join(process.cwd(), "components", "FamiglioNexusRebuild.module.css"), "utf8");
  assert.match(styles, /\.experience\s*\{[\s\S]*?z-index:\s*2147483000;/);
  assert.match(styles, /\.marketInfoSheet\s*\{[\s\S]*?position:\s*fixed;[\s\S]*?z-index:\s*2147483647;/);
});

test("the night market follows the Rome 21 to 06 opening window", () => {
  assert.equal(nightMarketIsOpen(new Date("2026-09-04T19:00:00.000Z")), true);
  assert.equal(nightMarketIsOpen(new Date("2026-09-05T03:59:00.000Z")), true);
  assert.equal(nightMarketIsOpen(new Date("2026-09-05T04:00:00.000Z")), false);
  assert.equal(nightMarketIsOpen(new Date("2026-09-05T12:00:00.000Z")), false);
});

test("every Medusa familiar has a complete animated portrait without clipped edges", async () => {
  assert.equal(FAMILIAR_COLLECTION.length, 53);
  for (const entry of FAMILIAR_COLLECTION) {
    const relative = familiarAnimatedPreview(entry).replace(/^\//, "");
    assert.equal(relative, `${entry.spriteBase.replace(/^\//, "")}/preview.webp`);
    const path = join(process.cwd(), "public", relative);
    const metadata = await sharp(path, { animated: true }).metadata();
    assert.ok((metadata.pages ?? 1) >= 2, `${entry.name} must have an animated portrait`);
    assert.ok((metadata.width ?? 0) >= 72, `${entry.name} portrait is too narrow`);
    assert.ok(((metadata.pageHeight ?? metadata.height) ?? 0) >= 72, `${entry.name} portrait is too short`);
  }
});

test("Casa, market, info and bundles share one refined familiar identity", () => {
  const normalizer = readFileSync(join(process.cwd(), "scripts", "normalize-famiglio-house-sprites.mjs"), "utf8");
  const portraits = readFileSync(join(process.cwd(), "scripts", "prepare-famiglio-preview-portraits.mjs"), "utf8");
  const market = readFileSync(join(process.cwd(), "lib", "famiglioMarketExpansion.ts"), "utf8");
  assert.match(normalizer, /targetAction === "idle"[\s\S]*generatedIdleFrames\(familiar\)/);
  assert.match(normalizer, /const careFrames = await generatedFrames\(familiar, "care"\)/);
  assert.doesNotMatch(normalizer, /generatedAtlas && targetAction !== "idle"/);
  assert.match(portraits, /path\.join\(destinationDirectory, "house", "idle\.png"\)/);
  assert.match(portraits, /createPortrait\(sourcePath, destinationDirectory\)/);
  assert.match(market, /return `\$\{entry\.spriteBase\}\/preview\.webp`/);
  assert.doesNotMatch(market, /preview-animated-v2/);
});

test("Medusa bundle dialogs list every included familiar and remain internally scrollable", () => {
  const component = readFileSync(join(process.cwd(), "components", "FamiglioNexusRebuild.tsx"), "utf8");
  const styles = readFileSync(join(process.cwd(), "components", "FamiglioNexusRebuild.module.css"), "utf8");
  assert.match(component, /familiars: bundle\.familiars\.map/);
  assert.match(component, /item\.familiars\.map/);
  assert.match(component, /Anteprima animata di \$\{familiar\.name\}/);
  assert.match(styles, /\.marketInfoBundle > div[\s\S]*overflow-y:\s*auto/);
  assert.match(styles, /\.marketInfoBundle article > span[\s\S]*background-size:\s*contain/);
  assert.match(styles, /grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
});

test("play and cuddle objects animate in front while sleeping surfaces stay behind", () => {
  const component = readFileSync(join(process.cwd(), "components", "FamiglioNexusRebuild.tsx"), "utf8");
  const petDraw = component.indexOf("context.drawImage(\n        sprite,");
  const objectDraw = component.indexOf("drawInventoryObject(context, inventoryAssets[displayedItemId]", petDraw);
  assert.ok(petDraw >= 0 && objectDraw > petDraw);
  assert.match(component, /const consumedScale = item\?\.consumable/);
  assert.match(component, /const isCleaningSupply = item\?\.action === "clean" && item\.consumable/);
  assert.match(component, /const isPlayObject = item\?\.action === "play"/);
  assert.match(component, /shadowBlur = 7 \+ Math\.abs\(Math\.sin/);
  assert.match(component, /const ballItems:[^\n]*\["blue-ball", "mission-ball", "comet-ball", "emerald-ball"\]/);
  assert.match(component, /const floatingToys:[^\n]*\["ribbon-star", "moon-moth"\]/);
  assert.match(component, /const sleepMats:[^\n]*\["cuddle-cushion", "moon-mat", "cloud-mat"\]/);
  assert.match(component, /const animatedMirraItems:[^\n]*"cloud-mat"/);
  assert.match(component, /spriteFrame \* sourceFrameWidth/);
  assert.match(component, /elapsedInteraction, elapsedAction/);
  assert.match(component, /HOUSE_SLEEP_SURFACE_OFFSETS\[restItemId\]/);
  assert.match(component, /drawInventoryObject\(context, inventoryAssets\[restItemId\], restItemId,[\s\S]*?context\.drawImage\(\s*sprite,/);
});

test("every Medusa familiar can be tested through its real Casa action sheets", () => {
  const component = readFileSync(join(process.cwd(), "components", "FamiglioNexusRebuild.tsx"), "utf8");
  assert.match(component, /Prova nella Casa/);
  assert.match(component, /setTestCollectionFamiliarId\(entry\.id\)/);
  assert.match(component, /collectionFamiliar\.spriteBase\}\/growth\/\$\{growthStage\}\/house\/\$\{spriteAction === "feed" \? "feed-v3" : spriteAction\}\.png/);
  assert.match(component, /previewParams\.get\("familiar"\)/);
  assert.match(component, /collectionFamiliar=\{activeCollectionFamiliar\}/);
  assert.match(component, /collectionVisual\?\.scale \?\? spriteSet\.previewScale/);
  assert.match(component, /HOME_OBJECT_ANCHORS\[actionRef\.current\] - HOME_ACTION_TARGETS\[actionRef\.current\]/);
});

test("all 53 collection familiars have ten normalized unclipped Casa sequences and an explicit natural scale", async () => {
  assert.equal(Object.keys(FAMILIAR_HOUSE_VISUALS).length, FAMILIAR_COLLECTION.length);
  for (const entry of FAMILIAR_COLLECTION) {
    const visual = FAMILIAR_HOUSE_VISUALS[entry.id];
    assert.ok(visual, `${entry.name} needs a Casa visual profile`);
    assert.ok(visual.scale >= .45 && visual.scale <= 1.35, `${entry.name} has an implausible scale`);
    const actionHashes = new Set();
    for (const action of REQUIRED_COLLECTION_ACTIONS) {
      const actionPath = join(process.cwd(), "public", entry.spriteBase.replace(/^\//, ""), "house", `${action}.png`);
      const bytes = readFileSync(actionPath);
      const { data, info } = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      assert.equal(info.width, 512, `${entry.name}/${action} width`);
      assert.equal(info.height, 128, `${entry.name}/${action} height`);
      let edgePixels = 0;
      for (let x = 0; x < info.width; x += 1) {
        if (data[x * 4 + 3]) edgePixels += 1;
        if (data[((info.height - 1) * info.width + x) * 4 + 3]) edgePixels += 1;
      }
      for (let y = 0; y < info.height; y += 1) {
        if (data[(y * info.width) * 4 + 3]) edgePixels += 1;
        if (data[(y * info.width + info.width - 1) * 4 + 3]) edgePixels += 1;
      }
      assert.equal(edgePixels, 0, `${entry.name}/${action} touches the crop edge`);
      const frameHashes = new Set();
      const bottoms = [];
      const centers = [];
      let softAlphaPixels = 0;
      for (let frameIndex = 0; frameIndex < 4; frameIndex += 1) {
        const frame = Buffer.alloc(128 * 128 * 4);
        let bottom = -1;
        let top = 128;
        for (let y = 0; y < 128; y += 1) for (let x = 0; x < 128; x += 1) {
          const source = (y * info.width + frameIndex * 128 + x) * 4;
          const target = (y * 128 + x) * 4;
          data.copy(frame, target, source, source + 4);
          if (data[source + 3] !== 0 && data[source + 3] !== 255) softAlphaPixels += 1;
          if (data[source + 3] > 16) {
            bottom = y;
            top = Math.min(top, y);
          }
        }
        frameHashes.add(createHash("sha256").update(frame).digest("hex"));
        bottoms.push(bottom);
        centers.push((top + bottom) / 2);
      }
      assert.equal(softAlphaPixels, 0, `${entry.name}/${action} has soft matte pixels`);
      if (action !== "idle") assert.ok(frameHashes.size >= 2, `${entry.name}/${action} must animate with distinct frames`);
      if (action === "sleep" || action === "sleep-calm") {
        assert.ok(Math.max(...centers) - Math.min(...centers) <= 2, `${entry.name}/${action} is not centered consistently in the bed`);
        assert.ok(centers.every((center) => center >= 70 && center <= 74), `${entry.name}/${action} misses the bed center line`);
      } else {
        const allowedFloorSpread = action === "play" ? 10 : 2;
        assert.ok(Math.max(...bottoms) - Math.min(...bottoms) <= allowedFloorSpread, `${entry.name}/${action} leaves the shared floor line`);
        assert.ok(Math.max(...bottoms) <= 116, `${entry.name}/${action} does not preserve the safety margin below the paws`);
      }
      actionHashes.add(createHash("sha256").update(bytes).digest("hex"));
    }
    assert.equal(actionHashes.size, REQUIRED_COLLECTION_ACTIONS.length, `${entry.name} still reuses an identical action sequence`);
  }
});

test("Casa animation speed is responsive while rest remains calm", () => {
  const component = readFileSync(join(process.cwd(), "components", "FamiglioNexusRebuild.tsx"), "utf8");
  assert.match(component, /const HOUSE_MOVEMENT_SPEED_FACTOR = \.62/);
  assert.match(component, /walk: 6/);
  assert.match(component, /feed: 5/);
  assert.match(component, /play: 7/);
  assert.match(component, /sleep: 2/);
  assert.match(component, /\* HOUSE_MOVEMENT_SPEED_FACTOR/);
  assert.doesNotMatch(component, /collectionFamiliar \? 8/);
});

test("food waits for arrival and every sleep pose is centered from its visible body", () => {
  const component = readFileSync(join(process.cwd(), "components", "FamiglioNexusRebuild.tsx"), "utf8");
  assert.match(component, /interactionStartRef\.current = 0/);
  assert.match(component, /currentAction && !moving && interactionStartRef\.current === 0/);
  assert.match(component, /elapsedInteraction[\s\S]*drawInventoryObject\([\s\S]*elapsedInteraction/);
  assert.match(component, /measureOpaqueFrameCenters/);
  assert.match(component, /HOUSE_BED_CUSHION_CENTER_OFFSET/);
  assert.match(component, /frameCenter\.y \/ sourceFrameHeight/);
  assert.match(component, /frameCenter\.x \/ sourceFrameWidth/);
});

test("the complete normalized roster rejects background specks without deleting anatomy", () => {
  const audit = JSON.parse(readFileSync(join(process.cwd(), "artifacts", "famiglio-rebuild-qa", "familiar-house-action-audit.json"), "utf8"));
  assert.equal(audit.familiars.length, FAMILIAR_COLLECTION.length);
  for (const familiar of audit.familiars) {
    assert.equal(familiar.validated, true, `${familiar.name} did not pass the visual audit`);
    for (const action of familiar.actions) {
      assert.ok(action.smallestComponents.every((area) => area >= 24), `${familiar.name}/${action.action} still has isolated background specks`);
    }
  }
});

test("mobile care labels, need icons and backpack copy have readable spacing", () => {
  const styles = readFileSync(join(process.cwd(), "components", "FamiglioNexusRebuild.module.css"), "utf8");
  assert.match(styles, /\.needRow > span \{ font-size: 1rem/);
  assert.match(styles, /grid-template-columns: 21px 58px minmax\(48px, 1fr\) 24px/);
  assert.match(styles, /\.inventoryItem strong,[\s\S]*font-size: \.5rem/);
  assert.match(styles, /\.wishMarker \{[\s\S]*position: static/);
  assert.match(styles, /\.homeAction,[\s\S]*min-height: 58px/);
});

test("mobile back navigation lives in the purple device header", () => {
  const component = readFileSync(join(process.cwd(), "components", "FamiglioNexusRebuild.tsx"), "utf8");
  const styles = readFileSync(join(process.cwd(), "components", "FamiglioNexusRebuild.module.css"), "utf8");
  assert.match(component, /<header className=\{styles\.deviceTop\}>[\s\S]*?screenBackTop/);
  assert.match(component, /screenBackIntro/);
  assert.match(styles, /\.screenBackTop \{\s*display: none/);
  assert.match(styles, /@media \(max-width: 560px\)[\s\S]*?\.screenBackIntro \{ display: none; \}[\s\S]*?\.screenBackTop \{[\s\S]*?position: static/);
});

test("the rebuilt home does not place the navigation PiP inside the Famiglio device", () => {
  const component = readFileSync(join(process.cwd(), "components", "FamiglioNexusRebuild.tsx"), "utf8");
  assert.doesNotMatch(component, /aria-label="Apri il PiP del Famiglio"/);
  assert.doesNotMatch(component, /id="famiglio-pip-panel"/);
});

test("night merchants keep their merchandise in a touch-scrollable panel", () => {
  const styles = readFileSync(join(process.cwd(), "components", "FamiglioNexusRebuild.module.css"), "utf8");
  assert.match(styles, /\.nightMerchantDetail \{[\s\S]*overflow-y: auto/);
  assert.match(styles, /\.nightMerchantDetail \{ touch-action: pan-y/);
  assert.match(styles, /\.marketVendorPanel:has\(\.nightMerchantDetail\)/);
});

test("changing a care action does not reload every room and sprite sheet", () => {
  const component = readFileSync(join(process.cwd(), "components", "FamiglioNexusRebuild.tsx"), "utf8");
  assert.match(component, /const roomRef = useRef\(room\)/);
  assert.match(component, /const activeItemIdRef = useRef\(activeItemId\)/);
  assert.match(component, /drawPurchasedHome\(context, assets, roomRef\.current/);
  assert.doesNotMatch(component, /personality\.patience, room, activeItemId, away/);
});

test("every Famiglio section has a concise first-access tutorial that can be reopened", () => {
  assert.deepEqual(Object.keys(FAMILIAR_GUIDES).sort(), ["adventure", "care", "combat", "diary", "market", "missions", "onboarding", "progression"]);
  for (const guide of Object.values(FAMILIAR_GUIDES)) {
    assert.ok(guide.iconSrc.startsWith("/famiglio/rebuild/"), `${guide.id}: missing real icon`);
    assert.ok(guide.pages.length >= 2 && guide.pages.length <= 5, `${guide.id}: tutorial is too short or too long`);
    assert.ok(guide.pages.every((page) => page.points.length === 3), `${guide.id}: unclear tutorial page`);
  }
  const overlay = readFileSync(join(process.cwd(), "components", "FamiglioGuideOverlay.tsx"), "utf8");
  assert.match(overlay, /lorewise\.famiglio-guides\.v1/);
  assert.match(overlay, /readSeenGuides\(\)\.has\(section\)/);
  assert.match(overlay, /Apri la guida:/);
  assert.match(overlay, /preview && !forceTutorial/);
});

test("the progression screen exposes real growth, move and reward requirements", () => {
  const progression = readFileSync(join(process.cwd(), "components", "FamiglioProgression.tsx"), "utf8");
  const styles = readFileSync(join(process.cwd(), "components", "FamiglioProgression.module.css"), "utf8");
  assert.match(progression, /familiarCombatProgress/);
  assert.match(progression, /learnedSchedule/);
  assert.match(progression, /familiarCombatMoveEnergyCost/);
  assert.match(progression, /FAMILIAR_MILESTONES/);
  assert.match(progression, /percorso-legame-mobile-v1\.png/);
  assert.match(progression, /percorso-legame-desktop-v1\.png/);
  assert.match(styles, /object-fit: contain/);
  assert.match(styles, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
});

test("physical cover controls remain opaque and legible over every applied pattern", () => {
  const styles = readFileSync(join(process.cwd(), "components", "FamiglioNexusRebuild.module.css"), "utf8");
  assert.match(styles, /\.deviceTop \.exitExperience,[\s\S]*\.deviceControls \.controlButton[\s\S]*background: #082f3a/);
  assert.match(styles, /\.deviceControls \.controlButtonMain[\s\S]*background: #ffd45b/);
});

test("real animal voices are assigned only to matching Famiglio species", () => {
  const audio = readFileSync(join(process.cwd(), "lib", "nexusFamiliarAudio.ts"), "utf8");
  for (const index of [1, 2, 3, 4]) {
    assert.ok(statSync(join(process.cwd(), "public", "famiglio", "rebuild", "audio", "animals", `bird-chirp-${index}.wav`)).size > 0);
  }
  assert.match(audio, /bird\|uccellino/);
  assert.match(audio, /parrot\|pappagallo/);
  assert.match(audio, /chicken\|gallina/);
  assert.match(audio, /pteranodon\|pteranodonte/);
  assert.doesNotMatch(audio, /createOscillator|stableFamiliarTone|FAMILY_TONE/);
});
