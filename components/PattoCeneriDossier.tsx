"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import styles from "./PattoCeneriDossier.module.css";

type SectionId = "storia" | "rifugio" | "gameplay" | "nemici" | "stato";

const sections: Array<{ id: SectionId; label: string; kicker: string }> = [
  { id: "storia", label: "La storia", kicker: "Un mondo che ricorda" },
  { id: "rifugio", label: "Il Rifugio", kicker: "I nuovi personaggi" },
  { id: "gameplay", label: "Gameplay", kicker: "Forma il tuo Patto" },
  { id: "nemici", label: "I nemici", kicker: "La Corte del Rogo" },
  { id: "stato", label: "In lavorazione", kicker: "Il progetto cresce" },
];

const refugeCharacters = [
  {
    name: "Sevrana",
    title: "Cucitrice del Respiro",
    image: "/games/the-wound-remembers-il-patto-delle-ceneri/sevrana-cucitrice-del-respiro-v1.webp",
    text: "Medica ferite che nessun rimedio comune può chiudere. Le sue cure, protezioni e pozioni aiutano la compagnia prima e dopo ogni spedizione.",
  },
  {
    name: "Nemor",
    title: "Speziale del Vetro Nero",
    image: "/games/the-wound-remembers-il-patto-delle-ceneri/nemor-v1.webp",
    text: "Distilla veleni, bombe e preparati dalle sostanze raccolte nel mondo. Ogni scoperta può diventare una nuova risorsa contro la Corte.",
  },
  {
    name: "Edria",
    title: "Custode delle Memorie Perdute",
    image: "/games/the-wound-remembers-il-patto-delle-ceneri/edria-v1.webp",
    text: "Restituisce voce a ricordi cancellati e rivela legami nascosti. Chi conosce la cronaca precedente troverà echi delle proprie scelte, ma non è necessario averla giocata.",
  },
  {
    name: "Brannoc",
    title: "Pastore degli Impossibili",
    image: "/games/the-wound-remembers-il-patto-delle-ceneri/brannoc-v1.webp",
    text: "Accoglie, cura e addestra creature che tutti gli altri temono. Con lui i Famigli diventano compagni di esplorazione e non semplici strumenti.",
  },
];

const gameplay = [
  ["Prepara la compagnia", "Scegli quattro compagni, assegna il comando e costruisci una squadra capace di assalto, difesa, controllo e sostegno senza classi obbligatorie."],
  ["Esplora e decidi", "Attraversa regioni collegate, cerca vie nascoste e affronta incontri con dialogo, furtività, reputazione o forza."],
  ["Combatti a turni", "Leggi le intenzioni avversarie, usa coperture, ostacoli e pericoli ambientali, poi combina abilità e reazioni nel momento giusto."],
  ["Ritorna al Rifugio", "Porta a casa ricompense e conseguenze, migliora preparati e legami, accogli nuovi alleati e prepara la missione successiva."],
];

const villains = {
  valisandra: {
    name: "Valisandra",
    title: "La Grazia Marcia",
    intro: "Elegante, implacabile e sempre un passo avanti. Valisandra governa attraverso fascino, paura e promesse avvelenate. Comprendere che cosa desidera davvero sarà pericoloso quanto affrontarla.",
    image: "/games/the-wound-remembers-il-patto-delle-ceneri/valisandra-grazia-v3.webp",
  },
  vahrokh: {
    name: "Vahrokh",
    title: "Imperatore del Rogo Profondo",
    intro: "Il sovrano che trasforma promesse e debiti in catene. Vahrokh domina la Corte del Rogo con una presenza mostruosa e un potere di cui nessuno conosce ancora il vero limite.",
    image: "/games/the-wound-remembers-il-patto-delle-ceneri/vahrokh-sovrano-v3.webp",
  },
} as const;

function VillainCard({ villain }: { villain: (typeof villains)[keyof typeof villains] }) {
  return <article className={styles.villainCard}>
    <figure className={styles.villainArt}>
      <Image src={villain.image} alt={villain.name} fill sizes="(max-width: 760px) 86vw, 36vw" unoptimized />
    </figure>
    <div className={styles.villainCopy}>
      <p className={styles.eyebrow}>{villain.title}</p>
      <h3>{villain.name}</h3>
      <p>{villain.intro}</p>
    </div>
  </article>;
}

