import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CreativeJournalPhoto } from "@/components/CreativeJournalPhoto";
import { CreativeJournalSections } from "@/components/CreativeJournalSections";
import { creativeJournalEntries, getCreativeJournalEntry } from "@/lib/creativeJournal";

export function generateStaticParams() {
  return creativeJournalEntries.map((entry) => ({ slug: entry.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const entry = getCreativeJournalEntry(slug);
  if (!entry) return { title: "Pagina del diario non trovata" };
  return { title: `${entry.title} · Dove nascono i mondi`, description: entry.summary };
}

export default async function CreativeJournalEntryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entryIndex = creativeJournalEntries.findIndex((item) => item.id === slug);
  if (entryIndex < 0) notFound();

  const entry = creativeJournalEntries[entryIndex];
  const previous = creativeJournalEntries[(entryIndex - 1 + creativeJournalEntries.length) % creativeJournalEntries.length];
  const next = creativeJournalEntries[(entryIndex + 1) % creativeJournalEntries.length];
  const gallery = [...entry.processImages, ...(entry.image ? [entry.image] : [])];
  const heroImage = entry.processImages[entry.heroImageIndex ?? 0] ?? entry.processImages[0];
  const cyborgSections = [
    { id: `${entry.id}-maschera`, label: "Nasce la maschera", eyebrow: "01", content: (
      <section className="journal-detail-story" aria-labelledby="cyborg-mask-title">
        <div className="shell journal-detail-story-grid">
          <div><p className="journal-kicker">01 · Primo segnale</p><h2 id="cyborg-mask-title">Il volto prima del corpo</h2><CreativeJournalPhoto image={entry.processImages[0]} caption="Studio iniziale · maschera e connessioni meccaniche" /></div>
          <div className="journal-detail-prose"><p>{entry.story[0]}</p><p>Il personaggio comincia da ciò che deve comunicare a distanza: orbite accese, struttura ossea e parti artificiali leggibili come un unico volto.</p></div>
        </div>
      </section>
    ) },
    { id: `${entry.id}-struttura`, label: "Corpo e struttura", eyebrow: "02", content: (
      <section className="journal-detail-gallery" aria-labelledby="cyborg-body-title">
        <div className="shell"><header><p className="journal-kicker">02 · Dalla testa alla silhouette</p><h2 id="cyborg-body-title">Il cyborg occupa lo spazio</h2></header>
          <div className="journal-detail-prose"><p>{entry.story[1]}</p></div>
          <div className="journal-gallery journal-gallery-3">
            <CreativeJournalPhoto image={entry.processImages[1]} caption="Figura completa · controllo delle proporzioni" />
            <CreativeJournalPhoto image={entry.processImages[2]} caption="La postazione reale durante la lavorazione" />
            <CreativeJournalPhoto image={entry.processImages[3]} caption="Line art ripulita · armatura, cappuccio e articolazioni" />
          </div>
        </div>
      </section>
    ) },
    { id: `${entry.id}-ambra`, label: "Protocollo colore", eyebrow: "03", content: (
      <section className="shell journal-detail-notes" aria-labelledby="cyborg-color-title">
        <header><p className="journal-kicker">03 · Il codice Ambra</p><h2 id="cyborg-color-title">Il colore diventa identità</h2></header>
        <div className="journal-detail-note-grid">
          <div className="journal-gallery journal-gallery-2">
            <CreativeJournalPhoto image={entry.processImages[4]} caption="Prima campitura · separazione delle superfici" />
            <CreativeJournalPhoto image={entry.processImages[5]} caption="Rifinitura · materiali, ombre e segni di usura" />
          </div>
          <div className="journal-detail-prose"><p>{entry.story[2]}</p><dl>{entry.facts.slice(2, 5).map((fact) => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl></div>
        </div>
      </section>
    ) },
    { id: `${entry.id}-risveglio`, label: "Tavola finale", eyebrow: "04", content: (
      <>
        <section className="journal-detail-gallery" aria-labelledby="cyborg-final-title">
          <div className="shell"><header><p className="journal-kicker">04 · Protocollo attivo</p><h2 id="cyborg-final-title">La tavola completa</h2></header>
            <div className="journal-gallery journal-gallery-1">{entry.image ? <CreativeJournalPhoto image={entry.image} caption="Protocollo Ambra · opera completa e anteprima protetta" /> : null}</div>
          </div>
        </section>
        <section className="shell journal-detail-actions" aria-label="Collegamento all'opera Protocollo Ambra">
          <div><p className="diary-hand">Dal diario all’archivio</p><h2>Il percorso resta visibile. L’originale resta protetto.</h2></div>
          {entry.artworkHref ? <Link href={entry.artworkHref}>Apri Protocollo Ambra nell’archivio <span aria-hidden="true">→</span></Link> : null}
        </section>
      </>
    ) },
  ];

  return (
    <main className="journal-detail">
      <nav className="shell journal-detail-nav" aria-label="Navigazione del diario">
        <Link href="/dove-nascono-i-mondi">← Torna al diario</Link>
        <span>Pagina {String(entryIndex + 1).padStart(2, "0")} / {String(creativeJournalEntries.length).padStart(2, "0")}</span>
      </nav>

      <article>
        <header className="shell journal-detail-hero">
          <div>
            <p className="diary-hand">{entry.label}</p>
            <h1>{entry.title}</h1>
            <p>{entry.summary}</p>
            <ul className="journal-tags" aria-label="Argomenti">{entry.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>
          </div>
          <CreativeJournalPhoto image={heroImage} caption={entry.heroImageIndex == null ? "Una fotografia reale della lavorazione" : "Una fase significativa della lavorazione"} priority />
        </header>

        <CreativeJournalSections variant="paper" label={`Sezioni della pagina dedicata a ${entry.title}`} sections={entry.id === "protocollo-ambra-cyborg" ? cyborgSections : [
          { id: `${entry.id}-racconto`, label: "Il progetto", eyebrow: "01", content: (
        <section className="journal-detail-story" aria-labelledby="story-title">
          <div className="shell journal-detail-story-grid">
            <div><p className="journal-kicker">01 · Il progetto</p><h2 id="story-title">Dietro il progetto</h2></div>
            <div className="journal-detail-prose">{entry.story.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
          </div>
        </section>
          ) },
          { id: `${entry.id}-appunti`, label: "Lavorazione", eyebrow: "02", content: (
        <section className="shell journal-detail-notes" aria-labelledby="notes-title">
          <header><p className="journal-kicker">02 · Appunti concreti</p><h2 id="notes-title">Dal primo tratto al risultato</h2></header>
          <div className="journal-detail-note-grid">
            <ol>{entry.process.map((step, index) => <li key={step}><span>{String(index + 1).padStart(2, "0")}</span><p>{step}</p></li>)}</ol>
            <dl>{entry.facts.map((fact) => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl>
          </div>
        </section>
          ) },
          { id: `${entry.id}-immagini`, label: "Immagini", eyebrow: "03", content: (
        <section className="journal-detail-gallery" aria-labelledby="gallery-title">
          <div className="shell"><header><p className="journal-kicker">03 · Le immagini</p><h2 id="gallery-title">Lavorazione e risultato</h2></header>
            <div className={`journal-gallery journal-gallery-${gallery.length}`}>
              {gallery.map((image, index) => <CreativeJournalPhoto key={`${image.src}-${index}`} image={image} caption={index < entry.processImages.length ? entry.processCaptions?.[index] ?? `Fase di lavorazione ${index + 1}` : entry.finalCaption ?? (entry.shopHref ? "Opera completa applicata al quadro" : "Risultato completo · anteprima protetta")} />)}
            </div>
          </div>
        </section>
          ) },
          ...((entry.artworkHref || entry.shopHref) ? [{ id: `${entry.id}-collegamenti`, label: "Collegamenti", eyebrow: "04", content: (<section className="shell journal-detail-actions" aria-label="Collegamenti al progetto">
          <div><p className="diary-hand">Continua a esplorare</p><h2>Il diario mostra il percorso. L’archivio conserva il lavoro.</h2></div>
          {entry.artworkHref ? <Link href={entry.artworkHref}>Apri l’opera nell’archivio <span aria-hidden="true">→</span></Link> : null}
          {entry.shopHref ? <a href={entry.shopHref} target="_blank" rel="noreferrer">Guarda il quadro su GiWise Shop <span aria-hidden="true">↗</span></a> : null}
        </section>) }] : []),
        ]} />
      </article>

      <nav className="journal-detail-next" aria-label="Altre pagine del diario">
        <Link href={`/dove-nascono-i-mondi/${previous.id}`}><span>Pagina precedente</span><strong>{previous.shortTitle ?? previous.title}</strong></Link>
        <Link href={`/dove-nascono-i-mondi/${next.id}`}><span>Pagina successiva</span><strong>{next.shortTitle ?? next.title}</strong></Link>
      </nav>
    </main>
  );
}
