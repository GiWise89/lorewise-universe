import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { commissionWorks } from "@/lib/commissionCatalog";

export function generateStaticParams() {
  return commissionWorks.map((work) => ({ slug: work.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const work = commissionWorks.find((item) => item.slug === slug);
  if (!work) return { title: "Commissione non trovata" };
  return {
    title: `${work.title} · ${work.code}`,
    description: `${work.description} Lavoro realizzato su commissione da GiWise Studio.`,
    openGraph: { title: work.title, description: work.description, images: [{ url: work.image, alt: `Anteprima protetta di ${work.title}` }] },
  };
}

export default async function CommissionWorkPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const index = commissionWorks.findIndex((work) => work.slug === slug);
  if (index < 0) notFound();
  const work = commissionWorks[index];
  const related = commissionWorks.filter((item) => item.slug !== slug && item.category === work.category).slice(0, 3);
  const previous = index > 0 ? commissionWorks[index - 1] : null;
  const next = index < commissionWorks.length - 1 ? commissionWorks[index + 1] : null;

  return (
    <main className="commission-detail-page">
      <div className="shell commission-detail-breadcrumbs">
        <Link href="/commissioni?view=portfolio#portfolio">← Torna alle commissioni</Link>
        <span>{work.code} · {String(index + 1).padStart(2, "0")} / {commissionWorks.length}</span>
      </div>

      <article className="shell commission-detail">
        <div className="commission-detail-visual">
          <Image src={work.image} alt={`Anteprima protetta di ${work.title}`} width={1131} height={1600} unoptimized priority />
          <p>Anteprima pubblica ridotta · Filigrana incorporata</p>
        </div>
        <div className="commission-detail-copy">
          <header>
            <small>Commissione realizzata · {work.code}</small>
            <h1>{work.title}</h1>
            <p>{work.requestType} · {work.category}</p>
          </header>

          <section>
            <p className="eyebrow">Il progetto</p>
            <h2>Una richiesta trasformata in ritratto.</h2>
            <p>{work.description}</p>
          </section>

          <section>
            <p className="eyebrow">Scheda del lavoro</p>
            <h2>Dettagli documentati</h2>
            <dl className="commission-detail-facts">
              <div><dt>Tipo di richiesta</dt><dd>{work.requestType}</dd></div>
              <div><dt>Categoria</dt><dd>{work.category}</dd></div>
              <div><dt>Tecnica</dt><dd>{work.technique}</dd></div>
              <div><dt>Anno</dt><dd>{work.year}</dd></div>
              <div><dt>Archivio sorgente</dt><dd>{work.resolution}</dd></div>
              <div><dt>Stato</dt><dd>Lavoro consegnato · Portfolio</dd></div>
            </dl>
          </section>

          <section>
            <p className="eyebrow">Diritti e disponibilità</p>
            <h2>Un esempio, non un prodotto.</h2>
            {work.fanArt ? (
              <p>Fan art non ufficiale realizzata su commissione. Il soggetto e i relativi diritti appartengono ai rispettivi titolari. L’opera è mostrata esclusivamente come esempio del lavoro svolto.</p>
            ) : (
              <p>Opera già realizzata per un committente ed esposta come esempio del servizio GiWise Studio. Non è disponibile per acquisto, licenza, ristampa o download.</p>
            )}
          </section>

          <aside className="commission-similar-cta">
            <span>Ti piace questa direzione?</span>
            <h2>Richiedi un lavoro simile.</h2>
            <p>Indica il codice <strong>{work.code}</strong> nel modulo: servirà come riferimento stilistico, senza copiare il lavoro originale.</p>
            <Link className="button button-primary" href={`/commissioni?request=preventivo&reference=${encodeURIComponent(work.code)}#richiesta`}>Inizia la tua richiesta</Link>
          </aside>
        </div>
      </article>

      {related.length > 0 ? (
        <section className="shell commission-related" aria-labelledby="commission-related-title">
          <header><p className="eyebrow">Percorso correlato</p><h2 id="commission-related-title">Altri lavori della stessa categoria.</h2></header>
          <div>{related.map((item) => <Link href={`/commissioni/${item.slug}`} key={item.code}><Image src={item.image} alt={`Anteprima protetta di ${item.title}`} width={1131} height={1600} unoptimized /><span><small>{item.code}</small><strong>{item.title}</strong><em>{item.requestType}</em></span></Link>)}</div>
        </section>
      ) : null}

      <nav className="shell commission-pagination" aria-label="Navigazione tra i lavori su commissione">
        {previous ? <Link href={`/commissioni/${previous.slug}`}><small>← Lavoro precedente</small><strong>{previous.title}</strong></Link> : <span />}
        <Link href="/commissioni?view=portfolio#portfolio">Indice completo</Link>
        {next ? <Link href={`/commissioni/${next.slug}`}><small>Lavoro successivo →</small><strong>{next.title}</strong></Link> : <span />}
      </nav>
    </main>
  );
}
