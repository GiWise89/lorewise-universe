import path from "node:path";
import { fileURLToPath } from "node:url";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const slugs = [
  "hogwarts-legacy",
  "zelda-tears-of-the-kingdom",
  "the-sims-4",
  "red-dead-redemption-2",
  "monster-hunter-wilds",
  "diablo-iv",
  "pokemon-pokopia",
];

for (const slug of slugs) {
  const dataPath = path.join(root, "data", `${slug}-guide.json`);
  const guide = JSON.parse(await readFile(dataPath, "utf8"));
  if (guide.sections.length !== 6) throw new Error(`${slug}: sono richieste esattamente 6 sezioni`);

  const sourcePath = path.join(root, "assets", "atlas-icon-sources", `${slug}-imagegen-v1.png`);
  const metadata = await sharp(sourcePath).metadata();
  if (metadata.width !== 1536 || metadata.height !== 1024) {
    throw new Error(`${slug}: la tavola ImageGen deve misurare 1536x1024`);
  }

  const publicRoot = path.join(root, "public", "atlas", slug);
  const iconRoot = path.join(publicRoot, "section-icons-imagegen-v1");
  await mkdir(iconRoot, { recursive: true });

  await sharp(sourcePath)
    .webp({ quality: 90, effort: 5 })
    .toFile(path.join(publicRoot, "guide-section-icons-v1.webp"));

  for (const [index, section] of guide.sections.entries()) {
    const column = index % 3;
    const row = Math.floor(index / 3);
    const filename = `${String(index + 1).padStart(2, "0")}-${section.id}.webp`;
    await sharp(sourcePath)
      .extract({ left: column * 512, top: row * 512, width: 512, height: 512 })
      .resize(440, 440, { fit: "contain" })
      .webp({ quality: 91, effort: 5 })
      .toFile(path.join(iconRoot, filename));

    section.generatedIcon = {
      src: `/atlas/${slug}/section-icons-imagegen-v1/${filename}`,
      alt: `Icona illustrata della sezione ${section.label}`,
      caption: `${section.label} · icona tematica generata con ImageGen`,
    };
  }

  await writeFile(dataPath, `${JSON.stringify(guide, null, 2)}\n`, "utf8");
  console.log(`${guide.game}: 6 icone tematiche ImageGen installate.`);
}
