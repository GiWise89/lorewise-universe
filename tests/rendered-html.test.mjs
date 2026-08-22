import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { getCreativeJournalEntry } from "../lib/creativeJournal.ts";

const workerUrl = new URL("../dist/server/index.js", import.meta.url);
workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
const workerPromise = import(workerUrl.href);
test("uses PostgreSQL-compatible aggregation in the personal dashboard", async () => {
  const source = await readFile(new URL("../app/api/account/dashboard/route.ts", import.meta.url), "utf8");
  assert.match(source, /STRING_AGG\(order_items\.title/);
  assert.doesNotMatch(source, /GROUP_CONCAT/i);
});

async function render(pathname = "/", init = {}) {
  const { default: worker } = await workerPromise;
  const headers = new Headers(init.headers);
  if (!headers.has("accept")) headers.set("accept", "text/html");
  return worker.fetch(new Request(`http://localhost${pathname}`, { ...init, headers }), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
}

test("renders LoreWise Universe with its structured portals", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /LoreWise/);
  assert.match(html, /Universe/);
  assert.match(html, /GiWise Studio/);
  assert.match(html, /Enciclopedia/);
  assert.match(html, /Commissioni/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});

test("applies the global browser security policy", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-security-policy") ?? "", /frame-ancestors 'none'/);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.equal(response.headers.get("referrer-policy"), "strict-origin-when-cross-origin");
  assert.match(response.headers.get("permissions-policy") ?? "", /camera=\(\)/);
});

test("publishes robots, manifest and a dynamic public sitemap", async () => {
  const robots = await render("/robots.txt");
  assert.equal(robots.status, 200);
  assert.match(await robots.text(), /Disallow: \//);
  const manifest = await render("/manifest.webmanifest");
  assert.equal(manifest.status, 200);
  assert.equal((await manifest.json()).name, "LoreWise Universe");
  const sitemap = await render("/sitemap.xml");
  assert.equal(sitemap.status, 200);
  const xml = await sitemap.text();
  assert.match(xml, /\/arte\/lw-art-001/);
  assert.match(xml, /\/enciclopedia\//);
  assert.match(xml, /\/cerca/);
  assert.match(xml, /\/dove-nascono-i-mondi/);
  assert.doesNotMatch(xml, /\/gestione-ordini/);
});

test("renders the GiWise creative journal with originals and clearly separated reinterpretations", async () => {
  const response = await render("/dove-nascono-i-mondi");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Dove nascono i mondi/);
  assert.match(html, /Scappa finch/);
  assert.match(html, /La Custode delle Due Lune/);
  assert.match(html, /Ritratto vampiresco/);
  assert.match(html, /reinterpretazione personale non ufficiale/);
  assert.match(html, /lw-art-041-preview\.jpg/);
  assert.match(html, /lw-wip-001-a-preview\.jpg/);
  assert.match(html, /lw-wip-001-b-preview\.jpg/);
  assert.match(html, /lw-wip-007-preview\.jpg/);
  assert.match(html, /Il mio diario creativo/);
  assert.match(html, /Creazioni originali/);
  assert.match(html, /Reinterpretazioni/);
  assert.match(html, /Qualcosa di me/);
  assert.match(html, /Mondi in costruzione/);
  assert.doesNotMatch(html, /Scorri per vedere tutto/);
  assert.doesNotMatch(html, /La storia del personaggio|La chiamavano Terza/);
  assert.match(html, /href="\/dove-nascono-i-mondi\/scappa-finche-puoi"/);
});

test("keeps the newest artwork lore truthful and links verified finals to the journal", async () => {
  const virginResponse = await render("/arte/lw-art-067");
  assert.equal(virginResponse.status, 200);
  const virginHtml = await virginResponse.text();
  assert.match(virginHtml, /Vergine Maria · Fede corrotta/);
  assert.match(virginHtml, /cuore custodito sul petto/);
  assert.doesNotMatch(virginHtml, /bambino|tra le braccia/);

  const custode = getCreativeJournalEntry("custode-delle-due-lune");
  assert.equal(custode?.image?.src, "/artworks/previews/lw-art-064-preview.jpg");
  assert.equal(custode?.artworkHref, "/arte/lw-art-064");
  assert.equal(custode?.status, "completo");

  const pennywise = getCreativeJournalEntry("pennywise-welcome-to-derry");
  assert.equal(pennywise?.image?.src, "/artworks/previews/lw-art-066-preview.jpg");
  assert.equal(pennywise?.artworkHref, "/arte/lw-art-066");
});

test("renders a unified search across the LoreWise catalogs", async () => {
  const response = await render("/cerca");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Trova ogni parte dell.universo/i);
  assert.match(html, /The Wound Remembers/i);
  assert.match(html, /Esempio: Simpson, dark fantasy, ritratto/i);
});

test("routes the verified shop catalog through LoreWise product dossiers", async () => {
  const response = await render("/shop/catalogo");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /103[\s\S]{0,80}prodotti verificati/);
  assert.match(html, /href="\/shop\/catalogo\/gs-001"/);
  assert.match(html, /Esplora la scheda LoreWise/);
});

test("renders premium shop dossiers at the beginning and end of the catalog", async () => {
  for (const [slug, code] of [["gs-001", "GS-001"], ["gs-104", "GS-104"]]) {
    const response = await render(`/shop/catalogo/${slug}`);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, new RegExp(code));
    assert.match(html, /A partire da/);
    assert.match(html, /Anteprima integrale verificata/);
    assert.match(html, /GiWiseShop\.it/);
    assert.match(html, /Hoplix/);
  }
});

test("preserves the bespoke GS-004 gallery and verified variants", async () => {
  const response = await render("/shop/catalogo/gs-004");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /T-Shirt &amp; Felpa Itachi Uchiha/);
  assert.match(html, /gs-004-itachi-tshirt\.webp/);
  assert.match(html, /gs-004-itachi-felpa\.webp/);
  assert.match(html, /T-Shirt Unisex/);
  assert.match(html, /Felpa/);
});

test("renders a detailed encyclopedia entry", async () => {
  const response = await render("/enciclopedia/nhevara-madreferita");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Nhevara, Madreferita/);
  assert.match(html, /Identità/);
  assert.match(html, /Data di nascita/);
  assert.match(html, /Relazioni/);
  assert.match(html, /Fonti e controllo editoriale/);
  assert.match(html, /Cripta delle Sette Vene/);
  assert.match(html, /Lore originale sviluppata per LoreWise Codex/);
  assert.match(html, /Spoiler protetti/);
  assert.match(html, /Percorsi collegati/);
  assert.match(html, /Continua nell.archivio/);
  assert.doesNotMatch(html, /Da documentare|Campi ancora da decidere insieme/);
  assert.doesNotMatch(html, /Lyra Vesper/);
});

