"use client";
import { useEffect, useRef } from "react";
import styles from "./FamiglioDailyMiniGame.module.css";

export function FamiglioPaceNotice({ elapsed, active, sound, message = "" }: {
  elapsed: number; active: boolean; sound: (kind: "level") => void; message?: string;
}) {
  const stage = Math.floor(elapsed / 10000);
  const announced = useRef(0);
  useEffect(() => {
    if (active && stage > announced.current) { announced.current = stage; sound("level"); }
  }, [active, stage, sound]);
  const rising = active && stage > 0 && elapsed % 10000 < 1600;
  return <div className={styles.eventNotice} data-rising={rising} role="status" aria-live="polite">
    {rising ? `Ritmo ${stage + 1} · Si accelera!` : message}
  </div>;
}
