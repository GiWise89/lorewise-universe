"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { NexusChronicle } from "@/lib/nexusChronicles";
import { isWelcomeCommissionOfferActive, WELCOME_COMMISSION_OFFER } from "@/lib/welcomeCommissionOffer";
import { StudioWorkInProgress } from "@/components/StudioWorkInProgress";
type ChroniclePanel = "overview" | "signals" | "studio" | "promotion" | "guides" | "benefits";
type BenefitView = "focus" | "events";

const panels: Array<{ id: ChroniclePanel; number: string; label: string }> = [
  { id: "overview", number: "01", label: "In primo piano" },
  { id: "signals", number: "02", label: "Aggiornamenti" },
  { id: "studio", number: "03", label: "Laboratorio" },
  { id: "promotion", number: "04", label: "Promozioni" },
  { id: "guides", number: "05", label: "Guide e demo" },
  { id: "benefits", number: "06", label: "Area VIP" },
];

function italianDate(value: string) {
  return new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "long", year: "numeric", timeZone: "Europe/Rome" }).format(new Date(`${value}T12:00:00Z`));
}

function ChronicleStory({ chronicle, index }: { chronicle: NexusChronicle; index: number }) {
  const [activePanel, setActivePanel] = useState<ChroniclePanel>("overview");
  const [activeGuideSection, setActiveGuideSection] = useState(chronicle.upcoming.featuredGame?.sections[0]?.id ?? "overview");
  const [activeBenefitView, setActiveBenefitView] = useState<BenefitView>("events");
  const [activeBenefitEventCode, setActiveBenefitEventCode] = useState(chronicle.benefitEvents[0]?.code ?? "");
  const panelIndex = panels.findIndex((panel) => panel.id === activePanel);
  const movePanel = (direction: -1 | 1) => setActivePanel(panels[(panelIndex + direction + panels.length) % panels.length].id);
  const featuredGame = chronicle.upcoming.featuredGame;
  const selectedGuideSection = featuredGame?.sections.find((section) => section.id === activeGuideSection) ?? featuredGame?.sections[0];
  const selectedBenefitEvent = chronicle.benefitEvents.find((event) => event.code === activeBenefitEventCode) ?? chronicle.benefitEvents[0];
  const welcomeOfferActive = isWelcomeCommissionOfferActive();

  return <article className={`nexus-chronicle-story is-${chronicle.category}${chronicle.featured ? " is-featured" : ""}`}>
    <div className="nexus-section-switcher">
      <div className="nexus-section-switcher-heading"><span>Sfoglia la cronaca</span><strong>{String(panelIndex + 1).padStart(2, "0")} / {String(panels.length).padStart(2, "0")}</strong></div>
      <div className="nexus-section-tabs" role="tablist" aria-label="Sezioni della Cronaca">
        {panels.map((panel) => <button type="button" role="tab" id={`${chronicle.id}-${panel.id}-tab`} aria-controls={`${chronicle.id}-${panel.id}-panel`} aria-selected={activePanel === panel.id} className={activePanel === panel.id ? "is-active" : undefined} onClick={() => setActivePanel(panel.id)} key={panel.id}><span>{panel.number}</span>{panel.label}</button>)}
      </div>
      <div className="nexus-switch-mobile-controls" aria-label="Controlli per cambiare sezione"><button type="button" onClick={() => movePanel(-1)} aria-label="Sezione precedente">←</button><span>Tocca una categoria o usa le frecce</span><button type="button" onClick={() => movePanel(1)} aria-label="Sezione successiva">→</button></div>
    </div>

    <section className="nexus-chronicle-overview" role="tabpanel" id={`${chronicle.id}-overview-panel`} aria-labelledby={`${chronicle.id}-overview-tab`} hidden={activePanel !== "overview"}>
      <header className="nexus-chronicle-lead">
        <div className="nexus-chronicle-visual"><span>{String(index + 1).padStart(2, "0")}</span><Image src={chronicle.image} alt={chronicle.imageAlt} width={1024} height={1024} unoptimized /></div>
        <div className="nexus-chronicle-copy">
          <div className="nexus-chronicle-meta"><strong>{chronicle.issue}</strong><span>{chronicle.categoryLabel}</span><time dateTime={chronicle.publishedAt}>{italianDate(chronicle.publishedAt)}</time></div>
          <h2>{chronicle.title}</h2><p className="nexus-chronicle-excerpt">{chronicle.excerpt}</p><p>{chronicle.detail}</p>
        </div>
      </header>
      <footer className="nexus-chronicle-conclusion"><div><span>Una promessa chiara</span><h3>Il pubblico non perde nulla.</h3><p>{chronicle.transparency}</p></div><Link href={chronicle.href}>{chronicle.action}<span aria-hidden="true">→</span></Link></footer>
      <div className="nexus-vip-location" role="note" aria-label="Dove trovare i contenuti completi"><span>Dossier, anteprime, votazioni e download riservati</span><strong>TROVI TUTTO DENTRO L’AREA VIP</strong><Link href="/abbonamento">Abbonati all’Area VIP <span aria-hidden="true">→</span></Link>{chronicle.id === "demon-match-android-development" ? <small>Demo gratuita Android in arrivo</small> : null}</div>
    </section>

    <section className="nexus-chronicle-transmissions" role="tabpanel" id={`${chronicle.id}-signals-panel`} aria-labelledby={`${chronicle.id}-signals-tab`} hidden={activePanel !== "signals"}>
      <div className="nexus-chronicle-section-heading"><span>02 · Segnali dal Nexus</span><h3>Aggiornamenti.</h3></div>
      <div className="nexus-signal-grid">{chronicle.signals.map((signal) => <article className="nexus-signal" key={signal.title}><div className="nexus-signal-image"><Image src={signal.image} alt={signal.imageAlt} width={1200} height={900} unoptimized /></div><div className="nexus-signal-copy"><span>{signal.label}</span><h4>{signal.title}</h4><p>{signal.text}</p><small>{signal.note}</small><Link className="nexus-signal-link" href={signal.href}>{signal.action}<span aria-hidden="true">→</span></Link></div></article>)}</div>
    </section>

    <section className="nexus-chronicle-studio" role="tabpanel" id={`${chronicle.id}-studio-panel`} aria-labelledby={`${chronicle.id}-studio-tab`} hidden={activePanel !== "studio"}>
      <StudioWorkInProgress />
    </section>

    <section className={`nexus-chronicle-promotion is-${chronicle.promotion.theme}`} role="tabpanel" id={`${chronicle.id}-promotion-panel`} aria-labelledby={`${chronicle.id}-promotion-tab`} hidden={activePanel !== "promotion"}>
      <div className="nexus-promotion-heading"><span>04 · {chronicle.promotion.label}</span><h3>{chronicle.promotion.title}</h3><strong>{chronicle.promotion.period}</strong><p>{chronicle.promotion.description}</p></div>
      <figure className="nexus-promotion-visual"><Image src={chronicle.promotion.visual} alt={chronicle.promotion.visualAlt} width={1600} height={1000} unoptimized /><figcaption>{chronicle.promotion.label} · {chronicle.promotion.period}</figcaption></figure>
      <div className="nexus-promotion-rates" aria-label="Sconti della promozione">{chronicle.promotion.rates.map((rate) => <div key={rate.audience}><span>{rate.audience}</span><strong>{rate.discount}</strong></div>)}</div>
      <ul className="nexus-promotion-terms">{chronicle.promotion.terms.map((term) => <li key={term}>{term}</li>)}</ul>
      <Link href={chronicle.promotion.href}>{chronicle.promotion.action}<span aria-hidden="true">→</span></Link>
      {welcomeOfferActive ? <section className="nexus-welcome-offer" aria-labelledby={`${chronicle.id}-welcome-offer-title`}>
        <div className="nexus-welcome-offer-seal"><Image src="/brand/lorewise-wax-seal-v1.webp" alt="Sigillo LoreWise Universe" width={1536} height={1536} unoptimized /><span>−5 €</span></div>
        <div className="nexus-welcome-offer-copy">
          <span>Bonus LoreWise ID · In vigore</span>
          <h4 id={`${chronicle.id}-welcome-offer-title`}>{WELCOME_COMMISSION_OFFER.title}</h4>
          <p>Un vantaggio dedicato al primo progetto commissionato, disponibile sia per chi crea ora il proprio LoreWise ID sia per chi è già iscritto.</p>
          <dl>
            <div><dt>Nuovi iscritti</dt><dd>Conferma entro il 30 settembre</dd></div>
            <div><dt>Account già confermati</dt><dd>Bonus valido fino al 30 ottobre</dd></div>
            <div><dt>Applicazione</dt><dd>Automatica sul preventivo</dd></div>
          </dl>
          <ul>
            <li>Riservato alla prima commissione collegata al LoreWise ID.</li>
            <li>Per i nuovi iscritti dura 30 giorni dalla conferma dell’account.</li>
            <li>Non si somma ad altri sconti: viene applicato il vantaggio più conveniente.</li>
          </ul>
          <Link href={WELCOME_COMMISSION_OFFER.href}>{WELCOME_COMMISSION_OFFER.action}<span aria-hidden="true">→</span></Link>
        </div>
      </section> : null}
    </section>

    <section className="nexus-chronicle-upcoming" role="tabpanel" id={`${chronicle.id}-guides-panel`} aria-labelledby={`${chronicle.id}-guides-tab`} hidden={activePanel !== "guides"}>
      <div className="nexus-guide-intro"><span>05 · {chronicle.upcoming.label}</span><h3>{chronicle.upcoming.title}</h3><strong>{chronicle.upcoming.status}</strong><p>{chronicle.upcoming.description}</p><ul>{chronicle.upcoming.features.map((feature) => <li key={feature}>{feature}</li>)}</ul></div>
      {featuredGame && selectedGuideSection ? <div className="nexus-atlas-game">
        <header className="nexus-atlas-game-hero">
          <div className="nexus-atlas-game-image"><Image src={featuredGame.cover} alt={featuredGame.coverAlt} width={1920} height={1080} unoptimized /></div>
          <div className="nexus-atlas-game-copy">
            <span>{featuredGame.kicker}</span><h4>{featuredGame.title}</h4><p>{featuredGame.description}</p>
            <div className="nexus-atlas-vip-cta">
              <span>{featuredGame.vipCta.label}</span><strong>{featuredGame.vipCta.title}</strong><p>{featuredGame.vipCta.text}</p>
              <Link href={featuredGame.vipCta.href}>{featuredGame.vipCta.action}<span aria-hidden="true">→</span></Link>
              <small>{featuredGame.vipCta.note}</small>
            </div>
            <a className="nexus-atlas-store-link" href={featuredGame.storeUrl} target="_blank" rel="noopener noreferrer">{featuredGame.storeAction}<span aria-hidden="true">↗</span></a><small>Collegamento alla pagina ufficiale del gioco.</small>
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
      <div className="nexus-benefit-storyboard">
        <div className="nexus-chronicle-section-heading"><span>06 · Registro premium permanente</span><h3>Tutto quello che si muove nel Pass.</h3><p>Il focus cambia con ogni Cronaca, ma questo registro conserva sempre tutti gli eventi, i vantaggi, le frequenze e gli stati realmente dichiarati.</p></div>
        <figure className="nexus-benefit-sketch">
          <Image src="/universe-pass/benefits-sketch-constellation-v1.webp" alt="Taccuino illustrato dei vantaggi LoreWise: arte, giochi, commissioni, Codex e Community" width={1536} height={1024} />
          <figcaption>Appunti dal Nexus · ogni orbita conduce a un vantaggio reale</figcaption>
        </figure>
      </div>
      <div className="nexus-benefit-premium-lead">
        <div><span>Edizione corrente</span><strong>{chronicle.issue}</strong><p>Focus e vantaggi della settimana</p></div>
        <div><span>Registro completo</span><strong>{String(chronicle.benefitEvents.length).padStart(2, "0")}</strong><p>Eventi e percorsi disponibili</p></div>
        <div><span>Nuova Cronaca</span><strong>Lunedì</strong><p>Un nuovo capitolo ogni settimana</p></div>
      </div>
      <div className="nexus-benefit-view-switcher" role="tablist" aria-label="Contenuti della sezione Vantaggi">
        <button type="button" role="tab" aria-selected={activeBenefitView === "focus"} className={activeBenefitView === "focus" ? "is-active" : undefined} onClick={() => setActiveBenefitView("focus")}><span>01</span>Focus settimanale</button>
        <button type="button" role="tab" aria-selected={activeBenefitView === "events"} className={activeBenefitView === "events" ? "is-active" : undefined} onClick={() => setActiveBenefitView("events")}><span>02</span>Registro eventi</button>
      </div>
      {activeBenefitView === "focus" ? <div className="nexus-benefit-view-panel" role="tabpanel">
        <div className="nexus-benefit-subheading"><span>Focus della Cronaca</span><p>Quattro vantaggi messi in evidenza questa settimana.</p></div>
        <div className="nexus-benefit-grid">{chronicle.benefits.map((benefit, benefitIndex) => <article key={benefit.title}><span>{String(benefitIndex + 1).padStart(2, "0")}</span><h4>{benefit.title}</h4><p>{benefit.text}</p></article>)}</div>
      </div> : selectedBenefitEvent ? <div className="nexus-benefit-view-panel" role="tabpanel">
        <div className="nexus-benefit-subheading"><span>Tutti gli eventi del Pass</span><p>Scegli un evento: nella pagina ne viene aperto uno solo alla volta.</p></div>
        <div className="nexus-benefit-workbench">
          <div className="nexus-benefit-event-switcher" role="tablist" aria-label="Eventi e vantaggi del Pass">
            {chronicle.benefitEvents.map((event, eventIndex) => <button type="button" role="tab" aria-selected={event.code === selectedBenefitEvent.code} className={event.code === selectedBenefitEvent.code ? "is-active" : undefined} onClick={() => setActiveBenefitEventCode(event.code)} key={event.code}><span>{String(eventIndex + 1).padStart(2, "0")}</span>{event.area}</button>)}
          </div>
          <article className="nexus-benefit-event-stage">
            <header><span>{selectedBenefitEvent.area}</span><strong>{selectedBenefitEvent.status}</strong></header>
            <div><small>{selectedBenefitEvent.code}</small><h4>{selectedBenefitEvent.title}</h4><p>{selectedBenefitEvent.description}</p></div>
            <aside><span>Frequenza o scadenza</span><strong>{selectedBenefitEvent.timing}</strong><Link href={selectedBenefitEvent.href}>{selectedBenefitEvent.action}<span aria-hidden="true">→</span></Link></aside>
          </article>
        </div>
      </div> : null}
    </section>

  </article>;
}

export function NexusChroniclesFeed({ chronicles }: { chronicles: NexusChronicle[] }) {
  const [activeChronicleId, setActiveChronicleId] = useState(chronicles[0]?.id ?? "");
  const activeChronicle = chronicles.find((chronicle) => chronicle.id === activeChronicleId) ?? chronicles[0];
  const activeIndex = Math.max(0, chronicles.findIndex((chronicle) => chronicle.id === activeChronicle?.id));

  if (!activeChronicle) return null;

  return <div className="nexus-chronicles-list" aria-live="polite">
    {chronicles.length > 1 ? <div className="nexus-section-switcher nexus-edition-switcher">
      <div className="nexus-section-switcher-heading"><span>Archivio delle Cronache</span><strong>{String(activeIndex + 1).padStart(2, "0")} / {String(chronicles.length).padStart(2, "0")}</strong></div>
      <div className="nexus-section-tabs" role="tablist" aria-label="Scegli un’edizione delle Cronache del Nexus">
        {chronicles.map((chronicle) => <button type="button" role="tab" aria-selected={chronicle.id === activeChronicle.id} className={chronicle.id === activeChronicle.id ? "is-active" : undefined} onClick={() => setActiveChronicleId(chronicle.id)} key={chronicle.id}><span>{chronicle.issue.replace("Cronaca ", "")}</span>{italianDate(chronicle.publishedAt)}</button>)}
      </div>
    </div> : null}
    <ChronicleStory chronicle={activeChronicle} index={activeIndex} key={activeChronicle.id} />
  </div>;
}
