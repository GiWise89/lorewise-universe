"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { codexThumbnailSrc, type CodexIndexEntry } from "@/lib/codexIndex";
import { CodexBookmarkButton } from "@/components/CodexBookmarkButton";

export function CodexIndex({ entries, eyebrow = "Indice documentato", title = "Personaggi registrati.", description }: { entries: CodexIndexEntry[]; eyebrow?: string; title?: string; description?: string }) {
  const pageSize = 12;
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [universe, setUniverse] = useState("all");
  const [status, setStatus] = useState("all");
  const [initial, setInitial] = useState("all");
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const [urlReady, setUrlReady] = useState(false);
  const normalizedQuery = query.trim().toLocaleLowerCase("it");
  const categories = useMemo(() => [...new Set(entries.flatMap((entry) => entry.categories))].sort(), [entries]);
  const universes = useMemo(() => [...new Set(entries.map((entry) => entry.universe))].sort(), [entries]);
  const statuses = useMemo(() => [...new Set(entries.map((entry) => entry.statusLabel))].sort(), [entries]);

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      const parameters = new URLSearchParams(window.location.search);
      const requestedCategory = parameters.get("categoria");
      const requestedUniverse = parameters.get("universo");
      const requestedInitial = parameters.get("iniziale");
      const requestedStatus = parameters.get("stato");
      setQuery(parameters.get("q") || "");
      setCategory(requestedCategory && categories.includes(requestedCategory) ? requestedCategory : "all");
      setUniverse(requestedUniverse && universes.includes(requestedUniverse) ? requestedUniverse : "all");
      setStatus(requestedStatus && statuses.includes(requestedStatus) ? requestedStatus : "all");
      setInitial(requestedInitial && /^[A-Z#]$/.test(requestedInitial) ? requestedInitial : "all");
      setUrlReady(true);
    }, 0);
    return () => window.clearTimeout(restoreTimer);
  }, [categories, statuses, universes]);

  useEffect(() => {
    if (!urlReady) return;
    const parameters = new URLSearchParams();
    if (query) parameters.set("q", query);
    if (category !== "all") parameters.set("categoria", category);
    if (universe !== "all") parameters.set("universo", universe);
    if (status !== "all") parameters.set("stato", status);
    if (initial !== "all") parameters.set("iniziale", initial);
    const suffix = parameters.size ? `?${parameters.toString()}` : "";
    window.history.replaceState(null, "", `${window.location.pathname}${suffix}${window.location.hash}`);
  }, [category, initial, query, status, universe, urlReady]);
  const matchedEntries = useMemo(() => {
    return entries
      .filter((entry) => {
        const matchesQuery = !normalizedQuery || entry.searchTerms.some((term) => term.toLocaleLowerCase("it").includes(normalizedQuery));
        const matchesCategory = category === "all" || entry.categories.includes(category);
        const matchesUniverse = universe === "all" || entry.universe === universe;
        const matchesStatus = status === "all" || entry.statusLabel === status;
        return matchesQuery && matchesCategory && matchesUniverse && matchesStatus;
      })
      .sort((first, second) => first.displayTitle.localeCompare(second.displayTitle, "it", { sensitivity: "base" }));
  }, [category, entries, normalizedQuery, status, universe]);

  const alphabet = useMemo(() => {
    const counts = new Map<string, number>();
    matchedEntries.forEach((entry) => {
      const letter = entry.displayTitle.normalize("NFD").replace(/[\u0300-\u036f]/g, "").match(/[A-Z]/i)?.[0]?.toLocaleUpperCase("it") || "#";
      counts.set(letter, (counts.get(letter) || 0) + 1);
    });
    return [...counts.entries()].sort(([first], [second]) => first.localeCompare(second, "it"));
  }, [matchedEntries]);

  const filteredEntries = useMemo(() => {
    if (initial === "all") return matchedEntries;
    return matchedEntries.filter((entry) => {
      const letter = entry.displayTitle.normalize("NFD").replace(/[\u0300-\u036f]/g, "").match(/[A-Z]/i)?.[0]?.toLocaleUpperCase("it") || "#";
      return letter === initial;
    });
  }, [initial, matchedEntries]);

  const resetFilters = () => {
    setQuery("");
    setCategory("all");
    setUniverse("all");
    setStatus("all");
    setInitial("all");
    setVisibleCount(pageSize);
  };
  const visibleEntries = filteredEntries.slice(0, visibleCount);

  return <section className="codex-index" aria-labelledby="codex-index-title">
    <header className="codex-index-heading">
      <div><p className="eyebrow">{eyebrow}</p><h2 id="codex-index-title">{title}</h2></div>
      <p>{description || <>{entries.length} {entries.length === 1 ? "dossier completo" : "dossier completi"} · fonti primarie e lore originale dichiarata restano sempre distinguibili.</>}</p>
    </header>
    <div className="codex-search">
      <label htmlFor="codex-search">Cerca nel LoreWise Codex</label>
      <input id="codex-search" type="search" value={query} onChange={(event) => { setQuery(event.target.value); setInitial("all"); setVisibleCount(pageSize); }} placeholder="Nome, titolo, universo, fazione…" />
      <span aria-live="polite">{filteredEntries.length} {filteredEntries.length === 1 ? "risultato" : "risultati"}</span>
    </div>
    <div className="codex-filter-ledger" aria-label="Filtri del LoreWise Codex">
      <label><span>Categoria</span><select value={category} onChange={(event) => { setCategory(event.target.value); setInitial("all"); setVisibleCount(pageSize); }}><option value="all">Tutte le categorie</option>{categories.map((item) => <option value={item} key={item}>{item}</option>)}</select></label>
      <label><span>Universo</span><select value={universe} onChange={(event) => { setUniverse(event.target.value); setInitial("all"); setVisibleCount(pageSize); }}><option value="all">Tutti gli universi</option>{universes.map((item) => <option value={item} key={item}>{item}</option>)}</select></label>
      <label><span>Stato editoriale</span><select value={status} onChange={(event) => { setStatus(event.target.value); setInitial("all"); setVisibleCount(pageSize); }}><option value="all">Tutti gli stati</option>{statuses.map((item) => <option value={item} key={item}>{item}</option>)}</select></label>
      <button type="button" onClick={resetFilters} disabled={!query && category === "all" && universe === "all" && status === "all" && initial === "all"}>Azzera ricerca e filtri</button>
    </div>
    <nav className="codex-alphabet" aria-label="Indice alfabetico dei dossier">
      <div className="codex-alphabet-heading"><span>Indice alfabetico</span><strong>{initial === "all" ? "Tutti i nomi" : `Lettera ${initial}`}</strong></div>
      <div className="codex-alphabet-letters">
        <button type="button" className={initial === "all" ? "is-active" : ""} aria-pressed={initial === "all"} onClick={() => { setInitial("all"); setVisibleCount(pageSize); }}>Tutti <small>{matchedEntries.length}</small></button>
        {alphabet.map(([letter, count]) => <button type="button" className={initial === letter ? "is-active" : ""} aria-pressed={initial === letter} onClick={() => { setInitial(letter); setVisibleCount(pageSize); }} key={letter}>{letter}<small>{count}</small></button>)}
      </div>
    </nav>
    <div className="codex-results">
      {visibleEntries.map((entry) => <article className="codex-result-row" key={entry.slug}>
        <Link href={`/enciclopedia/${entry.slug}`} className="codex-result">
          <span className="codex-result-portrait"><Image src={codexThumbnailSrc(entry.imageSrc)} alt="" width={entry.imageWidth} height={entry.imageHeight} sizes="(max-width: 560px) 88px, 152px" unoptimized /></span>
          <span className="codex-result-copy"><small>{entry.categories.join(" · ")} · {entry.descriptor}</small><strong>{entry.displayTitle}</strong><em>{entry.universe}</em><span>{entry.summary}</span></span>
          <span className="codex-result-status"><b>{entry.statusLabel}</b><span>Apri il dossier →</span></span>
        </Link>
        <CodexBookmarkButton slug={entry.slug} />
      </article>)}
      {filteredEntries.length === 0 && <p className="codex-empty">Nessuna voce corrisponde alla ricerca e ai filtri selezionati.</p>}
      {visibleCount < filteredEntries.length && <button className="codex-load-more" type="button" onClick={() => setVisibleCount((count) => count + pageSize)}>Mostra altri dossier</button>}
    </div>
  </section>;
}
