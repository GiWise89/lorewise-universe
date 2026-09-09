"use client";

import { useEffect, useState } from "react";
import { familiarGuide, type FamiliarGuideSection } from "@/lib/famiglioTutorial";
import styles from "./FamiglioGuideOverlay.module.css";

const SEEN_GUIDES_KEY = "lorewise.famiglio-guides.v1";

function readSeenGuides() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(SEEN_GUIDES_KEY) ?? "[]");
    return new Set(Array.isArray(parsed) ? parsed.filter((entry): entry is FamiliarGuideSection => typeof entry === "string") : []);
  } catch {
    return new Set<FamiliarGuideSection>();
  }
}

export function FamiglioGuideOverlay({ section, ready }: { section: FamiliarGuideSection; ready: boolean }) {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);
  const guide = familiarGuide(section);

  useEffect(() => {
    if (!ready) return;
    const params = new URLSearchParams(window.location.search);
    const preview = params.has("preview");
    const forceTutorial = params.get("tutorial") === "on";
    if (preview && !forceTutorial) return;
    if (!forceTutorial && readSeenGuides().has(section)) return;
    if (!forceTutorial) {
      const seen = readSeenGuides();
      seen.add(section);
      try { window.localStorage.setItem(SEEN_GUIDES_KEY, JSON.stringify([...seen])); } catch { /* La guida resta riapribile manualmente. */ }
    }
    const request = window.requestAnimationFrame(() => {
      setPage(0);
      setOpen(true);
    });
    return () => window.cancelAnimationFrame(request);
  }, [ready, section]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const rememberAndClose = () => {
    const seen = readSeenGuides();
    seen.add(section);
    try { window.localStorage.setItem(SEEN_GUIDES_KEY, JSON.stringify([...seen])); } catch { /* La guida resta comunque utilizzabile nella sessione. */ }
    setOpen(false);
  };

  const content = open ? (
    <div className={styles.backdrop} role="presentation">
      <section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="famiglio-guide-title">
        <header className={styles.header}>
          <span className={styles.icon} style={{ backgroundImage: `url(${guide.iconSrc})` }} aria-hidden="true" />
          <div><small>{guide.eyebrow}</small><strong id="famiglio-guide-title">{guide.label}</strong></div>
          <button type="button" onClick={rememberAndClose} aria-label="Chiudi e non mostrare più automaticamente">Chiudi</button>
        </header>
        <div className={styles.stepCount}>Passaggio {page + 1} di {guide.pages.length}</div>
        <article className={styles.page}>
          <h2>{guide.pages[page].title}</h2>
          <p>{guide.pages[page].summary}</p>
          <ul>{guide.pages[page].points.map((point) => <li key={point}>{point}</li>)}</ul>
        </article>
        <footer className={styles.footer}>
          <button type="button" disabled={page === 0} onClick={() => setPage((current) => Math.max(0, current - 1))}>Indietro</button>
          <div className={styles.dots} aria-label={`Passaggio ${page + 1} di ${guide.pages.length}`}>{guide.pages.map((entry, index) => <span key={entry.title} data-current={index === page} />)}</div>
          {page + 1 < guide.pages.length
            ? <button type="button" onClick={() => setPage((current) => Math.min(guide.pages.length - 1, current + 1))}>Avanti</button>
            : <button type="button" onClick={rememberAndClose}>Ho capito</button>}
        </footer>
      </section>
    </div>
  ) : null;

  return <>
    <button className={styles.launcher} type="button" onClick={() => { setPage(0); setOpen(true); }} aria-label={`Apri la guida: ${guide.label}`}><span aria-hidden="true" /><b>Guida</b></button>
    {content}
  </>;
}
