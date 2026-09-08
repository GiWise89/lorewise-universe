"use client";

import type { MouseEvent, ReactNode } from "react";

type FunnelEvent = "landing_view" | "play_cta_click";

type FunnelLinkProps = {
  href: string;
  eventName: FunnelEvent;
  source: string;
  className?: string;
  children: ReactNode;
  ariaLabel?: string;
};

const sessionKey = "lorewise-twr-funnel-session";

function sessionId() {
  try {
    const stored = window.sessionStorage.getItem(sessionKey);
    if (stored) return stored;
    const created = crypto.randomUUID();
    window.sessionStorage.setItem(sessionKey, created);
    return created;
  } catch {
    return crypto.randomUUID();
  }
}

function attributedHref(href: string, source: string, session = "") {
  if (!href.startsWith("http")) return href;
  const target = new URL(href);
  target.searchParams.set("utm_source", "lorewisenexus.it");
  target.searchParams.set("utm_medium", "referral");
  target.searchParams.set("utm_campaign", "twr_30_day_playtest");
  target.searchParams.set("utm_content", source);
  if (session) target.searchParams.set("lw_session", session);
  return target.toString();
}

export function FunnelLink({ href, eventName, source, className, children, ariaLabel }: FunnelLinkProps) {
  const publicHref = attributedHref(href, source);

  const track = (event: MouseEvent<HTMLAnchorElement>) => {
    const session = sessionId();
    void fetch("/api/analytics/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: eventName, source, sessionId: session }),
      keepalive: true,
    }).catch(() => undefined);

    if (href.startsWith("http") && !event.metaKey && !event.ctrlKey && !event.shiftKey && event.button === 0) {
      event.preventDefault();
      window.location.assign(attributedHref(href, source, session));
    }
  };

  return <a className={className} href={publicHref} aria-label={ariaLabel} onClick={track}>{children}</a>;
}
