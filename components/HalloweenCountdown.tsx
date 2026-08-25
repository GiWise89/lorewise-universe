"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

const HALLOWEEN = new Date("2026-10-31T00:00:00+01:00");
const PROMOTION_END = new Date("2026-11-02T00:00:00+01:00");
const SECOND = 1_000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function splitDuration(milliseconds: number) {
  const safeDuration = Math.max(0, milliseconds);
  const days = Math.floor(safeDuration / DAY);
  const hours = Math.floor((safeDuration % DAY) / HOUR);
  const minutes = Math.floor((safeDuration % HOUR) / MINUTE);
  const seconds = Math.floor((safeDuration % MINUTE) / SECOND);
  return { days, hours, minutes, seconds };
}

function twoDigits(value: number) {
  return value.toString().padStart(2, "0");
}

export function HalloweenCountdown() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const refresh = () => setNow(new Date());
    refresh();
    const timer = window.setInterval(refresh, SECOND);
    return () => window.clearInterval(timer);
  }, []);

  const countdown = useMemo(() => {
    if (!now) return null;
    if (now >= PROMOTION_END) return { phase: "ended" as const, ...splitDuration(0) };
    if (now >= HALLOWEEN) return { phase: "closing" as const, ...splitDuration(PROMOTION_END.getTime() - now.getTime()) };
    return { phase: "waiting" as const, ...splitDuration(HALLOWEEN.getTime() - now.getTime()) };
  }, [now]);

  const isEnded = countdown?.phase === "ended";
  const label = countdown?.phase === "closing" ? "alla fine della promo" : "giorni ad Halloween";
  const clock = countdown
    ? `${twoDigits(countdown.hours)}:${twoDigits(countdown.minutes)}:${twoDigits(countdown.seconds)}`
    : "--:--:--";

  return <section className="halloween-countdown" aria-label="Conto alla rovescia della promozione di Halloween">
    <div className="halloween-countdown-stage">
      <Image
        src="/decorations/halloween/halloween-countdown-diorama-optimized-v1.webp"
        alt="Luna arancione, castello infestato, rami, pipistrelli e zucche disposti in un diorama circolare"
        width={1254}
        height={1254}
        unoptimized
        priority
      />
      <div className="halloween-countdown-card">
        <small>{isEnded ? "Halloween 2026" : "Manca ancora"}</small>
        <strong>{isEnded ? "Fine" : (countdown?.days ?? "—")}</strong>
        <span>{isEnded ? "Promozione conclusa" : label}</span>
        <time dateTime={countdown ? `P${countdown.days}DT${countdown.hours}H${countdown.minutes}M${countdown.seconds}S` : undefined}>
          {isEnded ? "00:00:00" : clock}
        </time>
      </div>
      <div className="halloween-countdown-facts" aria-label="Dettagli della promozione">
        <div className="halloween-countdown-fact is-start"><small>Inizio</small><strong>26 ott</strong></div>
        <div className="halloween-countdown-fact is-end"><small>Fine</small><strong>01 nov</strong></div>
        <div className="halloween-countdown-fact is-discount"><small>Sconto</small><strong>fino al 25%</strong></div>
        <div className="halloween-countdown-fact is-slots"><small>Posti</small><strong>10</strong></div>
      </div>
    </div>
  </section>;
}