test("renders the documented Codex archive without mixing GiWise originals", async () => {
  const response = await render("/enciclopedia");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.ok(Buffer.byteLength(html) < 700_000, "L'indice non deve serializzare i dossier completi nel browser");
  assert.match(html, /442[\s\S]{0,80}dossier completi/);
  assert.match(html, /Originali GiWise/);
  assert.match(html, /Pennywise, il Clown Danzante/);
  assert.doesNotMatch(html, /href="\/enciclopedia\/pennywise-(?:modern|1990)"/);
  assert.doesNotMatch(html, /Nhevara, Madreferita/);
  assert.doesNotMatch(html, /Elyra, Voce Negata/);
  assert.match(html, /Tutte le categorie/);
  assert.match(html, /Tutti gli universi/);
  assert.match(html, /Stato editoriale/);
  assert.match(html, /Tutti gli stati/);
  assert.match(html, /codex-archive-convergences-scene-v1\.webp/);
  assert.match(html, /lorewise-codex-emblem-v1\.webp/);
  assert.match(html, /Azzera ricerca e filtri/);
});

test("renders the separate GiWise Originals archive", async () => {
  const response = await render("/enciclopedia/originali-giwise");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Originali[\s\S]*GiWise/);
  assert.match(html, /223[\s\S]{0,80}dossier originali/);
  assert.match(html, /Nhevara, Madreferita/);
  assert.match(html, /Kharvoss, Re Sepolto/);
  assert.match(html, /Elyra, Voce Negata/);
  assert.doesNotMatch(html, /Pennywise, il Clown Danzante/);
});

test("renders a fully researched Animal Crossing dossier with its exact associated image", async () => {
  const response = await render("/enciclopedia/tom-nook");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Tom Nook/);
  assert.match(html, /Nook Inc/);
  assert.match(html, /Marco e Mirco/);
  assert.match(html, /Animal Crossing: New Horizons/);
  assert.match(html, /codex\/display\/fuori-trama\/tom-nook\.webp/);
  assert.match(html, /Il dossier segue il ruolo ricorrente di Tom Nook nei videogiochi principali/);
  assert.doesNotMatch(html, /Fuori Trama|Nexus|Crossover LoreWise|Forza\s+\d|Destrezza\s+\d|Intelligenza\s+\d|Carisma\s+\d|Ruolo tattico|Modulo GiWise Studio/);
  assert.doesNotMatch(html, /Da documentare|Campi ancora da decidere insieme/);
});

test("renders Eric Cartman as an encyclopedic character without internal game data", async () => {
  const response = await render("/enciclopedia/eric-cartman");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Eric Cartman/);
  assert.match(html, /South Park/);
  assert.doesNotMatch(html, /Fuori Trama|Nexus|Forza\s+\d|Destrezza\s+\d|Intelligenza\s+\d|Carisma\s+\d|Ruolo tattico|Modulo GiWise Studio|Dossier originale · autenticità GiWise Studio/);
});

test("merges Penny's alternate associated image into one public dossier", async () => {
  const response = await render("/enciclopedia/penny");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /codex\/display\/fuori-trama\/penny\.webp/);
  assert.match(html, /codex\/display\/fuori-trama\/penny-human-extra\.webp/);
  assert.match(html, /Interpretazione visiva alternativa associata al personaggio/);
});

test("renders a generated original dossier with every Codex chapter populated", async () => {
  const response = await render("/enciclopedia/giwise-twr-viandante-coro-inverso");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Dossier originale · autenticità GiWise Studio/);
  assert.match(html, /Elyra, Voce Negata/);
  assert.match(html, /Canto Retrogrado/);
  assert.match(html, /Coro Inverso/);
  assert.match(html, /Identità/);
  assert.match(html, /Appartenenza/);
  assert.match(html, /Biografia/);
  assert.match(html, /Personalità/);
  assert.match(html, /Aspetto e capacità/);
  assert.match(html, /Relazioni/);
  assert.match(html, /Apparizioni/);
  assert.match(html, /Fonti/);
  assert.doesNotMatch(html, /Da documentare|Campi ancora da decidere insieme/);
});

test("renders Kharvoss as a second complete original-character dossier", async () => {
  const response = await render("/enciclopedia/kharvoss-re-sepolto");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Kharvoss, Re Sepolto/);
  assert.match(html, /Tomba Affamata/);
  assert.match(html, /Vhar-Mor/);
  assert.match(html, /Sepoltura Sovrana/);
  assert.match(html, /Lore originale sviluppata per LoreWise Codex/);
  assert.match(html, /nhevara-madreferita/);
  assert.doesNotMatch(html, /Da documentare|Campi ancora da decidere insieme/);
});

test("renders Pennywise from documented sources and only Fuori Trama character-sheet images", async () => {
  const response = await render("/enciclopedia/pennywise-it");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Pennywise, il Clown Danzante/);
  assert.match(html, /Romanzo di Stephen King del 1986/);
  assert.match(html, /Macroverso/);
  assert.match(html, /Club dei Perdenti/);
  assert.match(html, /It: Welcome to Derry/);
  assert.match(html, /1962/);
  assert.match(html, /Serie televisiva HBO/);
  assert.match(html, /Bill Skarsgård/);
  assert.match(html, /continuità dei film di Andy Muschietti/);
  assert.match(html, /Il personaggio attraverso gli adattamenti/);
  assert.match(html, /miniserie televisiva del 1990, interpretato da Tim Curry/);
  assert.doesNotMatch(html, /Fuori Trama|Nexus|Forza|Destrezza|Carisma|Ruolo tattico/);
  assert.match(html, /codex\/display\/pennywise-modern\.webp/);
  assert.match(html, /codex\/display\/pennywise-1990\.webp/);
  assert.doesNotMatch(html, /pennywise-standee|pennywise-fuori-trama-prologue|codex-authorial/);
  assert.doesNotMatch(html, /Immagini già allegate a Fuori Trama|immagine della scheda personaggio distinta/);
  assert.doesNotMatch(html, /Da documentare|Campi ancora da decidere insieme/);
});

test("redirects duplicate Pennywise records to the single canonical dossier", async () => {
  for (const slug of ["pennywise-modern", "pennywise-1990"]) {
    const response = await render(`/enciclopedia/${slug}`);
    assert.match(String(response.status), /307|308/);
    assert.match(response.headers.get("location") ?? "", /\/enciclopedia\/pennywise-it$/);
  }
});

test("renders the protected art catalog without deriving public titles from filenames", async () => {
  const response = await render("/arte");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /LW-ART-001/);
  assert.match(html, /Art the Clown/);
  assert.doesNotMatch(html, /Titolo da assegnare/);
  assert.match(html, /Esplora le opere disponibili e quelle custodite in esposizione/);
  assert.match(html, /originali saranno acquistabili singolarmente oppure tramite i crediti mensili/);
  assert.match(html, /Indice della collezione/);
  assert.match(html, /Esplora l’archivio/);
  assert.match(html, /Titolo o codice/);
  assert.match(html, />2025</);
  assert.match(html, />2026</);
  assert.match(html, /Tutti i generi/);
  assert.match(html, /Horror e dark art/);
  assert.match(html, /Anime e manga/);
  assert.match(html, /Contenuti per adulti/);
  assert.match(html, /Fascia di prezzo/);
  assert.match(html, /Originali GiWise/);
  assert.match(html, /Fan art e originali custoditi online/);
  assert.match(html, /originals-emblem-v1\.webp/);
  assert.match(html, /fanart-emblem-v1\.webp/);
  assert.match(html, /Ordina/);
  assert.match(html, /Apri il capitolo successivo/);
  assert.match(html, /Visualizzate[\s\S]*6[\s\S]*67 opere/);
  assert.match(html, /Originale autorizzata/);
  assert.match(html, /Fascia Essenziale/);
  assert.match(html, /Fascia Dettagliata/);
  assert.match(html, /Fascia Premium/);
  assert.match(html, /8,90/);
  assert.match(html, /12,90/);
  assert.match(html, /17,90/);
  assert.match(html, /Solo esposizione/);
  assert.match(html, /Opera sigillata[\s\S]*18\+/);
  assert.match(html, /adult-cover-v2\.webp/);
  assert.match(html, /originals-seal-card-v1\.webp/);
  assert.match(html, /fanart-seal-card-v1\.webp/);
  assert.doesNotMatch(html, /Art The Clown II2|GiWise Restored|LolaGang/);
  assert.match(html, /href="\/arte\/lw-art-003"/);
});

