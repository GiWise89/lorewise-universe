import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import sharp from "sharp";
import { ALL_FAMILIARS, familiarAppearance, familiarPalettes, STARTER_FAMILIARS } from "../lib/nexusFamiliarCatalog.ts";
import { FAMILIAR_HABITAT_THEMES } from "../lib/nexusDayCycle.ts";
import { FAMILIAR_COMPACT_SCALE, FAMILIAR_MOBILE_SPOTLIGHT_SIZES, FAMILIAR_PEDESTAL_SIZES, FAMILIAR_STAGE_SIZES } from "../lib/nexusFamiliarDisplay.ts";

async function idleVisibleHeightRatio(family) {
  const appearance = ALL_FAMILIARS.find((candidate) => candidate.family === family);
  assert.ok(appearance, `${family} must have an appearance`);
  const sequence = appearance.behaviors.idle;
  const file = join(process.cwd(), "public", sequence.spritePath.replace(/^\//, ""));
  const metadata = await sharp(file).metadata();
  const frameWidth = Math.floor(metadata.width / sequence.columns);
  const frameHeight = Math.floor(metadata.height / sequence.rows);
  const { data, info } = await sharp(file)
    .extract({ left: 0, top: sequence.row * frameHeight, width: frameWidth, height: frameHeight })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let minY = info.height;
  let maxY = -1;
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      if (data[(y * info.width + x) * info.channels + 3] <= 8) continue;
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }
  assert.ok(maxY >= minY, `${family} idle frame must contain visible pixels`);
  return (maxY - minY + 1) / frameHeight;
}

test("every familiar has a verified eyes-closed sleeping pose", () => {
  assert.ok(STARTER_FAMILIARS.length > 0);
  for (const familiar of STARTER_FAMILIARS) {
    const rest = familiar.behaviors.rest;
    assert.equal(rest.eyesClosed, true, `${familiar.name} must sleep with closed eyes`);
    assert.ok(rest.frames >= 1, `${familiar.name} must have a sleeping frame`);
    if (rest.holdFrame !== undefined) {
      assert.ok(rest.holdFrame >= 0 && rest.holdFrame < rest.frames, `${familiar.name} has an invalid sleeping hold frame`);
    }
  }
});

test("fox seated and grooming sequences stop before the empty tail frames", () => {
  for (const appearanceId of ["fox", "fox-arctic", "fox-silver"]) {
    const appearance = familiarAppearance(appearanceId);
    assert.equal(appearance.behaviors.sit.frames, 11);
    assert.equal(appearance.behaviors.groom.frames, 11);
  }
});

test("every fox palette uses the complete locomotion cycle instead of the static-looking row", () => {
  for (const appearanceId of ["fox", "fox-arctic", "fox-silver"]) {
    const walk = familiarAppearance(appearanceId).behaviors.walk;
    assert.equal(walk.row, 2, `${appearanceId} must use the full-body locomotion row`);
    assert.equal(walk.frames, 8, `${appearanceId} must stop before the empty cells`);
    assert.equal(walk.columns, 14, `${appearanceId} keeps the source sheet geometry`);
  }
});

test("fox care actions use stable and meaningful body sequences", () => {
  const builder = readFileSync(join(process.cwd(), "tamagochi asset", "lavorazione", "tools", "build-crow-fox-care-sheets.ps1"), "utf8");
  assert.match(builder, /\$foodFrames = @\(6, 7, 8, 7, 6, 7, 8, 7\)/);
  assert.match(builder, /\$washFrames = @\(0, 1, 2, 3, 2, 1, 0, 1\)/);
  assert.match(builder, /Draw-SourceFrame \$graphics \$source \$cell 0 \(\$frame % 4\) 3 \$frame/);
  assert.doesNotMatch(builder, /Draw-SourceFrame \$graphics \$source \$cell 5 \$frame 3 \$frame/);
});

test("starter familiars have ordered niche anchors and species-specific sizing", () => {
  const nicheAnchors = STARTER_FAMILIARS.map((familiar) => familiar.adoption.nicheX);
  assert.deepEqual(nicheAnchors, [...nicheAnchors].sort((left, right) => left - right));
  assert.equal(new Set(nicheAnchors).size, STARTER_FAMILIARS.length);
  for (const familiar of STARTER_FAMILIARS) {
    assert.ok(familiar.adoption.nicheX > 0 && familiar.adoption.nicheX < 100);
    assert.ok(familiar.adoption.displaySize > 0);
    assert.ok(familiar.adoption.baselineShift >= 0 && familiar.adoption.baselineShift < 50);
  }
  assert.ok(STARTER_FAMILIARS[1].adoption.displaySize > STARTER_FAMILIARS[0].adoption.displaySize, "the dog must render larger than the cat");
  assert.ok(STARTER_FAMILIARS[4].adoption.displaySize > STARTER_FAMILIARS[3].adoption.displaySize, "the fox must render larger than the rabbit");
});

test("starter niche anchors match the five complete sanctuary cushions", () => {
  assert.deepEqual(STARTER_FAMILIARS.map((familiar) => familiar.adoption.nicheX), [13.5, 31.5, 50, 68.5, 86.5]);
});

test("every starter has complete selection-profile information", () => {
  for (const familiar of STARTER_FAMILIARS) {
    assert.ok(familiar.profile.size.length > 0);
    assert.ok(familiar.profile.bond.length > 0);
    assert.ok(familiar.profile.description.length >= 60);
  }
});

test("every familiar offers three complete and resolvable palette choices", () => {
  for (const familiar of STARTER_FAMILIARS) {
    const palettes = familiarPalettes(familiar.id);
    assert.ok(palettes.length >= 1, `${familiar.name} must offer at least one complete palette`);
    assert.equal(new Set(palettes.map((palette) => palette.id)).size, palettes.length);
    for (const palette of palettes) {
      const resolved = familiarAppearance(palette.id);
      assert.equal(resolved.id, palette.id);
      assert.equal(resolved.behaviors.rest.eyesClosed, true);
      assert.equal(palette.swatches.length, 3);
      assert.ok(existsSync(join(process.cwd(), "public", palette.spritePath)), `${palette.id} is missing its care sprite sheet`);
      for (const behavior of Object.values(palette.behaviors)) {
        assert.ok(existsSync(join(process.cwd(), "public", behavior.spritePath)), `${palette.id} is missing ${behavior.spritePath}`);
      }
    }
  }
});

test("every habitat has its own ground line and safe walking corridor", () => {
  const cycle = readFileSync(join(process.cwd(), "lib", "nexusDayCycle.ts"), "utf8");
  assert.equal(FAMILIAR_HABITAT_THEMES.length, 5);
  assert.ok(FAMILIAR_HABITAT_THEMES.every((theme) => theme.groundLinePercent > 0 && theme.groundLinePercent < 100));
  assert.ok(FAMILIAR_HABITAT_THEMES.every((theme) => theme.mobileGroundLinePercent > 0 && theme.mobileGroundLinePercent < 100));
  assert.ok(FAMILIAR_HABITAT_THEMES.every((theme) => theme.walkBounds[0] < theme.walkBounds[1]));
  assert.match(cycle, /id: "cucina-alchemica"[\s\S]*groundLinePercent: 76/s);
});

test("three complete moving gadget sets exist for every palette of every Famiglio", () => {
  const gadgetIds = ["berretto-stellare", "sciarpa-crepuscolo", "mantellina-custode"];
  const appearanceIds = ALL_FAMILIARS.flatMap((familiar) => familiarPalettes(familiar.id).map((palette) => palette.id));
  for (const gadgetId of gadgetIds) for (const appearanceId of appearanceIds) {
    const root = join(process.cwd(), "public", "famiglio", "gadgets", gadgetId, appearanceId);
    assert.ok(existsSync(join(root, "actions.png")), `${gadgetId}/${appearanceId} actions missing`);
    assert.ok(statSync(join(root, "actions.png")).size > 1_000, `${gadgetId}/${appearanceId} actions too small`);
    const entries = readdirSync(root).filter((file) => file.endsWith(".png") && file !== "actions.png" && file !== "preview.png");
    assert.ok(entries.length >= 1, `${gadgetId}/${appearanceId} behavior sheet missing`);
  }
});

test("Famiglio interface sources stay UTF-8 clean", () => {
  const files = [
    join(process.cwd(), "components", "NexusFamiliarLegacy.tsx"),
    join(process.cwd(), "lib", "nexusFamiliar.ts"),
    join(process.cwd(), "lib", "nexusFamiliarOnboarding.ts"),
    join(process.cwd(), "lib", "nexusFamiliarSpecies.ts"),
    join(process.cwd(), "lib", "nexusFamiliarWorld.ts"),
    join(process.cwd(), "app", "api", "famiglio", "route.ts"),
    join(process.cwd(), "app", "api", "famiglio", "slots", "route.ts"),
  ];
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    assert.doesNotMatch(source, /Ã|Â|â€|â€™|â€¦|�/, `${file} contains mojibake`);
  }
});

