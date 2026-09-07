import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import sharp from "sharp";
import { FAMILIAR_COMBAT_CATALOG, FAMILIAR_COMBAT_CIRCUITS } from "../lib/famiglioCombatCatalog.ts";

const root = process.cwd();

test("Arena e Spedizioni restano due destinazioni indipendenti", async () => {
  const source = await readFile(path.join(root, "components", "FamiglioNexusRebuild.tsx"), "utf8");
  assert.match(source, /type FamiliarHomePanel = [^;]*"adventure" \| "combat"/);
  assert.match(source, /setHomePanel\("adventure"\)/);
  assert.match(source, /setHomePanel\("combat"\)/);
  assert.match(source, /<FamiglioAdventure/);
  assert.match(source, /<FamiglioCombatArena/);
  assert.match(source, /activeFamiliarId: selectedFamiliarIdForStorage/);
});

test("la squadra dell'Arena mostra soltanto i Famigli posseduti senza cambiare la Casa", async () => {
  const source = await readFile(path.join(root, "components", "FamiglioNexusRebuild.tsx"), "utf8");
  assert.match(source, /const ownedCombatFamiliarIds = new Set<string>\(purchasedAppearanceIds\)/);
  assert.match(source, /house\.activeFamiliarId/);
  assert.match(source, /house\.rebuild\.unlockedIds/);
  assert.match(source, /const combatFamiliarOptions = FAMILIAR_COLLECTION\s*\.filter\(\(entry\) => ownedCombatFamiliarIds\.has\(entry\.id\)\)/);
  assert.match(source, /setCombatPreparedFamiliarId\(familiarId\)/);
  assert.match(source, /familiarOptions=\{combatFamiliarOptions\}/);
  assert.match(source, /colorVariant: combatColorVariantById\.get\(entry\.id\)/);
  assert.match(source, /colorVariant=\{combatSelectedColorVariant\}/);
});

test("le varianti cromatiche scelte restano nell'anteprima e in battaglia", async () => {
  const source = await readFile(path.join(root, "components", "FamiglioCombatArena.tsx"), "utf8");
  assert.match(source, /\/variants\/\$\{colorVariant\}/);
  assert.match(source, /spritePath\(option\.id, option\.growthStage, "idle", option\.colorVariant\)/);
  assert.match(source, /spritePath\(battle\.player\.familiarId, growthStage, playerBattlePose, colorVariant\)/);
  for (const variant of ["black", "brown", "siamese"]) {
    const file = path.join(root, "public", "famiglio", "rebuild", "collection", "cat", "growth", "cucciolo", "battle-v2", "variants", variant, "idle.png");
    const metadata = await sharp(file).metadata();
    assert.equal(metadata.width, 1920);
    assert.equal(metadata.height, 160);
  }
});

test("il caricamento cloud non riporta alla Casa una sezione appena aperta", async () => {
  const source = await readFile(path.join(root, "components", "FamiglioNexusRebuild.tsx"), "utf8");
  assert.match(source, /setHomePanel\(\(currentPanel\) => active\.combat\.activeBattle \? "combat" : currentPanel\)/);
  assert.doesNotMatch(source, /setHomePanel\(active\.combat\.activeBattle \? "combat" : "care"\)/);
});

