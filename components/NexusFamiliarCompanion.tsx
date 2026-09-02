"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { applyFamiliarTimePassage, familiarCondition, type NexusFamiliarState } from "@/lib/nexusFamiliar";
import { familiarAppearance, type FamiliarBehavior, type FamiliarBehaviorName } from "@/lib/nexusFamiliarCatalog";
import { familiarAppearanceWithGadget } from "@/lib/nexusFamiliarGadgets";
import { sanitizeFamiliarCloudState } from "@/lib/nexusFamiliarCloud";
import { FAMILIAR_NOTIFICATIONS_STORAGE_KEY, FAMILIAR_PIP_EVENT, familiarPipModeForViewport, familiarReactionForPath, familiarSmartAlerts, type FamiliarPipMode, type FamiliarReaction, type FamiliarSmartAlert } from "@/lib/nexusFamiliarEngagement";
import { FAMILIAR_STORAGE_KEY } from "@/lib/nexusFamiliarOnboarding";
import styles from "./NexusFamiliarCompanion.module.css";

type SpriteStyle = CSSProperties & Record<"--pip-sprite" | "--pip-columns" | "--pip-rows" | "--pip-row" | "--pip-frame", string>;
const PIP_MODE_KEY = "lorewise:nexus-familiar:pip-mode:v1";
const PIP_ALERT_KEYS = "lorewise:nexus-familiar:smart-alerts:v2";
const PIP_ROUTE_REACTIONS = "lorewise:nexus-familiar:route-reactions:v1";

function AnimatedPipSprite({ sequence, label }: { sequence: FamiliarBehavior; label: string }) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    if (sequence.frames <= 1) return;
    const timer = window.setInterval(() => setFrame((current) => (current + 1) % sequence.frames), 190);
    return () => window.clearInterval(timer);
  }, [sequence]);
  const style: SpriteStyle = {
    "--pip-sprite": `url("${sequence.spritePath}")`,
    "--pip-columns": String(sequence.columns),
    "--pip-rows": String(sequence.rows),
    "--pip-row": String(sequence.row),
    "--pip-frame": String(frame),
  };
  return <span className={styles.sprite} style={style} role="img" aria-label={label} />;
}

function readKeyArchive(key: string, storage: Storage) {
  try {
    const parsed = JSON.parse(storage.getItem(key) ?? "[]") as unknown;
    return new Set(Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === "string").slice(-30) : []);
  } catch { return new Set<string>(); }
}

function rememberKey(key: string, archiveKey: string, storage: Storage) {
  const keys = readKeyArchive(archiveKey, storage);
  keys.add(key);
  try { storage.setItem(archiveKey, JSON.stringify([...keys].slice(-30))); } catch { /* Preferenza valida per la sessione. */ }
}

