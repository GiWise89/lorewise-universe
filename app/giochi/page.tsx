import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { gameProjects } from "@/lib/gameCatalog";
import { accessModels, developmentStages, projectDossierFields } from "@/lib/gameStudio";
import { UniverseGuide } from "@/components/UniverseGuide";
import { FunnelLink } from "@/components/FunnelLink";

const gamePresentation = {
  "the-wound-remembers": { label: "Giocabile ora", tone: "available", note: "Apri la versione web e inizia subito." },
  "demon-match-three": { label: "In sviluppo", tone: "development", note: "Segui la costruzione dell’esperienza Android." },
  "lorewise-fuori-trama-next": { label: "In arrivo", tone: "upcoming", note: "Scopri il progetto prima della futura apertura pubblica." },
} as const;

export const metadata: Metadata = {
  title: "Giochi e app di GiWise Studio",
  description: "Giochi, applicazioni, anteprime e diari di sviluppo di GiWise Studio, raccolti nell’area interattiva di LoreWise Universe.",
};

export default function GamesPage() {
  return (
    <main className="studio-games-page">
      <section className="studio-games-hero" aria-labelledby="studio-games-title">
        <div className="studio-games-hero-backdrop" aria-hidden="true">
          {gameProjects.map((project) => (
            <Image key={project.slug} src={project.catalogCoverImage ?? project.heroImage} alt="" width={2000} height={1250} priority unoptimized />
          ))}
        </div>
        <div className="shell studio-games-hero-grid">
          <div className="studio-games-hero-copy">
            <p className="eyebrow">GiWise Studio · Catalogo videogiochi</p>
            <h1 id="studio-games-title">Entra<br />nel gioco.</h1>
            <p><strong>The Wound Remembers è giocabile ora:</strong> costruisci un Patto, affronta Nemesi PvE e combatti su tre corsie. Gli altri progetti restano consultabili nel catalogo.</p>
            <FunnelLink className="studio-games-hero-action" href="https://thewoundremembers.com/" eventName="play_cta_click" source="games_hero">Gioca a The Wound Remembers <span aria-hidden="true">→</span></FunnelLink>
          </div>
          <div className="studio-games-hero-titles" aria-label="Titoli in catalogo">
            {gameProjects.map((project) => (
              <Link href={`/giochi/${project.slug}`} key={project.slug}>
                {project.logoImage ? <Image src={project.logoImage} alt={project.title} width={1200} height={600} unoptimized /> : <strong>{project.title}</strong>}
                <span>{gamePresentation[project.slug as keyof typeof gamePresentation]?.label ?? project.status}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <nav className="studio-games-index" aria-label="Indice della sezione Giochi e App">
        <div className="shell">
          <a href="#progetti"><span>01</span>Progetti</a>
          <a href="#diario"><span>02</span>Diario</a>
          <a href="#accesso"><span>03</span>Accesso</a>
          <a href="#community"><span>04</span>Community</a>
          <Link href="/giochi/guide"><span>05</span>Guide</Link>
          <Link href="/giochi/nexus-pet"><span>06</span>Famigli del Nexus</Link>
        </div>
      </nav>

      <section className="shell studio-game-gateway studio-real-projects studio-game-gateway-merged" id="progetti" aria-labelledby="studio-game-gateway-title">
        <header>
          <div><p className="eyebrow">Catalogo GiWise Studio</p><h2 id="studio-game-gateway-title">Scegli il tuo mondo.</h2></div>
          <p>Stato, piattaforme e modalità di accesso sono visibili subito. Apri il dossier del progetto per gameplay, aggiornamenti e dettagli completi.</p>
        </header>
        <div className="studio-game-gateway-grid">
          {gameProjects.map((project, index) => {
            const presentation = gamePresentation[project.slug as keyof typeof gamePresentation];
            return <article className={`is-${presentation?.tone ?? project.statusTone}`} key={project.slug}>
              <div className="studio-game-gateway-visual"><Image src={project.catalogCoverImage ?? project.coverImage ?? project.heroImage} alt={project.catalogCoverAlt ?? project.coverAlt ?? project.heroAlt} fill sizes="(max-width: 760px) 100vw, 33vw" unoptimized /></div>
              <div className="studio-game-gateway-copy">
                <div className="studio-game-gateway-status"><span>{presentation?.label ?? project.status}</span><small>0{index + 1} · {project.code}</small></div>
                <p className="studio-game-gateway-kind">{project.kind}</p>
                <h3>{project.title}</h3>
                <p className="studio-game-gateway-intro">{presentation?.note ?? project.summary}</p>
                <p className="studio-game-gateway-summary">{project.summary.split(".")[0]}.</p>
                <dl><div><dt>Versione</dt><dd>{project.version}</dd></div><div><dt>Accesso</dt><dd>{project.access}</dd></div><div><dt>Piattaforme</dt><dd>{project.platforms.join(" · ")}</dd></div></dl>
                <div className="studio-game-gateway-actions">
                  {project.slug === "the-wound-remembers" && project.publicUrl
                    ? <><FunnelLink className="is-primary" href={project.publicUrl} eventName="play_cta_click" source="games_gateway">Gioca ora <b aria-hidden="true">→</b></FunnelLink><Link href={`/giochi/${project.slug}`}>Gameplay e dettagli</Link></>
                    : <Link className="is-primary" href={`/giochi/${project.slug}`}>Apri il dossier completo <b aria-hidden="true">→</b></Link>}
                </div>
              </div>
            </article>;
          })}
        </div>
      </section>

      <section className="studio-guides-callout" aria-labelledby="studio-guides-callout-title">
        <div className="shell">
          <div>
            <p className="eyebrow">Atlante dei Giochi</p>
            <h2 id="studio-guides-callout-title">Guide per continuare.</h2>
          </div>
          <div>
            <strong>Approfondimenti separati dal percorso per iniziare.</strong>
            <p>Le guide restano disponibili per chi vuole approfondire sistemi e percorsi dopo aver scoperto i giochi.</p>
            <Link href="/giochi/guide">Apri le guide <span aria-hidden="true">→</span></Link>
          </div>
        </div>
      </section>

      <section className="studio-guides-callout" aria-labelledby="nexus-pet-guide-title">
        <div className="shell">
          <div>
            <p className="eyebrow">Esperienza interattiva LoreWise</p>
            <h2 id="nexus-pet-guide-title">Famigli<br />del Nexus.</h2>
          </div>
          <div>
            <strong>Casa, crescita, missioni, spedizioni e battaglie.</strong>
            <p>Scopri come scegliere il primo Uovo, costruire il Legame e accompagnare il tuo Famiglio fino alla Torre del Nexus.</p>
            <Link href="/giochi/nexus-pet">Apri la guida completa <span aria-hidden="true">→</span></Link>
          </div>
        </div>
      </section>

      <section className="studio-dossier-section" aria-labelledby="studio-dossier-title">
        <div className="shell studio-dossier-grid">
          <div className="studio-dossier-art">
            <Image src="/brand/icons/giochi-concept-v1.webp" alt="Mondo fantastico e controller, simbolo dei progetti interattivi GiWise Studio" width={1536} height={1024} unoptimized />
          </div>
          <div className="studio-dossier-copy">
            <p className="eyebrow">Scheda progetto</p>
            <h2 id="studio-dossier-title">Tutto ciò che serve,<br />nel posto giusto.</h2>
            <ol>{projectDossierFields.map((field, index) => <li key={field}><span>{String(index + 1).padStart(2, "0")}</span>{field}</li>)}</ol>
          </div>
        </div>
      </section>

      <section className="section shell studio-development" id="diario" aria-labelledby="studio-development-title">
        <header><p className="eyebrow">Diario dello studio</p><h2 id="studio-development-title">Seguire il lavoro,<br />non soltanto l’uscita.</h2><p>Ogni aggiornamento sarà collegato al progetto corretto e conserverà una data, una versione e un contenuto verificabile.</p></header>
        <div className="studio-development-list">
          {developmentStages.map((stage) => (
            <article key={stage.number}>
              <span>{stage.number}</span>
              <div><h3>{stage.title}</h3><p>{stage.description}</p></div>
              <aside><small>Materiale pubblico</small><strong>{stage.publicMaterial}</strong></aside>
            </article>
          ))}
        </div>
      </section>

      <section className="studio-access-section" id="accesso" aria-labelledby="studio-access-title">
        <div className="shell">
          <header><p className="eyebrow">Accesso trasparente</p><h2 id="studio-access-title">Prima di giocare,<br />sai sempre cosa scegli.</h2></header>
          <div className="studio-access-list">
            {accessModels.map((model, index) => (
              <article key={model.title}>
                <span>0{index + 1} · {model.label}</span><h3>{model.title}</h3><p>{model.description}</p><small>{model.note}</small>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section shell studio-community" id="community" aria-labelledby="studio-community-title">
        <div>
          <p className="eyebrow">Community futura</p>
          <h2 id="studio-community-title">Gioca. Valuta.<br />Aiuta a migliorare.</h2>
          <p>Gli utenti registrati potranno lasciare una valutazione, scrivere una recensione e partecipare ai test quando un progetto aprirà questa possibilità. Moderazione e protezione dallo spam faranno parte del sistema fin dall’inizio.</p>
        </div>
        <aside>
          <span>Accesso richiesto</span>
          <strong>Profilo LoreWise Universe</strong>
          <ul><li>Recensioni legate a un account</li><li>Feedback sulle versioni provate</li><li>Segnalazioni e moderazione</li><li>Vantaggi dell’abbonamento futuro</li></ul>
        </aside>
      </section>

      <section className="studio-games-next" aria-labelledby="studio-next-title">
        <div className="shell">
          <p className="eyebrow">Distribuzione GiWise Studio</p>
          <h2 id="studio-next-title">Prima nel nostro catalogo.</h2>
          <p>Le edizioni digitali dei giochi GiWise Studio saranno distribuite inizialmente da LoreWise Universe, con versione, integrità e requisiti verificati. Gli store esterni verranno valutati soltanto dopo il completamento e il collaudo reale di ogni titolo.</p>
          <Link href="/contatti">Assistenza Giochi e App <span aria-hidden="true">→</span></Link>
        </div>
      </section>
      <UniverseGuide current="Giochi" items={[
        { href: "/dove-nascono-i-mondi", label: "Diari di sviluppo", description: "Mesi di codice, prove, disegni e scelte dietro ogni gioco." },
        { href: "/enciclopedia", label: "LoreWise Codex", description: "Personaggi, universi, fonti e continuità separate." },
        { href: "/assistenza-giochi", label: "Assistenza giochi", description: "Requisiti, installazione e supporto tecnico." },
      ]} />
    </main>
  );
}
