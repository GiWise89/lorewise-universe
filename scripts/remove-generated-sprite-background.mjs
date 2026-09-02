import sharp from "sharp";

const [, , ...files] = process.argv;
if (files.length === 0) throw new Error("Indica almeno un PNG da ripulire.");
const floodThreshold = Number(process.env.FAMILIAR_BACKGROUND_THRESHOLD ?? 18);

function colorDistance(data, channels, first, second) {
  const a = first * channels;
  const b = second * channels;
  const dr = data[a] - data[b];
  const dg = data[a + 1] - data[b + 1];
  const db = data[a + 2] - data[b + 2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

for (const file of files) {
  const image = sharp(file).ensureAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const pixels = info.width * info.height;
  const outside = new Uint8Array(pixels);
  const queue = new Uint32Array(pixels);
  let head = 0;
  let tail = 0;

  function seed(index) {
    if (outside[index]) return;
    outside[index] = 1;
    queue[tail++] = index;
  }

  for (let x = 0; x < info.width; x += 1) {
    seed(x);
    seed((info.height - 1) * info.width + x);
  }
  for (let y = 1; y < info.height - 1; y += 1) {
    seed(y * info.width);
    seed(y * info.width + info.width - 1);
  }

  while (head < tail) {
    const current = queue[head++];
    const x = current % info.width;
    const y = Math.floor(current / info.width);
    const neighbours = [
      x > 0 ? current - 1 : -1,
      x + 1 < info.width ? current + 1 : -1,
      y > 0 ? current - info.width : -1,
      y + 1 < info.height ? current + info.width : -1,
    ];
    for (const next of neighbours) {
      if (next < 0 || outside[next]) continue;
      const alpha = data[next * info.channels + 3];
      if (alpha === 0 || colorDistance(data, info.channels, current, next) <= floodThreshold) {
        outside[next] = 1;
        queue[tail++] = next;
      }
    }
  }

  for (let index = 0; index < pixels; index += 1) {
    if (outside[index]) data[index * info.channels + 3] = 0;
  }
  await sharp(data, { raw: info }).png().toFile(`${file}.clean.png`);
  console.log(`${file}.clean.png`);
}
