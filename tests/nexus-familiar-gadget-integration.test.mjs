import assert from "node:assert/strict";
import { join } from "node:path";
import test from "node:test";
import sharp from "sharp";
import { ALL_FAMILIARS, familiarAppearance, familiarPalettes } from "../lib/nexusFamiliarCatalog.ts";
import { FAMILIAR_GADGETS } from "../lib/nexusFamiliarGadgets.ts";

const appearances = ALL_FAMILIARS.flatMap((familiar) => familiarPalettes(familiar.id).map((palette) => familiarAppearance(palette.id)));

async function raw(relativePath, width, height) {
  let image = sharp(join(process.cwd(), "public", relativePath.replace(/^\//, ""))).ensureAlpha();
  if (width && height) image = image.resize(width, height, { fit: "fill", kernel: "nearest" });
  return image.raw().toBuffer({ resolveWithObject: true });
}

async function assertIntegrated(sourcePath, outputPath, label) {
  const output = await raw(outputPath);
  const source = await raw(sourcePath, output.info.width, output.info.height);
  assert.ok(output.info.width > 0 && output.info.height > 0, `${label} has an invalid canvas`);
  let changedBodyPixels = 0;
  for (let offset = 0; offset < source.data.length; offset += 4) {
    if (source.data[offset + 3] < 20) continue;
    if (source.data[offset] !== output.data[offset] || source.data[offset + 1] !== output.data[offset + 1] || source.data[offset + 2] !== output.data[offset + 2]) changedBodyPixels += 1;
  }
  assert.ok(changedBodyPixels > 0, `${label} is floating instead of being redrawn into the pet`);
}

test("every gadget redraw is integrated into every pet and every motion sheet", async () => {
  for (const appearance of appearances) for (const gadget of FAMILIAR_GADGETS) {
    const root = `/famiglio/gadgets/${gadget.id}/${appearance.id}`;
    await assertIntegrated(appearance.spritePath, `${root}/actions.png`, `${gadget.id}/${appearance.id}/actions`);
    const checked = new Set();
    for (const sequence of Object.values(appearance.behaviors)) {
      if (checked.has(sequence.spritePath)) continue;
      checked.add(sequence.spritePath);
      const file = sequence.spritePath.slice(sequence.spritePath.lastIndexOf("/") + 1);
      await assertIntegrated(sequence.spritePath, `${root}/${file}`, `${gadget.id}/${appearance.id}/${file}`);
    }
  }
});
