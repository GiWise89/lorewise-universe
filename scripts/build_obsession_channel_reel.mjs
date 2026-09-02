import { spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const W = 1080;
const H = 1920;
const OUTPUT_DIR = path.join(ROOT, "outputs", "lorewise-obsession-video");
const SLIDES_DIR = path.join(OUTPUT_DIR, "slides");
const TRANSITIONS_DIR = path.join(OUTPUT_DIR, "transitions-v4");
const OBSESSION_DIR = path.join(ROOT, "bozze progetti", "obsession");
const PREVIEWS_DIR = path.join(ROOT, "public", "artworks", "previews");
const OBSESSION_PUBLIC_DIR = path.join(ROOT, "public", "novita", "obsession");
const LOGO = path.join(ROOT, "public", "brand", "lorewise-universe-logo-concept-c.png");

const ffmpegArg = process.argv.find((arg) => arg.startsWith("--ffmpeg="));
if (!ffmpegArg) throw new Error("Indicare --ffmpeg=C:\\percorso\\ffmpeg.exe");
const FFMPEG = ffmpegArg.slice("--ffmpeg=".length);

const esc = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

function backgroundSvg({ accent = "#c20d1b", glow = "#5a0008", label = "LOREWISE UNIVERSE" } = {}) {
  return Buffer.from(`
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bg" cx="50%" cy="38%" r="82%">
          <stop offset="0" stop-color="${glow}"/>
          <stop offset="0.48" stop-color="#140308"/>
          <stop offset="1" stop-color="#020204"/>
        </radialGradient>
        <linearGradient id="edge" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${accent}" stop-opacity="0.95"/>
          <stop offset="0.5" stop-color="#ff695f" stop-opacity="0.18"/>
          <stop offset="1" stop-color="${accent}" stop-opacity="0.82"/>
        </linearGradient>
      </defs>
      <rect width="1080" height="1920" fill="url(#bg)"/>
      <circle cx="930" cy="210" r="420" fill="${accent}" opacity="0.07"/>
      <circle cx="70" cy="1650" r="510" fill="${accent}" opacity="0.055"/>
      <path d="M0 1850 L1080 1740 L1080 1920 L0 1920 Z" fill="${accent}" opacity="0.09"/>
      <text x="540" y="78" text-anchor="middle" fill="#f2d6d1" fill-opacity="0.56" font-family="Arial" font-size="20" font-weight="700" letter-spacing="7">${esc(label)}</text>
    </svg>
  `);
}

function cinematicShadeSvg() {
  return Buffer.from(`
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="top" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#070003" stop-opacity="0.98"/>
          <stop offset="0.54" stop-color="#070003" stop-opacity="0.22"/>
          <stop offset="1" stop-color="#070003" stop-opacity="0"/>
        </linearGradient>
        <linearGradient id="bottom" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#070003" stop-opacity="0"/>
          <stop offset="0.38" stop-color="#070003" stop-opacity="0.34"/>
          <stop offset="1" stop-color="#070003" stop-opacity="0.98"/>
        </linearGradient>
      </defs>
      <rect width="1080" height="430" fill="url(#top)"/>
      <rect y="1430" width="1080" height="490" fill="url(#bottom)"/>
      <rect width="1080" height="1920" fill="none" stroke="#de1724" stroke-opacity="0.22" stroke-width="2"/>
    </svg>
  `);
}

function textSvg(lines, { y = 200, size = 70, color = "#fff5ec", family = "Georgia", weight = 700, spacing = 12, stroke = "#090004", strokeWidth = 4, letterSpacing = 0 } = {}) {
  const normalized = Array.isArray(lines) ? lines : [lines];
  const lineHeight = size + spacing;
  const tspans = normalized.map((line, index) => `<tspan x="540" dy="${index === 0 ? 0 : lineHeight}">${esc(line)}</tspan>`).join("");
  return Buffer.from(`
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <text x="540" y="${y}" text-anchor="middle" fill="${color}" stroke="${stroke}" stroke-width="${strokeWidth}" paint-order="stroke" font-family="${family}" font-size="${size}" font-weight="${weight}" letter-spacing="${letterSpacing}">${tspans}</text>
    </svg>
  `);
}

function pillSvg(text, { y = 1500, width = 760, height = 76, fill = "#c20d1b", color = "#fff8f0", size = 31 } = {}) {
  const x = (W - width) / 2;
  return Buffer.from(`
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <rect x="${x}" y="${y}" width="${width}" height="2" fill="${fill}" fill-opacity="0.85"/>
      <text x="540" y="${y + height / 2 + 11}" text-anchor="middle" fill="${color}" font-family="Arial" font-size="${size}" font-weight="800" letter-spacing="2">${esc(text)}</text>
      <rect x="${x}" y="${y + height}" width="${width}" height="2" fill="${fill}" fill-opacity="0.38"/>
    </svg>
  `);
}

async function containedAsset(input, maxWidth, maxHeight, { background = null } = {}) {
  let pipeline = sharp(input).rotate().resize({ width: maxWidth, height: maxHeight, fit: "inside", withoutEnlargement: false });
  if (background) pipeline = pipeline.flatten({ background });
  const buffer = await pipeline.png().toBuffer();
  const meta = await sharp(buffer).metadata();
  return { buffer, width: meta.width, height: meta.height };
}

async function slideFromImage({ file, name, heading, subheading, tag, accent = "#c20d1b", imageMaxW = 900, imageMaxH = 1400, whiteCanvas = false, cleanTopRight = false }) {
  const base = sharp(backgroundSvg({ accent, glow: accent === "#c20d1b" ? "#520008" : "#25051f" }));
  const effectiveW = Math.min(W, imageMaxW + 180);
  const effectiveH = Math.min(1640, imageMaxH + 150);
  const asset = await containedAsset(file, effectiveW, effectiveH, { background: whiteCanvas ? "#ffffff" : null });
  if (cleanTopRight) {
    const patchWidth = Math.max(76, Math.round(asset.width * 0.115));
    const patchHeight = Math.max(145, Math.round(asset.height * 0.105));
    const cleanPatch = Buffer.from(`<svg width="${patchWidth}" height="${patchHeight}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#ffffff"/></svg>`);
    asset.buffer = await sharp(asset.buffer).composite([{ input: cleanPatch, left: asset.width - patchWidth, top: 0 }]).png().toBuffer();
  }
  const left = Math.round((W - asset.width) / 2);
  const top = Math.round(150 + (effectiveH - asset.height) / 2);
  const comps = [
    { input: asset.buffer, left, top },
    { input: cinematicShadeSvg(), left: 0, top: 0 },
    { input: textSvg(heading, { y: 170, size: 56, color: "#fff2e9", strokeWidth: 5, letterSpacing: 2 }), left: 0, top: 0 },
  ];
  if (subheading) comps.push({ input: textSvg(subheading, { y: 1705, size: 32, family: "Arial", color: "#f1d7d0", weight: 600, spacing: 7, strokeWidth: 3, letterSpacing: 2 }), left: 0, top: 0 });
  if (tag) comps.push({ input: pillSvg(tag, { y: 1770, width: 760, height: 62, size: 23, fill: accent }), left: 0, top: 0 });
  await base.composite(comps).jpeg({ quality: 94, chromaSubsampling: "4:4:4" }).toFile(path.join(SLIDES_DIR, name));
}

async function makeIntro() {
  const logo = await containedAsset(LOGO, 760, 520);
  await sharp(backgroundSvg({ accent: "#e11a25", glow: "#5d000a", label: "GIWISE STUDIO PRESENTA" }))
    .composite([
      { input: logo.buffer, left: Math.round((W - logo.width) / 2), top: 245 },
      { input: textSvg("UN NUOVO PROGETTO", { y: 930, size: 46, family: "Arial", color: "#efcbc5", letterSpacing: 5, strokeWidth: 3 }), left: 0, top: 0 },
      { input: textSvg("STA PRENDENDO VITA", { y: 1060, size: 73, color: "#fff5ed", spacing: 10, strokeWidth: 5 }), left: 0, top: 0 },
      { input: pillSvg("HORROR • ARTE • CINEMA", { y: 1320, width: 720, height: 78, size: 29 }), left: 0, top: 0 },
      { input: textSvg("NON DISTOGLIERE LO SGUARDO.", { y: 1575, size: 35, family: "Arial", color: "#ff8d84", letterSpacing: 2, strokeWidth: 3 }), left: 0, top: 0 },
    ])
    .jpeg({ quality: 94, chromaSubsampling: "4:4:4" })
    .toFile(path.join(SLIDES_DIR, "00-intro.jpg"));
}

async function makeObsessionPoster() {
  await slideFromImage({
    file: path.join(OBSESSION_DIR, "locandina.jpg"),
    name: "01-obsession-locandina.jpg",
    heading: "OBSESSION",
    subheading: "IL PROGETTO HORROR DEL MOMENTO",
    tag: "IN ARRIVO SU LOREWISE",
    imageTop: 250,
    imageMaxW: 820,
    imageMaxH: 1390,
  });
}

async function makeTransition() {
  await sharp(backgroundSvg({ accent: "#e11a25", glow: "#4e0008", label: "LOREWISE UNIVERSE" }))
    .composite([
      { input: textSvg(["MA OBSESSION", "È SOLO L'INIZIO."], { y: 700, size: 86, spacing: 25, color: "#fff6ef", strokeWidth: 6 }), left: 0, top: 0 },
      { input: textSvg(["CREAZIONI ORIGINALI", "E FAN ART HORROR"], { y: 1110, size: 44, spacing: 16, family: "Arial", color: "#ff8f86", letterSpacing: 3, strokeWidth: 3 }), left: 0, top: 0 },
      { input: pillSvg("ABBIAMO ANCORA MOLTO DA MOSTRARE", { y: 1450, width: 900, height: 84, size: 27 }), left: 0, top: 0 },
    ])
    .jpeg({ quality: 94, chromaSubsampling: "4:4:4" })
    .toFile(path.join(SLIDES_DIR, "07-solo-inizio.jpg"));
}

async function makeMontageSlides() {
  const items = [
    ["001", "ART THE CLOWN", "FAN ART"],
    ["020", "IL GRIDO TRA I ROVI", "CREAZIONE ORIGINALE"],
    ["007", "BART × FREDDY", "FAN ART"],
    ["041", "SCAPPA FINCHÉ PUOI", "CREAZIONE ORIGINALE"],
    ["019", "CHUCKY E ANNABELLE", "FAN ART"],
    ["052", "ECLISSI TOSSICA", "CREAZIONE ORIGINALE"],
    ["023", "GHOSTFACE", "FAN ART"],
    ["053", "RELIQUIA EXTRATERRESTRE", "CREAZIONE ORIGINALE"],
    ["026", "PENNYWISE", "FAN ART"],
    ["055", "VOTO SPEZZATO", "CREAZIONE ORIGINALE"],
    ["073", "FREDDY KRUEGER", "FAN ART"],
    ["057", "IL PREDICATORE DEL VUOTO", "CREAZIONE ORIGINALE"],
    ["045", "GHOSTFACE • URLO INFRANTO", "FAN ART"],
    ["071", "PRIMA DEL RESPIRO", "CREAZIONE ORIGINALE"],
  ];
  for (let index = 0; index < items.length; index += 1) {
    const [id, heading, tag] = items[index];
    await slideFromImage({
      file: path.join(PREVIEWS_DIR, `lw-art-${id}-preview.jpg`),
      name: `${String(8 + index).padStart(2, "0")}-montage-${id}.jpg`,
      heading,
      subheading: "DALL'ARCHIVIO HORROR LOREWISE",
      tag,
      accent: tag === "FAN ART" ? "#8c1735" : "#c20d1b",
      imageTop: 250,
      imageMaxW: 880,
      imageMaxH: 1390,
    });
  }
}

async function makeCta() {
  const logo = await containedAsset(LOGO, 720, 500);
  await sharp(backgroundSvg({ accent: "#df1723", glow: "#590008", label: "LOREWISE UNIVERSE" }))
    .composite([
      { input: logo.buffer, left: Math.round((W - logo.width) / 2), top: 190 },
      { input: textSvg("ISCRIVITI AL CANALE", { y: 890, size: 78, color: "#fff6ef", strokeWidth: 6 }), left: 0, top: 0 },
      { input: textSvg(["PER VEDERE OBSESSION", "E TANTI ALTRI PROGETTI"], { y: 1095, size: 48, family: "Arial", color: "#ffd8d1", spacing: 18, strokeWidth: 4 }), left: 0, top: 0 },
      { input: pillSvg("ENTRA NEL LOREWISE UNIVERSE", { y: 1395, width: 870, height: 92, size: 31 }), left: 0, top: 0 },
      { input: textSvg("ARTE • FAN ART • STORIE • MONDI", { y: 1650, size: 30, family: "Arial", color: "#ff9c92", letterSpacing: 3, strokeWidth: 3 }), left: 0, top: 0 },
    ])
    .jpeg({ quality: 95, chromaSubsampling: "4:4:4" })
    .toFile(path.join(SLIDES_DIR, "22-cta.jpg"));
}

async function makeAudio(file, seconds) {
  const sampleRate = 44100;
  const channels = 2;
  const samples = Math.round(sampleRate * seconds);
  const payload = Buffer.alloc(samples * channels * 2);
  let seed = 0x2f6e2b1;
  const noise = () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return (seed / 0xffffffff) * 2 - 1;
  };
  for (let i = 0; i < samples; i += 1) {
    const t = i / sampleRate;
    const fadeIn = Math.min(1, t / 0.8);
    const fadeOut = Math.min(1, (seconds - t) / 1.4);
    const envelope = Math.max(0, fadeIn * fadeOut);
    const drone = Math.sin(Math.PI * 2 * 46.25 * t) * 0.23 + Math.sin(Math.PI * 2 * 69.3 * t + 0.8) * 0.10;
    const pulsePhase = t % 1.2;
    const pulse = Math.sin(Math.PI * 2 * 92.5 * t) * Math.exp(-7 * pulsePhase) * 0.20;
    const hiss = noise() * 0.025 * (0.35 + 0.65 * Math.sin(Math.PI * t / seconds));
    const montageRush = t > 10 ? noise() * 0.035 * Math.sin(Math.PI * Math.min(1, (t - 10) / 3)) : 0;
    const value = Math.max(-1, Math.min(1, envelope * (drone + pulse + hiss + montageRush)));
    const left = Math.round(value * 32767);
    const right = Math.round(value * 0.94 * 32767);
    payload.writeInt16LE(left, i * 4);
    payload.writeInt16LE(right, i * 4 + 2);
  }
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + payload.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * channels * 2, 28);
  header.writeUInt16LE(channels * 2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(payload.length, 40);
  await writeFile(file, Buffer.concat([header, payload]));
}

