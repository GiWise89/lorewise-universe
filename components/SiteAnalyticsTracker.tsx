"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { familiarVisitActivity } from "@/lib/nexusFamiliarMissionCatalog";

const excludedPrefixes = ["/admin", "/account", "/auth", "/api", "/gestione-"];

export function SiteAnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const sessionId = useRef("");

  useEffect(() => {
    const missionActivity = familiarVisitActivity(search ? `${pathname}?${search}` : pathname);
    if (!missionActivity) return;
    const timer = window.setTimeout(() => {
      void fetch("/api/famiglio/activity", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(missionActivity),
        keepalive: true,
      }).catch(() => undefined);
    }, 7000);
    return () => window.clearTimeout(timer);
  }, [pathname, search]);

  useEffect(() => {
    if (window.location.hostname !== "lorewisenexus.it" && window.location.hostname !== "www.lorewisenexus.it") return;
    if (excludedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`) || (prefix.endsWith("-") && pathname.startsWith(prefix)))) return;
    if (!sessionId.current) sessionId.current = crypto.randomUUID();
    let referrerHost = "";
    try {
      const host = document.referrer ? new URL(document.referrer).hostname : "";
      if (host && host !== window.location.hostname) referrerHost = host;
    } catch { /* Un referrer non valido viene trattato come accesso diretto. */ }
    void fetch("/api/analytics/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname, sessionId: sessionId.current, referrerHost }),
      keepalive: true,
    }).catch(() => undefined);
    const funnelLandingSource = pathname === "/"
      ? "homepage_hero"
      : pathname === "/giochi"
        ? "games_hero"
        : pathname === "/giochi/the-wound-remembers"
          ? "landing_detail"
          : "";
    if (funnelLandingSource) {
      void fetch("/api/analytics/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "landing_view", source: funnelLandingSource, sessionId: sessionId.current }),
        keepalive: true,
      }).catch(() => undefined);
    }
  }, [pathname]);

  return null;
}