test("renders the nine newly authorized originals with their approved price tiers", async () => {
  const expected = [
    ["048", "Fascia Dettagliata", "12,90", "1748 × 2480 px"],
    ["049", "Fascia Premium", "17,90", "3840 × 2160 px"],
    ["050", "Fascia Dettagliata", "12,90", "1748 × 2480 px"],
    ["051", "Fascia Premium", "17,90", "1748 × 2480 px"],
    ["052", "Fascia Dettagliata", "12,90", "1748 × 2480 px"],
    ["053", "Fascia Premium", "17,90", "1748 × 2480 px"],
    ["054", "Fascia Premium", "17,90", "2480 × 3508 px"],
    ["055", "Fascia Dettagliata", "12,90", "2480 × 3508 px"],
    ["056", "Fascia Premium", "17,90", "2480 × 3508 px"],
  ];

  for (const [code, tier, price, resolution] of expected) {
    const response = await render(`/arte/lw-art-${code}`);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, new RegExp(`LW-ART-${code}`));
    assert.match(html, new RegExp(tier));
    assert.match(html, new RegExp(price));
    assert.match(html, new RegExp(resolution));
    assert.match(html, /Acquisto protetto/);
  }

  const adultResponse = await render("/arte/lw-art-054");
  const adultHtml = await adultResponse.text();
  assert.match(adultHtml, /riservato a un pubblico adulto/i);
  assert.doesNotMatch(adultHtml, /nun sex/i);
});

test("identifies every non-commercial fan artwork with the real character name", async () => {
  const fanArtworks = [
    ["001", "Art the Clown"],
    ["007", "Bart Simpson × Freddy Krueger"],
    ["008", "Bart Simpson"],
    ["009", "Batwoman"],
    ["010", "Betty Boop"],
    ["011", "Billy, Mandy e Tenebra"],
    ["012", "Bud Spencer e Terence Hill"],
    ["014", "Bulma"],
    ["015", "Bulma"],
    ["018", "Charlot"],
    ["019", "Chucky e Annabelle"],
    ["021", "Gaara"],
    ["022", "Sailor Moon"],
    ["023", "Ghostface"],
    ["025", "Homer Simpson"],
    ["026", "Pennywise"],
    ["027", "Itachi Uchiha"],
    ["029", "Kenshiro"],
    ["031", "Lae’zel"],
    ["032", "Lola Bunny"],
    ["034", "Majin Bu"],
    ["038", "Principessa Peach"],
    ["040", "Roger, Naruto e Jiraiya"],
    ["042", "Sanji"],
    ["043", "Sakura Haruno"],
    ["044", "Sasuke Uchiha"],
    ["045", "Ghostface"],
    ["047", "Stanlio e Ollio"],
  ];

  for (const [code, characterName] of fanArtworks) {
    const response = await render(`/arte/lw-art-${code}`);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, new RegExp(characterName));
    assert.match(html, /Fan art · Solo esposizione/);
    assert.doesNotMatch(html, /Acquisto protetto/);
  }
});

test("sells LW-ART-035 and LW-ART-036 as approved originals", async () => {
  const expected = [
    ["035", "Fascia Dettagliata", "12,90", "1748 × 2480 px"],
    ["036", "Fascia Premium", "17,90", "2480 × 3508 px"],
  ];

  for (const [code, tier, price, resolution] of expected) {
    const response = await render(`/arte/lw-art-${code}`);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /Originale autorizzata/);
    assert.match(html, new RegExp(tier));
    assert.match(html, new RegExp(price));
    assert.match(html, new RegExp(resolution));
    assert.match(html, /Acquisto protetto/);
    assert.doesNotMatch(html, /Fan art · Solo esposizione/);
  }
});

test("renders LW-ART-002 as an approved original commercial artwork", async () => {
  const response = await render("/arte/lw-art-002");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /La Regina Caduta/);
  assert.match(html, /2025/);
  assert.match(html, /Fiaba oscura/);
  assert.match(html, /2480 × 3508 px/);
  assert.match(html, /Fascia Premium/);
  assert.match(html, /Acquisto protetto[\s\S]*17,90/);
});

test("renders a protected, structured artwork detail page", async () => {
  const response = await render("/arte/lw-art-003");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /LW-ART-003/);
  assert.match(html, /Legami Infernali/);
  assert.match(html, /2025/);
  assert.match(html, /Horror romantico/);
  assert.match(html, /catene rosse/);
  assert.match(html, /Descrizione/);
  assert.match(html, /Scheda tecnica/);
  assert.match(html, /2480 × 3508 px/);
  assert.match(html, /Anteprima web ridotta/);
  assert.match(html, /Autenticità GiWise Studio/);
  assert.match(html, /Edizione e licenza/);
  assert.match(html, /PNG appiattito senza filigrana/);
  assert.match(html, /Uso consentito/);
  assert.match(html, /Uso vietato/);
  assert.match(html, /Altre opere in[\s\S]*Horror e dark art/);
  assert.match(html, /Opera successiva/);
  assert.match(html, /Acquisto protetto[\s\S]*17,90/);
  assert.match(html, /Verifica del pagamento protetto in corso/);
  assert.match(html, /dossier-divider-display-v1\.webp/);
  assert.match(html, /Reazioni dalla community/);
  assert.match(html, /L’opera continua negli occhi di chi guarda/);
  assert.match(html, /Accedi per lasciare un apprezzamento/);
  assert.match(html, /nessun commento dimostrativo|senza contenuti dimostrativi/i);
  assert.doesNotMatch(html, /Art The Clown II2|GiWise Restored|LolaGang/);
});

test("renders a transparent post-purchase package simulation without exposing the original", async () => {
  const response = await render("/arte/lw-art-003/pacchetto");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Simulazione locale/);
  assert.match(html, /Cosa riceverai/);
  assert.match(html, /PNG appiattito, senza filigrana/);
  assert.match(html, /Certificato nominativo/);
  assert.match(html, /0 download utilizzati su 3/);
  assert.match(html, /Scarica il manifesto dimostrativo/);
  assert.match(html, /file originale non viene mai collocato nella parte pubblica/i);
});