async function makeStoryboard(files) {
  const chosen = files.filter((_, index) => index === 0 || index === 1 || index === 3 || index === 5 || index === 6 || index === 7 || index === 10 || index === 14 || index === 18 || index === files.length - 1);
  const thumbW = 270;
  const thumbH = 480;
  const columns = 2;
  const rows = Math.ceil(chosen.length / columns);
  const canvas = sharp({ create: { width: thumbW * columns, height: thumbH * rows, channels: 3, background: "#080307" } });
  const composites = [];
  for (let index = 0; index < chosen.length; index += 1) {
    const buffer = await sharp(path.join(SLIDES_DIR, chosen[index])).resize({ width: thumbW, height: thumbH, fit: "contain", background: "#080307" }).jpeg({ quality: 88 }).toBuffer();
    composites.push({ input: buffer, left: (index % columns) * thumbW, top: Math.floor(index / columns) * thumbH });
  }
  await canvas.composite(composites).jpeg({ quality: 91 }).toFile(path.join(OUTPUT_DIR, "storyboard-obsession-lorewise-v4.jpg"));
}

async function transitionFrame(fromFile, toFile, amount, outputFile) {
  const firstHalf = amount <= 0.5;
  const local = firstHalf ? amount * 2 : (amount - 0.5) * 2;
  const eased = 0.5 - 0.5 * Math.cos(Math.PI * local);
  const darkness = firstHalf ? eased * 0.93 : (1 - eased) * 0.93;
  const source = firstHalf ? fromFile : toFile;
  const sweepProgress = 0.5 - 0.5 * Math.cos(Math.PI * amount);
  const sweepX = Math.round(-420 + (W + 840) * sweepProgress);
  const sweepOpacity = Math.sin(Math.PI * amount) * 0.22;
  const sweep = Buffer.from(`
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="s" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff1b2c" stop-opacity="0"/><stop offset="0.5" stop-color="#ff5260" stop-opacity="${sweepOpacity}"/><stop offset="1" stop-color="#ff1b2c" stop-opacity="0"/></linearGradient></defs>
      <rect width="${W}" height="${H}" fill="#030002" fill-opacity="${darkness}"/>
      <path d="M${sweepX - 210} 0 L${sweepX + 60} 0 L${sweepX + 460} ${H} L${sweepX + 160} ${H} Z" fill="url(#s)"/>
    </svg>
  `);
  await sharp(source).composite([{ input: sweep }]).jpeg({ quality: 92, chromaSubsampling: "4:2:0" }).toFile(outputFile);
}

