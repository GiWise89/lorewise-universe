"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { NexusChronicle } from "@/lib/nexusChronicles";
type ChroniclePanel = "signals" | "promotion" | "guides" | "benefits";

const panels: Array<{ id: ChroniclePanel; number: string; label: string }> = [
  { id: "signals", number: "01", label: "Novità VIP" },
  { id: "promotion", number: "02", label: "Promozione" },
  { id: "guides", number: "03", label: "Atlante dei Giochi" },
  { id: "benefits", number: "04", label: "Vantaggi" },
];

function italianDate(value: string) {
  return new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "long", year: "numeric", timeZone: "Europe/Rome" }).format(new Date(`${value}T12:00:00Z`));
}

function ChronicleStory({ chronicle, index }: { chronicle: NexusChronicle; index: number }) {
  const [activePanel, setActivePanel] = useState<ChroniclePanel>("signals");
  const [activeGuideSection, setActiveGuideSection] = useState(chronicle.upcoming.featuredGame?.sections[0]?.id ?? "overview");
  const panelIndex = panels.findIndex((panel) => panel.id === activePanel);
  const movePanel = (direction: -1 | 1) => setActivePanel(panels[(panelIndex + direction + panels.length) % panels.length].id);
  const featuredGame = chronicle.upcoming.featuredGame;
  const selectedGuideSection = featuredGame?.sections.find((section) => section.id === activeGuideSection) ?? featuredGame?.sections[0];

  return <article className={`nexus-chronicle-story${chronicle.featured ? " is-featured" : ""}`}>
    <header className="nexus-chronicle-lead">
      <div className="nexus-chronicle-visual"><span>{String(index + 1).padStart(2, "0")}</span><Image src={chronicle.image} alt={chronicle.imageAlt} width={1024} height={1024} unoptimized /></div>
      <div className="nexus-chronicle-copy">
        <div className="nexus-chronicle-meta"><strong>{chronicle.issue}</strong><span>{chronicle.categoryLabel}</span><time dateTime={chronicle.publishedAt}>{italianDate(chronicle.publishedAt)}</time></div>
        <h2>{chronicle.title}</h2><p className="nexus-chronicle-excerpt">{chronicle.excerpt}</p><p>{chronicle.detail}</p>
      </div>
    </header>

    <div className="nexus-vip-location" role="note" aria-label="Dove trovare i contenuti completi"><span>Dossier, anteprime, votazioni e download riservati</span><strong>TROVI TUTTO DENTRO L’AREA VIP</strong></div>

    <div className="nexus-section-switcher">
      <div className="nexus-section-switcher-heading"><span>Sfoglia la cronaca</span><strong>{String(panelIndex + 1).padStart(2, "0")} / {String(panels.length).padStart(2, "0")}</strong></div>
      <div className="nexus-section-tabs" role="tablist" aria-label="Sezioni della Cronaca">
        {panels.map((panel) => <button type="button" role="tab" id={`${chronicle.id}-${panel.id}-tab`} aria-controls={`${chronicle.id}-${panel.id}-panel`} aria-selected={activePanel === panel.id} className={activePanel === panel.id ? "is-active" : undefined} onClick={() => setActivePanel(panel.id)} key={panel.id}><span>{panel.number}</span>{panel.label}</button>)}
      </div>
      <div className="nexus-switch-mobile-controls" aria-label="Controlli per cambiare sezione"><button type="button" onClick={() => movePanel(-1)} aria-label="Sezione precedente">←</button><span>Tocca una categoria o usa le frecce</span><button type="button" onClick={() => movePanel(1)} aria-label="Sezione successiva">→</button></div>
    </div>

    <section className="nexus-chronicle-transmissions" role="tabpanel" id={`${chronicle.id}-signals-panel`} aria-labelledby={`${chronicle.id}-signals-tab`} hidden={activePanel !== "signals"}>
      <div className="nexus-chronicle-section-heading"><span>01 · Segnali dal Nexus</span><h3>Novità dal Nexus.</h3></div>
      <div className="nexus-signal-grid">{chronicle.signals.map((signal) => <article className="nexus-signal" key={signal.title}><div className="nexus-signal-image"><Image src={signal.image} alt={signal.imageAlt} width={1200} height={900} unoptimized /></div><div className="nexus-signal-copy"><span>{signal.label}</span><h4>{signal.title}</h4><p>{signal.text}</p><small>{signal.note}</small></div></article>)}</div>
    </section>

    <section className="nexus-chronicle-promotion" role="tabpanel" id={`${chronicle.id}-promotion-panel`} aria-labelledby={`${chronicle.id}-promotion-tab`} hidden={activePanel !== "promotion"}>
      <div className="nexus-promotion-heading"><span>02 · {chronicle.promotion.label}</span><h3>{chronicle.promotion.title}</h3><strong>{chronicle.promotion.period}</strong><p>{chronicle.promotion.description}</p></div>
      <div className="nexus-promotion-rates" aria-label="Sconti della promozione">{chronicle.promotion.rates.map((rate) => <div key={rate.audience}><span>{rate.audience}</span><strong>{rate.discount}</strong></div>)}</div>
      <ul className="nexus-promotion-terms">{chronicle.promotion.terms.map((term) => <li key={term}>{term}</li>)}</ul>
      <Link href={chronicle.promotion.href}>{chronicle.promotion.action}<span aria-hidden="true">→</span></Link>
    </section>

    <section className="nexus-chronicle-upcoming" role="tabpanel" id={`${chronicle.id}-guides-panel`} aria-labelledby={`${chronicle.id}-guides-tab`} hidden={activePanel !== "guides"}>
      <div className="nexus-guide-intro"><span>03 · {chronicle.upcoming.label}</span><h3>{chronicle.upcoming.title}</h3><strong>{chronicle.upcoming.status}</strong><p>{chronicle.upcoming.description}</p><ul>{chronicle.upcoming.features.map((feature) => <li key={feature}>{feature}</li>)}</ul></div>
      {activePanel === "guides" && featuredGame && selectedGuideSection ? <div className="nexus-atlas-game">
        <header className="nexus-atlas-game-hero">
          <div className="nexus-atlas-game-image"><Image src={featuredGame.cover} alt={featuredGame.coverAlt} width={1920} height={1080} unoptimized /></div>
          <div className="nexus-atlas-game-copy">
            <span>{featuredGame.kicker}</span><h4>{featuredGame.title}</h4><p>{featuredGame.description}</p>
            <div className="nexus-atlas-vip-cta">
              <span>{featuredGame.vipCta.label}</span><strong>{featuredGame.vipCta.title}</strong><p>{featuredGame.vipCta.text}</p>
              <Link href={featuredGame.vipCta.href}>{featuredGame.vipCta.action}<span aria-hidden="true">→</span></Link>
              <small>{featuredGame.vipCta.note}</small>
            </div>
            <a className="nexus-atlas-store-link" href={featuredGame.storeUrl} target="_blank" rel="noreferrer">{featuredGame.storeAction}<span aria-hidden="true">↗</span></a><small>Collegamento alla pagina ufficiale del gioco.</small>
          </div>
        </header>

        <div className="nexus-atlas-switcher">
          <div className="nexus-atlas-switcher-heading"><span>Sfoglia la guida</span><strong>{selectedGuideSection.number} / {String(featuredGame.sections.length).padStart(2, "0")}</strong></div>
          <div className="nexus-atlas-tabs" role="tablist" aria-label={`Sezioni della guida di ${featuredGame.title}`}>
            {featuredGame.sections.map((section) => <button type="button" role="tab" aria-selected={section.id === selectedGuideSection.id} className={section.id === selectedGuideSection.id ? "is-active" : undefined} onClick={() => setActiveGuideSection(section.id)} key={section.id}><span>{section.number}</span>{section.label}</button>)}
          </div>
          <div className="nexus-atlas-mobile-hint" aria-hidden="true"><span>←</span>Scorri lateralmente per cambiare argomento<span>→</span></div>
        </div>

        <section className="nexus-atlas-section">
          <div className="nexus-atlas-section-copy"><span>{selectedGuideSection.number} · {selectedGuideSection.label}</span><h4>{selectedGuideSection.title}</h4><p>{selectedGuideSection.text}</p></div>
          <div className={`nexus-atlas-gallery is-${selectedGuideSection.id}`}>
            {selectedGuideSection.images.map((item, imageIndex) => <figure className={imageIndex === 0 ? "is-primary" : undefined} key={item.src}><div><Image src={item.src} alt={item.alt} width={1400} height={1000} unoptimized /></div><figcaption>{item.caption}</figcaption></figure>)}
          </div>
        </section>
      </div> : null}
    </section>

    <section className="nexus-chronicle-benefits" role="tabpanel" id={`${chronicle.id}-benefits-panel`} aria-labelledby={`${chronicle.id}-benefits-tab`} hidden={activePanel !== "benefits"}>
      <div className="nexus-chronicle-section-heading"><span>04 · Dentro il Pass</span><h3>Quello che puoi fare con il Pass.</h3></div>
      <div className="nexus-benefit-grid">{chronicle.benefits.map((benefit, benefitIndex) => <article key={benefit.title}><span>{String(benefitIndex + 1).padStart(2, "0")}</span><h4>{benefit.title}</h4><p>{benefit.text}</p></article>)}</div>
    </section>

    <footer className="nexus-chronicle-conclusion"><div><span>Una promessa chiara</span><h3>Il pubblico non perde nulla.</h3><p>{chronicle.transparency}</p></div><Link href={chronicle.href}>{chronicle.action}<span aria-hidden="true">→</span></Link></footer>
  </article>;
}

export function NexusChroniclesFeed({ chronicles }: { chronicles: NexusChronicle[] }) {
  return <div className="nexus-chronicles-list" aria-live="polite">{chronicles.map((chronicle, index) => <ChronicleStory chronicle={chronicle} index={index} key={chronicle.id} />)}</div>;
}
