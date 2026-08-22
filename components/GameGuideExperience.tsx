"use client";

import Image from "next/image";
import { useState } from "react";
import type { GameGuide } from "@/lib/gameGuides";

type GameGuideExperienceProps = {
  guide: GameGuide;
  context: "vip" | "public";
};

export function GameGuideExperience({ guide, context }: GameGuideExperienceProps) {
  const fallbackSection = {
    id: "all",
    label: "Guida completa",
    summary: "Tutti i capitoli della guida.",
    icon: guide.cover,
    chapterIds: guide.chapters.map((chapter) => chapter.id),
  };
  const sections = guide.sections?.length ? guide.sections : [fallbackSection];
  const [activeSectionId, setActiveSectionId] = useState(sections[0]?.id ?? "all");
  const [activeChapterId, setActiveChapterId] = useState(guide.chapters[0]?.id ?? "");
  const [artworkPage, setArtworkPage] = useState(0);
  const activeSection = sections.find((section) => section.id === activeSectionId) ?? sections[0];
  const visibleChapters = activeSection
    ? activeSection.chapterIds.map((chapterId) => guide.chapters.find((chapter) => chapter.id === chapterId)).filter((chapter): chapter is NonNullable<typeof chapter> => Boolean(chapter))
    : guide.chapters;
  const activeChapter = guide.chapters.find((chapter) => chapter.id === activeChapterId) ?? guide.chapters[0];
  if (!activeChapter) return null;
  const artworkPageSize = 6;
  const artworkPages = Math.max(1, Math.ceil((activeChapter.artworkGallery?.length ?? 0) / artworkPageSize));
  const visibleArtworks = activeChapter.artworkGallery?.slice(artworkPage * artworkPageSize, (artworkPage + 1) * artworkPageSize) ?? [];

  return <article className={`game-guide-experience is-${context} theme-${guide.theme ?? "baldurs-gate"}`}>
    <header className="game-guide-hero">
      <figure>
        <Image src={guide.cover.src} alt={guide.cover.alt} width={1920} height={1080} priority unoptimized />
        <figcaption>{guide.cover.caption}</figcaption>
      </figure>
      <div>
        <p className="eyebrow">{context === "vip" ? "Guida della settimana · accesso anticipato" : "Atlante dei Giochi · guida pubblica"}</p>
        <span>{guide.code} · {guide.versionLabel}</span>
        <h1>{guide.title}</h1>
        <strong>{guide.subtitle}</strong>
        <p>{guide.description}</p>
        <dl>
          <div><dt>Capitoli</dt><dd>{guide.chapters.length}</dd></div>
          <div><dt>Aggiornata</dt><dd>{guide.updatedAt}</dd></div>
          <div><dt>Spoiler</dt><dd>Separati e segnalati</dd></div>
        </dl>
        <a href={guide.storeUrl} target="_blank" rel="noreferrer">{guide.storeLabel} <span aria-hidden="true">↗</span></a>
      </div>
    </header>

    <section className="game-guide-reader" aria-labelledby={`${guide.id}-chapter-title`}>
      <div className="game-guide-switch-heading">
        <div><span>Sfoglia la guida</span><strong>{activeChapter.number} / {String(guide.chapters.length).padStart(2, "0")}</strong></div>
        <p>{activeChapter.spoiler}</p>
      </div>
      {sections.length > 1 ? <>
        <nav className="game-guide-section-tabs" aria-label={`Sezioni della guida di ${guide.game}`}>
          {sections.map((section) => <button
            type="button"
            aria-pressed={section.id === activeSection?.id}
            className={section.id === activeSection?.id ? "is-active" : undefined}
            onClick={() => {
              const firstChapterId = section.chapterIds[0] ?? guide.chapters[0]?.id ?? "";
              setActiveSectionId(section.id);
              setActiveChapterId(firstChapterId);
              setArtworkPage(0);
            }}
            key={section.id}
          >
            <Image src={section.icon.src} alt="" width={220} height={220} loading="lazy" unoptimized />
            <span><strong>{section.label}</strong><small>{section.summary}</small></span>
          </button>)}
        </nav>
        <div className="game-guide-mobile-hint is-sections" aria-hidden="true"><span>←</span> Scorri per scegliere una sezione <span>→</span></div>
      </> : null}
      <nav className="game-guide-tabs" role="tablist" aria-label={`Capitoli della guida di ${guide.game}`}>
        {visibleChapters.map((chapter) => <button
          type="button"
          role="tab"
          aria-selected={chapter.id === activeChapter.id}
          aria-controls={`${guide.id}-${chapter.id}-panel`}
          className={chapter.id === activeChapter.id ? "is-active" : undefined}
          onClick={() => { setActiveChapterId(chapter.id); setArtworkPage(0); }}
          key={chapter.id}
        ><span>{chapter.number}</span><strong>{chapter.label}</strong></button>)}
      </nav>
      <div className="game-guide-mobile-hint is-chapters" aria-hidden="true"><span>←</span> Scorri per scegliere un capitolo <span>→</span></div>

      <section className="game-guide-chapter" role="tabpanel" id={`${guide.id}-${activeChapter.id}-panel`} aria-labelledby={`${guide.id}-chapter-title`}>
        <header>
          <p>{activeChapter.number} · {activeChapter.label}</p>
          <h2 id={`${guide.id}-chapter-title`}>{activeChapter.title}</h2>
          <div className="game-guide-chapter-meta"><strong>{activeChapter.spoiler}</strong><span>{activeChapter.estimatedRead} di lettura</span></div>
          <span>{activeChapter.introduction}</span>
        </header>

        <div className={`game-guide-gallery is-${activeChapter.id}`}>
          {activeChapter.images.map((image, index) => <figure className={index === 0 ? "is-primary" : undefined} key={`${activeChapter.id}-${image.src}`}>
            <div><Image src={image.src} alt={image.alt} width={1920} height={1080} loading="lazy" unoptimized /></div>
            <figcaption>{image.caption}</figcaption>
          </figure>)}
        </div>

        {activeChapter.artworkGallery?.length ? <section className="game-guide-artwork-atlas" aria-labelledby={`${guide.id}-artwork-atlas-title`}>
          <header>
            <div><small>Archivio del museo</small><h3 id={`${guide.id}-artwork-atlas-title`}>Originali e falsi, tavola per tavola</h3></div>
            <strong>{String(artworkPage + 1).padStart(2, "0")} / {String(artworkPages).padStart(2, "0")}</strong>
          </header>
          <p className="game-guide-artwork-hint"><span aria-hidden="true">←</span> Usa i tasti per sfogliare le 42 tavole complete <span aria-hidden="true">→</span></p>
          <div className="game-guide-artwork-grid">
            {visibleArtworks.map((image) => <figure key={image.src}>
              <Image src={image.src} alt={image.alt} width={1280} height={1080} loading="lazy" unoptimized />
              <figcaption>{image.caption}</figcaption>
            </figure>)}
          </div>
          <nav aria-label="Pagine delle opere del museo">
            <button type="button" onClick={() => setArtworkPage((page) => Math.max(0, page - 1))} disabled={artworkPage === 0}>← Precedenti</button>
            <span>Pagina {artworkPage + 1} di {artworkPages}</span>
            <button type="button" onClick={() => setArtworkPage((page) => Math.min(artworkPages - 1, page + 1))} disabled={artworkPage + 1 === artworkPages}>Successive →</button>
          </nav>
        </section> : null}

        <div className="game-guide-blocks">
          {activeChapter.blocks.map((block, index) => <section className="game-guide-note" key={block.title}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div>{block.label ? <small>{block.label}</small> : null}<h3>{block.title}</h3><p>{block.text}</p>
              {block.steps ? <ol className="game-guide-steps">{block.steps.map((step) => <li key={step}><span>{step}</span></li>)}</ol> : null}
              {block.tips ? <ul>{block.tips.map((tip) => <li key={tip}>{tip}</li>)}</ul> : null}
              {block.mistakes ? <div className="game-guide-mistakes"><strong>Errori da evitare</strong><ul>{block.mistakes.map((mistake) => <li key={mistake}>{mistake}</li>)}</ul></div> : null}
              {block.table ? <div className="game-guide-table-wrap"><table><thead><tr>{block.table.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{block.table.rows.map((row) => <tr key={row.join("-")}>{row.map((cell, cellIndex) => <td key={`${cellIndex}-${cell}`}>{cell}</td>)}</tr>)}</tbody></table></div> : null}
              {block.scenarios ? <div className="game-guide-scenarios">{block.scenarios.map((scenario) => <article key={scenario.problem}><strong>{scenario.problem}</strong><p>{scenario.answer}</p></article>)}</div> : null}
              {block.warning ? <aside><strong>Avviso</strong><p>{block.warning}</p></aside> : null}
              {block.spoilerDetails ? <details className="game-guide-spoiler"><summary>{block.spoilerDetails.summary}</summary><p>{block.spoilerDetails.text}</p></details> : null}
            </div>
          </section>)}
        </div>
      </section>
    </section>

    <footer className="game-guide-sources">
      <strong>Fonti e aggiornamenti</strong>
      <p>La guida distingue i consigli editoriali LoreWise dalle informazioni ufficiali sul gioco.</p>
      <div>{guide.sources.map((source) => <a href={source.href} target="_blank" rel="noreferrer" key={source.href}>{source.label} <span aria-hidden="true">↗</span></a>)}</div>
    </footer>
  </article>;
}
