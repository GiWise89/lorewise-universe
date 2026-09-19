import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
import path from "node:path";
import test from "node:test";
import { FAMILIAR_COMBAT_CATALOG } from "../lib/famiglioCombatCatalog.ts";

const root = process.cwd();
const source = (file) => readFile(path.join(root, file), "utf8");

// Estrae dal sorgente .tsx un blocco di funzioni pure (senza JSX) e lo valuta,
// cosi il test esercita il codice reale invece di una copia.
function evaluateBlock(code, names, scope = {}) {
  const js = stripTypeScriptTypes(code);
  const factory = new Function(...Object.keys(scope), `${js}\nreturn { ${names.join(", ")} };`);
  return factory(...Object.values(scope));
}

test("i nomi dei Famigli sostituiscono solo id interi, senza rovinare mosse e messaggi", async () => {
  const arena = await source("components/FamiglioCombatArena.tsx");
  const start = arena.indexOf("const LOCALIZED_FAMILIARS");
  const end = arena.indexOf("function stageLabel");
  assert.ok(start > 0 && end > start);
  const { combatText } = evaluateBlock(arena.slice(start, end), ["combatText"], { FAMILIAR_COMBAT_CATALOG });
  assert.equal(combatText("bird prepara Beccata rapida."), "Uccellino prepara Beccata rapida.");
  assert.equal(combatText("cat è bloccato dal gelo."), "Gatto è bloccato dal gelo.");
  assert.equal(combatText("Scatto cremisi infligge 12 danni."), "Scatto cremisi infligge 12 danni.");
  assert.equal(combatText("Coda imprevedibile colpisce imp."), "Coda imprevedibile colpisce Imp.");
  assert.equal(combatText("great-dane entra in campo."), "Alano entra in campo.");
  assert.equal(combatText("Morso infuocato raggiunge il bersaglio."), "Morso infuocato raggiunge il bersaglio.");
  for (const entry of FAMILIAR_COMBAT_CATALOG) {
    for (const move of entry.moves) {
      assert.equal(combatText(`${move.name} infligge 3 danni.`), `${move.name} infligge 3 danni.`, move.name);
    }
  }
});

test("il Canvas di lotta segue la misura reale e mantiene un palco 16:9 intero", async () => {
  const canvas = await source("components/FamiglioCombatCanvas.tsx");
  const start = canvas.indexOf("const BATTLE_CANVAS_MAX_PIXELS");
  const end = canvas.indexOf("// Sfondo \"cover\"");
  const { familiarBattleCanvasBackingSize, familiarBattleStageRect } = evaluateBlock(
    canvas.slice(start, end).replaceAll("export function", "function"),
    ["familiarBattleCanvasBackingSize", "familiarBattleStageRect"],
  );
  // Desktop 1440x900: riquadro ~2.75:1, non piu stirato su 1280x720.
  assert.deepEqual(familiarBattleCanvasBackingSize(1312, 477, 1), { width: 1312, height: 477 });
  // Telefono DPR 3: nitido ma entro il tetto di pixel.
  const phone = familiarBattleCanvasBackingSize(336, 189, 3);
  assert.deepEqual(phone, { width: 1008, height: 567 });
  const huge = familiarBattleCanvasBackingSize(2400, 1350, 3);
  assert.ok(huge.width * huge.height <= 2560 * 1440 + 4000);
  assert.deepEqual(familiarBattleCanvasBackingSize(0, 0, 2), { width: 1280, height: 720 });
  const stage = familiarBattleStageRect(1312, 477);
  assert.ok(Math.abs(stage.width / stage.height - 16 / 9) < 1e-9);
  assert.equal(stage.height, 477);
  assert.ok(Math.abs(stage.x - (1312 - stage.width) / 2) < 1e-9);
  assert.match(canvas, /new ResizeObserver\(scheduleMeasure\)/);
  assert.match(canvas, /observer\?\.disconnect\(\)/);
  // I numeri di danno/cura compaiono sopra il Famiglio colpito.
  assert.match(canvas, /combatFloatingAmount\(event\)/);
  // L'effetto di disegno non dipende piu dall'oggetto campaignNpc ricreato a ogni render.
  assert.doesNotMatch(canvas, /^\s+campaignNpc,\s*$/m);
});

