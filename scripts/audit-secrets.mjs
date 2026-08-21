import { readdir, readFile } from "node:fs/promises";
import { extname, relative, resolve } from "node:path";

const root = process.cwd();
const ignored = new Set([".git", ".next", ".vinext", ".wrangler", "node_modules", "dist", "out", "outputs", "output", "tmp", "work"]);
const extensions = new Set([".cjs", ".css", ".env", ".example", ".html", ".js", ".json", ".jsx", ".md", ".mjs", ".sql", ".ts", ".tsx", ".txt", ".yaml", ".yml"]);
const rules = [
  ["Supabase secret key", /\bsb_secret_[A-Za-z0-9_-]{16,}\b/g, () => "critical"],
  ["Supabase legacy service role JWT", /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/g, () => "critical"],
  ["Stripe secret key", /\b(?:sk|rk)_(?:test|live)_[A-Za-z0-9]{16,}\b/g, (line, file) => line.includes("_test_") && file === ".env.local" ? "local-test" : "critical"],
  ["Private key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g, () => "critical"],
];

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (ignored.has(entry.name)) continue;
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...await filesIn(path));
    else if (entry.isFile() && (extensions.has(extname(entry.name).toLowerCase()) || entry.name.startsWith(".env"))) files.push(path);
  }
  return files;
}

const findings = [];
for (const file of await filesIn(root)) {
  const content = await readFile(file, "utf8");
  const lines = content.split(/\r?\n/);
  const relativeFile = relative(root, file);
  for (const [label, pattern, severity] of rules) {
    lines.forEach((line, index) => {
      pattern.lastIndex = 0;
      if (pattern.test(line)) findings.push({ file: relativeFile, line: index + 1, type: label, severity: severity(line, relativeFile) });
    });
  }
}

const critical = findings.filter((finding) => finding.severity === "critical");
const localTest = findings.filter((finding) => finding.severity === "local-test");
if (localTest.length) {
  console.warn("Credenziali di prova locali presenti e protette da .gitignore (valori nascosti):");
  for (const finding of localTest) console.warn(`- ${finding.file}:${finding.line} · ${finding.type}`);
}
if (critical.length) {
  console.error("Possibili credenziali esposte rilevate. I valori sono stati nascosti:");
  for (const finding of critical) console.error(`- ${finding.file}:${finding.line} · ${finding.type}`);
  process.exitCode = 1;
} else {
  console.log("Audit credenziali superato: nessuna credenziale di produzione rilevata nei file testuali del progetto.");
}
