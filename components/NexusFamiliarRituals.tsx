"use client";

/* eslint-disable @next/next/no-img-element -- Le scene raster devono mantenere resa pixel-art e proporzioni esatte. */

import {
  FAMILIAR_ATTENDANCE_REWARDS,
  FAMILIAR_WISH_CATALOG,
  familiarAttendanceWeek,
  type FamiliarWishKind,
} from "@/lib/nexusFamiliarRituals";
import type { NexusFamiliarState } from "@/lib/nexusFamiliar";
import { useEffect, useRef, useState } from "react";
import styles from "./NexusFamiliarRituals.module.css";

export type FamiliarRitualView = "attendance" | "wish";

type Props = {
  state: NexusFamiliarState;
  view: FamiliarRitualView;
  busy: boolean;
  onAttendance: () => void;
  onWish: (kind: FamiliarWishKind) => void;
};

const WEEKDAY_LABELS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

function weekDates(now = new Date()) {
  const cursor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const weekday = cursor.getUTCDay() || 7;
  cursor.setUTCDate(cursor.getUTCDate() - weekday + 1);
  return WEEKDAY_LABELS.map((label, index) => {
    const date = new Date(cursor);
    date.setUTCDate(cursor.getUTCDate() + index);
    return { label, date: date.toISOString().slice(0, 10), day: date.getUTCDate() };
  });
}

export function NexusFamiliarRituals({ state, view, busy, onAttendance, onWish }: Props) {
  const attendance = familiarAttendanceWeek(state);
  const wish = state.rituals.dailyWish;
  const wishCopy = FAMILIAR_WISH_CATALOG[wish.kind];
  const week = weekDates();
  const wasClaimedRef = useRef(attendance.claimedToday);
  const claimedRewardRef = useRef(attendance.nextReward.label);
  const [attendanceConfirmation, setAttendanceConfirmation] = useState<string | null>(null);

  useEffect(() => {
    const wasClaimed = wasClaimedRef.current;
    wasClaimedRef.current = attendance.claimedToday;
    if (wasClaimed || !attendance.claimedToday) return;
    setAttendanceConfirmation(claimedRewardRef.current);
    const timer = window.setTimeout(() => setAttendanceConfirmation(null), 3200);
    return () => window.clearTimeout(timer);
  }, [attendance.claimedToday]);

  function registerAttendance() {
    claimedRewardRef.current = attendance.nextReward.label;
    onAttendance();
  }

  if (view === "attendance") return (
    <section className={styles.scene} data-scene="attendance" aria-labelledby="attendance-title">
      <img className={styles.sceneArt} src="/famiglio/rituals/calendario-presenze-v1.png" alt="Santuario settimanale con sette nicchie luminose e ricompense del Nexus" />
      <div className={styles.sceneShade} />
      <header className={styles.sceneHeader}>
        <p>CALENDARIO DEL LEGAME</p>
        <h2 id="attendance-title">Sette ritorni, una storia che continua.</h2>
        <span>Puoi saltare un giorno senza perdere il Famiglio. Ogni lunedì comincia una nuova sequenza.</span>
      </header>
      <div className={styles.attendanceRail}>
        {week.map((entry, index) => {
          const reward = FAMILIAR_ATTENDANCE_REWARDS[index];
          const claimed = state.rituals.attendanceDates.includes(entry.date);
          const today = entry.date === new Date().toISOString().slice(0, 10);
          return <article key={entry.date} data-claimed={claimed} data-today={today}>
            <span>{entry.label}<b>{entry.day}</b></span>
            <img src={reward.icon} alt="" />
            <small>{reward.label}</small>
            {claimed ? <strong>Ritirata</strong> : today ? <strong>Oggi</strong> : <strong>In attesa</strong>}
          </article>;
        })}
      </div>
      <footer className={styles.sceneAction}>
        <div><span>Prossima ricompensa</span><strong>{attendance.claimedToday ? "Torna domani" : attendance.nextReward.label}</strong></div>
        <button type="button" onClick={registerAttendance} disabled={busy || attendance.claimedToday}>{attendance.claimedToday ? "Presenza registrata" : "Registra il ritorno"}</button>
      </footer>
      {attendanceConfirmation ? <aside className={styles.attendanceConfirmation} role="status" aria-live="polite">
        <span aria-hidden="true">✓</span>
        <div><strong>Presenza registrata</strong><small>{attendanceConfirmation} aggiunta al tuo legame.</small></div>
      </aside> : null}
    </section>
  );

  return (
    <section className={styles.scene} data-scene="wish" aria-labelledby="wish-title">
      <img className={styles.sceneArt} src="/famiglio/rituals/desiderio-giorno-v1.png" alt="Camera dei desideri con sfera luminosa e simboli di cura" />
      <div className={styles.sceneShade} />
      <header className={styles.sceneHeader}>
        <p>DESIDERIO DEL GIORNO</p>
        <h2 id="wish-title">Ascolta ciò che cerca oggi.</h2>
        <span>È un invito, non un obbligo: tutte le altre azioni restano disponibili.</span>
      </header>
      <div className={styles.wishFocus} data-complete={Boolean(wish.fulfilledAt)}>
        <img src={wishCopy.icon} alt="" />
        <div><small>{wish.fulfilledAt ? "DESIDERIO ESAUDITO" : "OGGI VORREBBE"}</small><h3>{wishCopy.title}</h3><p>{wishCopy.description}</p><strong>Ricompensa: 5 monete Nexus e una reazione speciale</strong></div>
        <button type="button" onClick={() => onWish(wish.kind)} disabled={busy || Boolean(wish.fulfilledAt)}>{wish.fulfilledAt ? "Esaudito" : wishCopy.actionLabel}</button>
      </div>
    </section>
  );
}
