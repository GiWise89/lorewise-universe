import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

test("la guida pubblica racconta tutte le funzioni attuali dei Famigli", () => {
  const source = readFileSync("app/giochi/nexus-pet/page.tsx", "utf8");
  for (const feature of [
    "portafoglio delle valute",
    "raggiunge il bagno",
    "LoreWise ID",
    "tre Spedizioni al giorno",
    "6 circuiti",
    "4 comandi",
    "Effetti elementali",
    "Campagna del Legame Corrotto",
    "Venti livelli",
    "gesti di comando, esultanza, rabbia, vittoria e sconfitta",
  ]) assert.match(source, new RegExp(feature));

  assert.ok(existsSync("public/famiglio/rebuild/combat/campaign/arenas/01-cortile-reietti-v1.webp"));
});