test("every species keeps a fixed optical ground anchor through every action", () => {
  const legacy = readFileSync(join(process.cwd(), "components", "NexusFamiliarLegacy.tsx"), "utf8");
  const legacyStyles = readFileSync(join(process.cwd(), "components", "NexusFamiliarLegacy.module.css"), "utf8");
  assert.match(legacy, /style=\{familiarGroundStyle\}/);
  assert.match(legacyStyles, /bottom:\s*calc\(21\.5% - var\(--personality-pet-bottom-offset, 0px\)\)/);
  assert.match(legacyStyles, /top:\s*calc\(47\.2vw - var\(--personality-mobile-pet-size, 96px\) \+ var\(--personality-mobile-pet-bottom-offset, 0px\)\)/);
});

test("mobile diary uses only a transparent hotspot inside its illustrated page", () => {
  const styles = readFileSync(join(process.cwd(), "components", "NexusFamiliarLegacy.module.css"), "utf8");
  const mobile = styles.slice(styles.indexOf("@media (max-width: 640px)"));
  assert.match(mobile, /\.diaryPageLauncher\s*\{[^}]*top:\s*25\.5vw[^}]*left:\s*21\.5%[^}]*width:\s*34%[^}]*overflow:\s*hidden/s);
  assert.match(mobile, /\.diaryPageLauncher\s*\{\s*padding:\s*0;\s*background:\s*transparent/);
});

