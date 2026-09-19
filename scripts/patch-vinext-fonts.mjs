// Corregge un bug di vinext su Windows: fetchAndCacheFont scrive nei CSS dei
// font Google percorsi con "/" mentre _rewriteCachedFontCssToServedUrls cerca
// la cacheDir con "\", quindi @font-face resta url(C:/Users/...) e il font non
// viene mai servito. La patch normalizza la cacheDir prima del confronto.
// Idempotente; non fa nulla se vinext cambia e il punto non si trova più.
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const target = new URL("../node_modules/vinext/dist/plugins/fonts.js", import.meta.url);
const MARKER = "/* lorewise:win-font-path */";
const ORIGINAL = [
  "\tif (!cacheDir || !css.includes(cacheDir)) return css;",
  "\tconst prefix = assetsDir || DEFAULT_ASSETS_DIR;",
  "\treturn css.split(cacheDir).join(`/${prefix}/${VINEXT_FONT_URL_NAMESPACE}`);",
].join("\n");
const PATCHED = [
  `\t${MARKER} const fontCacheDir = (cacheDir ?? "").replaceAll("\\\\", "/");`,
  "\tif (!fontCacheDir || !css.includes(fontCacheDir)) return css;",
  "\tconst prefix = assetsDir || DEFAULT_ASSETS_DIR;",
  "\treturn css.split(fontCacheDir).join(`/${prefix}/${VINEXT_FONT_URL_NAMESPACE}`);",
].join("\n");

if (!existsSync(target)) process.exit(0);
const source = readFileSync(target, "utf8").replace(/\r\n/g, "\n");
if (source.includes(MARKER)) {
  console.log("vinext fonts: patch già applicata");
} else if (source.includes(ORIGINAL)) {
  writeFileSync(target, source.replace(ORIGINAL, PATCHED));
  console.log("vinext fonts: patch applicata");
} else {
  console.warn("vinext fonts: punto di patch non trovato (vinext aggiornato?), nessuna modifica");
}
