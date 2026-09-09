import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CurrentDiscountRibbon } from "@/components/CurrentDiscountRibbon";
import { FunnelLink } from "@/components/FunnelLink";
import { TwrGameplayTrailer } from "@/components/TwrGameplayTrailer";
import { WelcomeCommissionPopup } from "@/components/WelcomeCommissionPopup";
import { corruptedPortraitPromotion, getActiveCommissionPromotion } from "@/lib/commissionPromotion";
import { gameProjects } from "@/lib/gameCatalog";
import styles from "./home-focus.module.css";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: {
    title: "LoreWise Universe | Giochi, mondi, arte e community",
    description: "Entra nel LoreWise Universe di GiWise Studio: gioca a The Wound Remembers, scopri mondi e personaggi, esplora arte originale e partecipa al Nexus.",
    type: "website",
    url: "/",
    siteName: "LoreWise Universe",
    locale: "it_IT",
    images: [{ url: "/og.webp", width: 1736, height: 909, alt: "LoreWise Universe, l’universo creativo di GiWise Studio" }],
  },
};

const guidedPaths = [
  {
    key: "worlds",
    eyebrow: "Storie e personaggi",
    title: "Scopri i mondi",
    description: "Entra dagli universi, incontra i loro personaggi e approfondisci ciò che ti incuriosisce attraverso Codex, Cronache e diario creativo.",
    includes: "Mondi · Codex · Cronache · Diario",
    action: "Scegli cosa esplorare",
    href: "/mondi",
    image: "/brand/home-portals/mondi.webp",
  },
  {
    key: "create",
    eyebrow: "Opere e idee",
    title: "Crea o colleziona",
    description: "Scopri le opere originali, scegli una creazione disponibile oppure racconta la tua idea per una commissione personale.",
    includes: "Arte · Commissioni · GiWise Shop",
    action: "Entra nella galleria",
    href: "/arte",
    image: "/brand/home-portals/arte.webp",
  },
  {
    key: "nexus",
    eyebrow: "Il tuo posto nell’universo",
    title: "Partecipa al Nexus",
    description: "Segui GiWise Studio, incontra la community e scopri il Famiglio e i vantaggi pensati per chi vuole restare nell’universo.",
    includes: "Community · Famiglio · LoreWise Pass",
    action: "Entra nella community",
    href: "/community",
    image: "/brand/home-portals/vip.webp",
  },
] as const;

const services = [
  {
    key: "shop",
    eyebrow: "Per collezionare",
    title: "GiWise Shop",
    description: "Merchandising e collezioni ufficiali ispirati ai mondi di GiWise Studio.",
    action: "Visita lo Shop",
    href: "/shop",
    image: "/brand/home-portals/shop.webp",
  },
  {
    key: "commission",
    eyebrow: "Per creare",
    title: "Commissioni",
    description: "Racconta la tua idea e trasformala in un’opera costruita insieme a te.",
    action: "Scopri le commissioni",
    href: "/commissioni",
    image: "/brand/home-portals/commissioni.webp",
  },
  {
    key: "vip",
    eyebrow: "Per partecipare",
    title: "LoreWise VIP",
    description: "Eventi, contenuti e occasioni dedicate a chi vive il Nexus più da vicino.",
    action: "Entra nell’area VIP",
    href: "/vip",
    image: "/brand/home-portals/vip.webp",
  },
  {
    key: "pass",
    eyebrow: "Per avere vantaggi",
    title: "Universe Pass",
    description: "Scegli i benefici che ti interessano su opere, commissioni e iniziative selezionate.",
    action: "Confronta i vantaggi",
    href: "/abbonamento",
    image: "/brand/lorewise-wax-seal-v1.webp",
  },
] as const;