test("attendance confirms the saved return and a daily wish becomes visible in the den", () => {
  const rituals = readFileSync(join(process.cwd(), "components", "NexusFamiliarRituals.tsx"), "utf8");
  const ritualStyles = readFileSync(join(process.cwd(), "components", "NexusFamiliarRituals.module.css"), "utf8");

  assert.match(rituals, /wasClaimed \|\| !attendance\.claimedToday/);
  assert.match(rituals, /role="status" aria-live="polite"/);
  assert.match(ritualStyles, /\.attendanceConfirmation\s*\{/);
});

test("species and compact poses keep natural desktop and mobile proportions", () => {
  assert.deepEqual(FAMILIAR_STAGE_SIZES.Gallina, { desktop: 72, mobile: 48 });
  assert.deepEqual(FAMILIAR_STAGE_SIZES.Pappagallo, { desktop: 76, mobile: 50 });
  assert.deepEqual(FAMILIAR_STAGE_SIZES.Orso, { desktop: 270, mobile: 190 });
  assert.deepEqual(FAMILIAR_PEDESTAL_SIZES.Gallina, { desktop: 78, mobile: 32 });
  assert.deepEqual(FAMILIAR_PEDESTAL_SIZES.Pappagallo, { desktop: 84, mobile: 34 });
  assert.deepEqual(FAMILIAR_PEDESTAL_SIZES.Orso, { desktop: 320, mobile: 150 });
  assert.ok(FAMILIAR_COMPACT_SCALE.Orso > FAMILIAR_COMPACT_SCALE.Gallina * 3);
  assert.ok(FAMILIAR_COMPACT_SCALE.Orso > FAMILIAR_COMPACT_SCALE.Pappagallo * 3);
});

test("bear is visibly larger than chicken and parrot after transparent sprite padding is removed", async () => {
  const [chickenRatio, parrotRatio, bearRatio] = await Promise.all([
    idleVisibleHeightRatio("Gallina"),
    idleVisibleHeightRatio("Pappagallo"),
    idleVisibleHeightRatio("Orso"),
  ]);
  for (const viewport of ["desktop", "mobile"]) {
    const chickenHeight = chickenRatio * FAMILIAR_STAGE_SIZES.Gallina[viewport];
    const parrotHeight = parrotRatio * FAMILIAR_STAGE_SIZES.Pappagallo[viewport];
    const bearHeight = bearRatio * FAMILIAR_STAGE_SIZES.Orso[viewport];
    assert.ok(bearHeight >= chickenHeight * 1.7, `bear must be at least 70% taller than chicken on ${viewport}`);
    assert.ok(bearHeight >= parrotHeight * 1.8, `bear must be at least 80% taller than parrot on ${viewport}`);
  }
  const spotlightBearHeight = bearRatio * FAMILIAR_MOBILE_SPOTLIGHT_SIZES.Orso;
  assert.ok(spotlightBearHeight >= chickenRatio * FAMILIAR_MOBILE_SPOTLIGHT_SIZES.Gallina * 1.6);
  assert.ok(spotlightBearHeight >= parrotRatio * FAMILIAR_MOBILE_SPOTLIGHT_SIZES.Pappagallo * 1.7);
});