export function NexusFamiliarCompanion() {
  const pathname = usePathname();
  const [familiar, setFamiliar] = useState<NexusFamiliarState | null>(null);
  const [mode, setMode] = useState<FamiliarPipMode>("open");
  const [adoptionPrompt, setAdoptionPrompt] = useState(false);
  const [reaction, setReaction] = useState<FamiliarReaction | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    const read = () => {
      try {
        const raw = window.localStorage.getItem(FAMILIAR_STORAGE_KEY);
        if (!raw) return setFamiliar(null);
        const checked = sanitizeFamiliarCloudState(JSON.parse(raw));
        setFamiliar(checked.ok ? applyFamiliarTimePassage(checked.state) : null);
      } catch { setFamiliar(null); }
    };
    const readPreferences = () => setNotificationsEnabled(window.localStorage.getItem(FAMILIAR_NOTIFICATIONS_STORAGE_KEY) !== "off");
    try {
      const savedMode = window.localStorage.getItem(PIP_MODE_KEY);
      const compactViewport = window.matchMedia("(max-width: 720px)").matches;
      window.setTimeout(() => setMode(familiarPipModeForViewport(savedMode, compactViewport)), 0);
    } catch { /* La preferenza resta solo per la sessione corrente. */ }
    read(); readPreferences();
    const timer = window.setInterval(read, 60_000);
    window.addEventListener("storage", read);
    window.addEventListener("storage", readPreferences);
    window.addEventListener("lorewise:familiar-updated", read);
    window.addEventListener("lorewise:familiar-notifications-changed", readPreferences);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("storage", read);
      window.removeEventListener("storage", readPreferences);
      window.removeEventListener("lorewise:familiar-updated", read);
      window.removeEventListener("lorewise:familiar-notifications-changed", readPreferences);
    };
  }, []);

  useEffect(() => { try { window.localStorage.setItem(PIP_MODE_KEY, mode); } catch { /* Archiviazione non disponibile. */ } }, [mode]);

  useEffect(() => {
    const receive = (event: Event) => {
      const detail = (event as CustomEvent<FamiliarReaction>).detail;
      if (detail?.message) setReaction(detail);
    };
    window.addEventListener(FAMILIAR_PIP_EVENT, receive);
    return () => window.removeEventListener(FAMILIAR_PIP_EVENT, receive);
  }, []);

  useEffect(() => {
    if (!reaction) return;
    const timer = window.setTimeout(() => setReaction(null), 5200);
    return () => window.clearTimeout(timer);
  }, [reaction]);

  useEffect(() => {
    if (!familiar || pathname === "/famiglio") return;
    const routeReaction = familiarReactionForPath(pathname, familiar.name);
    if (!routeReaction) return;
    const key = `${familiar.familiarId}:${pathname}`;
    if (readKeyArchive(PIP_ROUTE_REACTIONS, window.sessionStorage).has(key)) return;
    rememberKey(key, PIP_ROUTE_REACTIONS, window.sessionStorage);
    const timer = window.setTimeout(() => setReaction(routeReaction), 700);
    return () => window.clearTimeout(timer);
  }, [familiar, pathname]);

  useEffect(() => {
    if (!familiar || !notificationsEnabled) return;
    const deliver = (alert: FamiliarSmartAlert) => {
      if (readKeyArchive(PIP_ALERT_KEYS, window.localStorage).has(alert.key)) return false;
      rememberKey(alert.key, PIP_ALERT_KEYS, window.localStorage);
      setReaction(alert.reaction);
      if (typeof Notification !== "undefined" && Notification.permission === "granted") new Notification(alert.title, { body: alert.message, icon: "/famiglio/navigation/tana-v1.webp", tag: alert.key });
      return true;
    };
    const check = () => familiarSmartAlerts(applyFamiliarTimePassage(familiar)).some(deliver);
    check();
    const timer = window.setInterval(check, 60_000);
    return () => window.clearInterval(timer);
  }, [familiar, notificationsEnabled]);

  useEffect(() => {
    if (!familiar || !notificationsEnabled || pathname === "/famiglio") return;
    const controller = new AbortController();
    const checkMissionRewards = async () => {
      try {
        const response = await fetch("/api/famiglio/missions", { cache: "no-store", credentials: "same-origin", signal: controller.signal });
        if (!response.ok) return;
        const payload = await response.json() as { date?: unknown; missions?: Array<{ complete?: unknown; claimed?: unknown }> };
        if (!payload.missions?.some((mission) => mission.complete === true && mission.claimed !== true)) return;
        const key = `${String(payload.date ?? new Date().toISOString().slice(0, 10))}:${familiar.familiarId}:mission-reward`;
        if (readKeyArchive(PIP_ALERT_KEYS, window.localStorage).has(key)) return;
        rememberKey(key, PIP_ALERT_KEYS, window.localStorage);
        const next = { kind: "reward", title: "Ricompensa pronta", message: "Una missione completata aspetta di essere riscattata.", behavior: "sit" } satisfies FamiliarReaction;
        setReaction(next);
        if (typeof Notification !== "undefined" && Notification.permission === "granted") new Notification(next.title, { body: next.message, icon: "/famiglio/navigation/missioni-v1.webp", tag: key });
      } catch { /* Gli avvisi non interrompono la navigazione. */ }
    };
    void checkMissionRewards();
    const timer = window.setInterval(() => void checkMissionRewards(), 5 * 60_000);
    return () => { controller.abort(); window.clearInterval(timer); };
  }, [familiar, notificationsEnabled, pathname]);

  useEffect(() => {
    if (familiar || pathname === "/famiglio" || window.sessionStorage.getItem("lorewise:familiar-adoption-later")) return;
    const controller = new AbortController();
    void fetch("/api/famiglio", { cache: "no-store", credentials: "same-origin", signal: controller.signal }).then(async (response) => {
      if (!response.ok) return;
      const payload = await response.json() as { familiar?: unknown };
      if (payload.familiar) {
        const checked = sanitizeFamiliarCloudState(payload.familiar);
        if (checked.ok) {
          window.localStorage.setItem(FAMILIAR_STORAGE_KEY, JSON.stringify(checked.state));
          setFamiliar(applyFamiliarTimePassage(checked.state));
          return;
        }
      }
      setAdoptionPrompt(true);
    }).catch(() => undefined);
    return () => controller.abort();
  }, [familiar, pathname]);

  const appearanceId = familiar?.appearanceId;
  const appearance = useMemo(() => appearanceId ? familiarAppearance(appearanceId) : null, [appearanceId]);
  const dressedAppearance = useMemo(() => appearance && familiar ? familiarAppearanceWithGadget(appearance, familiar.den.equippedGadget) : null, [appearance, familiar]);
  if (pathname === "/famiglio") return null;

  if (adoptionPrompt && !familiar) return <aside className={styles.adoption} role="dialog" aria-labelledby="familiar-adoption-title">
    <Image src="/famiglio/navigation/tana-v1.webp" alt="" width={72} height={72} />
    <div><span>UN NUOVO LEGAME</span><strong id="familiar-adoption-title">Il Nexus ha un compagno per te.</strong><p>Scegli ora il tuo Famiglio oppure fallo più tardi, senza perdere l&apos;accesso al sito.</p></div>
    <Link href="/famiglio">Scegli il Famiglio</Link>
    <button type="button" onClick={() => { window.sessionStorage.setItem("lorewise:familiar-adoption-later", "1"); setAdoptionPrompt(false); }}>Più tardi</button>
  </aside>;

  if (!familiar || !dressedAppearance) return null;
  if (mode === "closed") return <button className={styles.closed} type="button" onClick={() => setMode("open")} aria-label={`Apri la finestra di ${familiar.name}`}><Image src="/famiglio/navigation/tana-v1.webp" alt="" width={48} height={48} /></button>;
  if (mode === "minimized") return <button className={styles.minimized} type="button" onClick={() => setMode("open")}><span className={styles.dot} data-condition={familiarCondition(familiar.needs)} />{familiar.name}<small>Liv. {familiar.level}</small></button>;

  const behavior: FamiliarBehaviorName = reaction?.behavior ?? "idle";
  const sequence = dressedAppearance.behaviors[behavior];
  const lowest = Object.entries(familiar.needs).sort((a, b) => a[1] - b[1])[0];
  return <aside className={styles.pip} role="dialog" aria-label={`Tieni d'occhio ${familiar.name}`} data-reacting={Boolean(reaction)}>
    <header><span>{reaction ? "REAZIONE DEL FAMIGLIO" : "FAMIGLIO"}</span><div><button type="button" onClick={() => setMode("minimized")} aria-label="Riduci">—</button><button type="button" onClick={() => setMode("closed")} aria-label="Chiudi">×</button></div></header>
    <Link href="/famiglio" className={styles.body}>
      <AnimatedPipSprite key={`${sequence.spritePath}:${behavior}`} sequence={sequence} label={`${dressedAppearance.name}: ${behavior}`} />
      <span><strong>{reaction?.title ?? familiar.name}</strong><small>{reaction?.message ?? `Livello ${familiar.level} · ${familiar.growthStage}`}</small>{!reaction ? <em>{lowest[0] === "health" ? "Salute" : lowest[0] === "hunger" ? "Fame" : lowest[0] === "hygiene" ? "Igiene" : lowest[0] === "energy" ? "Energia" : "Felicità"}: {Math.round(lowest[1])}</em> : <em>Apri la sua area</em>}</span>
    </Link>
  </aside>;
}
