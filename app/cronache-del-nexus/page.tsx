import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { catalogArtworks } from "@/lib/artCatalog";
import { commissionOpeningPromotion, corruptedPortraitPromotion, getActiveCommissionPromotion, holidayNexusPromotion } from "@/lib/commissionPromotion";
import { gameProjects } from "@/lib/gameCatalog";
import { getNexusChronicles } from "@/lib/nexusChronicles";
import { WELCOME_COMMISSION_OFFER } from "@/lib/welcomeCommissionOffer";

export const metadata: Metadata = {
  title: "Novità dal Nexus",
  description: "Le novità di LoreWise Universe, ordinate tra giochi, arte, promozioni e prossimi appuntamenti.",
};

export const dynamic = "force-dynamic";

const sectionLinks = [
  { number: "01", label: "Novità", id: "novita" },
  { number: "02", label: "Giochi", id: "giochi" },
  { number: "03", label: "Arte", id: "arte" },
  { number: "04", label: "Promozioni", id: "promozioni" },
  { number: "05", label: "In arrivo", id: "in-arrivo" },
] as const;

type NexusSection = (typeof sectionLinks)[number]["id"];

const futurePromotions = [
  { ...corruptedPortraitPromotion, href: "/commissioni?focus=la-mia-versione-corrotta&anteprima=halloween" },
  { ...holidayNexusPromotion, href: "/feste-nel-nexus?anteprima=feste" },
];

