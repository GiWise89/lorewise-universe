"use client";

/* eslint-disable @next/next/no-img-element -- Native images preserve exact pixel-art rendering. */

import Image from "next/image";
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { NexusFamiliarState } from "@/lib/nexusFamiliar";
import { FAMILIAR_LEVEL_BENEFITS, familiarLevelDiscount } from "@/lib/nexusFamiliarBenefits";
import { FAMILIAR_MILESTONES, MAX_FAMILIAR_LEVEL, familiarExperienceForLevel, familiarNextMilestone } from "@/lib/nexusFamiliarProgression";
import {
  dominantFamiliarPersonality,
  FAMILIAR_DISCOVERIES,
  FAMILIAR_MEMORIES,
  FAMILIAR_PERSONALITIES,
  FAMILIAR_PERSONALITY_KEYS,
  FAMILIAR_POSTCARDS,
} from "@/lib/nexusFamiliarLegacy";
import styles from "./NexusFamiliarLegacy.module.css";
import { familiarSpeciesProfile } from "@/lib/nexusFamiliarSpecies";

export type LegacyView = "diary" | "personality" | "discoveries" | "rewards";

const LEGACY_VIEWS: Array<{ id: LegacyView; label: string; eyebrow: string; icon: string }> = [
  { id: "diary", label: "Diario", eyebrow: "Ricordi", icon: "/famiglio/legacy/navigation/diario-v1.png" },
  { id: "personality", label: "Personalità", eyebrow: "Legame", icon: "/famiglio/legacy/navigation/personalita-v1.png" },
  { id: "discoveries", label: "Scoperte", eyebrow: "Album", icon: "/famiglio/legacy/navigation/scoperte-v1.png" },
  { id: "rewards", label: "Ricompense", eyebrow: "Centro Nexus", icon: "/famiglio/navigation/missioni-v1.webp" },
];

