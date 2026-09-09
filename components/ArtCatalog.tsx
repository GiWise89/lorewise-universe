"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { CatalogArtwork } from "@/lib/artCatalog";
import { artworkGenreLabels } from "@/lib/artworkTaxonomy";
import { ArtworkCardSocial } from "@/components/ArtworkCardSocial";

type ArtCatalogProps = {
  artworks: CatalogArtwork[];
};

type SortMode = "archive" | "newest" | "oldest" | "price-asc" | "price-desc";
type FilterPanel = "search" | "genre" | "price" | "sort";

const adultCover = "/brand/art-portals/adult-cover-v2.webp";
const originalSeal = "/brand/art-portals/originals-seal-card-v1.webp";
const fanartSeal = "/brand/art-portals/fanart-seal-card-v1.webp";
const pageSize = 6;
const featuredArchiveCodes = ["LW-ART-081", "LW-ART-080"] as const;

export function ArtCatalog({ artworks }: ArtCatalogProps) {
  const [query, setQuery] = useState("");
  const [year, setYear] = useState("all");
  const [genre, setGenre] = useState("all");
  const [availability, setAvailability] = useState("all");
  const [priceTier, setPriceTier] = useState("all");
  const [sortMode, setSortMode] = useState<SortMode>("archive");
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const [openPanel, setOpenPanel] = useState<FilterPanel | null>(null);
  const [revealedAdultArtworks, setRevealedAdultArtworks] = useState<string[]>([]);

  const filteredArtworks = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("it");
    const matches = artworks.filter((artwork) => {
      const matchesQuery = !normalizedQuery
        || artwork.title?.toLocaleLowerCase("it").includes(normalizedQuery)
        || artwork.code.toLocaleLowerCase("it").includes(normalizedQuery);
      return matchesQuery
        && (year === "all" || artwork.year === year)
        && (genre === "all" || artwork.genre === genre)
        && (availability === "all" || artwork.access === availability)
        && (priceTier === "all" || artwork.priceTier === priceTier);
    });

    return [...matches].sort((left, right) => {
      if (sortMode === "newest" || sortMode === "oldest") {
        const direction = sortMode === "newest" ? -1 : 1;
        return direction * (`${left.year}-${left.code}`.localeCompare(`${right.year}-${right.code}`, "it"));
      }
      if (sortMode === "price-asc" || sortMode === "price-desc") {
        const prices = { essential: 8.9, detailed: 12.9, premium: 17.9 };
        const noPrice = sortMode === "price-asc" ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
        const leftPrice = left.priceTier ? prices[left.priceTier] : noPrice;
        const rightPrice = right.priceTier ? prices[right.priceTier] : noPrice;
        return sortMode === "price-asc" ? leftPrice - rightPrice : rightPrice - leftPrice;
      }
      const leftFeatured = featuredArchiveCodes.indexOf(left.code as (typeof featuredArchiveCodes)[number]);
      const rightFeatured = featuredArchiveCodes.indexOf(right.code as (typeof featuredArchiveCodes)[number]);
      if (leftFeatured !== rightFeatured) {
        if (leftFeatured === -1) return 1;
        if (rightFeatured === -1) return -1;
        return leftFeatured - rightFeatured;
      }
      return left.code.localeCompare(right.code, "it");
    });
  }, [artworks, availability, genre, priceTier, query, sortMode, year]);

  const visibleArtworks = filteredArtworks.slice(0, visibleCount);
  const isCuratedOrder = !query && year === "all" && genre === "all" && availability === "all" && priceTier === "all" && sortMode === "archive";

  function updateFilter(update: () => void) {
    update();
    setVisibleCount(pageSize);
  }

  function resetFilters() {
    setQuery("");
    setYear("all");
    setGenre("all");
    setAvailability("all");
    setPriceTier("all");
    setSortMode("archive");
    setVisibleCount(pageSize);
    setOpenPanel(null);
  }

  function selectQuickView(nextYear: string, nextAvailability: string) {
    updateFilter(() => {
      setYear(nextYear);
      setAvailability(nextAvailability);
    });
    setOpenPanel(null);
  }

  function togglePanel(panel: FilterPanel) {
    setOpenPanel((current) => current === panel ? null : panel);
  }

  function revealAdultArtwork(code: string) {
    setRevealedAdultArtworks((current) => current.includes(code) ? current : [...current, code]);
  }

  return (
    <>
      <section className="art-catalog-tools shell" id="art-index" aria-labelledby="art-filters-title">
        <div className="art-filter-heading">
          <div>
            <p className="eyebrow">Collezione opere</p>
            <h2 id="art-filters-title">Scegli ciò che vuoi vedere.</h2>
          </div>
          <p className="catalog-result-count" aria-live="polite"><strong>{filteredArtworks.length}</strong> {filteredArtworks.length === 1 ? "opera" : "opere"}</p>
        </div>

        <nav className="art-index-nav" aria-label="Viste rapide dell’archivio">
          <button type="button" aria-pressed={year === "all" && availability === "all"} onClick={() => selectQuickView("all", "all")}>Tutte</button>
          <button type="button" aria-pressed={availability === "commercial-original"} onClick={() => selectQuickView("all", "commercial-original")}>Originali in vendita</button>
          <button type="button" aria-pressed={availability === "exhibition-only"} onClick={() => selectQuickView("all", "exhibition-only")}>Esposizione</button>
          <button type="button" aria-pressed={year === "2025" && availability === "all"} onClick={() => selectQuickView("2025", "all")}>2025</button>
          <button type="button" aria-pressed={year === "2026" && availability === "all"} onClick={() => selectQuickView("2026", "all")}>2026</button>
          <button type="button" aria-expanded={openPanel === "search"} aria-controls="art-filter-panel" onClick={() => togglePanel("search")}>Cerca</button>
          <button type="button" aria-expanded={openPanel === "genre"} aria-controls="art-filter-panel" onClick={() => togglePanel("genre")}>Genere</button>
          <button type="button" aria-expanded={openPanel === "price"} aria-controls="art-filter-panel" onClick={() => togglePanel("price")}>Fascia</button>
          <button type="button" aria-expanded={openPanel === "sort"} aria-controls="art-filter-panel" onClick={() => togglePanel("sort")}>Ordina</button>
        </nav>

        <p className="art-access-note"><span><strong>Acquistabili</strong> · file digitale con licenza personale</span><span><strong>Esposizione</strong> · anteprima protetta, nessun download</span></p>

        {openPanel ? <section className="art-filter-panel" id="art-filter-panel" aria-label="Pannello filtri dell’archivio">
            <header>
              <div><small>Filtri archivio</small><strong>{openPanel === "search" ? "Cerca un’opera" : openPanel === "genre" ? "Scegli il genere" : openPanel === "price" ? "Scegli la fascia" : "Ordina le opere"}</strong></div>
              <button type="button" onClick={() => setOpenPanel(null)}>Chiudi filtri <span aria-hidden="true">×</span></button>
            </header>
            <div className="art-filter-panel-control">
              {openPanel === "search" ? <label htmlFor="artwork-search"><span>Titolo o codice</span><input id="artwork-search" value={query} onChange={(event) => updateFilter(() => setQuery(event.target.value))} placeholder="Cerca un titolo o LW-ART-014" /></label> : null}
              {openPanel === "genre" ? <label><span>Seleziona genere</span><select value={genre} onChange={(event) => updateFilter(() => setGenre(event.target.value))}><option value="all">Tutti i generi</option>{artworkGenreLabels.map((label) => <option value={label} key={label}>{label}</option>)}</select></label> : null}
              {openPanel === "price" ? <label><span>Fascia di prezzo</span><select value={priceTier} onChange={(event) => updateFilter(() => setPriceTier(event.target.value))}><option value="all">Tutte le fasce</option><option value="essential">Fascia Essenziale · 8,90 €</option><option value="detailed">Fascia Dettagliata · 12,90 €</option><option value="premium">Fascia Premium · 17,90 €</option></select></label> : null}
              {openPanel === "sort" ? <label><span>Ordina le opere</span><select value={sortMode} onChange={(event) => updateFilter(() => setSortMode(event.target.value as SortMode))}><option value="archive">Codice archivio</option><option value="newest">Più recenti</option><option value="oldest">Più vecchie</option><option value="price-asc">Prezzo crescente</option><option value="price-desc">Prezzo decrescente</option></select></label> : null}
            </div>
          </section> : null}
        {!isCuratedOrder ? <button className="art-index-reset" type="button" onClick={resetFilters}>Ripristina l’intero archivio</button> : null}
      </section>

      {filteredArtworks.length > 0 ? (
        <>
          <section className="uniform-art-gallery shell" aria-label="Opere dell’archivio protetto">
            {visibleArtworks.map((artwork) => {
              const adultRevealed = !artwork.sensitive || revealedAdultArtworks.includes(artwork.code);
              return (
                  <article className={`draft-artwork artwork-${artwork.access} artwork-${artwork.orientation}`} key={artwork.code}>
                    {adultRevealed ? (
                      <Link className="draft-artwork-image" href={`/arte/${artwork.slug}`} aria-label={`Apri la scheda dell’opera ${artwork.code}`}>
                        <Image src={artwork.image} alt={`Anteprima protetta dell’opera ${artwork.code}, ${artwork.title}`} width={artwork.orientation === "landscape" ? 1600 : 1131} height={artwork.orientation === "landscape" ? 900 : 1600} sizes="(max-width: 640px) 92vw, (max-width: 980px) 45vw, 30vw" loading="lazy" unoptimized />
                      </Link>
                    ) : (
                      <div className="draft-artwork-image adult-thumbnail-gate">
                        <Image src={adultCover} alt="Sigillo illustrato per contenuti riservati agli adulti" width={1086} height={1448} sizes="(max-width: 700px) 92vw, 48vw" loading="lazy" unoptimized />
                        <div><strong>Opera sigillata · 18+</strong><span>{artwork.contentWarning}</span><button type="button" onClick={() => revealAdultArtwork(artwork.code)}>Conferma 18+ · Mostra l’opera</button></div>
                      </div>
                    )}
                    <ArtworkCardSocial artworkCode={artwork.code} artworkTitle={artwork.title ?? artwork.code} artworkSlug={artwork.slug} />
                    <div className="draft-artwork-copy">
                      <div className="artwork-card-identity">
                        <Image src={artwork.kindLabel === "Arte originale" ? originalSeal : fanartSeal} alt="" width={96} height={96} loading="lazy" unoptimized />
                        <small>{artwork.code}{featuredArchiveCodes.includes(artwork.code as (typeof featuredArchiveCodes)[number]) ? <span className="artwork-featured-label">Nuova in vetrina</span> : null}</small>
                      </div>
                      <h3><Link href={`/arte/${artwork.slug}`}>{artwork.title}</Link></h3>
                      <p className="artwork-card-status">{artwork.priceLabel ? `${artwork.priceLabel} · Licenza personale` : "Solo esposizione · Nessun download"}</p>
                    </div>
                  </article>
              );
            })}
          </section>
          {visibleCount < filteredArtworks.length ? <div className="art-load-more shell"><p>Visualizzate {visibleArtworks.length} di {filteredArtworks.length} opere</p><button type="button" onClick={() => setVisibleCount((current) => current + pageSize)}>Apri il capitolo successivo</button></div> : null}
        </>
      ) : (
        <section className="art-empty-results shell" aria-live="polite"><p className="eyebrow">Nessuna corrispondenza</p><h2>Questo percorso non contiene ancora opere.</h2><p>Prova una combinazione diversa oppure torna all’intero archivio.</p><button type="button" onClick={resetFilters}>Mostra tutte le opere</button></section>
      )}
    </>
  );
}
