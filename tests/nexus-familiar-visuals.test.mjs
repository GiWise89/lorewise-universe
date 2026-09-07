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

test("starter Famigli stand inside their sanctuary niches", () => {
  const styles = readFileSync(join(process.cwd(), "components", "NexusFamiliarExperience.module.css"), "utf8");
  assert.match(styles, /\.starterScene\s*\{[^}]*top:\s*82\.35%/);
  for (const familiar of STARTER_FAMILIARS) {
    assert.ok(familiar.adoption.baselineShift >= 0 && familiar.adoption.baselineShift <= 40);
  }
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

test("the care dashboard uses five real need-icon images", () => {
  const component = readFileSync(join(process.cwd(), "components", "NexusFamiliarExperience.tsx"), "utf8");
  const icons = ["fame-v2.png", "igiene-v2.png", "energia-v2.png", "felicita-v2.png", "salute-v2.png"];

  for (const icon of icons) {
    const iconPath = join(process.cwd(), "public", "famiglio", "needs", icon);
    assert.ok(existsSync(iconPath), `${icon} is missing`);
    assert.ok(statSync(iconPath).size > 150, `${icon} is unexpectedly small`);
    assert.match(component, new RegExp(`/famiglio/needs/${icon.replace(".", "\\.")}`));
  }

  assert.match(component, /<img[^>]+src=\{NEED_ICONS\[needKey\]\}/s);
  assert.doesNotMatch(component, /<Image[^>]+src=\{NEED_ICONS\[needKey\]\}/s);
  assert.match(component, /<img[^>]+src=\{ITEM_ICONS\[item\]\}/s);
  assert.doesNotMatch(component, /ITEM_ICON_ROW/);
});

test("the premium dashboard stays compact and never crops its illustrated rooms", () => {
  const styles = readFileSync(join(process.cwd(), "components", "NexusFamiliarExperience.module.css"), "utf8");

  assert.match(styles, /\.focusTabs\s*\{[^}]*grid-template-columns:\s*repeat\(5/s);
  assert.match(styles, /\.denFocus\s*\{[^}]*overflow:\s*hidden/s);
  assert.match(styles, /\.lowerDeck\s*\{[^}]*display:\s*block/s);
  assert.match(styles, /\.lowerDeck \.missionsPanel\s*\{[^}]*height:\s*100%/s);
  assert.match(styles, /\.sceneImage\s*\{[^}]*object-fit:\s*contain/s);
  assert.match(styles, /\.adoptionCanvas\s*>\s*\.sceneImage\s*\{[^}]*object-fit:\s*contain/s);
  assert.doesNotMatch(styles, /\.adoptionCanvas\s*>\s*\.sceneImage\s*\{[^}]*object-fit:\s*cover/s);
});

test("every main Famiglio section uses a real dedicated navigation icon", () => {
  const component = readFileSync(join(process.cwd(), "components", "NexusFamiliarExperience.tsx"), "utf8");
  const iconFiles = ["tana-v1.webp", "fuori-casa-v1.webp", "shop-v1.webp", "missioni-v1.webp"];
  for (const file of iconFiles) {
    const iconPath = join(process.cwd(), "public", "famiglio", "navigation", file);
    assert.ok(existsSync(iconPath), `${file} is missing`);
    assert.ok(statSync(iconPath).size > 1_000, `${file} is unexpectedly small`);
    assert.match(component, new RegExp(`/famiglio/navigation/${file.replace(".", "\\.")}`));
  }
  assert.match(component, /<img src=\{NAV_ICONS\.den\}/);
  assert.match(component, /<img src=\{NAV_ICONS\.legacy\}/);
  assert.match(component, /<img src=\{NAV_ICONS\.missions\}/);
});

test("the familiar identity is a compact premium plaque without rename controls", () => {
  const component = readFileSync(join(process.cwd(), "components", "NexusFamiliarExperience.tsx"), "utf8");
  const styles = readFileSync(join(process.cwd(), "components", "NexusFamiliarExperience.module.css"), "utf8");

  assert.match(component, /className=\{styles\.identityCard\}/);
  assert.match(component, /className=\{styles\.familiarTraits\}/);
  assert.match(component, /<dt>Specie<\/dt>/);
  assert.match(component, /<dt>Sesso<\/dt>/);
  assert.match(component, /<dt>Crescita<\/dt>/);
  assert.match(component, /<dt>Umore<\/dt>/);
  assert.doesNotMatch(component, />Rinomina</);
  assert.match(styles, /\.dashboardHeader\s*\{[^}]*linear-gradient/s);
});

test("the room fills the viewport and the clock is a concise top-left widget", () => {
  const component = readFileSync(join(process.cwd(), "components", "NexusFamiliarExperience.tsx"), "utf8");
  const styles = readFileSync(join(process.cwd(), "components", "NexusFamiliarExperience.module.css"), "utf8");

  assert.match(styles, /\.dashboardShell,\s*\.lowerDeck\s*\{[^}]*width:\s*100%/s);
  assert.match(styles, /\.habitat\s*\{[^}]*aspect-ratio:\s*1536\s*\/\s*793/s);
  assert.match(styles, /\.nexusClock\s*\{[^}]*top:\s*1rem[^}]*left:\s*1rem/s);
  assert.doesNotMatch(component, /<small>\{activeCycle\.label\}/);
  assert.doesNotMatch(component, /className=\{styles\.denBadge\}/);
});

test("the dashboard switches only the main focus while care controls stay mounted", () => {
  const component = readFileSync(join(process.cwd(), "components", "NexusFamiliarExperience.tsx"), "utf8");
  const styles = readFileSync(join(process.cwd(), "components", "NexusFamiliarExperience.module.css"), "utf8");
  assert.match(component, /useState<"den" \| "outside" \| "shop" \| "legacy" \| "progress">\(initialLegacyView \? "legacy" : "den"\)/);
  assert.match(component, />Tana<\/strong>/);
  assert.match(component, />Fuori casa<\/strong>/);
  assert.match(component, />Shop<\/strong>/);
  assert.match(component, />Legame<\/strong>/);
  assert.doesNotMatch(component, />Personalizza<\/strong>/);
  assert.match(component, />Missioni<\/strong>/);
  assert.match(component, /className=\{styles\.careGrid\} aria-label="Esigenze e azioni sempre disponibili"/);
  assert.match(styles, /\.gameDeck\s*\{[^}]*grid-template-columns:/s);
  assert.match(styles, /\.dashboardPage\s*\{[^}]*height:\s*var\(--stage-viewport-height[^}]*overflow:\s*hidden/s);
});

test("desktop displays scale one invariant Famiglio stage instead of recomposing it", () => {
  const component = readFileSync(join(process.cwd(), "components", "NexusFamiliarExperience.tsx"), "utf8");
  const styles = readFileSync(join(process.cwd(), "components", "NexusFamiliarExperience.module.css"), "utf8");

  assert.match(component, /const DESKTOP_STAGE_WIDTH = 1920/);
  assert.match(component, /const DESKTOP_STAGE_HEIGHT = 996/);
  assert.match(component, /Math\.min\(viewportWidth \/ DESKTOP_STAGE_WIDTH, viewportHeight \/ DESKTOP_STAGE_HEIGHT\)/);
  assert.match(styles, /\.dashboardShell\s*\{[^}]*width:\s*1920px[^}]*height:\s*996px[^}]*transform:\s*translateX\(-50%\)\s+scale\(var\(--stage-scale, 1\)\)/s);
  assert.match(styles, /\.gameDeck\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\) 500px/s);
  assert.match(styles, /\.headerStatus\s*\{[^}]*display:\s*flex/s);
  assert.match(styles, /\.denFocus \.habitat\s*\{[^}]*width:\s*100%/s);
  assert.doesNotMatch(styles, /calc\(\(100svh - \d+px\) \* 1\.937\)/);
});