test("downloads only the harmless artwork package manifest in the public simulation", async () => {
  const response = await render("/api/artwork-package-demo?code=LW-ART-003", { headers: { accept: "text/plain" } });
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-disposition") ?? "", /^attachment;/);
  const body = await response.text();
  assert.match(body, /PACCHETTO DIMOSTRATIVO/);
  assert.match(body, /Non contiene l'opera originale/);
  assert.match(body, /massimo 3 download/);
});

test("renders approved years, titles and descriptions for every catalog artwork", async () => {
  const artworks2025 = [1, 2, 3, 4, 5, 7, 10, 13, 14, 17, 19, 21, 24, 25, 26, 27, 28, 29, 30, 35, 36, 39, 40, 42, 43, 54, 55, 56];
  const artworks2026 = [6, 8, 9, 11, 12, 15, 16, 18, 20, 22, 23, 31, 32, 33, 34, 37, 38, 41, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 57, 58, 59, 60, 61, 62, 63];

  for (const [year, numbers] of [["2025", artworks2025], ["2026", artworks2026]]) {
    for (const artworkNumber of numbers) {
      const code = String(artworkNumber).padStart(3, "0");
      const response = await render(`/arte/lw-art-${code}`);
      assert.equal(response.status, 200);
      const html = await response.text();
      assert.match(html, new RegExp(`LW-ART-${code}`));
      assert.match(html, new RegExp(year));
      assert.match(html, /Tecnica/);
      assert.match(html, /Categoria/);
      assert.doesNotMatch(html, /Titolo da assegnare|Descrizione in preparazione|Da documentare|Da definire/);
    }
  }
});

test("renders the seven new 2026 originals with the approved commercial split", async () => {
  const commercial = [
    ["057", "Il Predicatore del Vuoto", "17,90"],
    ["058", "L’Infanzia che Ride", "17,90"],
    ["059", "La Morsa Interiore", "12,90"],
    ["060", "Il Piccolo Risorto", "12,90"],
    ["061", "Misuzu · Festa Cremisi", "17,90"],
    ["063", "Arcobaleno Indomabile", "12,90"],
  ];

  for (const [code, title, price] of commercial) {
    const response = await render(`/arte/lw-art-${code}`);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, new RegExp(title));
    assert.match(html, new RegExp(`Acquisisci l’opera[\\s\\S]*${price}`));
    assert.match(html, /Autenticità GiWise Studio/);
  }

  const exhibitionResponse = await render("/arte/lw-art-062");
  assert.equal(exhibitionResponse.status, 200);
  const exhibitionHtml = await exhibitionResponse.text();
  assert.match(exhibitionHtml, /Resti di un Addio/);
  assert.match(exhibitionHtml, /Arte originale/);
  assert.match(exhibitionHtml, /Autenticità GiWise Studio/);
  assert.match(exhibitionHtml, /Opera in sola esposizione/);
  assert.doesNotMatch(exhibitionHtml, /Acquisto protetto|Tributo non commerciale/);
});

test("renders the approved metadata and adult warning for LW-ART-006", async () => {
  const response = await render("/arte/lw-art-006");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Frutto Proibito/);
  assert.match(html, /2026/);
  assert.match(html, /Pop art provocatoria/);
  assert.match(html, /sessualmente esplicito/i);
  assert.match(html, /Confermo di avere almeno 18 anni/);
  assert.match(html, /adult-cover-v2\.webp/);
  assert.match(html, /1748 × 2480 px/);
});

test("protects every artwork classified as 18+ after the complete visual audit", async () => {
  const adultCodes = ["006", "032", "037", "038", "054", "055"];

  for (const code of adultCodes) {
    const response = await render(`/arte/lw-art-${code}`);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /Confermo di avere almeno 18 anni/);
    assert.match(html, /adult-cover-v2\.webp/);
    assert.match(html, /riservat[oaie]+ a un pubblico adulto/i);
  }

  for (const code of ["014", "015", "030", "031", "036"]) {
    const response = await render(`/arte/lw-art-${code}`);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.doesNotMatch(html, /Confermo di avere almeno 18 anni/);
  }
});

test("renders the second approved batch of original artworks", async () => {
  const expected = [
    ["013", "Meditazione della Carne", "2025"],
    ["016", "Cera Viva", "2026"],
    ["017", "La Cacciatrice del Bosco", "2025"],
    ["020", "Il Grido tra i Rovi", "2026"],
  ];

  for (const [code, title, year] of expected) {
    const response = await render(`/arte/lw-art-${code}`);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, new RegExp(title));
    assert.match(html, new RegExp(year));
    assert.match(html, /Acquisto protetto/);
  }
});

test("renders the membership proposal with transparent Stripe checkout", async () => {
  const response = await render("/abbonamento");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Supporter/);
  assert.match(html, /Collector/);
  assert.match(html, /Cataloghi pubblici, anteprime protette/);
  assert.match(html, /opera originale autorizzata per ogni credito/i);
  assert.match(html, /1 credito Arte ogni mese/);
  assert.match(html, /2 crediti Arte ogni mese/);
  assert.match(html, /7,90/);
  assert.match(html, /13,90/);
  assert.match(html, /massimo 2/i);
  assert.match(html, /massimo 4/i);
  assert.match(html, /5% automatico/);
  assert.match(html, /10% automatico/);
  assert.match(html, /giochi e prodotti digitali ammessi/i);
  assert.match(html, /demo riservate/i);
  assert.match(html, /Candidature alle beta/i);
  assert.match(html, /Codex personale e badge Supporter/i);
  assert.match(html, /Dossier originali estesi per Collector/i);
  assert.match(html, /Pagamento trasparente/i);
  assert.match(html, /Stripe opera in prova oppure/i);
});

test("renders art packages, personal license and protected delivery as a local draft", async () => {
  const response = await render("/licenza-arte");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Bozza locale pre-lancio/i);
  assert.match(html, /File PNG appiattito/i);
  assert.match(html, /48 ore/i);
  assert.match(html, /3 tentativi/i);
  assert.match(html, /NFT/i);
  assert.match(html, /intelligenza artificiale/i);
  assert.match(html, /non trasferisce il diritto d’autore/i);
  assert.match(html, /nessun acquisto o collegamento privato è ancora attivo/i);
});

