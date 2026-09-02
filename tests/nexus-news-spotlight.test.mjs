import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const component = await readFile(new URL("../components/NexusNewsSpotlight.tsx", import.meta.url), "utf8");
const styles = await readFile(new URL("../components/NexusNewsSpotlight.module.css", import.meta.url), "utf8");
const page = await readFile(new URL("../app/cronache-del-nexus/page.tsx", import.meta.url), "utf8");

test("Novità dal Nexus presents both requested editorial stories", () => {
  assert.match(page, /<NexusNewsSpotlight panel=\{params\.novita\} \/>/);
  assert.match(component, /Famiglio del Nexus/);
  assert.match(component, /due Famigli extra inclusi/i);
  assert.match(component, /nuova espansione di <em>The Wound Remembers<\/em>/i);
  assert.match(component, /Versione web accessibile/);
  assert.match(component, /Versione PC inclusa/);
});

test("the news showcase opens one numbered chapter at a time", () => {
  assert.doesNotMatch(component, /^"use client";/);
  assert.match(component, /function panelFromQuery/);
  assert.match(component, /\?novita=\$\{panel\}#novita-in-primo-piano/);
  assert.equal((component.match(/role="tab"/g) ?? []).length, 1, "the four tabs should come from one mapped template");
  assert.equal((component.match(/role="tabpanel"/g) ?? []).length, 4);
  assert.match(component, /activePanel === "famiglio" &&/);
  assert.match(component, /activePanel === "benefits" &&/);
  assert.match(component, /activePanel === "vip" &&/);
  assert.match(component, /activePanel === "wound" &&/);
  assert.match(component, /href=\{panelHref\(panel\.id\)\}/);
  assert.match(styles, /\.chapterTabs a/);
  assert.match(styles, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
});

test("the news showcase uses real illustrations without cropping and adapts to mobile", () => {
  assert.match(component, /\/novita\/famiglio\/famiglio-del-nexus-spot-v2\.png/);
  assert.match(component, /gatto, cane, lupo, coniglio e volpe/);
  assert.match(component, /\/games\/the-wound-remembers\/key-art-scene-4k-v3\.webp/);
  assert.doesNotMatch(styles, /object-fit:\s*cover/);
  assert.match(styles, /object-fit:\s*contain/);
  assert.match(styles, /@media \(max-width: 680px\)/);
  assert.match(styles, /\.familiarFeature, \.familiarBenefits, \.woundFeature \{ grid-template-columns: 1fr; \}/);
});