test("growth stays below the always-visible care actions rather than inside missions", () => {
  const component = readFileSync(join(process.cwd(), "components", "NexusFamiliarExperience.tsx"), "utf8");
  const missionStart = component.indexOf('id="mobile-missions-drawer"');
  const careStart = component.indexOf('className={styles.careGrid} aria-label="Esigenze e azioni sempre disponibili"');
  const actionsStart = component.indexOf('id="mobile-care-drawer"', careStart);
  const growthStart = component.indexOf("className={styles.progressPanel}", careStart);
  assert.ok(missionStart >= 0 && careStart > missionStart);
  assert.equal(component.slice(missionStart, careStart).includes("className={styles.progressPanel}"), false);
  assert.ok(actionsStart > careStart && growthStart > actionsStart);
});

test("the fixed sidebar keeps every care card inside its available height", () => {
  const styles = readFileSync(join(process.cwd(), "components", "NexusFamiliarExperience.module.css"), "utf8");
  assert.match(styles, /\.careGrid\s*\{[^}]*min-height:\s*0[^}]*grid-template-rows:\s*auto auto minmax\(0, 1fr\)[^}]*overflow:\s*hidden/s);
  assert.match(styles, /\.progressPanel\s*\{[^}]*min-height:\s*0[^}]*padding:\s*\.82rem 1rem[^}]*overflow:\s*hidden/s);
  assert.match(styles, /\.progressPanel h2\s*\{[^}]*font:\s*650 1\.7rem/s);
});

test("the removed room-object editor cannot reappear in desktop or mobile", () => {
  const component = readFileSync(join(process.cwd(), "components", "NexusFamiliarExperience.tsx"), "utf8");
  const styles = readFileSync(join(process.cwd(), "components", "NexusFamiliarExperience.module.css"), "utf8");
  assert.doesNotMatch(component, /Personalizza|Oggetti posseduti|moveWallDecoration|denDraft|wallDraft/);
  assert.doesNotMatch(component, /mobile-customize-drawer/);
  assert.doesNotMatch(styles, /\.customizeWorkspace|\.customizeInventory|\.draggableWallDecoration/);
});