export default async function Home({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const localCalendarPreview = process.env.NODE_ENV !== "production" || process.env.LOREWISE_LOCAL_CALENDAR_PREVIEW === "true";
  const previewBlackFriday = query?.anteprima === "black-friday" && localCalendarPreview;
  const previewBlackFridayCampaign = query?.anteprima === "black-friday-campaign" && localCalendarPreview;
  const previewHoliday = query?.anteprima === "feste" && localCalendarPreview;
  const previewWelcomeOffer = query?.anteprima === "benvenuto" && localCalendarPreview;
  const initialPromotion = process.env.LOREWISE_LOCAL_HALLOWEEN_PREVIEW === "true"
    ? corruptedPortraitPromotion
    : getActiveCommissionPromotion();

  return (
    <main className="universe-home">
      {previewWelcomeOffer ? <WelcomeCommissionPopup preview={previewWelcomeOffer} /> : null}
      <section className={styles.hero} aria-labelledby="twr-home-title">
        <Image className={styles.art} src="/games/the-wound-remembers/key-art-scene-4k-v3.webp" alt="Kharvoss fra i due draghi nel santuario ferito di The Wound Remembers" width={3840} height={2160} priority unoptimized />
        <div className={styles.shade} aria-hidden="true" />
        <div className={styles.inner}>
          <div className={styles.copy}>
            <p className={styles.eyebrow}>Giocabile ora · Browser · PvE</p>
            <h1 id="twr-home-title" className={styles.visuallyHidden}>The Wound Remembers</h1>
            <Image className={styles.logo} src="/games/the-wound-remembers/logo-white-v2.webp" alt="The Wound Remembers" width={1600} height={900} priority unoptimized />
            <p className={styles.hook}>Costruisci il tuo Patto. Leggi la Nemesi. Sopravvivi a battaglie PvE su tre corsie.</p>
            <p className={styles.description}>Un card RPG dark fantasy con campagna, spedizioni e progressione persistente. La versione web è disponibile adesso.</p>
            <div className={styles.actions}>
              <FunnelLink className={styles.primary} href="https://thewoundremembers.com/" eventName="play_cta_click" source="homepage_hero">Gioca ora <span aria-hidden="true">→</span></FunnelLink>
              <TwrGameplayTrailer className={styles.secondary} />
            </div>
            <ul className={styles.proof}><li>Versione web completa</li><li>Account gratuito richiesto</li><li>Progressi cloud</li></ul>
          </div>
        </div>
      </section>

      <section className={styles.gamesOverview} aria-labelledby="games-overview-title">
        <div className={styles.gamesHeading}>
          <div>
            <p>Altri giochi di GiWise Studio</p>
            <h2 id="games-overview-title">Altri mondi stanno prendendo forma.</h2>
          </div>
          <Link href="/giochi">Esplora tutti i giochi <span aria-hidden="true">→</span></Link>
        </div>
        <Link className={styles.gamesPortal} href="/giochi">
          <Image src="/brand/icons/giochi-concept-v1.webp" alt="" width={260} height={260} unoptimized />
          <span><small>Area Giochi</small><strong>Tutti i titoli, in un solo ingresso.</strong><span>Confronta subito ciò che è giocabile, in sviluppo o in arrivo.</span></span>
          <b>Entra nella sezione Giochi <i aria-hidden="true">→</i></b>
        </Link>
        <div className={styles.gameGrid}>
          {gameProjects.filter((project) => project.slug !== "the-wound-remembers").map((project) => (
            <Link className={`${styles.gameCard} ${styles[project.statusTone]}`} href={`/giochi/${project.slug}`} key={project.slug}>
              <span className={styles.gameArt}>
                <Image src={project.catalogCoverImage ?? project.heroImage} alt={project.catalogCoverAlt ?? project.heroAlt} width={1200} height={760} unoptimized />
              </span>
              <span className={styles.gameCopy}>
                <small>{project.statusTone === "available" ? "Giocabile ora" : "In sviluppo"}</small>
                <strong>{project.title}</strong>
                <span>{project.subtitle}</span>
                <b>{project.statusTone === "available" ? "Apri il gioco" : "Scopri il progetto"} <i aria-hidden="true">→</i></b>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.guidedEntry} aria-labelledby="guided-entry-title">
        <div className={styles.guidedIntro}>
          <p>LoreWise Universe · GiWise Studio</p>
          <h2 id="guided-entry-title">Come vuoi entrare nell’universo?</h2>
          <span>Non devi conoscere già LoreWise. Scegli ciò che ti attira: ti accompagneremo da lì, un passo alla volta.</span>
        </div>
        <nav className={styles.pathGrid} aria-label="Tre modi per esplorare LoreWise Universe">
          {guidedPaths.map((path, index) => {
            const content = <>
              <span className={styles.pathNumber}>0{index + 1}</span>
              <span className={styles.pathArt}><Image src={path.image} alt="" width={420} height={420} unoptimized /></span>
              <span className={styles.pathCopy}>
                <small>{path.eyebrow}</small>
                <strong>{path.title}</strong>
                <span>{path.description}</span>
                <em>{path.includes}</em>
                {path.key === "create" ? <span className={styles.pathActions}>
                  <Link href="/arte">Colleziona opere <i aria-hidden="true">→</i></Link>
                  <Link href="/commissioni">Richiedi una commissione <i aria-hidden="true">→</i></Link>
                </span> : <b>{path.action} <i aria-hidden="true">→</i></b>}
              </span>
            </>;

            return path.key === "create"
              ? <article className={`${styles.path} ${styles[path.key]}`} key={path.key}>{content}</article>
              : <Link className={`${styles.path} ${styles[path.key]}`} href={path.href} key={path.key}>{content}</Link>;
          })}
        </nav>
      </section>

      <section className={styles.services} aria-labelledby="services-title">
        <div className={styles.servicesIntro}>
          <p>Servizi e vantaggi</p>
          <h2 id="services-title">Scegli in base a ciò che vuoi ottenere.</h2>
          <span>Ogni porta ha uno scopo preciso: acquistare, creare, partecipare oppure ricevere vantaggi.</span>
        </div>
        <nav className={styles.serviceGrid} aria-label="Servizi e vantaggi di LoreWise Universe">
          {services.map((service) => (
            <Link className={`${styles.serviceCard} ${styles[service.key]}`} href={service.href} key={service.key}>
              <Image src={service.image} alt="" width={420} height={420} unoptimized />
              <span>
                <small>{service.eyebrow}</small>
                <strong>{service.title}</strong>
                <span>{service.description}</span>
                <b>{service.action} <i aria-hidden="true">→</i></b>
              </span>
            </Link>
          ))}
        </nav>
      </section>

      <CurrentDiscountRibbon initialPromotion={initialPromotion} previewBlackFriday={previewBlackFriday} previewCampaign={previewBlackFridayCampaign} previewHoliday={previewHoliday} />

      <section className={styles.orientation} aria-label="Come usare LoreWise Universe">
        <div>
          <small>Entra senza pressioni</small>
          <strong>Esplora liberamente. Il LoreWise ID e il Pass servono solo quando vuoi qualcosa in più.</strong>
        </div>
        <nav aria-label="Approfondisci account e vantaggi">
          <Link href="/account">LoreWise ID <span aria-hidden="true">→</span></Link>
          <Link href="/abbonamento">Universe Pass <span aria-hidden="true">→</span></Link>
        </nav>
      </section>
    </main>
  );
}
