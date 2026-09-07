import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

test("la guida pubblica racconta tutte le funzioni attuali dei Famigli", () => {
  const source = readFileSync("app/giochi/nexus-pet/page.tsx", "utf8");
  for (const feature of [
    "portafoglio delle valute",
    "raggiunge il bagno",
    "LoreWise ID",
    "Pisolino",
    "Riposo ristoratore",
    "Sonno profondo",
    "scia verde",
    "scorta conveniente da cinque dosi",
    "tre Spedizioni al giorno",
    "tre imprevisti narrativi e sei scelte",
    "6 circuiti",
    "4 comandi",
    "Effetti elementali",
    "MISS",
    "Campagna del Legame Corrotto",
    "Venti livelli",
    "gesti di comando, esultanza, rabbia, vittoria e sconfitta",
  ]) assert.match(source, new RegExp(feature));

  assert.ok(existsSync("public/famiglio/rebuild/combat/campaign/arenas/01-cortile-reietti-v1.webp"));
});