test("manual rest is independent from removed room decorations", () => {
  const component = readFileSync(join(process.cwd(), "components", "NexusFamiliarExperience.tsx"), "utf8");
  assert.doesNotMatch(component, /cuccia-di-viaggio|restingOnCushion|data-resting-on-cushion|rest-lift/);
  assert.match(component, /requestCare\("rest"\)/);
  assert.match(component, /species\.careMessages\.rest/);
});

test("mobile becomes a no-scroll Tamagotchi console with side drawers and real image icons", () => {
  const component = readFileSync(join(process.cwd(), "components", "NexusFamiliarExperience.tsx"), "utf8");
  const styles = readFileSync(join(process.cwd(), "components", "NexusFamiliarExperience.module.css"), "utf8");
  const mobile = styles.slice(styles.indexOf("@media (max-width: 640px)"));
  assert.match(component, /const MOBILE_ITEM_LABELS/);
  assert.match(component, /styles\.denDeck : styles\.progressDeck/);
  assert.match(component, /className=\{styles\.mobileActionLabel\}/);
  assert.match(component, /className=\{styles\.mobileGameControls\}/);
  assert.match(component, /className=\{styles\.mobilePetIdentity\}/);
  assert.match(component, /className=\{styles\.mobileGrowthBar\}/);
  assert.match(component, /className=\{styles\.mobileExperienceMeter\}/);
  assert.match(component, /id="mobile-care-drawer"/);
  assert.match(component, /id="mobile-missions-drawer"/);
  assert.doesNotMatch(component, /id="mobile-inventory-drawer"/);
  assert.doesNotMatch(component, /mobilePanel === "inventory"/);
  assert.match(mobile, /\.needs\s*\{[^}]*grid-template-columns:\s*repeat\(5, minmax\(0, 1fr\)\)/s);
  assert.match(mobile, /\.actionsPanel\s*\{[^}]*transform:\s*translateY\(104%\)/s);
  assert.match(mobile, /\.lowerDeck,\s*\.featurePanel,\s*\.legacyFocus\s*\{[^}]*transform:\s*translateY\(104%\)/s);
  assert.match(mobile, /\.mobileDrawerOpen\s*\{[^}]*transform:\s*translateY\(0\)/s);
  assert.match(mobile, /\.dashboardPage\s*\{[^}]*height:\s*100dvh[^}]*overflow:\s*clip/s);
  assert.match(mobile, /\.dashboardShell\s*\{[^}]*height:\s*100%[^}]*overflow:\s*clip/s);
  assert.match(mobile, /\.mobileGameControls\s*\{[^}]*grid-template-columns:\s*repeat\(5, minmax\(0, 1fr\)\)/s);
  assert.match(mobile, /\.mobilePetIdentity\s*\{[^}]*display:\s*flex/s);
  assert.match(mobile, /\.mobileGameControls\s*\{[^}]*bottom:\s*0/s);
  assert.match(mobile, /\.mobileGrowthBar\s*\{[^}]*position:\s*absolute[^}]*bottom:\s*64px[^}]*height:\s*52px/s);
  assert.match(mobile, /\.petMover\s*\{[^}]*bottom:\s*calc\(var\(--mobile-theme-ground-bottom, var\(--theme-ground-bottom, 8%\)\) \+ 3px - var\(--mobile-pet-bottom-offset, 0px\)\)/s);
  assert.match(mobile, /\.guidedTutorialLayer\s*\{[^}]*height:\s*100dvh[^}]*overflow:\s*clip/s);
  assert.match(mobile, /\.guidedTutorialCoach\s*\{[^}]*max-height:\s*min\(46dvh,[^;]+;[^}]*scrollbar-width:\s*none/s);
  assert.match(mobile, /\.guidedTutorialCoach footer\s*\{[^}]*grid-template-columns:\s*1\.18fr 1fr 1fr/s);
  assert.match(component, /tutorialCoachRef\.current\.scrollTop = 0/);
  assert.match(component, /className=\{styles\.mobileDenOverview\}/);
  assert.doesNotMatch(component, /Famiglio-del-Nexus-Android|<strong>APK<\/strong>/);
  assert.match(styles, /\.mobileDrawerGuide\s*\{[^}]*right:\s*3\.65rem;[^}]*left:\s*auto/s);
  assert.match(styles, /\.mobileDenOverview\s*>\s*\.mobileUtilityActions\s*\{[^}]*grid-template-columns:\s*repeat\(5,/s);
  assert.match(styles, /\.needData\s*>\s*div:first-child\s*\{[^}]*flex-direction:\s*column/s);
  assert.match(component, /function openGuidedTutorial\(kind: TutorialKind\)/);
  assert.match(component, /function openTutorialForCurrentSection\(\)/);
  assert.match(component, /showContextualTip\(view === "progress" \? "missions"/);
  assert.match(component, /showContextualTip\(panel === "missions" \? "missions" : panel\)/);
  for (const target of ["outside-intro", "outside-options", "shop-tabs", "shop-content", "missions-tabs", "mission-list"]) {
    assert.match(component, new RegExp(`data-tutorial-target="${target}"`));
  }
  assert.match(mobile, /\.cloudStatus\s*\{[^}]*display:\s*none/s);
  assert.doesNotMatch(component, /onTouchStart=\{beginDrawerSwipe\}/);
  assert.doesNotMatch(component, /className=\{styles\.denSlotPicker\}/);
});

