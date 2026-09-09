const baseUrl = process.env.LOREWISE_AUDIT_URL?.trim() || "http://127.0.0.1:3001";
const workerUrl = new URL("../dist/server/index.js", import.meta.url);
workerUrl.searchParams.set("navigation-audit", String(Date.now()));
const { default: app } = await import(workerUrl.href);
const runtimeEnv = { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
const runtimeContext = { waitUntil() {}, passThroughOnException() {} };
const maxPages = 1500;
const concurrency = 4;
const requiredRoutes = [
  "/", "/abbonamento", "/account", "/account/password", "/admin", "/arte",
  "/assistenza-giochi", "/cerca", "/commissioni", "/commissioni/condizioni",
  "/commissioni/stato", "/condizioni-vendita-giochi", "/contatti", "/community",
  "/dove-nascono-i-mondi", "/enciclopedia", "/enciclopedia/originali-giwise",
  "/gestione-assistenza", "/gestione-commissioni", "/gestione-community",
  "/gestione-community-simulazione", "/gestione-consegne-arte",
  "/gestione-consegne-giochi", "/gestione-email", "/gestione-lancio",
  "/gestione-ordini", "/giochi", "/licenza-arte", "/licenza-gioco", "/privacy",
  "/shop", "/shop/catalogo",
];

const queued = new Set();
const queue = [];
const documents = new Map();
const failures = [];
const fragmentChecks = [];
const fragmentCheckKeys = new Set();
let cursor = 0;

function localFetch(pathname, headers = { accept: "text/html" }) {
  return app.fetch(new Request(new URL(pathname, baseUrl), { headers, redirect: "manual" }), runtimeEnv, runtimeContext);
}

function normalize(raw, source) {
  if (!raw || /^(?:mailto:|tel:|javascript:)/i.test(raw)) return null;
  const decoded = raw.replaceAll("&amp;", "&");
  let url;
  try { url = new URL(decoded, new URL(source, baseUrl)); }
  catch { return null; }
  if (url.origin !== new URL(baseUrl).origin) return null;
  return url;
}

function enqueue(pathname) {
  if (queued.has(pathname) || queued.size >= maxPages) return;
  queued.add(pathname);
  queue.push(pathname);
}

for (const route of requiredRoutes) enqueue(route);

const sitemapResponse = await localFetch("/sitemap.xml");
if (!sitemapResponse.ok) failures.push("/sitemap.xml: HTTP " + sitemapResponse.status);
else {
  const sitemap = await sitemapResponse.text();
  for (const match of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const url = normalize(match[1], "/");
    if (url) enqueue(url.pathname + url.search);
  }
}

async function inspect(pathname) {
  let response;
  try {
    response = await localFetch(pathname);
  } catch (error) {
    failures.push(pathname + ": " + (error instanceof Error ? error.message : String(error)));
    return;
  }
  if (response.status >= 300 && response.status < 400) {
    const destination = normalize(response.headers.get("location"), pathname);
    if (destination) enqueue(destination.pathname + destination.search);
    return;
  }
  if (!response.ok) {
    failures.push(pathname + ": HTTP " + response.status);
    return;
  }
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) return;
  const html = await response.text();
  documents.set(pathname.split("#", 1)[0], html);
  if (/Internal Server Error|Application error|TypeError:|ReferenceError:/.test(html)) {
    failures.push(pathname + ": errore applicativo nel documento");
  }
  for (const match of html.matchAll(/<a\b[^>]*\bhref=["']([^"'<>]+)["'][^>]*>/gi)) {
    const url = normalize(match[1], pathname);
    if (!url) continue;
    if (/\.(?:apk|css|gif|ico|jpe?g|js|mjs|mp4|png|svg|webm|webp|woff2?)$/i.test(url.pathname)) continue;
    const target = url.pathname + url.search;
    enqueue(target);
    if (url.hash) {
      const fragment = decodeURIComponent(url.hash.slice(1));
      const key = target + "#" + fragment;
      if (!fragmentCheckKeys.has(key)) {
        fragmentCheckKeys.add(key);
        fragmentChecks.push({ source: pathname, target, fragment });
      }
    }
  }
}

async function worker() {
  while (cursor < queue.length) {
    const index = cursor++;
    await inspect(queue[index]);
  }
}

await Promise.all(Array.from({ length: concurrency }, worker));

for (const check of fragmentChecks) {
  if (/^\/(?:account|admin|gestione-)/.test(check.target)) continue;
  const html = documents.get(check.target);
  if (!html) continue;
  const hasDoubleQuotedId = html.includes('id="' + check.fragment + '"') || html.includes('name="' + check.fragment + '"');
  const hasSingleQuotedId = html.includes("id='" + check.fragment + "'") || html.includes("name='" + check.fragment + "'");
  if (!hasDoubleQuotedId && !hasSingleQuotedId) {
    failures.push(check.source + ": destinazione #" + check.fragment + " assente in " + check.target);
  }
}

if (queued.size >= maxPages) failures.push("Limite di sicurezza raggiunto: almeno " + maxPages + " indirizzi");
if (failures.length) {
  console.error("Audit navigazione fallito (" + failures.length + "):\n" + failures.slice(0, 120).join("\n"));
  process.exit(1);
}

console.log("Audit navigazione superato: " + queued.size + " indirizzi interni raggiungibili e " + fragmentChecks.length + " destinazioni di pagina verificate.");
