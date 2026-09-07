import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {
  FAMILIAR_COMBAT_AUDIO_PATHS,
  FAMILIAR_COMBAT_ELEMENT_SETS,
  FAMILIAR_COMBAT_ULTIMATE_VFX,
  FAMILIAR_COMBAT_VFX_SHEETS,
  familiarCombatMovePresentation,
  familiarCombatPresentationCue,
  familiarCombatPresentationElement,
} from "../lib/famiglioCombatPresentation.ts";
import { COMBAT_MOVES_BY_ID, FAMILIAR_COMBAT_CATALOG } from "../lib/famiglioCombatCatalog.ts";

function event(phase, overrides = {}) {
  return {
    id: `test-${phase}`,
    order: 0,
    actorId: "cat",
    targetId: "golden",
    moveId: "affinity-ardore-favilla",
    phase,
    durationMs: 500,
    actionKind: "magic",
    vfxCue: "ardore-spark",
    audioCue: "spell-fire",
    amount: 10,
    message: "La magia colpisce.",
    ...overrides,
  };
}

test("ogni mossa dei 53 Famigli riceve una presentazione completa e deterministica", () => {
  const moves = new Map(FAMILIAR_COMBAT_CATALOG.flatMap((familiar) => familiar.moves.map((move) => [move.id, move])));
  assert.ok(moves.size >= 100);
  for (const move of moves.values()) {
    const first = familiarCombatMovePresentation(move);
    const second = familiarCombatMovePresentation(move);
    assert.deepEqual(first, second, move.id);
    assert.ok(FAMILIAR_COMBAT_VFX_SHEETS[first.windupVfxId], `${move.id}: windup`);
    assert.ok(FAMILIAR_COMBAT_VFX_SHEETS[first.impactVfxId], `${move.id}: impact`);
    if (first.travelVfxId) assert.ok(FAMILIAR_COMBAT_VFX_SHEETS[first.travelVfxId], `${move.id}: travel`);
    if (first.statusVfxId) assert.ok(FAMILIAR_COMBAT_VFX_SHEETS[first.statusVfxId], `${move.id}: status`);
    assert.ok(FAMILIAR_COMBAT_AUDIO_PATHS[first.audioId], `${move.id}: audio`);
    assert.equal(first.usesAdvance, move.animation === "charge", move.id);
    assert.equal(first.usesProjectile, move.animation === "projectile", move.id);
  }
});

test("fuoco, ghiaccio, fulmine, veleno e cura non ricadono in un effetto generico", () => {
  const fire = COMBAT_MOVES_BY_ID["affinity-ardore-favilla"];
  const ice = COMBAT_MOVES_BY_ID["affinity-marea-brina"];
  assert.equal(familiarCombatPresentationElement(fire), "ardore");
  assert.equal(familiarCombatPresentationElement(ice), "ghiaccio");
  const lightning = { ...fire, id: "test-fulmine", name: "Saetta tonante", vfx: "lightning-bolt", audio: "electric" };
  const poison = { ...fire, id: "test-veleno", name: "Spora tossica", vfx: "poison-cloud", audio: "poison" };
  assert.equal(familiarCombatPresentationElement(lightning), "fulmine");
  assert.equal(familiarCombatPresentationElement(poison), "veleno");
  for (const element of ["ardore", "ghiaccio", "fulmine", "veleno"]) {
    const set = FAMILIAR_COMBAT_ELEMENT_SETS[element];
    assert.match(set.cast, new RegExp(`^${element}-`));
    assert.match(set.projectile, new RegExp(`^${element}-`));
    assert.ok(FAMILIAR_COMBAT_VFX_SHEETS[set.impact]);
  }
  const restore = Object.values(COMBAT_MOVES_BY_ID).find((move) => move.damageClass === "restore");
  const restorePresentation = familiarCombatMovePresentation(restore);
  assert.equal(restorePresentation.windupVfxId, "status-heal");
  assert.equal(restorePresentation.impactVfxId, "status-regen");
  assert.equal(restorePresentation.audioId, "heal");
});

test("le mosse supreme usano i sei Skyfall premium distinti", () => {
  assert.equal(new Set(Object.values(FAMILIAR_COMBAT_ULTIMATE_VFX)).size, 6);
  for (const entry of FAMILIAR_COMBAT_CATALOG) {
    const ultimate = entry.moves.find((move) => move.id === entry.ultimateMoveId);
    assert.ok(ultimate, entry.id);
    const presentation = familiarCombatMovePresentation(ultimate);
    assert.equal(presentation.impactVfxId, FAMILIAR_COMBAT_ULTIMATE_VFX[ultimate.affinity], entry.id);
  }
});

