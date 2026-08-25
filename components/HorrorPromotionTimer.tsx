"use client";

import { useEffect, useMemo, useState } from "react";
import { HORROR_BUNDLE_ENDS_AT, HORROR_BUNDLE_STARTS_AT } from "@/lib/horrorArtworkBundles";

const start = Date.parse(HORROR_BUNDLE_STARTS_AT);
const end = Date.parse(HORROR_BUNDLE_ENDS_AT);
const previewDate = Date.parse("2026-10-26T20:26:00+01:00");

function splitTime(milliseconds: number) {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  return {
    days: Math.floor(seconds / 86400),
    hours: Math.floor(seconds / 3600) % 24,
    minutes: Math.floor(seconds / 60) % 60,
    seconds: seconds % 60,
  };
}

export function HorrorPromotionTimer({ preview = false }: { preview?: boolean }) {
  const [mountedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const effectiveNow = preview ? previewDate + (now - mountedAt) : now;
  const phase = effectiveNow < start ? "upcoming" : effectiveNow <= end ? "active" : "ended";
  const remaining = splitTime((phase === "upcoming" ? start : end) - effectiveNow);
  const progress = useMemo(() => Math.min(100, Math.max(0, ((effectiveNow - start) / (end - start)) * 100)), [effectiveNow]);

  if (phase === "ended") return <div className="horror-promo-timer is-ended"><span>Edizione 2026 conclusa</span><strong>Le opere restano nella vetrina</strong></div>;

  const units = [
    ["Giorni", remaining.days],
    ["Ore", remaining.hours],
    ["Minuti", remaining.minutes],
    ["Secondi", remaining.seconds],
  ] as const;

  return <aside className={`horror-promo-timer is-${phase}`} aria-label={phase === "active" ? "Tempo rimasto alla fine della promozione" : "Tempo mancante all’inizio della promozione"}>
    <div className="horror-timer-topline">
      <span><i aria-hidden="true" /> {preview ? "Anteprima timer" : phase === "active" ? "Edizione limitata attiva" : "Apertura delle collezioni"}</span>
      <strong>{phase === "active" ? "La porta si chiude tra" : "La porta si apre tra"}</strong>
    </div>
    <div className="horror-timer-units" role="timer" aria-live="off">
      {units.map(([label, value]) => <div key={label}><strong>{String(value).padStart(2, "0")}</strong><span>{label}</span></div>)}
    </div>
    <div className="horror-timer-track" aria-hidden="true"><span style={{ width: `${phase === "active" ? progress : 0}%` }} /></div>
    <p>{phase === "active" ? "Disponibile fino alle 23:59 del 1° novembre 2026." : "Disponibile dal 1° ottobre al 1° novembre 2026."}</p>
  </aside>;
}
