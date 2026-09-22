import Image from "next/image";
import Link from "next/link";
import { NewsletterSignup } from "./NewsletterSignup";
import styles from "./SandboxDossier.module.css";

const base = "/games/sandbox";

// Contenuti allineati al regolamento di Prima Terra (aggiornato al 22 settembre 2026)
// e alle schermate reali del gioco, disegnato con il bundle Minifantasy di Krishna Palacio.
const logo = `${base}/logo-prima-terra-ufficiale.webp`;

const chapters = [
  { id: "mondo", label: "Il mondo" },
  { id: "popoli", label: "I popoli" },
  { id: "vita", label: "La vita" },
  { id: "villaggio", label: "Il villaggio" },
  { id: "ere", label: "Le ere" },
  { id: "natura", label: "La natura" },
  { id: "mare", label: "Il mare" },
  { id: "esplorazione", label: "I dungeon" },
  { id: "guerra", label: "La guerra" },
  { id: "poteri", label: "I poteri" },
  { id: "sviluppo", label: "Lo sviluppo" },
];

const peoples = [
  { id: "umani", name: "Umani", trait: "Si adattano e imparano in fretta", text: "Case dal tetto di paglia, spade e lance. Partono neutrali verso tutti e sono i più inclini a stringere alleanze. Diventano adulti in circa due anni di gioco." },
  { id: "elfi", name: "Elfi", trait: "Vivono a lungo e conoscono il bosco", text: "Abitano sotto le chiome dei grandi alberi e combattono con l’arco. Crescono lentamente, in circa tre anni, e con i Nani hanno una rivalità antica." },
  { id: "nani", name: "Nani", trait: "Lavorano meglio pietra e metallo", text: "Case di pietra grigia, barbe folte e asce da battaglia. Robusti e tenaci, non dimenticano i vecchi torti degli Elfi. Adulti in circa due anni." },
  { id: "orchi", name: "Orchi", trait: "Forti e combattivi", text: "Tende di pelle rossa tese su pali di legno e asce da guerra a due mani. Partono ostili verso tutti, ma la guerra non è un destino obbligato. Crescono in un solo anno." },
  { id: "halfling", name: "Halfling", trait: "Piccoli, svelti e fortunati", text: "Gran contadini e pessimi soldati, con i capelli rossi e i vestiti da campagna. Vivono in tane scavate nella collina, con la porta tonda nell’arco di pietra e l’orto davanti." },
  { id: "goblin", name: "Goblin", trait: "Deboli ma prolifici", text: "Pelle verde-giallo acido e vestiti di stracci. Crescono in fretta, rubano e si accontentano di poco: vivono in capanne di pelli tese su pali e ammucchiano il bottino sotto una tettoia rotta." },
];

const lifeMoments = [
  ["Un nome che suona giusto", "Ogni popolo ha il proprio suono: nomi medievali per gli Umani, melodiosi per gli Elfi, brevi e duri per i Nani, gutturali per gli Orchi. E i paesi degli Umani portano il nome di un vero comune italiano."],
  ["Nessuno uguale a un altro", "Tonalità della pelle, colore e lunghezza dei capelli, barba, tunica e calzoni cambiano da persona a persona, sempre nello stile originale della pixel art."],
  ["Cinque bisogni", "Fame, riposo, riparo, salute e compagnia guidano ogni scelta. Le priorità cambiano con l’urgenza, il carattere e la situazione."],
  ["Coppie che nascono da sole", "Due adulti che passano tempo insieme e vanno d’accordo si affezionano piano, fino a diventare coppia e dormire sotto lo stesso tetto."],
  ["Emozioni in un fumetto", "Un cuore quando nasce un amore, una risata per un figlio, il lutto per un caro, la paura davanti a un lupo, la musica attorno al fuoco la sera."],
  ["Tratti che si ereditano", "Forzuto, Pauroso, Laborioso, Pigro, Goloso, Curioso e altri ancora: due o tre tratti per ciascuno, che cambiano lavoro, coraggio e umore e passano dai genitori ai figli."],
  ["Livelli e soprannomi", "Ogni abitante sale di livello facendo il proprio mestiere, fino al 25. Ogni cinque livelli guadagna un soprannome che entra nella sua biografia, come Berfredo Spaccaossa."],
  ["Una scheda per ciascuno", "Tocca un abitante e trovi Vita, Mestiere, Famiglia e Storia: barre, icone, le tre caselle di arma, armatura e attrezzo. Da lì puoi anche guarirlo, benedirlo o maledirlo."],
];

const trades = ["Raccoglitore", "Cacciatore", "Pescatore", "Taglialegna", "Minatore", "Contadino", "Pastore", "Costruttore", "Trasportatore", "Fabbro", "Soldato", "Avventuriero"];

const powers = [
  ["Il cielo", "Sereno, pioggia, temporale, neve e bufera su tutto il mondo. La pioggia fa crescere il cibo e spegne gli incendi, il temporale lancia fulmini, la bufera spinge tutti al riparo."],
  ["Sulla persona", "Guarisci, benedici, maledici o colpisci con un fulmine. Chi riceve un miracolo diventa devoto e si ferma a ringraziare."],
  ["Le catastrofi", "La meteora lascia un cratere di roccia, il terremoto spacca la terra e fa crollare le case, l’eruzione alza una montagna nuova."],
  ["La natura", "Con il pennello fai crescere alberi e cespugli, o li sradichi. E il terreno si dipinge casella per casella, anche a partita avviata: dove nasce un bioma nuovo crescono i suoi alberi e le sue piante, e le vecchie spariscono."],
];

