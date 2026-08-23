import { getStore } from "@netlify/blobs";
import { ensureAdminNotificationsTable } from "../../lib/adminNotifications.ts";
import { env } from "../../lib/netlifyRuntime.ts";
import {
  WORLD_OF_WARCRAFT_MONITOR,
  buildLivingGuideNotification,
  extractLivingGuideSignals,
  fingerprintLivingGuideSignals,
  livingGuideChanged,
  type LivingGuideSnapshot,
} from "../../lib/livingGuideMonitor.ts";

const SNAPSHOT_KEY = "world-of-warcraft/latest.json";

export default async function checkLivingGuides() {
  const checkedAt = new Date().toISOString();
  const pages = await Promise.all(WORLD_OF_WARCRAFT_MONITOR.sourceUrls.map(async (url) => {
    const response = await fetch(url, { headers: { "user-agent": "LoreWise-Living-Guide-Monitor/1.0" } });
    if (!response.ok) throw new Error(`Living guide source returned ${response.status}: ${url}`);
    return response.text();
  }));
  const signals = [...new Set(pages.flatMap(extractLivingGuideSignals))].sort((left, right) => left.localeCompare(right, "en"));
  if (!signals.length) throw new Error("No relevant World of Warcraft signals were found; snapshot was not changed.");

  const current: LivingGuideSnapshot = {
    guideSlug: WORLD_OF_WARCRAFT_MONITOR.guideSlug,
    checkedAt,
    fingerprint: await fingerprintLivingGuideSignals(signals),
    signals,
  };
  const store = getStore({ name: "lorewise-living-guides", consistency: "strong" });
  const previous = await store.get(SNAPSHOT_KEY, { type: "json", consistency: "strong" }) as LivingGuideSnapshot | null;

  if (livingGuideChanged(previous, current)) {
    const notification = buildLivingGuideNotification(current);
    await ensureAdminNotificationsTable(env.DB);
    await env.DB.prepare(`INSERT OR IGNORE INTO admin_notifications
      (id, category, severity, title, message, reference_code, target_url, source_created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(notification.id, notification.category, notification.severity, notification.title, notification.message,
        notification.referenceCode, notification.targetUrl, notification.sourceCreatedAt).run();
  }

  await store.setJSON(SNAPSHOT_KEY, current);
  return new Response(JSON.stringify({ ok: true, seeded: !previous, changed: livingGuideChanged(previous, current), signals: signals.length }), {
    headers: { "content-type": "application/json" },
  });
}

export const config = { schedule: "0 7 23 * *" };
