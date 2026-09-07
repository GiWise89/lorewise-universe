import { spawnSync } from "node:child_process";

const npmCli = process.env.npm_execpath;
if (!npmCli) {
  console.error("Percorso npm non disponibile. Avvia il controllo con npm run audit:local-ready.");
  process.exit(1);
}
const steps = [
  ["Pulizia copie locali delle variabili", ["run", "sanitize:generated-env"]],
  ["Test applicazione", ["test"]],
  ["Lint", ["run", "lint"]],
  ["Workspace", ["run", "audit:workspace"]],
  ["Database", ["run", "audit:database"]],
  ["Segreti", ["run", "audit:secrets"]],
  ["Consegna gioco", ["run", "audit:game-delivery"]],
  ["Pagine", ["run", "audit:pages"]],
  ["Navigazione", ["run", "audit:navigation"]],
  ["Risorse pubbliche", ["run", "audit:assets"]],
  ["Pacchetto pubblico", ["run", "audit:release"]],
  ["Catalogo Shop", ["run", "audit:shop"]],
  ["Area VIP", ["run", "audit:vip-downloads"]],
  ["Bilanciamento Famiglio", ["run", "audit:famiglio-balance"]],
  ["Pacchetto Famiglio", ["run", "audit:famiglio-release"]],
  ["LoreWise Codex", ["run", "codex:audit"]],
  ["Consegne Arte", ["run", "audit:artwork-deliveries"]],
];

const results = [];
for (const [label, args] of steps) {
  console.log(`\n=== ${label} ===`);
  const result = spawnSync(process.execPath, [npmCli, ...args], { cwd: process.cwd(), stdio: "inherit", shell: false });
  const passed = result.status === 0;
  results.push({ label, passed });
  if (!passed) {
    console.error(`\nAudit locale interrotto: ${label} non superato.`);
    process.exit(result.status || 1);
  }
}

console.log("\n=== Riepilogo locale ===");
for (const result of results) console.log(`OK  ${result.label}`);
console.log("Tutti i controlli locali sono superati. Servizi esterni, dati legali, staging e pubblicazione restano gate separati.");