test("renders the complete protected commission portfolio", async () => {
  const response = await render("/commissioni");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Trentadue richieste, sei percorsi creativi/);
  assert.match(html, /Ritratti personalizzati/);
  assert.match(html, /Coppie e legami/);
  assert.match(html, /Animali/);
  assert.match(html, /Trasformazioni fantasy\/horror/);
  assert.match(html, /Fan art e ritratti iconici/);
  assert.match(html, /Tre modi di essere/);
  assert.match(html, /I nomi degli artisti restano visibili/);
  assert.match(html, /Michael Jackson/);
  assert.match(html, /Marilyn Manson/);
  assert.match(html, /The Notorious B\.I\.G\./);
  assert.match(html, /Warhammer 40,000/);
  assert.match(html, /Commissione realizzata/);
  assert.match(html, /Richiedi un’opera simile/);
  assert.match(html, /2026/);
  assert.doesNotMatch(html, /Anno da confermare/);
  assert.match(html, /Tariffe di lancio 2026/);
  assert.ok(html.indexOf("Tariffe di lancio 2026") < html.indexOf("Trentadue richieste, sei percorsi creativi"));
  assert.match(html, /Disponibilità di lancio/);
  assert.match(html, /10/);
  assert.match(html, /Ritratto Essenziale/);
  assert.match(html, /lw-com-002-preview\.webp/);
  assert.match(html, /Ritratto Completo/);
  assert.match(html, /lw-com-003-preview\.webp/);
  assert.match(html, /Opera Narrativa/);
  assert.match(html, /3 giorni lavorativi/);
  assert.match(html, /5 giorni lavorativi/);
  assert.match(html, /8 giorni lavorativi/);
  assert.doesNotMatch(html, /7–10 giorni lavorativi|10–15 giorni lavorativi|15–25 giorni lavorativi/);
  assert.match(html, /49 €/);
  assert.match(html, /79 €/);
  assert.match(html, /119 €/);
  assert.doesNotMatch(html, /59 €|89 €|129 €/);
  assert.match(html, /Acconto del 50%/);
  assert.match(html, /preventivo/i);
  assert.match(html, /acconto concordato/i);
  assert.match(html, /LoreWise ID richiesto/);
  assert.match(html, /sconto corretto/i);
  assert.match(html, /applicato al totale/i);
  assert.match(html, /Mostra altri lavori/);
  assert.match(html, /Scegli questo percorso/);
  assert.match(html, /Non vengono accettate richieste di nudo, pornografia o contenuti sessualmente espliciti/);
  assert.match(html, /href="\/commissioni\/condizioni"/);
  assert.match(html, /href="\/account"/);
  assert.match(html, /Domande frequenti/);
  assert.match(html, /href="\/commissioni\/stato"/);
  assert.match(html, /Quali immagini posso allegare/);
  assert.match(html, /Il mio ritratto verrà pubblicato/);
  assert.doesNotMatch(html, /Invio in preparazione/);
  assert.doesNotMatch(html, /Acquista l’opera|download disponibile/i);
});

test("renders a commission dossier without sale or download actions", async () => {
  const response = await render("/commissioni/lw-com-015");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /LW-COM-015/);
  assert.match(html, /Leo · Piccolo sole/);
  assert.match(html, /Ritratto di animale/);
  assert.match(html, /Filigrana incorporata/);
  assert.match(html, /Un esempio, non un prodotto/);
  assert.match(html, /Richiedi un lavoro simile/);
  assert.match(html, /2480 × 3508 px/);
  assert.match(html, /2026/);
  assert.doesNotMatch(html, /Anno da confermare/);
  assert.doesNotMatch(html, /Acquista l.opera|download disponibile|€|Disponibile prossimamente/i);
});

test("protects the GiWise commission management workspace outside development", async () => {
  const response = await render("/gestione-commissioni");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Accedi con il profilo amministratore LoreWise ID/);
  assert.match(html, /href="\/account"/);
  assert.doesNotMatch(html, /commission-admin-dashboard/);
});

test("renders the private client commission status journey", async () => {
  const response = await render("/commissioni/stato");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Segui la tua/);
  assert.match(html, /Codice richiesta/);
  assert.match(html, /Mostra la richiesta/);
  assert.match(html, /Il percorso dell’opera apparirà qui/);
  assert.match(html, /Consulta condizioni e politica dei contenuti/);
  assert.doesNotMatch(html, /adminNotes|guardianName|privacyConsent/);
});

test("renders public commission conditions with the approved content policy", async () => {
  const response = await render("/commissioni/condizioni");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Limiti creativi non negoziabili/);
  assert.match(html, /nudo, pornografia o contenuti sessualmente espliciti/i);
  assert.match(html, /politiche, partitiche o di propaganda/i);
  assert.match(html, /gore e splatter sono valutabili solo in forma moderata e non esplicita/i);
  assert.match(html, /genitore o tutore legale/i);
  assert.match(html, /LW-COM-TERMS-2026-08-18/);
  assert.match(html, /non vengono usati per addestrare sistemi di intelligenza artificiale/i);
});

test("renders the real GiWise Studio game catalog without simulated purchases", async () => {
  const response = await render("/giochi");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /The Wound Remembers/);
  assert.match(html, /Fuori Trama/);
  assert.match(html, /Demon Match Three/);
  assert.match(html, /Disponibile e in aggiornamento/);
  assert.match(html, /In sviluppo/);
  assert.match(html, /GS-GAME-001/);
  assert.match(html, /GS-GAME-002/);
  assert.match(html, /GS-GAME-003/);
  assert.doesNotMatch(html, /Progetto Alpha|Progetto Beta|Acquista ora/);
});

test("renders The Wound Remembers as a live evolving game with a verified but unavailable Windows edition", async () => {
  const response = await render("/giochi/the-wound-remembers");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Dark fantasy PvE card RPG/);
  assert.match(html, /Versione web 1\.0\.0/);
  assert.match(html, /Italiano · interfaccia e contenuti/);
  assert.match(html, /Limiti conosciuti e materiali/);
  assert.match(html, /Windows SmartScreen/);
  assert.match(html, /video ufficiale verrà aggiunto soltanto dopo approvazione/i);
  assert.match(html, /Campagna narrativa articolata in dieci atti/);
  assert.match(html, /Windows €7,99 al lancio/);
  assert.match(html, /prezzo ordinario futuro previsto di €9,99/);
  assert.match(html, /Edizione Windows/);
  assert.match(html, /Distribuzione ufficiale GiWise Studio/);
  assert.match(html, /APK Android/);
  assert.match(html, /Download APK non ancora disponibile/);
  assert.match(html, /Aggiornamenti ufficiali/);
  assert.match(html, /18 agosto 2026/);
  assert.match(html, /276 carte verificate e 31 Evoluzioni/);
  assert.match(html, /Nessuna versione pubblica precedente/);
  assert.match(html, /Community verificata/);
  assert.match(html, /nessuna recensione dimostrativa/i);
  assert.match(html, /Come si gioca/);
  assert.match(html, /Costruisci il Patto/);
  assert.match(html, /Installer 1\.0\.2 verificato/);
  assert.match(html, /GS-GAME-001-WIN/);
  assert.match(html, /Cosa manca all.edizione Windows/i);
  assert.match(html, /Tutto dichiarato, prima del download/i);
  assert.match(html, /Licenza personale, non esclusiva e non trasferibile/i);
  assert.match(html, /senza certificato commerciale/i);
  assert.match(html, /Defender, installazione, avvio desktop e disinstallazione superati/i);
  assert.match(html, /GiWise Studio invia il collegamento privato all.email verificata/i);
  assert.match(html, /Da completare/i);
  assert.match(html, /https:\/\/thewoundremembers\.com\//);
  assert.match(html, /Gioca alla versione web/);
  assert.doesNotMatch(html, /Acquista e scarica|Scarica EXE/);
  assert.doesNotMatch(html, /itch\.io/);
});

test("renders the transparent draft license for the future Windows edition", async () => {
  const response = await render("/licenza-gioco");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Licenza personale/i);
  assert.match(html, /dei giochi/i);
  assert.match(html, /Nessun acquisto o download è attivo/i);
  assert.match(html, /non esclusiva e non trasferibile/i);
  assert.match(html, /non dovrà mai disattivare antivirus o protezioni di Windows/i);
  assert.match(html, /SHA-256 pubblicato e verificabile/i);
});

