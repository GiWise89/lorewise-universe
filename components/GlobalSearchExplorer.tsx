"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

export type GlobalSearchItem = {
  type: "Arte" | "Codex" | "Giochi" | "Diario" | "Shop" | "Servizi";
  title: string;
  description: string;
  href: string;
  image: string;
  terms: string;
};

const types = ["Tutto", "Arte", "Codex", "Giochi", "Diario", "Shop", "Servizi"] as const;

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("it");
}

export function GlobalSearchExplorer({ items }: { items: GlobalSearchItem[] }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<(typeof types)[number]>("Tutto");
  const [visibleLimit, setVisibleLimit] = useState(24);
  const results = useMemo(() => {
    const needle = normalize(query.trim());
    return items.filter((item) => (type === "Tutto" || item.type === type) && (!needle || normalize(`${item.title} ${item.description} ${item.terms}`).includes(needle)));
  }, [items, query, type]);
  const visibleResults = results.slice(0, visibleLimit);

  return <section className="global-search-workspace" aria-labelledby="global-search-title">
    <header><p className="eyebrow">Ricerca unificata</p><h1 id="global-search-title">Trova ogni parte dell’universo.</h1><p>Personaggi, opere, giochi, prodotti e servizi in un’unica ricerca, senza mescolare contenuti originali e universi documentati.</p></header>
    <div className="global-search-controls">
      <label><span>Cosa stai cercando?</span><input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setVisibleLimit(24); }} placeholder="Esempio: Simpson, dark fantasy, ritratto…" autoFocus /></label>
      <div role="group" aria-label="Filtra per archivio">{types.map((value) => <button type="button" aria-pressed={type === value} onClick={() => { setType(value); setVisibleLimit(24); }} key={value}>{value}</button>)}</div>
    </div>
    <p className="global-search-count" role="status"><strong>{results.length}</strong> risultati{query ? ` per “${query}”` : " disponibili"}</p>
    {results.length ? <><ol className="global-search-results">{visibleResults.map((item) => <li key={`${item.type}-${item.href}`}><Link href={item.href}><Image src={item.image} alt="" width={520} height={520} unoptimized /><span><small>{item.type}</small><strong>{item.title}</strong><p>{item.description}</p><b>Apri →</b></span></Link></li>)}</ol>{visibleResults.length < results.length ? <button className="global-search-more" type="button" onClick={() => setVisibleLimit((current) => current + 24)}>Mostra altri risultati <span>{results.length - visibleResults.length}</span></button> : null}</> : <div className="global-search-empty"><strong>Nessuna corrispondenza.</strong><p>Prova un nome più breve oppure seleziona “Tutto”. Le ricerche senza risultati potranno essere usate per migliorare l’archivio solo dopo l’attivazione delle statistiche con consenso.</p></div>}
  </section>;
}
