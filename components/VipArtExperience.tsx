"use client";

import { useMemo, useState } from "react";
import { ArtworkPurchaseButton } from "@/components/ArtworkPurchaseButton";
import type { VIP_ARTWORKS, VIP_ART_DROP, VipArtworkMode } from "@/data/vip-artworks";

type VipArtPayload = typeof VIP_ART_DROP & { artworks: typeof VIP_ARTWORKS };

function euro(cents: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(cents / 100);
}

export function VipArtExperience({ art, discountPercent }: { art: VipArtPayload; discountPercent: number }) {
  const [mode, setMode] = useState<VipArtworkMode>("commercial");
  const [visibleCount, setVisibleCount] = useState(12);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const works = useMemo(() => art.artworks.filter((artwork) => artwork.mode === mode), [art.artworks, mode]);
  const selected = art.artworks.find((artwork) => artwork.id === selectedId);
  const featured = art.artworks.find((artwork) => artwork.code === art.featuredCode);

  function selectMode(nextMode: VipArtworkMode) {
    setMode(nextMode);
    setVisibleCount(12);
  }

  return <section className="vip-art" id="art" aria-labelledby="vip-art-title">
    <header className="vip-art-hero">
      {featured ? <img src={`/api/vip-media?asset=${featured.mediaId}`} alt="Anteprima protetta dell'opera VIP del mese" width="1600" height="1200" decoding="async" fetchPriority="high" /> : null}
      <div className="vip-art-hero-shade" aria-hidden="true" />
      <div className="shell">
        <p className="eyebrow">LoreWise VIP · Drop arte 01</p>
        <span>Scelta VIP del mese</span>
        <h1 id="vip-art-title">{art.title}</h1>
        <p>{art.subtitle}</p>
        <small>{art.introduction}</small>
      </div>
    </header>

    <div className="shell vip-art-body">
      <div className="vip-art-switch" role="tablist" aria-label="Collezioni d'arte VIP">
        <button type="button" role="tab" aria-selected={mode === "commercial"} className={mode === "commercial" ? "is-selected" : undefined} onClick={() => selectMode("commercial")}>
          <span>01</span><strong>In vendita</strong><small>{art.commercialCount} opere · sconto Pass applicato</small>
        </button>
        <button type="button" role="tab" aria-selected={mode === "exhibition"} className={mode === "exhibition" ? "is-selected" : undefined} onClick={() => selectMode("exhibition")}>
          <span>02</span><strong>Esposizione</strong><small>{art.exhibitionCount} opere · non acquistabili</small>
        </button>
      </div>

      <header className="vip-art-collection-heading">
        <div>
          <p className="eyebrow">{mode === "commercial" ? "Collezione commerciabile" : "Sala espositiva"}</p>
          <h2>{mode === "commercial" ? "Originali con vantaggio VIP." : "Opere da osservare, non da acquistare."}</h2>
        </div>
        {mode === "commercial" ? <p>Il prezzo riservato include lo sconto <strong>{discountPercent}%</strong> del tuo Pass. Il prezzo ordinario resta visibile e barrato per un confronto trasparente.</p> : <p>{art.rightsNote}</p>}
      </header>

      <div className={`vip-art-grid vip-art-grid-${mode}`}>
        {works.slice(0, visibleCount).map((artwork, index) => {
          const basePrice = "priceCents" in artwork ? artwork.priceCents : undefined;
          const vipPrice = basePrice ? Math.round(basePrice * (100 - discountPercent) / 100) : undefined;
          return <article className={`vip-art-card is-${artwork.format}`} key={artwork.id}>
            <button className="vip-art-preview" type="button" onClick={() => setSelectedId(artwork.id)} aria-label={`Ingrandisci ${artwork.title}`}>
              <img src={`/api/vip-media?asset=${artwork.mediaId}`} alt={`${artwork.title}, anteprima protetta`} width={artwork.format === "landscape" ? 1600 : 1200} height={artwork.format === "landscape" ? 1000 : 1500} loading="lazy" decoding="async" />
              <span>Apri dettaglio</span>
            </button>
            <div className="vip-art-card-copy">
              <p>{artwork.code}</p>
              <h3>{artwork.title}</h3>
              <p className="vip-art-lore">{artwork.lore}</p>
              <small>{artwork.mode === "commercial" ? "Opera originale · pacchetto digitale con download automatico" : "Esposizione VIP · non in vendita"}</small>
              {basePrice && vipPrice ? <div className="vip-art-price">
                <del>{euro(basePrice)}</del>
                <strong>{euro(vipPrice)}</strong>
                <span>Risparmi {euro(basePrice - vipPrice)}</span>
              </div> : <div className="vip-art-exhibit-label"><span>{String(index + 1).padStart(2, "0")}</span> Solo esposizione</div>}
              {artwork.mode === "commercial" && vipPrice ? <div className="vip-art-purchase"><ArtworkPurchaseButton productCode={artwork.code} priceLabel={euro(vipPrice)} /></div> : null}
            </div>
          </article>;
        })}
      </div>

      {visibleCount < works.length ? <button className="vip-art-more" type="button" onClick={() => setVisibleCount((count) => count + 12)}>Mostra altre opere <span>{Math.min(12, works.length - visibleCount)}</span></button> : null}
      <p className="vip-art-protection">Le immagini mostrate sono copie ridotte e filigranate. I file originali non vengono esposti nella VIP Zone.</p>
    </div>

    {selected ? <div className="vip-art-lightbox" role="dialog" aria-modal="true" aria-label={`Dettaglio di ${selected.title}`} onClick={() => setSelectedId(null)}>
      <button type="button" onClick={() => setSelectedId(null)} aria-label="Chiudi dettaglio">×</button>
      <figure onClick={(event) => event.stopPropagation()}>
        <img src={`/api/vip-media?asset=${selected.mediaId}`} alt={`${selected.title}, dettaglio protetto`} decoding="async" />
        <p className="vip-art-lightbox-lore">{selected.lore}</p>
        <figcaption><strong>{selected.title}</strong><span>{selected.code} · Anteprima protetta</span></figcaption>
      </figure>
    </div> : null}
  </section>;
}
