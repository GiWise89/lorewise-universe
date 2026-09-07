import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import sharp from "sharp";
import { familiarCombatOpponents } from "../lib/famiglioCombat.ts";
import { FAMILIAR_COMBAT_CATALOG, FAMILIAR_COMBAT_CIRCUITS } from "../lib/famiglioCombatCatalog.ts";

const root = process.cwd();

const source = (file) => readFile(path.join(root, file), "utf8");

function cssRuleBodies(css, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return [...css.matchAll(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, "g"))].map((match) => match[1]);
}

test("le anteprime e la lotta sono renderizzate da Canvas con repaint cadenzato e cancellabile", async () => {
  const canvas = await source("components/FamiglioCombatCanvas.tsx");
  const arena = await source("components/FamiglioCombatArena.tsx");

  assert.match(canvas, /export function FamiglioCombatPreviewCanvas/);
  assert.match(canvas, /export function FamiglioBattleCanvas/);
  assert.equal((canvas.match(/<canvas\b/g) ?? []).length, 2);
  assert.ok((canvas.match(/window\.requestAnimationFrame\(paint\)/g) ?? []).length >= 3);
  assert.ok((canvas.match(/window\.cancelAnimationFrame\(animationRequest\)/g) ?? []).length >= 2);
  assert.ok((canvas.match(/window\.setTimeout\(/g) ?? []).length >= 2);
  assert.match(canvas, /document\.hidden/);
  assert.match(canvas, /visibilitychange/);
  assert.match(canvas, /context\.imageSmoothingEnabled = false/);
  assert.match(canvas, /Promise\.allSettled/);
  assert.match(canvas, /const MAX_READY_IMAGES = 72/);
  assert.match(canvas, /while \(readyImageCache\.size > MAX_READY_IMAGES\)/);
  assert.match(canvas, /pendingImageCache\.delete\(src\)/);
  assert.match(canvas, /cue\.directionAware && position\.direction < 0/);
  assert.match(arena, /<FamiglioCombatPreviewCanvas/);
  assert.match(arena, /<FamiglioBattleCanvas/);
  assert.match(arena, /await preloadFamiglioCombatImages/);
  assert.doesNotMatch(arena, /<img\b[^>]*(?:battle|opponent|sprite)/i);
});

test("le anteprime caricano subito lo sprite e avviano il repaint appena disponibile", async () => {
  const canvas = await source("components/FamiglioCombatCanvas.tsx");
  const previewStart = canvas.indexOf("export function FamiglioCombatPreviewCanvas");
  const battleStart = canvas.indexOf("export function FamiglioBattleCanvas");
  const preview = canvas.slice(previewStart, battleStart);
  const load = preview.indexOf("loadImage(src)");
  const repaint = preview.indexOf("requestPaint();", load);

  assert.ok(load >= 0, "lo sprite deve essere caricato dall'anteprima");
  assert.ok(repaint > load, "il caricamento completato deve richiedere il repaint");
  assert.equal((preview.match(/loadImage\(src\)/g) ?? []).length, 1);
  assert.doesNotMatch(preview, /IntersectionObserver/);
});

test("la tabella fase-posizione riproduce ogni gesto una volta e conserva la posa finale", async () => {
  const canvas = await source("components/FamiglioCombatCanvas.tsx");

  assert.match(canvas, /event\.phase === "reaction" && isTarget[\s\S]*?pose: "hit", mode: "progress"/);
  assert.match(canvas, /event\.phase === "windup"[\s\S]*?actionKind === "physical"[\s\S]*?pose: "attack", mode: "hold-start"/);
  assert.match(canvas, /event\.phase === "impact"[\s\S]*?actionKind === "physical"[\s\S]*?pose: "physical", mode: "progress"/);
  assert.match(canvas, /event\.phase === "projectile"[\s\S]*?pose: "magic", mode: "hold-final"/);
  assert.match(canvas, /event\.phase === "result"[\s\S]{0,180}mode: "once"/);
  assert.match(canvas, /pose === "victory" \|\| pose === "exhausted"[\s\S]*?mode: "once"/);
  assert.match(canvas, /animation\.mode === "once"[\s\S]*?Math\.min\(3/);
  assert.doesNotMatch(canvas, /event\.phase === "impact" && isTarget[\s\S]{0,100}pose: "hit"/);
});

test("contatto, VFX e ritorno seguono scala naturale e posizione reale del Famiglio", async () => {
  const canvas = await source("components/FamiglioCombatCanvas.tsx");

  assert.match(canvas, /playerSize = baseSize \* playerScale/);
  assert.match(canvas, /opponentSize = baseSize \* opponentScale/);
  assert.match(canvas, /playerContactX = Math\.max\(playerBaseX, contactPoint - playerSize \* \.23\)/);
  assert.match(canvas, /opponentContactX = Math\.min\(opponentBaseX, contactPoint \+ opponentSize \* \.23\)/);
  assert.match(canvas, /event\.phase === "advance" \|\| event\.phase === "return"[\s\S]*?x: eventActorX/);
  assert.match(canvas, /event\.phase === "return" \? \(forwardDirection === 1 \? -1 : 1\)/);
  assert.match(canvas, /subjectScale: actorScale/);
  assert.match(canvas, /speciesScale = Math\.max\(\.78, Math\.min\(1\.28, position\.subjectScale\)\)/);
});

test("aura corrotta e mosse elementali ricevono particelle coerenti senza coprire i Famigli", async () => {
  const canvas = await source("components/FamiglioCombatCanvas.tsx");

  assert.match(canvas, /type ParticleKind = "ember" \| "crystal" \| "spark" \| "wind" \| "leaf" \| "arcane" \| "water" \| "stone" \| "poison"/);
  assert.match(canvas, /particleThemeForVfx\(sheet\.id, cue\.audioId\)/);
  for (const identity of ["ardore", "ghiaccio", "fulmine", "vento", "natura", "marea", "arcano", "antico", "veleno"]) {
    assert.match(canvas, new RegExp(identity));
  }
  assert.match(canvas, /drawParticleField\([\s\S]*?cue\.placement === "travel" \? 9 : 14/);
  assert.match(canvas, /colors: \["#f3b2ff", "#c653ff", "#7430d8"\]/);
  assert.ok(canvas.indexOf("drawParticleField(\n          context,\n          opponentDrawX") < canvas.indexOf("if (images.opponent)"), "le particelle dell'aura devono restare dietro l'avversario");
});

test("nessun Famiglio viene mosso o cambiato di scala tramite animazioni CSS", async () => {
  const css = await source("components/FamiglioCombatArena.module.css");
  const animatedCanvasSelectors = [".opponentPortraitCanvas", ".previewFamiliarCanvas", ".battleCanvas"];

  for (const selector of animatedCanvasSelectors) {
    const bodies = cssRuleBodies(css, selector);
    assert.ok(bodies.length >= 1, `${selector}: regola CSS assente`);
    for (const body of bodies) {
      assert.doesNotMatch(body, /animation(?:-name)?\s*:/, `${selector}: l'animazione deve restare nel Canvas`);
      assert.doesNotMatch(body, /background-position\s*:/, `${selector}: nessuno strip deve scorrere via CSS`);
    }
  }

  const keyframes = [...css.matchAll(/@keyframes\s+([\w-]+)/g)].map((match) => match[1]);
  assert.ok(keyframes.every((name) => !/(?:famigli|familiar|fighter|sprite|creature|actor|opponent)/i.test(name)), keyframes.join(", "));
});

test("la selezione di prova espone tutti i 52 rivali in una tendina e una scheda premium animata", async () => {
  const arena = await source("components/FamiglioCombatArena.tsx");
  assert.equal(FAMILIAR_COMBAT_CATALOG.length, 53);
  for (const familiar of FAMILIAR_COMBAT_CATALOG) {
    assert.equal(familiarCombatOpponents(familiar.id).length, 52, familiar.id);
  }

  assert.match(arena, /familiarCombatOpponents\(familiarId, testMode \? undefined : selectedCircuit\.id\)/);
  assert.match(arena, /<select value=\{safeOpponentId\}/);
  assert.match(arena, /opponentRoster\.filter\(\(\{ entry \}\) => entry\.id === safeOpponentId\)\.map/);
  assert.match(arena, /label=\{`Anteprima animata di \$\{entry\.name\}`\}/);
  assert.match(arena, /RARITY_LABELS\[entry\.rarity\]/);
  assert.match(arena, /titleCase\(entry\.affinity\)/);
  assert.match(arena, /titleCase\(entry\.role\)/);
  assert.match(arena, /preview\.stats\.hp/);
  assert.match(arena, /preview\.stats\.attack/);
  assert.match(arena, /preview\.stats\.defense/);
  assert.match(arena, /preview\.stats\.speed/);
  assert.match(arena, /preview\.moves\.slice\(0, 4\)\.map/);

  const canvas = await source("components/FamiglioCombatCanvas.tsx");
  assert.match(canvas, /width="192" height="192"/);
});

test("i sei circuiti usano schede compatte con anteprima 16:9 completa", async () => {
  const css = await source("components/FamiglioCombatArena.module.css");
  const arena = await source("components/FamiglioCombatArena.tsx");

  assert.equal(FAMILIAR_COMBAT_CIRCUITS.length, 6);
  assert.match(arena, /FAMILIAR_COMBAT_CIRCUITS\.map\(\(circuit\) =>/);
  assert.match(arena, /<nav className=\{styles\.circuitRail\} aria-label="Circuiti dell'Arena">/);
  assert.match(arena, /className=\{styles\.circuitThumb\}[\s\S]*?ARENA_BACKGROUNDS\[circuit\.id\]/);
  assert.match(css, /\/\* Le arene sono schede compatte[\s\S]*?\.circuitRail\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(css, /\.circuitThumb\s*\{[^}]*aspect-ratio:\s*16\s*\/\s*9[^}]*background-size:\s*contain/s);
  assert.match(css, /@media \(max-width:\s*620px\)[\s\S]*?\.circuitRail\s*\{\s*grid-template-columns:\s*1fr/);
  assert.match(css, /\.circuitRail strong\s*\{[\s\S]*?overflow-wrap:\s*anywhere/);
});

test("la preparazione guidata mostra un passaggio alla volta e la lotta conserva quattro comandi", async () => {
  const css = await source("components/FamiglioCombatArena.module.css");
  const arena = await source("components/FamiglioCombatArena.tsx");

  assert.match(arena, /styles\.setupGuide/);
  assert.match(arena, /Conferma rivale/);
  assert.match(arena, /Conferma le mosse/);
  assert.match(arena, /\[0, 1, 2, 3\]\.map\(\(index\) =>/);
  assert.match(arena, /className=\{styles\.battleUtilityTray\}/);
  assert.match(arena, /setBattleInfoPanel\("status"\)/);
  assert.match(arena, /setBattleInfoPanel\("log"\)/);
  assert.match(arena, /className=\{styles\.battleInfoOverlay\}[\s\S]*?role="dialog"/);
  assert.match(css, /\.opponentRail\s*\{[^}]*display:\s*block;[^}]*overflow:\s*visible;/s);
  assert.match(css, /\/\* Lotta:[\s\S]*?\.battleViewport\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s);
  assert.match(css, /\.battleColumn\s*\{[^}]*display:\s*flex[^}]*flex-direction:\s*column/s);
  assert.match(css, /\.battleScene\s*\{[^}]*flex:\s*0 0 auto[^}]*aspect-ratio:\s*16\s*\/\s*9/s);
  assert.match(css, /\.battleMoveGrid\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/s);
});

test("gli HUD sono ai lati del campo e la schermata di lotta usa tutta l'area senza scroll", async () => {
  const css = await source("components/FamiglioCombatArena.module.css");
  const arena = await source("components/FamiglioCombatArena.tsx");
  const stageStart = arena.indexOf("className={styles.battleStage}");
  const bannerStart = arena.indexOf("className={styles.turnBanner}", stageStart);
  const stageMarkup = arena.slice(stageStart, bannerStart);

  assert.ok(stageStart >= 0 && bannerStart > stageStart);
  assert.match(stageMarkup, /className=\{styles\.battleHud\} data-side="player"[\s\S]*?className=\{styles\.battleScene\}[\s\S]*?className=\{styles\.battleHud\} data-side="opponent"/);
  assert.match(css, /\.battleStage\s*\{[^}]*grid-template-columns:\s*minmax\(10\.5rem,\s*\.3fr\)\s+minmax\(31rem,\s*1fr\)\s+minmax\(10\.5rem,\s*\.3fr\)/s);
  assert.match(css, /\.battleHud,\s*\.battleHud\[data-side="opponent"\]\s*\{[^}]*position:\s*relative[^}]*width:\s*100%/s);
  assert.match(css, /\/\* Modalita battaglia:[\s\S]*?\.combat\[data-battle="true"\] \.battleViewport\s*\{[^}]*overflow:\s*hidden/s);
});

test("le sei arene e il Canvas di lotta restano 16:9 e mostrano l'immagine intera", async () => {
  const css = await source("components/FamiglioCombatArena.module.css");
  const canvas = await source("components/FamiglioCombatCanvas.tsx");

  for (const circuit of FAMILIAR_COMBAT_CIRCUITS) {
    const diskPath = path.join(root, "public", ...circuit.backgroundSrc.split("/").filter(Boolean));
    const metadata = await sharp(diskPath).metadata();
    assert.equal(metadata.width / metadata.height, 16 / 9, circuit.id);
  }

  assert.match(css, /\.battleScene\s*\{[\s\S]*?aspect-ratio:\s*16\s*\/\s*9[\s\S]*?overflow:\s*hidden/);
  assert.match(css, /\.battleScene\s*\{[\s\S]*?background-position:\s*center[\s\S]*?background-size:\s*contain/);
  assert.match(canvas, /width="1280"\s+height="720"/);
  assert.match(canvas, /context\.drawImage\(images\.background, 0, 0, width, height\)/);
  assert.doesNotMatch(canvas, /drawImage\(background,[\s\S]{0,180}naturalWidth|drawImage\(background,[\s\S]{0,180}naturalHeight/);
});
