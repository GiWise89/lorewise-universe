"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { PublicationCalendarEntry } from "@/lib/publicationCalendar";

export type CalendarEntry = PublicationCalendarEntry;

const monthNames = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
const monthSlugs = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
const monthStickerAlts = [
  "Fenice astrale, globo dell’alba e chiave cometa",
  "Famigli intrecciati, sigillo di quarzo e lettera alata",
  "Uovo stellare, Famiglio germoglio e ampolla di rugiada",
  "Balena delle nuvole, bussola fiorita e creatura ombrello",
  "Guardiano lucciola, portale in fiore e falena smeraldo",
  "Tramonto in ampolla, leone solare e lanterna di lucciole",
  "Serpente costellazione, navigatore sulla cometa e conchiglia astrale",
  "Cicala dorata, volpe solare e frutto meteorico",
  "Famiglio d’inchiostro, ghianda meccanica e foglia portale",
  "Zucca mimica, Famiglio pipistrello e lanterna fantasma",
  "Corvo di pioggia, lanterna della memoria e golem di foglie",
  "Portale globo, Famiglio della neve e cappello cosmico",
];
const weekDays = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

function isoDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function initialPreviewDate(entries: CalendarEntry[], year: number, month: number, today: string) {
  const prefix = `${year}-${String(month + 1).padStart(2, "0")}-`;
  const dates = [...new Set(entries.map((entry) => entry.date).filter((date) => date.startsWith(prefix)))].sort();
  return dates.find((date) => date >= today) ?? dates.at(-1) ?? "";
}

export default function MonthlyCalendar({ entries, initialYear, initialMonth, today }: { entries: CalendarEntry[]; initialYear: number; initialMonth: number; today: string }) {
  const [view, setView] = useState({ year: initialYear, month: initialMonth });
  const [selectedDate, setSelectedDate] = useState(() => initialPreviewDate(entries, initialYear, initialMonth, today));
  const entriesByDate = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>();
    entries.forEach((entry) => map.set(entry.date, [...(map.get(entry.date) ?? []), entry]));
    return map;
  }, [entries]);

  const firstWeekDay = (new Date(Date.UTC(view.year, view.month, 1)).getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(view.year, view.month + 1, 0)).getUTCDate();
  const cells = [...Array(firstWeekDay).fill(null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)];
  while (cells.length % 7) cells.push(null);
  const selectedEntries = entriesByDate.get(selectedDate) ?? [];
  const previewEntry = selectedEntries[0] ?? null;
  function changeMonth(direction: number) {
    const nextDate = new Date(Date.UTC(view.year, view.month + direction, 1));
    const next = { year: nextDate.getUTCFullYear(), month: nextDate.getUTCMonth() };
    setView(next);
    setSelectedDate(initialPreviewDate(entries, next.year, next.month, today));
  }

  return <div className="monthly-calendar" data-month={view.month + 1}>
    <header className="monthly-calendar-masthead">
      <div>
        <p className="eyebrow">Calendario interattivo</p>
        <h3>{monthNames[view.month]} <span>{view.year}</span></h3>
        <p>Seleziona un giorno. Le date illuminate contengono una novità.</p>
      </div>
      <nav aria-label="Cambia mese">
        <button type="button" onClick={() => changeMonth(-1)} aria-label="Mese precedente"><span aria-hidden="true">←</span> Precedente</button>
        <button type="button" onClick={() => changeMonth(1)} aria-label="Mese successivo">Successivo <span aria-hidden="true">→</span></button>
      </nav>
    </header>

    <div className="monthly-calendar-sticker-shelf" aria-label={`Reperti illustrati di ${monthNames[view.month]}`}>
      <Image className="monthly-calendar-stickers" src={`/novita/calendar-stickers/${monthSlugs[view.month]}-lorewise-stickers-wide-v2.webp`} alt={monthStickerAlts[view.month]} width={1400} height={467} unoptimized />
    </div>

    <div className="monthly-calendar-layout">
      <div className="monthly-calendar-grid" role="grid" aria-label={`${monthNames[view.month]} ${view.year}`}>
        {weekDays.map((day) => <div className="monthly-calendar-weekday" role="columnheader" key={day}>{day}</div>)}
        {cells.map((day, index) => day === null
          ? <span className="monthly-calendar-empty" aria-hidden="true" key={`empty-${index}`} />
          : (() => {
            const date = isoDate(view.year, view.month, day);
            const dayEntries = entriesByDate.get(date) ?? [];
            const selected = date === selectedDate;
            const content = <><time dateTime={date}>{day}</time>{dayEntries.length ? <><span className="monthly-calendar-signal" aria-hidden="true" /><small>{dayEntries.length === 1 ? "Novità" : `${dayEntries.length} novità`}</small></> : null}</>;
            const label = `${day} ${monthNames[view.month]}${dayEntries.length ? `, mostra ${dayEntries.length} novità` : ", nessuna novità"}`;
            return dayEntries.length
              ? <button className="monthly-calendar-day" data-has-news="true" data-selected={selected || undefined} data-today={date === today || undefined} type="button" role="gridcell" aria-selected={selected} aria-label={label} onClick={() => setSelectedDate(date)} key={date}>{content}</button>
              : <span className="monthly-calendar-day" data-today={date === today || undefined} role="gridcell" aria-label={label} key={date}>{content}</span>;
          })())}
      </div>
      <aside className="monthly-calendar-preview" aria-label={`Anteprima delle novità di ${monthNames[view.month]}`}>
        {previewEntry ? <>
          <figure><Image src={previewEntry.image} alt={previewEntry.imageAlt} fill sizes="(max-width: 1100px) 100vw, 380px" style={{ objectFit: "contain", objectPosition: "center" }} unoptimized /></figure>
          <div><p className="eyebrow">Novità del giorno</p><p className="monthly-calendar-preview-meta"><span>{previewEntry.category}</span><b>{previewEntry.state}</b></p><h4>{previewEntry.title}</h4><p>{previewEntry.description}</p><Link href={`/cronache-del-nexus/giorno/${previewEntry.date}`}>{selectedEntries.length > 1 ? `Apri le ${selectedEntries.length} novità del giorno` : "Apri la notizia completa"} <span aria-hidden="true">→</span></Link></div>
        </> : <div className="monthly-calendar-preview-empty"><p className="eyebrow">Novità del giorno</p><h4>Nuove date in preparazione.</h4><p>Quando una novità sarà confermata, la sua data apparirà illuminata nel calendario.</p></div>}
      </aside>
    </div>
  </div>;
}