test("habitat Shop supports preview, Nexus coins and protected paid checkout", () => {
  const component = readFileSync(join(process.cwd(), "components", "NexusFamiliarExperience.tsx"), "utf8");
  assert.match(component, /purchaseFamiliarThemeWithCoins/);
  assert.match(component, /setPreviewThemeId/);
  assert.match(component, /window\.setTimeout\(\(\) => \{[\s\S]*setPreviewThemeId\(null\)[\s\S]*8_000/s);
  assert.match(component, /Anteprima temporanea · nessun acquisto effettuato/);
  assert.match(component, /function openDashboardView[\s\S]*setPreviewThemeId\(null\)/s);
  assert.match(component, /offer\.priceCoins/);
  assert.match(component, /offer\.priceCents/);
  assert.match(component, /async function openPaidFamiliarCheckout/);
  assert.match(component, /productType: "merchandise"/);
  assert.match(component, /window\.location\.assign\(payload\.checkoutUrl\)/);
  assert.match(component, /paidOwned \? "Disponibile" : "Acquista"/);
  assert.doesNotMatch(component, /offer\.decorationId/);
  assert.match(component, /setPreviewEquippedGadgetId\(offer\.id\)/);
  assert.doesNotMatch(component, /setPreviewGadgetId/);
  assert.match(component, /animationPreview \? "Seleziona look" : "Prova sul Famiglio"/);
  assert.match(component, /previewEquippedGadgetId === offer\.id \? "Look selezionato"/);
  assert.match(component, /visibleGadgetId = previewEquippedGadgetId \?\?/);
});

test("walking frames are impossible while the Famiglio is stationary", () => {
  const component = readFileSync(join(process.cwd(), "components", "NexusFamiliarExperience.tsx"), "utf8");
  assert.match(component, /const \[isMoving, setIsMoving\] = useState\(false\)/);
  assert.match(component, /visibleBehavior: FamiliarBehaviorName = isMoving \? "walk" : behavior === "walk" \? "idle" : behavior/);
  assert.match(component, /movementTimer\.current = window\.setTimeout\(\(\) => \{[\s\S]*setIsMoving\(false\);[\s\S]*setBehavior\("idle"\)/s);
  assert.match(component, /familiarWalkFrameDuration\(appearance\.family\)/);
});

test("every habitat has its own ground line and safe walking corridor", () => {
  const cycle = readFileSync(join(process.cwd(), "lib", "nexusDayCycle.ts"), "utf8");
  const styles = readFileSync(join(process.cwd(), "components", "NexusFamiliarExperience.module.css"), "utf8");
  assert.equal(FAMILIAR_HABITAT_THEMES.length, 5);
  assert.ok(FAMILIAR_HABITAT_THEMES.every((theme) => theme.groundLinePercent > 0 && theme.groundLinePercent < 100));
  assert.ok(FAMILIAR_HABITAT_THEMES.every((theme) => theme.mobileGroundLinePercent > 0 && theme.mobileGroundLinePercent < 100));
  assert.ok(FAMILIAR_HABITAT_THEMES.every((theme) => theme.walkBounds[0] < theme.walkBounds[1]));
  assert.match(cycle, /id: "cucina-alchemica"[\s\S]*groundLinePercent: 76/s);
  assert.match(styles, /bottom:\s*calc\(var\(--theme-ground-bottom, 8%\) \+ 6px - var\(--pet-bottom-offset, 0px\)\)/);
  assert.match(styles, /bottom:\s*calc\(var\(--mobile-theme-ground-bottom, var\(--theme-ground-bottom, 8%\)\) \+ 3px - var\(--mobile-pet-bottom-offset, 0px\)\)/);
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
    join(process.cwd(), "components", "NexusFamiliarExperience.tsx"),
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

test("mobile adoption is a dedicated single-familiar screen and works on insecure LAN previews", () => {
  const component = readFileSync(join(process.cwd(), "components", "NexusFamiliarExperience.tsx"), "utf8");
  const styles = readFileSync(join(process.cwd(), "components", "NexusFamiliarExperience.module.css"), "utf8");
  const mobile = styles.slice(styles.indexOf("@media (max-width: 640px)"));
  assert.match(component, /function createFamiliarId\(\)/);
  assert.match(component, /typeof crypto\.randomUUID === "function"/);
  assert.doesNotMatch(component, /createNexusFamiliar\(new Date\(\), crypto\.randomUUID\(\)/);
  assert.match(component, /function isInsecureLanPreview\(\)/);
  assert.match(component, /if \(isInsecureLanPreview\(\)\) \{/);
  assert.match(component, /className=\{styles\.mobileAdoption\}/);
  assert.match(component, /className=\{styles\.mobileSpotlight\}/);
  assert.match(component, /className=\{styles\.mobileFamiliarPicker\}/);
  assert.match(component, /id="mobile-starter-name"/);
  assert.match(component, /className=\{styles\.mobileAdoptButton\}/);
  assert.match(component, /get\("anteprima-selezione"\) === "1"/);
  assert.match(component, /if \(!hydrated \|\| adoptionPreviewMode\) return;/);
  assert.match(component, /state && !adoptionPreviewMode/);
  assert.match(mobile, /\.adoptionStage, \.starterProfile\s*\{[^}]*display:\s*none/s);
  assert.match(mobile, /\.mobileAdoption\s*\{[^}]*display:\s*grid/s);
  assert.match(mobile, /\.mobileFamiliarPicker\s*\{[^}]*display:\s*flex[^}]*overflow-x:\s*auto[^}]*scroll-snap-type:\s*x mandatory/s);
  assert.match(mobile, /\.mobilePickerSprite\s*\{[^}]*--display-size:\s*calc\(78px \* var\(--species-compact-scale, 1\)\)/s);
  assert.match(component, /src="\/famiglio\/scenes\/prato-celeste-selezione-v1\.png"/);
  assert.match(mobile, /\.mobileSpotlightBackdrop\s*\{[^}]*object-fit:\s*cover[^}]*object-position:\s*center/s);
  assert.match(mobile, /\.mobileSpotlightSprite\s*\{[^}]*bottom:\s*calc\(16% - var\(--mobile-spotlight-bottom-offset, 0px\)\)[^}]*left:\s*50%/s);
});

test("local preview can restore every tutorial without resetting the Famiglio", () => {
  const component = readFileSync(join(process.cwd(), "components", "NexusFamiliarExperience.tsx"), "utf8");
  assert.match(component, /get\("ripristina-tutorial"\) === "1"/);
  assert.match(component, /removeItem\(FAMILIAR_TUTORIAL_STORAGE_KEY\)/);
  assert.match(component, /Object\.keys\(FAMILIAR_CONTEXTUAL_TUTORIALS\)/);
  assert.match(component, /removeItem\(`\$\{FAMILIAR_CONTEXT_TIP_STORAGE_PREFIX\}\$\{kind\}`\)/);
  assert.match(component, /previewParameters\.delete\("ripristina-tutorial"\)/);
  assert.doesNotMatch(component, /removeItem\(STORAGE_KEY\)[\s\S]{0,250}ripristina-tutorial/);
});

test("mobile adoption keeps one centered niche and scrolls its complete form inside the stage", () => {
  const component = readFileSync(join(process.cwd(), "components", "NexusFamiliarExperience.tsx"), "utf8");
  const styles = readFileSync(join(process.cwd(), "components", "NexusFamiliarExperience.module.css"), "utf8");
  const mobile = styles.slice(styles.indexOf("@media (max-width: 640px)"));
  assert.match(styles, /\.adoptionPage\s*\{[^}]*height:\s*var\(--stage-viewport-height, calc\(100svh - 84px\)\)[^}]*overflow:\s*hidden/s);
  assert.match(styles, /:global\(html\):has\(\.adoptionPage\)[^\n]*overflow:\s*hidden !important/);
  assert.match(styles, /\.adoptionStage\s*\{[^}]*height:\s*100%[^}]*aspect-ratio:\s*1746 \/ 901/s);
  assert.match(mobile, /\.adoptionPage\s*\{[^}]*height:\s*var\(--stage-viewport-height, 100dvh\)[^}]*overflow-y:\s*auto/s);
  assert.match(component, /FAMILIAR_MOBILE_SPOTLIGHT_SIZES\[familiarDisplayFamily\(selectedFamily\.family\)\]/);
  assert.match(component, /const adoptionDimensions = FAMILIAR_STAGE_SIZES\[familiarDisplayFamily\(candidate\.family\)\]/);
  assert.doesNotMatch(component, /candidate\.adoption\.displaySize \/ 15\.36/);
  assert.doesNotMatch(component, /mobileNicheBackgroundPosition/);
  assert.match(mobile, /\.mobileFamiliarPicker button\s*\{[^}]*flex:\s*0 0 112px[^}]*height:\s*112px/s);
  assert.match(component, /ref=\{dashboardPageRef\}[\s\S]*"--stage-viewport-height"/s);
});

