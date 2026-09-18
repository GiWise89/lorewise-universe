import Image from "next/image";
import Link from "next/link";
import { NewsletterSignup } from "./NewsletterSignup";
import styles from "./SandboxDossier.module.css";

const base = "/games/sandbox";

const chapters = [
  { id: "mondo", label: "Il mondo" },
  { id: "popoli", label: "I popoli" },
  { id: "vita", label: "La vita" },
  { id: "civilta", label: "Le civiltà" },
  { id: "regni", label: "I regni" },
  { id: "natura", label: "La natura" },
  { id: "poteri", label: "I poteri" },
  { id: "sviluppo", label: "Lo sviluppo" },
];

const naturalBiomes = ["Prateria", "Foresta temperata", "Taiga", "Tundra", "Ghiacci polari", "Deserto di dune con oasi", "Canyon rosso", "Savana", "Steppa", "Giungla", "Palude", "Mangrovie", "Macchia mediterranea", "Brughiera"];
const wonderBiomes = ["Terre vulcaniche", "Lande acide", "Foresta di cristalli", "Bosco dei funghi giganti", "Piana di sale", "Foresta pietrificata", "Bosco dei ciliegi", "Cratere alieno"];

const peoples = [
  { id: "human", name: "Umani", faith: "Culto dell’Alba", text: "Tetti di coppi rossi, travi di legno e mercati colorati. Adattabili e instancabili, sanno mettere radici quasi ovunque ci sia acqua, legna e un po’ di terra da coltivare." },
  { id: "elf", name: "Elfi", faith: "Cerchio delle Radici", text: "Le loro case sembrano cresciute insieme agli alberi: legno chiaro, foglie intrecciate, torri leggere. Custodiscono il Cerchio delle Radici e una rivalità antica con i Nani." },
  { id: "dwarf", name: "Nani", faith: "Memoria degli Antenati", text: "Pietra squadrata, merli e fucine sempre accese. Più bassi e robusti degli altri popoli, onorano la Memoria degli Antenati e non dimenticano un torto degli Elfi." },
  { id: "orc", name: "Orchi", faith: "Spiriti del Clan", text: "Palizzate con punte, pelli tese e stendardi rosso sangue. Seguono gli Spiriti del Clan e guardano con sospetto chiunque si avvicini ai loro confini." },
  { id: "githyanki", name: "Githyanki", faith: "Via Astrale", text: "Architetture viola e oro, guglie sottili e cristalli azzurri. Seguono la Via Astrale, diffidano di quasi tutti e hanno nei Tiefling i rivali di sempre." },
  { id: "tiefling", name: "Tiefling", faith: "Fiamma del Patto", text: "Corna, code e case scure dai riflessi di brace. Custodiscono la Fiamma del Patto; il loro aspetto non dice nulla del loro cuore, che resta libero come quello di chiunque altro." },
];

const villages = [
  { id: "elfi", alt: "Villaggio elfico con case di legno e foglie ai piedi di una montagna innevata", caption: "Gli Elfi costruiscono tra prato e montagna, con case vestite di foglie." },
  { id: "nani", alt: "Villaggio nanico in pietra tra la foresta e la costa", caption: "I Nani scelgono pietra e miniere, a due passi dalla foresta di pini." },
  { id: "orchi", alt: "Villaggio degli orchi nel deserto rosso vicino a una foresta di cristalli", caption: "Gli Orchi piantano le palizzate nel deserto rosso, accanto ai cristalli." },
  { id: "githyanki", alt: "Villaggio githyanki viola e oro nel deserto sotto una montagna", caption: "Le guglie viola dei Githyanki spuntano sotto le vette innevate." },
  { id: "tiefling", alt: "Villaggio tiefling dai tetti scuri sulla costa del deserto", caption: "I Tiefling accendono le loro case di brace in riva al mare." },
];

