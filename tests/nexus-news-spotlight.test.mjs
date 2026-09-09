import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const page = await readFile(new URL("../app/cronache-del-nexus/page.tsx", import.meta.url), "utf8");
const calendar = await readFile(new URL("../app/cronache-del-nexus/MonthlyCalendar.tsx", import.meta.url), "utf8");
const dayPage = await readFile(new URL("../app/cronache-del-nexus/giorno/[date]/page.tsx", import.meta.url), "utf8");
const styles = await readFile(new URL("../app/cronache-del-nexus/news.css", import.meta.url), "utf8");
const publicationSource = await readFile(new URL("../lib/publicationCalendar.ts", import.meta.url), "utf8");

test("organizza le Novità come un vero calendario mensile interattivo", () => {
  assert.match(page, /Il calendario dei mondi/);
  assert.match(page, /Un mese da esplorare, giorno per giorno/);
  assert.match(page, /<MonthlyCalendar entries=\{calendarEntries\}/);
  assert.match(calendar, /^"use client";/);
  assert.match(calendar, /role="grid"/);
  assert.match(calendar, /setSelectedDate/);
  assert.match(calendar, /data-has-news/);
  assert.match(calendar, /monthly-calendar-preview/);
  assert.doesNotMatch(calendar, /monthly-calendar-detail/);
  assert.match(dayPage, /calendar-day-news-card/);
  assert.match(page, /Disponibile/);
  assert.match(publicationSource, /In arrivo/);
  assert.doesNotMatch(page, /activeSection|sezione=\$\{item\.id\}|NexusNewsSpotlight|NexusChroniclesFeed/);
});

test("ricava automaticamente date, cronache e promozioni dalle fonti pubbliche", () => {
  assert.match(page, /getPublicationCalendarEntries\(currentDate\)/);
  assert.match(page, /editorialReleaseInstant/);
  assert.match(page, /getActiveCommissionPromotion/);
  assert.match(page, /getNexusChronicles\(currentDate\)/);
  assert.match(page, /dynamic = "force-dynamic"/);
});

test("mantiene immagini complete e tipografia leggibile anche su mobile", () => {
  assert.match(styles, /object-fit:contain/);
  assert.doesNotMatch(styles, /object-fit:\s*cover/);
  assert.match(styles, /word-break:normal/);
  assert.match(styles, /hyphens:none/);
  assert.match(styles, /@media\(max-width:620px\)/);
  assert.match(styles, /\.monthly-calendar-grid\{display:grid;grid-template-columns:repeat\(7/);
  assert.match(styles, /--month-bg:url\('\/novita\/calendar-backgrounds\/january-lorewise-calendar-bg-v1\.webp'\)/);
  assert.match(styles, /\.monthly-calendar-sticker-shelf\{[^}]*border-bottom/);
  assert.match(styles, /\.monthly-calendar-stickers\{[^}]*object-fit:contain/);
});

test("offre percorsi diretti verso giochi, arte, commissioni e community", () => {
  for (const href of ["/giochi", "/arte", "/commissioni", "/community"]) assert.match(page, new RegExp(`href="${href}"`));
});
