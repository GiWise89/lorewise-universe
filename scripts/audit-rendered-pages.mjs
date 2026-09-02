import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
const originals = read("data/codex/original-dossiers.generated.json");
const thirdParty = read("data/codex/third-party-dossiers.generated.json");
const replaced = new Set(["giwise-twr-viandante-sangue-cavo", "giwise-twr-viandante-tomba-affamata"]);
const originalRoutes = originals.filter((entry) => !replaced.has(entry.slug)).map((entry) => `/enciclopedia/${entry.slug}`);
const mergedAliases = new Map([
  ["/enciclopedia/pennywise-modern", "/enciclopedia/pennywise-it"],
  ["/enciclopedia/pennywise-1990", "/enciclopedia/pennywise-it"],
  ["/enciclopedia/penny-human-extra", "/enciclopedia/penny"],
]);
const thirdPartyRoutes = thirdParty.map((entry) => `/enciclopedia/${entry.slug}`).filter((route) => !mergedAliases.has(route));
const aliasRoutes = [...mergedAliases.keys()];
const curatedRoutes = ["/enciclopedia/nhevara-madreferita", "/enciclopedia/kharvoss-re-sepolto", "/enciclopedia/pennywise-it"];
const staticRoutes = [
  "/", "/arte", "/abbonamento", "/commissioni", "/commissioni/condizioni", "/commissioni/stato",
  "/giochi", "/assistenza-giochi", "/condizioni-vendita-giochi", "/licenza-arte", "/licenza-gioco",
  "/contatti", "/community", "/enciclopedia", "/enciclopedia/originali-giwise", "/privacy", "/shop", "/famiglio", "/account",
  "/account/password", "/gestione-community-simulazione", "/gestione-consegne-giochi",
];
const routes = [...new Set([...staticRoutes, ...curatedRoutes, ...originalRoutes, ...thirdPartyRoutes, ...aliasRoutes])];
const auditedRoutes = new Set(routes);
const discoveredRoutes = new Set();
const workerPath = pathToFileURL(path.join(root, "dist", "server", "index.js")).href + `?audit=${Date.now()}`;
const { default: worker } = await import(workerPath);
const failures = [];
let cursor = 0;
let largestDocument = { route: "", bytes: 0 };
let largestImageCount = { route: "", count: 0 };

