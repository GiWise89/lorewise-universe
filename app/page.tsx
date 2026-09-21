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

// Un solo ingresso guidato: ogni porta raccoglie le destinazioni che prima erano divise
// fra "Come vuoi entrare" e "Servizi e vantaggi".
const guidedPaths = [
  {
    key: "worlds",
    eyebrow: "Storie e personaggi",
    title: "Scopri i mondi",
    description: "Entra dagli universi, incontra i loro personaggi e approfondisci ciò che ti incuriosisce.",
    image: "/brand/home-portals/porta-mondi-v2.webp",
    links: [
      { title: "Mondi", href: "/mondi" },
      { title: "LoreWise Codex", href: "/enciclopedia" },
      { title: "Cronache del Nexus", href: "/cronache-del-nexus" },
      { title: "Dove nascono i mondi", href: "/dove-nascono-i-mondi" },
    ],
  },
  {
    key: "create",
    eyebrow: "Opere e idee",
    title: "Crea o colleziona",
    description: "Scopri le opere originali, porta a casa un oggetto dell’universo oppure racconta la tua idea per una commissione.",
    image: "/brand/home-portals/porta-crea-v2.webp",
    links: [
      { title: "Colleziona opere", href: "/arte" },
      { title: "Richiedi una commissione", href: "/commissioni" },
      { title: "GiWise Shop", href: "/shop" },
    ],
  },
  {
    key: "nexus",
    eyebrow: "Il tuo posto nell’universo",
    title: "Partecipa al Nexus",
    description: "Incontra la community, adotta il tuo Famiglio e scegli i vantaggi pensati per chi vuole restare.",
    image: "/brand/home-portals/porta-nexus-v2.webp",
    links: [
      { title: "Community", href: "/community" },
      { title: "Famiglio", href: "/famiglio" },
      { title: "Area VIP", href: "/vip-zone" },
      { title: "Universe Pass", href: "/abbonamento" },
    ],
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
        <div className={styles.gameGrid}>
          {gameProjects.filter((project) => project.slug !== "the-wound-remembers").map((project) => (
            <Link className={`${styles.gameCard} ${styles[project.statusTone]}`} href={`/giochi/${project.slug}`} key={project.slug}>
              <span className={styles.gameArt}>
                <Image src={project.catalogCoverImage ?? project.heroImage} alt={project.catalogCoverAlt ?? project.heroAlt} width={1200} height={760} sizes="(max-width: 760px) 100vw, 33vw" unoptimized />
              </span>
              <span className={styles.gameCopy}>
                <small>{project.statusTone === "available" ? "Giocabile ora" : "In sviluppo"}</small>
                {project.slug === "sandbox" && project.logoImage ? <strong className={styles.gameLogo}><Image src={project.logoImage} alt={project.title} width={1032} height={324} unoptimized /></strong> : <strong>{project.title}</strong>}
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
          <span>Non devi conoscere già LoreWise. Scegli ciò che ti attira: ogni porta ti porta dritto al posto giusto.</span>
        </div>
        <div className={styles.pathGrid}>
          {guidedPaths.map((path, index) => (
            <article className={`${styles.path} ${styles[path.key]}`} key={path.key} aria-labelledby={`path-${path.key}`}>
              <span className={styles.pathNumber} aria-hidden="true">0{index + 1}</span>
              <span className={styles.pathArt}><Image src={path.image} alt="" width={560} height={560} unoptimized /></span>
              <span className={styles.pathCopy}>
                <small>{path.eyebrow}</small>
                <strong id={`path-${path.key}`}>{path.title}</strong>
                <span>{path.description}</span>
                <nav className={styles.pathLinks} aria-label={path.title}>
                  {path.links.map((link) => <Link href={link.href} key={link.href}>{link.title} <i aria-hidden="true">→</i></Link>)}
                </nav>
              </span>
            </article>
          ))}
        </div>
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
