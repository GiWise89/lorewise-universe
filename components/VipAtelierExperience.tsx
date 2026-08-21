"use client";

import { useMemo, useState } from "react";
import type { VIP_ATELIER } from "@/data/vip-atelier";

type AtelierPayload = typeof VIP_ATELIER;
type AtelierSection = "processes" | "notebook" | "studies";

const mediaUrl = (mediaId: string) => `/api/vip-media?asset=${encodeURIComponent(mediaId)}`;

export function VipAtelierExperience({ atelier }: { atelier: AtelierPayload }) {
  const [section, setSection] = useState<AtelierSection>("processes");
  const [processIndex, setProcessIndex] = useState(0);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const process = atelier.processes[processIndex];
  const phase = process.phases[phaseIndex];
  const heroMediaId = atelier.processes[0].phases.at(-1)?.mediaId ?? atelier.processes[0].phases[0].mediaId;

  const phaseProgress = useMemo(
    () => `${String(phaseIndex + 1).padStart(2, "0")} / ${String(process.phases.length).padStart(2, "0")}`,
    [phaseIndex, process.phases.length],
  );

  function selectProcess(index: number) {
    setProcessIndex(index);
    setPhaseIndex(0);
  }

  return (
    <section className="vip-atelier" id="atelier">
      <header className="vip-atelier-hero">
        <img src={mediaUrl(heroMediaId)} alt="" aria-hidden="true" width="1600" height="1200" decoding="async" fetchPriority="high" />
        <div className="vip-atelier-hero-shade" />
        <div className="shell">
          <p className="eyebrow">{atelier.eyebrow}</p>
          <h1>{atelier.title}</h1>
          <p className="vip-atelier-lead">{atelier.subtitle}</p>
          <p className="vip-atelier-intro">{atelier.introduction}</p>
          <span>{atelier.code}</span>
        </div>
      </header>

      <div className="vip-atelier-body shell">
        <nav className="vip-atelier-switch" aria-label="Sezioni Atelier VIP">
          {([
            ["processes", "01", "Processi creativi", "Due opere, otto passaggi"],
            ["notebook", "02", "Taccuino inedito", "Visioni, prove e trasformazioni"],
            ["studies", "03", "Studi e ritratti", "Il carattere dietro il volto"],
          ] as const).map(([id, number, title, note]) => (
            <button key={id} type="button" className={section === id ? "is-selected" : ""} onClick={() => setSection(id)}>
              <span>{number}</span>
              <strong>{title}</strong>
              <small>{note}</small>
            </button>
          ))}
        </nav>

        {section === "processes" ? (
          <div className="vip-atelier-processes">
            <div className="vip-atelier-process-tabs" role="tablist" aria-label="Dossier di processo">
              {atelier.processes.map((item, index) => (
                <button key={item.id} type="button" role="tab" aria-selected={processIndex === index} className={processIndex === index ? "is-selected" : ""} onClick={() => selectProcess(index)}>
                  <small>Dossier {String(index + 1).padStart(2, "0")}</small>
                  <strong>{item.title}</strong>
                </button>
              ))}
            </div>

            <article className="vip-atelier-process">
              <div className="vip-atelier-process-copy">
                <p className="eyebrow">{process.kicker}</p>
                <h2>{process.title}</h2>
                <p>{process.summary}</p>
              </div>

              <div className="vip-atelier-stage">
                <figure>
                  <img src={mediaUrl(phase.mediaId)} alt={phase.title} width="1600" height="1200" decoding="async" />
                  <figcaption>{phaseProgress}</figcaption>
                </figure>
                <div className="vip-atelier-stage-story">
                  <span>{phase.label}</span>
                  <h3>{phase.title}</h3>
                  <p>{phase.story}</p>
                  <blockquote>{process.closing}</blockquote>
                </div>
              </div>

              <div className="vip-atelier-timeline" aria-label={`Fasi di ${process.title}`}>
                {process.phases.map((item, index) => (
                  <button key={item.mediaId} type="button" className={phaseIndex === index ? "is-selected" : ""} onClick={() => setPhaseIndex(index)} aria-pressed={phaseIndex === index}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <strong>{item.title}</strong>
                  </button>
                ))}
              </div>
            </article>
          </div>
        ) : null}

        {section === "notebook" ? (
          <div className="vip-atelier-notebook">
            <header>
              <p className="eyebrow">Archivio non pubblico</p>
              <h2>Il taccuino resta aperto.</h2>
              <p>Non tutto nasce per diventare una collezione. Alcune immagini servono a trattenere un pensiero prima che cambi forma.</p>
            </header>
            {atelier.notebook.map((entry) => (
              <article key={entry.id} className={`vip-atelier-note vip-atelier-note-${entry.mediaIds.length} vip-atelier-note-${entry.id}`}>
                <div className="vip-atelier-note-media">
                  {entry.mediaIds.map((mediaId, index) => (
                    <figure key={mediaId}>
                      <img src={mediaUrl(mediaId)} alt={`${entry.title}${entry.mediaIds.length > 1 ? `, passaggio ${index + 1}` : ""}`} width="1200" height="1500" loading="lazy" decoding="async" />
                      {entry.mediaIds.length > 1 ? <figcaption>{index === 0 ? "Prima linea" : "Forma compiuta"}</figcaption> : null}
                    </figure>
                  ))}
                </div>
                <div>
                  <span>{entry.index} · {entry.state}</span>
                  <h3>{entry.title}</h3>
                  <p>{entry.story}</p>
                </div>
              </article>
            ))}
          </div>
        ) : null}

        {section === "studies" ? (
          <div className="vip-atelier-studies">
            <header>
              <p className="eyebrow">Quaderno dei volti</p>
              <h2>Prima la presenza. Poi la somiglianza.</h2>
            </header>
            {atelier.studies.map((study, index) => (
              <article key={study.id} className={index % 2 ? "is-reversed" : ""}>
                <figure><img src={mediaUrl(study.mediaId)} alt={study.title} width="1200" height="1500" loading="lazy" decoding="async" /></figure>
                <div>
                  <span>{study.index}</span>
                  <h3>{study.title}</h3>
                  <p>{study.story}</p>
                </div>
              </article>
            ))}
            <p className="vip-atelier-rights">{atelier.rightsNote}</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
