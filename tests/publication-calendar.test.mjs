import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const registry = JSON.parse(await readFile(new URL("../data/site-publication-news.json", import.meta.url), "utf8"));
const page = await readFile(new URL("../app/cronache-del-nexus/page.tsx", import.meta.url), "utf8");
const calendar = await readFile(new URL("../app/cronache-del-nexus/MonthlyCalendar.tsx", import.meta.url), "utf8");
const dayPage = await readFile(new URL("../app/cronache-del-nexus/giorno/[date]/page.tsx", import.meta.url), "utf8");
const styles = await readFile(new URL("../app/cronache-del-nexus/news.css", import.meta.url), "utf8");
const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));

test("raccoglie le pubblicazioni reali senza duplicati e con immagini esistenti", async () => {
  assert.ok(registry.length >= 8);
  assert.equal(new Set(registry.map((entry) => entry.id)).size, registry.length);
  assert.equal(new Set(registry.map((entry) => entry.publicationKey)).size, registry.length);
  await Promise.all(registry.map((entry) => access(new URL(`../public${entry.image}`, import.meta.url))));
  for (const entry of registry) {
    assert.match(entry.date, /^2026-\d{2}-\d{2}$/);
    assert.ok(entry.date >= "2026-09-09");
    assert.match(entry.href, /^\//);
    assert.ok(entry.title.length > 10);
    assert.ok(entry.description.length > 30);
  }
  const scheduledMonths = new Set(registry.map((entry) => entry.date.slice(0, 7)));
  for (const month of ["2026-09", "2026-10", "2026-11"]) assert.ok(scheduledMonths.has(month));
});

test("include giochi, arte, community, commissioni e Famiglio", () => {
  const keys = new Set(registry.map((entry) => entry.publicationKey.split(":")[0]));
  for (const area of ["game", "art", "community", "commissions", "famiglio"]) assert.ok(keys.has(area));
  assert.ok(registry.some((entry) => entry.publicationKey === "game:the-wound-remembers:web-1.0.0"));
  assert.ok(registry.some((entry) => entry.publicationKey === "art:halloween-bundles-2026"));
});

test("apre ogni data in una pagina stabile con informazioni, immagini e percorsi", () => {
  assert.match(page, /getPublicationCalendarEntries\(currentDate\)/);
  assert.match(calendar, /onClick=\{\(\) => setSelectedDate\(date\)\}/);
  assert.match(calendar, /href=\{`\/cronache-del-nexus\/giorno\/\$\{previewEntry\.date\}`\}/);
  assert.match(calendar, /className="monthly-calendar-preview"/);
  assert.doesNotMatch(calendar, /monthly-calendar-detail/);
  assert.match(dayPage, /getPublicationEntriesForDate\(date\)/);
  assert.match(dayPage, /\{entry\.description\}/);
  assert.match(dayPage, /\{entry\.detail\}/);
  assert.match(dayPage, /className="calendar-day-action"/);
  assert.match(styles, /\.calendar-day-news-card figure img\{[^}]*object-fit:contain/);
  assert.match(styles, /\.monthly-calendar-preview figure img\{[^}]*object-fit:contain/);
  assert.doesNotMatch(styles, /\.calendar-day-news-card figure img\{[^}]*object-fit:cover/);
});

test("blocca le build quando il registro del calendario non supera il controllo", () => {
  assert.match(packageJson.scripts.build, /^node scripts\/audit-publication-calendar\.mjs && /);
  assert.match(packageJson.scripts["build:netlify"], /^node scripts\/audit-publication-calendar\.mjs && /);
  assert.equal(packageJson.scripts["audit:calendar"], "node scripts/audit-publication-calendar.mjs");
});

test("esclude attività interne e descrizioni tecniche dalle notizie per gli utenti", () => {
  const internalTerms = /\b(api|build|codice|commit|css|database|deploy|endpoint|fix|hotfix|patch|pipeline|refactor|repository|server|sprite|staging|test)\b/i;
  for (const entry of registry) assert.doesNotMatch(`${entry.title} ${entry.description}`, internalTerms);
});
