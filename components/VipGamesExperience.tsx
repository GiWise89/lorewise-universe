"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { VIP_AREAS, VIP_DEMON_MATCH_DROP, VIP_EDITORIAL_STATUS, VIP_EXPANSION } from "@/lib/vipZone";
import type { VIP_ARTWORKS, VIP_ART_DROP } from "@/data/vip-artworks";
import { VipArtExperience } from "@/components/VipArtExperience";
import type { VIP_ATELIER } from "@/data/vip-atelier";
import type { VIP_DOWNLOAD_LIBRARY } from "@/data/vip-downloads";
import { VipAtelierExperience } from "@/components/VipAtelierExperience";
import { showVipMediaFallback } from "@/lib/vipMediaClient";
import { GameGuideExperience } from "@/components/GameGuideExperience";
import type { GameGuide } from "@/lib/gameGuides";

type VipPayload = {
  member: { plan: string; badge: string | null; artworkDiscountPercent: number; collectorDossiers: boolean; accessLabel: string };
  areas: typeof VIP_AREAS;
  editorial: typeof VIP_EDITORIAL_STATUS;
  expansion: typeof VIP_EXPANSION;
  demonMatch: typeof VIP_DEMON_MATCH_DROP;
  art: typeof VIP_ART_DROP & { artworks: typeof VIP_ARTWORKS };
  atelier: typeof VIP_ATELIER;
  downloads: typeof VIP_DOWNLOAD_LIBRARY;
  weeklyGuide: GameGuide | null;
};