test("renders Fuori Trama as a free tactical RPG dossier with current desktop gameplay", async () => {
  const response = await render("/giochi/lorewise-fuori-trama-next");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Fuori Trama/);
  assert.match(html, /RPG tattico di LoreWise Universe con regole d20/);
  assert.match(html, /Pre-release 0\.1\.0/);
  assert.match(html, /Italiano · sviluppo corrente/);
  assert.match(html, /Gratuito per tutti/);
  assert.match(html, /Download gratuito in preparazione/);
  assert.match(html, /Entra nello sviluppo/);
  assert.match(html, /Universe Pass/);
  assert.match(html, /non costituisce il prezzo del gioco/);
  assert.match(html, /gameplay-current-campaigns\.webp/);
  assert.match(html, /gameplay-current-expedition-party\.webp/);
  assert.match(html, /gameplay-current-tactical-battle\.webp/);
  assert.match(html, /gameplay-current-card-duel\.webp/);
  assert.match(html, /Risolvi il duello con le carte/);
  assert.match(html, /audit dei contenuti/);
  assert.match(html, /universi di terzi/);
  assert.doesNotMatch(html, /Acquista ora|Scarica gratuitamente/);
});

test("renders Demon Match Three with its official identity and verified 2.1 development status", async () => {
  const response = await render("/giochi/demon-match-three");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Demon Match Three/);
  assert.match(html, /Horror match-3 RPG rituale/);
  assert.match(html, /Versione di sviluppo 2\.1\.0/);
  assert.match(html, /logo-official-v2\.webp/);
  assert.match(html, /60\/60 scenari gameplay superati/);
  assert.match(html, /Copertura delle schermate 22\/22/);
  assert.match(html, /Audit del bilanciamento su 100 livelli/);
  assert.match(html, /Prezzo previsto €5,99/);
  assert.match(html, /prezzo ordinario futuro previsto di €7,99/);
  assert.match(html, /APK ufficiale GiWise Studio dal catalogo LoreWise/);
  assert.match(html, /gameplay-current-menu\.webp/);
  assert.match(html, /gameplay-current-map\.webp/);
  assert.match(html, /gameplay-current-battle\.webp/);
  assert.match(html, /gameplay-current-reward\.webp/);
  assert.match(html, /gameplay-current-reliquary\.webp/);
  assert.match(html, /gameplay-current-nightmare\.webp/);
  assert.match(html, /gameplay-current-porter\.webp/);
  assert.match(html, /Sette catture reali della versione desktop 2\.1\.0/);
  assert.match(html, /senza ritagli, deformazioni o sostituzioni/);
  assert.match(html, /APK 0\.1\.8 non rappresenta la versione attuale/);
  assert.match(html, /Distribuzione e disponibilità/);
  assert.match(html, /In preparazione/);
  assert.doesNotMatch(html, /Acquista ora|Download APK disponibile/);
});

test("renders the unified LoreWise account with a safe authentication state and no payments", async () => {
  const response = await render("/account");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /LoreWise ID/);
  assert.match(html, /Tutto ciò che/);
  assert.match(html, /Ordini/);
  assert.match(html, /Arte e licenze/);
  assert.match(html, /Commissioni/);
  assert.match(html, /Abbonamento/);
  assert.match(html, /Libreria giochi/);
  assert.match(html, /Accesso sicuro (?:in preparazione|disponibile)/);
  assert.match(html, /Registrati/);
  assert.match(html, /Imposta o recupera password/);
  assert.match(html, /Collegamento non ancora attivo|Accedi al profilo/);
  assert.doesNotMatch(html, /Accedi ora|Registrati ora|Inserisci la carta|Paga ora/);

  const confirmedResponse = await render("/account?accesso=confermato");
  assert.equal(confirmedResponse.status, 200);
  assert.match(await confirmedResponse.text(), /L’email risulta confermata\. Accedi ora usando la password scelta durante la registrazione/);

  const expiredResponse = await render("/account?accesso=sessione-attiva");
  assert.equal(expiredResponse.status, 200);
  assert.match(await expiredResponse.text(), /La sessione non è più attiva su questo dispositivo/);

  const callbackResponse = await render("/auth/callback");
  assert.equal(callbackResponse.status, 200);
  assert.match(await callbackResponse.text(), /Verifica dell’accesso in corso/);

  const recoveryConfirmationResponse = await render("/auth/confirm?next=%2Faccount%2Fpassword&token_hash=token-di-prova&type=recovery");
  assert.equal(recoveryConfirmationResponse.status, 200);
  const recoveryConfirmationHtml = await recoveryConfirmationResponse.text();
  assert.match(recoveryConfirmationHtml, /Sei stato tu\?/);
  assert.match(recoveryConfirmationHtml, /Conferma il recupero password/);
  assert.doesNotMatch(recoveryConfirmationHtml, /Verifica dell’accesso in corso/);

  const pkceRecoveryResponse = await render("/auth/confirm?next=%2Faccount%2Fpassword&code=codice-pkce-di-prova");
  assert.equal(pkceRecoveryResponse.status, 200);
  assert.match(await pkceRecoveryResponse.text(), /Conferma il recupero password/);

  const incompleteRecoveryResponse = await render("/auth/confirm");
  assert.equal(incompleteRecoveryResponse.status, 200);
  assert.match(await incompleteRecoveryResponse.text(), /Controllo del collegamento in corso/i);

  const passwordResponse = await render("/account/password");
  assert.equal(passwordResponse.status, 200);
  assert.match(await passwordResponse.text(), /Scegli la tua password/);
});

test("rejects unsafe or incomplete password recovery requests before contacting the auth provider", async () => {
  const missingTokenResponse = await render("/api/account/recovery/confirm", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ destination: "/account/password" }),
  });
  assert.equal(missingTokenResponse.status, 400);
  assert.match(await missingTokenResponse.text(), /collegamento di recupero/i);

  const crossOriginResponse = await render("/api/account/recovery/confirm", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json", origin: "https://example.invalid" },
    body: JSON.stringify({ tokenHash: "token-di-prova", destination: "/account/password" }),
  });
  assert.equal(crossOriginResponse.status, 403);
  assert.match(await crossOriginResponse.text(), /Origine della richiesta non valida/i);

  const shortPasswordResponse = await render("/api/account/password", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ password: "corta" }),
  });
  assert.equal(shortPasswordResponse.status, 400);
  assert.match(await shortPasswordResponse.text(), /almeno 8 caratteri/i);
});

test("renders the local account privacy draft with separate optional communications", async () => {
  const response = await render("/privacy");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /I tuoi dati non sono una moneta/);
  assert.match(html, /bozza locale dell’informativa account/i);
  assert.match(html, /Comunicazioni facoltative/);
  assert.match(html, /inizialmente disattivate/i);
  assert.match(html, /Supabase gestisce autenticazione e sessioni/);
  assert.match(html, /Da completare prima della pubblicazione/);
  assert.match(html, /richiesta può essere avviata.+annullata dal profilo/i);
  assert.doesNotMatch(html, /pagamenti.+sono attivi/i);
});