test("i cue semantici collocano corsa, proiettile, impatto, difesa e reazione sul livello corretto", () => {
  const fire = COMBAT_MOVES_BY_ID["affinity-ardore-favilla"];
  const advance = familiarCombatPresentationCue(event("advance"), fire);
  const projectile = familiarCombatPresentationCue(event("projectile"), fire);
  const impact = familiarCombatPresentationCue(event("impact"), fire);
  const guard = familiarCombatPresentationCue(event("guard", { actionKind: "guard" }), COMBAT_MOVES_BY_ID["affinity-antico-runa"]);
  const reaction = familiarCombatPresentationCue(event("reaction"), fire);
  assert.equal(advance.placement, "travel");
  assert.equal(advance.directionAware, true);
  assert.equal(projectile.placement, "travel");
  assert.equal(projectile.directionAware, true);
  assert.equal(projectile.vfx.id, "ardore-projectile");
  assert.equal(impact.placement, "target");
  assert.equal(impact.vfx.id, "premium-fireball");
  assert.equal(guard.placement, "target");
  assert.equal(guard.vfx.id, "status-guard");
  assert.equal(reaction.placement, "target");
  assert.equal(reaction.vfx.id, "hit");
});

test("mancati, ritorni e risultati non duplicano suoni di impatto", () => {
  const fire = COMBAT_MOVES_BY_ID["affinity-ardore-favilla"];
  const missed = familiarCombatPresentationCue(event("impact", { amount: 0, missed: true }), fire);
  const returning = familiarCombatPresentationCue(event("return"), fire);
  const victory = familiarCombatPresentationCue(event("result", { vfxCue: "battle-victory", message: "Vittoria!" }), null);
  const defeat = familiarCombatPresentationCue(event("result", { vfxCue: "battle-defeat", message: "Sconfitta." }), null);
  assert.equal(missed.audioPath, null);
  assert.equal(missed.vfx, null);
  assert.equal(returning.audioPath, null);
  assert.equal(victory.vfx.id, "win");
  assert.equal(victory.audioId, "win");
  assert.equal(defeat.vfx.id, "lose");
  assert.equal(defeat.audioId, "lose");
});

test("il resolver e il manifest condividono gli stessi strip VFX e percorsi audio", async () => {
  const manifest = JSON.parse(await readFile(path.join(process.cwd(), "public", "famiglio", "rebuild", "combat", "asset-manifest.json"), "utf8"));
  const vfxById = Object.fromEntries(manifest.vfx.map((asset) => [asset.id, asset]));
  const audioById = Object.fromEntries(manifest.audio.map((asset) => [asset.id, asset]));
  for (const [id, sheet] of Object.entries(FAMILIAR_COMBAT_VFX_SHEETS)) {
    assert.ok(vfxById[id], id);
    assert.equal(sheet.path, vfxById[id].path, id);
    assert.equal(sheet.columns, vfxById[id].columns, id);
    assert.equal(sheet.rows, 1, id);
    assert.equal(sheet.frameCount, vfxById[id].frameCount, id);
    assert.equal(sheet.fps, vfxById[id].fps, id);
  }
  for (const [id, audioPath] of Object.entries(FAMILIAR_COMBAT_AUDIO_PATHS)) {
    assert.equal(audioPath, audioById[id].path, id);
  }
});

test("l'arena usa i cue reali una volta per evento e non conserva tabelle hardcoded", async () => {
  const source = await readFile(path.join(process.cwd(), "components", "FamiglioCombatArena.tsx"), "utf8");
  const canvas = await readFile(path.join(process.cwd(), "components", "FamiglioCombatCanvas.tsx"), "utf8");
  const css = await readFile(path.join(process.cwd(), "components", "FamiglioCombatArena.module.css"), "utf8");
  assert.match(source, /familiarCombatPresentationCue\(event, combatMoveById\(event\.moveId\)\)/);
  assert.match(source, /playedAudioEventIdsRef\.current\.has\(cue\.eventId\)/);
  assert.match(source, /<FamiglioBattleCanvas/);
  assert.match(source, /cue=\{presentationCue\}/);
  assert.match(canvas, /cue\.placement === "travel"/);
  assert.match(canvas, /drawVfx\(context, images\.vfx, cue, event/);
  assert.match(canvas, /window\.requestAnimationFrame\(paint\)/);
  assert.doesNotMatch(source, /const PROJECTILE_VFX|function audioPathFor|function vfxFor/);
  assert.doesNotMatch(css, /combatSpriteFrames|combatVfxLinear|projectileReturnPlayer|projectileReturnOpponent/);
});
