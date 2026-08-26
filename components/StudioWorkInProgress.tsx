"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { obsessionWorkInProgress } from "@/lib/studioWorkInProgress";

const SEQUENCE_INTERVAL_MS = 4200;

export function StudioWorkInProgress() {
  const project = obsessionWorkInProgress;
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const activeStage = project.stages[activeIndex];

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => setPrefersReducedMotion(mediaQuery.matches);
    updateMotionPreference();
    mediaQuery.addEventListener("change", updateMotionPreference);
    return () => mediaQuery.removeEventListener("change", updateMotionPreference);
  }, []);

  useEffect(() => {
    if (!isPlaying || prefersReducedMotion) return;
    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % project.stages.length);
    }, SEQUENCE_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [isPlaying, prefersReducedMotion, project.stages.length]);

  const selectStage = (index: number) => {
    setActiveIndex(index);
    setIsPlaying(false);
  };

  const sequenceStyle = {
    "--stage-progress": `${((activeIndex + 1) / project.stages.length) * 100}%`,
  } as CSSProperties;

  return <section className={`studio-work-progress${isPlaying && !prefersReducedMotion ? " is-playing" : ""}`} aria-labelledby="studio-work-progress-title">
    <div className="shell">
      <header className="studio-work-progress-heading">
        <div><p className="eyebrow">Lavori in progress · GiWise Studio</p><h2 id="studio-work-progress-title">Entra nel disegno. Guarda cosa emerge.</h2></div>
        <div><strong>{project.status}</strong><span>{project.inspiration}</span></div>
      </header>

      <div className="studio-work-progress-intro">
        <div><small>{project.code}</small><h3>{project.title}</h3><p>{project.introduction}</p></div>
        <p>{project.direction}</p>
      </div>

      <div className="studio-work-progress-theater" style={sequenceStyle}>
        <div className="studio-work-progress-visual">
          <span className="studio-work-progress-whisper" aria-hidden="true">OBSESSION</span>
          <figure key={activeStage.number}>
            <Image
              src={activeStage.image}
              alt={activeStage.imageAlt}
              width={activeStage.width}
              height={activeStage.height}
              sizes="(max-width: 760px) 92vw, (max-width: 1100px) 58vw, 52vw"
              priority={activeIndex === 0}
              unoptimized
            />
            <figcaption>{activeStage.number} · {activeStage.label}</figcaption>
          </figure>
          <div className="studio-work-progress-scan" aria-hidden="true" />
        </div>

        <div className="studio-work-progress-story" aria-live="polite">
          <span>Fase {activeStage.number} / {project.stages.length.toString().padStart(2, "0")}</span>
          <small>{activeStage.label}</small>
          <h4>{activeStage.title}</h4>
          <p>{activeStage.description}</p>
          <strong>{activeIndex === project.stages.length - 1 ? "Ultima fase disponibile" : "Il disegno continua"}</strong>
        </div>
      </div>

      <div className="studio-work-progress-console">
        <div className="studio-work-progress-timeline" role="group" aria-label="Scegli una fase del disegno">
          {project.stages.map((stage, index) => <button
            type="button"
            className={index === activeIndex ? "is-active" : undefined}
            aria-pressed={index === activeIndex}
            aria-label={`Mostra fase ${stage.number}: ${stage.title}`}
            onClick={() => selectStage(index)}
            key={stage.number}
          >
            <span>{stage.number}</span>
            <small>{stage.label}</small>
          </button>)}
        </div>
        <button
          type="button"
          className="studio-work-progress-play"
          aria-pressed={isPlaying && !prefersReducedMotion}
          disabled={prefersReducedMotion}
          onClick={() => setIsPlaying((current) => !current)}
        >
          <span aria-hidden="true">{isPlaying && !prefersReducedMotion ? "Ⅱ" : "▶"}</span>
          {prefersReducedMotion ? "Sequenza automatica disattivata" : isPlaying ? "Metti in pausa" : "Avvia la sequenza"}
        </button>
      </div>

      <aside className="studio-work-progress-unfinished" aria-label="Stato del progetto e iscrizione alle novità">
        <div><span>Opera non ancora terminata</span><strong>La presenza continua a prendere forma.</strong><p>Questo è un lavoro in corso: nuove fasi verranno aggiunte mentre il disegno procede. Crea o accedi al tuo LoreWise ID e attiva “Novità di GiWise Studio” per non perdere i prossimi aggiornamenti.</p></div>
        <Link href="/account?modalita=registrazione#account-signin-title">Iscriviti alle novità <span aria-hidden="true">→</span></Link>
      </aside>

      <p className="studio-work-progress-hint">Seleziona una fase oppure lascia scorrere la trasformazione.</p>
      <p className="studio-work-progress-attribution">{project.attribution}</p>
    </div>
  </section>;
}
