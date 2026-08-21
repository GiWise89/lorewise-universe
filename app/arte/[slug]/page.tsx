import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArtworkVisual } from "@/components/ArtworkVisual";
import { ArtworkCommunity } from "@/components/ArtworkCommunity";
import { ArtworkPurchaseButton } from "@/components/ArtworkPurchaseButton";
import { catalogArtworks, type CatalogArtwork } from "@/lib/artCatalog";

const adultCover = "/brand/art-portals/adult-cover-v2.webp";
const originalSeal = "/brand/art-portals/originals-seal-card-v1.webp";
const fanartSeal = "/brand/art-portals/fanart-seal-card-v1.webp";
const dossierDivider = "/brand/art-portals/dossier-divider-display-v1.webp";

export function generateStaticParams() {
  return catalogArtworks.map((artwork) => ({ slug: artwork.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const artwork = catalogArtworks.find((item) => item.slug === slug);
  if (!artwork) return { title: "Opera non trovata" };

  const title = `${artwork.title} · ${artwork.code}`;
  const description = `${artwork.description} ${artwork.access === "commercial-original" ? `Opera originale GiWise Studio, ${artwork.priceLabel}.` : artwork.kindLabel === "Arte originale" ? "Opera originale GiWise Studio in sola esposizione." : "Fan art protetta in sola esposizione."}`;
  const socialImage = artwork.sensitive ? adultCover : artwork.image;
  const socialAlt = artwork.sensitive ? "Sigillo illustrato per un contenuto artistico riservato agli adulti" : `Anteprima protetta di ${artwork.title}`;

  return {
    title,
    description,
    openGraph: { title, description, type: "article", images: [{ url: socialImage, alt: socialAlt }] },
    twitter: { card: "summary_large_image", title, description, images: [socialImage] },
  };
}

function navigationImage(artwork: CatalogArtwork) {
  return artwork.sensitive ? adultCover : artwork.image;
}

function artworkSeal(artwork: CatalogArtwork) {
  return artwork.access === "commercial-original" ? originalSeal : fanartSeal;
}

export default async function ArtworkPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const artworkIndex = catalogArtworks.findIndex((item) => item.slug === slug);
  if (artworkIndex < 0) notFound();

  const artwork = catalogArtworks[artworkIndex];
  const previous = artworkIndex > 0 ? catalogArtworks[artworkIndex - 1] : null;
  const next = artworkIndex < catalogArtworks.length - 1 ? catalogArtworks[artworkIndex + 1] : null;
  const relatedArtworks = catalogArtworks.filter((item) => item.slug !== artwork.slug && item.genre === artwork.genre).slice(0, 3);
  const seal = artworkSeal(artwork);

  return (
    <main className="artwork-page">
      <div className="shell artwork-breadcrumbs">
        <Link href="/arte">← Torna ad Arte in Vetrina</Link>
        <span>Archivio {String(artworkIndex + 1).padStart(2, "0")} / {catalogArtworks.length}</span>
      </div>

      <article className="shell artwork-detail">
        <ArtworkVisual artwork={artwork} />
        <Image className="artwork-dossier-divider" src={dossierDivider} alt="" width={96} height={604} unoptimized />

        <div className="artwork-detail-content">
          <header className="artwork-dossier-header">
            <div className="artwork-dossier-identity">
              <Image src={seal} alt="" width={256} height={256} unoptimized />
              <span><small>{artwork.kindLabel}</small><strong>{artwork.code}</strong></span>
            </div>
            <h1>{artwork.title}</h1>
            <p className="artwork-dossier-line">{artwork.year} · {artwork.genre} · {artwork.accessLabel}</p>
          </header>

          {artwork.contentWarning ? <strong className={`artwork-content-warning${artwork.sensitive ? " artwork-content-warning-adult" : ""}`}>{artwork.contentWarning}</strong> : null}

          <section className="artwork-dossier-section artwork-description" aria-labelledby="artwork-description-title">
            <span className="artwork-chapter-number">01</span>
            <div>
              <p className="eyebrow">Descrizione</p>
              <h2 id="artwork-description-title">L’opera</h2>
              <p>{artwork.description}</p>
            </div>
          </section>

          <section className="artwork-dossier-section artwork-facts" aria-labelledby="artwork-facts-title">
            <span className="artwork-chapter-number">02</span>
            <div>
              <p className="eyebrow">Scheda tecnica</p>
              <h2 id="artwork-facts-title">Dati d’archivio</h2>
              <dl>
                <div><dt>Anno</dt><dd>{artwork.year}</dd></div>
                <div><dt>Tecnica</dt><dd>{artwork.technique}</dd></div>
                <div><dt>Tipo</dt><dd>{artwork.kindLabel}</dd></div>
                <div><dt>Genere</dt><dd>{artwork.genre}</dd></div>
                <div><dt>Categoria</dt><dd>{artwork.category}</dd></div>
                <div><dt>Codice archivio</dt><dd>{artwork.code}</dd></div>
                <div><dt>Edizione digitale</dt><dd>{artwork.nativeResolution ?? "Anteprima espositiva protetta"}</dd></div>
              </dl>
            </div>
          </section>

          <section className="artwork-dossier-section artwork-provenance" aria-labelledby="artwork-provenance-title">
            <span className="artwork-chapter-number">03</span>
            <div>
              <p className="eyebrow">Provenienza</p>
              <h2 id="artwork-provenance-title">{artwork.kindLabel === "Arte originale" ? "Autenticità GiWise Studio" : "Tributo non commerciale"}</h2>
              <div className="artwork-authenticity">
                <Image src={seal} alt="" width={256} height={256} unoptimized />
                <div>
                  {artwork.kindLabel === "Arte originale" ? (
                    <>
                      <strong>Ideata, disegnata e realizzata da GiWise Studio</strong>
                      <p>Paternità e diritto d’autore restano all’autore. {artwork.access === "commercial-original" ? `L’eventuale acquisizione include un certificato digitale nominativo associato al codice ${artwork.code}.` : `L’opera è archiviata con il codice ${artwork.code} e resta volutamente in sola esposizione.`}</p>
                    </>
                  ) : (
                    <>
                      <strong>Opera espositiva realizzata da GiWise Studio</strong>
                      <p>Il personaggio e i relativi diritti appartengono ai rispettivi titolari. La scheda documenta il tributo, senza vendita, licenza o download.</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="artwork-dossier-section artwork-access" aria-labelledby="artwork-access-title">
            <span className="artwork-chapter-number">04</span>
            <div>
              <p className="eyebrow">Edizione e licenza</p>
              {artwork.priceLabel ? (
                <>
                  <div className="artwork-acquisition-heading">
                    <small>{artwork.priceTierLabel}</small>
                    <h2 id="artwork-access-title">Acquisisci l’opera</h2>
                    <strong>{artwork.priceLabel}</strong>
                  </div>
                  <dl className="artwork-edition-facts">
                    <div><dt>File</dt><dd>PNG appiattito senza filigrana</dd></div>
                    <div><dt>Risoluzione</dt><dd>{artwork.nativeResolution}</dd></div>
                    <div><dt>Licenza</dt><dd>Personale, nominativa e non trasferibile</dd></div>
                    <div><dt>Abbonamento</dt><dd>{artwork.membershipAccess}</dd></div>
                    <div><dt>Consegna</dt><dd>Collegamento privato 48 ore · massimo 3 tentativi</dd></div>
                  </dl>
                  <ArtworkPurchaseButton productCode={artwork.code} priceLabel={artwork.priceLabel} />
                  <Link className="artwork-package-preview-link" href={`/arte/${artwork.slug}/pacchetto`}>Guarda cosa riceverai e prova il download <span aria-hidden="true">→</span></Link>
                  <details className="artwork-license-conditions">
                    <summary>Consulta le condizioni complete</summary>
                    <div>
                      <section><h3>Uso consentito</h3><ul><li>Uso personale su dispositivi e profili privati.</li><li>Una stampa fisica per uso personale.</li><li>Conservazione nella propria collezione digitale.</li></ul></section>
                      <section><h3>Uso vietato</h3><ul><li>Rivendita, merchandising o sfruttamento commerciale.</li><li>NFT, sublicenza o redistribuzione del file.</li><li>Addestramento di sistemi di intelligenza artificiale.</li></ul></section>
                    </div>
                  </details>
                  <Link href="/licenza-arte">Leggi la licenza personale completa <span aria-hidden="true">→</span></Link>
                </>
              ) : (
                <>
                  <h2 id="artwork-access-title">Opera in sola esposizione</h2>
                  <div className="artwork-exhibition-note">
                    <Image src={seal} alt="" width={256} height={256} unoptimized />
                    <p>Questa opera resta visibile esclusivamente come anteprima protetta. Non sono previsti prezzo, licenza personale o download.</p>
                  </div>
                </>
              )}
            </div>
          </section>
        </div>
      </article>

      <ArtworkCommunity artworkCode={artwork.code} artworkTitle={artwork.title ?? artwork.code} />

      {relatedArtworks.length > 0 ? (
        <section className="shell artwork-related-wide" aria-labelledby="artwork-related-title">
          <header><div><p className="eyebrow">Dallo stesso immaginario</p><h2 id="artwork-related-title">Altre opere in {artwork.genre}</h2></div><span>Selezione curatoriale · 03 opere</span></header>
          <div>
            {relatedArtworks.map((related) => (
              <Link href={`/arte/${related.slug}`} key={related.code}>
                <Image src={navigationImage(related)} alt={related.sensitive ? "Copertura 18+" : `Anteprima protetta di ${related.title}`} width={560} height={760} unoptimized />
                <span><small>{related.code} · {related.year}</small><strong>{related.title}</strong><em>{related.priceLabel ?? "Solo esposizione"}</em></span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <nav className="shell artwork-pagination-wide" aria-label="Navigazione tra le opere">
        {previous ? <Link href={`/arte/${previous.slug}`}><Image src={navigationImage(previous)} alt="" width={220} height={300} unoptimized /><span><small>Opera precedente</small><strong>{previous.title}</strong><em>{previous.code}</em></span></Link> : <span />}
        <Link className="artwork-pagination-index" href="/arte">Indice delle {catalogArtworks.length} opere</Link>
        {next ? <Link href={`/arte/${next.slug}`}><span><small>Opera successiva</small><strong>{next.title}</strong><em>{next.code}</em></span><Image src={navigationImage(next)} alt="" width={220} height={300} unoptimized /></Link> : <span />}
      </nav>
    </main>
  );
}
