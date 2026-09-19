// Prova di fumo sulla build Next che viene pubblicata su Netlify.
// I test rapidi usano vinext; questo script verifica invece `next build --webpack` + `next start`:
// intestazioni di sicurezza, pagine statiche e SSG, reindirizzamenti, sitemap e font.
// La build va in una cartella separata (.next-smoke) per non toccare anteprime già avviate.
//
//   node scripts/smoke-next.mjs              compila e verifica
//   node scripts/smoke-next.mjs --skip-build riusa l'ultima build in .next-smoke
import { spawn, spawnSync } from "node:child_process";
import process from "node:process";

const port = Number(process.env.LOREWISE_SMOKE_PORT ?? 3199);
const base = `http://127.0.0.1:${port}`;
const env = { ...process.env, LOREWISE_NEXT_DIST_DIR: ".next-smoke", NEXT_TELEMETRY_DISABLED: "1" };
const nextBin = "node_modules/next/dist/bin/next";

if (!process.argv.includes("--skip-build")) {
  console.log("Build Next (webpack) in .next-smoke…");
  const build = spawnSync(process.execPath, [nextBin, "build", "--webpack"], { env, stdio: "inherit" });
  if (build.status !== 0) process.exit(build.status ?? 1);
}

const server = spawn(process.execPath, [nextBin, "start", "-p", String(port), "-H", "127.0.0.1"], { env, stdio: ["ignore", "pipe", "pipe"] });
let serverLog = "";
server.stdout.on("data", (chunk) => { serverLog += chunk; });
server.stderr.on("data", (chunk) => { serverLog += chunk; });

function stopServer() {
  if (server.exitCode !== null) return;
  if (process.platform === "win32") spawnSync("taskkill", ["/PID", String(server.pid), "/T", "/F"], { stdio: "ignore" });
  else server.kill("SIGTERM");
}
process.on("exit", stopServer);

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`${base}/robots.txt`);
      if (response.ok) return;
    } catch { /* non ancora pronto */ }
    if (server.exitCode !== null) break;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`next start non risponde su ${base}\n${serverLog.slice(-2000)}`);
}

const failures = [];
let passed = 0;
async function check(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`  ok  ${name}`);
  } catch (error) {
    failures.push(`${name}: ${error instanceof Error ? error.message : error}`);
    console.log(`  NO  ${name}`);
  }
}
function expect(condition, message) {
  if (!condition) throw new Error(message);
}
async function page(path, init) {
  const response = await fetch(`${base}${path}`, { redirect: "manual", ...init });
  return { response, text: response.status === 200 ? await response.text() : "" };
}

try {
  await waitForServer();
  console.log(`Verifica ${base}`);

  await check("home: 200 e intestazioni di sicurezza", async () => {
    const { response, text } = await page("/");
    expect(response.status === 200, `stato ${response.status}`);
    const csp = response.headers.get("content-security-policy") ?? "";
    for (const directive of ["frame-ancestors 'none'", "frame-src 'none'", "object-src 'none'", "script-src-attr 'none'", "base-uri 'self'"]) {
      expect(csp.includes(directive), `CSP senza ${directive}`);
    }
    expect(!/api\.stripe\.com|\*\.supabase\.co|wss:/.test(csp), "CSP con sorgenti non necessarie");
    expect(response.headers.get("x-content-type-options") === "nosniff", "manca nosniff");
    expect(response.headers.get("x-frame-options") === "DENY", "manca X-Frame-Options");
    expect(text.includes("Come vuoi entrare"), "contenuto home mancante");
  });

  await check("font self-hosted serviti da /_next/static/media", async () => {
    const { text } = await page("/");
    const stylesheets = [...text.matchAll(/href="(\/_next\/static\/css\/[^"]+\.css)"/g)].map((match) => match[1]);
    expect(stylesheets.length > 0, "nessun foglio di stile");
    let font = null;
    for (const href of stylesheets) {
      const css = await (await fetch(`${base}${href}`)).text();
      font = css.match(/\/_next\/static\/media\/[^)"']+\.woff2/)?.[0] ?? font;
      if (font) break;
    }
    expect(font, "nessun @font-face con woff2");
    const response = await fetch(`${base}${font}`);
    expect(response.status === 200, `font ${font} → ${response.status}`);
  });

  for (const [path, marker] of [
    ["/giochi", "Scegli il tuo mondo"],
    ["/arte", "Colleziona opere"],
    ["/commissioni", "La tua storia"],
    ["/abbonamento", "Universe Pass"],
    ["/mondi", "Tre sentieri"],
    ["/enciclopedia", "LoreWise Codex"],
    ["/enciclopedia/ace-ventura", "Ace Ventura"],
    ["/giochi/sandbox", "Prima Terra"],
    ["/privacy", "Newsletter e avvisi"],
  ]) {
    await check(`${path}: 200 con contenuto`, async () => {
      const { response, text } = await page(path);
      expect(response.status === 200, `stato ${response.status}`);
      expect(text.includes(marker), `manca "${marker}"`);
    });
  }

  await check("/vip reindirizza a /abbonamento", async () => {
    const { response } = await page("/vip");
    expect([301, 307, 308].includes(response.status), `stato ${response.status}`);
    expect((response.headers.get("location") ?? "").endsWith("/abbonamento"), `location ${response.headers.get("location")}`);
  });

  await check("/account non indicizzato", async () => {
    const { response } = await page("/account");
    expect(response.status === 200, `stato ${response.status}`);
    expect((response.headers.get("x-robots-tag") ?? "").includes("noindex"), "manca X-Robots-Tag noindex");
  });

  // Le pagine di gestione possono rispondere 200 perché il layout è già in streaming:
  // conta che il pannello non venga mai inviato e che scatti il rimando all'accesso.
  await check("pagine di gestione chiuse agli anonimi", async () => {
    for (const [path, panel] of [["/gestione-ordini", "order-admin-page"], ["/admin", "admin-control"]]) {
      const { response, text } = await page(path);
      if (response.status === 200) {
        expect(text.includes("NEXT_REDIRECT;replace;/account"), `${path} senza rimando all'accesso`);
        expect(!text.includes(`class="${panel}`), `${path} invia il pannello`);
      } else {
        expect([302, 303, 307, 308].includes(response.status), `${path} stato ${response.status}`);
      }
    }
    const { text } = await page("/gestione-commissioni");
    expect(text.includes("Accesso non autorizzato") && !text.includes('class="commission-admin-page"'), "gestione-commissioni esposta");
  });

  await check("sitemap e robots", async () => {
    const sitemap = await page("/sitemap.xml");
    expect(sitemap.response.status === 200 && sitemap.text.includes("<urlset"), `sitemap ${sitemap.response.status}`);
    expect(!sitemap.text.includes("/cerca<"), "la sitemap include /cerca");
    // Fuori dal dominio di produzione robots.txt blocca tutto: le anteprime non vanno indicizzate.
    const robots = await page("/robots.txt");
    expect(robots.response.status === 200 && /^Disallow: \/$/m.test(robots.text), "un'anteprima risulta indicizzabile");
  });
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
} finally {
  stopServer();
}

console.log(`\nProva di fumo Next: ${passed} superate, ${failures.length} fallite.`);
if (failures.length) {
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