type ActiveGame = "the-wound-remembers" | "demon-match-three";
type ActiveArea = "guides" | "games" | "art" | "atelier" | "downloads";
const VIP_AREA_ICONS: Record<ActiveArea, string> = {
  guides: "/brand/icons/vip-guides-v1.webp",
  games: "/brand/icons/vip-games-v1.webp",
  art: "/brand/icons/vip-art-v1.webp",
  atelier: "/brand/icons/vip-atelier-v1.webp",
  downloads: "/brand/icons/vip-downloads-v1.webp",
};
export function VipGamesExperience({ initialArea = "guides", initialGame = "the-wound-remembers", guidePreview = "" }: {
  initialArea?: ActiveArea;
  initialGame?: ActiveGame;
  guidePreview?: string;
}) {
  const [payload, setPayload] = useState<VipPayload | null>(null);
  const [error, setError] = useState<{ message: string; reason: string } | null>(null);
  const [activeArea, setActiveArea] = useState<ActiveArea>(initialArea);
  const [activeGame, setActiveGame] = useState<ActiveGame>(initialGame);

  useEffect(() => {
    const controller = new AbortController();
    const vipApiUrl = guidePreview ? `/api/vip-zone?guida=${encodeURIComponent(guidePreview)}` : "/api/vip-zone";
    fetch(vipApiUrl, { cache: "no-store", headers: { accept: "application/json" }, signal: controller.signal })
      .then(async (response) => {
        const body = await response.json() as VipPayload & { error?: string; reason?: string };
        if (!response.ok) throw new Error(`${body.reason ?? "unavailable"}\n${body.error ?? "Accesso non disponibile."}`);
        setPayload(body);
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        const [code, ...parts] = reason instanceof Error ? reason.message.split("\n") : ["unavailable", "Accesso non disponibile."];
        setError({ reason: code, message: parts.join(" ") });
      });
    return () => controller.abort();
  }, [guidePreview]);

  useEffect(() => {
    if (!payload || !window.location.hash) return;
    const targetId = decodeURIComponent(window.location.hash.slice(1));
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(targetId)?.scrollIntoView({ block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [payload, activeArea, activeGame]);

  function openArea(areaId: string) {
    setActiveArea(areaId === "guides" || areaId === "art" || areaId === "atelier" || areaId === "downloads" ? areaId : "games");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (error) {
    return <section className="vip-gate shell" aria-labelledby="vip-gate-title">
      <img className="vip-gate-seal" src="/brand/icons/lorewise-vip-official-v1.webp" alt="Sigillo dell’Area VIP" width="1024" height="1024" />
      <div>
        <p className="eyebrow">Archivio riservato</p>
        <h1 id="vip-gate-title">L’Area VIP è chiusa.</h1>
        <p>{error.message}</p>
        <Link href={error.reason === "signed-out" ? "/account" : "/abbonamento"}>
          {error.reason === "signed-out" ? "Accedi al LoreWise ID" : "Scopri Universe Pass"}
        </Link>
      </div>
    </section>;
  }

  if (!payload) {
    const loadingTargetId = activeArea === "games"
      ? activeGame === "demon-match-three" ? "vip-demon-match" : "dossier-rogo"
      : activeArea;
    return <section className="vip-loading shell" id={loadingTargetId} aria-live="polite">
      <span aria-hidden="true" />
      <p>Verifica del Pass in corso…</p>
    </section>;
  }

  const { areas, editorial, expansion, demonMatch, member } = payload;
  return <>
    <aside className="vip-member-bar" aria-label="Stato Universe Pass">
      <div className="shell">
        <div className="vip-club-identity">
          <span className="vip-club-seal" aria-hidden="true">
            <img src="/brand/icons/lorewise-vip-official-v1.webp" alt="" width="1024" height="1024" />
          </span>
          <div>
            <small>Il circolo privato di LoreWise</small>
            <strong>Benvenuto nell&rsquo;Area VIP.</strong>
            <p>Anteprime, opere e contenuti riservati a chi sostiene ogni nuovo mondo.</p>
          </div>
        </div>
        <div className="vip-editorial-status">
          <span className="vip-pass-status"><small>Il tuo accesso</small><strong>Pass {member.plan} attivo</strong></span>
          <span><small>Ultimo aggiornamento</small><strong>{editorial.lastUpdated}</strong></span>
          <span><small>Prossimo VIP Drop</small><strong>{editorial.nextDrop}</strong></span>
        </div>
      </div>
    </aside>
    <nav className="vip-area-nav" aria-label="Sezioni dell’Area VIP">
      <div className="shell" role="tablist" aria-label="Aree riservate">
        {areas.map((area) => area.available ? <button
          className={area.id === activeArea ? "is-active" : undefined}
          type="button"
          role="tab"
          aria-selected={area.id === activeArea}
          aria-controls={area.id}
          onClick={() => openArea(area.id)}
          data-area={area.id}
          key={area.id}
        >
          <img className="vip-area-icon" src={VIP_AREA_ICONS[area.id as ActiveArea]} alt="" aria-hidden="true" width="768" height="768" />
          <small>Sala riservata</small>
          <strong>{area.label}</strong>
          <em>{area.description}</em>
          <i>{area.status}</i>
          <b>{area.update}</b>
        </button> : <div className="is-locked" aria-disabled="true" data-area={area.id} key={area.id}>
          <img className="vip-area-icon" src={VIP_AREA_ICONS[area.id as ActiveArea]} alt="" aria-hidden="true" width="768" height="768" />
          <small>Sala riservata</small>
          <strong>{area.label}</strong>
          <em>{area.description}</em>
          <i>{area.status}</i>
          <b>{area.update}</b>
        </div>)}
      </div>
    </nav>

    {activeArea === "guides" ? <section className="vip-weekly-guide" id="guides" aria-labelledby="vip-weekly-guide-title">
      <div className="shell">
        {payload.weeklyGuide ? <GameGuideExperience guide={payload.weeklyGuide} context="vip" /> : <div className="vip-weekly-guide-empty">
          <p className="eyebrow">Guide della settimana</p>
          <h1 id="vip-weekly-guide-title">La prossima guida sta entrando nel Nexus.</h1>
          <p>L’ultima guida è già passata nell’area pubblica Giochi. La nuova anteprima VIP verrà annunciata qui.</p>
          <Link href="/giochi/guide">Consulta le guide pubbliche <span aria-hidden="true">→</span></Link>
        </div>}
      </div>
    </section> : null}

    {activeArea === "art" ? <VipArtExperience art={payload.art} discountPercent={member.artworkDiscountPercent} /> : null}
    {activeArea === "atelier" ? <VipAtelierExperience atelier={payload.atelier} /> : null}
    {activeArea === "downloads" ? <section className="vip-download-library" id="downloads" aria-labelledby="vip-download-library-title">
      <header className="vip-download-library-hero">
        <div className="shell">
          <p className="eyebrow">{payload.downloads.eyebrow}</p>
          <h1 id="vip-download-library-title" aria-label={payload.downloads.title}>
            <span>Download</span>
            <strong aria-hidden="true">VIP</strong>
          </h1>
          <p>{payload.downloads.introduction}</p>
          <dl>
            <div><dt>Raccolte</dt><dd>{payload.downloads.collections.length}</dd></div>
            <div><dt>Sfondi HD</dt><dd>{payload.downloads.collections.reduce((total, collection) => total + collection.items.length, 0)}</dd></div>
            <div><dt>Accesso</dt><dd>Incluso nel Pass</dd></div>
          </dl>
        </div>
      </header>
      <div className="shell vip-download-collections">
        {payload.downloads.collections.map((collection, collectionIndex) => <section className={`vip-download-collection is-${collection.accent}`} id={collection.id} aria-labelledby={`vip-download-${collection.id}`} key={collection.id}>
          <header>
            <div>
              <p className="eyebrow">Raccolta {String(collectionIndex + 1).padStart(2, "0")} · {collection.code}</p>
              <h2 id={`vip-download-${collection.id}`}>{collection.title}</h2>
              <strong>{collection.subtitle}</strong>
              <p>{collection.description}</p>
            </div>
            <a href={`/api/vip-download?package=${collection.bundle.packageId}`} download>
              <span aria-hidden="true">↓</span> {collection.bundle.label}
            </a>
          </header>
          <div className="vip-download-grid">
            {collection.items.map((item, itemIndex) => <article key={item.code}>
              <figure>
                <img src={`/api/vip-media?asset=${item.image}`} alt={`${item.title}, sfondo desktop Area VIP`} loading="lazy" decoding="async" onError={showVipMediaFallback} />
                <figcaption><span>{String(itemIndex + 1).padStart(2, "0")}</span><strong>Anteprima protetta</strong></figcaption>
              </figure>
              <div>
                <p>{item.code}</p>
                <h3>{item.title}</h3>
                <dl>
                  <div><dt>Risoluzione</dt><dd>{item.resolution}</dd></div>
                  <div><dt>Formato</dt><dd>{item.format}</dd></div>
                </dl>
                <a href={`/api/vip-download?package=${item.packageId}`} download><span aria-hidden="true">↓</span> Scarica lo sfondo</a>
              </div>
            </article>)}
          </div>
        </section>)}
        <footer className="vip-download-library-note"><strong>Originali protetti</strong><p>{payload.downloads.note}</p></footer>
      </div>
    </section> : null}
    {activeArea === "games" ? <>
    <section className="vip-games-directory" id="games" aria-labelledby="vip-games-directory-title">
      <div className="shell">
        <header>
          <p className="eyebrow">Area Giochi</p>
          <h1 id="vip-games-directory-title">Tre giochi. Tre archivi separati.</h1>
          <p>Scegli quale dossier riservato consultare.</p>
        </header>
        <nav aria-label="Dossier dei giochi" role="tablist">
          <button className={activeGame === "the-wound-remembers" ? "is-selected" : undefined} type="button" role="tab" aria-selected={activeGame === "the-wound-remembers"} aria-controls="vip-panel-twr" onClick={() => setActiveGame("the-wound-remembers")}>
            <span>01</span>
            <strong>The Wound Remembers</strong>
            <small>Il Rogo delle Dieci Porte</small>
          </button>
          <button className={activeGame === "demon-match-three" ? "is-selected" : undefined} type="button" role="tab" aria-selected={activeGame === "demon-match-three"} aria-controls="vip-demon-match" onClick={() => setActiveGame("demon-match-three")}>
            <span>02</span>
            <strong>Demon Match Three</strong>
            <small>Nora · Varek · Android</small>
          </button>
        </nav>
      </div>
    </section>

    {activeGame === "the-wound-remembers" ? <div id="vip-panel-twr" role="tabpanel">
    <section className="vip-expansion-hero" id="the-wound-remembers" aria-labelledby="vip-expansion-title">
      <img src={`/api/vip-media?asset=${expansion.keyArt}`} alt={`Key art di ${expansion.game}: ${expansion.title}`} decoding="async" fetchPriority="high" onError={showVipMediaFallback} />
      <div className="vip-hero-shade" aria-hidden="true" />
      <div className="shell vip-expansion-hero-copy">
        <p className="eyebrow">Area VIP · Anteprima Games</p>
        <span className="vip-member-badge">Pass {member.plan} attivo</span>
        <h1 id="vip-expansion-title"><small>{expansion.game}</small>{expansion.title}</h1>
        <p>{expansion.teaser}</p>
        <a href="#dossier-rogo">Apri il dossier <span aria-hidden="true">↓</span></a>
      </div>
    </section>

    <nav className="vip-expansion-index" aria-label="Indice del dossier VIP">
      <div className="shell">
        <a href="#corte"><span>01</span>La Corte</a>
        <a href="#vharokh"><span>02</span>Vharokh</a>
        <a href="#velisara"><span>03</span>Velisara</a>
        <a href="#sviluppo"><span>04</span>Sviluppo</a>
      </div>
    </nav>

    <section className="vip-expansion-intro shell" id="dossier-rogo" aria-labelledby="vip-intro-title">
      <div>
        <p className="eyebrow">Primo VIP Drop · senza spoiler</p>
        <h2 id="vip-intro-title">Le Dieci Porte stanno per aprirsi.</h2>
      </div>
      <p>{expansion.introduction}</p>
    </section>

    <section className="vip-pass-value" aria-labelledby="vip-pass-value-title">
      <div className="shell">
        <header>
          <p className="eyebrow">Cosa include questo drop</p>
          <h2 id="vip-pass-value-title">Contenuti che non trovi nell’area pubblica.</h2>
        </header>
        <div className="vip-privilege-grid">
          {expansion.privileges.map((privilege, index) => <article key={privilege.label}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <p>{privilege.label}</p>
            <h3>{privilege.value}</h3>
            <small>{privilege.detail}</small>
          </article>)}
        </div>
      </div>
    </section>

    <section className="vip-faction" id="corte" aria-labelledby="vip-faction-title">
      <div className="vip-ten-gates" aria-hidden="true">
        {Array.from({ length: 10 }, (_, index) => <i key={index} />)}
      </div>
      <div className="shell">
        <span>Nuova fazione</span>
        <h2 id="vip-faction-title">{expansion.faction.name}</h2>
        <p>{expansion.faction.description}</p>
      </div>
    </section>

    <section className="vip-character-files shell" aria-label="Personaggi annunciati">
      {expansion.characters.map((character, index) => <article className={`vip-character vip-character-${index === 0 ? "vharokh" : "velisara"}`} id={index === 0 ? "vharokh" : "velisara"} key={character.code}>
        <div className="vip-character-figure">
          <img src={`/api/vip-media?asset=${character.image}`} alt={`${character.name}, ${character.title}`} loading="lazy" decoding="async" onError={showVipMediaFallback} />
        </div>
        <div className="vip-character-copy">
          <p className="eyebrow">Dossier {String(index + 1).padStart(2, "0")} · {character.code}</p>
          <h2>{character.name}</h2>
          <h3>{character.title}</h3>
          <strong>{character.role}</strong>
          <p>{character.description}</p>
          {member.collectorDossiers ? <>
            <p>{character.threat}</p>
            <ul aria-label={`Segni distintivi di ${character.name}`}>
              {character.traits.map((trait) => <li key={trait}>{trait}</li>)}
            </ul>
          </> : <p className="vip-collector-lock"><strong>Approfondimento Collector</strong> Minaccia, segni distintivi e note estese restano nel dossier Collector.</p>}
        </div>
      </article>)}
    </section>

    <section className="vip-development" id="sviluppo" aria-labelledby="vip-development-title">
      <div className="shell">
        <header>
          <div>
            <p className="eyebrow">Contenuti previsti</p>
            <h2 id="vip-development-title">Il progetto, prima dell’annuncio pubblico.</h2>
          </div>
          <aside><span>{expansion.status}</span><strong>{expansion.release}</strong></aside>
        </header>
        <ol>{expansion.features.map((feature, index) => <li key={feature}><span>{String(index + 1).padStart(2, "0")}</span><p>{feature}</p></li>)}</ol>
        <p className="vip-development-note">Questa anteprima descrive una direzione creativa in sviluppo. Contenuti e meccaniche potranno cambiare durante produzione e bilanciamento.</p>
      </div>
    </section>

    <section className="vip-drop-register" aria-labelledby="vip-register-title">
      <div className="shell">
        <header><p className="eyebrow">Registro VIP</p><h2 id="vip-register-title">Segui l’evoluzione del Rogo.</h2></header>
        <div>
          {expansion.archiveUpdates.map((update, index) => <article key={update.title}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <p>{update.state}</p>
            <h3>{update.title}</h3>
            <small>{update.detail}</small>
          </article>)}
        </div>
      </div>
    </section>
    </div> : null}

    {activeGame === "demon-match-three" ? <section className="vip-demon-match" id="vip-demon-match" role="tabpanel" aria-labelledby="vip-demon-match-title">
      <header className="vip-demon-match-hero">
        <div className="vip-demon-match-art"><img src={`/api/vip-media?asset=${encodeURIComponent(demonMatch.image)}`} alt={demonMatch.imageAlt} decoding="async" fetchPriority="high" onError={showVipMediaFallback} /></div>
        <div className="vip-demon-match-copy">
          <p className="eyebrow">{demonMatch.eyebrow}</p>
          <span>{demonMatch.status}</span>
          <h2 id="vip-demon-match-title">{demonMatch.title}</h2>
          <h3>{demonMatch.subtitle}</h3>
          <p>{demonMatch.introduction}</p>
          <dl><div><dt>Piattaforma</dt><dd>{demonMatch.platform}</dd></div><div><dt>Rivelazione</dt><dd>Due protagonisti · due fazioni</dd></div></dl>
          <small>{demonMatch.spoilerNote}</small>
        </div>
      </header>
      <div className="shell vip-demon-match-dossiers" aria-label="Protagonisti svelati">
        {demonMatch.characters.map((character) => <article className={`is-${character.tone}`} key={character.name}>
          <figure><img src={`/api/vip-media?asset=${encodeURIComponent(character.image)}`} alt={character.imageAlt} loading="lazy" decoding="async" onError={showVipMediaFallback} /></figure>
          <div><span>{character.faction}</span><h3>{character.name}</h3><strong>{character.role}</strong><p>{character.text}</p></div>
        </article>)}
      </div>
      <section className="vip-demon-match-development" aria-labelledby="vip-demon-development-title">
        <div className="shell">
          <div><p className="eyebrow">Sviluppo mobile</p><h3 id="vip-demon-development-title">Il nuovo Demon Match Three nasce per Android.</h3><p>La nuova versione viene costruita come esperienza nativa per schermi verticali, controlli touch e sessioni leggibili sia su smartphone sia su tablet.</p></div>
          <ol>{demonMatch.development.map((item, index) => <li key={item}><span>{String(index + 1).padStart(2, "0")}</span><p>{item}</p></li>)}</ol>
        </div>
      </section>
      <footer className="shell vip-demon-match-demo">
        <div><span>{demonMatch.demo.label}</span><h3>{demonMatch.demo.title}</h3><p>{demonMatch.demo.text}</p></div>
        <Link href="/giochi/demon-match-three">Apri la scheda aggiornata <span aria-hidden="true">→</span></Link>
      </footer>
    </section> : null}
    </> : null}
  </>;
}
