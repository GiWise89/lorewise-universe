import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const standaloneRoot = path.join(process.cwd(), ".next", "standalone", ".next", "server");
const middlewarePath = path.join(standaloneRoot, "middleware.js");
const compatibilityRuntimePath = path.join(standaloneRoot, "chunks", "[turbopack]_runtime.js");
const middleware = await readFile(middlewarePath, "utf8");

if (middleware.includes('require("./chunks/[turbopack]_runtime.js")')) {
  throw new Error("La build Netlify usa ancora il middleware Turbopack: il runtime non può essere sostituito con lo shim Webpack.");
}

await mkdir(path.dirname(compatibilityRuntimePath), { recursive: true });
await writeFile(
  compatibilityRuntimePath,
  "// Compatibility module for Netlify Next Runtime 5.15.x when packaging a Webpack node middleware.\nmodule.exports = {};\n",
  "utf8",
);

console.log("Prepared Netlify node-middleware compatibility module.");
