"use client";

import { useEffect, useMemo, useState } from "react";
import { BLACK_FRIDAY_STARTS_AT } from "@/lib/blackFridayTeaser";

const SECOND = 1_000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const defaultPreviewAt = "2026-11-12T20:26:00+01:00";

function splitDuration(milliseconds: number) {
  const safeDuration = Math.max(0, milliseconds);
  return {
    days: Math.floor(safeDuration / DAY),
    hours: Math.floor((safeDuration % DAY) / HOUR),
    minutes: Math.floor((safeDuration % HOUR) / MINUTE),
    seconds: Math.floor((safeDuration % MINUTE) / SECOND),
  };
}

function twoDigits(value: number) {
  return String(value).padStart(2, "0");
}

export function BlackFridayCountdown({ compact = false, preview = false, previewAt = defaultPreviewAt, targetAt = BLACK_FRIDAY_STARTS_AT, arrivedLabel = "Il portale è aperto." }: { compact?: boolean; preview?: boolean; previewAt?: string; targetAt?: string; arrivedLabel?: string }) {
  const [mountedAt] = useState(() => Date.now());
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const refresh = () => setNow(Date.now());
    refresh();
    const timer = window.setInterval(refresh, SECOND);
    return () => window.clearInterval(timer);
  }, []);

  const effectiveNow = now === null ? null : preview ? Date.parse(previewAt) + (now - mountedAt) : now;
  const countdown = useMemo(() => effectiveNow === null
    ? null
    : splitDuration(Date.parse(targetAt) - effectiveNow), [effectiveNow, targetAt]);
  const arrived = effectiveNow !== null && effectiveNow >= Date.parse(targetAt);
  const units = [
    ["Giorni", countdown?.days],
    ["Ore", countdown?.hours],
    ["Minuti", countdown?.minutes],
    ["Secondi", countdown?.seconds],
  ] as const;

  return <div className={`black-friday-countdown${compact ? " is-compact" : ""}`} role="timer" aria-label="Tempo mancante alla prossima apertura promozionale">
    {arrived ? <strong className="black-friday-arrived">{arrivedLabel}</strong> : units.map(([label, value]) => <span className="black-friday-time-unit" key={label}>
      <strong>{value === undefined ? "--" : twoDigits(value)}</strong>
      <small>{label}</small>
    </span>)}
  </div>;
}
