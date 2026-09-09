import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArtCatalog } from "@/components/ArtCatalog";
import { UniverseGuide } from "@/components/UniverseGuide";
import { ArtworkBundlePurchaseButton } from "@/components/ArtworkBundlePurchaseButton";
import { HorrorPromotionTimer } from "@/components/HorrorPromotionTimer";
import {
  catalogArtworks,
  commercialOriginalArtworks,
  exhibitionOnlyArtworks,
} from "@/lib/artCatalog";
import { horrorArtworkBundles, isHorrorArtworkBundleActive } from "@/lib/horrorArtworkBundles";

export const metadata: Metadata = {
  title: "Arte in Vetrina",
  description: `Esplora ${catalogArtworks.length} opere digitali GiWise Studio: originali acquistabili e opere in esposizione, con schede, filigrana e licenze trasparenti.`,
  openGraph: {
    title: "Arte in Vetrina | LoreWise Universe",
    description: `${catalogArtworks.length} opere digitali protette, divise tra originali GiWise acquistabili e opere in esposizione.`,
    images: [{ url: "/brand/art-portals/originals-emblem-v1.webp", alt: "Emblema illustrato delle opere originali GiWise" }],
  },
};

export default async function ArtPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const localPreview = query?.anteprima === "halloween" && process.env.LOREWISE_LOCAL_CALENDAR_PREVIEW === "true";
  const showHorrorBundles = localPreview || isHorrorArtworkBundleActive();
  return (
    <main className="art-page">
      <section className="art-page-hero" aria-labelledby="art-page-title">
        <div className="shell art-page-hero-inner">
          <div>
            <p className="eyebrow">Arte in Vetrina · GiWise Studio</p>
            <h1 id="art-page-title">Colleziona opere. Esplora l’archivio.</h1>
            <p>Originali acquistabili e opere in esposizione, raccolti in una vetrina protetta.</p>
            <Link className="art-hero-catalog-link" href="#art-index">Guarda subito le opere <span aria-hidden="true">↓</span></Link>
          </div>
          <Image src="/brand/icons/arte-concept-v1.webp" alt="Emblema della sezione Arte" width={1224} height={1285} unoptimized priority />
        </div>
      </section>

      {showHorrorBundles ? <section className="horror-bundles" id="collezioni-horror" aria-labelledby="horror-bundles-title">
        <div className="shell horror-bundles-heading">
          <p className="eyebrow">Collezioni di Halloween · Edizione limitata</p>
          <h2 id="horror-bundles-title">Tre collezioni per entrare nell’ombra.</h2>
          <p>Ogni collezione riunisce tre opere originali GiWise già presenti in vetrina. Ricevi i tre file digitali con licenza personale: nessuna immagine artificiale, nessuna nuova versione e nessun disegno duplicato.</p>
          <div><strong>24,90 €</strong><span>per collezione · dal 1° ottobre al 1° novembre 2026</span></div>
          <HorrorPromotionTimer preview={localPreview} />
        </div>
        <div className="shell horror-bundle-list">
          {horrorArtworkBundles.map((bundle, index) => <article className="horror-bundle" key={bundle.code} id={bundle.slug}>
            <header>
              <span>Collezione 0{index + 1}</span>
              <h3>{bundle.title}</h3>
              <p>{bundle.theme}</p>
            </header>
            <div className="horror-bundle-artworks">
              {bundle.artworks.map((artwork) => <figure key={artwork.code}>
                <Image src={artwork.image} alt={`Anteprima protetta di ${artwork.title}`} width={1131} height={1600} unoptimized />
                <figcaption><small>{artwork.code}</small><strong>{artwork.title}</strong></figcaption>
              </figure>)}
            </div>
            <footer>
              <div><s>{new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(bundle.originalTotalCents / 100)}</s><strong>{bundle.priceLabel}</strong><span>Tre licenze digitali personali · offerta non cumulabile</span></div>
              <ArtworkBundlePurchaseButton productCode={bundle.code} />
            </footer>
          </article>)}
        </div>
      </section> : null}

      <ArtCatalog artworks={catalogArtworks} />

      <section className="art-protection" id="protezione" aria-labelledby="protection-title">
        <div className="shell art-protection-inner">
          <div><p className="eyebrow">Protezione delle opere</p><h2 id="protection-title">L’originale resta fuori dal sito.</h2></div>
          <ol>
            <li><strong>Copia web</strong><span>Risoluzione ridotta rispetto al file sorgente.</span></li>
            <li><strong>Filigrana incorporata</strong><span>Il marchio fa parte dell’immagine pubblica, non del CSS.</span></li>
            <li><strong>Accesso controllato</strong><span>Le {exhibitionOnlyArtworks.length} opere espositive non hanno download; per le {commercialOriginalArtworks.length} acquistabili prezzi e pacchetti sono definiti, ma il pagamento non è ancora attivo.</span></li>
            <li><strong>Licenza personale</strong><span>Ogni futuro download autorizzato avrà condizioni d’uso chiare e non commerciali.</span></li>
          </ol>
        </div>
      </section>

      <section className="art-next-step shell">
        <p className="eyebrow">Pacchetti e diritti</p>
        <h2>Prima del download sai esattamente cosa ricevi e cosa puoi farne.</h2>
        <p>Tre pacchetti basati sui file PNG reali, una licenza personale leggibile e una consegna privata con limiti precisi.</p>
        <div className="art-next-links">
          <Link href="/licenza-arte">Consulta pacchetti e licenza <span aria-hidden="true">→</span></Link>
          <Link href="/abbonamento">Scopri Supporter e Collector <span aria-hidden="true">→</span></Link>
        </div>
      </section>
      <UniverseGuide current="Arte" items={[
        { href: "/commissioni", label: "Commissioni", description: "Trasforma la tua idea in un ritratto personale." },
        { href: "/dove-nascono-i-mondi", label: "Dove nascono i mondi", description: "Scopri bozze, processi e passioni dietro i lavori." },
        { href: "/shop", label: "GiWise Shop", description: "Esplora oggetti, stampe e collezioni fisiche." },
      ]} />
    </main>
  );
}