function formatMemoryDate(value: string) {
  return new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

export function NexusFamiliarLegacy({ state, familiarFamily, familiarSprite, familiarGroundStyle, initialView = "diary" }: { state: NexusFamiliarState; familiarFamily: string; familiarSprite: ReactNode; familiarGroundStyle?: CSSProperties; initialView?: LegacyView }) {
  const [view, setView] = useState<LegacyView>(initialView);
  const [selectedPostcardId, setSelectedPostcardId] = useState(state.legacy.postcards.at(-1)?.id ?? FAMILIAR_POSTCARDS[0].id);
  const [discoveryDetailsOpen, setDiscoveryDetailsOpen] = useState(false);
  const [openMemoryIndex, setOpenMemoryIndex] = useState<number | null>(null);
  const dominantKey = dominantFamiliarPersonality(state.legacy);
  const dominant = FAMILIAR_PERSONALITIES[dominantKey];
  const unlockedMemories = useMemo(() => state.legacy.memories.map((entry) => ({
    ...entry,
    definition: FAMILIAR_MEMORIES.find((memory) => memory.id === entry.id),
  })).filter((entry) => entry.definition), [state.legacy.memories]);
  const foundDiscoveries = useMemo(() => state.legacy.discoveries.map((entry) => ({
    ...entry,
    definition: FAMILIAR_DISCOVERIES.find((discovery) => discovery.id === entry.id),
  })).filter((entry) => entry.definition), [state.legacy.discoveries]);
  const selectedPostcard = FAMILIAR_POSTCARDS.find((postcard) => postcard.id === selectedPostcardId) ?? FAMILIAR_POSTCARDS[0];
  const selectedPostcardUnlocked = state.legacy.postcards.some((postcard) => postcard.id === selectedPostcard.id);
  const selectedDiscoveries = FAMILIAR_DISCOVERIES.filter((discovery) => discovery.destinationId === selectedPostcard.destinationId);
  const selectedDiscoveriesFound = selectedDiscoveries.filter((discovery) => foundDiscoveries.some((entry) => entry.id === discovery.id)).length;
  const selectedMemory = openMemoryIndex === null ? null : unlockedMemories[openMemoryIndex] ?? null;
  const nextMilestone = familiarNextMilestone(state.level);
  const currentLevelAt = familiarExperienceForLevel(state.level);
  const nextLevelAt = familiarExperienceForLevel(Math.min(MAX_FAMILIAR_LEVEL, state.level + 1));
  const levelProgress = state.level === MAX_FAMILIAR_LEVEL ? 100 : Math.min(100, Math.round((state.experience - currentLevelAt) / Math.max(1, nextLevelAt - currentLevelAt) * 100));
  const currentDiscount = familiarLevelDiscount(state.level, "commissioni");

  useEffect(() => {
    if (openMemoryIndex === null) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenMemoryIndex(null);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [openMemoryIndex]);

  useEffect(() => {
    if (!discoveryDetailsOpen) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDiscoveryDetailsOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [discoveryDetailsOpen]);

  return (
    <section className={styles.legacy} aria-label="Diario, personalità e scoperte del Famiglio">
      <header className={styles.legacyHeader}>
        <div><span>IL VOSTRO LEGAME</span><h2>Ogni giorno diventa una storia.</h2></div>
        <p>{unlockedMemories.length} ricordi · {foundDiscoveries.length} reperti · {state.legacy.postcards.length} cartoline</p>
      </header>
      <nav className={styles.legacyTabs} aria-label="Sezioni del legame" data-tutorial-target="legacy-tabs">
        {LEGACY_VIEWS.map((entry) => <button key={entry.id} type="button" aria-pressed={view === entry.id} onClick={() => setView(entry.id)}>
          <img src={entry.icon} alt="" width={48} height={48} /><span><small>{entry.eyebrow}</small><strong>{entry.label}</strong></span>
        </button>)}
      </nav>

      {view === "diary" ? <div className={`${styles.legacyScene} ${styles.diaryScene}`} data-tutorial-target="legacy-content">
        <Image src="/famiglio/legacy/scenes/diario-v2.png" alt="Diario illustrato dei ricordi del Famiglio, aperto sulla scritta Apri le pagine" fill sizes="(max-width: 640px) 100vw, 75vw" />
        <button
          type="button"
          className={styles.diaryPageLauncher}
          disabled={!unlockedMemories.length}
          onClick={() => setOpenMemoryIndex(Math.max(0, unlockedMemories.length - 1))}
          aria-label={unlockedMemories.length ? `Apri il diario di ${state.name}` : "Il diario non contiene ancora ricordi"}
        />
      </div> : null}

      {view === "personality" ? <div className={`${styles.legacyScene} ${styles.personalityScene}`} data-tutorial-target="legacy-content">
        <Image src="/famiglio/legacy/scenes/personalita-v1.png" alt="Osservatorio illustrato della personalità del Famiglio" fill sizes="(max-width: 640px) 100vw, 75vw" />
        <div className={styles.personalityCopy}><span>INDOLE EMERGENTE</span><h3>{dominant.label}</h3><p>{dominant.description}</p><small>{familiarSpeciesProfile(familiarFamily).preference} La personalità nasce dalle azioni reali e continua a evolversi.</small></div>
        <div className={styles.personalityPet} data-family={familiarFamily} style={familiarGroundStyle}>{familiarSprite}</div>
        <div className={styles.traitOrbit}>
          {FAMILIAR_PERSONALITY_KEYS.map((key) => {
            const trait = FAMILIAR_PERSONALITIES[key];
            const max = Math.max(1, ...Object.values(state.legacy.personality));
            const strength = Math.max(18, Math.round(state.legacy.personality[key] / max * 100));
            return <div key={key} data-active={key === dominantKey}>
              <img src={trait.icon} alt="" width={42} height={42} /><span><strong>{trait.label}</strong><i><b style={{ width: `${strength}%` }} /></i></span>
            </div>;
          })}
        </div>
      </div> : null}

      {view === "discoveries" ? <div className={`${styles.legacyScene} ${styles.discoveryScene}`} data-tutorial-target="legacy-content">
        <div className={styles.discoveryCanvas}>
          <Image src="/famiglio/legacy/scenes/scoperte-v2.png" alt="Atlante delle Scoperte con i portali Sentiero, Giardino e Varco" fill sizes="(max-width: 640px) 100vw, 75vw" />
          <nav className={styles.discoveryPortals} aria-label="Percorsi dell'Atlante delle Scoperte">{FAMILIAR_POSTCARDS.map((postcard) => {
              const foundForRoute = FAMILIAR_DISCOVERIES.filter((discovery) => discovery.destinationId === postcard.destinationId && foundDiscoveries.some((entry) => entry.id === discovery.id)).length;
              return <button type="button" key={postcard.id} aria-label={`Apri ${postcard.title}: ${foundForRoute} di 2 reperti trovati`} onClick={() => { setSelectedPostcardId(postcard.id); setDiscoveryDetailsOpen(true); }} />;
            })}</nav>
        </div>
      </div> : null}

      {view === "rewards" ? <div className={`${styles.legacyScene} ${styles.rewardsScene}`} data-tutorial-target="legacy-content">
        <Image src="/famiglio/legacy/scenes/personalita-v1.png" alt="Sala illustrata delle ricompense del Famiglio" fill sizes="(max-width: 640px) 100vw, 75vw" />
        <div className={styles.rewardsShade} />
        <header className={styles.rewardsHero}>
          <span>CENTRO RICOMPENSE NEXUS</span>
          <h3>Ogni cura lascia un vantaggio reale.</h3>
          <p>Qui trovi crescita, monete, premi ottenuti e sconti del vostro legame.</p>
        </header>
        <section className={styles.rewardStatus} aria-label="Stato delle ricompense">
          <article><img src="/famiglio/legacy/navigation/legame-v1.png" alt="" /><span><small>Livello attuale</small><strong>{state.level} / {MAX_FAMILIAR_LEVEL}</strong></span></article>
          <article><img src="/famiglio/navigation/shop-v1.webp" alt="" /><span><small>Monete disponibili</small><strong>{state.nexusCoins}</strong></span></article>
          <article><img src="/famiglio/legacy/navigation/personalita-v1.png" alt="" /><span><small>Sconto Famiglio</small><strong>{currentDiscount ? `${currentDiscount}%` : "Da sbloccare"}</strong></span></article>
        </section>
        <section className={styles.rewardNext} aria-label="Prossimo vantaggio">
          <div><span>PROSSIMO VANTAGGIO</span><h4>{nextMilestone ? `Livello ${nextMilestone.level} · ${nextMilestone.title}` : "Custode leggendario"}</h4><p>{nextMilestone ? nextMilestone.benefit : "Hai raggiunto il massimo livello del legame."}</p></div>
          <strong>{state.level === MAX_FAMILIAR_LEVEL ? "MAX" : `${state.experience} / ${nextLevelAt} PE`}</strong>
          <i role="progressbar" aria-label="Progresso verso il prossimo livello" aria-valuemin={0} aria-valuemax={100} aria-valuenow={levelProgress}><b style={{ width: `${levelProgress}%` }} /></i>
        </section>
        <section className={styles.rewardTimeline} aria-label="Traguardi e premi del Famiglio">
          {FAMILIAR_MILESTONES.map((milestone) => {
            const unlocked = state.level >= milestone.level;
            const granted = state.claimedMilestoneLevels.includes(milestone.level);
            const discount = FAMILIAR_LEVEL_BENEFITS.find((entry) => entry.level === milestone.level)?.discountPercent ?? 0;
            return <article key={milestone.level} data-unlocked={unlocked}>
              <strong>{milestone.level}</strong><span><b>{milestone.title}</b><small>{milestone.rewardLabel}{discount ? ` · sconto ${discount}%` : ""}</small></span><em>{granted ? "Ottenuto" : unlocked ? "Disponibile" : `Livello ${milestone.level}`}</em>
            </article>;
          })}
        </section>
      </div> : null}

      {selectedMemory ? createPortal(<div className={styles.diaryReaderBackdrop} role="presentation" onMouseDown={() => setOpenMemoryIndex(null)}>
        <article className={styles.diaryReader} role="dialog" aria-modal="true" aria-labelledby="diary-reader-title" onMouseDown={(event) => event.stopPropagation()}>
          <picture>
            <source media="(max-width: 640px)" srcSet="/famiglio/legacy/pages/pergamena-diario-portrait-v1.png" />
            <img className={styles.diaryReaderParchment} src="/famiglio/legacy/pages/pergamena-diario-landscape-v1.png" alt="" />
          </picture>
          <button type="button" className={styles.diaryReaderClose} onClick={() => setOpenMemoryIndex(null)} aria-label="Chiudi il diario">&times;</button>
          <div className={styles.diaryReaderCopy}>
            <span>PAGINA {String((openMemoryIndex ?? 0) + 1).padStart(2, "0")}</span>
            <p>DIARIO DI {state.name.toUpperCase()}</p>
            <h3 id="diary-reader-title">{selectedMemory.definition?.title}</h3>
            <blockquote>{selectedMemory.definition?.caption}</blockquote>
            <time dateTime={selectedMemory.unlockedAt}>{formatMemoryDate(selectedMemory.unlockedAt)}</time>
          </div>
          <nav className={styles.diaryReaderNavigation} aria-label="Pagine del diario">
            <button type="button" disabled={openMemoryIndex === 0} onClick={() => setOpenMemoryIndex((current) => current === null ? 0 : Math.max(0, current - 1))}>Pagina precedente</button>
            <span>{(openMemoryIndex ?? 0) + 1} / {unlockedMemories.length}</span>
            <button type="button" disabled={openMemoryIndex === unlockedMemories.length - 1} onClick={() => setOpenMemoryIndex((current) => current === null ? 0 : Math.min(unlockedMemories.length - 1, current + 1))}>Pagina successiva</button>
          </nav>
        </article>
      </div>, document.body) : null}

      {discoveryDetailsOpen ? createPortal(<div className={styles.discoveryBackdrop} role="presentation" onMouseDown={() => setDiscoveryDetailsOpen(false)}>
        <section className={styles.discoveryDetails} role="dialog" aria-modal="true" aria-labelledby="discovery-details-title" onMouseDown={(event) => event.stopPropagation()}>
          <button type="button" className={styles.discoveryDetailsClose} onClick={() => setDiscoveryDetailsOpen(false)} aria-label="Chiudi il percorso">&times;</button>
          <header>
            <span>ATLANTE DELLE SCOPERTE</span>
            <h3 id="discovery-details-title">{selectedPostcard.title}</h3>
            <p>{selectedDiscoveriesFound} di {selectedDiscoveries.length} reperti trovati</p>
            <i role="progressbar" aria-label={`Progresso di ${selectedPostcard.title}`} aria-valuemin={0} aria-valuemax={selectedDiscoveries.length} aria-valuenow={selectedDiscoveriesFound}><b style={{ width: `${selectedDiscoveriesFound / selectedDiscoveries.length * 100}%` }} /></i>
          </header>
          <div className={styles.discoveryItems}>
            {selectedDiscoveries.map((discovery) => {
              const found = foundDiscoveries.some((entry) => entry.id === discovery.id);
              return <article key={discovery.id} data-found={found}>
                <img src={found ? discovery.icon : "/famiglio/legacy/discoveries/sconosciuto-v1.png"} alt="" />
                <span><small>{found ? discovery.rarity : "DA SCOPRIRE"}</small><strong>{found ? discovery.name : "Tesoro sconosciuto"}</strong><p>{found ? discovery.description : `Puoi trovarlo durante un'uscita verso ${selectedPostcard.title}.`}</p></span>
              </article>;
            })}
          </div>
          <div className={styles.discoveryPostcard} data-locked={!selectedPostcardUnlocked}>
            <Image src={selectedPostcard.image} alt={selectedPostcardUnlocked ? `Cartolina illustrata: ${selectedPostcard.title}` : "Cartolina ancora da completare"} fill sizes="(max-width: 640px) 88vw, 38vw" />
            <span>{selectedPostcardUnlocked ? selectedPostcard.message : "Trova entrambi i reperti per completare questa cartolina."}</span>
          </div>
        </section>
      </div>, document.body) : null}
    </section>
  );
}
