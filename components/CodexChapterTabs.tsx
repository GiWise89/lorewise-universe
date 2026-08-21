"use client";

import { Children, type KeyboardEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";

type ChapterDefinition = { id: string; title: string };

export function CodexChapterTabs({ chapters, children }: { chapters: ChapterDefinition[]; children: ReactNode }) {
  const panels = useMemo(() => Children.toArray(children), [children]);
  const [activeId, setActiveId] = useState(chapters[0]?.id ?? "");
  const [spoilerPreference, setSpoilerPreference] = useState<"protected" | "open">("protected");
  const dossierRef = useRef<HTMLDivElement>(null);
  const panelsRef = useRef<HTMLDivElement>(null);
  const activeIndex = Math.max(0, chapters.findIndex((chapter) => chapter.id === activeId));

  useEffect(() => {
    const selectHashChapter = () => {
      const hash = window.location.hash.slice(1);
      if (chapters.some((chapter) => chapter.id === hash)) setActiveId(hash);
    };
    selectHashChapter();
    window.addEventListener("hashchange", selectHashChapter);
    return () => window.removeEventListener("hashchange", selectHashChapter);
  }, [chapters]);

  useEffect(() => {
    let active = true;
    const stored = window.localStorage.getItem("lorewise-codex-spoilers");
    const restoreTimer = window.setTimeout(() => {
      if (active && (stored === "open" || stored === "protected")) setSpoilerPreference(stored);
    }, 0);
    void fetch("/api/account/profile", { headers: { accept: "application/json" } })
      .then(async (response) => {
        if (!response.ok) return;
        const body = await response.json() as { profile?: { codexSpoilerPreference?: string } };
        const preference = body.profile?.codexSpoilerPreference;
        if (!active || (preference !== "open" && preference !== "protected")) return;
        setSpoilerPreference(preference);
        window.localStorage.setItem("lorewise-codex-spoilers", preference);
      })
      .catch(() => undefined);
    return () => { active = false; window.clearTimeout(restoreTimer); };
  }, []);

  useEffect(() => {
    dossierRef.current?.querySelectorAll<HTMLDetailsElement>(".codex-chronology").forEach((details) => {
      details.open = spoilerPreference === "open";
    });
  }, [activeId, spoilerPreference]);

  const updateSpoilerPreference = (preference: "protected" | "open") => {
    setSpoilerPreference(preference);
    window.localStorage.setItem("lorewise-codex-spoilers", preference);
    void fetch("/api/account/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", accept: "application/json" },
      body: JSON.stringify({ codexSpoilerPreference: preference }),
    }).catch(() => undefined);
  };

  const selectChapter = (id: string) => {
    setActiveId(id);
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${id}`);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        panelsRef.current?.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
          block: "start",
        });
      });
    });
  };

  const handleChapterKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex = index;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (index + 1) % chapters.length;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (index - 1 + chapters.length) % chapters.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = chapters.length - 1;
    else return;

    event.preventDefault();
    const nextChapter = chapters[nextIndex];
    if (!nextChapter) return;
    selectChapter(nextChapter.id);
    document.getElementById(`codex-tab-${nextChapter.id}`)?.focus();
  };

  return <div className="codex-dossier-tabs" ref={dossierRef}>
    <div className="codex-spoiler-control" role="group" aria-label="Preferenza spoiler del LoreWise Codex">
      <span><small>Lettura del dossier</small><strong>{spoilerPreference === "protected" ? "Spoiler protetti" : "Cronologie aperte"}</strong></span>
      <button type="button" aria-pressed={spoilerPreference === "protected"} onClick={() => updateSpoilerPreference("protected")}>Proteggi</button>
      <button type="button" aria-pressed={spoilerPreference === "open"} onClick={() => updateSpoilerPreference("open")}>Mostra</button>
    </div>
    <nav className="codex-chapter-index" aria-label="Capitoli della scheda" role="tablist">
      {chapters.map((chapter, index) => <button id={`codex-tab-${chapter.id}`} type="button" role="tab" className={activeId === chapter.id ? "is-active" : ""} aria-selected={activeId === chapter.id} aria-controls={`codex-panel-${chapter.id}`} tabIndex={activeId === chapter.id ? 0 : -1} onClick={() => selectChapter(chapter.id)} onKeyDown={(event) => handleChapterKeyDown(event, index)} key={chapter.id}>
        <Image src="/codex/ornaments/chapter-button-plate-v1.webp" alt="" fill sizes="190px" style={{ objectFit: "fill" }} unoptimized />
        <span>{String(index + 1).padStart(2, "0")}</span><strong>{chapter.title}</strong>
      </button>)}
    </nav>
    <div className="codex-chapter-panels" ref={panelsRef}>
      {panels.map((panel, index) => {
        const chapter = chapters[index];
        return <div id={chapter ? `codex-panel-${chapter.id}` : undefined} className="codex-chapter-panel" role="tabpanel" aria-labelledby={chapter ? `codex-tab-${chapter.id}` : undefined} tabIndex={0} hidden={index !== activeIndex} key={chapter?.id ?? index}>{panel}</div>;
      })}
    </div>
    <nav className="codex-chapter-paging" aria-label="Navigazione tra i capitoli">
      <button type="button" disabled={activeIndex === 0} onClick={() => selectChapter(chapters[activeIndex - 1].id)}>← Capitolo precedente</button>
      <span>{String(activeIndex + 1).padStart(2, "0")} / {String(chapters.length).padStart(2, "0")}</span>
      <button type="button" disabled={activeIndex === chapters.length - 1} onClick={() => selectChapter(chapters[activeIndex + 1].id)}>Capitolo successivo →</button>
    </nav>
  </div>;
}
