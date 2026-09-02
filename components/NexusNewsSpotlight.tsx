import Image from "next/image";
import Link from "next/link";
import styles from "./NexusNewsSpotlight.module.css";

const newsPanels = [
  { id: "famiglio", number: "01", label: "Famiglio" },
  { id: "benefits", number: "02", label: "Vantaggi" },
  { id: "vip", number: "03", label: "Universe Pass" },
  { id: "wound", number: "04", label: "The Wound Remembers" },
] as const;

type NewsPanelId = (typeof newsPanels)[number]["id"];

function panelFromQuery(value?: string): NewsPanelId {
  return newsPanels.some((panel) => panel.id === value) ? value as NewsPanelId : "famiglio";
}

function panelHref(panel: NewsPanelId) {
  return `/cronache-del-nexus?novita=${panel}#novita-in-primo-piano`;
}

const familiarBenefits = [
  {
    number: "01",
    title: "Un compagno da scegliere",
    text: "Scegli il pet che senti più vicino, dagli un nome e costruisci un legame che rimane collegato al tuo LoreWise ID.",
    image: "/famiglio/navigation/cambia-v1.svg",
    alt: "Simbolo della scelta del Famiglio",
  },
  {
    number: "02",
    title: "Cure che lasciano un segno",
    text: "Nutrilo, gioca, prenditi cura di lui e concedigli riposo: ogni gesto contribuisce al suo benessere e alla vostra storia.",
    image: "/famiglio/needs/felicita-v2.png",
    alt: "Simbolo della felicità del Famiglio",
  },
  {
    number: "03",
    title: "Crescita e ricompense",
    text: "Il legame sale di livello e apre titoli, ricompense, nuove possibilità e vantaggi progressivi nel LoreWise Universe.",
    image: "/famiglio/navigation/missioni-v1.webp",
    alt: "Libro delle missioni e della crescita del Famiglio",
  },
  {
    number: "04",
    title: "Un mondo da esplorare",
    text: "Parti per brevi avventure, completa missioni e riporta nella tana monete, scoperte, cartoline e nuovi ricordi.",
    image: "/famiglio/navigation/fuori-casa-v1.webp",
    alt: "Portale delle esplorazioni del Famiglio",
  },
];

