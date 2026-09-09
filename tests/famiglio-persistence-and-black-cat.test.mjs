import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import sharp from "sharp";

const root = process.cwd();

test("the black cat uses the redrawn high-definition battle atlas in every growth stage", async () => {
  const arena = await readFile(path.join(root, "components", "FamiglioCombatArena.tsx"), "utf8");
  assert.match(arena, /familiarId === "cat" && colorVariant === "black"/);
  assert.match(arena, /battle-v3\/variants\/black/);
  for (const stage of ["cucciolo", "giovane", "adulto"]) {
    for (const pose of ["idle", "run", "attack", "magic", "guard", "hit", "victory", "exhausted"]) {
      const file = path.join(root, "public", "famiglio", "rebuild", "collection", "cat", "growth", stage, "battle-v3", "variants", "black", `${pose}.png`);
      const metadata = await sharp(file).metadata();
      assert.equal(metadata.width, 3840, `${stage}/${pose}: atlas width`);
      assert.equal(metadata.height, 320, `${stage}/${pose}: atlas height`);
      assert.equal(metadata.hasAlpha, true, `${stage}/${pose}: transparent background`);
    }
  }
});

test("first-access guides are remembered when they open and remain manually available", async () => {
  const guide = await readFile(path.join(root, "components", "FamiglioGuideOverlay.tsx"), "utf8");
  const automaticOpen = guide.slice(guide.indexOf("const forceTutorial"), guide.indexOf("const request"));
  assert.match(automaticOpen, /seen\.add\(section\)/);
  assert.match(automaticOpen, /localStorage\.setItem\(SEEN_GUIDES_KEY/);
  assert.match(guide, /className=\{styles\.launcher\}/);
});

test("attendance prompts once per Rome day and every victory completes the weekly battle step", async () => {
  const rebuild = await readFile(path.join(root, "components", "FamiglioNexusRebuild.tsx"), "utf8");
  const arena = await readFile(path.join(root, "components", "FamiglioCombatArena.tsx"), "utf8");
  assert.match(rebuild, /ATTENDANCE_PROMPT_KEY_PREFIX/);
  assert.match(rebuild, /localStorage\.getItem\(promptKey\) === "shown"/);
  assert.match(rebuild, /localStorage\.setItem\(promptKey, "shown"\)/);
  assert.match(rebuild, /onBattleVictory=\{\(\) => setHomeState/);
  assert.match(rebuild, /recordFamiliarWeeklyStep\(current\.weeklyLoop, "combat"/);
  assert.match(arena, /battle\?\.outcome === "victory"[^\n]+onBattleVictory\?\.\(battle\.id\)/);
});
