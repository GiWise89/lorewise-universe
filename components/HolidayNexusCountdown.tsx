"use client";

import { useEffect, useMemo, useState } from "react";

const SECOND = 1_000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function splitDuration(milliseconds: number) {
  const safe = Math.max(0, milliseconds);
  return {
    days: Math.floor(safe / DAY),
    hours: Math.floor((safe % DAY) / HOUR),
    minutes: Math.floor((safe % HOUR) / MINUTE),
    seconds: Math.floor((safe % MINUTE) / SECOND),
  };
}

export function HolidayNexusCountdown({ targetAt, previewAt }: { targetAt: string; previewAt?: string }) {
  const [mountedAt] = useState(() => Date.now());
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const refresh = () => setNow(Date.now());
    refresh();
    const timer = window.setInterval(refresh, SECOND);
    return () => window.clearInterval(timer);
  }, []);

  const effectiveNow = now === null ? null : previewAt ? Date.parse(previewAt) + (now - mountedAt) : now;
  const remaining = useMemo(() => effectiveNow === null ? null : splitDuration(Date.parse(targetAt) - effectiveNow), [effectiveNow, targetAt]);
  const arrived = effectiveNow !== null && effectiveNow >= Date.parse(targetAt);
  const units = [
    ["Giorni", remaining?.days],
    ["Ore", remaining?.hours],
    ["Minuti", remaining?.minutes],
    ["Secondi", remaining?.seconds],
  ] as const;

  return <div className="holiday-nexus-countdown" role="timer" aria-label="Conto alla rovescia delle Feste nel Nexus">
    {arrived ? <strong className="holiday-nexus-countdown-arrived">Il tempo promozionale è terminato.</strong> : units.map(([label, value]) => <span key={label}>
      <strong>{value === undefined ? "--" : String(value).padStart(2, "0")}</strong>
      <small>{label}</small>
    </span>)}
  </div>;
}
