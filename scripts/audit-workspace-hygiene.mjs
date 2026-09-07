import { access, readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";

for (const file of ["README.md", "docs/WORKSPACE_STRUCTURE.md"]) await access(file);

const forbiddenTrackedRoots = [
  ".gradle-rebuild/", ".netlify/", ".next/", ".npm-cache/", "dist/", "node_modules/",
  "output/", "outputs/", "source-assets/", "social-assets/", "discord-assets/",
];
const git = spawnSync("git", ["ls-files"], { cwd: process.cwd(), encoding: "utf8", shell: false });
if (git.status !== 0) throw new Error(git.stderr || "Impossibile leggere i file Git.");
const tracked = git.stdout.split(/\r?\n/).filter(Boolean).map((file) => file.replaceAll("\\", "/"));
const forbidden = tracked.filter((file) => forbiddenTrackedRoots.some((root) => file.startsWith(root)));
if (forbidden.length) {
  console.error("Il repository contiene artefatti generati o sorgenti privati che devono restare fuori da Git:");
  forbidden.forEach((file) => console.error(`- ${file}`));
  process.exit(1);
}

const readme = await readFile("README.md", "utf8");
if (!readme.includes("LoreWise Universe") || !readme.includes("npm.cmd run verify")) {
  throw new Error("README operativo incompleto: mancano identita del progetto o comando di verifica.");
}

console.log(`Audit workspace superato: ${tracked.length} file tracciati, artefatti e sorgenti privati esclusi.`);
