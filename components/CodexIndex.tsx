"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { codexThumbnailSrc, type CodexIndexEntry } from "@/lib/codexIndex";
import { CodexBookmarkButton } from "@/components/CodexBookmarkButton";

type CodexScope = "all" | CodexIndexEntry["origin"];
type CodexFacets = { categories: string[]; universes: string[]; statuses: string[]; alphabet: Array<[string, number]> };
type Props = { entries: CodexIndexEntry[]; totalEntries: number; originalTotal: number; documentedTotal: number; facets: CodexFacets; eyebrow?: string; title?: string; description?: string };

export function CodexIndex({ entries, totalEntries, originalTotal, documentedTotal, facets, eyebrow = "Indice completo", title = "Trova il tuo prossimo dossier.", description }: Props) {
  const pageSize = 6;
  const [catalogEntries, setCatalogEntries] = useState(entries);
  const [catalogLoaded, setCatalogLoaded] = useState(entries.length >= totalEntries);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState("");
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<CodexScope>("all");
  const [category, setCategory] = useState("all");
  const [universe, setUniverse] = useState("all");
  const [status, setStatus] = useState("all");
  const [initial, setInitial] = useState("all");
  const [page, setPage] = useState(1);
  const [urlReady, setUrlReady] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const catalogLoadedRef = useRef(entries.length >= totalEntries);
  const catalogRequestRef = useRef<Promise<boolean> | null>(null);

  const loadCatalog = useCallback(async () => {
    if (catalogLoadedRef.current) return true;
    if (catalogRequestRef.current) return catalogRequestRef.current;
    catalogRequestRef.current = (async () => {
      setCatalogLoading(true);
      setCatalogError("");
      try {
        const response = await fetch("/api/codex-index");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = await response.json() as { entries?: CodexIndexEntry[] };
        if (!Array.isArray(payload.entries)) throw new Error("Risposta non valida");
        setCatalogEntries(payload.entries);
        catalogLoadedRef.current = true;
        setCatalogLoaded(true);
        return true;
      } catch {
        setCatalogError("Non è stato possibile caricare l’indice completo. Riprova.");
        return false;
      } finally {
        setCatalogLoading(false);
        catalogRequestRef.current = null;
      }
    })();
    return catalogRequestRef.current;
  }, []);

  useEffect(() => {
    const parameters = new URLSearchParams(window.location.search);
    const hasCriteria = ["q", "categoria", "universo", "iniziale", "stato", "archivio"].some((key) => parameters.has(key));
    void (async () => {
      if (hasCriteria) await loadCatalog();
      const requestedCategory = parameters.get("categoria");
      const requestedUniverse = parameters.get("universo");
      const requestedInitial = parameters.get("iniziale");
      const requestedStatus = parameters.get("stato");
      const requestedScope = parameters.get("archivio");
      setQuery(parameters.get("q") || "");
      setScope(requestedScope === "originali" ? "giwise-original" : requestedScope === "documentati" ? "documented-third-party" : "all");
      setCategory(requestedCategory && facets.categories.includes(requestedCategory) ? requestedCategory : "all");
      setUniverse(requestedUniverse && facets.universes.includes(requestedUniverse) ? requestedUniverse : "all");
      setStatus(requestedStatus && facets.statuses.includes(requestedStatus) ? requestedStatus : "all");
      setInitial(requestedInitial && /^[A-Z#]$/.test(requestedInitial) ? requestedInitial : "all");
      setUrlReady(true);
    })();
  }, [facets, loadCatalog]);

  useEffect(() => {
    if (!urlReady) return;
    const parameters = new URLSearchParams();
    if (query) parameters.set("q", query);
    if (scope !== "all") parameters.set("archivio", scope === "giwise-original" ? "originali" : "documentati");
    if (category !== "all") parameters.set("categoria", category);
    if (universe !== "all") parameters.set("universo", universe);
    if (status !== "all") parameters.set("stato", status);
    if (initial !== "all") parameters.set("iniziale", initial);
    const suffix = parameters.size ? `?${parameters.toString()}` : "";
    window.history.replaceState(null, "", `${window.location.pathname}${suffix}${window.location.hash}`);
  }, [category, initial, query, scope, status, universe, urlReady]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target?.matches("input, textarea, select, [contenteditable='true']");
      if (event.key === "/" && !event.altKey && !event.ctrlKey && !event.metaKey && !typing) { event.preventDefault(); searchInputRef.current?.focus(); void loadCatalog(); }
      if (event.key === "Escape" && document.activeElement === searchInputRef.current && query) { setQuery(""); setInitial("all"); setPage(1); }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [loadCatalog, query]);

  const normalizedQuery = query.trim().toLocaleLowerCase("it");
  const matchedEntries = useMemo(() => catalogEntries.filter((entry) => {
    const matchesQuery = !normalizedQuery || entry.searchTerms.some((term) => term.toLocaleLowerCase("it").includes(normalizedQuery));
    return matchesQuery && (scope === "all" || entry.origin === scope) && (category === "all" || entry.categories.includes(category)) && (universe === "all" || entry.universe === universe) && (status === "all" || entry.statusLabel === status);
  }).sort((a, b) => a.displayTitle.localeCompare(b.displayTitle, "it", { sensitivity: "base" })), [catalogEntries, category, normalizedQuery, scope, status, universe]);

  const alphabet = useMemo(() => {
    if (!catalogLoaded && !normalizedQuery && scope === "all" && category === "all" && universe === "all" && status === "all") return facets.alphabet;
    const counts = new Map<string, number>();
    matchedEntries.forEach((entry) => { const letter = entry.displayTitle.normalize("NFD").replace(/[\u0300-\u036f]/g, "").match(/[A-Z]/i)?.[0]?.toLocaleUpperCase("it") || "#"; counts.set(letter, (counts.get(letter) || 0) + 1); });
    return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b, "it"));
  }, [catalogLoaded, category, facets.alphabet, matchedEntries, normalizedQuery, scope, status, universe]);

  const entryInitial = (entry: CodexIndexEntry) => entry.displayTitle.normalize("NFD").replace(/[\u0300-\u036f]/g, "").match(/[A-Z]/i)?.[0]?.toLocaleUpperCase("it") || "#";
  const filteredEntries = initial === "all" ? matchedEntries : matchedEntries.filter((entry) => entryInitial(entry) === initial);
  const pristine = !catalogLoaded && !normalizedQuery && scope === "all" && category === "all" && universe === "all" && status === "all" && initial === "all";
  const effectiveTotal = pristine ? totalEntries : filteredEntries.length;
  const pageCount = Math.max(1, Math.ceil(effectiveTotal / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleEntries = filteredEntries.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const advancedFilterCount = [category, universe, status].filter((value) => value !== "all").length;
  const hasActiveCriteria = Boolean(query) || scope !== "all" || advancedFilterCount > 0 || initial !== "all";
  const activate = (action: () => void) => { void loadCatalog(); action(); };
  const resetFilters = () => { setQuery(""); setScope("all"); setCategory("all"); setUniverse("all"); setStatus("all"); setInitial("all"); setPage(1); };

  return <section className="codex-index" aria-labelledby="codex-index-title">
    <header className="codex-index-heading"><div><p className="eyebrow">{eyebrow}</p><h2 id="codex-index-title">{title}</h2></div><p>{description || <>{totalEntries} dossier · canone GiWise e universi documentati restano sempre distinguibili.</>}</p></header>
    <div className="codex-search-start"><div className="codex-search"><label htmlFor="codex-search"><span>Da dove vuoi iniziare?</span><strong>Cerca un personaggio, un universo o un’opera</strong></label><input ref={searchInputRef} id="codex-search" type="search" value={query} aria-keyshortcuts="/" onFocus={() => void loadCatalog()} onChange={(event) => { void loadCatalog(); setQuery(event.target.value); setInitial("all"); setPage(1); }} placeholder="Scrivi un nome, un titolo, un universo o una fazione…" /><span className="codex-search-actions"><span aria-live="polite">{effectiveTotal} {effectiveTotal === 1 ? "risultato" : "risultati"}</span>{query ? <button type="button" onClick={() => { setQuery(""); setInitial("all"); setPage(1); searchInputRef.current?.focus(); }}>Cancella</button> : <kbd aria-label="Scorciatoia: barra obliqua">/</kbd>}</span></div><ol className="codex-search-guide" aria-label="Come consultare il LoreWise Codex"><li className="is-active"><span>01</span><strong>Cerca</strong><small>Nome, opera o universo</small></li><li className={scope !== "all" || advancedFilterCount > 0 ? "is-active" : ""}><span>02</span><strong>Restringi</strong><small>Archivio e filtri, se servono</small></li><li className={effectiveTotal > 0 ? "is-active" : ""}><span>03</span><strong>Apri</strong><small>Consulta il dossier completo</small></li></ol></div>
    <section className="codex-scope-area" aria-labelledby="codex-scope-title"><header><span>Scelta facoltativa</span><h3 id="codex-scope-title">In quale archivio vuoi cercare?</h3><p>Lascia “Esplora tutto” per una ricerca completa.</p></header><nav className="codex-scope-switch" aria-label="Scegli l’archivio del LoreWise Codex">
      <button type="button" className={scope === "all" ? "is-active" : ""} aria-pressed={scope === "all"} onClick={() => activate(() => { setScope("all"); setInitial("all"); setPage(1); })}><span className="codex-scope-emblem"><Image src="/codex/seals/lorewise-codex-emblem-v1.webp" alt="" width={1206} height={1305} unoptimized /></span><i>01</i><strong>Esplora tutto</strong><small>{totalEntries} dossier</small></button>
      <button type="button" className={scope === "giwise-original" ? "is-active" : ""} aria-pressed={scope === "giwise-original"} onClick={() => activate(() => { setScope("giwise-original"); setInitial("all"); setPage(1); })}><span className="codex-scope-emblem"><Image src="/codex/seals/giwise-original-seal-v1.webp" alt="" width={320} height={320} /></span><i>02</i><strong>Originali GiWise</strong><small>{originalTotal} dossier</small></button>
      <button type="button" className={scope === "documented-third-party" ? "is-active" : ""} aria-pressed={scope === "documented-third-party"} onClick={() => activate(() => { setScope("documented-third-party"); setInitial("all"); setPage(1); })}><span className="codex-scope-emblem"><Image src="/brand/icons/enciclopedia-concept-v1.webp" alt="" width={1352} height={1163} unoptimized /></span><i>03</i><strong>Universi documentati</strong><small>{documentedTotal} dossier</small></button>
    </nav></section>
    <details className="codex-advanced-filters" onToggle={(event) => { if (event.currentTarget.open) void loadCatalog(); }}><summary><span>Filtri avanzati{advancedFilterCount > 0 ? ` · ${advancedFilterCount} attivi` : ""}</span><small>Categoria, universo e completezza</small></summary><div className="codex-filter-ledger" aria-label="Filtri del LoreWise Codex"><label><span>Categoria</span><select value={category} onChange={(event) => { setCategory(event.target.value); setInitial("all"); setPage(1); }}><option value="all">Tutte le categorie</option>{facets.categories.map((item) => <option value={item} key={item}>{item}</option>)}</select></label><label><span>Universo</span><select value={universe} onChange={(event) => { setUniverse(event.target.value); setInitial("all"); setPage(1); }}><option value="all">Tutti gli universi</option>{facets.universes.map((item) => <option value={item} key={item}>{item}</option>)}</select></label><label><span>Completezza del dossier</span><select value={status} onChange={(event) => { setStatus(event.target.value); setInitial("all"); setPage(1); }}><option value="all">Tutti i dossier</option>{facets.statuses.map((item) => <option value={item} key={item}>{item}</option>)}</select></label><button type="button" onClick={resetFilters} disabled={!hasActiveCriteria}>Azzera tutto</button></div></details>
    {!normalizedQuery && <nav className="codex-alphabet" aria-label="Indice alfabetico dei dossier"><div className="codex-alphabet-heading"><span>Indice alfabetico</span><strong>{initial === "all" ? "Tutti i nomi" : `Lettera ${initial}`}</strong></div><div className="codex-alphabet-letters"><button type="button" className={initial === "all" ? "is-active" : ""} aria-pressed={initial === "all"} onClick={() => activate(() => { setInitial("all"); setPage(1); })}>Tutti <small>{effectiveTotal}</small></button>{alphabet.map(([letter, count]) => <button type="button" className={initial === letter ? "is-active" : ""} aria-pressed={initial === letter} onClick={() => activate(() => { setInitial(letter); setPage(1); })} key={letter}>{letter}<small>{count}</small></button>)}</div></nav>}
    {normalizedQuery && <div className="codex-query-summary"><span>Ricerca attiva</span><strong>“{query.trim()}”</strong><small>{effectiveTotal} {effectiveTotal === 1 ? "dossier trovato" : "dossier trovati"}</small><button type="button" onClick={resetFilters}>Mostra di nuovo tutto l’indice</button></div>}
    <div className="codex-results" aria-busy={catalogLoading}>{catalogLoading && <p className="codex-loading" role="status">Caricamento dell’indice completo…</p>}{catalogError && <p className="codex-empty" role="alert">{catalogError} <button type="button" onClick={() => void loadCatalog()}>Riprova</button></p>}{visibleEntries.map((entry, entryIndex) => <article className="codex-result-row" data-origin={entry.origin} key={entry.slug}><Link href={`/enciclopedia/${entry.slug}`} className="codex-result"><span className="codex-result-number" aria-hidden="true">{String((currentPage - 1) * pageSize + entryIndex + 1).padStart(2, "0")}</span><span className="codex-result-portrait"><Image src={codexThumbnailSrc(entry.imageSrc)} alt="" width={entry.imageWidth} height={entry.imageHeight} sizes="(max-width: 560px) 88px, 152px" unoptimized /></span><span className="codex-result-copy"><small>{entry.origin === "giwise-original" ? "Originale GiWise" : "Universo documentato"} · {entry.categories.join(" · ")} · {entry.descriptor}</small><strong>{entry.displayTitle}</strong><em>{entry.universe}</em><span>{entry.summary}</span></span><span className="codex-result-status"><b>{entry.statusLabel}</b><span>Apri il dossier →</span></span></Link><CodexBookmarkButton slug={entry.slug} /></article>)}{!catalogLoading && effectiveTotal === 0 && <p className="codex-empty">Nessuna voce corrisponde alla ricerca e ai filtri selezionati.</p>}{effectiveTotal > 0 && <nav className="codex-pagination" aria-label="Pagine dei risultati"><button type="button" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>← Precedenti</button><span>Pagina <strong>{currentPage}</strong> di {pageCount}</span><button type="button" disabled={currentPage === pageCount || catalogLoading} onClick={() => { if (!catalogLoaded) void loadCatalog().then((loaded) => { if (loaded) setPage(2); }); else setPage((value) => Math.min(pageCount, value + 1)); }}>Successivi →</button></nav>}</div>
  </section>;
}