const liveNow = [
  "Mondi generati come continente, isole o arcipelago, oppure da costruire da zero, con un codice per ritrovarli",
  "Terreno da dipingere, undici biomi, fiumi, laghi e un mondo che si muove col vento e le onde",
  "Giorno e notte, stagioni e un clima che cambia da solo, con la neve che imbianca i tetti",
  "Sei popoli: Umani, Elfi, Nani, Orchi, Halfling e Goblin, ognuno con nomi, aspetto e armi propri",
  "Famiglie, nascite, generazioni, tratti ereditati, livelli ed emozioni visibili",
  "Villaggi che fondano, costruiscono, coltivano, allevano e se serve traslocano",
  "Il Re con tasse ed editti, la bandiera di ogni paese, l’Eroe, le filiere e il mana dei maghi",
  "Sei ere, dalla Pietra all’Età Moderna, con il paese che cambia faccia",
  "Palude, giungla, terre corrotte e bosco fatato, ognuno con piante e bestie proprie",
  "Dungeon esplorabili dal vivo, avventurieri, bottino, il Circo e il Cimitero",
  "Animali selvatici, predatori, mostri, caccia, pesca e nuoto, e in mare delfini, squali, kraken e serpenti marini",
  "Porti e canoe per pescare al largo, commerciare e fare la guerra per mare, e velieri abbandonati da esplorare",
  "Un mercato con prezzi che cambiano da paese a paese, monete d’oro e baratto",
  "Un disegno proprio per ogni edificio di ogni popolo, porti compresi; solo i palazzi dell’Età Moderna sono uguali per tutti",
  "Una spedizione per paese, tutte da seguire nella scheda Spedizioni",
  "Musica, suoni dell’ambiente ed effetti, con volume e muto",
  "Territori, rancori, soldati, palizzate, battaglie, saccheggi e trattati di pace",
  "I poteri del dio: cielo, miracoli, maledizioni, meteore, terremoti ed eruzioni",
  "Salvataggio automatico ogni minuto, copie da recuperare e mondi da esportare",
];

const comingNext = [
  "Oggetti leggendari con un nome e una storia, tramandati di generazione in generazione",
  "Fede e preghiere: culti, santuari e abitanti che interpretano i tuoi interventi",
  "Le terre infernali, l’ultimo bioma che manca",
  "Un account facoltativo per ritrovare i propri mondi su ogni dispositivo",
];

function Plate({ src, alt, width, height, caption, wide }: { src: string; alt: string; width: number; height: number; caption?: string; wide?: boolean }) {
  return <figure className={`${styles.plate}${wide ? ` ${styles.plateWide}` : ""}`}>
    <Image src={src} alt={alt} width={width} height={height} unoptimized />
    {caption ? <figcaption>{caption}</figcaption> : null}
  </figure>;
}

function ChapterMark() {
  return <Image className={styles.chapterMark} src={logo} alt="" width={1032} height={324} unoptimized />;
}

