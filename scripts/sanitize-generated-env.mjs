import { readdir, realpath, unlink } from "node:fs/promises";
import { basename, relative, resolve, sep } from "node:path";

const workspace = await realpath(process.cwd());
const generatedRoots = [".netlify", ".next", "dist"];
const removed = [];

function staysInsideGeneratedRoot(candidate, generatedRoot) {
  const normalizedRoot = `${generatedRoot}${sep}`;
  return candidate === generatedRoot || candidate.startsWith(normalizedRoot);
}

async function removeGeneratedEnvFiles(directory, generatedRoot) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") return;
    throw error;
  }

  for (const entry of entries) {
    const candidate = resolve(directory, entry.name);
    if (!staysInsideGeneratedRoot(candidate, generatedRoot)) {
      throw new Error(`Percorso generato non sicuro: ${candidate}`);
    }
    if (entry.isDirectory()) {
      await removeGeneratedEnvFiles(candidate, generatedRoot);
      continue;
    }
    if (entry.isFile() && basename(entry.name).startsWith(".env")) {
      await unlink(candidate);
      removed.push(relative(workspace, candidate));
    }
  }
}

for (const name of generatedRoots) {
  const generatedRoot = resolve(workspace, name);
  if (!staysInsideGeneratedRoot(generatedRoot, workspace)) {
    throw new Error(`Radice generata non sicura: ${generatedRoot}`);
  }
  await removeGeneratedEnvFiles(generatedRoot, generatedRoot);
}

if (removed.length) {
  console.log(`Rimosse ${removed.length} copie di file ambiente dagli artefatti generati.`);
  for (const file of removed) console.log(`- ${file}`);
} else {
  console.log("Nessuna copia di file ambiente presente negli artefatti generati.");
}
