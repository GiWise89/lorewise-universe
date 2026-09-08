import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("keeps The Wound Remembers landing focused on immediate play", async () => {
  const source = await readFile(new URL("../app/giochi/[slug]/page.tsx", import.meta.url), "utf8");

  assert.match(source, /isTheWoundRemembers = project\.slug === "the-wound-remembers"/);
  assert.match(source, /Giocabile ora · Browser/);
  assert.match(source, /Costruisci il tuo Patto\. Leggi la Nemesi\. Sopravvivi a battaglie PvE su tre corsie\./);
  assert.match(source, /<FunnelLink className="game-hero-primary" href=\{project\.publicUrl\} eventName="play_cta_click" source="landing_hero">Gioca ora/);
  assert.match(source, /TwrGameplayTrailer className="game-hero-secondary"/);
  assert.match(source, /isTheWoundRemembers && project\.logoImage \? <>\s*<Image className="game-dossier-logo"/);
  assert.match(source, /<h1 className=\{styles\.visuallyHiddenTitle\}>\{project\.title\}<\/h1>/);
  const woundActionBranch = source.match(/\{isTheWoundRemembers \? <>([\s\S]*?)<\/> : isFuoriTrama/)?.[1] ?? "";
  assert.ok(woundActionBranch);
  assert.doesNotMatch(woundActionBranch, /Edizione Windows|target="_blank"/);
});

test("puts The Wound Remembers before the wider LoreWise ecosystem", async () => {
  const home = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const games = await readFile(new URL("../app/giochi/page.tsx", import.meta.url), "utf8");
  const header = await readFile(new URL("../components/SiteHeader.tsx", import.meta.url), "utf8");

  assert.ok(home.indexOf("twr-home-title") < home.indexOf("universe-map"));
  assert.match(home, /source="homepage_hero">Gioca ora/);
  assert.ok(games.indexOf("studio-real-projects") < games.indexOf("studio-guides-callout"));
  assert.match(games, /source="games_hero">Gioca a The Wound Remembers/);
  assert.match(header, /label: "Gioca ora", href: "\/giochi\/the-wound-remembers"/);
});

test("keeps funnel measurement proprietary and anonymous", async () => {
  const tracker = await readFile(new URL("../components/SiteAnalyticsTracker.tsx", import.meta.url), "utf8");
  const eventRoute = await readFile(new URL("../app/api/analytics/event/route.ts", import.meta.url), "utf8");
  const analytics = await readFile(new URL("../lib/siteAnalytics.ts", import.meta.url), "utf8");

  assert.match(tracker, /event: "landing_view"/);
  assert.match(eventRoute, /new Set\(\["landing_view", "play_cta_click"\]\)/);
  assert.match(eventRoute, /recordSitePageView/);
  assert.doesNotMatch(eventRoute, /email|ip_address|user_id/i);
  assert.match(analytics, /twrFunnel/);
});