export default async function NexusNewsPage({ searchParams }: { searchParams: Promise<{ anteprima?: string; sezione?: string }> }) {
  const params = await searchParams;
  const previewAll = params.anteprima === "tutte" && (process.env.NODE_ENV !== "production" || process.env.LOREWISE_LOCAL_CALENDAR_PREVIEW === "true");
  const editorialDate = previewAll ? new Date("2026-12-07T12:00:00+01:00") : new Date();
  const chronicles = getNexusChronicles(editorialDate);
  const latest = chronicles[0];
  const activePromotion = getActiveCommissionPromotion(editorialDate) ?? commissionOpeningPromotion;
  const games = gameProjects.slice(0, 3);
  const latestArtworks = catalogArtworks.slice(-3).reverse();
  const activeSection: NexusSection = sectionLinks.some((item) => item.id === params.sezione)
    ? params.sezione as NexusSection
    : "novita";
  const previewSuffix = previewAll ? "&anteprima=tutte" : "";

  return <main className="nexus-edition">
    <section className="nexus-edition-hero" aria-labelledby="nexus-edition-title">
      <Image src="/novita/nexus-sections/nexus-hero-v1.webp" alt="Archivio cosmico da cui si diramano i percorsi del LoreWise Universe" width={1536} height={1024} priority unoptimized />
      <div className="shell nexus-edition-hero-copy">
        <p className="eyebrow">Il giornale del LoreWise Universe</p>
        <h1 id="nexus-edition-title">Novità dal Nexus</h1>
        <p>Una sola sezione alla volta. Scegli cosa vuoi scoprire senza attraversare una pagina interminabile.</p>
        <a href="#indice-nexus">Scegli una sezione <span aria-hidden="true">↓</span></a>
      </div>
    </section>

    <nav className="nexus-edition-index shell" id="indice-nexus" aria-label="Scegli una sezione delle Novità dal Nexus">
      {sectionLinks.map((item) => <Link href={`/cronache-del-nexus?sezione=${item.id}${previewSuffix}#${item.id}`} aria-current={activeSection === item.id ? "page" : undefined} key={item.id}><span>{item.number}</span><strong>{item.label}</strong></Link>)}
    </nav>

    {activeSection === "novita" ? <section className="nexus-edition-section nexus-edition-latest" id="novita" aria-labelledby="nexus-latest-title">
      <div className="shell nexus-edition-split">
        <figure><Image src="/novita/nexus-sections/novita-famigli-v1.webp" alt="Cinque Famigli riuniti intorno a un messaggio luminoso nel Santuario" width={1536} height={1024} unoptimized /></figure>
        <div className="nexus-edition-copy">
          <p className="nexus-section-number">01 · Novità</p>
          <h2 id="nexus-latest-title">{latest?.title ?? "Il Nexus continua a crescere."}</h2>
          <p className="nexus-edition-lead">{latest?.excerpt ?? "Nuove storie, giochi e percorsi stanno trovando il loro posto nel LoreWise Universe."}</p>
          <article className="nexus-news-line is-familiar"><span>FAMIGLI DEL NEXUS</span><h3>Una nuova vita nel Nexus.</h3><p>Scegli il tuo primo Uovo, prenditi cura della sua Casa e accompagna il Famiglio attraverso crescita, missioni, spedizioni, Arena e Torre del Nexus.</p><Link href="/giochi/nexus-pet">Leggi la guida completa dei Famigli <span aria-hidden="true">→</span></Link></article>
          {latest?.signals?.slice(0, 2).map((signal) => <article className="nexus-news-line" key={signal.title}><span>{signal.label}</span><h3>{signal.title}</h3><p>{signal.text}</p><Link href={signal.href}>{signal.action} <span aria-hidden="true">→</span></Link></article>)}
          <Link className="nexus-edition-primary" href="/famiglio">Entra nel Santuario del Famiglio <span aria-hidden="true">→</span></Link>
        </div>
      </div>
    </section> : null}

    {activeSection === "giochi" ? <section className="nexus-edition-section nexus-edition-games" id="giochi" aria-labelledby="nexus-games-title">
      <div className="shell">
        <header className="nexus-edition-heading"><div><p className="nexus-section-number">02 · Giochi</p><h2 id="nexus-games-title">Tre mondi, tre modi di giocare.</h2></div><p>Le esperienze GiWise Studio restano separate e riconoscibili: qui trovi lo stato attuale e il percorso diretto per ciascun gioco.</p></header>
        <figure className="nexus-games-scene"><Image src="/novita/nexus-sections/giochi-crocevia-v1.webp" alt="Tre mondi di gioco collegati da un crocevia luminoso" width={1536} height={1024} unoptimized /></figure>
        <p className="nexus-games-vip-note">Le identità del nuovo conflitto sono state svelate nell’Area VIP, mentre questa pagina mantiene protetti i protagonisti di Demon Match Three.</p>
        <div className="nexus-games-ledger">
          {games.map((game, index) => <article key={game.slug} data-tone={index === 0 ? "cyan" : index === 1 ? "gold" : "ember"}><span>{String(index + 1).padStart(2, "0")}</span><div><small>{game.kind}</small><h3>{game.title}</h3><p>{game.summary}</p></div><div className="nexus-game-status"><strong>{game.status}</strong><small>{game.platforms.join(" · ")}</small><Link href={`/giochi/${game.slug}`}>Apri il gioco →</Link></div></article>)}
        </div>
        <Link className="nexus-edition-primary is-light" href="/giochi">Esplora tutti i giochi <span aria-hidden="true">→</span></Link>
      </div>
    </section> : null}

    {activeSection === "arte" ? <section className="nexus-edition-section nexus-edition-art" id="arte" aria-labelledby="nexus-art-title">
      <div className="shell nexus-art-intro">
        <div className="nexus-edition-copy"><p className="nexus-section-number">03 · Ultime opere d’arte</p><h2 id="nexus-art-title">L’Atelier apre le sue porte.</h2><p className="nexus-edition-lead">Tre arrivi recenti dalla raccolta: ogni opera mantiene proporzioni complete, identità e destinazione dichiarata.</p><Link className="nexus-edition-primary" href="/arte">Visita Arte in Vetrina <span aria-hidden="true">→</span></Link></div>
        <figure><Image src="/novita/nexus-sections/arte-atelier-v1.webp" alt="Atelier fantasy con dipinti completi, pennelli e pigmenti" width={1536} height={1024} unoptimized /></figure>
      </div>
      <article className="shell nexus-art-project" aria-labelledby="team-rocket-project-title">
        <header><div><p className="nexus-section-number">Nuovo progetto completo</p><h3 id="team-rocket-project-title">Team Rocket · Jessie in scena</h3></div><p>Dal primo sguardo alla tavola completa: tre passaggi protetti mostrano come il ritratto prende forma senza tagliare l’opera né alterarne le proporzioni.</p></header>
        <div>
          <figure><Image src="/novita/art/team-rocket/fase-01-preview.webp" alt="Prima fase protetta del progetto Team Rocket: costruzione dello sguardo" width={667} height={943} unoptimized /><figcaption><span>01</span><strong>Lo sguardo</strong></figcaption></figure>
          <figure><Image src="/novita/art/team-rocket/fase-02-preview.webp" alt="Seconda fase protetta del progetto Team Rocket: line art del ritratto" width={669} height={946} unoptimized /><figcaption><span>02</span><strong>La linea</strong></figcaption></figure>
          <figure className="is-complete"><Image src="/novita/art/team-rocket/opera-completa-preview.webp" alt="Opera completa protetta del progetto Team Rocket con Jessie" width={1272} height={1800} unoptimized /><figcaption><span>03</span><strong>Opera completa</strong></figcaption></figure>
        </div>
        <Link href="/arte/lw-art-081">Apri la scheda completa in Arte <span aria-hidden="true">→</span></Link>
      </article>
      <div className="shell nexus-art-ribbon">
        {latestArtworks.map((artwork) => <Link href={`/arte/${artwork.slug}`} key={artwork.slug}><span className="nexus-art-frame"><Image src={artwork.image} alt={artwork.title ?? `Opera ${artwork.code}`} fill sizes="(max-width: 760px) 88vw, 30vw" unoptimized /></span><span><small>{artwork.code} · {artwork.kindLabel}</small><strong>{artwork.title}</strong><em>Scopri l’opera →</em></span></Link>)}
      </div>
    </section> : null}

    {activeSection === "promozioni" ? <section className="nexus-edition-section nexus-edition-promotions" id="promozioni" aria-labelledby="nexus-promotions-title">
      <div className="shell nexus-edition-split is-reversed">
        <figure><Image src="/novita/nexus-sections/promozioni-invito-v1.webp" alt="Invito sigillato, nastri e doni sotto un cielo stellato" width={1536} height={1024} unoptimized /></figure>
        <div className="nexus-edition-copy"><p className="nexus-section-number">04 · Promozioni</p><h2 id="nexus-promotions-title">{activePromotion.title}</h2><p className="nexus-edition-lead">{activePromotion.description}</p><dl className="nexus-promotion-rates"><div><dt>Visitatore</dt><dd>−{activePromotion.rates.visitor}%</dd></div><div><dt>Supporter</dt><dd>−{activePromotion.rates.supporter}%</dd></div><div><dt>Collector</dt><dd>−{activePromotion.rates.collector}%</dd></div></dl><p className="nexus-promotion-period">{activePromotion.period}</p><div className="nexus-welcome-line"><strong>{WELCOME_COMMISSION_OFFER.title}</strong><p>{WELCOME_COMMISSION_OFFER.description}</p><Link href={WELCOME_COMMISSION_OFFER.href}>{WELCOME_COMMISSION_OFFER.action} →</Link></div><Link className="nexus-edition-primary" href={`/commissioni?focus=${activePromotion.focusId}#${activePromotion.focusId}`}>Scopri la promozione <span aria-hidden="true">→</span></Link></div>
      </div>
      <div className="shell nexus-upcoming-promotions" aria-label="Prossime promozioni"><h3>Più avanti nel calendario</h3>{futurePromotions.map((promotion) => <Link href={promotion.href} key={promotion.id}><span>{promotion.label}</span><strong>{promotion.period}</strong><small>Scopri l’evento →</small></Link>)}</div>
    </section> : null}

    {activeSection === "in-arrivo" ? <section className="nexus-edition-section nexus-edition-next" id="in-arrivo" aria-labelledby="nexus-next-title">
      <div className="shell"><header className="nexus-edition-heading"><div><p className="nexus-section-number">05 · In arrivo</p><h2 id="nexus-next-title">Scegli il prossimo sentiero.</h2></div><p>Non serve continuare a scorrere: da qui puoi entrare direttamente nei tre archivi che raccolgono il resto dell’universo.</p></header><nav className="nexus-next-paths" aria-label="Percorsi da seguire"><Link href="/enciclopedia"><span>01</span><strong>LoreWise Codex</strong><small>Personaggi, universi e fonti</small></Link><Link href="/dove-nascono-i-mondi"><span>02</span><strong>Dove nascono i mondi</strong><small>Processi creativi e opere in lavorazione</small></Link><Link href="/vip"><span>03</span><strong>LoreWise VIP</strong><small>Anteprime, eventi e vantaggi</small></Link></nav></div>
    </section> : null}
  </main>;
}
