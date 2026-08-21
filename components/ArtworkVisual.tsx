"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { CatalogArtwork } from "@/lib/artCatalog";

const adultCover = "/brand/art-portals/adult-cover-v2.webp";

type ArtworkVisualProps = {
  artwork: CatalogArtwork;
};

export function ArtworkVisual({ artwork }: ArtworkVisualProps) {
  const [adultRevealed, setAdultRevealed] = useState(!artwork.sensitive);
  const [zoomOpen, setZoomOpen] = useState(false);

  useEffect(() => {
    if (!zoomOpen) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setZoomOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [zoomOpen]);

  if (!adultRevealed) {
    return (
      <div className="artwork-detail-visual artwork-adult-gate">
        <Image src={adultCover} alt="Sigillo illustrato di protezione per contenuti riservati agli adulti" width={1086} height={1448} unoptimized priority />
        <div className="adult-gate-copy">
          <p className="eyebrow">Contenuto protetto</p>
          <strong>Opera sigillata · 18+</strong>
          <span>{artwork.contentWarning}</span>
          <button type="button" onClick={() => setAdultRevealed(true)}>Confermo di avere almeno 18 anni · Mostra l’opera</button>
        </div>
      </div>
    );
  }

  return (
    <div className="artwork-detail-visual">
      <button className="artwork-zoom-trigger" type="button" onClick={() => setZoomOpen(true)} aria-label={`Ingrandisci l’anteprima protetta di ${artwork.title}`}>
        <Image
          src={artwork.image}
          alt={`Anteprima protetta dell’opera ${artwork.code}, ${artwork.title}`}
          width={artwork.orientation === "landscape" ? 1600 : 1131}
          height={artwork.orientation === "landscape" ? 900 : 1600}
          sizes="(max-width: 980px) 90vw, 46vw"
          unoptimized
          priority
        />
        <span>Esamina l’opera</span>
      </button>
      <p>Anteprima web ridotta · Filigrana incorporata · Originale non esposto</p>
      {artwork.sensitive ? <button className="adult-hide-action" type="button" onClick={() => setAdultRevealed(false)}>Nascondi nuovamente l’opera</button> : null}

      {zoomOpen ? (
        <div className="artwork-lightbox" role="dialog" aria-modal="true" aria-label={`Anteprima ingrandita di ${artwork.title}`}>
          <button className="artwork-lightbox-close" type="button" onClick={() => setZoomOpen(false)}>Chiudi esame</button>
          <Image
            src={artwork.image}
            alt={`Anteprima ingrandita e protetta dell’opera ${artwork.code}, ${artwork.title}`}
            width={artwork.orientation === "landscape" ? 1600 : 1131}
            height={artwork.orientation === "landscape" ? 900 : 1600}
            sizes="96vw"
            unoptimized
          />
          <p>{artwork.code} · Filigrana incorporata · Copia web protetta</p>
        </div>
      ) : null}
    </div>
  );
}
