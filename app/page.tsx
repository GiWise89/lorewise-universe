import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CurrentDiscountRibbon } from "@/components/CurrentDiscountRibbon";
import { WelcomeCommissionPopup } from "@/components/WelcomeCommissionPopup";
import { corruptedPortraitPromotion, getActiveCommissionPromotion } from "@/lib/commissionPromotion";
import { siteAreas } from "@/lib/siteNavigation";
import styles from "./home-focus.module.css";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: {
    title: "LoreWise Universe | Giochi, mondi, arte e community",
    description: "Il sito di GiWise Studio: giochi come The Wound Remembers, mondi e personaggi, arte originale e una community da vivere.",
    type: "website",
    url: "/",
    siteName: "LoreWise Universe",
    locale: "it_IT",
    images: [{ url: "/og.webp", width: 1736, height: 909, alt: "LoreWise Universe, l’universo creativo di GiWise Studio" }],
  },
};

// La home dice cos'è il sito e apre le stesse quattro aree del menu (lib/siteNavigation.ts).
// I giochi hanno la loro area: qui restano solo come una delle quattro porte.
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
      <section className={styles.welcome} aria-labelledby="home-title">
        <div className={styles.intro}>
          <p className={styles.eyebrow}>LoreWise Universe · GiWise Studio</p>
          <h1 id="home-title">Giochi, mondi e arte originali, in un unico universo.</h1>
          <p className={styles.lead}>Esplora liberamente. L’account serve solo quando vuoi salvare i progressi, comprare un’opera o partecipare alla community.</p>
        </div>
        <ul className={styles.areaGrid}>
          {siteAreas.map((area) => (
            <li className={`${styles.area} ${styles[area.key]}`} key={area.key}>
              <Link className={styles.areaLink} href={area.href}>
                <span className={styles.areaArt}><Image src={area.image} alt="" width={560} height={560} sizes="(max-width: 760px) 40vw, 240px" unoptimized /></span>
                <span className={styles.areaCopy}>
                  <strong>{area.label}</strong>
                  <span>{area.summary}</span>
                  <small>{area.links.map((link) => link.label).join(" · ")}</small>
                  <b>Entra <i aria-hidden="true">→</i></b>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <CurrentDiscountRibbon initialPromotion={initialPromotion} previewBlackFriday={previewBlackFriday} previewCampaign={previewBlackFridayCampaign} previewHoliday={previewHoliday} />
    </main>
  );
}
