import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CreativeJournalSections } from "@/components/CreativeJournalSections";
import { HorizontalScrollHint } from "@/components/HorizontalScrollHint";
import { gameJournalEntries, getGameJournalEntry } from "@/lib/creativeJournal";

export function generateStaticParams() {
  return gameJournalEntries.map((game) => ({ slug: game.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const game = getGameJournalEntry(slug);
  if (!game) return { title: "Diario di sviluppo non trovato" };
  return { title: `${game.title} · Diario di sviluppo`, description: game.summary };
}

export default async function GameJournalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const game = getGameJournalEntry(slug);
  if (!game) notFound();

  return (
    <main className="game-journal-detail">
      <nav className="shell journal-detail-nav" aria-label="Navigazione del diario">
        <Link href="/dove-nascono-i-mondi">← Torna a Dove nascono i mondi</Link>
        <span>Diario di sviluppo</span>
      </nav>

      <header className="game-journal-hero">
        <Image src={game.gallery[0].src} alt="" fill sizes="100vw" priority unoptimized />
        <div className="game-journal-overlay" />
        <div className="shell game-journal-hero-copy">
          <p className="diary-hand">{game.label}</p><h1>{game.title}</h1><p>{game.summary}</p><strong>{game.status}</strong>
        </div>
      </header>

      <CreativeJournalSections variant="paper" label={`Diario di sviluppo di ${game.title}`} sections={[
        { id: `${game.id}-percorso`, label: "Mesi di lavoro", eyebrow: "01", content: (
          <section className="game-journal-panel shell" aria-labelledby="game-work-title">
            <div><p className="journal-kicker">Il lavoro dietro lo schermo</p><h2 id="game-work-title">Un gioco cresce per mesi, sistema dopo sistema.</h2></div>
            <div className="game-journal-copy"><p>Quello che si vede in una schermata è soltanto l’ultimo strato. Prima ci sono mesi passati a scrivere codice, correggere errori, provare regole, cambiare interfacce e controllare che ogni parte continui a funzionare insieme alle altre.</p><h3>Lavorazione attuale</h3><ul>{game.currentWork.map((item) => <li key={item}>{item}</li>)}</ul></div>
          </section>
        ) },
        { id: `${game.id}-stile`, label: "Stile e personaggi", eyebrow: "02", content: (
          <section className="game-journal-panel shell" aria-labelledby="game-style-title">
            <div><p className="journal-kicker">Scelte creative</p><h2 id="game-style-title">Disegnare un mondo che deve anche funzionare.</h2></div>
            <div className="game-journal-focus">{game.creativeFocus.map((item, index) => <article key={item}><span>0{index + 1}</span><p>{item}</p></article>)}</div>
          </section>
        ) },
        { id: `${game.id}-immagini`, label: "Schermate", eyebrow: "03", content: (
          <section className="game-journal-gallery shell" aria-labelledby="game-gallery-title">
            <header><p className="journal-kicker">Versione reale</p><h2 id="game-gallery-title">Più fasi dello stesso progetto.</h2><p>Menu, personaggi, battaglie e progressione mostrano parti diverse del lavoro.</p></header>
            <div>{game.gallery.map((image, index) => <figure key={image.src}><Image src={image.src} alt={image.alt} width={image.width} height={image.height} sizes="(max-width: 760px) 94vw, 46vw" unoptimized /><figcaption>Schermata {String(index + 1).padStart(2, "0")} · {image.alt}</figcaption></figure>)}</div>
          </section>
        ) },
        { id: `${game.id}-codice`, label: "Codice", eyebrow: "04", content: (
          <section className="game-journal-code shell" aria-labelledby="game-code-title">
            <div><p className="journal-kicker">Codice reale del progetto</p><h2 id="game-code-title">{game.code.title}</h2><p>Queste righe sono una piccola parte del sistema. Dietro ogni personaggio e ogni azione ci sono dati, condizioni, controlli e regole che il gioco deve risolvere senza fermarsi.</p></div>
            <figure><figcaption><span>{game.code.language}</span>{game.code.file}</figcaption><HorizontalScrollHint className="code-scroll-hint" /><pre><code>{game.code.snippet}</code></pre></figure>
          </section>
        ) },
      ]} />

      <section className="game-journal-footer"><div className="shell"><p className="diary-hand">Dal diario al gioco</p><h2>Guarda il progetto completo e il suo stato attuale.</h2><Link href={game.href}>Apri la scheda di {game.title} <span aria-hidden="true">→</span></Link></div></section>
    </main>
  );
}