const lifeMoments = [
  ["Un nome e un carattere", "Ogni fondatore arriva giovane, con un nome, un aspetto e dei tratti che nessun altro possiede. Nessuna specie decide in anticipo chi diventerà."],
  ["Bisogni veri", "Fame, riposo, riparo, sicurezza, salute e compagnia guidano ogni scelta. Se un sentiero è bloccato, l’abitante cerca un’altra strada o cambia idea."],
  ["Amori, figli, generazioni", "Le coppie nascono da sole, i figli crescono accanto ai genitori e ne ereditano qualcosa. Le famiglie attraversano le generazioni e restano consultabili."],
  ["Mestieri che servono", "Raccoglitori, taglialegna, pescatori, cacciatori, contadini, pastori, minatori, fabbri, costruttori, maestri, guaritori, sacerdoti e soldati: ognuno fa ciò di cui il villaggio ha bisogno."],
  ["Cosa fa e perché", "Con un doppio tocco apri la scheda di chiunque: vedi cosa sta facendo, perché lo sta facendo e a quale famiglia appartiene. Puoi seguirlo e non perderlo più di vista."],
  ["Fortuna e disgrazia", "Ferite, malattie e incendi mettono alla prova la comunità; infermerie, erbe e secchi d’acqua la aiutano a rialzarsi. Nel futuro arriveranno tesori, eredità e colpi di fortuna."],
];

const eras = [
  { name: "Origini", note: "Ripari, focolari, raccolta, caccia e pesca", live: true },
  { name: "Era agricola", note: "Campi ordinati, pecore, capre e mulini", live: true },
  { name: "Era dei metalli", note: "Miniere, fonderie, fabbri e attrezzi", live: true },
  { name: "Era medievale", note: "Mura, torri, caserme, mercati e taverne", live: true },
  { name: "Era delle scoperte", note: "Viaggi, commerci lontani e nuove conoscenze", live: false },
  { name: "Era industriale", note: "Fabbriche, ferrovie, energia e città che si trasformano", live: false },
  { name: "Era moderna", note: "Elettricità, ospedali, polizia, pompieri e metropoli", live: false },
];

const powers = [
  ["Pioggia di meteore", "Scegli un punto e guarda il cielo aprirsi. Crateri, incendi e un villaggio che dovrà ricostruire."],
  ["Terremoto", "La terra trema, gli edifici si incrinano e gli abitanti cercano riparo prima di rimettersi al lavoro."],
  ["Eruzione", "Il vulcano più vicino si risveglia: fiumi di lava cambiano il paesaggio e nessuno può restare a guardare."],
  ["Visite dal cielo", "Una navicella aliena atterra dove meno te lo aspetti e lascia dietro di sé un cratere che diventa un bioma a sé."],
];

const liveNow = [
  "Mondi generati con continenti, isole e arcipelaghi, in cinque grandezze",
  "Terreno da plasmare con pennelli di terra, sabbia, acqua, colline, montagne, lava e acido",
  "Ventidue biomi con piante e animali propri",
  "Sei popoli con case, templi, torri e mura nel proprio stile",
  "Villaggi autonomi che crescono fino all’era medievale",
  "Famiglie, nascite, mestieri, scuole, infermerie e culti",
  "Confini, capi, eserciti, rivalità e prime guerre",
  "Stagioni, meteo, giorno e notte, fauna selvatica e bestiame",
  "Poteri: meteore, terremoti, eruzioni e navicelle aliene",
  "Mondi salvati, copie di sicurezza e più mondi da conservare",
];

const comingNext = [
  "Le ere delle scoperte, dell’industria e della modernità",
  "Diplomazia completa: commerci, alleanze, patti e trattati di pace",
  "Governi, successioni, elezioni, rivolte e guerre civili",
  "Monete, botteghe, banche, proprietà ed eredità",
  "Criminalità, giustizia, guardie e polizia",
  "Tradizioni, feste, musica, teatri e religioni che si dividono",
  "Catastrofi naturali, epidemie e grandi ricostruzioni",
  "Magia rara, evocatori, guaritori e creature leggendarie",
  "Una cronaca del mondo con eroi, dinastie e preferiti da seguire",
];

function Plate({ src, alt, width, height, caption, wide }: { src: string; alt: string; width: number; height: number; caption?: string; wide?: boolean }) {
  return <figure className={`${styles.plate}${wide ? ` ${styles.plateWide}` : ""}`}>
    <Image src={src} alt={alt} width={width} height={height} unoptimized />
    {caption ? <figcaption>{caption}</figcaption> : null}
  </figure>;
}

