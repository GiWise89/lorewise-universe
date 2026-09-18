import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = "public/famiglio/rebuild";
const poses = ["idle", "entrance", "run", "attack", "physical", "magic", "technique", "heal", "guard", "hit", "jump", "victory", "exhausted"];
const stages = ["cucciolo", "giovane", "adulto"];

test("ogni Famiglio usa tredici pose battle-v6 da otto frame ImageGen preservando la propria identita", async () => {
  const familiars = fs.readdirSync(path.join(root, "collection")).filter((name) => fs.existsSync(path.join(root, "collection", name, "growth")));
  assert.equal(familiars.length, 54);
  for (const id of familiars) {
    for (const stage of stages) for (const pose of poses) {
      const file = path.join(root, "collection", id, "growth", stage, "battle-v6", `${pose}.png`);
      assert.ok(fs.existsSync(file), file);
      const metadata = await sharp(file).metadata();
      assert.equal(metadata.width, 1280, file);
      assert.equal(metadata.height, 160, file);
      assert.equal(metadata.hasAlpha, true, file);
    }
  }
  const source = fs.readFileSync("components/FamiglioCombatArena.tsx", "utf8");
  assert.match(source, /battle-v6\$\{variantSegment\}\/\$\{pose\}\.png/);
});

test("tutte le varianti colore selezionabili hanno le stesse pose battle-v6 ImageGen", async () => {
  const variants = { cat: ["black", "brown", "siamese"], rabbit: ["brown", "black"], parrot: ["red", "green", "silver", "violet"] };
  for (const [id, colors] of Object.entries(variants)) for (const stage of stages) for (const color of colors) for (const pose of poses) {
    const file = path.join(root, "collection", id, "growth", stage, "battle-v6", "variants", color, `${pose}.png`);
    assert.ok(fs.existsSync(file), file);
    const metadata = await sharp(file).metadata();
    assert.equal(metadata.width, 1280, file);
    assert.equal(metadata.height, 160, file);
  }
});
