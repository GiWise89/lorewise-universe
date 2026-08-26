import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { gameProjects, getGameProject } from "@/lib/gameCatalog";
import { GamePurchaseButton } from "@/components/GamePurchaseButton";
import { GameCommunityReviews } from "@/components/GameCommunityReviews";

export function generateStaticParams() { return gameProjects.map((project) => ({ slug: project.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const project = getGameProject((await params).slug);
  if (!project) return { title: "Progetto non trovato" };
  return { title: project.title, description: project.summary, openGraph: { title: project.title, description: project.summary, type: "article", images: [{ url: project.coverImage ?? project.heroImage, alt: project.coverAlt ?? project.heroAlt }] }, twitter: { card: "summary_large_image", title: project.title, description: project.summary, images: [project.coverImage ?? project.heroImage] } };
}

export default async function GameProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const project = getGameProject((await params).slug);
  if (!project) notFound();
  const isFuoriTrama = project.slug === "lorewise-fuori-trama-next";
  const isDemonMatch = project.slug === "demon-match-three";
  const isDevelopmentOnly = project.statusTone === "development" && !project.freeAccess;
  return <main className={`game-dossier-page game-dossier-${project.statusTone}${isFuoriTrama ? " game-dossier-fuori-trama" : ""}${isDemonMatch ? " game-dossier-demon-match" : ""}`}>
    <div className="shell game-dossier-breadcrumbs"><Link href="/giochi">← Torna a Giochi e App</Link><span>{project.code}</span></div>
    <article>
      <header className="game-dossier-hero">
        <Image className="game-dossier-hero-art game-dossier-hero-art-desktop" src={project.heroImage} alt={project.heroAlt} width={3840} height={2160} priority unoptimized />
        {project.mobileHeroImage ? <Image className="game-dossier-hero-art game-dossier-hero-art-mobile" src={project.mobileHeroImage} alt={project.heroAlt} width={1440} height={2560} priority unoptimized /> : null}
        <div className="game-dossier-hero-shade" aria-hidden="true" />
        <div className="shell game-dossier-hero-copy"><span className={`game-project-status game-project-status-${project.statusTone}`}>{project.status}</span>{project.logoImage ? <><Image className="game-dossier-logo" src={project.logoImage} alt="" width={1600} height={900} unoptimized /><h1 className="codex-visually-hidden">{project.title}</h1></> : <h1>{project.title}</h1>}<p>{project.subtitle}</p><div className="game-dossier-hero-actions">{isFuoriTrama ? <><a className="game-hero-primary" href="#come-si-gioca">Scopri come si gioca</a><a className="game-hero-secondary" href="#sviluppo">Segui lo sviluppo</a></> : isDemonMatch ? <><a className="game-hero-primary" href="#come-si-gioca">Scopri il gameplay</a><a className="game-hero-secondary" href="#edizione-windows">Stato Android</a></> : <>{project.publicUrl && project.publicAction ? <a className="game-hero-primary" href={project.publicUrl} target="_blank" rel="noopener noreferrer">{project.publicAction} <span aria-hidden="true">↗</span></a> : null}{project.windowsOffer ? <a className="game-hero-secondary" href="#edizione-windows">Edizione Windows · {project.windowsOffer.launchPrice}</a> : null}</>}</div></div>
      </header>

      <section className="shell game-dossier-summary" aria-labelledby="game-summary-title"><div><p className="eyebrow">Progetto GiWise Studio</p><h2 id="game-summary-title">{project.title}</h2><p>{project.summary}</p></div><dl><div><dt>Stato</dt><dd>{project.status}</dd></div><div><dt>Versione</dt><dd>{project.version}</dd></div><div><dt>Ultimo aggiornamento</dt><dd>{project.latestUpdate?.date ?? "In sviluppo · data pubblica non definita"}</dd></div><div><dt>Lingua</dt><dd>{project.languages.join(" · ")}</dd></div><div><dt>Tipo</dt><dd>{project.kind}</dd></div><div><dt>Piattaforme</dt><dd>{project.platforms.join(" · ")}</dd></div><div><dt>Accesso</dt><dd>{project.access}</dd></div><div><dt>Prezzo</dt><dd>{project.price}</dd></div></dl></section>

      <section className="shell game-dossier-story" aria-labelledby="game-story-title"><span>01</span><div><p className="eyebrow">Identità del progetto</p><h2 id="game-story-title">Il gioco</h2>{project.description.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div></section>

      {project.protagonistReveal ? <section className="game-protagonist-reveal" id="protagonisti" aria-labelledby="game-protagonist-title">
        <div className="shell game-protagonist-intro">
          <figure><Image src={project.protagonistReveal.image} alt={project.protagonistReveal.imageAlt} width={941} height={1672} unoptimized /></figure>
          <div><p className="eyebrow">{project.protagonistReveal.eyebrow}</p><h2 id="game-protagonist-title">{project.protagonistReveal.title}</h2><p>{project.protagonistReveal.introduction}</p><Link href="/vip-zone?area=games&game=demon-match-three#vip-demon-match">Apri l’anteprima nell’Area VIP <span aria-hidden="true">→</span></Link></div>
        </div>
        <div className="shell game-protagonist-pair">
          {project.protagonistReveal.characters.map((character) => <article className={`is-${character.tone}`} key={character.name}>
            <figure><Image src={character.image} alt={character.imageAlt} width={1024} height={1536} unoptimized /></figure>
            <div><span>{character.faction}</span><h3>{character.name}</h3><p>{character.calling}</p></div>
          </article>)}
        </div>
        <p className="shell game-protagonist-closing">{project.protagonistReveal.closing}</p>
      </section> : null}

      {project.narrativeFeature ? <section className="game-nexus-story" aria-labelledby="game-nexus-story-title"><Image src={project.narrativeFeature.image} alt={project.narrativeFeature.imageAlt} width={1920} height={1080} unoptimized /><div aria-hidden="true" /><div className="shell"><p className="eyebrow">{project.narrativeFeature.eyebrow}</p><h2 id="game-nexus-story-title">{project.narrativeFeature.title}</h2>{project.narrativeFeature.description.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div></section> : null}

      {project.playFlow ? <section className="game-play-flow" id="come-si-gioca" aria-labelledby="game-play-title"><div className="shell"><header><p className="eyebrow">{isFuoriTrama ? "Dalla cronaca al duello" : isDemonMatch ? "Dall’obiettivo alla ricompensa" : "Una partita, dall’inizio alla cicatrice"}</p><h2 id="game-play-title">Come si gioca.</h2>{isFuoriTrama ? <p className="game-play-flow-note">Cinque catture reali della build desktop corrente, presentate nel loro rapporto originale e senza tagli: campagne, compagnia, tavolo tattico, dossier e combattimento con carte.</p> : isDemonMatch ? <p className="game-play-flow-note">Cinque catture reali della build Android corrente, mostrate interamente e senza ritagli: mappa, briefing, preparazione dei potenziamenti, fusione e cascata. Il dossier resta privo di spoiler sui protagonisti.</p> : null}</header><ol>{project.playFlow.map((step) => <li key={step.number}><div className="game-play-flow-image"><Image src={step.image} alt={step.imageAlt} width={2560} height={1440} unoptimized /></div><div><span>{step.number}</span><h3>{step.title}</h3><p>{step.description}</p></div></li>)}</ol></div></section> : null}

      <section className="game-dossier-features" aria-labelledby="game-features-title"><div className="shell"><header><p className="eyebrow">Sistema e contenuti</p><h2 id="game-features-title">Cosa contiene.</h2></header><ol>{project.features.map((feature, index) => <li key={feature}><span>{String(index + 1).padStart(2, "0")}</span><strong>{feature}</strong></li>)}</ol></div></section>

      <section className="shell game-known-issues" aria-labelledby="game-known-issues-title"><header><p className="eyebrow">Trasparenza del progetto</p><h2 id="game-known-issues-title">Limiti conosciuti e materiali.</h2><p>{project.mediaNote}</p></header><ol>{project.knownIssues.map((issue, index) => <li key={issue}><span>{String(index + 1).padStart(2, "0")}</span><p>{issue}</p></li>)}</ol></section>

      {project.latestUpdate ? <section className="game-development-journal" id="sviluppo" aria-labelledby="game-journal-title"><div className="shell">
        <header className="game-journal-heading"><div><p className="eyebrow">Aggiornamenti ufficiali</p><h2 id="game-journal-title">{isFuoriTrama ? "Il Nexus prende forma." : isDemonMatch ? "La griglia prende vita su Android." : "Il gioco continua."}</h2></div><p>Versioni, lavori in corso e stato delle piattaforme vengono pubblicati qui senza anticipazioni inventate o date non confermate.</p></header>
        <article className="game-latest-update"><div className="game-update-version"><span>Versione corrente</span><strong>{project.latestUpdate.version}</strong><time>{project.latestUpdate.date}</time></div><div><p className="eyebrow">Ultimo aggiornamento</p><h3>{project.latestUpdate.title}</h3><p>{project.latestUpdate.summary}</p><ul>{project.latestUpdate.highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}</ul></div></article>
        <div className="game-journal-lower">
          <section aria-labelledby="development-roadmap-title"><p className="eyebrow">Lavori confermati</p><h3 id="development-roadmap-title">In sviluppo.</h3><ol>{project.developmentRoadmap?.map((item) => <li key={item.title}><span>{item.status}</span><h4>{item.title}</h4><p>{item.description}</p></li>)}</ol></section>
          <aside className="game-release-archive" aria-labelledby="release-archive-title"><p className="eyebrow">Cronologia verificata</p><h3 id="release-archive-title">Archivio versioni.</h3>{project.releaseArchive?.length ? project.releaseArchive.map((release) => <article key={release.version}><strong>{release.version}</strong><time>{release.date}</time><p>{release.title}</p></article>) : <div><strong>Nessuna versione pubblica precedente</strong><p>{isFuoriTrama ? "L’archivio pubblico inizierà con la prima build gratuita realmente distribuita." : "L’archivio inizierà dalla 1.0.0. Non inseriremo numeri o note di aggiornamento non verificati."}</p></div>}</aside>
        </div>
      </div></section> : null}

      {project.statusTone === "available" ? <GameCommunityReviews gameCode={project.code} gameTitle={project.title} currentVersion={project.latestUpdate?.version ?? project.version} /> : null}

      <section className="game-dossier-access" id="edizione-windows" aria-labelledby="game-access-title"><div className="shell"><div className="game-access-intro"><p className="eyebrow">{project.freeAccess ? "Accesso e partecipazione" : isDevelopmentOnly ? "Distribuzione in preparazione" : "Distribuzione ufficiale GiWise Studio"}</p><h2 id="game-access-title">{project.freeAccess ? "Entra nello sviluppo." : isDevelopmentOnly ? "In sviluppo." : "Scegli la tua edizione."}</h2><p>{project.freeAccess ? "Il gioco resta gratuito per tutti. Universe Pass sostiene il progetto e apre anticipazioni e occasioni di partecipazione, senza trasformarsi nel prezzo del download." : isDevelopmentOnly ? "La build resta privata finché piattaforme, account, pacchetto e condizioni di distribuzione non saranno verificati." : "Web, Windows e prossimamente Android: ogni versione viene presentata e distribuita direttamente da LoreWise Universe."}</p></div><div className={`game-editions${project.freeAccess ? " game-development-access" : ""}${isDevelopmentOnly ? " game-development-platforms" : ""}`}>
        {project.freeAccess ? <>
          <article className="game-edition game-edition-free"><div><span>Per tutti</span><strong>Gratuito</strong><p>{project.freeAccess.description}</p></div><ul>{project.freeAccess.inclusions.map((item) => <li key={item}>{item}</li>)}</ul>{project.freeAccess.downloadUrl ? <a href={project.freeAccess.downloadUrl}>Scarica gratuitamente</a> : <strong className="game-purchase-pending">{project.freeAccess.availability}</strong>}</article>
          <article className="game-edition game-edition-pass"><div><span>Universe Pass</span><strong>Più vicino allo studio</strong><p>L’abbonamento non compra Fuori Trama e non è necessario per scaricarlo. Offre contenuti editoriali e strumenti di partecipazione collegati al LoreWise ID.</p></div><ul>{project.passBenefits?.map((item) => <li key={item}>{item}</li>)}</ul><Link href="/account#vantaggi">Apri I miei vantaggi</Link></article>
          <article className="game-edition game-edition-beta"><div><span>Test futuri</span><strong>Beta future</strong><p>Le candidature saranno aperte dal Centro vantaggi quando esisterà una sessione reale, con periodo, requisiti e numero di posti dichiarati.</p></div><ul><li>Un’identità verificata per LoreWise ID</li><li>Nessun accesso simulato o pulsante senza destinazione</li><li>Diario pubblico disponibile anche senza abbonamento</li></ul><Link href="#sviluppo">Consulta il diario pubblico</Link></article>
        </> : null}
        {project.publicUrl && project.publicAction ? <article className="game-edition game-edition-web"><div><span>Edizione Web</span><strong>Gioca ora</strong><p>La versione completa attualmente disponibile, sempre collegata agli aggiornamenti del progetto.</p></div><ul><li>Accesso dal browser</li><li>Profilo e progressi cloud</li><li>Account LoreWise obbligatorio</li></ul><a href={project.publicUrl} target="_blank" rel="noopener noreferrer">{project.publicAction} <span aria-hidden="true">↗</span></a></article> : null}
        {project.windowsOffer ? <article className="game-edition game-edition-windows"><div><span>{project.windowsOffer.edition}</span><strong>{project.windowsOffer.launchPrice}</strong><small>prezzo di lancio · poi {project.windowsOffer.futurePrice}</small><p>{project.windowsOffer.delivery}</p></div><ul>{project.windowsOffer.requirements.map((requirement) => <li key={requirement}>{requirement}</li>)}</ul>{project.windowsOffer.purchaseUrl ? <a href={project.windowsOffer.purchaseUrl}>Acquista e scarica</a> : <><strong className="game-purchase-pending">{project.windowsOffer.availability}</strong><GamePurchaseButton productCode={project.windowsOffer.productCode} priceLabel={project.windowsOffer.launchPrice} /></>}<small className="game-product-code">Prodotto predisposto · {project.windowsOffer.productCode}</small></article> : null}
        {project.androidOffer ? <article className="game-edition game-edition-android"><div><span>{project.androidOffer.edition}</span><strong>{project.androidOffer.availability}</strong><p>{project.androidOffer.description}</p></div><ul>{project.androidOffer.requirements.map((requirement) => <li key={requirement}>{requirement}</li>)}</ul><strong className="game-purchase-pending">Download APK non ancora disponibile</strong></article> : null}
      </div>{project.windowsOffer ? <>
        <section className="game-windows-specification" aria-labelledby="game-windows-specification-title">
          <header><p className="eyebrow">Prima di installare</p><h3 id="game-windows-specification-title">Tutto dichiarato, prima del download.</h3><p>La build 1.0.2 è stata verificata: versione, dimensione e impronta saranno mostrate anche nella libreria personale prima di consentire il download.</p></header>
          <div>
            <article><span>01</span><h4>Requisiti</h4><ul>{project.windowsOffer.systemRequirements.map((item) => <li key={item}>{item}</li>)}</ul></article>
            <article><span>02</span><h4>Installazione sicura</h4><ol>{project.windowsOffer.installationSteps.map((item) => <li key={item}>{item}</li>)}</ol></article>
            <article><span>03</span><h4>Licenza personale</h4><ul>{project.windowsOffer.licenseSummary.map((item) => <li key={item}>{item}</li>)}</ul><Link href="/licenza-gioco">Leggi la bozza completa della licenza →</Link><Link href="/condizioni-vendita-giochi">Recesso, conformità e rimborsi →</Link></article>
            <aside><span>Avviso Windows</span><strong>Distribuzione indipendente</strong><p>{project.windowsOffer.signatureNotice}</p></aside>
          </div>
        </section>
        <section className="game-commercial-readiness" aria-labelledby="game-commercial-readiness-title"><header><p className="eyebrow">Controllo prima della vendita</p><h3 id="game-commercial-readiness-title">Cosa manca all’edizione Windows.</h3><p>L’installer è verificato. Il pulsante di acquisto resterà disattivato finché consegna privata e collaudo commerciale non saranno completati.</p></header><ol>{project.windowsOffer.readiness.map((gate, index) => <li key={gate.label} className={`game-readiness-${gate.status}`}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{gate.label}</strong><p>{gate.note}</p></div><em>{gate.status === "ready" ? "Pronto" : "Da completare"}</em></li>)}</ol></section>
      </> : null}<div className="game-dossier-release-notes"><article><span>01</span><h3>Piano di pubblicazione</h3><p>{project.releasePlan}</p></article><article><span>02</span><h3>{project.freeAccess ? "Gratuità e Universe Pass" : isDevelopmentOnly ? "Distribuzione e disponibilità" : "Vendita e prezzo"}</h3><p>{project.commercialNote}</p></article>{project.rightsNote ? <article><span>03</span><h3>Contenuti e diritti</h3><p>{project.rightsNote}</p></article> : null}</div></div></section>
      {project.narrativeFeature?.closingLine ? <footer className="game-nexus-finale"><Image src={project.narrativeFeature.image} alt="" width={1920} height={1080} unoptimized /><div aria-hidden="true" /><p>{project.narrativeFeature.closingLine}</p></footer> : null}
    </article>
  </main>;
}
