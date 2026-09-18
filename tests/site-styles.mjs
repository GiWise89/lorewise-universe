import { existsSync, readdirSync, readFileSync } from "node:fs";

const appDir = new URL("../app/", import.meta.url);

/**
 * Global site stylesheet followed by the section stylesheets extracted from it
 * (app/<section>/<section>.css, imported by each section layout). Tests that
 * check a section rule "exists in the site CSS" read this combined text so the
 * assertion does not depend on which file ships the rule.
 */
export function readSiteStylesSync() {
  const parts = [readFileSync(new URL("globals.css", appDir), "utf8")];
  const sections = readdirSync(appDir, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  for (const section of sections) {
    const file = new URL(`${section}/${section}.css`, appDir);
    if (existsSync(file)) parts.push(readFileSync(file, "utf8"));
  }
  return parts.join("\n");
}

export async function readSiteStyles() {
  return readSiteStylesSync();
}
