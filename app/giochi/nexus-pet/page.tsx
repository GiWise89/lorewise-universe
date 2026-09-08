import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Famigli del Nexus | Guida completa",
  description: "Scopri Casa, crescita, botteghe, missioni, spedizioni, campagna, Arena e Torre nella nuova area Famigli del Nexus.",
  alternates: { canonical: "/giochi/nexus-pet" },
  openGraph: { title: "Famigli del Nexus · Il tuo compagno nel Nexus", description: "La guida completa alla nuova esperienza Famigli del Nexus.", url: "/giochi/nexus-pet", images: [{ url: "/giochi/nexus-pet/01-primo-legame.webp", alt: "Il primo Legame con un Famiglio del Nexus" }] },
};

const chapters = [
  ["primo-legame", "01", "Il primo Legame"], ["casa", "02", "Casa e cura"],
  ["crescita", "03", "Crescita"], ["botteghe", "04", "Botteghe"],
  ["missioni", "05", "Missioni"], ["spedizioni", "06", "Spedizioni"],
  ["arena", "07", "Arena e Torre"], ["campagna", "08", "Campagna"],
  ["giochi-e-album", "09", "Giochi, Percorso e Album"],
] as const;

function GuideImage({ src, alt, caption }: { src: string; alt: string; caption: string }) {
  return <figure className={styles.figure}>
    <Image src={src} alt={alt} width={1440} height={1100} sizes="(max-width: 760px) 100vw, 58vw" unoptimized />
    <figcaption>{caption}</figcaption>
  </figure>;
}

