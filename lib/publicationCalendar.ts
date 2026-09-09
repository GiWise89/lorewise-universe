import sitePublicationNews from "@/data/site-publication-news.json";
import { commissionOpeningPromotion, corruptedPortraitPromotion, holidayNexusPromotion } from "@/lib/commissionPromotion";
import { editorialReleaseInstant } from "@/lib/editorialCalendar";
import { nexusChronicles } from "@/lib/nexusChronicles";

export type PublicationCalendarEntry = {
  id: string;
  date: string;
  category: string;
  title: string;
  description: string;
  detail: string;
  href: string;
  action: string;
  state: string;
  tone: string;
  image: string;
  imageAlt: string;
};

const promotions = [commissionOpeningPromotion, corruptedPortraitPromotion, holidayNexusPromotion] as const;
const promotionCalendarDates: Record<string, string> = { "nexus-opening-2026": "2026-09-10" };
const promotionVisuals: Record<string, { image: string; imageAlt: string }> = {
  "nexus-opening-2026": { image: "/brand/icons/commissioni-concept-v1.webp", imageAlt: "Emblema delle commissioni artistiche GiWise Studio" },
  "halloween-corrupted-portrait-2026": { image: "/promotions/halloween-corrupted-portrait-premium-v1.webp", imageAlt: "Ritratto promozionale La mia versione corrotta" },
  "nexus-holidays-2026": { image: "/novita/nexus-sections/promozioni-invito-v1.webp", imageAlt: "Invito illustrato alle Feste nel Nexus" },
};

export function getPublicationCalendarEntries(currentDate = new Date()): PublicationCalendarEntry[] {
  const currentTime = currentDate.getTime();
  return [
    ...nexusChronicles.map((chronicle) => ({
      id: chronicle.id,
      date: chronicle.publishedAt,
      category: chronicle.categoryLabel,
      title: chronicle.title,
      description: chronicle.excerpt,
      detail: chronicle.detail,
      href: chronicle.href,
      action: chronicle.action,
      state: editorialReleaseInstant(chronicle.publishedAt) <= currentTime ? "Disponibile" : "In arrivo",
      tone: chronicle.category,
      image: chronicle.image,
      imageAlt: chronicle.imageAlt,
    })),
    ...sitePublicationNews.map((entry) => ({
      ...entry,
      state: editorialReleaseInstant(entry.date) <= currentTime ? "Disponibile" : "In arrivo",
    })),
    ...promotions.map((promotion) => {
      const starts = Date.parse(promotion.startsAt);
      const ends = Date.parse(promotion.endsAt);
      return {
        id: promotion.id,
        date: promotionCalendarDates[promotion.id] ?? promotion.startsAt.slice(0, 10),
        category: "Commissioni",
        title: promotion.label,
        description: promotion.description,
        detail: `${promotion.period}. Lo stato e i vantaggi aggiornati sono disponibili nella pagina delle commissioni.`,
        href: `/commissioni?focus=${promotion.focusId}#${promotion.focusId}`,
        action: "Scopri l’iniziativa",
        state: currentTime < starts ? "In arrivo" : currentTime <= ends ? "In corso" : "Conclusa",
        tone: "promotion",
        ...promotionVisuals[promotion.id],
      };
    }),
  ].sort((left, right) => Date.parse(left.date) - Date.parse(right.date));
}

export function getPublicationEntriesForDate(date: string, currentDate = new Date()) {
  return getPublicationCalendarEntries(currentDate).filter((entry) => entry.date === date);
}