export function NexusNewsSpotlight({ panel }: { panel?: string }) {
  const activePanel = panelFromQuery(panel);
  const activeIndex = newsPanels.findIndex((panel) => panel.id === activePanel);
  const previousPanel = newsPanels[(activeIndex - 1 + newsPanels.length) % newsPanels.length];
  const nextPanel = newsPanels[(activeIndex + 1) % newsPanels.length];

  return <section className={styles.news} id="novita-in-primo-piano" aria-labelledby="nexus-news-title">
    <div className={`shell ${styles.masthead}`}>
      <div className={styles.mastheadCopy}>
        <p className={styles.kicker}>Edizione speciale · Novità dal Nexus</p>
        <h2 id="nexus-news-title">Due mondi stanno per cambiare.</h2>
        <p>Un compagno da crescere ogni giorno. Una nuova ferita pronta ad aprirsi. Le prossime storie di LoreWise iniziano da qui.</p>
      </div>
      <div className={styles.issueMark} aria-label="Due grandi novità">
        <span>NUOVE</span><strong>02</strong><small>storie in primo piano</small>
      </div>
    </div>

    <div className={`shell ${styles.chapterNavigation}`}>
      <div className={styles.chapterHeading}><span>Sfoglia le novità</span><strong>{String(activeIndex + 1).padStart(2, "0")} / {String(newsPanels.length).padStart(2, "0")}</strong></div>
      <div className={styles.chapterTabs} role="tablist" aria-label="Sezioni delle novità dal Nexus">
        {newsPanels.map((panel) => <Link href={panelHref(panel.id)} role="tab" id={`nexus-news-${panel.id}-tab`} aria-controls={`nexus-news-${panel.id}-panel`} aria-selected={activePanel === panel.id} className={activePanel === panel.id ? styles.activeTab : undefined} key={panel.id}><span>{panel.number}</span>{panel.label}</Link>)}
      </div>
    </div>

    {activePanel === "famiglio" && <article className={`shell ${styles.familiarFeature}`} role="tabpanel" id="nexus-news-famiglio-panel" aria-labelledby="nexus-news-famiglio-tab">
      <figure className={styles.familiarScene}>
        <Image src="/novita/famiglio/famiglio-del-nexus-spot-v2.webp" alt="I cinque Famigli iniziali nelle nicchie del Santuario: gatto, cane, lupo, coniglio e volpe" width={1672} height={941} sizes="(max-width: 900px) 100vw, 62vw" unoptimized />
        <figcaption><span>Nuova esperienza LoreWise</span><strong>Cura, gioco e crescita nel cuore del Santuario.</strong></figcaption>
      </figure>
      <div className={styles.familiarLead}>
        <span className={styles.storyNumber}>Storia 01</span>
        <p className={styles.sectionLabel}>Famiglio del Nexus</p>
        <h3 id="familiar-news-title">Non è soltanto un pet.<br />È il legame che costruite.</h3>
        <p>Adotta il tuo compagno preferito, accoglilo nella tana e prenditene cura nel tempo. Il Famiglio reagisce alle tue attenzioni, cresce con te e trasforma le visite nel LoreWise Universe in una piccola avventura condivisa.</p>
        <div className={styles.actions}>
          <Link href="/famiglio">Entra nel Santuario <span aria-hidden="true">→</span></Link>
          <Link href={panelHref("benefits")}>Scopri i vantaggi</Link>
        </div>
      </div>
    </article>}

    {activePanel === "benefits" && <div className={`shell ${styles.familiarBenefits}`} role="tabpanel" id="nexus-news-benefits-panel" aria-labelledby="nexus-news-benefits-tab">
      <header>
        <p className={styles.sectionLabel}>Perché allevare il tuo Famiglio</p>
        <h3>Ogni attenzione apre qualcosa di nuovo.</h3>
        <p>La cura quotidiana non è un contatore da riempire: costruisce personalità, ricordi, percorsi e ricompense che accompagnano il tuo profilo.</p>
      </header>
      <div className={styles.benefitLedger}>
        {familiarBenefits.map((benefit) => <article key={benefit.number}>
          <span>{benefit.number}</span>
          <Image src={benefit.image} alt={benefit.alt} width={360} height={360} sizes="(max-width: 720px) 74px, 92px" unoptimized />
          <div><h4>{benefit.title}</h4><p>{benefit.text}</p></div>
        </article>)}
      </div>
    </div>}

    {activePanel === "vip" && <section className={styles.passFeature} role="tabpanel" id="nexus-news-vip-panel" aria-labelledby="nexus-news-vip-tab">
      <div className={`shell ${styles.passInner}`}>
        <div className={styles.passSeal}>
          <Image src="/brand/icons/lorewise-vip-official-v1.webp" alt="Sigillo LoreWise VIP" width={1024} height={1024} sizes="180px" unoptimized />
          <span><strong>+2</strong> Famigli</span>
        </div>
        <div className={styles.passCopy}>
          <p className={styles.premiumLabel}>Vantaggio Universe Pass</p>
          <h3 id="premium-news-title">Gli abbonati iniziano con due compagni in più.</h3>
          <p>Oltre alla scelta disponibile per tutti, chi ha un abbonamento attivo riceve <strong>due Famigli extra inclusi</strong>: più personalità da conoscere, più modi di vivere la tana e più storie da far crescere.</p>
          <ul>
            <li>Due Famigli aggiuntivi senza acquisto separato</li>
            <li>Accesso legato al LoreWise ID con abbonamento attivo</li>
            <li>Stesse cure, crescita, missioni e ricordi del compagno principale</li>
          </ul>
          <Link href="/abbonamento">Scopri tutti i vantaggi VIP <span aria-hidden="true">→</span></Link>
        </div>
        <figure className={styles.passIllustration}>
          <Image src="/famiglio/themes/biblioteca-astrale/notte-v1.png" alt="Dimora notturna del Famiglio nella Biblioteca astrale" width={1536} height={1024} sizes="(max-width: 900px) 100vw, 36vw" unoptimized />
        </figure>
      </div>
    </section>}

    {activePanel === "wound" && <article className={`shell ${styles.woundFeature}`} role="tabpanel" id="nexus-news-wound-panel" aria-labelledby="nexus-news-wound-tab">
      <div className={styles.woundVisual}>
        <Image className={styles.woundArt} src="/games/the-wound-remembers/key-art-scene-4k-v3.webp" alt="Kharvoss fra i due draghi nel santuario ferito di The Wound Remembers" width={3840} height={2160} sizes="(max-width: 900px) 100vw, 58vw" unoptimized />
        <Image className={styles.woundLogo} src="/games/the-wound-remembers/logo-white-v2.webp" alt="The Wound Remembers" width={1600} height={900} sizes="(max-width: 700px) 62vw, 360px" unoptimized />
      </div>
      <div className={styles.woundCopy}>
        <span className={styles.storyNumber}>Storia 02</span>
        <p className={styles.woundLabel}>Nuova espansione · Lavori iniziati</p>
        <h3 id="wound-news-title">La Ferita si sta aprendo ancora.</h3>
        <p>Sono iniziati i lavori sulla nuova espansione di <em>The Wound Remembers</em>. Nuove informazioni verranno svelate quando saranno pronte, mentre il gioco attuale resta accessibile e continua il suo cammino.</p>
        <div className={styles.accessPlaques}>
          <div><span>Per tutti</span><strong>Versione web accessibile</strong><p>Entra dal browser e gioca senza abbonamento.</p></div>
          <div><span>Universe Pass</span><strong>Versione PC inclusa</strong><p>Gli abbonati potranno scaricare gratuitamente l’edizione Windows.</p></div>
        </div>
        <div className={styles.woundActions}>
          <a href="https://thewoundremembers.com/" target="_blank" rel="noopener noreferrer">Gioca sul web <span aria-hidden="true">↗</span></a>
          <Link href="/giochi/the-wound-remembers">Apri il dossier del gioco <span aria-hidden="true">→</span></Link>
        </div>
      </div>
    </article>}

    <div className={`shell ${styles.panelControls}`} aria-label="Cambia sezione delle novità">
      <Link href={panelHref(previousPanel.id)} aria-label={`Sezione precedente: ${previousPanel.label}`}>←</Link>
      <span><strong>{newsPanels[activeIndex].label}</strong><small>Una sezione alla volta</small></span>
      <Link href={panelHref(nextPanel.id)} aria-label={`Sezione successiva: ${nextPanel.label}`}>→</Link>
    </div>
  </section>;
}