test("l'interfaccia di lotta conserva il turno prima della coreografia", async () => {
  const source = await readFile(path.join(root, "components", "FamiglioCombatArena.tsx"), "utf8");
  const commit = source.indexOf("setState(result.state);");
  const animation = source.indexOf("void animateTimeline(result.timeline, result.state, currentBattle);");
  assert.ok(commit >= 0 && animation > commit, "lo stato canonico deve precedere l'animazione");
  assert.match(source, /presentationBattle \?\? state\.activeBattle/);
  assert.match(source, /familiarCombatOpponentPreview/);
  assert.match(source, /combatMoveById\(currentEvent\.moveId/);
  assert.match(source, /<FamiglioBattleCanvas/);
});

test("la schermata finale aspetta la conclusione completa della coreografia", async () => {
  const source = await readFile(path.join(root, "components", "FamiglioCombatArena.tsx"), "utf8");
  const pin = source.indexOf("setPresentationBattle(currentBattle);");
  const preload = source.indexOf("await preloadFamiglioCombatImages", pin);
  assert.ok(pin >= 0 && preload > pin, "la battaglia visiva deve essere fissata prima del preload");
  assert.match(source, /!animating && battle && battle\.outcome !== "active"/);
});

test("selezioni e pulsanti usano cue UI delicati e rispettano il volume", async () => {
  const source = await readFile(path.join(root, "components", "FamiglioCombatArena.tsx"), "utf8");
  const home = await readFile(path.join(root, "components", "FamiglioNexusRebuild.tsx"), "utf8");
  const audio = await readFile(path.join(root, "lib", "nexusFamiliarAudio.ts"), "utf8");
  assert.match(source, /data-famiglio-audio-scope="combat"/);
  assert.match(source, /playFamiliarInterfaceCue\("confirm", !audioSettingsRef\.current\.muted, audioSettingsRef\.current\.volume\)/);
  assert.match(home, /playFamiliarInterfaceCue\("confirm", !homeAudioMuted, homeAudioVolume\)/);
  assert.match(audio, /select: ".*menu-select\.ogg"/);
  assert.match(audio, /confirm: ".*menu-confirm\.ogg"/);
  assert.match(audio, /action === "select" \? \.14 : \.18/);
});

test("mobile usa un indietro compatto e la battaglia mostra MISS senza danno", async () => {
  const [source, canvas, styles] = await Promise.all([
    readFile(path.join(root, "components", "FamiglioCombatArena.tsx"), "utf8"),
    readFile(path.join(root, "components", "FamiglioCombatCanvas.tsx"), "utf8"),
    readFile(path.join(root, "components", "FamiglioCombatArena.module.css"), "utf8"),
  ]);
  assert.match(source, /title="Indietro">&larr;<\/button>/);
  assert.match(canvas, /event\.missed/);
  assert.match(canvas, /strokeText\("MISS"/);
  assert.match(styles, /\.combat\[data-battle="false"\] \.setupBack\s*\{[\s\S]*?width:\s*2\.55rem;[\s\S]*?height:\s*2\.55rem;/);
  assert.match(styles, /\.selectionViewport\[data-step="campaign"\] \.campaignBriefing/);
  assert.match(styles, /grid-template-columns:\s*repeat\(20, 3\.1rem\)/);
  assert.match(styles, /overflow-y:\s*auto/);
  assert.match(styles, /\.combat\[data-battle="true"\] \.roundNotice\s*\{[\s\S]*?grid-auto-flow:\s*column;/);
});

test("la mappa campagna distingue prossimo livello, completati e bloccati", async () => {
  const [source, styles] = await Promise.all([
    readFile(path.join(root, "components", "FamiglioCombatArena.tsx"), "utf8"),
    readFile(path.join(root, "components", "FamiglioCombatArena.module.css"), "utf8"),
  ]);
  assert.match(source, /data-state=\{levelState\}/);
  assert.match(source, /levelState === "complete"/);
  assert.match(source, /levelState === "locked"/);
  assert.match(source, /levelState === "current"/);
  assert.match(styles, /button\[data-state="current"\][^{]*\{[^}]*animation:\s*campaign-current-glow/s);
  assert.match(styles, /button\[data-state="complete"\]::after\s*\{[^}]*content:\s*"✓"/s);
  assert.match(styles, /button\[data-state="locked"\][^{]*\{[^}]*filter:\s*grayscale\(1\)/s);
});

test("vittoria e sconfitta usano scene raster premium complete su desktop e mobile", async () => {
  const [source, styles] = await Promise.all([
    readFile(path.join(root, "components", "FamiglioCombatArena.tsx"), "utf8"),
    readFile(path.join(root, "components", "FamiglioCombatArena.module.css"), "utf8"),
  ]);
  assert.match(source, /Trionfo del Legame/);
  assert.match(source, /Il Legame non si spezza/);
  for (const filename of ["victory-sanctum-v1.webp", "defeat-sanctum-v1.webp"]) {
    const asset = path.join(root, "public", "famiglio", "rebuild", "combat", "results", filename);
    const metadata = await sharp(asset).metadata();
    assert.equal(metadata.width, 1600);
    assert.equal(metadata.height, 900);
    assert.ok((await stat(asset)).size > 100_000);
    assert.match(styles, new RegExp(filename.replaceAll(".", "\\.")));
  }
  assert.match(styles, /\.resultFamiliar\s*\{[\s\S]*?aspect-ratio:\s*16 \/ 9;[\s\S]*?background-size:\s*contain;/);
});

test("saltare la coreografia completa il turno e riabilita sempre le mosse", async () => {
  const source = await readFile(path.join(root, "components", "FamiglioCombatArena.tsx"), "utf8");
  assert.match(source, /pendingPresentationStateRef\.current = nextState/);
  assert.match(source, /const completedState = pendingPresentationStateRef\.current/);
  assert.match(source, /if \(completedState\) setState\(completedState\)/);
  assert.match(source, /setPresentationBattle\(null\);[\s\S]*?setEntering\(false\);[\s\S]*?setAnimating\(false\)/);
});

test("la preparazione è sequenziale e vittoria o sconfitta hanno una schermata autonoma", async () => {
  const source = await readFile(path.join(root, "components", "FamiglioCombatArena.tsx"), "utf8");
  const css = await readFile(path.join(root, "components", "FamiglioCombatArena.module.css"), "utf8");
  assert.match(source, /setupSteps/);
  assert.match(source, /Famiglio combattente/);
  assert.match(source, /Conferma Famiglio/);
  assert.match(source, /onSelectFamiliar/);
  assert.match(source, /familiarRosterGrid/);
  assert.match(source, /familiarPager/);
  assert.match(source, /familiarsPerPage = 8/);
  assert.match(source, /Conferma rivale/);
  assert.match(source, /Conferma le mosse/);
  assert.doesNotMatch(source, /className=\{styles\.setupTabs\}/);
  assert.match(source, /className=\{styles\.resultOverlay\}/);
  assert.match(source, /Vittoria!/);
  assert.match(source, /Sconfitta/);
  assert.match(source, /Rivincita/);
  assert.match(source, /Torna alla Casa/);
  assert.match(css, /\.selectionViewport\s*\{[\s\S]*?overflow:\s*hidden/);
  assert.match(css, /\.combat\[data-battle="false"\] > \.header,[\s\S]*?display:\s*none/);
  assert.match(css, /\.resultOverlay\s*\{[\s\S]*?position:\s*absolute/);
});

test("la UI rende visibile il limite di due mosse consecutive e gli stati sui combattenti", async () => {
  const source = await readFile(path.join(root, "components", "FamiglioCombatArena.tsx"), "utf8");
  const css = await readFile(path.join(root, "components", "FamiglioCombatArena.module.css"), "utf8");
  assert.match(source, /battle\.playerMoveStreak >= 2/);
  assert.match(source, /data-repetition-locked/);
  assert.match(source, /fighterStatusTags/);
  for (const status of ["burn", "poison", "freeze", "paralysis", "sleep", "regen"]) {
    assert.match(css, new RegExp(`data-status=\\"${status}\\"`));
  }
});

test("la UI mostra energia, costi e ricarica senza introdurre una mossa di emergenza", async () => {
  const source = await readFile(path.join(root, "components", "FamiglioCombatArena.tsx"), "utf8");
  const engine = await readFile(path.join(root, "lib", "famiglioCombat.ts"), "utf8");
  const css = await readFile(path.join(root, "components", "FamiglioCombatArena.module.css"), "utf8");
  assert.match(source, /className=\{styles\.hudEnergy\}/);
  assert.match(source, /Base · gratis/);
  assert.match(source, /Energia insufficiente/);
  assert.match(source, /In ricarica/);
  assert.match(source, /className=\{styles\.roundNotice\}/);
  assert.doesNotMatch(source, /Comandi del turno \{battle\.turn\}/);
  assert.match(engine, /FAMILIAR_COMBAT_MAX_ENERGY = 100/);
  assert.match(engine, /FAMILIAR_COMBAT_ENERGY_REGEN = 18/);
  assert.match(css, /\.hudEnergy/);
  assert.doesNotMatch(source, /mossa d.emergenza|slancio istintivo/i);
});

test("il duello usa arena ampia, mosse sotto e dossier a schermo senza scroll", async () => {
  const source = await readFile(path.join(root, "components", "FamiglioCombatArena.tsx"), "utf8");
  const css = await readFile(path.join(root, "components", "FamiglioCombatArena.module.css"), "utf8");
  assert.match(source, /className=\{styles\.battleUtilityDock\}/);
  assert.match(css, /\.battleUtilityDock\s*\{[\s\S]*?display:\s*flex/);
  assert.match(css, /\.battleMoveGrid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(css, /\.combat\[data-battle="true"\] \.battleViewport,[\s\S]*?overflow:\s*hidden/);
  assert.match(source, /Informazioni sulla mossa/);
  assert.match(source, /className=\{styles\.moveInfoButton\}/);
  assert.match(source, /id="move-info-title"/);
  assert.match(css, /\.moveInfoStats/);
  assert.match(css, /\.battleMoveCommand\s*\{[\s\S]*?background:\s*#0a3543/);
  assert.match(source, />\{move \? "INFO" : "—"\}<\/button>/);
  assert.match(css, /Comandi battaglia: pulsanti compatti da videogame/);
  assert.match(css, /\.battleMoveCommand:has\(\.moveAction\[data-kind="physical"\]\)/);
  assert.match(css, /\.battleMoveCommand:has\(\.moveAction\[data-kind="magic"\]\)/);
  assert.match(css, /transform:\s*translateY\(3px\)/);
});

test("iniziativa, Stati e Cronaca usano asset raster e schede complete", async () => {
  const source = await readFile(path.join(root, "components", "FamiglioCombatArena.tsx"), "utf8");
  const engine = await readFile(path.join(root, "lib", "famiglioCombat.ts"), "utf8");
  const css = await readFile(path.join(root, "components", "FamiglioCombatArena.module.css"), "utf8");
  assert.match(engine, /function rollInitiative/);
  assert.match(engine, /playerCritical: playerDice\[0\] === playerDice\[1\]/);
  assert.match(engine, /initiativeCritical \? "Critico d'iniziativa!/);
  assert.match(source, /Tiro d'iniziativa/);
  assert.match(source, /battleInfoPanel\("status"\)|setBattleInfoPanel\("status"\)/);
  assert.match(source, /setBattleInfoPanel\("log"\)/);
  assert.match(css, /initiative-dice-strip-v2\.png/);
  assert.match(source, /battle-status-icon-v1\.png/);
  assert.match(source, /battle-log-icon-v1\.png/);
});

test("ritiro usa un'icona raster e richiede una conferma esplicita", async () => {
  const source = await readFile(path.join(root, "components", "FamiglioCombatArena.tsx"), "utf8");
  const css = await readFile(path.join(root, "components", "FamiglioCombatArena.module.css"), "utf8");
  const icon = path.join(root, "public", "famiglio", "rebuild", "combat", "ui", "battle-retreat-icon-v2.png");
  const metadata = await sharp(await readFile(icon)).metadata();
  assert.equal(Boolean(metadata.hasAlpha), true);
  assert.match(source, /battle-retreat-icon-v2\.png/);
  assert.match(source, /retreatConfirmOpen/);
  assert.match(source, /Vuoi davvero ritirarti\?/);
  assert.match(source, /Conferma ritiro/);
  assert.match(css, /\.retreatConfirmActions/);
});

test("iniziativa si apre soltanto all'avvio esplicito e la preparazione mosse scorre su mobile", async () => {
  const source = await readFile(new URL("../components/FamiglioCombatArena.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../components/FamiglioCombatArena.module.css", import.meta.url), "utf8");
  assert.equal((source.match(/setInitiativeBattleId\(started\.id\)/g) ?? []).length, 1);
  assert.doesNotMatch(source, /battle\.timeline\.length\s*!==\s*0/);
  assert.match(styles, /\.selectionViewport\[data-step="moves"\][^{]*\{[^}]*overflow-y:\s*auto/s);
  assert.match(styles, /\.selectionViewport\[data-step="moves"\]\s+\.combatDossiers\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s);
});

test("su mobile il dossier rivale scorre senza coprire la conferma", async () => {
  const styles = await readFile(new URL("../components/FamiglioCombatArena.module.css", import.meta.url), "utf8");
  assert.match(styles, /\.selectionViewport\[data-step="opponents"\]\s*>\s*\.opponentSelector\s*\{[^}]*grid-template-rows:\s*auto auto minmax\(0, 1fr\) auto/s);
  assert.match(styles, /\.selectionViewport\[data-step="opponents"\]\s+\.opponentRail\s*\{[^}]*overflow-y:\s*auto/s);
  assert.match(styles, /\.selectionViewport\[data-step="opponents"\]\s+\.setupContinue\s*\{[^}]*position:\s*relative[^}]*z-index:\s*4/s);
});

test("HUD usa schede unite e vere icone raster per salute ed energia", async () => {
  const source = await readFile(new URL("../components/FamiglioCombatArena.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../components/FamiglioCombatArena.module.css", import.meta.url), "utf8");
  assert.match(source, /battle-hp-icon-v1\.png/);
  assert.match(source, /battle-energy-icon-v1\.png/);
  assert.match(styles, /\.combat\[data-battle="true"\]\s+\.battleHud[^}]*background:\s*#082833/s);
  assert.match(styles, /background-image:\s*none/);
});

test("la lotta usa superfici raster premium con trasparenza e uno sfondo dedicato", async () => {
  const css = await readFile(path.join(root, "components", "FamiglioCombatArena.module.css"), "utf8");
  const assets = [
    ["hud-panel-premium-v2.webp", true],
    ["move-card-premium-v3.webp", true],
    ["battle-backdrop-premium-v1.webp", false],
  ];
  for (const [name, transparent] of assets) {
    const file = path.join(root, "public", "famiglio", "rebuild", "combat", "ui", name);
    const info = await stat(file);
    const metadata = await sharp(await readFile(file)).metadata();
    assert.ok(info.size > 20_000, name);
    assert.equal(Boolean(metadata.hasAlpha), transparent, name);
    assert.match(css, new RegExp(name.replaceAll(".", "\\.")));
  }
  assert.match(css, /\.moveMeta/);
  assert.match(css, /background-image:\s*url\("\/famiglio\/rebuild\/combat\/ui\/battle-backdrop-premium-v1\.webp"\)/);
});

test("tutte le arene usate dalla UI sono WebP 16:9 senza ritaglio", async () => {
  assert.equal(FAMILIAR_COMBAT_CIRCUITS.length, 6);
  for (const circuit of FAMILIAR_COMBAT_CIRCUITS) {
    assert.match(circuit.backgroundSrc, /-v1\.webp$/);
    const diskPath = path.join(root, "public", ...circuit.backgroundSrc.split("/").filter(Boolean));
    const metadata = await sharp(await readFile(diskPath)).metadata();
    assert.equal(metadata.width, 1280, circuit.id);
    assert.equal(metadata.height, 720, circuit.id);
  }
  const css = await readFile(path.join(root, "components", "FamiglioCombatArena.module.css"), "utf8");
  assert.match(css, /\.battleScene[\s\S]*?aspect-ratio:\s*16\s*\/\s*9/);
  assert.match(css, /\.battleScene[\s\S]*?background-size:\s*contain/);
});

test("ogni Famiglio e crescita possiede le tredici pose battle-v2 dedicate", async () => {
  const stages = ["cucciolo", "giovane", "adulto"];
  const actions = ["entrance", "idle", "run", "physical", "magic", "attack", "technique", "guard", "hit", "win", "lose", "victory", "exhausted"];
  let files = 0;
  for (const familiar of FAMILIAR_COMBAT_CATALOG) for (const stage of stages) for (const action of actions) {
    const file = path.join(root, "public", "famiglio", "rebuild", "collection", familiar.id, "growth", stage, "battle-v2", `${action}.png`);
    const info = await stat(file);
    assert.ok(info.size > 400, `${familiar.id}/${stage}/${action}`);
    files += 1;
  }
  assert.equal(files, 53 * 3 * 13);
});

test("la UI offre 53 combattenti, quindi 52 avversari diversi per ciascuno", () => {
  assert.equal(FAMILIAR_COMBAT_CATALOG.length, 53);
  for (const familiar of FAMILIAR_COMBAT_CATALOG) {
    assert.equal(FAMILIAR_COMBAT_CATALOG.filter((candidate) => candidate.id !== familiar.id).length, 52);
  }
});
