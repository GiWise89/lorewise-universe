"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BlackFridayCountdown } from "@/components/BlackFridayCountdown";
import {
  blackFridayCampaign,
  blackFridayTeaser,
  CYBER_MONDAY_STARTS_AT,
  getBlackFridayCampaignPhase,
  type BlackFridayCampaignPhase,
} from "@/lib/blackFridayTeaser";

const previewInstants: Record<Exclude<BlackFridayCampaignPhase, "ended">, string> = {
  teaser: "2026-11-12T20:26:00+01:00",
  "black-friday": "2026-11-27T12:00:00+01:00",
  "cyber-monday": "2026-11-30T12:00:00+01:00",
};

function CampaignPath({ path, index, cyber = false }: { path: typeof blackFridayCampaign.shop | typeof blackFridayCampaign.pass | typeof blackFridayCampaign.cyber; index: number; cyber?: boolean }) {
  return <article className={`black-friday-path${cyber ? " is-cyber" : ""}`} id={cyber ? "cyber-nexus" : undefined}>
    <Image src={path.image} alt={`Emblema illustrato del percorso ${path.label}`} width={1254} height={1254} unoptimized />
    <div>
      <p className="eyebrow">0{index} · {path.label}</p>
      <h2>{path.title}</h2>
      <strong>{path.offer}</strong>
      <p>{path.description}</p>
      <Link href={path.href}>{path.action} <span aria-hidden="true">→</span></Link>
    </div>
  </article>;
}

export function BlackFridayCampaignExperience({ initialPhase, previewPhase }: { initialPhase: BlackFridayCampaignPhase; previewPhase?: Exclude<BlackFridayCampaignPhase, "ended"> }) {
  const [phase, setPhase] = useState(initialPhase);

  useEffect(() => {
    if (previewPhase) return;
    const refresh = () => setPhase(getBlackFridayCampaignPhase(new Date()));
    const timer = window.setInterval(refresh, 1_000);
    return () => window.clearInterval(timer);
  }, [previewPhase]);

  const visiblePhase = previewPhase ?? phase;

  if (visiblePhase === "teaser") return <main className="black-friday-page">
    <section className="black-friday-hero is-teaser" aria-labelledby="black-friday-title">
      <Image className="black-friday-hero-scene" src="/promotions/black-friday/countdown-portal-hero-v1.webp" alt="Una sala in ossidiana custodisce un grande portale-orologio dorato prossimo alla mezzanotte" width={1536} height={1024} priority unoptimized />
      <Image className="black-friday-sticker-frame" src="/promotions/black-friday/countdown-sticker-frame-v1.webp" alt="Sigillo cosmico, piuma, biglietti, orologio e frammenti d’ossidiana incorniciano la scena" width={1536} height={1024} priority unoptimized />
      <div className="black-friday-hero-content shell">
        <p className="eyebrow">Black Friday 2026 · {blackFridayTeaser.period}</p>
        <h1 id="black-friday-title">Il portale sta per aprirsi.</h1>
        <p>Il 27 novembre una nuova occasione attraverserà LoreWise Universe. Resta vicino al varco.</p>
        <BlackFridayCountdown preview={Boolean(previewPhase)} />
        <div className="black-friday-date"><small>La data da ricordare</small><strong>{blackFridayTeaser.targetLabel}</strong></div>
      </div>
    </section>
  </main>;

  const cyberMonday = visiblePhase === "cyber-monday";
  return <main className={`black-friday-page is-campaign is-${visiblePhase}`}>
    <section className="black-friday-campaign-hero" aria-labelledby="black-friday-title">
      <div className="black-friday-campaign-hero-inner shell">
        <Image src="/promotions/black-friday/campaign-hero-v1.webp" alt="Tre portali collegano GiWise Shop, Universe Pass e Cyber Nexus in un osservatorio cosmico" width={1536} height={1024} priority unoptimized />
        <div className="black-friday-campaign-copy">
          <p className="eyebrow">{cyberMonday ? "Cyber Monday · Ultime ore" : blackFridayCampaign.period}</p>
          <h1 id="black-friday-title">Tre percorsi.<br />Una sola apertura.</h1>
          <p>Entra direttamente nello Shop, scegli il tuo Universe Pass oppure raggiungi la collezione digitale Cyber Nexus.</p>
          {cyberMonday
            ? <div className="black-friday-live-signal"><strong>Cyber Monday attivo</strong><span>Fino alle 23:59 del 30 novembre</span></div>
            : <div className="black-friday-next-signal"><small>Il Cyber Monday comincia tra</small><BlackFridayCountdown targetAt={CYBER_MONDAY_STARTS_AT} preview={Boolean(previewPhase)} previewAt={previewPhase ? previewInstants[previewPhase] : undefined} arrivedLabel="Cyber Monday attivo" /></div>}
        </div>
      </div>
    </section>

    <nav className="black-friday-path-index shell" aria-label="Scegli il percorso promozionale">
      {[blackFridayCampaign.shop, blackFridayCampaign.pass, blackFridayCampaign.cyber].map((path, index) => <a href={path.href} key={path.label}><span>0{index + 1}</span><strong>{path.label}</strong><small>{path.offer}</small></a>)}
    </nav>

    <section className="black-friday-paths shell" aria-label="Percorsi della promozione">
      <div id="giwise-shop"><CampaignPath path={blackFridayCampaign.shop} index={1} /></div>
      <div id="universe-pass"><CampaignPath path={blackFridayCampaign.pass} index={2} /></div>
      <CampaignPath path={blackFridayCampaign.cyber} index={3} cyber />
    </section>

    <section className="cyber-nexus-gallery shell" id="cyber-nexus-gallery" aria-labelledby="cyber-nexus-gallery-title">
      <header>
        <p className="eyebrow">Cyber Nexus · La trilogia completa</p>
        <h2 id="cyber-nexus-gallery-title">Tre opere.<br />Due composizioni ciascuna.</h2>
        <p>Ogni soggetto è stato composto separatamente per desktop e smartphone: sei immagini complete, senza ritagli adattati, già incluse nel Universe Pass.</p>
      </header>
      <div className="cyber-nexus-works">
        {blackFridayCampaign.cyberWorks.map((work) => <article className="cyber-nexus-work" key={work.id}>
          <div className="cyber-nexus-work-images">
            <figure><Image src={work.desktopPreview} alt={`Anteprima protetta desktop di ${work.title}`} width={1280} height={720} unoptimized /><figcaption>Desktop · 3840 × 2160</figcaption></figure>
            <figure><Image src={work.mobilePreview} alt={`Anteprima protetta smartphone di ${work.title}`} width={720} height={1280} unoptimized /><figcaption>Smartphone · 2160 × 3840</figcaption></figure>
          </div>
          <div><span>{work.number}</span><h3>{work.title}</h3><p>{work.description}</p></div>
        </article>)}
      </div>
    </section>

    <section className="black-friday-rules shell" aria-labelledby="black-friday-rules-title">
      <Image src="/promotions/black-friday/countdown-clock-emblem-v1.webp" alt="Orologio cosmico della campagna" width={1254} height={1254} unoptimized />
      <div><p className="eyebrow">Condizioni chiare</p><h2 id="black-friday-rules-title">Il vantaggio migliore, senza somme nascoste.</h2><ul><li>Le offerte sono valide dal 23 al 30 novembre 2026.</li><li>Gli sconti non si sommano ad altre promozioni.</li><li>Per gli abbonamenti il prezzo ridotto riguarda soltanto il primo mese.</li><li>Cyber Nexus è incluso senza costi aggiuntivi nei Download VIP.</li></ul></div>
    </section>
  </main>;
}
