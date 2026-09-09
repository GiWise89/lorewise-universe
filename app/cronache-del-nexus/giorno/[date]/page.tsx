import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicationEntriesForDate } from "@/lib/publicationCalendar";

const dateFormatter = new Intl.DateTimeFormat("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Rome" });

function isCalendarDate(date: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(`${date}T12:00:00Z`));
}

function readableDate(date: string) {
  return dateFormatter.format(new Date(`${date}T12:00:00+02:00`));
}

export async function generateMetadata({ params }: { params: Promise<{ date: string }> }): Promise<Metadata> {
  const { date } = await params;
  if (!isCalendarDate(date)) return {};
  return {
    title: `Novità del ${readableDate(date)}`,
    description: `Tutte le novità LoreWise pubblicate il ${readableDate(date)}, con immagini, informazioni e collegamenti diretti.`,
    alternates: { canonical: `/cronache-del-nexus/giorno/${date}` },
  };
}

export default async function CalendarDayPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  if (!isCalendarDate(date)) notFound();
  const entries = getPublicationEntriesForDate(date);
  if (!entries.length) notFound();
  const [year, month, day] = date.split("-").map(Number);

  return <main className="nexus-calendar nexus-calendar-day-page" data-month={month}>
    <section className="calendar-day-hero" aria-labelledby="calendar-day-title">
      <div className="shell">
        <Link className="calendar-day-back" href={`/cronache-del-nexus#calendario`}>← Torna al calendario</Link>
        <p className="eyebrow">Novità del giorno</p>
        <div className="calendar-day-heading"><time dateTime={date}><strong>{String(day).padStart(2, "0")}</strong><span>{readableDate(date)}</span></time><div><h1 id="calendar-day-title">{entries.length === 1 ? "Una novità da scoprire." : `${entries.length} novità da scoprire.`}</h1><p>Informazioni essenziali, immagini e percorsi diretti verso ciò che è disponibile o in arrivo nel LoreWise Universe.</p></div></div>
      </div>
    </section>

    <section className="shell calendar-day-news" aria-label={`Novità del ${readableDate(date)}`}>
      {entries.map((entry, index) => <article className="calendar-day-news-card" data-tone={entry.tone} key={entry.id}>
        <figure><Image src={entry.image} alt={entry.imageAlt} fill sizes="(max-width: 980px) 100vw, 52vw" style={{ objectFit: "contain", objectPosition: "center" }} priority={index === 0} unoptimized /></figure>
        <div className="calendar-day-news-copy">
          <p className="calendar-day-meta"><span>{entry.category}</span><b data-state={entry.state}>{entry.state}</b></p>
          <h2>{entry.title}</h2>
          <p className="calendar-day-lead">{entry.description}</p>
          <p>{entry.detail}</p>
          <Link className="calendar-day-action" href={entry.href}>{entry.action}<span aria-hidden="true">→</span></Link>
        </div>
      </article>)}
    </section>

    <nav className="shell calendar-day-footer" aria-label="Navigazione del calendario"><Link href="/cronache-del-nexus#calendario">← Tutti i mesi</Link><span>{String(month).padStart(2, "0")} / {year}</span></nav>
  </main>;
}