test("keeps the Community moderation workspace private", async () => {
  const response = await render("/gestione-community");
  assert.ok([307, 308].includes(response.status));
  assert.equal(new URL(response.headers.get("location"), "http://localhost").pathname, "/account");
});

test("renders a harmless administrator simulation without a real account", async () => {
  const response = await render("/gestione-community-simulazione");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /simulazione amministratore/i);
  assert.match(html, /Modalità prova locale/i);
  assert.match(html, /admin\.simulato@example\.invalid/i);
  assert.match(html, /Questo è un commento dimostrativo/i);
  assert.match(html, /Nessun account reale viene modificato/i);
});

test("protects account deletion requests behind an authenticated session", async () => {
  const response = await render("/api/account/deletion-request", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ confirmation: "CANCELLA IL MIO ACCOUNT", understood: true }),
  });
  assert.equal(response.status, 401);
  assert.match(await response.text(), /Sessione non valida/i);
});

test("protects the personal LoreWise archive behind an authenticated session", async () => {
  const response = await render("/api/account/dashboard", { headers: { accept: "application/json" } });
  assert.equal(response.status, 401);
  assert.match(await response.text(), /Sessione non valida/i);
});

test("protects the unified benefits center behind LoreWise ID", async () => {
  const response = await render("/api/account/benefits", { headers: { accept: "application/json" } });
  assert.equal(response.status, 401);
  assert.match(await response.text(), /Accedi al tuo LoreWise ID/i);
});

test("validates server-side account session requests before contacting the identity provider", async () => {
  const malformed = await render("/api/account/session", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ email: "non-valida", password: "breve" }),
  });
  assert.equal(malformed.status, 400);
  assert.match(await malformed.text(), /Inserisci email e password valide/i);

  const foreignOrigin = await render("/api/account/session", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json", origin: "https://example.invalid" },
    body: JSON.stringify({ email: "utente@example.invalid", password: "password-di-prova" }),
  });
  assert.equal(foreignOrigin.status, 403);
  assert.match(await foreignOrigin.text(), /Origine della richiesta non valida/i);
});

test("protects private order details and cancellation behind LoreWise ID", async () => {
  const detail = await render("/api/account/orders/LW-TEST-001", { headers: { accept: "application/json" } });
  assert.equal(detail.status, 401);
  assert.match(await detail.text(), /Sessione non valida/i);
  const cancellation = await render("/api/account/orders/LW-TEST-001", {
    method: "PATCH",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ action: "cancel" }),
  });
  assert.equal(cancellation.status, 401);
  assert.match(await cancellation.text(), /Sessione non valida/i);
  const support = await render("/api/account/orders/LW-TEST-001", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ requestType: "support", reason: "Download", details: "Non riesco a scaricare il pacchetto acquistato." }),
  });
  assert.equal(support.status, 401);
  assert.match(await support.text(), /Sessione non valida/i);
  const page = await render("/account/ordini/LW-TEST-001");
  assert.ok([307, 308].includes(page.status));
  assert.equal(new URL(page.headers.get("location"), "http://localhost").pathname, "/account");
});

test("keeps the unified order and refund archive private", async () => {
  const page = await render("/gestione-ordini");
  assert.ok([307, 308].includes(page.status));
  assert.equal(new URL(page.headers.get("location"), "http://localhost").pathname, "/account");
  const list = await render("/api/orders/admin", { headers: { accept: "application/json" } });
  assert.equal(list.status, 401);
  assert.match(await list.text(), /Sessione amministratore non valida/i);
  const update = await render("/api/orders/admin", {
    method: "PATCH",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ id: "missing", status: "approved", adminNotes: "Solo valutazione." }),
  });
  assert.equal(update.status, 401);
  assert.match(await update.text(), /Sessione amministratore non valida/i);
});

test("keeps the launch-readiness control private", async () => {
  const page = await render("/gestione-lancio");
  assert.ok([307, 308].includes(page.status));
  assert.equal(new URL(page.headers.get("location"), "http://localhost").pathname, "/account");
  const api = await render("/api/launch-readiness", { headers: { accept: "application/json" } });
  assert.equal(api.status, 401);
  assert.match(await api.text(), /Sessione amministratore non valida/i);
});

test("protects private artwork downloads behind LoreWise ID", async () => {
  const response = await render("/api/artwork-download?code=LW-ART-003", { headers: { accept: "application/json" } });
  assert.equal(response.status, 401);
  assert.match(await response.text(), /Accedi al tuo LoreWise ID/i);
});

test("protects personalized artwork certificates behind LoreWise ID", async () => {
  const response = await render("/api/artwork-certificate?code=LW-ART-003", { headers: { accept: "application/json" } });
  assert.equal(response.status, 401);
  assert.match(await response.text(), /Accedi al tuo LoreWise ID/i);
});

test("keeps the artwork delivery archive private", async () => {
  const page = await render("/gestione-consegne-arte");
  assert.ok([307, 308].includes(page.status));
  assert.equal(new URL(page.headers.get("location"), "http://localhost").pathname, "/account");
  const api = await render("/api/artwork-deliveries/admin", { headers: { accept: "application/json" } });
  assert.equal(api.status, 401);
  assert.match(await api.text(), /Sessione amministratore non valida/i);
  const approval = await render("/api/artwork-deliveries/admin", {
    method: "PATCH",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ artworkCode: "LW-ART-003", sha256: "0".repeat(64), masterIdentical: true, manifestVerified: true, certificateSeparate: true }),
  });
  assert.equal(approval.status, 401);
  assert.match(await approval.text(), /Sessione amministratore non valida/i);
});

test("keeps the verified Windows game archive private and the installer unavailable", async () => {
  const page = await render("/gestione-consegne-giochi");
  assert.equal(page.status, 200);
  const html = await page.text();
  assert.match(html, /Edizione Windows/i);
  assert.match(html, /La build desktop corretta è verificata/i);
  assert.match(html, /1\.0\.2/);
  assert.match(html, /85830385096300EDC17FCD79A8210A212848F081E044160FE6E33CF31240D810/);
  assert.match(html, /Scansione Microsoft Defender da completare/i);
  assert.doesNotMatch(html, /1587DA3C2ACD614166D7F5DFD5D0B323E40D2AC9F73846010D9508332D3AABD6/);
  const api = await render("/api/game-deliveries/admin", { headers: { accept: "application/json" } });
  assert.equal(api.status, 401);
  assert.match(await api.text(), /Sessione amministratore non valida/i);
  const download = await render("/api/game-download?code=GS-GAME-001-WIN", { headers: { accept: "application/json" } });
  assert.equal(download.status, 401);
  assert.match(await download.text(), /Accedi al tuo LoreWise ID/i);
});