async function buildSmoothConcat(slides) {
  await mkdir(TRANSITIONS_DIR, { recursive: true });
  const transitionFrames = 10;
  const frameDuration = 1 / 30;
  const lines = [];
  for (let index = 0; index < slides.length; index += 1) {
    const [file, duration] = slides[index];
    const slidePath = path.join(SLIDES_DIR, file).replaceAll("\\", "/");
    const transitionDuration = index < slides.length - 1 ? transitionFrames * frameDuration : 0;
    lines.push(`file '${slidePath}'`, `duration ${Math.max(0.08, duration - transitionDuration)}`);
    if (index >= slides.length - 1) continue;
    const nextPath = path.join(SLIDES_DIR, slides[index + 1][0]);
    for (let frame = 1; frame <= transitionFrames; frame += 1) {
      const transitionName = `t-${String(index).padStart(2, "0")}-${String(frame).padStart(2, "0")}.jpg`;
      const transitionPath = path.join(TRANSITIONS_DIR, transitionName);
      await transitionFrame(path.join(SLIDES_DIR, file), nextPath, frame / (transitionFrames + 1), transitionPath);
      lines.push(`file '${transitionPath.replaceAll("\\", "/")}'`, `duration ${frameDuration}`);
    }
  }
  lines.push(`file '${path.join(SLIDES_DIR, slides.at(-1)[0]).replaceAll("\\", "/")}'`);
  return `${lines.join("\n")}\n`;
}