export default function NexusPetGuidePage() {
  return <main className={styles.page}>
    <header className={styles.hero}>
      <div className={styles.heroGlow} aria-hidden="true" />
      <div className={`shell ${styles.heroGrid}`}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>GiWise Studio · Famigli del Nexus</p>
          <h1>Un compagno.<br />Una Casa.<br /><em>Il vostro Legame.</em></h1>
          <p>L’area Famigli è stata ricostruita come un compagno virtuale completo: scegli, accudisci, fai crescere e allena il tuo Famiglio in un’esperienza ambientata nel Nexus.</p>
          <div className={styles.actions}><Link href="/famiglio">Entra nell’area Famigli</Link><a href="#primo-legame">Scopri come funziona</a></div>
        </div>
        <GuideImage src="/giochi/nexus-pet/01-primo-legame.webp" alt="Gli otto Uova iniziali dei Famigli del Nexus" caption="Otto Uova iniziali, otto primi compagni da conoscere." />
      </div>
    </header>

    <nav className={styles.index} aria-label="Capitoli della guida Famigli del Nexus"><div className="shell">
      {chapters.map(([id, number, label]) => <a href={`#${id}`} key={id}><span>{number}</span>{label}</a>)}
    </div></nav>

    <section className={`shell ${styles.intro}`} id="giochi-e-album">
      <p className={styles.kicker}>Ogni giorno, una nuova avventura</p>
      <h2>Gioca, esplora e completa la tua collezione.</h2>
      <p>Premi Gioca nella Casa e scegli un minigioco: ogni icona apre le istruzioni, con la possibilità di tornare indietro prima di iniziare.</p>
      <ul>
        <li><strong>Insegui la luce:</strong> cattura la lucciola prima che scompaia; evita le caselle cacca.</li>
        <li><strong>Salto tra le nuvole:</strong> tocca per saltare, raccogli gemme ed evita i vuoti. Hai tre vite, senza limite di tempo.</li>
        <li><strong>Acchiappa-oggetti:</strong> spostati sulle quattro corsie per raccogliere stelle ed evitare spine.</li>
        <li><strong>Memoria delle rune:</strong> osserva e ascolta la sequenza, poi ripetila. Ogni casella ha una nota diversa.</li>
      </ul>
      <p>Tutti i minigiochi partono con 3 vite, senza timer generale. Perdi una vita se lasci scadere la lucciola o tocchi la cacca, cadi dalle nuvole, raccogli una spina o perdi una stella, oppure sbagli la sequenza delle rune. A zero vite la partita finisce. Le spine e le caselle cacca sottraggono anche un punto, senza portare il punteggio sotto zero.</p>
      <p>Musica ed effetti sono disattivabili. La prima partita completata assegna il premio giornaliero, condiviso fra i quattro giochi: da 8 a 28 monete. Le successive permettono di migliorare i record, anche nelle partite più lunghe.</p>
      <GuideImage src="/famiglio/rebuild/progression/lunar-islands-v2.png" alt="Mappa illustrata delle quattro tappe del Percorso" caption="Cura, gioco, spedizione e lotta: completa le quattro tappe nell’ordine che preferisci." />
      <p>Nel Percorso settimanale seleziona un’isola per leggere l’obiettivo e raggiungere l’attività. Completate tutte le tappe, apri il tesoro: 45 Monete Nexus e 2 Frammenti di Reliquia.</p>
      <p>Il Registro presenze segue un anno di quattro stagioni. Il premio raro del giorno 7 richiede almeno sette presenze consecutive. I 52 ricordi vanno nell’Album: puoi filtrare quelli ottenuti o mancanti e toccare ogni sagoma per conoscere il premio e la data di riscossione.</p>
      <p>Dopo la fine dell’anno puoi recuperare i ricordi mancanti: registra sette nuove presenze consecutive per ottenerne uno, in ordine di settimana e senza doppioni. Se salti un giorno la serie riparte, ma i ricordi ottenuti restano tuoi. Il recupero non assegna monete o consumabili aggiuntivi.</p>
      <p>Un set di 13 ricordi sblocca la cover indicata per il dispositivo. I ricordi sono collezionabili, non oggetti da usare durante le cure.</p>
    </section>

    <section className={`shell ${styles.intro}`} id="primo-legame">
      <p className={styles.kicker}>Benvenuti nella nuova area</p>
      <h2>Il Nexus non ti consegna semplicemente una creatura.<br /><em>Ti affida un compagno.</em></h2>
      <p>Scegli il tuo primo Uovo tra otto Famigli iniziali, attraversa le tre fasi del rituale e assisti alla schiusa dopo 120 secondi. Da quel momento il Famiglio avrà identità, Casa, bisogni, progressione e capacità da sviluppare.</p>
      <div className={styles.milestones}><span>Scegli l’Uovo</span><i /><span>Vivi il rituale</span><i /><span>Accogli il Famiglio</span><i /><span>Costruisci il Legame</span></div>
      <p className={styles.highlight}>Puoi gestire fino a tre Famigli, ciascuno con la propria Casa, la propria vita e un percorso separato.</p>
    </section>

    <section className={styles.chapter} id="casa"><div className={`shell ${styles.grid}`}>
      <GuideImage src="/giochi/nexus-pet/02-casa-e-cura.webp" alt="Casa personale del Famiglio con bisogni e azioni di cura" caption="La Casa reagisce alle attenzioni, alle necessità e al momento della giornata." />
      <div className={styles.copy}><p className={styles.number}>02 · Una Casa viva</p><h2>Il luogo in cui il Famiglio vive davvero.</h2>
        <p>La Casa non è soltanto uno sfondo. Qui il Famiglio si muove, riposa, gioca e reagisce alle cure del Custode.</p>
        <ul className={styles.needs}>
          <li><strong>Fame</strong><span>Nutri il Famiglio usando le scorte disponibili.</span></li><li><strong>Energia</strong><span>Rispetta i suoi tempi e accompagnalo al riposo.</span></li>
          <li><strong>Gioia</strong><span>Gioca con lui e varia le attività.</span></li><li><strong>Igiene</strong><span>Usa gli oggetti per la pulizia custoditi nello Zaino.</span></li>
          <li><strong>Affetto</strong><span>Le coccole rafforzano il rapporto con il Custode.</span></li>
        </ul>
        <p>Ogni giorno può apparire un Desiderio quotidiano. Nella Casa trovi anche Zaino, Diario del Legame, routine, portafoglio delle valute e oggetti dedicati alla cura.</p>
        <p>Il Famiglio vive la Casa anche in autonomia. Quando deve fare i bisogni raggiunge il bagno; al termine il comando Pulisci richiama la tua attenzione. Le azioni hanno animazioni dedicate, timer visibili e rispettano sempre la specie e il colore scelto.</p>
        <p>Per il sonno puoi scegliere tra <strong>Pisolino</strong> da 1 minuto, <strong>Riposo ristoratore</strong> da 15 minuti e <strong>Sonno profondo</strong> da 30 minuti. Una scia verde segnala un’igiene troppo bassa; trascurare a lungo i bisogni può far ammalare il Famiglio e rende disponibile il comando Cura.</p>
        <p>Accedendo con il LoreWise ID, le Case e i progressi dei Famigli restano disponibili anche passando da un dispositivo all’altro.</p>
      </div>
    </div></section>

    <section className={`${styles.chapter} ${styles.paper}`} id="crescita"><div className={`shell ${styles.grid} ${styles.reverse}`}>
      <GuideImage src="/giochi/nexus-pet/03-evoluzione-legame.webp" alt="Albero di crescita e progressione del Famiglio" caption="Legame e combattimento crescono su due percorsi distinti." />
      <div className={styles.copy}><p className={styles.number}>03 · Crescere insieme</p><h2>La costanza conta più della fretta.</h2>
        <p>Ogni attenzione e giornata condivisa alimenta il Legame. Le evoluzioni richiedono punti e giorni reali di cura.</p>
        <ol className={styles.growth}><li><strong>Cucciolo</strong><span>Comincia a conoscere il suo Custode.</span></li><li><strong>Giovane</strong><span>900 PE Legame e 14 giorni di cura.</span></li><li><strong>Adulto</strong><span>3.500 PE Legame e 35 giorni di cura.</span></li></ol>
        <p>Il Livello Legame arriva fino a 50. Esplorazione e Combattimento seguono progressioni separate. Ogni passaggio di livello viene annunciato con i miglioramenti ottenuti: mosse, ricompense, traguardi o sconti.</p>
      </div>
    </div></section>

    <section className={styles.merchants} id="botteghe"><div className="shell">
      <header className={styles.heading}><p className={styles.number}>04 · La Corte dei Mercanti</p><h2>Ogni bottega ha una propria anima.</h2><p>Provviste, strumenti, colori, Famigli e reliquie sono custoditi da mercanti differenti.</p></header>
      <div className={styles.gallery}>
        <GuideImage src="/giochi/nexus-pet/04-negozio-nora.webp" alt="Bottega di Nora" caption="Nora · cibo e oggetti per la cura quotidiana." />
        <GuideImage src="/giochi/nexus-pet/05-atelier-famigli.webp" alt="Atelier di Medusa" caption="Iris, Mirra e Medusa · colori, giochi, cover, Famigli speciali e nuove Case." />
        <GuideImage src="/giochi/nexus-pet/06-mercato-notturno.webp" alt="Mercato Notturno" caption="Dalle 21:00 alle 06:00 Ronin e Lich aprono il Mercato Notturno." />
      </div>
      <p>Nora prepara anche la medicina: puoi acquistare una dose singola oppure una scorta conveniente da cinque dosi e conservarla nello Zaino finché serve.</p>
      <div className={styles.facts}><p><strong>53 Famigli</strong><span>Creature reali, magiche e preistoriche.</span></p><p><strong>12 preistorici</strong><span>Una collezione dedicata al passato.</span></p><p><strong>Mercato Notturno</strong><span>Sigilli, frammenti e reliquie particolari.</span></p></div>
    </div></section>

    <section className={styles.chapter} id="missioni"><div className={`shell ${styles.grid}`}>
      <GuideImage src="/giochi/nexus-pet/07-missioni.webp" alt="Missioni quotidiane dei Famigli" caption="Le Missioni uniscono Casa, sito, Arena e spedizioni." />
      <div className={styles.copy}><p className={styles.number}>05 · Missioni e Diario</p><h2>Una routine che diventa storia.</h2><p>Le Missioni quotidiane coinvolgono cura, gioco, crescita, esplorazione del sito, combattimenti e spedizioni. Gli incarichi più impegnativi offrono ricompense migliori e il pulsante della missione conduce direttamente all’attività richiesta.</p><p>Dal livello Legame 10 si aggiunge una missione quotidiana. Il Diario conserva nascita, evoluzioni, avventure e traguardi.</p><blockquote>Due Custodi possono scegliere la stessa creatura, ma non vivranno mai lo stesso viaggio.</blockquote></div>
    </div></section>

    <section className={`${styles.chapter} ${styles.paper}`} id="spedizioni"><div className={`shell ${styles.grid} ${styles.reverse}`}>
      <GuideImage src="/giochi/nexus-pet/08-spedizioni.webp" alt="Famiglio in spedizione nel Bosco del Crepuscolo" caption="Il viaggio continua anche quando lasci la pagina." />
      <div className={styles.copy}><p className={styles.number}>06 · Spedizioni del Nexus</p><h2>Oltre i confini della Casa.</h2><p>Puoi avviare fino a tre Spedizioni al giorno. Ogni destinazione alterna tre imprevisti narrativi e sei scelte possibili, così l’inizio del viaggio non ripete sempre la stessa scena. I bisogni restano sospesi fino al ritorno.</p>
        <div className={styles.destinations}><p><strong>Boschi del Crepuscolo</strong><span>5 min · Cucciolo</span></p><p><strong>Giardini Astrali</strong><span>10 min · Giovane</span></p><p><strong>Cripta della Memoria</strong><span>15 min · Giovane</span></p><p><strong>Valle dei Fossili</strong><span>20 min · Adulto</span></p></div>
      </div>
    </div></section>

    <section className={styles.final} id="arena"><div className="shell">
      <header className={styles.heading}><p className={styles.number}>07 · Arena e Torre del Nexus</p><h2>Il Legame dà forza.<br />L’allenamento insegna a usarla.</h2><p>In Arena combatti soltanto con i Famigli che possiedi, conservando specie, crescita e colore scelto. Prepari fino a quattro mosse e amministri energia, utilizzi, ricariche, stati ed efficacia elementale. Un attacco può occasionalmente mancare: la scritta MISS conferma la schivata e nessun danno viene applicato.</p></header>
      <div className={styles.dual}><GuideImage src="/giochi/nexus-pet/10-arena-combattimento.webp" alt="Battaglia nell’Arena dei Famigli" caption="Arena · prepara le mosse e affronta avversari sempre diversi." /><GuideImage src="/giochi/nexus-pet/09-torre-del-nexus.webp" alt="Percorso della Torre del Nexus" caption="Torre del Nexus · dieci piani di difficoltà crescente." /></div>
      <div className={styles.facts}><p><strong>6 circuiti</strong><span>Arene e avversari con progressione distinta.</span></p><p><strong>4 comandi</strong><span>Mosse fisiche, magiche, di stato e recupero.</span></p><p><strong>Effetti elementali</strong><span>Fuoco, ghiaccio, fulmine, vento, natura, acqua, arcano, terra e veleno.</span></p></div>
      <div className={styles.tower}><span>01–03<small>Avversari</small></span><span>04<small>Mini-boss</small></span><span>05–07<small>Ascesa</small></span><span>08<small>Mini-boss</small></span><span>09<small>Élite</small></span><span>10<small>Boss finale</small></span></div>
    </div></section>

    <section className={`${styles.chapter} ${styles.campaign}`} id="campagna"><div className={`shell ${styles.grid}`}>
      <GuideImage src="/famiglio/rebuild/combat/campaign/arenas/01-cortile-reietti-v1.webp" alt="Scenario della Campagna del Legame Corrotto" caption="Venti duelli narrativi attraversano cinque capitoli e scenari dedicati." />
      <div className={styles.copy}><p className={styles.number}>08 · Campagna del Legame Corrotto</p><h2>Venti livelli contro i Custodi corrotti.</h2>
        <p>La campagna introduce una gerarchia di avversari crescente, dagli scagnozzi fino al boss finale. Ogni Custode nemico accompagna un Famiglio corrotto e reagisce agli eventi del duello con gesti di comando, esultanza, rabbia, vittoria e sconfitta.</p>
        <p>I dialoghi raccontano la storia senza far parlare i Famigli. Aura viola e particelle rendono riconoscibili gli avversari corrotti, mentre gli attacchi usano effetti differenti per caricamento, traiettoria e impatto.</p>
        <p>Le animazioni comprendono ingresso, attesa, corsa, attacco, magia, tecnica, difesa, colpo subito, vittoria e sconfitta, mantenendo leggibili entrambi i combattenti.</p>
      </div>
    </div>
    <div className="shell">
      <p className={styles.closing}>La Torre non misura soltanto la potenza.<br /><strong>Misura tutto il cammino percorso insieme.</strong></p>
      <div className={styles.actions}><Link href="/famiglio">Inizia il primo Legame</Link><Link href="/giochi">Torna a Giochi e App</Link></div>
    </div></section>
  </main>;
}
