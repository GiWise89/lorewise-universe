import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const projectRoot = process.cwd();
const generatedRoot = "C:/Users/Luigi/.codex/generated_images/01a06408-8a28-7243-8a3e-59d40e99f53f";
const marketRoot = path.join(projectRoot, "public", "famiglio", "rebuild", "market");

await mkdir(marketRoot, { recursive: true });

const rooms = [
  ["exec-21e6b9c8-e490-4a2b-830f-3209bcd05578.png", "nora-bottega.png"],
  ["exec-da43a913-8e4b-4dfd-8983-a8088475c994.png", "mirra-emporio.png"],
  ["exec-2dd76a2e-56bd-4b5f-9607-408697e62252.png", "iris-bottega.png"],
  ["exec-d26dd474-6d89-4487-8220-bb1d33e143e7.png", "ronin-padiglione.png"],
  ["exec-5c07f066-73cd-4ae7-a106-8a2247bd9259.png", "lich-reliquiario.png"],
];

for (const [source, destination] of rooms) {
  await sharp(path.join(generatedRoot, source))
    .resize(960, 640, { fit: "contain", background: { r: 20, g: 12, b: 30, alpha: 1 } })
    .png()
    .toFile(path.join(marketRoot, destination));
}

const merchants = [
  ["exec-18e8bcfe-9149-41aa-8d11-9465bd676f3a.png", "nora-idle-v2.png"],
  ["exec-2c618c0d-abd8-4814-95e3-1ee2bf53ff21.png", "mirra-idle-v2.png"],
  ["exec-4acea2a9-4ee9-4934-b0bb-dadcd681ce6f.png", "iris-idle-v2.png"],
  ["exec-9079aa63-e54a-4a7c-85cf-29459dd7994b.png", "ronin-idle-v2.png"],
  ["exec-02df8f0f-5be0-4100-8500-35331918fb1e.png", "lich-idle-v2.png"],
];

for (const [source, destination] of merchants) {
  const input = sharp(path.join(generatedRoot, source));
  const metadata = await input.metadata();
  if (!metadata.width || !metadata.height) throw new Error(`Dimensioni mancanti: ${source}`);
  const sourceCell = Math.floor(metadata.width / 4);
  const composites = [];
  for (let frame = 0; frame < 4; frame += 1) {
    const cell = await sharp(path.join(generatedRoot, source))
      .extract({ left: frame * sourceCell, top: 0, width: sourceCell, height: metadata.height })
      .resize(220, 220, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 }, kernel: sharp.kernel.lanczos3 })
      .png()
      .toBuffer();
    composites.push({ input: cell, left: frame * 220, top: 0 });
  }
  await sharp({ create: { width: 880, height: 220, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(composites)
    .png()
    .toFile(path.join(marketRoot, destination));
}

console.log(`Preparati ${covers.length} gusci, ${rooms.length} ambienti e ${merchants.length} sprite mercante.`);