test("renders the game support and digital-sales safeguards in trial mode", async () => {
  const supportResponse = await render("/assistenza-giochi");
  assert.equal(supportResponse.status, 200);
  const support = await supportResponse.text();
  assert.match(support, /Ogni problema/);
  assert.match(support, /Non spegnere le protezioni/i);
  assert.match(support, /canale ordini è ancora in prova/i);

  const termsResponse = await render("/condizioni-vendita-giochi");
  assert.equal(termsResponse.status, 200);
  const terms = await termsResponse.text();
  assert.match(terms, /Vendita digitale/);
  assert.match(terms, /14 giorni/);
  assert.match(terms, /La rinuncia al recesso non elimina la garanzia legale/i);
  assert.match(terms, /non attiva alcun pagamento/i);

  const contactResponse = await render("/contatti");
  assert.equal(contactResponse.status, 200);
  const contacts = await contactResponse.text();
  assert.match(contacts, /Apri l’assistenza giochi/);
  assert.match(contacts, /lorewise\.archive@gmail\.com/i);
  assert.match(contacts, /Giwiseshop@outlook\.it/i);
  assert.match(contacts, /discord\.gg\/3SFCYTKaU/i);
  assert.match(contacts, /wa\.me\/393505312999/i);
  assert.match(contacts, /instagram\.com\/giwisestudio\?igsh=ZmowcDRrOW93Nmd6/i);
  assert.match(contacts, /tiktok\.com\/@giwisestudio\?_r=1(?:&|&amp;)_t=ZG-9919HEFKZLl/i);
  assert.match(contacts, /tiktok\.com\/@giwiseart\?_r=1(?:&|&amp;)_t=ZG-9919K0dELsv/i);
  assert.match(contacts, /facebook\.com\/share\/1DBE9rAfBQ/i);
  assert.match(contacts, /rel="noopener noreferrer"/i);
});

test("protects personal and administrative support tickets behind LoreWise ID", async () => {
  const personal = await render("/api/support-tickets", { headers: { accept: "application/json" } });
  assert.equal(personal.status, 401);
  const creation = await render("/api/support-tickets", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ category: "game", subject: "Richiesta di prova", description: "Descrizione sufficientemente lunga per il collaudo automatico." }),
  });
  assert.equal(creation.status, 401);
  const admin = await render("/api/admin/support-tickets", { headers: { accept: "application/json" } });
  assert.equal(admin.status, 401);
  for (const pathname of ["/admin", "/gestione-assistenza"]) {
    const page = await render(pathname);
    assert.ok([307, 308].includes(page.status));
    assert.match(page.headers.get("location") ?? "", /\/account$/);
  }
});

test("keeps artwork checkout protected and disabled without test credentials", async () => {
  const statusResponse = await render("/api/checkout", { headers: { accept: "application/json" } });
  assert.equal(statusResponse.status, 200);
  const status = await statusResponse.json();
  assert.equal(status.configured, false);
  assert.equal(status.testMode, true);

  const checkoutResponse = await render("/api/checkout", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ productType: "artwork", productCode: "LW-ART-003" }),
  });
  assert.equal(checkoutResponse.status, 401);
  assert.match(await checkoutResponse.text(), /Accedi al tuo LoreWise ID/i);
});

test("keeps the verified Windows product checkout protected", async () => {
  const checkoutResponse = await render("/api/checkout", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ productType: "game", productCode: "GS-GAME-001-WIN" }),
  });
  assert.equal(checkoutResponse.status, 401);
  assert.match(await checkoutResponse.text(), /Accedi al tuo LoreWise ID/i);
});

test("keeps subscription and commission payments behind LoreWise ID", async () => {
  const subscription = await render("/api/checkout", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ productType: "subscription", productCode: "LW-PASS-SUPPORTER" }),
  });
  assert.equal(subscription.status, 401);
  assert.match(await subscription.text(), /Accedi al tuo LoreWise ID/i);

  const commission = await render("/api/commission-checkout", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ referenceCode: "LW-REQ-20260819-ABC123" }),
  });
  assert.equal(commission.status, 401);
  assert.match(await commission.text(), /Accedi con il LoreWise ID/i);
});

test("requires LoreWise ID before a commission request can be archived", async () => {
  const response = await render("/api/commission-requests", { method: "POST", body: new FormData() });
  assert.equal(response.status, 401);
  assert.match(await response.text(), /Accedi con il tuo LoreWise ID/i);
});

test("opens game reviews only for published projects and keeps publishing behind LoreWise ID", async () => {
  const page = await render("/giochi/the-wound-remembers");
  assert.equal(page.status, 200);
  const html = await page.text();
  assert.match(html, /Community verificata/i);
  assert.match(html, /Nessuna recensione dimostrativa/i);
  assert.doesNotMatch(html, /In attesa dell.area account LoreWise/i);

  const unauthenticated = await render("/api/game-community?game=GS-GAME-001", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ action: "review", rating: 5, review: "Una recensione di prova sufficientemente lunga." }),
  });
  assert.equal(unauthenticated.status, 401);
  assert.match(await unauthenticated.text(), /Accedi al tuo LoreWise ID/i);

  const unpublished = await render("/api/game-community?game=GS-GAME-002", { headers: { accept: "application/json" } });
  assert.equal(unpublished.status, 404);
  assert.match(await unpublished.text(), /soltanto per giochi pubblicati/i);
});

test("rejects unsigned Stripe webhook requests", async () => {
  const response = await render("/api/stripe/webhook", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ id: "evt_unsigned", type: "checkout.session.completed" }),
  });
  assert.equal(response.status, 503);
  assert.match(await response.text(), /Webhook Stripe non configurato|chiave segreta Stripe valida/i);
});

test("renders the VIP Codex proposal area and protects its API", async () => {
  const component = await readFile(new URL("../components/CodexSuggestionForm.tsx", import.meta.url), "utf8");
  assert.match(component, /if \(access !== "vip"\) return null/);
  assert.match(component, /Manca un personaggio\?/);
  assert.match(component, /Solo LoreWise VIP/);
  assert.match(component, /Controlla il Codex/);
  assert.match(component, /Segui lo stato/);
  assert.match(component, /Opera o universo/);
  assert.match(component, /Perché dovrebbe entrare nel Codex/);
  assert.match(component, /STATUS_LABELS/);
  const pageSource = await readFile(new URL("../app/enciclopedia/page.tsx", import.meta.url), "utf8");
  assert.match(pageSource, /id="proposte-codex-vip"/);

  const api = await render("/api/codex-suggestions", { headers: { accept: "application/json" } });
  assert.equal(api.status, 401);
  assert.match(await api.text(), /LoreWise ID/i);
  const apiSource = await readFile(new URL("../app/api/codex-suggestions/route.ts", import.meta.url), "utf8");
  assert.match(apiSource, /process\.env\.NODE_ENV !== "production"/);
  assert.match(apiSource, /isLocalLoreWiseRequest/);
  assert.match(apiSource, /localOnly: true/);
});

test("omits undocumented pronunciation and keeps detailed generated roles", async () => {
  const dossiers = JSON.parse(await readFile(new URL("../data/codex/third-party-dossiers.generated.json", import.meta.url), "utf8"));
  assert.equal(dossiers.length, 444);
  for (const dossier of dossiers) {
    const occupation = dossier.identity.find((fact) => fact.label === "Occupazione o ruolo")?.value;
    assert.equal(dossier.identity.some((fact) => fact.label === "Pronuncia"), false, `Pronuncia inattesa: ${dossier.slug}`);
    assert.match(occupation, /Agisce soprattutto attraverso/i, `Ruolo non approfondito: ${dossier.slug}`);
  }
});