async function auditRoute(route) {
  const response = await worker.fetch(new Request(`http://localhost${route}`, { headers: { accept: "text/html" } }), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
  if (mergedAliases.has(route)) {
    if (![307, 308].includes(response.status)) failures.push(`${route}: reindirizzamento atteso, HTTP ${response.status}`);
    if (!response.headers.get("location")?.endsWith(mergedAliases.get(route))) failures.push(`${route}: destinazione canonica errata`);
    return;
  }
  const html = await response.text();
  const mainHtml = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? html;
  const documentBytes = Buffer.byteLength(html);
  if (documentBytes > largestDocument.bytes) largestDocument = { route, bytes: documentBytes };
  if (response.status !== 200) failures.push(`${route}: HTTP ${response.status}`);
  if (/Internal Server Error|Application error|TypeError:|ReferenceError:/.test(html)) failures.push(`${route}: errore applicativo nel documento`);
  if (!/<html\b[^>]*\blang=["']it["']/i.test(html)) failures.push(`${route}: lingua italiana non dichiarata`);
  if (!/<meta\b[^>]*\bname=["']viewport["']/i.test(html)) failures.push(`${route}: viewport responsive assente`);
  if (/<meta\b[^>]*\bname=["']viewport["'][^>]*\bcontent=["'][^"']*(?:user-scalable\s*=\s*no|maximum-scale\s*=\s*1(?:\.0)?(?:[,;"']|$))/i.test(html)) failures.push(`${route}: ingrandimento utente disabilitato`);
  if ((html.match(/<main\b/gi) ?? []).length !== 1) failures.push(`${route}: deve esistere un solo contenuto principale <main>`);
  if ((html.match(/<h1\b/gi) ?? []).length !== 1) failures.push(`${route}: deve esistere un solo titolo principale <h1>`);
  if (/<img\b(?![^>]*\balt=)[^>]*>/i.test(html)) failures.push(`${route}: immagine senza testo alternativo`);
  if (/<button\b(?![^>]*\baria-label=)[^>]*>\s*<\/button>/i.test(html)) failures.push(`${route}: pulsante vuoto senza nome accessibile`);
  const imageCount = (html.match(/<img\b/gi) ?? []).length;
  if (imageCount > largestImageCount.count) largestImageCount = { route, count: imageCount };
  if (documentBytes > 3_000_000) failures.push(`${route}: documento HTML oltre 3 MB (${(documentBytes / 1_000_000).toFixed(2)} MB)`);
  if ((html.match(/<img\b[^>]*\bloading=["']eager["']/gi) ?? []).length > 6) failures.push(`${route}: troppe immagini caricate con priorità eager`);
  for (const match of html.matchAll(/<a\b[^>]*\btarget=["']_blank["'][^>]*>/gi)) {
    const tag = match[0];
    const rel = tag.match(/\brel=["']([^"']*)["']/i)?.[1]?.toLowerCase() ?? "";
    if (!rel.includes("noreferrer") || !rel.includes("noopener")) failures.push(`${route}: collegamento esterno in nuova scheda senza noopener e noreferrer`);
  }
  if (/<(?:audio|video)\b[^>]*\bautoplay\b(?![^>]*\bmuted\b)/i.test(html)) failures.push(`${route}: contenuto multimediale avviato automaticamente con audio`);
  for (const match of html.matchAll(/\bhref=["'](\/[^"']*)["']/gi)) {
    const pathname = match[1].split(/[?#]/, 1)[0] || "/";
    if (/^\/(?:arte\/[^/]+(?:\/pacchetto)?|giochi\/[^/]+|shop\/catalogo\/[^/]+|enciclopedia\/[^/]+)$/.test(pathname)) discoveredRoutes.add(pathname);
  }
  const ids = [...html.matchAll(/\bid=["']([^"']+)["']/gi)].map((match) => match[1]);
  const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  if (duplicateIds.length) failures.push(`${route}: id HTML duplicati (${duplicateIds.slice(0, 5).join(", ")})`);
  if (route.startsWith("/enciclopedia/") && thirdPartyRoutes.includes(route) && /Fuori Trama|\bNexus\b|Forza\s+\d|Destrezza\s+\d|Intelligenza\s+\d|Carisma\s+\d|Ruolo tattico|Modulo GiWise Studio/.test(mainHtml)) failures.push(`${route}: dati di gioco interni esposti`);
}

async function workerLoop() {
  while (cursor < routes.length) {
    const index = cursor++;
    try { await auditRoute(routes[index]); }
    catch (error) { failures.push(`${routes[index]}: ${error instanceof Error ? error.message : String(error)}`); }
  }
}

await Promise.all(Array.from({ length: 8 }, workerLoop));
try {
  const sitemapResponse = await worker.fetch(new Request("http://localhost/sitemap.xml"), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
  const sitemap = await sitemapResponse.text();
  for (const match of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) discoveredRoutes.add(new URL(match[1]).pathname);
} catch (error) {
  failures.push(`/sitemap.xml: impossibile leggere le destinazioni pubbliche (${error instanceof Error ? error.message : String(error)})`);
}
const linkedRoutes = [...discoveredRoutes].filter((route) => !auditedRoutes.has(route));
routes.push(...linkedRoutes);
linkedRoutes.forEach((route) => auditedRoutes.add(route));
await Promise.all(Array.from({ length: 8 }, workerLoop));
if (failures.length) {
  console.error(`Audit pagine fallito (${failures.length}):\n${failures.slice(0, 120).join("\n")}`);
  process.exit(1);
}
console.log(`Audit pagine superato: ${routes.length} schermate e indirizzi verificati, incluse ${originalRoutes.length + curatedRoutes.length} schede originali/editoriali, ${thirdPartyRoutes.length} schede di terzi, ${linkedRoutes.length} destinazioni pubbliche scoperte e ${aliasRoutes.length} reindirizzamenti canonici. Accessibilità: un solo main e h1, zoom consentito, nomi accessibili e collegamenti esterni protetti. Prestazioni: documento massimo ${(largestDocument.bytes / 1024).toFixed(1)} KiB (${largestDocument.route}), massimo ${largestImageCount.count} immagini (${largestImageCount.route}), nessun HTML oltre 3 MB o caricamento eager eccessivo.`);
