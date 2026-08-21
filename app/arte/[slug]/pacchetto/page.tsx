import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { catalogArtworks } from "@/lib/artCatalog";

export const metadata: Metadata = {
  title: "Simulazione pacchetto digitale",
  description: "Anteprima protetta dell'esperienza di consegna di un'opera LoreWise Universe.",
};

export default async function ArtworkPackagePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const artwork = catalogArtworks.find((item) => item.slug === slug);
  if (!artwork || artwork.access !== "commercial-original" || !artwork.priceLabel) notFound();
  const demoUrl = `/api/artwork-package-demo?code=${encodeURIComponent(artwork.code)}`;

  return <main className="artwork-package-page">
    <section className="artwork-package-hero">
      <div className="shell artwork-package-hero-inner">
        <div><p className="eyebrow">Simulazione locale · nessun acquisto registrato</p><h1>Il tuo pacchetto,<br />prima di acquistare.</h1><p>Questa pagina riproduce ciò che apparirà nella libreria personale dopo una conferma di pagamento. L’immagine visibile resta l’anteprima pubblica protetta.</p></div>
        <Image src="/brand/icons/arte-concept-v1.webp" alt="" width={1224} height={1285} priority unoptimized />
      </div>
    </section>

    <div className="shell artwork-package-stage">
      <section className="artwork-package-art" aria-labelledby="package-art-title">
        <div className="artwork-package-preview"><Image src={artwork.image} alt={`Anteprima protetta di ${artwork.title}`} width={1200} height={1600} priority unoptimized /><strong>ANTEPRIMA PROTETTA</strong></div>
        <div><p className="eyebrow">Edizione personale</p><h2 id="package-art-title">{artwork.title}</h2><span>{artwork.code} · {artwork.year}</span><p>{artwork.description}</p></div>
      </section>

      <section className="artwork-package-delivery" aria-labelledby="package-delivery-title">
        <header><div><p className="eyebrow">Contenuto della consegna</p><h2 id="package-delivery-title">Cosa riceverai.</h2></div><strong>{artwork.priceLabel}</strong></header>
        <ol>
          <li><span>01</span><div><strong>Opera digitale</strong><p>PNG appiattito, senza filigrana, alla risoluzione nativa dichiarata.</p><dl><div><dt>Risoluzione</dt><dd>{artwork.nativeResolution}</dd></div><div><dt>Colore</dt><dd>sRGB per una visualizzazione compatibile</dd></div></dl></div><em>Download protetto</em></li>
          <li><span>02</span><div><strong>Certificato nominativo</strong><p>Documento digitale con LoreWise ID, codice dell’opera, data dell’acquisto e riferimento dell’ordine.</p></div><em>PDF personale</em></li>
          <li><span>03</span><div><strong>Licenza personale</strong><p>Condizioni chiare su uso privato, stampa personale e divieti di rivendita, NFT, redistribuzione e addestramento AI.</p></div><em>Inclusa</em></li>
        </ol>
      </section>

      <section className="artwork-package-library" aria-labelledby="package-library-title">
        <div className="artwork-package-library-heading"><Image src="/brand/lorewise-universe-logo-concept-c.webp" alt="" width={1536} height={1024} unoptimized /><div><p className="eyebrow">La tua libreria · esempio</p><h2 id="package-library-title">Consegna privata.</h2></div><span>Licenza attiva</span></div>
        <div className="artwork-package-file">
          <Image src={artwork.image} alt="" width={260} height={340} unoptimized />
          <div><small>{artwork.code} · EDIZIONE PERSONALE</small><strong>{artwork.title}</strong><p>PNG · {artwork.nativeResolution} · licenza nominativa</p><span>0 download utilizzati su 3</span></div>
          <button type="button" disabled>Scarica l’opera</button>
        </div>
        <p className="artwork-package-safety">Nella simulazione il pulsante dell’opera resta disattivato: il file originale non viene mai collocato nella parte pubblica del sito.</p>
        <div className="artwork-package-actions"><a href={demoUrl}>Scarica il manifesto dimostrativo</a><Link href="/licenza-arte">Leggi la licenza completa</Link></div>
      </section>

      <aside className="artwork-package-notice"><strong>Questa è una simulazione trasparente.</strong><p>Il manifesto scaricabile serve a provare il comportamento del download e non contiene l’opera. L’accesso al PNG reale verrà creato soltanto per il proprietario della licenza dopo il pagamento verificato e il caricamento del file di consegna.</p></aside>
      <nav className="artwork-package-back"><Link href={`/arte/${artwork.slug}`}>← Torna alla scheda dell’opera</Link><Link href="/account">Apri l’Area personale →</Link></nav>
    </div>
  </main>;
}
