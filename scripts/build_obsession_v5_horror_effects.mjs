import { spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT_DIR = path.join(ROOT, "outputs", "lorewise-obsession-video");
const INPUT = path.join(OUTPUT_DIR, "lorewise-obsession-iscriviti-reel-v4-tempi-lenti.mp4");
const OUTPUT = path.join(OUTPUT_DIR, "lorewise-obsession-iscriviti-reel-v6-incubo-a-colori.mp4");
const FX_AUDIO = path.join(OUTPUT_DIR, "obsession-v5-horror-impacts.wav");
const FILTER_FILE = path.join(OUTPUT_DIR, "obsession-v5-filter.txt");
const DURATION = 42.47;
const SAMPLE_RATE = 44100;

const ffmpegArg = process.argv.find((arg) => arg.startsWith("--ffmpeg="));
if (!ffmpegArg) throw new Error("Indicare --ffmpeg=C:\\percorso\\ffmpeg.exe");
const FFMPEG = ffmpegArg.slice("--ffmpeg=".length);

const obsessionCuts = [3.05, 7.05, 10.25, 13.25, 16.45, 19.95, 23.45, 26.85];
const montageCuts = Array.from({ length: 14 }, (_, index) => 27.61 + index * 0.78);
const impactEvents = [...obsessionCuts, ...montageCuts, 37.90];
const nightmareEvents = [10.25, 16.45, 19.95, 23.45, 30.73, 33.85, 36.97];

function timeline(events, before, after) {
  return events.map((time) => `between(t,${(time - before).toFixed(2)},${(time + after).toFixed(2)})`).join("+");
}

function writeWavHeader(payloadBytes) {
  const channels = 2;
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + payloadBytes, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * channels * 2, 28);
  header.writeUInt16LE(channels * 2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(payloadBytes, 40);
  return header;
}

async function makeImpactTrack() {
  const samples = Math.ceil(DURATION * SAMPLE_RATE);
  const payload = Buffer.alloc(samples * 4);
  let seed = 0x7a4d91e3;
  const noise = () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return (seed / 0xffffffff) * 2 - 1;
  };
  for (let index = 0; index < samples; index += 1) {
    const t = index / SAMPLE_RATE;
    let value = 0;
    for (const event of impactEvents) {
      const dt = t - event;
      if (dt >= 0 && dt < 0.65) {
        const frequency = 68 - 28 * Math.min(1, dt / 0.65);
        value += Math.sin(2 * Math.PI * frequency * dt) * Math.exp(-7.5 * dt) * 0.42;
        value += noise() * Math.exp(-48 * dt) * 0.22;
      }
      if (dt >= -0.42 && dt < 0) {
        const rise = (dt + 0.42) / 0.42;
        value += Math.sin(2 * Math.PI * (520 + 680 * rise) * t) * rise * rise * 0.045;
      }
    }
    for (const event of nightmareEvents) {
      const dt = t - event;
      if (dt >= 0 && dt < 0.28) {
        value += Math.sin(2 * Math.PI * 980 * dt) * Math.exp(-18 * dt) * 0.15;
      }
    }
    const clamped = Math.max(-1, Math.min(1, value));
    payload.writeInt16LE(Math.round(clamped * 32767), index * 4);
    payload.writeInt16LE(Math.round(clamped * 0.92 * 32767), index * 4 + 2);
  }
  await writeFile(FX_AUDIO, Buffer.concat([writeWavHeader(payload.length), payload]));
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });
  await makeImpactTrack();

  const shake = timeline(impactEvents, 0.10, 0.18);
  const rgb = timeline(impactEvents, 0.08, 0.14);
  const whiteFlash = timeline(impactEvents, 0.015, 0.045);
  const redFlash = timeline(impactEvents, 0.06, 0.16);
  const negative = timeline(nightmareEvents, 0.015, 0.055);
  const trails = timeline(nightmareEvents, 0.05, 0.18);

  const videoFilter = [
    `[0:v]scale=1050:1867:flags=lanczos`,
    `pad=1120:2000:(ow-iw)/2:(oh-ih)/2:color=0x030002`,
    `crop=1080:1920:x='20+7*sin(2*PI*t*0.67)+(${shake})*11*sin(2*PI*t*19)':y='40+6*cos(2*PI*t*0.51)+(${shake})*9*cos(2*PI*t*23)'`,
    `eq=saturation=1.12:contrast=1.04:brightness=0.01`,
    `noise=alls=5:allf=t+u:all_seed=47021`,
    `vignette=PI/5.2`,
    `rgbashift=rh=9:rv=-2:bh=-9:bv=2:edge=wrap:enable='${rgb}'`,
    `tblend=all_mode=average:enable='${trails}'`,
    `negate=enable='${negative}'`,
    `drawbox=x=0:y=0:w=iw:h=ih:color=0xfff4ed@0.72:t=fill:enable='${whiteFlash}'`,
    `drawbox=x=0:y=0:w=iw:h=ih:color=0xb00016@0.24:t=fill:enable='${redFlash}'`,
    `unsharp=5:5:0.48:5:5:0`,
    `fps=30,format=yuv420p[v]`,
  ].join(",");
  const filter = `${videoFilter};[0:a][1:a]amix=inputs=2:duration=first:dropout_transition=0,alimiter=limit=0.94[a]`;
  await writeFile(FILTER_FILE, filter, "utf8");

  const result = spawnSync(FFMPEG, [
    "-y", "-i", INPUT, "-i", FX_AUDIO,
    "-filter_complex_script", FILTER_FILE,
    "-map", "[v]", "-map", "[a]",
    "-c:v", "libx264", "-preset", "medium", "-crf", "18",
    "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-shortest",
    OUTPUT,
  ], { stdio: "inherit" });
  if (result.status !== 0) throw new Error(`FFmpeg terminato con codice ${result.status}`);
  console.log(JSON.stringify({ input: INPUT, output: OUTPUT, duration: DURATION, impacts: impactEvents.length, nightmares: nightmareEvents.length }, null, 2));
}

await main();