test("every species keeps a fixed optical ground anchor through every action", () => {
  const component = readFileSync(join(process.cwd(), "components", "NexusFamiliarExperience.tsx"), "utf8");
  const legacy = readFileSync(join(process.cwd(), "components", "NexusFamiliarLegacy.tsx"), "utf8");
  const legacyStyles = readFileSync(join(process.cwd(), "components", "NexusFamiliarLegacy.module.css"), "utf8");
  assert.match(component, /const groundedActionRow = actionRow === null \? null : effectiveActionRow\(appearance, actionRow\)/);
  assert.match(component, /familiarOpticalBottomRatio\(appearance\.family, visibleBehavior, groundedActionRow\)/);
  assert.doesNotMatch(component, /poseCompensation/);
  assert.match(component, /"--pet-bottom-offset"/);
  assert.match(component, /"--mobile-pet-bottom-offset"/);
  assert.doesNotMatch(component, /const carePose = actionRow !== null/);
  assert.doesNotMatch(component, /--mobile-ground-shift/);
  assert.match(component, /\.\.\.petStageStyle/);
  assert.match(component, /familiarOpticalBottomRatio\(appearance\.family, "idle", null\)/);
  assert.match(component, /familiarGroundStyle=\{legacyGroundStyle\}/);
  assert.match(legacy, /style=\{familiarGroundStyle\}/);
  assert.match(component, /FAMILIAR_PEDESTAL_SIZES/);
  assert.match(component, /"--personality-pet-size"/);
  assert.match(component, /"--personality-mobile-pet-size"/);
  assert.match(legacyStyles, /bottom:\s*calc\(21\.5% - var\(--personality-pet-bottom-offset, 0px\)\)/);
  assert.match(legacyStyles, /top:\s*calc\(47\.2vw - var\(--personality-mobile-pet-size, 96px\) \+ var\(--personality-mobile-pet-bottom-offset, 0px\)\)/);
});

