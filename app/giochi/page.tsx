import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { gameProjects } from "@/lib/gameCatalog";
import { accessModels, developmentStages, projectDossierFields } from "@/lib/gameStudio";
import { UniverseGuide } from "@/components/UniverseGuide";

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
            <p>Tre mondi, tre esperienze diverse: carte dark fantasy, avventura multiversale e un match-3 horror costruito come RPG rituale.</p>
            <a className="studio-games-hero-action" href="#progetti">Scopri i giochi <span aria-hidden="true">↓</span></a>
          </div>
          <div className="studio-games-hero-titles" aria-label="Titoli in catalogo">
            {gameProjects.map((project) => (
              <Link href={`/giochi/${project.slug}`} key={project.slug}>
                {project.logoImage ? <Image src={project.logoImage} alt={project.title} width={1200} height={600} unoptimized /> : <strong>{project.title}</strong>}
                <span>{project.statusTone === "available" ? "Giocabile ora" : "In sviluppo"}</span>
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
          <Link href="/download-app"><span>05</span>Scarica l’app</Link>
          <Link href="/giochi/guide"><span>06</span>Guide</Link>
        </div>
      </nav>

      <section className="studio-guides-callout" aria-labelledby="studio-guides-callout-title">
        <div className="shell">
          <div>
            <p className="eyebrow">Atlante dei Giochi</p>
            <h2 id="studio-guides-callout-title">Una nuova guida<br />ogni lunedì.</h2>
          </div>
          <div>
            <strong>Prima nell’area VIP. Poi disponibile qui per tutti.</strong>
            <p>La guida della settimana arriva in anteprima per gli abbonati e, il lunedì successivo, passa automaticamente nella raccolta pubblica di Giochi.</p>
            <Link href="/giochi/guide">Apri le guide <span aria-hidden="true">→</span></Link>
          </div>
        </div>
      </section>

      <section className="shell studio-real-projects" id="progetti" aria-labelledby="real-projects-title">
        <header><div><p className="eyebrow">Catalogo GiWise Studio</p><h2 id="real-projects-title">Scegli il tuo mondo.</h2></div><p>Ogni copertina presenta il vero universo del gioco, il logo originale e lo stato attuale del progetto.</p></header>
        <div className="studio-real-project-list">
          {gameProjects.map((project, index) => (
            <article className={`studio-real-project studio-real-project-${project.statusTone}`} key={project.slug}>
              <Link className="studio-real-project-visual" href={`/giochi/${project.slug}`} aria-label={`Apri la scheda di ${project.title}`}>
                <Image src={project.catalogCoverImage ?? project.coverImage ?? project.heroImage} alt={project.catalogCoverAlt ?? project.coverAlt ?? project.heroAlt} width={2000} height={1250} unoptimized />
                {project.logoImage ? <Image className="studio-real-project-logo" src={project.logoImage} alt="" width={1600} height={900} unoptimized /> : <strong>{project.title}</strong>}
                <span className={`studio-real-project-state studio-real-project-state-${project.statusTone}`}>
                  <strong>{project.statusTone === "available" ? "Giocabile ora" : "In sviluppo"}</strong>
                  <small>{project.statusTone === "available" ? "Download Windows in preparazione" : "Accesso pubblico non ancora disponibile"}</small>
                </span>
              </Link>
              <div className="studio-real-project-copy">
                <div><span>0{index + 1} · {project.code}</span><strong className={`game-project-status game-project-status-${project.statusTone}`}>{project.status}</strong></div>
                <p>{project.kind}</p><h3><Link href={`/giochi/${project.slug}`}>{project.title}</Link></h3><p>{project.summary}</p>
                <dl><div><dt>Versione</dt><dd>{project.version}</dd></div><div><dt>Accesso</dt><dd>{project.access}</dd></div><div><dt>Piattaforme</dt><dd>{project.platforms.join(" · ")}</dd></div></dl>
                <Link className="studio-real-project-link" href={`/giochi/${project.slug}`}>Apri il dossier completo <span aria-hidden="true">→</span></Link>
              </div>
            </article>
          ))}
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

      <section className="studio-app-download-callout" aria-labelledby="studio-app-download-title">
        <div className="shell">
          <div><p className="eyebrow">LoreWise per Android</p><h2 id="studio-app-download-title"><span>L’universo</span><br />in una sola app.</h2></div>
          <div><p>Versione, requisiti, stato del collaudo e file ufficiale saranno raccolti in una pagina dedicata.</p><Link href="/download-app">Apri il centro download <span aria-hidden="true">→</span></Link></div>
        </div>
      </section>

      <section className="studio-games-next" aria-labelledby="studio-next-title">
        <div className="shell">
          <p className="eyebrow">Distribuzione GiWise Studio</p>
          <h2 id="studio-next-title">Prima nel nostro catalogo.</h2>
          <p>Le edizioni EXE e APK dei giochi GiWise Studio saranno distribuite inizialmente da LoreWise Universe, con versione, integrità e requisiti verificati. Gli store esterni verranno valutati soltanto dopo il completamento e il collaudo reale di ogni titolo.</p>
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
