import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArtCatalog } from "@/components/ArtCatalog";
import { UniverseGuide } from "@/components/UniverseGuide";
import {
  catalogArtworks,
  commercialOriginalArtworks,
  exhibitionOnlyArtworks,
} from "@/lib/artCatalog";

export const metadata: Metadata = {
  title: "Arte in Vetrina",
  description: "Esplora 67 opere digitali GiWise Studio: originali acquistabili e opere in esposizione, con schede, filigrana e licenze trasparenti.",
  openGraph: {
    title: "Arte in Vetrina | LoreWise Universe",
    description: "67 opere digitali protette, divise tra originali GiWise acquistabili e opere in esposizione.",
    images: [{ url: "/brand/art-portals/originals-emblem-v1.webp", alt: "Emblema illustrato delle opere originali GiWise" }],
  },
};

export default function ArtPage() {
  return (
    <main className="art-page">
      <section className="art-page-hero" aria-labelledby="art-page-title">
        <div className="shell art-page-hero-inner">
          <div>
            <p className="eyebrow">Vetrina d’autore · GiWise Studio</p>
            <h1 id="art-page-title">L’arte lascia tracce. Qui diventano memoria.</h1>
            <p>Titoli, anni e descrizioni accompagnano ora ogni opera dell’archivio protetto. Le immagini pubbliche restano copie ridotte con filigrana, mentre accesso e licenza seguono le regole approvate.</p>
          </div>
          <Image src="/brand/icons/arte-concept-v1.webp" alt="Emblema della sezione Arte" width={1224} height={1285} unoptimized priority />
        </div>
      </section>

      <section className="art-catalog-intro shell" aria-labelledby="catalog-title">
        <div>
          <p className="eyebrow">Archivio protetto</p>
          <h2 id="catalog-title">Esplora le opere disponibili e quelle custodite in esposizione.</h2>
        </div>
        <div className="catalog-note">
          <strong>Regola attiva</strong>
          <p>{exhibitionOnlyArtworks.length} opere non prevedono download. Le {commercialOriginalArtworks.length} originali saranno acquistabili singolarmente oppure tramite i crediti mensili dell’abbonamento.</p>
        </div>
      </section>

      <section className="art-identity-guide shell" aria-labelledby="art-identity-title">
        <header><p className="eyebrow">Identità dichiarata</p><h2 id="art-identity-title">Tre etichette, tre significati precisi.</h2></header>
        <div>
          <article><span>01</span><h3>Originale acquistabile</h3><p>Opera ideata da GiWise Studio con prezzo e licenza personale indicati nella scheda.</p></article>
          <article><span>02</span><h3>Originale in esposizione</h3><p>Opera d’autore custodita nell’archivio, ma non proposta per vendita o download.</p></article>
          <article><span>03</span><h3>Fan art non ufficiale</h3><p>Reinterpretazione di personaggi riconoscibili, mostrata soltanto come anteprima protetta.</p></article>
        </div>
      </section>

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
