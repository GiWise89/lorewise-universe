import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const value = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : "";
};
const rawUrl = value("--url") || process.env.LOREWISE_STAGING_URL || "";
const expectedMode = value("--mode") || process.env.LOREWISE_STAGING_STRIPE_MODE || "test";
if (!["test", "live"].includes(expectedMode)) {
  console.error("La modalità attesa deve essere test oppure live.");
  process.exit(1);
}
if (!rawUrl) {
  console.error("Uso: npm run stripe:staging-check -- --url https://staging.esempio.it --mode test|live");
  console.error("Questo controllo non effettua acquisti e non richiede chiavi Stripe locali.");
  process.exit(1);
}

const origin = new URL(rawUrl).origin;
if (!origin.startsWith("https://") && !origin.startsWith("http://localhost") && !origin.startsWith("http://127.0.0.1")) {
  console.error("Lo staging remoto deve usare HTTPS.");
  process.exit(1);
}

const checks = [];
async function check(pathname, verify) {
  const response = await fetch(`${origin}${pathname}`, { headers: { accept: "application/json,text/plain,*/*" }, redirect: "error" });
  const body = await response.text();
  const result = verify(response, body);
  checks.push({ pathname, status: response.status, ok: result === true, detail: result === true ? "OK" : String(result) });
}

await check("/api/checkout", (response, body) => {
  if (!response.ok) return `HTTP ${response.status}`;
  let payload;
  try { payload = JSON.parse(body); } catch { return "risposta non JSON"; }
  if (payload.mode !== expectedMode) return `modalità Stripe inattesa: ${payload.mode || "assente"}`;
  if (payload.testMode !== (expectedMode === "test")) return "testMode non coerente con la modalità attesa";
  if (payload.checkoutConfigured !== true) return `checkout Stripe ${expectedMode} non configurato`;
  if (payload.webhookConfigured !== true) return `webhook Stripe ${expectedMode} non configurato`;
  return true;
});
await check("/robots.txt", (response, body) => response.ok && /Disallow:\s*\//i.test(body) ? true : "lo staging non blocca l'indicizzazione");

const failed = checks.filter((item) => !item.ok);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = path.join(root, "output", "stripe-staging-checks");
fs.mkdirSync(outputDirectory, { recursive: true });
const receipt = { checkedAt: new Date().toISOString(), origin, mode: expectedMode, scope: "preflight-only", checks, e2ePurchaseCompleted: false };
const receiptPath = path.join(outputDirectory, `${new URL(origin).hostname}-${Date.now()}.json`);
fs.writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
for (const item of checks) console.log(`${item.ok ? "OK" : "ERRORE"} ${item.pathname}: ${item.detail}`);
console.log(`Ricevuta preflight: ${receiptPath}`);
console.log(`Checkout, webhook, rimborso e consegna E2E restano una prova separata nell'ambiente Stripe ${expectedMode}.`);
if (failed.length) process.exit(1);
