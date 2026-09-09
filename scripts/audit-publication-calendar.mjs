import { access, readFile } from "node:fs/promises";
import path from "node:path";

const workspace = process.cwd();
const registryPath = path.join(workspace, "data", "site-publication-news.json");
const requiredFields = ["id", "publicationKey", "date", "category", "title", "description", "detail", "href", "action", "tone", "image", "imageAlt"];
const allowedCategories = new Set(["Arte", "Codex", "Commissioni", "Community", "Famiglio", "Giochi", "LoreWise VIP", "Mondi"]);
const technicalLanguage = /\b(api|build|codice|commit|css|database|deploy|deployment|endpoint|fix|hotfix|metadata|patch|pipeline|refactor|repository|server|sprite|staging|test)\b/i;

function fail(message) {
  console.error(`Calendario pubblicazioni: ${message}`);
  process.exitCode = 1;
}

const entries = JSON.parse(await readFile(registryPath, "utf8"));
if (!Array.isArray(entries) || entries.length === 0) fail("il registro è vuoto o non valido.");

const ids = new Set();
const publicationKeys = new Set();
for (const [index, entry] of entries.entries()) {
  const label = entry?.id || `voce ${index + 1}`;
  for (const field of requiredFields) {
    if (typeof entry?.[field] !== "string" || !entry[field].trim()) fail(`${label}: manca ${field}.`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.date) || Number.isNaN(Date.parse(`${entry.date}T12:00:00Z`))) fail(`${label}: data non valida.`);
  if (entry.date < "2026-09-09") fail(`${label}: la programmazione pubblica non può precedere il 9 settembre 2026.`);
  if (!allowedCategories.has(entry.category)) fail(`${label}: categoria non riconosciuta.`);
  if (!entry.href.startsWith("/")) fail(`${label}: il collegamento deve essere interno al sito.`);
  if (!entry.image.startsWith("/")) fail(`${label}: l'immagine deve provenire dalle risorse pubbliche del progetto.`);
  if (technicalLanguage.test(`${entry.title} ${entry.description}`)) fail(`${label}: il testo contiene linguaggio tecnico non destinato ai visitatori.`);
  if (ids.has(entry.id)) fail(`${label}: id duplicato.`);
  if (publicationKeys.has(entry.publicationKey)) fail(`${label}: publicationKey duplicata.`);
  ids.add(entry.id);
  publicationKeys.add(entry.publicationKey);

  const publicAsset = path.join(workspace, "public", ...entry.image.slice(1).split("/"));
  try {
    await access(publicAsset);
  } catch {
    fail(`${label}: immagine non trovata (${entry.image}).`);
  }

  const routeRoot = entry.href.split(/[?#]/)[0].split("/").filter(Boolean)[0];
  if (routeRoot) {
    try {
      await access(path.join(workspace, "app", routeRoot));
    } catch {
      fail(`${label}: percorso pubblico non trovato (${entry.href}).`);
    }
  }
}

if (!process.exitCode) console.log(`Calendario pubblicazioni verificato: ${entries.length} novità reali, complete di data, destinazione e immagine.`);