export function SandboxDossier() {
  return <main className={styles.page}>
    <header className={styles.topbar}>
      <Link href="/giochi">← Torna a Giochi e App</Link>
      <span>GS-GAME-004 · Dossier di sviluppo</span>
    </header>

    <section className={styles.hero} aria-labelledby="sandbox-title">
      <Image className={styles.heroArt} src={`${base}/pt-mondo-continente.webp`} alt="Un continente di Prima Terra visto dall’alto, con praterie, foreste, montagne innevate, fiumi e coste" fill priority sizes="100vw" unoptimized />
      <div className={styles.heroShade} aria-hidden="true" />
      <div className={styles.heroCopy}>
        <span className={styles.status}>In sviluppo</span>
        <p className={styles.eyebrow}>GiWise Studio · Sandbox divino in pixel art</p>
        <h1 id="sandbox-title" className={styles.logoTitle}><Image className={styles.logo} src={logo} alt="" width={1032} height={324} priority unoptimized /><span className={styles.visuallyHidden}>Prima Terra</span></h1>
        <p className={styles.heroLine}>Crea il mondo. Posa i primi abitanti.<br />Poi guarda le civiltà vivere da sole.</p>
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
        <h2 id="manifesto-title">Tu sei il dio.<br />Loro vivono.</h2>
        <p className={styles.lead}>Prima Terra è un sandbox divino: disegni terre e mari, scegli dove posare i primi abitanti e poi fai un passo indietro. Da quel momento il mondo vive per conto suo. Le persone si innamorano, costruiscono, cacciano, litigano e fanno la guerra per ragioni loro. Tu puoi guardare, aiutarle, metterle alla prova o distruggere tutto con un gesto.</p>
        <div className={styles.pillars}>
          <article><span>01</span><h3>Crea</h3><p>Continenti, isole, arcipelaghi o un mare vuoto da riempire. Ogni casella del mondo si può dipingere, anche a partita avviata.</p></article>
          <article><span>02</span><h3>Popola</h3><p>Scegli un popolo e posa un singolo abitante o un gruppo di cinque giovani adulti. Nessuna coppia è decisa in anticipo.</p></article>
          <article><span>03</span><h3>Osserva</h3><p>Segui una famiglia per generazioni, un villaggio che cresce, due popoli che si odiano. Nessuna battaglia si risolve di nascosto.</p></article>
        </div>
      </div>
    </section>

    <section className={styles.chapter} id="mondo" aria-labelledby="mondo-title">
      <div className={styles.wrap}>
        <header className={styles.chapterHead}><ChapterMark /><p className={styles.eyebrow}>Capitolo 01</p><h2 id="mondo-title">Il mondo.</h2><p>Ogni partita comincia da una terra diversa. Scegli la forma, quanta acqua e quanti rilievi desideri: il generatore disegna coste, montagne, fiumi che si allargano scendendo a valle e laghi nelle conche. Ogni mondo ha un codice che puoi copiare e scambiare: lo stesso codice ricrea la stessa terra.</p></header>
        <div className={styles.gallery3}>
          <Plate src={`${base}/pt-mondo-continente.webp`} alt="Un continente montuoso di Prima Terra con rilievi innevati" width={1072} height={680} caption="Continente" />
          <Plate src={`${base}/pt-mondo-isole.webp`} alt="Un mondo di Prima Terra fatto di isole grandi e piccole" width={1072} height={680} caption="Isole" />
          <Plate src={`${base}/pt-mondo-arcipelago.webp`} alt="Un arcipelago di Prima Terra con decine di isole e canali" width={1072} height={680} caption="Arcipelago" />
        </div>
        <div className={styles.splitMedia}>
          <Plate src={`${base}/pt-villaggio-bosco.webp`} alt="Un piccolo villaggio di tende rosse degli Orchi in mezzo a una foresta di pini e latifoglie" width={1000} height={438} caption="Visto da vicino, il mondo è fatto di alberi veri: gli stessi che i taglialegna abbatteranno." />
          <div className={styles.factList}>
            <p><strong>Undici terre diverse</strong><span>Prateria, foresta, collina, montagna, neve, spiaggia e deserto, più quattro biomi con un carattere tutto loro: la palude dove si affonda e si prendono le febbri, la giungla fitta di legname e di bestie grosse, le terre corrotte dove i mostri nascono da soli, il bosco fatato pieno di luce e di mana.</span></p>
            <p><strong>Un mondo che si muove</strong><span>Il mare ondeggia, gli alberi si piegano al vento, l’erba e i fiori si muovono. In pausa tutto si ferma.</span></p>
            <p><strong>Il bosco si rinnova</strong><span>Un albero abbattuto lascia il ceppo, e col tempo al suo posto ne nasce uno nuovo. Un villaggio troppo avido deve andare a tagliare lontano.</span></p>
            <p><strong>Il tempo nelle tue mani</strong><span>Un giorno dura circa venti minuti, una stagione quattro giorni. Puoi mettere in pausa o accelerare due e cinque volte.</span></p>
          </div>
        </div>
      </div>
    </section>

    <section className={`${styles.chapter} ${styles.chapterAlt}`} id="popoli" aria-labelledby="popoli-title">
      <div className={styles.wrap}>
        <header className={styles.chapterHead}><ChapterMark /><p className={styles.eyebrow}>Capitolo 02</p><h2 id="popoli-title">Sei popoli.</h2><p>Umani, Elfi, Nani, Orchi, Halfling e Goblin. Ognuno ha corporatura, durata della vita, armi, nomi dal suono proprio e un Eroe con un potere innato. E ogni edificio ha un disegno diverso per ciascun popolo, dal focolare alla fonderia, porti compresi. Solo palazzo, negozio e caffè dell’Età Moderna sono uguali per tutti, con il tetto del colore del popolo. Le predisposizioni però inclinano, non obbligano: nessun mestiere è vietato e nessun destino politico è già scritto.</p></header>
        <Plate src={`${base}/pt-abitanti.webp`} alt="Abitanti di Prima Terra tra gli alberi: umani con capelli di colori diversi, orchi dalla pelle verde ed elfi" width={1000} height={470} caption="Nessun abitante è uguale a un altro: pelle, capelli, barba e vestiti cambiano da persona a persona." wide />
        <div className={styles.raceGrid}>
          {peoples.map((people) => <article key={people.id} data-race={people.id}>
            <span>{people.trait}</span>
            <h3>{people.name}</h3>
            <p>{people.text}</p>
          </article>)}
        </div>
        <Plate src={`${base}/pt-villaggio-goblin.webp`} alt="Un villaggio dei Goblin al crepuscolo: capanne di pelli tese su pali attorno al focolare, con l’orto e le panche" width={968} height={540} caption="Un villaggio dei Goblin al crepuscolo: capanne di pelli su pali, riconoscibili da lontano." wide />
        <aside className={styles.note}><strong>Il mondo ha già una storia</strong><p>Gli Orchi partono ostili verso tutti, Halfling e Goblin compresi. Elfi e Nani sono rivali di antica data, gli Umani sono neutrali e inclini alle alleanze, Halfling e Goblin partono in buoni rapporti con chiunque non sia un Orco. Poi contano i fatti: aiuti, tradimenti e guerre cambiano davvero i rapporti.</p></aside>
      </div>
    </section>

    <section className={styles.chapter} id="vita" aria-labelledby="vita-title">
      <div className={styles.wrap}>
        <header className={styles.chapterHead}><ChapterMark /><p className={styles.eyebrow}>Capitolo 03</p><h2 id="vita-title">Ogni abitante<br />è una storia.</h2><p>In Prima Terra non esistono comparse. Le generazioni scorrono abbastanza in fretta da vederle succedersi, ma abbastanza piano da affezionarsi a una persona e seguirla dalla nascita alla vecchiaia.</p></header>
        <div className={styles.twoPlates}>
          <Plate src={`${base}/pt-famiglia-cuori.webp`} alt="Cuoricini che salgono dal tetto di una casa di pietra dei Nani" width={1000} height={438} caption="Quando una coppia decide di avere un figlio, dal tetto salgono i cuoricini." />
          <Plate src={`${base}/pt-nascita-notte.webp`} alt="Di notte, tra due case di pietra, una luce dorata con scintille accoglie un neonato" width={1000} height={438} caption="Alla nascita, attorno al piccolo si accende una luce dorata." />
        </div>
        <div className={styles.lifeGrid}>
          {lifeMoments.map(([title, text], index) => <article key={title}><span>{String(index + 1).padStart(2, "0")}</span><h3>{title}</h3><p>{text}</p></article>)}
        </div>
      </div>
    </section>

    <section className={`${styles.chapter} ${styles.chapterAlt}`} id="villaggio" aria-labelledby="villaggio-title">
      <div className={styles.wrap}>
        <header className={styles.chapterHead}><ChapterMark /><p className={styles.eyebrow}>Capitolo 04</p><h2 id="villaggio-title">Dal focolare<br />al paese.</h2><p>Un gruppo fonda il villaggio quando trova cibo, legna e pietra a sufficienza. Prima il focolare, dove ci si raduna la sera, poi i ripari e il deposito. Niente nasce gratis: ogni edificio richiede materiali raccolti davvero, portati al cantiere e lavorati sotto i tuoi occhi.</p></header>
        <Plate src={`${base}/pt-campi-villaggio.webp`} alt="Un villaggio dei Nani con case di pietra, campi coltivati e una palizzata di legno" width={976} height={370} caption="Case di pietra, campi arati e palizzata: il villaggio costruisce ciò che gli serve, quando gli serve." wide />
        <div className={styles.splitMedia}>
          <div className={styles.factList}>
            <p><strong>Campi che seguono le stagioni</strong><span>Si ara, si semina e il raccolto cresce a vista. Grano e mais in pianura, patate e aglio in collina, riso vicino all’acqua. Chi non mette da parte scorte patisce l’inverno.</span></p>
            <p><strong>Recinti e pastori</strong><span>Galline, mucche, capre, pecore e maiali vivono liberi; il villaggio ne cattura una coppia e li alleva per uova, latte, lana e carne.</span></p>
            <p><strong>Vestiti per l’inverno</strong><span>Con lana e pelli si cuciono vestiti caldi: sotto la neve chi li porta si stanca molto meno.</span></p>
            <p><strong>Si trasloca tutti insieme</strong><span>Se per giorni manca l’essenziale, il villaggio smonta le case, carica le scorte e parte in colonna verso un posto migliore. Sul vecchio restano le rovine.</span></p>
          </div>
          <Plate src={`${base}/pt-recinto.webp`} alt="Un recinto con maiali, mangiatoia e fieno vicino alla costa" width={976} height={360} caption="Un recinto di maiali accanto al mare, con mangiatoia e fieno." />
        </div>
        <div className={styles.trades}>
          <h3>Dodici mestieri, una filiera vera</h3>
          <p>Dalla materia prima al prodotto finito. Gli abitanti scelgono e cambiano mestiere nel corso della vita, secondo capacità, carattere e bisogni del villaggio.</p>
          <ul className={styles.chips}>{trades.map((trade) => <li key={trade}>{trade}</li>)}</ul>
        </div>
        <div className={styles.twoPlates}>
          <Plate src={`${base}/pt-territori-bandiere.webp`} alt="Un continente visto da lontano con i territori colorati di cinque villaggi e le targhette con bandiera, nome e abitanti" width={808} height={492} caption="Da lontano ogni paese colora il suo territorio e mostra bandiera, nome e numero di abitanti." />
          <Plate src={`${base}/pt-pannello-villaggio.webp`} alt="Il pannello di un villaggio dei Goblin con scorte, tesoro, tasse e la scelta della bandiera" width={546} height={346} caption="Il pannello del villaggio: scorte, tesoro, tasse e una bandiera unica al mondo." />
        </div>
        <div className={styles.lifeGrid}>
          <article><span>01</span><h3>Il Re e le tasse</h3><p>Ogni tanto il villaggio si sceglie un capo. Il Re mette le tasse, decide quale opera costruire per prima ed emana editti: tutti ai campi, tutti alle armi, festa.</p></article>
          <article><span>02</span><h3>L’Eroe</h3><p>Uno solo per villaggio, e se lo guadagna sul campo. Il Campione umano trascina chi gli sta vicino, il Vendicatore nano regge i colpi come una roccia, il Goblin astuto colpisce alle spalle.</p></article>
          <article><span>03</span><h3>Filiere, mana e maghi</h3><p>Legname, metallo, cibo e tessuti passano da un edificio all’altro, con operai che puoi assegnare tu. Chi nasce col talento diventa mago nella torre e spende il mana del villaggio per curare e fulminare.</p></article>
        </div>
        <div className={styles.interfaceShowcase}>
          <Plate src={`${base}/pt-mercato-listino.webp`} alt="Il pannello del mercato di un paese umano: cassa, cosa vende e cosa cerca, e il listino con scorte e prezzi di ogni merce" width={278} height={618} caption="Il listino del mercato: scorte, prezzi e frecce che dicono se salgono o scendono." />
          <div>
            <p className={styles.eyebrow}>Il mercato</p>
            <h3>Ogni cosa ha il suo prezzo.</h3>
            <p>Il mercato ha una sua economia. Ogni merce costa di più quando scarseggia e meno quando abbonda, e il prezzo cambia da paese a paese. Chi ha mercato e fabbro conia monete d’oro; chi non le ha baratta merce contro merce.</p>
            <p>Toccando il mercato si vedono la cassa, cosa il paese vende e cosa cerca, il listino con le frecce dei prezzi, le carovane in viaggio e la storia degli scambi.</p>
          </div>
        </div>
      </div>
    </section>

    <section className={styles.chapter} id="ere" aria-labelledby="ere-title">
      <div className={styles.wrap}>
        <header className={styles.chapterHead}><ChapterMark /><p className={styles.eyebrow}>Capitolo 05</p><h2 id="ere-title">Dalla pietra<br />ai lampioni.</h2><p>Ogni villaggio attraversa sei ere: Pietra, Bronzo, Ferro, Acciaio, Vapore e Moderna. Non ci si sale col tempo che passa ma con conquiste vere: abbastanza abitanti, certi edifici finiti, certi metalli lavorati. Ogni salto è una festa, sblocca edifici, armi e attrezzi nuovi e finisce nella cronaca. Qui sotto, lo stesso paese umano in tutte e sei le ere.</p></header>
        <div className={`${styles.gallery3} ${styles.eraGallery}`}>
          <Plate src={`${base}/pt-era-umani-pietra.webp`} alt="Un paese umano all’Età della Pietra: capanne di paglia attorno al focolare, campi e recinti" width={1200} height={665} caption="Età della Pietra · capanne di paglia e focolare" />
          <Plate src={`${base}/pt-era-umani-bronzo.webp`} alt="Lo stesso paese all’Età del Bronzo, con il tempio di pietra e il mulino a vento" width={1200} height={665} caption="Età del Bronzo · il tempio e il mulino" />
          <Plate src={`${base}/pt-era-umani-ferro.webp`} alt="Lo stesso paese all’Età del Ferro, con le tende del mercato, il forno e la torre del mago" width={1200} height={665} caption="Età del Ferro · mercato, forno e torre del mago" />
          <Plate src={`${base}/pt-era-umani-acciaio.webp`} alt="Lo stesso paese all’Età dell’Acciaio, con il presidio e i primi monumenti" width={1200} height={665} caption="Età dell’Acciaio · il presidio e i monumenti" />
          <Plate src={`${base}/pt-era-umani-vapore.webp`} alt="Lo stesso paese all’Età del Vapore: sul tetto di ogni casa un camino che fuma, e le officine di mattoni" width={1200} height={665} caption="Età del Vapore · un camino che fuma su ogni tetto" />
          <Plate src={`${base}/pt-era-umani-moderna.webp`} alt="Lo stesso paese nell’Età Moderna, con due hotel, lo store, il saloon, i lampioni e le strade asfaltate con la riga bianca" width={1200} height={665} caption="Età Moderna · hotel, store, saloon e asfalto" />
        </div>
        <div className={styles.powerGrid}>
          <article><h3>Il paese cambia faccia</h3><p>Col Vapore su ogni casa spunta un camino che fuma, e ogni popolo tiene le sue case; con l’Età Moderna arrivano lanterne, lampioni e asfalto.</p></article>
          <article><h3>Edifici nuovi</h3><p>Officina, pompa e segheria a vapore; poi palazzo, negozio e caffè, uguali per tutti i popoli tranne il colore del tetto. Ognuno rende davvero: la pompa raddoppia la miniera, al caffè l’umore risale.</p></article>
          <article><h3>Armi migliori</h3><p>Si parte con selce e legno, poi il fabbro lavora rame, ferro, acciaio e acciaio lavorato: un’arma d’acciaio vale il doppio di una di rame, e i soldati passano a spadone, ascia da guerra e arco lungo.</p></article>
          <article><h3>Tre caselle a testa</h3><p>Arma, armatura e attrezzo da lavoro. Il fabbro serve prima l’Eroe e il Re, poi i soldati, gli avventurieri e infine chi lavora nei campi.</p></article>
        </div>
      </div>
    </section>

    <section className={`${styles.chapter} ${styles.chapterAlt}`} id="natura" aria-labelledby="natura-title">
      <div className={styles.wrap}>
        <header className={styles.chapterHead}><ChapterMark /><p className={styles.eyebrow}>Capitolo 06</p><h2 id="natura-title">Una natura<br />che non perdona.</h2><p>Cervi, cinghiali, conigli, tacchini e lupi nei prati; alci, volpi e orsi polari sulla neve; cammelli, serpenti e iene nelle terre aride; rane vicino all’acqua. Gli animali vivono in branchi, fanno i piccoli e si tengono in equilibrio: se spariscono i lupi, i cervi aumentano.</p></header>
        <div className={styles.twoPlates}>
          <Plate src={`${base}/pt-caccia.webp`} alt="Un cacciatore che si avvicina a una preda tra rocce e neve" width={1000} height={438} caption="Il cacciatore si avvicina piano: se l’animale se ne accorge, scappa." />
          <Plate src={`${base}/pt-pesca.webp`} alt="Un pescatore sulla riva sabbiosa lancia la lenza in mare" width={1000} height={438} caption="Dalla riva si pesca in mare, nei fiumi e nei laghi. I villaggi sulla costa possono vivere di pesca." />
        </div>
        <div className={styles.splitMedia}>
          <Plate src={`${base}/pt-neve-villaggio.webp`} alt="Un villaggio degli Orchi coperto di neve, con i tetti imbiancati e la palizzata" width={976} height={345} caption="D’inverno la neve si posa prima sulle zone alte, poi imbianca i tetti; con il sereno si scioglie in qualche giorno." />
          <div className={styles.factList}>
            <p><strong>Predatori e mostri</strong><span>Lupi, orsi, iene e serpenti attaccano chi si avvicina troppo. Troll, ciclopi, ogre e minotauri sfondano i cancelli: quando entrano nel territorio suona l’allarme, si arruolano soldati e i più deboli corrono al riparo.</span></p>
            <p><strong>Si nuota, e si può annegare</strong><span>Fiumi e laghi si attraversano a nuoto, ma l’acqua stanca in fretta: chi resta in acqua sfinito annega.</span></p>
            <p><strong>Il posto sbagliato uccide</strong><span>Ogni creatura si piazza dove vuoi, ma fuori dal suo ambiente soffre. Il delfino sulla terra muore in una ventina di secondi, se non riesce a trascinarsi in acqua; la mucca in mare affoga, il cervo nuota finché ha fiato.</span></p>
            <p><strong>Un clima che cambia da solo</strong><span>Piogge in primavera, sereno e temporali d’estate, nebbie d’autunno, neve e bufere d’inverno. Il raccolto ne risente davvero.</span></p>
          </div>
        </div>
      </div>
    </section>

    <section className={styles.chapter} id="mare" aria-labelledby="mare-title">
      <div className={styles.wrap}>
        <header className={styles.chapterHead}><ChapterMark /><p className={styles.eyebrow}>Capitolo 07</p><h2 id="mare-title">Il mare<br />si apre.</h2><p>Il mare non è più un confine. I paesi sulla costa costruiscono il porto, ognuno nello stile del suo popolo, e le canoe escono al largo: a pescare, a commerciare, a fare la guerra e a esplorare i velieri abbandonati. Ogni canoa ha il suo rematore, e non sempre torna.</p></header>
        <Plate src={`${base}/pt-porto-peschereccio.webp`} alt="Il porto peschereccio di un paese umano, con i pesci appesi al molo e una canoa con il suo rematore già in acqua" width={1200} height={520} caption="Il porto peschereccio di un paese umano: i pesci appesi al molo, e la canoa già in acqua con il suo rematore." wide />
        <div className={styles.splitMedia}>
          <div className={styles.factList}>
            <p><strong>Pesca al largo</strong><span>La canoa esce sui banchi di pesci, che si vedono come cerchi nell’acqua, e torna al molo con il doppio del pesce che si prende da riva.</span></p>
            <p><strong>Animali del mare</strong><span>Nel mare vivono delfini in branco e squali. Kraken e serpenti marini sono rarissimi. Tutti nascono con il mondo, e si possono anche piazzare dalla barra.</span></p>
            <p><strong>Si affonda davvero</strong><span>Squali, kraken e serpenti marini puntano chi va per mare: la canoa si danneggia e affonda, e il rematore torna a riva a nuoto. Dopo mezza giornata il porto ne costruisce un’altra.</span></p>
          </div>
          <Plate src={`${base}/pt-mare-animali.webp`} alt="In mare aperto un branco di delfini, la pinna di uno squalo e un kraken con i tentacoli fuori dall’acqua" width={780} height={440} caption="Delfini in branco, la pinna di uno squalo e, rarissimo, un kraken." />
        </div>
        <div className={styles.lifeGrid}>
          <article><span>01</span><h3>Il commercio per mare</h3><p>Il porto mercantile ha una canoa carica di casse. Il paese che ha troppo di qualcosa lo porta a un paese in pace che ne è a corto: la canoa segue una rotta vera lungo le coste e torna con quello che manca.</p></article>
          <article><span>02</span><h3>La guerra sul mare</h3><p>Se il nemico sta su un’altra isola, o per terra la strada è lunga il doppio, i soldati partono dal porto: uno per canoa, una flottiglia intera. In mare l’arco colpisce da lontano e le altre armi da vicino, e chi viene attaccato esce in canoa a difendere il porto.</p></article>
          <article><span>03</span><h3>I velieri abbandonati</h3><p>Al largo di ogni mondo ci sono uno o due velieri: la nave pirata fantasma, piena di scheletri e zombi, e il relitto mezzo affondato, con il kraken in fondo alla stiva. Ci arriva solo chi ha un porto.</p></article>
        </div>
        <div className={styles.twoPlates}>
          <Plate src={`${base}/pt-nave-pirata.webp`} alt="La nave pirata fantasma ferma in mare aperto, con le vele nere, i cannoni e la bandiera col teschio" width={1200} height={520} caption="La nave pirata fantasma: vele nere, cannoni e bandiera col teschio." />
          <Plate src={`${base}/pt-canoe-relitto.webp`} alt="Due canoe partite dal porto di un paese sulla costa si avvicinano al relitto mezzo affondato, mentre dei delfini nuotano lì accanto" width={1200} height={520} caption="Una spedizione parte dal porto verso il relitto: una canoa a testa." />
        </div>
        <Plate src={`${base}/pt-stiva-relitto.webp`} alt="L’interno della stiva del relitto in pixel art: corridoi di legno, ancore e torce, il gruppo di avventurieri e le creature con le loro barre della vita" width={734} height={236} caption="Dentro la stiva del relitto: il gruppo avanza fra ancore e torce, e dal buio escono le creature del mare." wide />
      </div>
    </section>

    <section className={`${styles.chapter} ${styles.chapterAlt}`} id="esplorazione" aria-labelledby="esplorazione-title">
      <div className={styles.wrap}>
        <header className={styles.chapterHead}><ChapterMark /><p className={styles.eyebrow}>Capitolo 08</p><h2 id="esplorazione-title">Sotto terra<br />si muore davvero.</h2><p>Cripte, caverne, rovine, miniere abbandonate: il mondo nasconde luoghi da esplorare, e altri ne nascono dalla storia, come un villaggio raso al suolo che diventa rovina. Gli avventurieri ci entrano con lo zaino pieno, combattono, aprono forzieri, cadono in trappola. Tu li guardi dal vivo, stanza per stanza.</p></header>
        <Plate src={`${base}/pt-dungeon.webp`} alt="L’interno di un dungeon in pixel art: stanze di pietra illuminate dalle torce, forzieri, ossa e un gruppo di avventurieri" width={1176} height={572} caption="Aperto a schermo intero, il luogo mostra ogni stanza: torce, trappole, forzieri e chi ci si avventura." wide />
        <div className={styles.twoPlates}>
          <Plate src={`${base}/pt-richiesta-spedizione.webp`} alt="La richiesta di spedizione di un goblin: pericolo, creature che aspettano dentro e il gruppo che partirebbe" width={627} height={480} caption="Nessuno parte senza il tuo sì: la richiesta mostra il pericolo, chi c’è dentro e chi andrebbe." />
          <Plate src={`${base}/pt-dungeon-riquadro.webp`} alt="Il villaggio sulla mappa con il dungeon aperto in un riquadro in basso a sinistra" width={1168} height={690} caption="Oppure lo segui in un riquadro, mentre il villaggio continua a vivere." />
        </div>
        <div className={styles.lifeGrid}>
          <article><span>01</span><h3>L’avventuriero è un mestiere</h3><p>Chi torna vivo dalla prima spedizione ci prende gusto. Sale di livello, si fa equipaggiare dal fabbro e può diventare celebre.</p></article>
          <article><span>02</span><h3>Mai a mani vuote</h3><p>La spedizione passa dal fabbro: armi, armatura e uno zaino di cibo prima di partire. Nell’Età della Pietra bastano selce e legno.</p></article>
          <article><span>03</span><h3>Quello che cade resta lì</h3><p>Chi muore lascia arma, armatura e attrezzo nel luogo. Tornare a riprendersi la spada di un compagno è una storia, non una riscossione.</p></article>
        </div>
        <div className={styles.splitMedia}>
          <Plate src={`${base}/pt-scheda-spedizioni.webp`} alt="La scheda Spedizioni: il gruppo dentro il relitto, con vita, stamina, armi e tratti di ciascun avventuriero" width={674} height={369} caption="La scheda Spedizioni: chi è in giro, dove, e come sta ciascuno." />
          <div className={styles.factList}>
            <p><strong>Una spedizione per paese</strong><span>Ogni paese manda il suo gruppo, e più spedizioni possono essere in giro insieme. Tocchi quella che vuoi seguire e la passi dal riquadro allo schermo intero.</span></p>
            <p><strong>La scheda Spedizioni</strong><span>Nella barra un numerino dice quante richieste aspettano il tuo sì. Per ogni gruppo in viaggio si vedono vita, stamina, armi e danni di ciascuno; al ritorno un riquadro mostra il bottino portato a casa.</span></p>
          </div>
        </div>
        <div className={styles.splitMedia}>
          <Plate src={`${base}/pt-circo-spettacolo.webp`} alt="Davanti ai tendoni del circo, un giocoliere e un buffone fanno il loro numero per un gruppo di abitanti" width={560} height={340} caption="Al Circo i saltimbanchi fanno lo spettacolo, e chi arriva si ferma a guardare." />
          <div className={styles.factList}>
            <p><strong>Il Circo</strong><span>Una carovana di saltimbanchi si accampa vicino a un villaggio. Giocoliere, buffone e banditore recitano sempre; chi viene a vederli si mette a semicerchio e torna a casa con l’umore alle stelle.</span></p>
            <p><strong>Il Cimitero</strong><span>Un luogo spettrale da cui si riportano reliquie piene di mana, rischiando di svegliare i non morti che poi assaltano il villaggio.</span></p>
          </div>
        </div>
      </div>
    </section>

    <section className={styles.chapter} id="guerra" aria-labelledby="guerra-title">
      <div className={styles.wrap}>
        <header className={styles.chapterHead}><ChapterMark /><p className={styles.eyebrow}>Capitolo 09</p><h2 id="guerra-title">Rancori, confini<br />e guerre.</h2><p>Ogni villaggio ha un territorio che cresce con lui e un colore che lo distingue. Quando due confini si toccano nascono gli attriti: legna, prede e pesca contese, uno straniero ucciso, un’offesa. Il rancore si accumula finché qualcuno dichiara guerra, e il motivo resta scritto. Se il nemico sta oltre il mare, la guerra si combatte anche in canoa.</p></header>
        <Plate src={`${base}/pt-battaglia.webp`} alt="Soldati che si affrontano tra le tende rosse di un villaggio degli Orchi" width={1000} height={438} caption="Le battaglie si combattono sulla mappa, colpo per colpo, sotto i tuoi occhi." wide />
        <div className={styles.lifeGrid}>
          <article><span>01</span><h3>Soldati con la loro arma</h3><p>Ascia per i Nani, arco per gli Elfi, ascia da guerra per gli Orchi, spada e lancia per gli Umani. Ogni esercito si riconosce da lontano, e le frecce si vedono in volo.</p></article>
          <article><span>02</span><h3>Palizzate e cancelli</h3><p>I muri non si attraversano, nemmeno dai lupi. In guerra il cancello si chiude e gli assalitori devono sfondarlo; poi i difensori lo riparano.</p></article>
          <article><span>03</span><h3>Saccheggi e pace</h3><p>Chi vince saccheggia le scorte e brucia qualche edificio. Quando le perdite pesano si tratta la pace, ma i rapporti restano segnati per anni.</p></article>
        </div>
      </div>
    </section>

    <section className={`${styles.chapter} ${styles.chapterAlt}`} id="poteri" aria-labelledby="poteri-title">
      <div className={styles.wrap}>
        <header className={styles.chapterHead}><ChapterMark /><p className={styles.eyebrow}>Capitolo 10</p><h2 id="poteri-title">I poteri<br />del dio.</h2><p>Tutti disponibili da subito, senza ricariche e senza costi. Gli abitanti però si accorgono di te: chi riceve un miracolo diventa devoto, chi vede cadere una meteora scappa terrorizzato, e ogni tuo intervento lascia un segno.</p></header>
        <div className={styles.gallery3}>
          <Plate src={`${base}/pt-meteora.webp`} alt="Una meteora infuocata che cade di notte su un villaggio" width={850} height={292} caption="Meteora" />
          <Plate src={`${base}/pt-eruzione.webp`} alt="Un’eruzione che incendia alberi e terreno accanto a un villaggio" width={876} height={318} caption="Eruzione" />
          <Plate src={`${base}/pt-pioggia.webp`} alt="La pioggia che cade di notte su un villaggio" width={850} height={292} caption="Pioggia" />
        </div>
        <div className={styles.powerGrid}>
          {powers.map(([title, text]) => <article key={title}><h3>{title}</h3><p>{text}</p></article>)}
        </div>
      </div>
    </section>

    <section className={styles.chapter} id="sviluppo" aria-labelledby="sviluppo-title">
      <div className={styles.wrap}>
        <header className={styles.chapterHead}><ChapterMark /><p className={styles.eyebrow}>Capitolo 11</p><h2 id="sviluppo-title">A che punto siamo.</h2><p>Prima Terra è stata ricostruita da zero su basi più solide, con una grafica unica e coerente in ogni elemento, pensata per girare fluida anche sul telefono. Il mondo è già vivo nel prototipo, dai villaggi ai dungeon fino all’Età Moderna, e da poco anche il mare, con porti, canoe e velieri. Davanti ci sono la fede, gli oggetti leggendari e le rifiniture.</p></header>
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
        <div className={styles.interfaceShowcase}>
          <Plate src={`${base}/pt-scheda-abitante.webp`} alt="La scheda di un abitante con le sezioni Vita, Mestiere, Famiglia e Storia, le barre dei bisogni e i poteri sulla persona" width={284} height={334} />
          <div>
            <p className={styles.eyebrow}>Computer e telefono</p>
            <h3>Stessa esperienza, ovunque.</h3>
            <p>Si gioca dal browser. L’interfaccia in pixel art lascia quasi tutta la mappa libera: una barra di sole icone in basso per terreni, abitanti, animali, fattoria, mostri, biomi, poteri, villaggi, spedizioni, cronaca e mondo. Le schede si aprono con un tocco e si leggono in un secondo, e sul telefono un dito dipinge mentre due spostano la vista.</p>
            <p>E il mondo si sente: di solito suona una musica tranquilla, che diventa musica da battaglia quando arrivano guerre o mostri. Si sente l’ambiente che stai guardando, dal bosco al mare, dalla neve al temporale, e da vicino i colpi d’ascia, le porte, le lotte e i versi di molti animali. Musica ed effetti hanno il loro volume, e c’è il tasto muto.</p>
          </div>
        </div>
        <div className={styles.facts}>
          <p><span>Genere</span><strong>Sandbox divino in pixel art</strong></p>
          <p><span>Dove si gioca</span><strong>Nel browser, su computer e telefono</strong></p>
          <p><span>Lingua</span><strong>Italiano</strong></p>
          <p><span>Disponibilità</span><strong>Da annunciare</strong></p>
        </div>
        <Link className={styles.primary} href="/cronache-del-nexus">Segui le novità dal Nexus →</Link>
        <div style={{ marginTop: 32, maxWidth: 640 }}><NewsletterSignup variant="avvisami" topic="avvisami:sandbox" tone="dark" headingLevel={3} description="Lascia l’email: ti scriveremo una sola volta, quando Prima Terra sarà giocabile. Nessun’altra comunicazione." /></div>
        <p className={styles.credits}>Grafica realizzata con il Minifantasy Complete Bundle di Krishna Palacio.</p>
      </div>
    </section>

    <footer className={styles.finale}>
      <Image className={styles.finaleLogo} src={logo} alt="Prima Terra" width={1032} height={324} unoptimized />
      <p>Il mondo è pronto. Manca solo il primo abitante.</p>
    </footer>
  </main>;
}