async function main() {
  await mkdir(SLIDES_DIR, { recursive: true });
  await makeIntro();
  await makeObsessionPoster();
  await slideFromImage({ file: path.join(OBSESSION_DIR, "nikki.jpg"), name: "02-nikki.jpg", heading: "DAL VOLTO...", subheading: "NASCE NIKKI", tag: "OBSESSION • FILM HORROR", imageTop: 250, imageMaxW: 800, imageMaxH: 1390 });
  await slideFromImage({ file: path.join(OBSESSION_PUBLIC_DIR, "nikki-linea-iniziale.png"), name: "03-linea-iniziale.jpg", heading: "DAL PRIMO SEGNO...", subheading: "IL PERSONAGGIO PRENDE FORMA", tag: "DIETRO LE QUINTE", imageTop: 250, imageMaxW: 860, imageMaxH: 1390, cleanTopRight: true });
  await slideFromImage({ file: path.join(OBSESSION_PUBLIC_DIR, "nikki-ritratto-completo.png"), name: "04-nikki-disegno.jpg", heading: "ALL'OSSESSIONE...", subheading: "OGNI TRATTO NASCONDE QUALCOSA", tag: "OBSESSION • WORK IN PROGRESS", imageTop: 250, imageMaxW: 860, imageMaxH: 1390 });
  await slideFromImage({ file: path.join(OBSESSION_PUBLIC_DIR, "nikki-presenza-emersa.png"), name: "05-presenza.jpg", heading: "FINO ALL'INCUBO.", subheading: "LEI NON È SOLA", tag: "OBSESSION • FILM HORROR", imageTop: 250, imageMaxW: 860, imageMaxH: 1390 });
  await slideFromImage({ file: path.join(OBSESSION_DIR, "locandina.jpg"), name: "06-obsession-return.jpg", heading: "OBSESSION", subheading: "SEGUI IL PROGETTO SU LOREWISE", tag: "QUESTO È SOLO L'INIZIO", imageTop: 250, imageMaxW: 820, imageMaxH: 1390 });
  await makeTransition();
  await makeMontageSlides();
  await makeCta();

  const slides = [
    ["00-intro.jpg", 3.20],
    ["01-obsession-locandina.jpg", 4.00],
    ["02-nikki.jpg", 3.20],
    ["03-linea-iniziale.jpg", 3.00],
    ["04-nikki-disegno.jpg", 3.20],
    ["05-presenza.jpg", 3.50],
    ["06-obsession-return.jpg", 3.50],
    ["07-solo-inizio.jpg", 3.40],
    ...[
      "001", "020", "007", "041", "019", "052", "023", "053", "026", "055", "073", "057", "045", "071",
    ].map((id) => [`${String(8 + ["001", "020", "007", "041", "019", "052", "023", "053", "026", "055", "073", "057", "045", "071"].indexOf(id)).padStart(2, "0")}-montage-${id}.jpg`, 0.78]),
    ["22-cta.jpg", 4.50],
  ];
  const totalSeconds = slides.reduce((sum, [, duration]) => sum + duration, 0);
  const concat = await buildSmoothConcat(slides);
  const concatFile = path.join(OUTPUT_DIR, "concat-v4.txt");
  const audioFile = path.join(OUTPUT_DIR, "obsession-original-horror-soundtrack-v4.wav");
  const videoFile = path.join(OUTPUT_DIR, "lorewise-obsession-iscriviti-reel-v4-tempi-lenti.mp4");
  await writeFile(concatFile, concat, "utf8");
  await makeAudio(audioFile, totalSeconds + 0.2);
  await makeStoryboard(slides.map(([file]) => file));

  const result = spawnSync(FFMPEG, [
    "-y", "-f", "concat", "-safe", "0", "-i", concatFile,
    "-i", audioFile,
    "-vf", "fps=30,format=yuv420p",
    "-c:v", "libx264", "-preset", "medium", "-crf", "18",
    "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-shortest",
    videoFile,
  ], { stdio: "inherit" });
  if (result.status !== 0) throw new Error(`FFmpeg terminato con codice ${result.status}`);
  console.log(JSON.stringify({ videoFile, storyboard: path.join(OUTPUT_DIR, "storyboard-obsession-lorewise-v4.jpg"), duration: totalSeconds, slides: slides.length }, null, 2));
}

await main();