export function SandboxDossier() {
  return <main className={styles.page}>
    <header className={styles.topbar}>
      <Link href="/giochi">← Torna a Giochi e App</Link>
      <span>GS-GAME-004 · Dossier di sviluppo</span>
    </header>

    <section className={styles.hero} aria-labelledby="sandbox-title">
      <Image className={styles.heroArt} src={`${base}/mondo-biomi-v1.webp`} alt="Un continente di SandBox visto dall’alto: praterie, foreste di pini, deserti rossi, montagne innevate e una foresta di cristalli" fill priority sizes="100vw" unoptimized />
      <div className={styles.heroShade} aria-hidden="true" />
      <div className={styles.heroCopy}>
        <span className={styles.status}>In sviluppo</span>
        <p className={styles.eyebrow}>GiWise Studio · SandBox · Prototipo “Prima Terra”</p>
        <h1 id="sandbox-title" className={styles.logoTitle}><Image className={styles.logo} src={`${base}/logo-prima-terra-v2.webp`} alt="" width={2139} height={417} priority unoptimized /><span className={styles.visuallyHidden}>SandBox · Prima Terra</span></h1>
        <p className={styles.heroLine}>Crea un mondo. Affidalo a sei popoli.<br />Guarda nascere la sua storia.</p>
        <div className={styles.heroActions}>
          <a className={styles.primary} href="#manifesto">Apri il dossier</a>
          <a className={styles.secondary} href="#sviluppo">A che punto siamo</a>
        </div>
      </div>
    </section>

    <nav className={styles.chapters} aria-label="Capitoli del dossier">
      {chapters.map((chapter, index) => <a href={`#${chapter.id}`} key={chapter.id}><small>{String(index + 1).padStart(2, "0")}</small>{chapter.label}</a>)}
    </nav>

    <section className={styles.manifesto} id="manifesto" aria-labelledby="manifesto-title">
      <div className={styles.wrap}>
        <p className={styles.eyebrow}>L’idea</p>
        <h2 id="manifesto-title">Un mondo intero,<br />nelle tue mani.</h2>
        <p className={styles.lead}>SandBox non ti chiede di vincere. Ti chiede di immaginare. Disegni terre e mari, scegli dove far sbarcare i primi abitanti e poi fai un passo indietro: da quel momento il mondo vive da solo. Famiglie, villaggi, regni, amicizie e guerre nascono dalle scelte di chi lo abita, non da un copione.</p>
        <div className={styles.pillars}>
          <article><span>01</span><h3>Crea</h3><p>Continenti, isole, fiumi, montagne innevate, lava e deserti: ogni pixel del mondo si può plasmare, anche a partita avviata.</p></article>
          <article><span>02</span><h3>Popola</h3><p>Scegli fra sei popoli e piazza un fondatore o un gruppo di cinque. Nessuna civiltà esiste finché non sei tu a dare il via.</p></article>
          <article><span>03</span><h3>Osserva</h3><p>Segui una vita, una dinastia o un intero regno. Puoi solo guardare, dare una mano o mettere tutto alla prova con i tuoi poteri.</p></article>
        </div>
      </div>
    </section>

    <section className={styles.chapter} id="mondo" aria-labelledby="mondo-title">
      <div className={styles.wrap}>
        <header className={styles.chapterHead}><p className={styles.eyebrow}>Capitolo 01</p><h2 id="mondo-title">Il mondo.</h2><p>Ogni partita comincia da una terra diversa. Scegli la forma, la grandezza, quanta acqua e quante montagne desideri: il generatore disegna coste, rilievi, fiumi e biomi coerenti, e ti mostra un’anteprima prima di entrare. Se preferisci, parti da un mare vuoto e costruisci tutto con le tue mani.</p></header>
        <div className={styles.splitMedia}>
          <Plate src={`${base}/mondo-vicino-v1.webp`} alt="Un continente di SandBox visto più da vicino, con sei giovani villaggi tra deserti rossi, foreste di pini, praterie e montagne innevate" width={1920} height={1080} caption="Sei villaggi appena nati tra deserti rossi, foreste di pini, praterie e montagne innevate con le loro scale." />
          <div className={styles.factList}>
            <p><strong>Tre forme di terra</strong><span>Continente, isole o arcipelago, con un codice da condividere per ritrovare lo stesso mondo.</span></p>
            <p><strong>Cinque grandezze</strong><span>Dalla piccola isola alla mappa gigantesca, con gli stessi sistemi in ogni scala.</span></p>
            <p><strong>Un pennello per ogni cosa</strong><span>Terra, sabbia, acqua dolce, mare, oceano profondo, colline, montagne, vette innevate, magma e acido.</span></p>
            <p><strong>Tempo nelle tue mani</strong><span>Pausa, normale, doppio e quintuplo. Quando chiudi il gioco il mondo ti aspetta esattamente dove l’hai lasciato.</span></p>
          </div>
        </div>
        <div className={styles.biomes}>
          <div>
            <h3>Ventidue biomi</h3>
            <p>Ogni bioma ha il proprio terreno, le proprie piante e i propri animali. Si distribuiscono a macchie irregolari, diversi a ogni mondo, e i più straordinari compaiono soltanto due, tre o quattro volte per mappa.</p>
          </div>
          <div>
            <h4>Terre naturali</h4>
            <ul className={styles.chips}>{naturalBiomes.map((biome) => <li key={biome}>{biome}</li>)}</ul>
            <h4>Terre meravigliose</h4>
            <ul className={`${styles.chips} ${styles.chipsWonder}`}>{wonderBiomes.map((biome) => <li key={biome}>{biome}</li>)}</ul>
          </div>
        </div>
      </div>
    </section>

    <section className={`${styles.chapter} ${styles.chapterAlt}`} id="popoli" aria-labelledby="popoli-title">
      <div className={styles.wrap}>
        <header className={styles.chapterHead}><p className={styles.eyebrow}>Capitolo 02</p><h2 id="popoli-title">I sei popoli.</h2><p>Umani, Elfi, Nani, Orchi, Githyanki e Tiefling. Ogni popolo ha corpi, abiti, architetture e una fede riconoscibili, uomini e donne con sagome proprie. Nessuno però nasce con un destino scritto: qualsiasi popolo può diventare pacifico o conquistatore, e tutti possono arrivare fino all’era moderna.</p></header>
        <div className={styles.peopleGrid}>
          {peoples.map((people) => <article key={people.id}>
            <figure><Image src={`${base}/popolo-${people.id}.webp`} alt={`Un uomo e una donna del popolo ${people.name} in pixel art`} width={740} height={420} unoptimized /></figure>
            <div><span>{people.faith}</span><h3>{people.name}</h3><p>{people.text}</p></div>
          </article>)}
        </div>
        <div className={styles.villages}>
          <header><p className={styles.eyebrow}>Villaggi dal vivo</p><h3>Lo stesso mondo, costruito in modi diversi.</h3></header>
          <div>
            {villages.map((village) => <figure key={village.id}>
              <Image src={`${base}/villaggio-${village.id}-v1.webp`} alt={village.alt} width={1920} height={1080} unoptimized />
              <figcaption>{village.caption}</figcaption>
            </figure>)}
          </div>
        </div>
        <aside className={styles.note}><strong>Popoli che si mescolano</strong><p>Con la legge del mondo “Compatibilità universale” le coppie possono nascere anche fra popoli diversi. Le città potranno accogliere migranti, alleati e conquistati, e chiunque potrà lavorare, possedere beni o governare.</p></aside>
      </div>
    </section>

    <section className={styles.chapter} id="vita" aria-labelledby="vita-title">
      <div className={styles.wrap}>
        <header className={styles.chapterHead}><p className={styles.eyebrow}>Capitolo 03</p><h2 id="vita-title">Ogni abitante è una storia.</h2><p>Nel mondo di SandBox non esistono comparse. Chi taglia la legna ha una famiglia che lo aspetta, chi costruisce una casa ci andrà a vivere, chi parte per la guerra lascia qualcuno al villaggio.</p></header>
        <Plate src={`${base}/villaggio-giorno-v1.webp`} alt="Un villaggio di SandBox visto da vicino con case, campi, abitanti al lavoro e animali" width={1920} height={1080} caption="Un villaggio al lavoro: ognuno sta facendo qualcosa, e c’è sempre un motivo." wide />
        <div className={styles.lifeGrid}>
          {lifeMoments.map(([title, text], index) => <article key={title}><span>{String(index + 1).padStart(2, "0")}</span><h3>{title}</h3><p>{text}</p></article>)}
        </div>
      </div>
    </section>

    <section className={`${styles.chapter} ${styles.chapterAlt}`} id="civilta" aria-labelledby="civilta-title">
      <div className={styles.wrap}>
        <header className={styles.chapterHead}><p className={styles.eyebrow}>Capitolo 04</p><h2 id="civilta-title">Dalle capanne<br />alle città.</h2><p>Nessuno costruisce per decorazione. I villaggi aprono cantieri quando servono, raccolgono i materiali, tagliano alberi, scavano pietra e ferro, e ogni edificio sorge pezzo dopo pezzo, con polvere e attrezzi in movimento. Se qualcosa crolla, si recuperano i materiali e si ricostruisce.</p></header>
        <div className={styles.twoPlates}>
          <Plate src={`${base}/case-ere-v1.webp`} alt="Le case dei sei popoli nelle diverse ere, dalla capanna alla casa medievale" width={1128} height={1008} caption="Le case dei sei popoli crescono di era in era." />
          <Plate src={`${base}/architetture-civiche-v1.webp`} alt="Mercati, caserme e torri di guardia nei sei stili architettonici" width={1344} height={912} caption="Mercati, caserme e torri: ogni edificio esiste in sei stili diversi." />
        </div>
        <div className={styles.eras}>
          <h3>Sette ere da attraversare</h3>
          <p>Ogni civiltà avanza da sola, grazie a ciò che scopre, produce e insegna. Un regno può entrare nel medioevo mentre il vicino accende ancora i primi fuochi.</p>
          <ol>
            {eras.map((era, index) => <li key={era.name} className={era.live ? styles.eraLive : undefined}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{era.name}</strong>
              <small>{era.note}</small>
              <em>{era.live ? "Già nel mondo" : "In arrivo"}</em>
            </li>)}
          </ol>
        </div>
        <Plate src={`${base}/mura-v1.webp`} alt="Cinte di mura con torri, porte, rampe e scale nei sei stili" width={1224} height={816} caption="Quando un villaggio cresce, disegna la propria cinta: mura, torri agli angoli e porte sui lati." wide />
      </div>
    </section>

    <section className={styles.chapter} id="regni" aria-labelledby="regni-title">
      <div className={styles.wrap}>
        <header className={styles.chapterHead}><p className={styles.eyebrow}>Capitolo 05</p><h2 id="regni-title">Regni, alleanze<br />e guerre.</h2><p>I villaggi tracciano confini, scelgono capi, si incontrano. Da lì può nascere un’amicizia commerciale o una rivalità che cova per generazioni. Le guerre non scoppiano per caso: hanno un motivo, un inizio, una ritirata e una pace.</p></header>
        <div className={styles.splitMedia}>
          <Plate src={`${base}/soldati-v1.webp`} alt="Soldati dei sei popoli con armature, elmi, scudi e armi" width={1176} height={324} caption="Soldati dei sei popoli, armati con ciò che i loro fabbri riescono a forgiare." />
          <div className={styles.factList}>
            <p><strong>Confini che si vedono</strong><span>Attiva la vista dei regni per scoprire chi controlla cosa e come cambiano i territori.</span></p>
            <p><strong>Capi e malcontento</strong><span>Le guide emergono dagli abitanti per fiducia e capacità; il consenso si può guadagnare e perdere.</span></p>
            <p><strong>Eserciti di persone vere</strong><span>I soldati sono abitanti con una famiglia: si addestrano, pattugliano le porte e tornano a casa feriti o vittoriosi.</span></p>
            <p><strong>Dopo la battaglia</strong><span>I feriti vanno in infermeria, le famiglie cercano riparo, le case danneggiate vengono ricostruite.</span></p>
          </div>
        </div>
      </div>
    </section>

    <section className={`${styles.chapter} ${styles.chapterAlt}`} id="natura" aria-labelledby="natura-title">
      <div className={styles.wrap}>
        <header className={styles.chapterHead}><p className={styles.eyebrow}>Capitolo 06</p><h2 id="natura-title">Un mondo che respira.</h2><p>L’erba ondeggia al vento, i pesci saltano fuori dall’acqua, le stagioni cambiano i colori degli alberi. Il sole, le nuvole, la pioggia, i temporali e le bufere di neve seguono il calendario del mondo, e gli abitanti li sentono davvero sulla pelle.</p></header>
        <Plate src={`${base}/villaggio-sera-v1.webp`} alt="Il villaggio umano al calar della sera, cresciuto con mulino, fucina, miniera e campi" width={1920} height={1080} caption="Cala la sera sul villaggio umano: in pochi giorni sono comparsi il mulino, la fucina e nuovi campi." wide />
        <div className={styles.bestiary}>
          <div>
            <h3>Un bestiario vivo</h3>
            <p>Pecore, capre, cervi, lupi, orsi, bufali, pinguini, squali e decine di altre specie abitano i biomi a cui appartengono. Pascolano, cacciano, fuggono e fanno i cuccioli; gli abitanti li allevano, li cacciano o li temono.</p>
          </div>
          <Plate src={`${base}/bestiario-v1.webp`} alt="Trenta animali di SandBox in pixel art, dalla pecora allo squalo" width={1848} height={588} wide />
        </div>
        <div className={styles.rare}>
          <Plate src={`${base}/creature-rare-v1.webp`} alt="Creature rare di SandBox: basilisco, golem di cristallo, fungo vivente, salamandra, spirito del sale, melma, volpe spirituale e visitatore grigio" width={1372} height={644} />
          <div>
            <p className={styles.eyebrow}>Incontri rari</p>
            <h3>Non tutto ciò che vive è ordinario.</h3>
            <p>Golem di cristallo, volpi spirituali, basilischi, salamandre di lava, spiriti del sale e piccoli funghi viventi nascono nei biomi più strani. E qualcuno, di tanto in tanto, arriva dal cielo.</p>
          </div>
        </div>
      </div>
    </section>

    <section className={styles.chapter} id="poteri" aria-labelledby="poteri-title">
      <div className={styles.wrap}>
        <header className={styles.chapterHead}><p className={styles.eyebrow}>Capitolo 07</p><h2 id="poteri-title">I poteri<br />del creatore.</h2><p>Tutti i poteri sono disponibili da subito, senza nulla da sbloccare. Puoi usarli per aiutare, per mettere alla prova una civiltà o soltanto per vedere cosa succede. Gli abitanti, un giorno, potrebbero perfino leggerci un miracolo o un castigo.</p></header>
        <div className={styles.powerLayout}>
          <Plate src={`${base}/poteri-v1.webp`} alt="Una navicella aliena, una meteora e un cratere in pixel art" width={948} height={348} />
          <div className={styles.powerGrid}>
            {powers.map(([title, text]) => <article key={title}><h3>{title}</h3><p>{text}</p></article>)}
          </div>
        </div>
        <aside className={styles.note}><strong>Il soprannaturale, se lo vuoi</strong><p>La tecnologia è la strada normale delle civiltà. La magia resta rara e preziosa: guaritori, evocatori, culti segreti, possessioni e patti con l’anima potranno comparire solo nei mondi in cui scegli di attivarli.</p></aside>
      </div>
    </section>

    <section className={`${styles.chapter} ${styles.chapterAlt}`} id="sviluppo" aria-labelledby="sviluppo-title">
      <div className={styles.wrap}>
        <header className={styles.chapterHead}><p className={styles.eyebrow}>Capitolo 08</p><h2 id="sviluppo-title">A che punto siamo.</h2><p>SandBox è in sviluppo attivo e cresce ogni settimana. Il mondo è già giocabile nel prototipo interno, dalle Origini fino al medioevo; davanti c’è la strada più lunga e più emozionante, quella che porta alle ciminiere, alle ferrovie e alle luci delle città moderne.</p></header>
        <div className={styles.progress}>
          <article className={styles.progressLive}>
            <span>Già vivo nel prototipo</span>
            <ul>{liveNow.map((item) => <li key={item}>{item}</li>)}</ul>
          </article>
          <article>
            <span>Sulla strada</span>
            <ul>{comingNext.map((item) => <li key={item}>{item}</li>)}</ul>
          </article>
        </div>
        <div className={styles.facts}>
          <p><span>Genere</span><strong>Simulatore di mondi in pixel art</strong></p>
          <p><span>Dove si gioca</span><strong>Nel browser, su computer, telefono e tablet</strong></p>
          <p><span>Lingua</span><strong>Italiano</strong></p>
          <p><span>Disponibilità</span><strong>Da annunciare</strong></p>
        </div>
        <Link className={styles.primary} href="/cronache-del-nexus">Segui le novità dal Nexus →</Link>
        <div style={{ marginTop: 32, maxWidth: 640 }}><NewsletterSignup variant="avvisami" topic="avvisami:sandbox" tone="dark" headingLevel={3} description="Lascia l’email: ti scriveremo una sola volta, quando SandBox sarà giocabile. Nessun’altra comunicazione." /></div>
      </div>
    </section>

    <footer className={styles.finale}>
      <p>Il mondo è pronto. Manca solo il primo abitante.</p>
    </footer>
  </main>;
}
