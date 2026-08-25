import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CreativeJournalPhoto } from "@/components/CreativeJournalPhoto";
import { CreativeJournalSections } from "@/components/CreativeJournalSections";
import { GameJournalShowcase } from "@/components/GameJournalShowcase";
import { PassionsJournalShowcase } from "@/components/PassionsJournalShowcase";
import {
  commissionStories,
  gameJournalEntries,
  getCreativeJournalEntry,
  reinterpretationStories,
  studioSketches,
} from "@/lib/creativeJournal";

export const metadata: Metadata = {
  title: "Dove nascono i mondi",
  description: "Il diario creativo di GiWise Studio: bozze, tavoletta grafica, opere complete e videogiochi in costruzione.",
};

function StoryLink({ id, children = "Sfoglia la pagina" }: { id: string; children?: string }) {
  return <Link className="diary-story-link" href={`/dove-nascono-i-mondi/${id}`}>{children} <span aria-hidden="true">→</span></Link>;
}

export default function CreativeJournalPage() {
  const cyborg = getCreativeJournalEntry("protocollo-ambra-cyborg")!;
  const custode = getCreativeJournalEntry("custode-delle-due-lune")!;
  const scappa = getCreativeJournalEntry("scappa-finche-puoi")!;
  const vampire = getCreativeJournalEntry("ritratto-vampiresco")!;
  const commissionPortrait = commissionStories[0];
  const cartoonCover = getCreativeJournalEntry("mucca-e-pollo")!;
  const allReinterpretations = [...reinterpretationStories, ...studioSketches];

  return (
    <main className="diary-page">
      <section className="diary-cover" aria-labelledby="diary-title">
        <div className="shell diary-cover-inner">
          <div className="diary-cover-copy">
            <p className="diary-hand">Il mio diario creativo</p>
            <h1 id="diary-title">Dove nascono<br />i mondi</h1>
            <p>Disegni originali, ritratti su commissione, reinterpretazioni, passioni e giochi in lavorazione. Qui raccolgo le fasi che normalmente restano dietro il risultato finale.</p>
            <a href="#prime-pagine">Inizia a sfogliare <span aria-hidden="true">↓</span></a>
          </div>
          <div className="diary-cover-collage" aria-label="Disegno, cartoon e videogioco: tre pagine del diario">
            <CreativeJournalPhoto image={custode.processImages[0]} caption="Creazione originale" className="diary-cover-photo-one" priority />
            <CreativeJournalPhoto image={cartoonCover.processImages[0]} caption="Una pagina dedicata ai cartoon" className="diary-cover-photo-two" priority />
            <figure className="diary-cover-game">
              <Image src={gameJournalEntries[1].gallery[0].src} alt={gameJournalEntries[1].gallery[0].alt} width={2000} height={1250} sizes="(max-width: 760px) 54vw, 360px" priority unoptimized />
              <figcaption>Un mondo giocabile in costruzione</figcaption>
            </figure>
            <span className="diary-cover-scribble">idee che<br />prendono forma</span>
          </div>
        </div>
      </section>

      <section id="prime-pagine" className="diary-intro shell">
        <p className="diary-hand">Nessun risultato nasce già finito.</p>
        <div>
          <p>Le fotografie mostrano la penna, la tavoletta grafica, i riferimenti e anche le parti ancora incomplete. Non sono errori da nascondere: sono il percorso del lavoro.</p>
          <p>Ogni progetto ha una pagina propria, con fotografie, appunti e dettagli sul modo in cui è stato costruito. Quando un ricordo preciso manca, preferisco raccontare soltanto quello che so davvero.</p>
        </div>
      </section>

      <CreativeJournalSections label="Scegli un capitolo del diario" sections={[
        { id: "originali", label: "Creazioni originali", eyebrow: "01", content: (
      <section id="originali" className="diary-chapter" aria-labelledby="originals-title">
        <header className="shell diary-chapter-title">
          <span>Capitolo 01</span><h2 id="originals-title">Creazioni originali</h2><p>Quattro lavori nati da idee personali, raccontati attraverso immagini e informazioni confermate.</p>
        </header>

        <article className="diary-spread shell diary-spread-cyborg" aria-labelledby="cyborg-title">
          <div className="diary-page-sheet diary-page-left">
            <span className="diary-page-number">01</span>
            <CreativeJournalPhoto image={cyborg.processImages[2]} caption="Il percorso reale · tavoletta, schermo e figura completa" />
            <p className="diary-margin-note">Sei passaggi documentano il progetto senza mostrare né distribuire i file originali.</p>
          </div>
          <div className="diary-page-sheet diary-page-right">
            <span className="diary-page-number">02</span>
            <p className="diary-hand">Personaggio originale · fantascienza distopica</p>
            <h3 id="cyborg-title">{cyborg.title}</h3>
            <p>{cyborg.summary}</p>
            {cyborg.image ? <CreativeJournalPhoto image={cyborg.image} caption="Tavola completa · anteprima protetta" /> : null}
            <StoryLink id={cyborg.id}>Apri tutte le fasi</StoryLink>
          </div>
        </article>

        <article className="diary-spread shell diary-spread-custode" aria-labelledby="custode-title">
          <div className="diary-page-sheet diary-page-left">
            <span className="diary-page-number">01</span>
            <CreativeJournalPhoto image={custode.processImages[0]} caption="Prima fase · volto, capelli e parte bassa ancora aperta" />
            <p className="diary-margin-note">Due fotografie, due momenti reali dello stesso disegno.</p>
          </div>
          <div className="diary-page-sheet diary-page-right">
            <span className="diary-page-number">02</span>
            <p className="diary-hand">Personaggio originale</p>
            <h3 id="custode-title">{custode.title}</h3>
            <p>{custode.summary}</p>
            <CreativeJournalPhoto image={custode.processImages[1]} caption="Seconda fase · linee e neri più definiti" />
            <StoryLink id={custode.id} />
          </div>
        </article>

        <article className="diary-spread shell diary-spread-scappa" aria-labelledby="scappa-title">
          <div className="diary-page-sheet diary-page-left">
            <span className="diary-page-number">03</span><p className="diary-hand">Durante</p>
            <CreativeJournalPhoto image={scappa.processImages[0]} caption="Fotografia durante la lavorazione" />
          </div>
          <div className="diary-page-sheet diary-page-right">
            <span className="diary-page-number">04</span><p className="diary-hand">Risultato</p>
            {scappa.image ? <CreativeJournalPhoto image={scappa.image} caption="Opera completa · anteprima protetta" /> : null}
            <h3 id="scappa-title">{scappa.title}</h3>
            <p>{scappa.summary}</p>
            <StoryLink id={scappa.id} />
          </div>
        </article>

        <article className="diary-spread shell diary-spread-vampire" aria-labelledby="vampire-title">
          <div className="diary-page-sheet diary-page-left diary-text-page">
            <span className="diary-page-number">05</span><p className="diary-hand">Ritratto + soft horror</p>
            <h3 id="vampire-title">{vampire.title}</h3><p>{vampire.summary}</p>
            <p className="diary-margin-note">Un ritratto reale reinterpretato senza trasformarlo in una creatura estrema.</p>
            <StoryLink id={vampire.id} />
          </div>
          <div className="diary-page-sheet diary-page-right">
            <span className="diary-page-number">06</span>
            <CreativeJournalPhoto image={vampire.processImages[0]} caption="Ritratto reinterpretato sulla tavoletta grafica" />
          </div>
        </article>
      </section>
        ) },
        { id: "reinterpretazioni", label: "Reinterpretazioni", eyebrow: "02", content: (
      <section id="reinterpretazioni" className="diary-chapter diary-chapter-dark" aria-labelledby="reinterpretations-title">
        <header className="shell diary-chapter-title">
          <span>Capitolo 02</span><h2 id="reinterpretations-title">Reinterpretazioni</h2><p>Personaggi conosciuti ridisegnati con il mio tratto. Lavori personali e non ufficiali.</p>
        </header>
        <div className="diary-entry-grid shell">
          {allReinterpretations.map((entry, index) => (
            <article className="diary-entry-card" key={entry.id}>
              <CreativeJournalPhoto image={entry.processImages[0]} caption="Fotografia durante la lavorazione" />
              <div className="diary-entry-card-copy">
                <span className="diary-entry-number">{String(index + 1).padStart(2, "0")}</span>
                <p className="diary-hand">{entry.label}</p>
                <h3>{entry.shortTitle ?? entry.title}</h3>
                <p>{entry.summary}</p>
                <StoryLink id={entry.id} />
              </div>
            </article>
          ))}
        </div>
      </section>
        ) },
        { id: "commissioni", label: "Commissioni", eyebrow: "03", content: (
      <section id="commissioni-creative" className="diary-chapter diary-commission-chapter" aria-labelledby="commission-stories-title">
        <header className="shell diary-chapter-title">
          <span>Capitolo 03</span><h2 id="commission-stories-title">Ritratti su commissione</h2><p>Il percorso reale di un ritratto, dalla prima linea fino all’opera consegnata e conservata nel portfolio.</p>
        </header>
        <article className="shell diary-commission-story" aria-labelledby="commission-portrait-title">
          <div className="diary-commission-copy">
            <p className="diary-hand">Nove passaggi · uno sguardo</p>
            <h3 id="commission-portrait-title">{commissionPortrait.title}</h3>
            <p>{commissionPortrait.summary}</p>
            <StoryLink id={commissionPortrait.id}>Apri la sequenza completa</StoryLink>
          </div>
          <div className="diary-commission-sequence" aria-label="Tre momenti del ritratto, dalla prima linea al risultato">
            <CreativeJournalPhoto image={commissionPortrait.processImages[0]} caption={commissionPortrait.processCaptions?.[0] ?? "Prima fase"} />
            <CreativeJournalPhoto image={commissionPortrait.processImages[5]} caption={commissionPortrait.processCaptions?.[5] ?? "Line art"} />
            {commissionPortrait.image ? <CreativeJournalPhoto image={commissionPortrait.image} caption={commissionPortrait.finalCaption ?? "Opera completa"} /> : null}
          </div>
        </article>
      </section>
        ) },
        { id: "passioni", label: "Passioni", eyebrow: "04", content: (
      <section id="passioni" className="diary-loose-pages" aria-labelledby="passions-title">
        <header className="shell diary-chapter-title">
          <span>Capitolo 04</span><h2 id="passions-title">Qualcosa di me</h2><p>Prima dei disegni e dei giochi ci sono le passioni, le collezioni e lo spazio in cui passo gran parte del mio tempo.</p>
        </header>
        <div className="shell"><PassionsJournalShowcase /></div>
      </section>
        ) },
        { id: "giochi", label: "Giochi", eyebrow: "05", content: (
      <section id="giochi" className="diary-games" aria-labelledby="games-title">
        <header className="shell diary-chapter-title">
          <span>Capitolo 05</span><h2 id="games-title">Mondi in costruzione</h2><p>Il dietro le quinte continua nei videogiochi: schermate reali, stato corrente e lavoro ancora aperto.</p>
        </header>
        <div className="shell"><GameJournalShowcase games={gameJournalEntries} /></div>
      </section>
        ) },
      ]} />

      <section className="diary-back-cover">
        <div className="shell"><p className="diary-hand">Il diario resta aperto.</p><h2>Ogni nuova bozza può diventare una nuova pagina.</h2><p>Quando ritrovo una fotografia, ricordo un passaggio importante o porto avanti un progetto, il diario cresce insieme al lavoro. Non deve essere perfetto: deve raccontare un percorso vero.</p><Link href="/arte">Vai all’archivio delle opere <span aria-hidden="true">→</span></Link></div>
      </section>
    </main>
  );
}
