import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getActiveCommissionPromotion, holidayNexusPromotion } from "@/lib/commissionPromotion";
import { editorialReleaseInstant } from "@/lib/editorialCalendar";
import { getNexusChronicles } from "@/lib/nexusChronicles";
import { getPublicationCalendarEntries } from "@/lib/publicationCalendar";
import MonthlyCalendar from "./MonthlyCalendar";

export const metadata: Metadata = {
  title: "Calendario delle novità",
  description: "Il calendario di LoreWise Universe con nuove uscite, giochi, arte, vantaggi e appuntamenti in arrivo.",
};

export const dynamic = "force-dynamic";

const dayFormatter = new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "short", timeZone: "Europe/Rome" });

function dateAtNoon(date: string) { return new Date(`${date}T12:00:00+02:00`); }

export default async function NexusNewsPage({ searchParams }: { searchParams: Promise<{ anteprima?: string }> }) {
  const params = await searchParams;
  const previewAll = params.anteprima === "tutte" && (process.env.NODE_ENV !== "production" || process.env.LOREWISE_LOCAL_CALENDAR_PREVIEW === "true");
  const promotion = holidayNexusPromotion;
  const previewCampaignDate = "2026-12-07T12:00:00+01:00";
  const currentDate = previewAll && previewCampaignDate >= promotion.startsAt.slice(0, 10) ? new Date(previewCampaignDate) : new Date();
  const currentTime = currentDate.getTime();
  const releasedChronicles = getNexusChronicles(currentDate);
  const latest = releasedChronicles[0];
  const activePromotion = getActiveCommissionPromotion(currentDate);

  const calendarEntries = getPublicationCalendarEntries(currentDate);

  const nextEntry = calendarEntries.find((entry) => editorialReleaseInstant(entry.date) > currentTime);
  const latestAvailableEntry = calendarEntries.findLast((entry) => editorialReleaseInstant(entry.date) <= currentTime);

  return <main className="nexus-calendar">
    <section className="nexus-calendar-hero" aria-labelledby="nexus-calendar-title">
      <Image src="/novita/nexus-sections/nexus-hero-v1.webp" alt="Archivio cosmico del LoreWise Universe" fill sizes="100vw" priority unoptimized />
      <div className="nexus-calendar-shade" />
      <div className="shell nexus-calendar-hero-copy"><p className="eyebrow">Novità dal Nexus</p><h1 id="nexus-calendar-title">Il calendario dei mondi.</h1><p>Uscite, iniziative e appuntamenti LoreWise raccolti per data. Guarda cosa è disponibile ora e cosa arriverà nelle prossime settimane.</p><a href="#calendario">Apri il calendario <span aria-hidden="true">↓</span></a></div>
    </section>

    <section className="shell nexus-calendar-now" aria-label="Riepilogo delle novità">
      <article><span>Disponibile ora</span><strong>{latestAvailableEntry?.title ?? "Il Nexus continua a crescere."}</strong><small>{latestAvailableEntry?.category ?? "LoreWise Universe"}</small></article>
      <article><span>Prossimo appuntamento</span><strong>{nextEntry?.title ?? "Nuove date saranno annunciate qui."}</strong><small>{nextEntry ? dayFormatter.format(dateAtNoon(nextEntry.date)) : "Calendario in aggiornamento"}</small></article>
      <article><span>{activePromotion ? "In corso" : "Vantaggi"}</span><strong>{activePromotion?.label ?? "Universe Pass"}</strong><small>{activePromotion?.period ?? "Supporter e Collector"}</small></article>
    </section>

    {latest ? <section className="nexus-calendar-feature" aria-labelledby="nexus-feature-title"><div className="shell nexus-calendar-feature-grid"><figure><Image src={latest.image} alt={latest.imageAlt} width={1200} height={900} unoptimized /></figure><div><p className="eyebrow">In evidenza · {latest.issue}</p><h2 id="nexus-feature-title">{latest.title}</h2><p>{latest.detail}</p><Link href={latest.href}>{latest.action} <span aria-hidden="true">→</span></Link></div></div></section> : null}

    <section className="nexus-calendar-board" id="calendario" aria-labelledby="calendar-board-title"><div className="shell">
      <header className="nexus-calendar-heading"><div><p className="eyebrow">Agenda LoreWise</p><h2 id="calendar-board-title">Un mese da esplorare, giorno per giorno.</h2></div><p>Le date illuminate contengono una novità. Seleziona il giorno per leggere le informazioni e raggiungere direttamente il contenuto.</p></header>
      <MonthlyCalendar entries={calendarEntries} initialYear={currentDate.getFullYear()} initialMonth={currentDate.getMonth()} today={`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`} />
    </div></section>

    <section className="nexus-calendar-paths"><div className="shell"><div><p className="eyebrow">Continua a esplorare</p><h2>Ogni novità conduce al suo mondo.</h2></div><nav aria-label="Percorsi LoreWise"><Link href="/giochi">Giochi <span>→</span></Link><Link href="/arte">Arte <span>→</span></Link><Link href="/commissioni">Commissioni <span>→</span></Link><Link href="/community">Community <span>→</span></Link></nav></div></section>
  </main>;
}
