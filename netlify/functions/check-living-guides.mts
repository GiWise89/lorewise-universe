import { getStore } from "@netlify/blobs";
import { ensureAdminNotificationsTable } from "../../lib/adminNotifications.ts";
import { env } from "../../lib/netlifyRuntime.ts";
import {
  LIVING_GUIDE_MONITORS,
  buildLivingGuideNotification,
  extractLivingGuideSignals,
  fingerprintLivingGuideSignals,
  livingGuideChanged,
  type LivingGuideSnapshot,
} from "../../lib/livingGuideMonitor.ts";

export default async function checkLivingGuides() {
  const checkedAt = new Date().toISOString();
  const store = getStore({ name: "lorewise-living-guides", consistency: "strong" });
  const results = [];
  for (const monitor of LIVING_GUIDE_MONITORS) {
    const pages = await Promise.all(monitor.sourceUrls.map(async (url) => {
      const response = await fetch(url, { headers: { "user-agent": "LoreWise-Living-Guide-Monitor/1.0" } });
      if (!response.ok) throw new Error(`Living guide source returned ${response.status}: ${url}`);
      return response.text();
    }));
    const signals = [...new Set(pages.flatMap(extractLivingGuideSignals))].sort((left, right) => left.localeCompare(right, "en"));
    if (!signals.length) throw new Error(`No relevant ${monitor.guideTitle} signals were found; snapshot was not changed.`);
    const current: LivingGuideSnapshot = { guideSlug: monitor.guideSlug, checkedAt, fingerprint: await fingerprintLivingGuideSignals(signals), signals };
    const snapshotKey = `${monitor.guideSlug}/latest.json`;
    const previous = await store.get(snapshotKey, { type: "json", consistency: "strong" }) as LivingGuideSnapshot | null;
    const changed = livingGuideChanged(previous, current);
    if (changed) {
      const notification = buildLivingGuideNotification(current);
      await ensureAdminNotificationsTable(env.DB);
      await env.DB.prepare(`INSERT OR IGNORE INTO admin_notifications
        (id, category, severity, title, message, reference_code, target_url, source_created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(notification.id, notification.category, notification.severity, notification.title, notification.message,
          notification.referenceCode, notification.targetUrl, notification.sourceCreatedAt).run();
    }
    await store.setJSON(snapshotKey, current);
    results.push({ guideSlug: monitor.guideSlug, seeded: !previous, changed, signals: signals.length });
  }
  return new Response(JSON.stringify({ ok: true, guides: results }), {
    headers: { "content-type": "application/json" },
  });
}

export const config = { schedule: "0 7 23 * *" };