test("an authenticated LoreWise ID is checked on LAN and clears the guest gate", () => {
  const component = readFileSync(join(process.cwd(), "components", "NexusFamiliarExperience.tsx"), "utf8");
  assert.doesNotMatch(component, /if \(localNetworkPreview\) \{\s*cloudReadyRef\.current = false;\s*setCloudStatus\("local"\);\s*return;/s);
  assert.match(component, /guestCompletedActionsRef\.current = 0;/);
  assert.match(component, /setLoreWiseIdPromptOpen\(false\)/);
  assert.match(component, /removeItem\(FAMILIAR_GUEST_ACTION_STORAGE_KEY\)/);
  assert.match(component, /removeItem\(FAMILIAR_ID_PROMPT_STORAGE_KEY\)/);
});

test("mobile diary uses only a transparent hotspot inside its illustrated page", () => {
  const styles = readFileSync(join(process.cwd(), "components", "NexusFamiliarLegacy.module.css"), "utf8");
  const mobile = styles.slice(styles.indexOf("@media (max-width: 640px)"));
  assert.match(mobile, /\.diaryPageLauncher\s*\{[^}]*top:\s*25\.5vw[^}]*left:\s*21\.5%[^}]*width:\s*34%[^}]*overflow:\s*hidden/s);
  assert.match(mobile, /\.diaryPageLauncher\s*\{\s*padding:\s*0;\s*background:\s*transparent/);
});

test("the familiar visibly grows through level 50 without changing its artwork", () => {
  const component = readFileSync(join(process.cwd(), "components", "NexusFamiliarExperience.tsx"), "utf8");
  const styles = readFileSync(join(process.cwd(), "components", "NexusFamiliarExperience.module.css"), "utf8");
  assert.match(component, /familiarGrowthScale\(state\?\.level \?\? 1\)/);
  assert.match(component, /"--growth-scale": String\(growthScale\)/);
  assert.match(component, /dimensions\.desktop \* growthScale \* opticalBottomRatio/);
  assert.match(component, /dimensions\.mobile \* growthScale \* opticalBottomRatio/);
  assert.match(styles, /scale\(var\(--growth-scale, 1\)\)/);
  assert.match(component, /className=\{styles\.petMover\} data-moving=\{isMoving\}/);
  assert.match(styles, /\.petMover\s*\{[^}]*transition:\s*none/);
  assert.match(styles, /\.petMover\[data-moving="true"\]\s*\{[^}]*transition:\s*left var\(--walk-duration\) linear/);
  assert.match(component, /function openDashboardView[\s\S]*view !== "den"\) stopAutonomousWalk\(\)/);
  assert.match(component, /activeDashboardView !== "den" \|\| mobilePanel !== null/);
  assert.doesNotMatch(styles, /\.petMover\s*\{[^}]*transition:[^;}]*(?:transform|bottom)/);
});

