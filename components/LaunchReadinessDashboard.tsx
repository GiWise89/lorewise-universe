"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type Check = { id: string; label: string; detail: string; ready: boolean; required: boolean };
type Readiness = {
  mode: string;
  generatedAt: string;
  summary: { ready: number; total: number; launchReady: boolean };
  groups: Array<{ id: string; title: string; description: string; checks: Check[] }>;
};

export function LaunchReadinessDashboard() {
  const [data, setData] = useState<Readiness | null>(null);
  const [message, setMessage] = useState("Controllo dei sistemi in corso…");

  useEffect(() => {
    let active = true;
    void fetch("/api/launch-readiness", { headers: { accept: "application/json" } })
      .then(async (response) => {
        const payload = await response.json() as Readiness & { error?: string };
        if (!response.ok) throw new Error(payload.error || "Controllo di lancio non disponibile.");
        if (active) setData(payload);
      })
      .catch((error: Error) => active && setMessage(error.message));
    return () => { active = false; };
  }, []);

  if (!data) return <section className="launch-readiness-loading" aria-live="polite">
    <Image src="/brand/lorewise-universe-logo-concept-c.webp" alt="" width={1536} height={1024} unoptimized />
    <div><strong>Prontezza al lancio</strong><p>{message}</p></div>
  </section>;

  return <section className="launch-readiness" aria-labelledby="launch-readiness-title">
    <header className="launch-readiness-summary">
      <div><p className="eyebrow">Controllo centrale · modalità {data.mode}</p><h2 id="launch-readiness-title">{data.summary.launchReady ? "Pronto per l'approvazione finale." : "Il progetto è pronto in locale. Restano i collegamenti esterni."}</h2><p>Ogni voce richiesta deve risultare completata prima di pubblicare o attivare pagamenti reali.</p></div>
      <div className="launch-readiness-score" aria-label={`${data.summary.ready} controlli completati su ${data.summary.total}`}><strong>{data.summary.ready}<span>/{data.summary.total}</span></strong><small>controlli obbligatori completati</small></div>
    </header>
    <div className="launch-readiness-groups">
      {data.groups.map((group, groupIndex) => <article key={group.id} className="launch-readiness-group">
        <header><span>{String(groupIndex + 1).padStart(2, "0")}</span><div><h3>{group.title}</h3><p>{group.description}</p></div></header>
        <ol>{group.checks.map((check) => <li key={check.id} className={check.ready ? "is-ready" : check.required ? "is-pending" : "is-optional"}>
          <div><strong>{check.label}</strong><p>{check.detail}</p></div>
          <span>{check.ready ? "Pronto" : check.required ? "Da completare" : "Non bloccante"}</span>
        </li>)}</ol>
      </article>)}
    </div>
    <footer className="launch-readiness-footer"><p>Il pannello non mostra chiavi, password o file privati. Rilegge soltanto la loro disponibilità e gli stati approvati.</p><div><Link href="/gestione-consegne-arte">Consegne Arte</Link><Link href="/gestione-consegne-giochi">Consegne giochi</Link><Link href="/gestione-ordini">Ordini e assistenza</Link></div></footer>
  </section>;
}
