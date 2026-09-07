"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { familiarMood, FAMILIAR_MOODS } from "@/lib/famiglioHome";
import { FAMILIAR_COLLECTION, familiarAnimatedPreview } from "@/lib/famiglioMarketExpansion";
import { STARTER_EGGS, type StarterEgg } from "@/lib/famiglioRebuild";
import { FAMILIAR_SPRITE_ROSTER } from "@/lib/famiglioSpriteRoster";
import styles from "./NexusPetNavigationPip.module.css";

const SAVE_KEY = "lorewise.famiglio-rebuild.v1";

type PipHouse = {
  rebuild?: { stage?: string; selectedId?: string | null; familiarName?: string; colorVariant?: string | null };
  home?: { needs?: Record<string, number>; growth?: { stage?: string; bondXp?: number } };
  activeFamiliarId?: string | null;
};

type PipSave = { houses?: Array<PipHouse | null>; activeHouseIndex?: number } & PipHouse;

function activeHouse(value: unknown): PipHouse | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const save = value as PipSave;
  const index = Number.isInteger(save.activeHouseIndex) ? Math.max(0, Math.min(2, Number(save.activeHouseIndex))) : 0;
  return save.houses?.[index] ?? save.houses?.find(Boolean) ?? (save.rebuild ? save : null);
}

function readableStage(stage?: string) {
  return stage === "adulto" ? "Adulto" : stage === "giovane" ? "Giovane" : "Cucciolo";
}

function StarterPipSprite({ egg, colorVariant }: { egg: StarterEgg; colorVariant?: string | null }) {
  const sequence = FAMILIAR_SPRITE_ROSTER[egg.id].actions.idle;
  const variant = colorVariant && ["cat", "rabbit", "parrot"].includes(egg.id) ? `-${colorVariant}` : "";
  const source = variant ? `/famiglio/rebuild/starters/${egg.id}/idle${variant}.png` : sequence.src;
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setFrame((current) => (current + 1) % sequence.frames), Math.max(120, 1000 / sequence.fps));
    return () => window.clearInterval(timer);
  }, [sequence.fps, sequence.frames]);

  return <span className={styles.spriteFrame} style={{ backgroundImage: `url(${source})`, backgroundSize: `${sequence.frames * 100}% 100%`, backgroundPosition: `${sequence.frames <= 1 ? 0 : frame / (sequence.frames - 1) * 100}% 0` }} aria-label={egg.familiar} role="img" />;
}

export function NexusPetNavigationPip() {
  const pathname = usePathname();
  const [house, setHouse] = useState<PipHouse | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const readLocal = () => {
      try {
        const stored = window.localStorage.getItem(SAVE_KEY);
        if (stored) setHouse(activeHouse(JSON.parse(stored)));
      } catch { /* Nessun Famiglio locale disponibile. */ }
    };
    readLocal();
    const sync = () => readLocal();
    window.addEventListener("storage", sync);
    window.addEventListener("lorewise:famiglio-rebuild-updated", sync);
    void fetch("/api/famiglio/rebuild", { credentials: "same-origin", cache: "no-store" })
      .then(async (response) => response.ok ? response.json() as Promise<{ save?: unknown }> : null)
      .then((payload) => { if (!cancelled && payload?.save) setHouse(activeHouse(payload.save)); })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      window.removeEventListener("storage", sync);
      window.removeEventListener("lorewise:famiglio-rebuild-updated", sync);
    };
  }, []);

  const data = useMemo(() => {
    const stage = house?.rebuild?.stage;
    if (!house || (stage !== "home" && stage !== "hatched")) return null;
    const activeId = house.activeFamiliarId ?? house.rebuild?.selectedId;
    const collection = FAMILIAR_COLLECTION.find((entry) => entry.id === activeId) ?? null;
    const starter = STARTER_EGGS.find((entry) => entry.id === activeId) ?? null;
    if (!activeId || (!collection && !starter)) return null;
    const chosenName = activeId === house.rebuild?.selectedId ? house.rebuild?.familiarName?.trim() : "";
    const needs = house.home?.needs;
    const moodId = needs && ["hunger", "energy", "happiness", "hygiene", "affection"].every((key) => Number.isFinite(needs[key]))
      ? familiarMood(needs as Parameters<typeof familiarMood>[0])
      : "content";
    return {
      activeId,
      collection,
      starter,
      name: chosenName || collection?.name || starter?.familiar || "Famiglio",
      mood: FAMILIAR_MOODS[moodId],
      stage: readableStage(house.home?.growth?.stage),
      bondXp: Math.max(0, Math.floor(Number(house.home?.growth?.bondXp) || 0)),
      colorVariant: activeId === house.rebuild?.selectedId ? house.rebuild?.colorVariant : null,
    };
  }, [house]);

  if (!data || pathname.startsWith("/famiglio")) return null;

  return (
    <aside className={styles.pip} data-open={open} aria-label={`PiP del Famiglio ${data.name}`}>
      {open ? (
        <section className={styles.card}>
          <header>
            <span><small>Compagno in viaggio</small><strong>{data.name}</strong></span>
            <button type="button" onClick={() => setOpen(false)} aria-label="Riduci il PiP del Famiglio">−</button>
          </header>
          <div className={styles.companion}>
            {data.starter ? <StarterPipSprite egg={data.starter} colorVariant={data.colorVariant} /> : data.collection ? <Image src={familiarAnimatedPreview(data.collection)} alt={data.collection.name} width={160} height={160} unoptimized /> : null}
            <p><b>{data.mood.icon} {data.mood.label}</b><span>{data.stage} · {data.bondXp} PE Legame</span></p>
          </div>
          <Link href="/famiglio">Torna alla Casa <span aria-hidden="true">→</span></Link>
        </section>
      ) : (
        <button className={styles.trigger} type="button" onClick={() => setOpen(true)} aria-label={`Apri il PiP di ${data.name}`}>
          <Image src="/famiglio/rebuild/nexus-pet-emblem-v2.png" alt="" width={64} height={64} unoptimized />
          <span>{data.starter ? <StarterPipSprite egg={data.starter} colorVariant={data.colorVariant} /> : data.collection ? <Image src={familiarAnimatedPreview(data.collection)} alt="" width={96} height={96} unoptimized /> : null}</span>
          <b>{data.name}</b>
        </button>
      )}
    </aside>
  );
}
