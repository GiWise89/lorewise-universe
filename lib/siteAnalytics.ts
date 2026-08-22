export const LOREWISE_PUBLIC_HOSTS = new Set(["lorewisenexus.it", "www.lorewisenexus.it"]);

export type SiteAnalyticsSummary = {
  configuredHost: string;
  totals: { today: number; last7Days: number; last30Days: number; allTime: number; sessions30Days: number };
  daily: Array<{ day: string; views: number; sessions: number }>;
  topPages: Array<{ path: string; views: number; sessions: number }>;
  referrers: Array<{ host: string; views: number }>;
};

export function normalizeRequestHost(value: string | null) {
  return (value ?? "").split(",", 1)[0].trim().toLocaleLowerCase("en-US").replace(/:\d+$/, "");
}

export function isLoreWisePublicHost(host: string) {
  return LOREWISE_PUBLIC_HOSTS.has(normalizeRequestHost(host));
}

export function isTrackablePublicPath(path: string) {
  if (!path.startsWith("/") || path.startsWith("//") || path.length > 240 || /[?#\u0000-\u001f]/.test(path)) return false;
  return !["/admin", "/account", "/auth", "/api", "/gestione-"].some((prefix) => path === prefix || path.startsWith(`${prefix}/`) || (prefix.endsWith("-") && path.startsWith(prefix)));
}

export async function ensureSiteAnalyticsTable(database: D1Database) {
  await database.prepare(`CREATE TABLE IF NOT EXISTS site_page_views (
    id TEXT PRIMARY KEY NOT NULL,
    site_host TEXT NOT NULL,
    path TEXT NOT NULL,
    session_hash TEXT NOT NULL,
    referrer_host TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
  )`).run();
  await database.prepare("CREATE INDEX IF NOT EXISTS site_page_views_created_idx ON site_page_views(created_at)").run();
  await database.prepare("CREATE INDEX IF NOT EXISTS site_page_views_path_idx ON site_page_views(path, created_at)").run();
  await database.prepare("CREATE INDEX IF NOT EXISTS site_page_views_session_idx ON site_page_views(session_hash, created_at)").run();
}

async function dailySessionHash(sessionId: string) {
  const day = new Date().toISOString().slice(0, 10);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${day}:${sessionId}`));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function recordSitePageView(database: D1Database, input: { host: string; path: string; sessionId: string; referrerHost?: string }) {
  await ensureSiteAnalyticsTable(database);
  const sessionHash = await dailySessionHash(input.sessionId);
  await database.prepare(`INSERT INTO site_page_views (id, site_host, path, session_hash, referrer_host)
    VALUES (?, ?, ?, ?, ?)`).bind(crypto.randomUUID(), input.host, input.path, sessionHash, input.referrerHost || null).run();
  // Conservazione tecnica limitata: nessun evento analitico oltre circa tredici mesi.
  if (Math.random() < 0.01) await database.prepare("DELETE FROM site_page_views WHERE datetime(created_at) < datetime('now', '-400 days')").run();
}

export async function getSiteAnalyticsSummary(database: D1Database): Promise<SiteAnalyticsSummary> {
  await ensureSiteAnalyticsTable(database);
  const [today, last7Days, last30Days, allTime, sessions30Days, daily, topPages, referrers] = await Promise.all([
    database.prepare("SELECT COUNT(*) AS total FROM site_page_views WHERE substr(created_at, 1, 10) = substr(CAST(CURRENT_TIMESTAMP AS TEXT), 1, 10)").first<{ total: number }>(),
    database.prepare("SELECT COUNT(*) AS total FROM site_page_views WHERE datetime(created_at) >= datetime('now', '-7 days')").first<{ total: number }>(),
    database.prepare("SELECT COUNT(*) AS total FROM site_page_views WHERE datetime(created_at) >= datetime('now', '-30 days')").first<{ total: number }>(),
    database.prepare("SELECT COUNT(*) AS total FROM site_page_views").first<{ total: number }>(),
    database.prepare("SELECT COUNT(DISTINCT session_hash) AS total FROM site_page_views WHERE datetime(created_at) >= datetime('now', '-30 days')").first<{ total: number }>(),
    database.prepare(`SELECT substr(created_at, 1, 10) AS day, COUNT(*) AS views, COUNT(DISTINCT session_hash) AS sessions
      FROM site_page_views WHERE datetime(created_at) >= datetime('now', '-14 days') GROUP BY substr(created_at, 1, 10) ORDER BY day ASC`).all<{ day: string; views: number; sessions: number }>(),
    database.prepare(`SELECT path, COUNT(*) AS views, COUNT(DISTINCT session_hash) AS sessions
      FROM site_page_views WHERE datetime(created_at) >= datetime('now', '-30 days') GROUP BY path ORDER BY views DESC, path ASC LIMIT 10`).all<{ path: string; views: number; sessions: number }>(),
    database.prepare(`SELECT COALESCE(NULLIF(referrer_host, ''), 'Diretto o interno') AS host, COUNT(*) AS views
      FROM site_page_views WHERE datetime(created_at) >= datetime('now', '-30 days') GROUP BY COALESCE(NULLIF(referrer_host, ''), 'Diretto o interno') ORDER BY views DESC LIMIT 8`).all<{ host: string; views: number }>(),
  ]);
  return {
    configuredHost: "lorewisenexus.it",
    totals: {
      today: Number(today?.total ?? 0), last7Days: Number(last7Days?.total ?? 0), last30Days: Number(last30Days?.total ?? 0),
      allTime: Number(allTime?.total ?? 0), sessions30Days: Number(sessions30Days?.total ?? 0),
    },
    daily: daily.results.map((row) => ({ day: row.day, views: Number(row.views), sessions: Number(row.sessions) })),
    topPages: topPages.results.map((row) => ({ path: row.path, views: Number(row.views), sessions: Number(row.sessions) })),
    referrers: referrers.results.map((row) => ({ host: row.host, views: Number(row.views) })),
  };
}
