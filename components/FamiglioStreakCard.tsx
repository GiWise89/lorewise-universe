"use client";

import { familiarStreakSummary, type FamiliarStreakSummary } from "@/lib/famiglioStreak";
import styles from "./FamiglioStreakCard.module.css";

type StreakAttendance = Parameters<typeof familiarStreakSummary>[0];

export function FamiglioStreakFlame({ lit, className }: { lit: boolean; className?: string }) {
  return (
    <svg className={className} data-lit={lit} viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false" shapeRendering="crispEdges">
      <path d="M7 1h2v2h1v1h1v2h1v1h1v5h-1v1h-1v1H4v-1H3v-1H2V8h1V6h1v1h1V4h1V2h1z" fill="currentColor" />
      <path d="M7 7h2v1h1v2h1v2h-1v1H6v-1H5v-2h1V8h1z" fill="#fff3b0" opacity={lit ? 1 : 0.35} />
    </svg>
  );
}

function daysLabel(value: number) {
  return value === 1 ? "1 giorno" : `${value} giorni`;
}

function progressValue(summary: FamiliarStreakSummary) {
  if (!summary.nextMilestone) return 100;
  const span = summary.nextMilestone.days - summary.previousMilestoneDays;
  return Math.round(((summary.current - summary.previousMilestoneDays) / span) * 100);
}

export function FamiglioStreakCard({
  attendance,
  busy,
  message,
  onClaim,
  onOpenAttendance,
}: {
  attendance: StreakAttendance;
  busy: boolean;
  message?: string | null;
  onClaim: (days: number) => void;
  onOpenAttendance: () => void;
}) {
  const summary = familiarStreakSummary(attendance);
  const claimable = summary.claimable[0] ?? null;
  const next = summary.nextMilestone;
  const progress = progressValue(summary);
  const status = summary.current === 0
    ? "Registra una presenza per accendere la serie."
    : summary.atRisk
      ? "Registra la presenza di oggi per non spegnere la serie."
      : next
        ? `Prossimo traguardo: ${next.title}, ${daysLabel(next.days)} (mancano ${daysLabel(next.days - summary.current)}).`
        : "Hai raggiunto tutti i traguardi: tieni viva la fiamma.";

  return (
    <section className={styles.card} data-lit={summary.current > 0} data-risk={summary.atRisk} aria-labelledby="famiglio-streak-title">
      <div className={styles.flame}>
        <FamiglioStreakFlame lit={summary.current > 0} className={styles.flameIcon} />
        <b aria-hidden="true">{summary.current}</b>
      </div>
      <div className={styles.body}>
        <small id="famiglio-streak-title">Serie di presenze</small>
        <strong>{summary.current === 0 ? "Serie spenta" : summary.current === 1 ? "1 giorno" : `${summary.current} giorni consecutivi`}</strong>
        <span className={styles.track} role="progressbar" aria-label={next ? `Verso il traguardo ${next.title}` : "Traguardi della serie completati"} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-valuetext={next ? `${summary.current} su ${next.days} giorni` : "Tutti i traguardi raggiunti"}>
          <i style={{ width: `${progress}%` }} />
        </span>
        <p>{status} <span className={styles.best}>Record: {daysLabel(summary.best)}.</span></p>
      </div>
      {claimable ? (
        <button className={styles.claim} type="button" disabled={busy} onClick={() => onClaim(claimable.days)} aria-label={`Riscatta il traguardo ${claimable.title} di ${daysLabel(claimable.days)}: ${claimable.label}`}>
          {busy ? "Riscatto…" : `Riscatta ${claimable.title}`}
        </button>
      ) : !summary.claimedToday ? (
        <button className={styles.secondary} type="button" onClick={onOpenAttendance}>Presenza di oggi</button>
      ) : null}
      <p className={styles.message} role="status">{message ?? ""}</p>
    </section>
  );
}
