import Image from "next/image";
import { CreativeJournalSections } from "@/components/CreativeJournalSections";

const passionsPath = "/creative-journal/passions";

function PassionPhoto({
  src,
  alt,
  caption,
  portrait = false,
}: {
  src: string;
  alt: string;
  caption: string;
  portrait?: boolean;
}) {
  return (
    <figure className={`passion-photo${portrait ? " passion-photo-portrait" : ""}`}>
      <Image
        src={`${passionsPath}/${src}`}
        alt={alt}
        width={portrait ? 900 : 1600}
        height={portrait ? 1200 : 1067}
        sizes={portrait ? "(max-width: 760px) 88vw, 420px" : "(max-width: 760px) 92vw, 760px"}
        unoptimized
      />
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

export function PassionsJournalShowcase() {
  return (
    <div className="passions-journal">
      <CreativeJournalSections
      variant="paper"
      label="Scegli una pagina dedicata a GiWise e alle sue passioni"
      sections={[
        {
          id: "passioni-chi-sono",
          label: "Chi sono",
          eyebrow: "01",
          content: (
            <section className="passion-panel passion-about" aria-labelledby="passion-about-title">
              <PassionPhoto
                src="giwise-ritratto.webp"
                alt="Ritratto spontaneo di GiWise nel suo spazio creativo"
                caption="Sono GiWise · nel posto in cui prendono forma molte delle mie idee"
                portrait
              />
              <div className="passion-copy">
                <p className="diary-hand">Piacere, GiWise.</p>
                <h3 id="passion-about-title">Disegno quello che ho dentro.</h3>
                <p>Mi chiamo GiWise, sono classe 1989. Sono un disegnatore autodidatta e da poco mi sono lanciato anche nello sviluppo di videogiochi: ci sto provando, quindi siate buoni XD. Mi considero un nerd patentato.</p>
                <p>Amo videogiochi, anime, manga e film horror. Ho una vera ossessione per Baldur&apos;s Gate 3, per il mondo di IT e soprattutto per Pennywise. Adoro anche l&apos;universo di Naruto e la mia serie animata preferita è South Park.</p>
                <p>Amo l&apos;arte creepy, i tatuaggi — ne ho 34 — e stare in compagnia di me stesso. Non significa che non mi piaccia stare con gli altri: a volte ho semplicemente bisogno del mio spazio. È proprio lì che molte idee iniziano a prendere forma.</p>
              </div>
            </section>
          ),
        },
        {
          id: "passioni-spazio-creativo",
          label: "Spazio creativo",
          eyebrow: "02",
          content: (
            <section className="passion-panel passion-workspace" aria-labelledby="passion-workspace-title">
              <div className="passion-copy">
                <p className="diary-hand">La mia postazione</p>
                <h3 id="passion-workspace-title">Disegno e codice nello stesso spazio.</h3>
                <p>Questa è la postazione in cui passo dal disegno alla programmazione. Lavoro con una tavoletta grafica con schermo: da una parte costruisco personaggi e illustrazioni, dall&apos;altra scrivo codice, provo idee e correggo quello che non funziona.</p>
                <p>Non è uno spazio da esposizione perfetto. È vissuto, pieno di riferimenti e cambia insieme ai progetti. Molte delle cose che colleziono restano vicine mentre lavoro e finiscono, direttamente o indirettamente, in ciò che creo.</p>
              </div>
              <PassionPhoto
                src="postazione-creativa.webp"
                alt="La postazione di GiWise con monitor, tastiera e tavoletta grafica con schermo"
                caption="La mia postazione reale · tavoletta grafica, codice, prove e idee aperte"
              />
            </section>
          ),
        },
        {
          id: "passioni-collezioni",
          label: "Collezioni",
          eyebrow: "03",
          content: (
            <section className="passion-panel" aria-labelledby="passion-collections-title">
              <header className="passion-section-heading">
                <p className="diary-hand">Collezionare mondi</p>
                <h3 id="passion-collections-title">Ogni mensola racconta qualcosa di me.</h3>
                <p>Non colleziono soltanto per mettere gli oggetti in fila. Ogni figura è legata a un personaggio, a una storia o a un periodo che mi è rimasto dentro. Insieme formano una specie di archivio personale, disordinato al punto giusto.</p>
              </header>
              <div className="passion-photo-grid">
                <PassionPhoto
                  src="collezione-cultura-pop.webp"
                  alt="Mensola con figure dedicate a videogiochi, animazione e cultura pop"
                  caption="Personaggi molto diversi convivono nella stessa collezione"
                />
                <PassionPhoto
                  src="musica-retrogaming.webp"
                  alt="Collezione con figure dedicate alla musica, cinema, console e videogiochi retrò"
                  caption="Musica, cinema e retrogaming: altre parti dello stesso immaginario"
                />
              </div>
            </section>
          ),
        },
        {
          id: "passioni-horror",
          label: "Horror",
          eyebrow: "04",
          content: (
            <section className="passion-panel" aria-labelledby="passion-horror-title">
              <header className="passion-section-heading">
                <p className="diary-hand">La parte più creepy</p>
                <h3 id="passion-horror-title">IT, Pennywise e il fascino dei mostri.</h3>
                <p>Il mondo di IT occupa uno spazio enorme tra le mie passioni: il libro, i film, la serie e soprattutto Pennywise. Non mi interessa soltanto lo spavento. Mi attirano il design, le trasformazioni, le espressioni e il confine tra qualcosa di familiare e qualcosa che mette a disagio.</p>
                <p>Anche per questo nei miei disegni tornano spesso incubi, demoni e creature. Metterli su una tela digitale è il mio modo di tirarli fuori dalla testa e guardarli da un&apos;altra prospettiva.</p>
              </header>
              <div className="passion-photo-grid passion-photo-grid-horror">
                <PassionPhoto
                  src="collezione-pennywise.webp"
                  alt="Parte della collezione di GiWise dedicata a Pennywise e IT"
                  caption="Una parte della collezione dedicata a IT"
                />
                <PassionPhoto
                  src="pennywise-dettaglio.webp"
                  alt="Dettaglio delle figure di Pennywise raccolte da GiWise"
                  caption="Versioni diverse dello stesso personaggio, ognuna con un carattere proprio"
                />
              </div>
            </section>
          ),
        },
        {
          id: "passioni-anime-giochi",
          label: "Anime e giochi",
          eyebrow: "05",
          content: (
            <section className="passion-panel" aria-labelledby="passion-anime-title">
              <header className="passion-section-heading">
                <p className="diary-hand">I mondi in cui torno</p>
                <h3 id="passion-anime-title">Naruto, videogiochi e animazione.</h3>
                <p>Naruto è uno degli universi che amo di più, dai personaggi al modo in cui parla di legami, crescita e ostinazione. I videogiochi mi accompagnano da sempre, mentre Baldur&apos;s Gate 3 è diventato una vera ossessione per la libertà con cui permette di vivere e cambiare una storia.</p>
                <p>Poi c&apos;è South Park, la mia serie animata preferita: irriverente, assurda e capace di dire molto più di quello che sembra. Sono passioni differenti, ma tutte alimentano il mio modo di disegnare e immaginare personaggi.</p>
              </header>
              <div className="passion-photo-grid">
                <PassionPhoto
                  src="collezione-naruto.webp"
                  alt="Collezione di GiWise dedicata ai personaggi di Naruto"
                  caption="Naruto occupa un posto speciale nella mia collezione"
                />
                <PassionPhoto
                  src="anime-videogiochi.webp"
                  alt="Figure dedicate ad anime e videogiochi nella stanza creativa di GiWise"
                  caption="Anime e videogiochi: personaggi con cui sono cresciuto"
                />
              </div>
            </section>
          ),
        },
        ]}
      />
    </div>
  );
}
