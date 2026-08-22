"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const excludedPrefixes = ["/admin", "/account", "/auth", "/api", "/gestione-"];

export function SiteAnalyticsTracker() {
  const pathname = usePathname();
  const sessionId = useRef("");

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
  }, [pathname]);

  return null;
}