export function PattoCeneriDossier() {
  const [activeSection, setActiveSection] = useState<SectionId>("storia");
  const section = sections.find((item) => item.id === activeSection) ?? sections[0];

  return <main className={styles.page}>
    <header className={styles.topbar}>
      <Link href="/giochi">← Torna a Giochi e App</Link>
      <span>GS-GAME-002</span>
    </header>

    <section className={styles.hero} aria-labelledby="patto-title">
      <Image src="/games/the-wound-remembers-il-patto-delle-ceneri/key-art-v2.webp" alt="I protagonisti e i nemici del Patto delle Ceneri" fill priority sizes="100vw" unoptimized />
      <div className={styles.heroShade} aria-hidden="true" />
      <div className={styles.heroCopy}>
        <span className={styles.status}>In lavorazione</span>
        <p className={styles.eyebrow}>Un nuovo capitolo di The Wound Remembers</p>
        <h1 id="patto-title">Il Patto<br />delle Ceneri</h1>
        <p>Quattro compagni. Un Rifugio da difendere. Un impero che trasforma ogni promessa in una catena.</p>
        <button type="button" onClick={() => setActiveSection("storia")}>Apri il dossier</button>
      </div>
    </section>

    <nav className={styles.switcher} aria-label="Sezioni del dossier" role="tablist">
      {sections.map((item, index) => <button
        type="button"
        role="tab"
        aria-selected={activeSection === item.id}
        aria-controls={`patto-panel-${item.id}`}
        onClick={() => setActiveSection(item.id)}
        key={item.id}
      ><small>0{index + 1}</small><span>{item.label}</span></button>)}
    </nav>

    <section className={styles.dossier} id={`patto-panel-${activeSection}`} role="tabpanel" aria-live="polite">
      <header className={styles.sectionHeading}>
        <p className={styles.eyebrow}>{section.kicker}</p>
        <h2>{section.label}</h2>
      </header>

      {activeSection === "storia" ? <div className={styles.storyGrid}>
        <div>
          <h3>La vittoria non ha guarito il mondo.</h3>
          <p>Le cicatrici lasciate da <em>The Wound Remembers</em> hanno dato origine a nuovi culti, sovrani e creature. La Corte del Rogo avanza tra regni indeboliti, mentre nomi, ricordi e giuramenti diventano strumenti di dominio.</p>
          <p>Nel Rifugio nasce un nuovo Patto: una compagnia costruita da persone che non avrebbero mai scelto di combattere insieme. Ogni missione decide chi salvare, chi affrontare e quale parte del passato merita ancora un futuro.</p>
        </div>
        <aside>
          <strong>Una nuova storia, aperta a tutti</strong>
          <p>Non serve aver giocato il capitolo precedente. Un riepilogo introduce il mondo; chi conosce la prima cronaca riconoscerà conseguenze e scelte sopravvissute.</p>
        </aside>
      </div> : null}

      {activeSection === "rifugio" ? <div className={styles.characterGrid}>
        {refugeCharacters.map((character) => <article key={character.name}>
          <figure><Image src={character.image} alt={`${character.name}, ${character.title}`} fill sizes="(max-width: 760px) 42vw, 20vw" unoptimized /></figure>
          <div><p className={styles.eyebrow}>{character.title}</p><h3>{character.name}</h3><p>{character.text}</p></div>
        </article>)}
      </div> : null}

      {activeSection === "gameplay" ? <div className={styles.gameplayGrid}>
        {gameplay.map((item, index) => <article key={item[0]}><span>0{index + 1}</span><div><h3>{item[0]}</h3><p>{item[1]}</p></div></article>)}
        <aside>
          <strong>Quello che potrai fare</strong>
          <ul>
            <li>Guidare una compagnia di quattro personaggi.</li>
            <li>Affrontare missioni con più soluzioni e conseguenze.</li>
            <li>Creare sinergie tra abilità, relazioni e Famigli.</li>
            <li>Sfruttare ambiente, coperture e intenzioni nemiche.</li>
            <li>Reclutare alleati e far crescere il Rifugio.</li>
          </ul>
        </aside>
      </div> : null}

      {activeSection === "nemici" ? <div className={styles.villainGrid}>
        <VillainCard villain={villains.valisandra} />
        <VillainCard villain={villains.vahrokh} />
      </div> : null}

      {activeSection === "stato" ? <div className={styles.statusPanel}>
        <div>
          <span className={styles.status}>In lavorazione</span>
          <h3>Il Patto sta prendendo forma.</h3>
          <p>Storia, personaggi, combattimenti, esplorazione e vita nel Rifugio stanno crescendo come parti della stessa avventura. Mostreremo nuove immagini e informazioni soltanto quando saranno pronte per essere condivise.</p>
        </div>
        <div className={styles.statusFacts}>
          <p><span>Genere</span><strong>GDR tattico dark fantasy</strong></p>
          <p><span>Esperienza</span><strong>Storia, esplorazione e battaglie a turni</strong></p>
          <p><span>Lingua</span><strong>Italiano</strong></p>
          <p><span>Disponibilità</span><strong>Da annunciare</strong></p>
        </div>
        <Link href="/cronache-del-nexus">Segui le novità dal Nexus →</Link>
      </div> : null}
    </section>
  </main>;
}
