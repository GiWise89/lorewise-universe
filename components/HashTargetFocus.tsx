"use client";

import { useEffect } from "react";

export function HashTargetFocus({ targetId, active = false }: { targetId: string; active?: boolean }) {
  useEffect(() => {
    const scrollToTarget = () => {
      const requestedTarget = decodeURIComponent(window.location.hash.replace(/^#/, ""));
      if (!active && requestedTarget !== targetId) return;
      const target = document.getElementById(targetId);
      if (!target) return;
      const headerOffset = window.matchMedia("(max-width: 700px)").matches ? 88 : 120;
      const targetTop = target.getBoundingClientRect().top + window.scrollY - headerOffset;
      window.scrollTo({ top: Math.max(0, targetTop), behavior: "auto" });
      target.focus({ preventScroll: true });
    };
    const timers = [0, 120, 350, 750, 1300, 2200].map((delay) => window.setTimeout(scrollToTarget, delay));
    window.addEventListener("hashchange", scrollToTarget);
    window.addEventListener("pageshow", scrollToTarget);
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      window.removeEventListener("hashchange", scrollToTarget);
      window.removeEventListener("pageshow", scrollToTarget);
    };
  }, [active, targetId]);

  return null;
}
