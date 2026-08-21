import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = { title: "Pacchetti e licenza Arte" };

const packages = [
  {
    number: "01",
    name: "Essenziale",
    price: "8,90 €",
    description: "L’opera nella sua risoluzione nativa, pronta per l’uso personale.",
    contents: [
      "File PNG appiattito alla risoluzione nativa, senza ingrandimenti artificiali",
      "Nessuna filigrana diagonale; firma GiWise Studio discreta conservata",
      "Licenza personale allegata al download",
    ],
  },
  {
    number: "02",
    name: "Dettagliata",
    price: "12,90 €",
    description: "Il file nativo con una versione compatibile e un adattamento per schermo.",
    contents: [
      "Tutto ciò che è incluso nel pacchetto Essenziale",
      "Copia JPG ad alta qualità, derivata dal PNG e predisposta per la compatibilità",
      "Un ritaglio per schermo scelto tra i formati disponibili",
    ],
  },
  {
    number: "03",
    name: "Premium",
    price: "17,90 €",
    description: "L’edizione più completa, accompagnata da certificazione nominativa.",
    contents: [
      "File PNG nativo e copia JPG compatibile",
      "Due adattamenti per schermo scelti tra i formati disponibili",
      "Certificato digitale nominativo con identificativo di licenza",
    ],
  },
];

const allowedUses = [
  "Conservare l’opera sui propri dispositivi e usarla come sfondo personale.",
  "Realizzare fino a 3 stampe fisiche esclusivamente per uso personale.",
  "Usare una versione ridotta come immagine profilo, citando GiWise Studio.",
];

const prohibitedUses = [
  "Rivendere, redistribuire, condividere o pubblicare online il file in piena risoluzione.",
  "Usare l’opera su merchandising, pubblicità, loghi o altri progetti commerciali.",
  "Creare o associare NFT, concedere sublicenze o trasferire la licenza ad altre persone.",
  "Usare l’opera per addestrare sistemi di intelligenza artificiale o inserirla in dataset.",
  "Rimuovere firma, informazioni sul diritto d’autore o metadati di identificazione.",
];

export default function ArtLicensePage() {
  return (
    <main className="art-license-page">
      <section className="license-hero" aria-labelledby="license-title">
        <div className="shell license-hero-inner">
          <div>
            <p className="eyebrow">Pacchetti e protezione · Bozza locale pre-lancio</p>
            <h1 id="license-title">L’opera arriva completa. I diritti restano all’autore.</h1>
            <p>Questa pagina definisce cosa riceverà l’acquirente, come potrà usare il file e come verrà protetto il download. Nessun acquisto o collegamento privato è ancora attivo.</p>
          </div>
          <Image src="/brand/icons/arte-concept-v1.webp" alt="Emblema illustrato di Arte in Vetrina" width={1224} height={1285} unoptimized priority />
        </div>
      </section>

      <section className="license-packages shell" aria-labelledby="packages-title">
        <div className="license-section-heading">
          <p className="eyebrow">Acquisto singolo</p>
          <h2 id="packages-title">Tre livelli, senza promettere file che non esistono.</h2>
          <p>I file di partenza sono PNG appiattiti. Verranno consegnati alla loro risoluzione nativa: nessun ingrandimento artificiale e nessun file sorgente modificabile o a livelli.</p>
        </div>
        <div className="license-package-list">
          {packages.map((item) => (
            <article key={item.name}>
              <span>{item.number}</span>
              <div><p>{item.description}</p><h3>{item.name}</h3></div>
              <strong>{item.price}</strong>
              <ul>{item.contents.map((content) => <li key={content}>{content}</li>)}</ul>
            </article>
          ))}
        </div>
        <p className="license-color-note"><strong>Nota colore:</strong> i PNG sorgente non dichiarano un profilo ICC incorporato. Prima dell’attivazione commerciale verificheremo la resa e standardizzeremo soltanto le copie JPG derivate, conservando intatti gli originali.</p>
      </section>

      <section className="personal-license" aria-labelledby="personal-license-title">
        <div className="shell personal-license-inner">
          <div className="personal-license-intro">
            <p className="eyebrow">Licenza personale GiWise Studio</p>
            <h2 id="personal-license-title">Acquistare il file non trasferisce il diritto d’autore.</h2>
            <p>L’acquisto concede una licenza personale, non esclusiva e non trasferibile. Proprietà intellettuale e diritto d’autore restano a GiWise Studio.</p>
          </div>
          <div className="license-uses">
            <section aria-labelledby="allowed-title"><h3 id="allowed-title">Uso consentito</h3><ol>{allowedUses.map((use) => <li key={use}>{use}</li>)}</ol></section>
            <section aria-labelledby="prohibited-title"><h3 id="prohibited-title">Uso vietato</h3><ol>{prohibitedUses.map((use) => <li key={use}>{use}</li>)}</ol></section>
          </div>
        </div>
      </section>

      <section className="protected-delivery shell" aria-labelledby="delivery-title">
        <div className="license-section-heading">
          <p className="eyebrow">Consegna protetta</p>
          <h2 id="delivery-title">La vetrina mostra l’anteprima. Il file acquistato viaggia in privato.</h2>
        </div>
        <ol>
          <li><strong>Anteprima pubblica</strong><span>Solo copia ridotta con la filigrana predefinita LoreWise Universe | GiWise Studio.</span></li>
          <li><strong>Collegamento privato</strong><span>Il file acquistato non sarà esposto con un indirizzo pubblico permanente.</span></li>
          <li><strong>Validità limitata</strong><span>Il collegamento resterà valido per 48 ore e consentirà al massimo 3 tentativi di download.</span></li>
          <li><strong>Assistenza reale</strong><span>In caso di problema verificato, l’assistenza potrà generare un nuovo collegamento.</span></li>
          <li><strong>File consegnato</strong><span>Niente filigrana diagonale di anteprima; restano firma discreta e dati di tutela dell’opera.</span></li>
          <li><strong>Sorgenti protette</strong><span>Cartella originale, file di lavorazione e livelli non vengono mai pubblicati né consegnati.</span></li>
        </ol>
      </section>

      <section className="license-draft-warning">
        <div className="shell">
          <p className="eyebrow">Stato del documento</p>
          <h2>Una base chiara da revisionare prima della vendita pubblica.</h2>
          <p>Il testo è una bozza progettuale locale: prima di accettare pagamenti verrà trasformato in condizioni complete e sottoposto a revisione professionale.</p>
          <div><Link href="/arte">Torna alla vetrina <span aria-hidden="true">→</span></Link><Link href="/abbonamento">Consulta l’abbonamento <span aria-hidden="true">→</span></Link></div>
        </div>
      </section>
    </main>
  );
}