test("shop is divided into environments, ten complete looks and premium companions", () => {
  const component = readFileSync(join(process.cwd(), "components", "NexusFamiliarExperience.tsx"), "utf8");
  const styles = readFileSync(join(process.cwd(), "components", "NexusFamiliarExperience.module.css"), "utf8");
  assert.match(component, /label: "Ambienti"/);
  assert.match(component, /label: "Look"/);
  assert.match(component, /label: "Premium"/);
  assert.match(component, /className=\{styles\.shopSectionTabs\}/);
  assert.match(component, /activeShopSection\.kinds\.some/);
  assert.match(component, /Dieci look completi/);
  assert.match(component, /Prova sul Famiglio/);
  assert.doesNotMatch(component, /COMING <em>SOON<\/em>/);
  assert.match(styles, /\.shopGrid\s*\{/);
});

test("attendance confirms the saved return and a daily wish becomes visible in the den", () => {
  const experience = readFileSync(join(process.cwd(), "components", "NexusFamiliarExperience.tsx"), "utf8");
  const rituals = readFileSync(join(process.cwd(), "components", "NexusFamiliarRituals.tsx"), "utf8");
  const ritualStyles = readFileSync(join(process.cwd(), "components", "NexusFamiliarRituals.module.css"), "utf8");

  assert.match(rituals, /wasClaimed \|\| !attendance\.claimedToday/);
  assert.match(rituals, /role="status" aria-live="polite"/);
  assert.match(ritualStyles, /\.attendanceConfirmation\s*\{/);
  assert.match(experience, /function followDailyWish[\s\S]*openDashboardView\("den"\)[\s\S]*setMobilePanel\(null\)[\s\S]*setPendingWishAction/);
  assert.match(experience, /pendingWishAction[\s\S]*activeDashboardView !== "den"[\s\S]*requestCare\(command\)/);
});

test("fox eating uses its complete pixel-art action row with the bowl on the floor", () => {
  const component = readFileSync(join(process.cwd(), "components", "NexusFamiliarExperience.tsx"), "utf8");
  const styles = readFileSync(join(process.cwd(), "components", "NexusFamiliarExperience.module.css"), "utf8");
  assert.match(component, /function ActionSprite/);
  assert.match(component, /data-family=\{appearance\.family\}/);
  assert.match(component, /setPosition\(50\);[\s\S]*setFlipped\(false\);[\s\S]*setActionRow\(row\)/);
  assert.doesNotMatch(component, /appearance\.family === "Volpe" && row === ACTION_ROW\.food/);
  assert.doesNotMatch(styles, /\.feedingBowl\s*\{/);
  assert.match(component, /effectiveActionRow\(appearance, row\)/);
  assert.match(component, /ACTION_VFX_ROWS/);
  assert.match(component, /function ActionVfx/);
  assert.match(styles, /\.actionVfx\s*\{[^}]*bottom:\s*var\(--action-ground-offset, 0%\)[^}]*background-image:\s*url\("\/famiglio\/sprites\/famiglio-oggetti-vfx-50px-v4-final\.png"\)[^}]*image-rendering:\s*pixelated[^}]*transform:\s*translate\(-50%, var\(--vfx-floor-shift\)\)/s);
  assert.match(component, /--action-ground-offset/);
  assert.match(styles, /data-action="food"[^}]*--vfx-floor-shift:\s*42%[^}]*left:\s*116%/);
  assert.match(styles, /data-action="soap"[^}]*--vfx-floor-shift:\s*36%/);
  assert.match(styles, /data-action="toy"[^}]*--vfx-floor-shift:\s*42%/);
  assert.match(styles, /data-action="medicine"[^}]*--vfx-floor-shift:\s*38%/);
  assert.match(styles, /data-family="Gallina"[^}]*left:\s*118%/);
  assert.match(styles, /data-family="Gallina"\]\[data-action="food"\][^}]*left:\s*122%/);
  assert.match(component, /<ActionSprite appearance=\{dressedAppearance\} row=\{actionRow\}/);
});

test("professional eating cycles use their declared frame count and a pixel-art floor bowl", () => {
  const component = readFileSync(join(process.cwd(), "components", "NexusFamiliarExperience.tsx"), "utf8");
  const styles = readFileSync(join(process.cwd(), "components", "NexusFamiliarExperience.module.css"), "utf8");
  assert.match(component, /function actionFrameCount\(appearance: FamiliarAppearance, logicalRow: number\)/);
  assert.match(component, /appearance\.actionFrameCounts\?\.\[action\] \?\? appearance\.columns/);
  assert.match(component, /ACTION_VFX_ROWS:[^=]*= \{ food: 0, soap: 1, toy: 2, medicine: 3 \}/);
  assert.match(component, /\(current \+ 1\) % 8/);
  assert.match(component, /appearance\.actionProps\?\.includes\(action\)/);
  assert.match(component, /Prova sul Famiglio/);
  assert.doesNotMatch(component, /previewGadgetId|previewLookMotion/);
  assert.doesNotMatch(component, /GADGET_COMPATIBLE_FAMILIES/);
  assert.match(component, /<Sprite appearance=\{appearance\} row=\{spriteRow\} frameCount=\{frameCount\}/);
  assert.match(component, /actionFrameCount\(appearance, row\) \+ 120/);
  assert.match(styles, /data-family="Coniglio"[^}]*width:\s*200px/);
  assert.match(styles, /data-family="Tartaruga"[^}]*[\s\S]*data-family="Gallina"[^}]*[\s\S]*data-family="Pappagallo"[^}]*width:\s*200px/);
  assert.match(styles, /data-family="Orso"[^}]*width:\s*220px/);
  assert.match(styles, /@media \(max-width: 640px\)[\s\S]*data-family="Coniglio"[^}]*width:\s*175px/);
  assert.match(styles, /@media \(max-width: 640px\)[\s\S]*data-family="Tartaruga"[^}]*[\s\S]*data-family="Gallina"[^}]*[\s\S]*data-family="Pappagallo"[^}]*width:\s*170px/);
  assert.match(styles, /@media \(max-width: 640px\)[\s\S]*data-family="Orso"[^}]*width:\s*190px/);
});

