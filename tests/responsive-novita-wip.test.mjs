import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { obsessionWorkInProgress } from "../lib/studioWorkInProgress.ts";

test("publishes the three authentic Obsession drawing stages as one work in progress", async () => {
  assert.equal(obsessionWorkInProgress.stages.length, 3);
  assert.equal(obsessionWorkInProgress.status, "Disegno in lavorazione");
  assert.match(obsessionWorkInProgress.inspiration, /film horror Obsession di Curry Barker/);
  assert.match(obsessionWorkInProgress.attribution, /Fan art|Disegno|GiWise Studio/i);

  for (const stage of obsessionWorkInProgress.stages) {
    assert.ok(stage.image.startsWith("/novita/obsession/"));
    assert.ok(stage.width > 0);
    assert.ok(stage.height > stage.width);
    await readFile(new URL(`../public${stage.image}`, import.meta.url));
  }
});

test("keeps the public preview copies byte-identical when private source screenshots are present", async () => {
  const pairs = [
    ["../bozze progetti/obsession/Screenshot 2026-08-25 235909.png", "../public/novita/obsession/nikki-linea-iniziale.webp"],
    ["../bozze progetti/obsession/Screenshot 2026-08-26 011112.png", "../public/novita/obsession/nikki-ritratto-completo.webp"],
    ["../bozze progetti/obsession/Screenshot 2026-08-26 014647.png", "../public/novita/obsession/nikki-presenza-emersa.webp"],
  ];
  for (const [source, preview] of pairs) {
    try { await access(new URL(source, import.meta.url)); } catch { await readFile(new URL(preview, import.meta.url)); continue; }
    assert.deepEqual(await readFile(new URL(source, import.meta.url)), await readFile(new URL(preview, import.meta.url)));
  }
});

test("adds an interactive Obsession sequence to Novita and never crops its drawings", async () => {
  const [page, component, styles] = await Promise.all([
    readFile(new URL("../app/cronache-del-nexus/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/StudioWorkInProgress.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.doesNotMatch(page, /<StudioWorkInProgress \/>/);
  const feed = await readFile(new URL("../components/NexusChroniclesFeed.tsx", import.meta.url), "utf8");
  assert.match(feed, /studio-panel[\s\S]*<StudioWorkInProgress \/>/);
  assert.match(component, /^"use client";/);
  assert.match(component, /window\.setInterval/);
  assert.match(component, /aria-pressed=\{index === activeIndex\}/);
  assert.match(component, /Metti in pausa/);
  assert.match(component, /Avvia la sequenza/);
  assert.match(component, /prefers-reduced-motion: reduce/);
  assert.match(component, /Opera non ancora terminata/);
  assert.match(component, /attiva “Novità di GiWise Studio”/);
  const start = styles.indexOf(".studio-work-progress-visual figure img");
  const end = styles.indexOf("}", start);
  assert.ok(start >= 0);
  assert.match(styles.slice(start, end), /object-fit:contain/);
  assert.doesNotMatch(styles.slice(start, end), /object-fit:cover/);
  assert.match(styles, /@keyframes obsession-reveal/);
  assert.match(styles, /@media \(prefers-reduced-motion:reduce\)/);
});

test("limits card compaction to phones and menu reordering to tablets", async () => {
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const tabletSelector = styles.indexOf(".mobile-navigation .mobile-navigation-primary { grid-template-columns:repeat(4,minmax(0,1fr));", 10_000);
  const phoneSelector = styles.indexOf(".commission-hub-page .commission-chapter-navigation nav > a { min-height:96px");
  const vipSelector = styles.indexOf(".vip-area-nav button,.vip-area-nav .is-locked { min-height:305px");
  const tabletStart = styles.lastIndexOf("@media (min-width:701px) and (max-width:1100px)", tabletSelector);
  const phoneStart = styles.lastIndexOf("@media (max-width:700px)", phoneSelector);
  const vipPhoneStart = styles.lastIndexOf("@media (max-width:620px)", vipSelector);
  assert.ok(tabletStart >= 0);
  assert.ok(phoneStart >= 0);
  assert.ok(vipPhoneStart >= 0);
  assert.match(styles.slice(tabletStart, tabletStart + 2_000), /mobile-navigation-primary/);
  assert.match(styles.slice(phoneStart, phoneStart + 4_000), /commission-chapter-navigation nav > a \{ min-height:96px/);
  assert.match(styles.slice(vipPhoneStart, vipPhoneStart + 1_000), /vip-area-nav button,.vip-area-nav \.is-locked \{ min-height:305px/);
});