test("battaglia: comandi audio/velocita/salta raggiungibili, doppio tocco bloccato, modali accessibili", async () => {
  const arena = await source("components/FamiglioCombatArena.tsx");
  const css = await source("components/FamiglioBattleScreen.module.css");
  // L'intestazione e nascosta in battaglia: i comandi vivono nel dock.
  assert.match(css, /\.root>header\[data-battle="true"\]\{display:none!important/);
  assert.match(arena, /data-control="audio"/);
  assert.match(arena, /data-control="speed"/);
  assert.match(arena, /data-control="skip"[^>]*disabled=\{!animating\}[^>]*onClick=\{skipPresentation\}/);
  // Guardia sincrona contro doppio click/tap.
  assert.match(arena, /if \(animating \|\| turnLockRef\.current \|\| !battle/);
  assert.match(arena, /turnLockRef\.current = true;/);
  assert.match(arena, /animationSpeedRef\.current\)\)/);
  // Modali: focus iniziale, Esc e trappola del Tab.
  assert.match(arena, /onKeyDown=\{handleDialogKeys\}/);
  assert.match(arena, /event\.key === "Escape"/);
  assert.match(arena, /querySelector<HTMLElement>\("button:not\(:disabled\)"\)\?\.focus/);
  // Anteprime quadrate mai stirate.
  assert.match(css, /\.root canvas\{object-fit:contain\}/);
  assert.match(await source("components/FamiglioCombatArena.module.css"), /\.combat canvas \{ object-fit: contain; \}/);
});

test("Torre e Campagna avanzano anche quando la vittoria non assegna una nuova ricompensa", async () => {
  const arena = await source("components/FamiglioCombatArena.tsx");
  const start = arena.indexOf("const collectReward = () => {");
  const end = arena.indexOf("const finishBattleAtHome");
  const body = arena.slice(start, end);
  assert.doesNotMatch(body, /if \(!state\.pendingReward\) \{\s*setLocalMessage\(null\);\s*setState\(closeFamiliarCombatBattle\(state\)\);\s*return;/);
  assert.match(body, /advanceFamiliarTower\(towerRun\)/);
  assert.match(body, /setSelectedCampaignNumber\(nextNumber\)/);
  const rematch = arena.slice(arena.indexOf("const rematch = () => {"), arena.indexOf("const leaveBattle"));
  assert.match(rematch, /encounterId: battle\.encounterId/);
  assert.match(rematch, /ignoreUnlocks: testMode \|\| battleFormat === "tower" \|\| Boolean\(battleCampaignLevel\)/);
});

test("preparazione allineata al motore: base fissa, titolare 3v3 reale, riserve di forza simile, niente falso 'Raccogli'", async () => {
  const arena = await source("components/FamiglioCombatArena.tsx");
  assert.match(arena, /const baseSlot = Boolean\(equippedId && familiarCombatMoveIsBase\(familiarId, equippedId\)\)/);
  assert.match(arena, /disabled=\{baseSlot \|\| locked/);
  assert.match(arena, /const previewOpponentId = teamBattle \? opponentTeamIds\[0\] \?\? safeOpponentId : safeOpponentId;/);
  assert.match(arena, /const opponentEntry = familiarCombatEntry\(previewOpponentId\)/);
  assert.match(arena, /Math\.abs\(familiarCombatPower\(left\) - leadRivalPower\)/);
  assert.match(arena, /state\.pendingReward \? "Raccogli · prossimo piano" : "Prossimo piano"/);
  assert.match(arena, /state\.pendingReward \? "Raccogli e continua" : "Continua"/);
});

test("Campagna: anteprima del rivale scalata, obiettivo Resistenza presentato come vittoria", async () => {
  const arena = await source("components/FamiglioCombatArena.tsx");
  assert.match(arena, /encounterId: selectedCampaignLevel\?\.id,\s*playerLevel: selectedCampaignLevel \? progress\.combatLevel : undefined,/);
  assert.match(arena, /`Resisti \$\{selectedCampaignLevel\.turnLimit\} turni per vincere`/);
  assert.match(arena, /`Resisti · turno \$\{Math\.min\(battle\.turn, battle\.maxTurns\)\}\/\$\{battle\.maxTurns\}`/);
  assert.match(arena, /"Obiettivo Resistenza completato"/);
});

test("il Custode della Campagna ridisegna solo al cambio di frame e si ferma a fine posa", async () => {
  const npc = await source("components/FamiglioCampaignNpcCanvas.tsx");
  assert.match(npc, /if \(frame === lastFrame\)/);
  assert.match(npc, /const finished = reduced \|\| \(pose === "defeat" && frame >= columns - 1\)/);
  assert.match(npc, /boundsCache\.set\(frame/);
  assert.match(npc, /window\.clearTimeout\(timer\)/);
  const pace = await source("components/FamiglioPaceNotice.tsx");
  assert.match(pace, /if \(stage < announced\.current\) announced\.current = stage;/);
});