test("sleep Zs appear only during a rest explicitly requested by the player", () => {
  const component = readFileSync(join(process.cwd(), "components", "NexusFamiliarExperience.tsx"), "utf8");
  assert.match(component, /const sleeping = manualRest && activeCare === "rest"/);
  assert.match(component, /\{sleeping && actionRow === null && behavior === "rest" \?/);
  assert.doesNotMatch(component, /\{manualRest && actionRow === null && behavior === "rest" \?/);
});

test("local animation preview lowers every visible need without changing the saved Famiglio", () => {
  const component = readFileSync(join(process.cwd(), "components", "NexusFamiliarExperience.tsx"), "utf8");
  assert.match(component, /const ANIMATION_PREVIEW_NEEDS: Record<FamiliarNeedKey, number>/);
  assert.match(component, /const visibleNeeds = animationPreview \? ANIMATION_PREVIEW_NEEDS : state\?\.needs/);
  assert.match(component, /value=\{visibleNeeds\[key\]\}/);
  assert.doesNotMatch(component, /updateFamiliarState\([^)]*ANIMATION_PREVIEW_NEEDS/);
  assert.match(component, /setAnimationPreview\(isLocalPreviewHost\(\) && previewParameter === "1"\)/);
  assert.match(component, /premiumAppearance && animationPreview[\s\S]*Prova gratis/);
  assert.match(component, /setPreviewFamiliarId\(premiumAppearance\.id\)/);
  assert.match(component, /const appearance = useMemo\(\(\) => familiarAppearance\(previewFamiliarId \?\?/);
});

test("species and compact poses keep natural desktop and mobile proportions", () => {
  const component = readFileSync(join(process.cwd(), "components", "NexusFamiliarExperience.tsx"), "utf8");
  const styles = readFileSync(join(process.cwd(), "components", "NexusFamiliarExperience.module.css"), "utf8");
  assert.deepEqual(FAMILIAR_STAGE_SIZES.Gallina, { desktop: 72, mobile: 48 });
  assert.deepEqual(FAMILIAR_STAGE_SIZES.Pappagallo, { desktop: 76, mobile: 50 });
  assert.deepEqual(FAMILIAR_STAGE_SIZES.Orso, { desktop: 270, mobile: 190 });
  assert.deepEqual(FAMILIAR_PEDESTAL_SIZES.Gallina, { desktop: 78, mobile: 32 });
  assert.deepEqual(FAMILIAR_PEDESTAL_SIZES.Pappagallo, { desktop: 84, mobile: 34 });
  assert.deepEqual(FAMILIAR_PEDESTAL_SIZES.Orso, { desktop: 320, mobile: 150 });
  assert.ok(FAMILIAR_COMPACT_SCALE.Orso > FAMILIAR_COMPACT_SCALE.Gallina * 3);
  assert.ok(FAMILIAR_COMPACT_SCALE.Orso > FAMILIAR_COMPACT_SCALE.Pappagallo * 3);
  assert.match(component, /FAMILIAR_MOBILE_SPOTLIGHT_SIZES\[familiarDisplayFamily\(selectedFamily\.family\)\]/);
  assert.match(component, /data-family=\{appearance\.family\}/);
  assert.doesNotMatch(component, /poseCompensation/);
  assert.match(component, /"--growth-scale": String\(growthScale\)/);
  assert.match(styles, /\.heroSprite\s*\{\s*--display-size:\s*var\(--mobile-pet-size, 150px\)/);
  assert.match(styles, /\.shopFamiliarSprite\s*\{\s*--display-size:\s*calc\(92px \* var\(--species-compact-scale, 1\)\)/);
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

test("adoption and return messages respect the companion name already chosen", () => {
  const component = readFileSync(join(process.cwd(), "components", "NexusFamiliarExperience.tsx"), "utf8");
  assert.match(component, /`\$\{chosenName\} è entrato nella tua tana\. Il vostro legame comincia qui\.`/);
  assert.match(component, /`\$\{restored\.name\} ti dà il bentornato a casa\.`/);
  assert.match(component, /className=\{styles\.mobileMessage\} role="status"/);
  assert.doesNotMatch(component, /Ora scegli il suo nome/);
});
