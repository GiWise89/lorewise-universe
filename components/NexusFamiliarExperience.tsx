"use client";

/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps, @next/next/no-img-element --
 * This real-time sprite console intentionally synchronizes browser storage, clocks and animation
 * state from effects. Native img elements preserve exact pixel-art rendering and frame assets. */

import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  applyFamiliarTimePassage,
  createNexusFamiliar,
  familiarCondition,
  FAMILIAR_ITEM_KEYS,
  FAMILIAR_NEED_KEYS,
  restFamiliar,
  useFamiliarItem as applyFamiliarItem,
  type FamiliarItemKey,
  type FamiliarNeedKey,
  type FamiliarSex,
  type NexusFamiliarState,
} from "@/lib/nexusFamiliar";
import { claimFamiliarOuting, FAMILIAR_DESTINATIONS, FAMILIAR_SHOP_OFFERS, familiarOutingRewardForLevel, MAX_DAILY_FAMILIAR_OUTINGS, purchaseFamiliarGadgetWithCoins, purchaseFamiliarThemeWithCoins, startFamiliarOuting } from "@/lib/nexusFamiliarWorld";
import { ALL_FAMILIARS, familiarAppearance, familiarPalettes, PREMIUM_FAMILIARS, STARTER_FAMILIARS, type FamiliarAppearance, type FamiliarBehaviorName } from "@/lib/nexusFamiliarCatalog";
import { familiarAppearanceWithGadget } from "@/lib/nexusFamiliarGadgets";
import { planFamiliarCareRequest, type FamiliarCareCommand } from "@/lib/nexusFamiliarActions";
import { newerFamiliarState, sanitizeFamiliarCloudState } from "@/lib/nexusFamiliarCloud";
import { dailyFamiliarMissionsForCount, romeDateKey, type FamiliarMissionGroup } from "@/lib/nexusFamiliarMissionCatalog";
import { nexusRomeCycle, nexusThemeBackground, nexusThemeGeometry, type NexusRomeCycle } from "@/lib/nexusDayCycle";
import { familiarFrameBottomRatio, familiarOpticalBottomRatio, familiarWalkFrameDuration, planFamiliarWalk } from "@/lib/nexusFamiliarMotion";
import { familiarDailyMissionCount, familiarExperienceForLevel, familiarGrowthScale, familiarNextMilestone, familiarUnlockedMilestones, FAMILIAR_MILESTONES, MAX_FAMILIAR_LEVEL } from "@/lib/nexusFamiliarProgression";
import { playFamiliarCue } from "@/lib/nexusFamiliarAudio";
import { completedGuestCareActions, FAMILIAR_CONTEXT_TIP_STORAGE_PREFIX, FAMILIAR_CONTEXTUAL_TIPS, FAMILIAR_CONTEXTUAL_TUTORIAL_LABELS, FAMILIAR_CONTEXTUAL_TUTORIALS, FAMILIAR_GUEST_ACTION_STORAGE_KEY, FAMILIAR_GUIDED_TUTORIAL_STEPS, FAMILIAR_ID_ADVANTAGES, FAMILIAR_ID_PROMPT_STORAGE_KEY, FAMILIAR_STORAGE_KEY, FAMILIAR_TUTORIAL_STORAGE_KEY, shouldRequireLoreWiseIdForNextCare, shouldShowLoreWiseIdPrompt } from "@/lib/nexusFamiliarOnboarding";
import type { FamiliarSlotSummary } from "@/lib/nexusFamiliarSlots";
import { NexusFamiliarLegacy, type LegacyView } from "./NexusFamiliarLegacy";
import { dominantFamiliarPersonality, FAMILIAR_DISCOVERIES, FAMILIAR_POSTCARDS } from "@/lib/nexusFamiliarLegacy";
import { claimFamiliarAttendance, type FamiliarWishKind } from "@/lib/nexusFamiliarRituals";
import { dispatchFamiliarReaction, familiarReactionForChange, FAMILIAR_NOTIFICATIONS_STORAGE_KEY, type FamiliarReaction } from "@/lib/nexusFamiliarEngagement";
import { familiarSpeciesProfile } from "@/lib/nexusFamiliarSpecies";
import { FAMILIAR_COMPACT_SCALE, FAMILIAR_MOBILE_SPOTLIGHT_SIZES, FAMILIAR_PEDESTAL_SIZES, FAMILIAR_STAGE_SIZES, familiarDisplayFamily } from "@/lib/nexusFamiliarDisplay";
import { NexusFamiliarRituals, type FamiliarRitualView } from "./NexusFamiliarRituals";
import styles from "./NexusFamiliarExperience.module.css";

const STORAGE_KEY = FAMILIAR_STORAGE_KEY;
const FAMILIAR_PENDING_DELETE_STORAGE_KEY = "lorewise:nexus-familiar:pending-delete:v1";
const FAMILIAR_MISSION_ANNOUNCED_STORAGE_PREFIX = "lorewise:nexus-familiar:mission-announced:v1";
const DESKTOP_STAGE_WIDTH = 1920;
const DESKTOP_STAGE_HEIGHT = 996;
const CARE_ACTION_DURATION = 1900;
const MANUAL_REST_DURATION = 9000;
const ACTION_ROW: Record<FamiliarItemKey, number> = { food: 0, soap: 1, toy: 2, medicine: 3 };
const ANIMATION_PREVIEW_NEEDS: Record<FamiliarNeedKey, number> = { hunger: 24, hygiene: 28, energy: 32, happiness: 26, health: 35 };
const NEED_LABELS: Record<FamiliarNeedKey, string> = {
  hunger: "Fame",
  hygiene: "Igiene",
  energy: "Energia",
  happiness: "Felicità",
  health: "Salute",
};
const BEHAVIOR_LABELS: Record<FamiliarBehaviorName, string> = {
  idle: "Osserva la tana",
  walk: "Esplora il suo spazio",
  sit: "Si gode la quiete",
  groom: "Si prende cura di sé",
  rest: "Sta riposando",
};
const NEED_ICONS: Record<FamiliarNeedKey, string> = {
  hunger: "/famiglio/needs/fame-v2.png",
  hygiene: "/famiglio/needs/igiene-v2.png",
  energy: "/famiglio/needs/energia-v2.png",
  happiness: "/famiglio/needs/felicita-v2.png",
  health: "/famiglio/needs/salute-v2.png",
};
const ITEM_ICONS: Record<FamiliarItemKey, string> = {
  food: NEED_ICONS.hunger,
  soap: NEED_ICONS.hygiene,
  toy: NEED_ICONS.happiness,
  medicine: NEED_ICONS.health,
};
const NAV_ICONS = {
  den: "/famiglio/navigation/tana-v1.webp",
  outside: "/famiglio/navigation/fuori-casa-v1.webp",
  shop: "/famiglio/navigation/shop-v1.webp",
  missions: "/famiglio/navigation/missioni-v1.webp",
  legacy: "/famiglio/legacy/navigation/legame-v1.png",
  sound: "/famiglio/navigation/suono-v1.svg",
  notifications: "/famiglio/navigation/avvisi-v1.svg",
  tutorial: "/famiglio/navigation/guida-v1.svg",
  change: "/famiglio/navigation/cambia-v1.svg",
} as const;

const MOBILE_ITEM_LABELS: Record<FamiliarItemKey, string> = {
  food: "Cibo",
  soap: "Lava",
  medicine: "Cura",
  toy: "Gioca",
};
const ITEM_LABELS: Record<FamiliarItemKey, string> = {
  food: "Dai da mangiare",
  soap: "Lava",
  medicine: "Cura",
  toy: "Gioca",
};
const REWARD_LABELS: Record<FamiliarItemKey, string> = { food: "cibo", soap: "sapone", medicine: "medicina", toy: "giocattolo" };
const MISSION_GROUP_LABELS: Record<FamiliarMissionGroup, string> = { explore: "Esplora", connect: "Partecipa", care: "Prenditi cura" };

type SpriteStyle = CSSProperties & Record<"--sprite" | "--columns" | "--rows" | "--frame" | "--row" | "--frame-ground-shift", string>;
type ActionVfxStyle = CSSProperties & Record<"--vfx-frame" | "--vfx-row", string>;
type CloudStatus = "checking" | "local" | "syncing" | "synced" | "error";
type ContextualTutorialKind = keyof typeof FAMILIAR_CONTEXTUAL_TUTORIALS;
type TutorialKind = "initial" | ContextualTutorialKind;
type FamiliarCloudPayload = { familiar?: unknown; revision?: unknown; error?: unknown };
type FamiliarSlotsPayload = {
  authenticated?: boolean;
  passActive?: boolean;
  slotLimit?: number;
  preservedSlotCount?: number;
  canStartPremiumSlot?: boolean;
  status?: "standard" | "active" | "expired-preserved";
  slots?: FamiliarSlotSummary[];
  purchasedAppearanceIds?: string[];
  purchasedOfferIds?: string[];
  familiar?: unknown;
  revision?: unknown;
  error?: unknown;
};
type FamiliarMissionView = {
  id: string;
  group: FamiliarMissionGroup;
  title: string;
  description: string;
  href: string;
  progress: number;
  target: number;
  reward: { item: FamiliarItemKey; quantity: number };
  complete: boolean;
  claimed: boolean;
};
type MissionStatus = "loading" | "active" | "signin" | "preview" | "error";
type MissionAnnouncement = { ids: string[]; titles: string[] };
type OutingSummary = { destination: string; coins: number; experience: number; discovery?: { name: string; icon: string; rarity: string }; postcard?: { title: string; image: string; message: string } };
type MissionApiPayload = { missions?: FamiliarMissionView[]; reward?: { item?: unknown; quantity?: unknown; coins?: unknown; experience?: unknown }; familiar?: unknown; revision?: unknown; localPreview?: boolean; error?: string };
type FamiliarCommandPayload = { familiar?: unknown; revision?: unknown; message?: unknown; error?: unknown; conflict?: unknown; missingFamiliar?: unknown };
const SHOP_SECTIONS = [
  { id: "ambienti", label: "Ambienti", shortLabel: "Tane", icon: NAV_ICONS.den, description: "Tane complete che cambiano con le fasi reali della giornata.", kinds: ["theme"] },
  { id: "oggetti", label: "Look", shortLabel: "Look", icon: NAV_ICONS.legacy, description: "Dieci look completi disegnati per ogni Famiglio, colore, movimento e azione.", kinds: ["gadget"] },
  { id: "pagamento", label: "Premium", shortLabel: "Premium", icon: NAV_ICONS.shop, description: "Nuovi Famigli e collezioni cosmetiche attraverso un acquisto reale e protetto.", kinds: ["familiar", "bundle"] },
] as const;
type ShopSectionId = typeof SHOP_SECTIONS[number]["id"];

function createFamiliarId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `familiar-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function isInsecureLanPreview() {
  if (typeof window === "undefined") return false;
  return !window.isSecureContext && !["localhost", "127.0.0.1"].includes(window.location.hostname);
}

function isLocalPreviewHost() {
  if (typeof window === "undefined") return false;
  return window.location.hostname === "localhost"
    || window.location.hostname === "127.0.0.1"
    || /^192\.168\./.test(window.location.hostname)
    || /^10\./.test(window.location.hostname)
    || /^172\.(1[6-9]|2\d|3[01])\./.test(window.location.hostname);
}

function Sprite({ appearance, row = 2, frameCount = appearance.columns, animate = true, className = "" }: { appearance: FamiliarAppearance; row?: number; frameCount?: number; animate?: boolean; className?: string }) {
  const safeFrameCount = Math.max(1, Math.min(frameCount, appearance.columns));
  const animationKey = `${appearance.id}:${appearance.spritePath}:${row}:${safeFrameCount}`;
  const [animation, setAnimation] = useState({ key: animationKey, frame: 0 });
  const frame = animation.key === animationKey ? animation.frame : 0;
  useEffect(() => {
    setAnimation({ key: animationKey, frame: 0 });
    if (!animate) return;
    const timer = window.setInterval(() => setAnimation((value) => ({ key: animationKey, frame: value.key === animationKey ? (value.frame + 1) % safeFrameCount : 0 })), appearance.actionFrameDurationMs ?? 155);
    return () => window.clearInterval(timer);
  }, [animate, animationKey, appearance.actionFrameDurationMs, safeFrameCount]);
  const style: SpriteStyle = {
    "--sprite": `url("${appearance.spritePath}")`,
    "--columns": String(appearance.columns),
    "--rows": String(appearance.rows),
    "--frame": String(frame),
    "--row": String(row),
    "--frame-ground-shift": String((appearance.actionGroundRatios?.[row]?.[frame] ?? familiarFrameBottomRatio(appearance.family, "idle", row, frame)) - familiarOpticalBottomRatio(appearance.family, "idle", row)),
  };
  return <span className={`${styles.sprite} ${className}`} style={style} role="img" aria-label={appearance.name} />;
}

function BehaviorSprite({ appearance, behavior, flipped = false, loop = false, className = "" }: { appearance: FamiliarAppearance; behavior: FamiliarBehaviorName; flipped?: boolean; loop?: boolean; className?: string }) {
  const sequence = appearance.behaviors[behavior];
  const animationKey = `${appearance.id}:${sequence.spritePath}:${behavior}:${sequence.row}`;
  const [animation, setAnimation] = useState({ key: animationKey, frame: 0 });
  const frame = animation.key === animationKey ? animation.frame : 0;
  useEffect(() => {
    setAnimation({ key: animationKey, frame: 0 });
    if (sequence.frames <= 1) return;
    const loops = loop || behavior === "idle" || behavior === "walk";
    const finalFrame = sequence.holdFrame ?? sequence.frames - 1;
    let currentFrame = 0;
    const timer = window.setInterval(() => {
      currentFrame = loops ? (currentFrame + 1) % sequence.frames : Math.min(currentFrame + 1, finalFrame);
      setAnimation({ key: animationKey, frame: currentFrame });
      if (!loops && currentFrame === finalFrame) window.clearInterval(timer);
    }, sequence.frameDurationMs ?? (behavior === "walk" ? familiarWalkFrameDuration(appearance.family) : 190));
    return () => window.clearInterval(timer);
  }, [animationKey, appearance.family, behavior, loop, sequence.frameDurationMs, sequence.frames, sequence.holdFrame, sequence.spritePath]);
  const visibleFrame = Math.min(frame, Math.max(0, sequence.holdFrame ?? sequence.frames - 1));
  const style: SpriteStyle = {
    "--sprite": `url("${sequence.spritePath}")`,
    "--columns": String(sequence.columns),
    "--rows": String(sequence.rows),
    "--frame": String(visibleFrame),
    "--row": String(sequence.row),
    "--frame-ground-shift": String((sequence.groundRatios?.[visibleFrame] ?? familiarFrameBottomRatio(appearance.family, behavior, null, visibleFrame)) - familiarOpticalBottomRatio(appearance.family, behavior, null)),
  };
  return <span className={`${styles.sprite} ${styles.behaviorSprite} ${flipped ? styles.flipped : ""} ${className}`} style={{ ...style, "--species-compact-scale": String(FAMILIAR_COMPACT_SCALE[familiarDisplayFamily(appearance.family)]) } as CSSProperties} data-family={appearance.family} role="img" aria-label={`${appearance.name}: ${behavior}`} />;
}

function actionForLogicalRow(row: number): FamiliarItemKey {
  return (Object.entries(ACTION_ROW).find(([, actionRow]) => actionRow === row)?.[0] ?? "food") as FamiliarItemKey;
}

function effectiveActionRow(appearance: FamiliarAppearance, logicalRow: number) {
  return appearance.actionRows?.[actionForLogicalRow(logicalRow)] ?? logicalRow;
}

function actionFrameCount(appearance: FamiliarAppearance, logicalRow: number) {
  const action = actionForLogicalRow(logicalRow);
  return appearance.actionFrameCounts?.[action] ?? appearance.columns;
}

const ACTION_VFX_ROWS: Record<FamiliarItemKey, number> = { food: 0, soap: 1, toy: 2, medicine: 3 };

function ActionVfx({ action, frameDurationMs }: { action: FamiliarItemKey; frameDurationMs: number }) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    setFrame(0);
    const timer = window.setInterval(() => setFrame((current) => (current + 1) % 8), frameDurationMs);
    return () => window.clearInterval(timer);
  }, [action, frameDurationMs]);
  const style: ActionVfxStyle = { "--vfx-frame": String(frame), "--vfx-row": String(ACTION_VFX_ROWS[action]) };
  return <span className={styles.actionVfx} data-vfx={action} style={style} aria-hidden="true" />;
}

function ActionSprite({ appearance, row, className = "" }: { appearance: FamiliarAppearance; row: number; className?: string }) {
  const action = actionForLogicalRow(row);
  const spriteRow = effectiveActionRow(appearance, row);
  const frameCount = actionFrameCount(appearance, row);
  const hasVfx = appearance.actionProps?.includes(action);
  const propStyle = { "--action-ground-offset": `${familiarOpticalBottomRatio(appearance.family, "idle", spriteRow) * 100}%` } as CSSProperties;
  return <span className={styles.actionSpriteStage} data-action={action} data-family={appearance.family} style={propStyle}>
    <Sprite appearance={appearance} row={spriteRow} frameCount={frameCount} className={className} />
    {hasVfx ? <ActionVfx action={action} frameDurationMs={appearance.actionFrameDurationMs ?? 155} /> : null}
  </span>;
}

function NeedMeter({ needKey, label, value }: { needKey: FamiliarNeedKey; label: string; value: number }) {
  const rounded = Math.round(value);
  return (
    <div className={styles.need}>
      <img src={NEED_ICONS[needKey]} alt="" width={44} height={44} loading="eager" decoding="async" />
      <div className={styles.needData}>
        <div><span>{label}</span><strong>{rounded}</strong></div>
        <div className={styles.meter} aria-label={`${label}: ${rounded} su 100`} role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={rounded}>
          <span style={{ width: `${rounded}%` }} />
        </div>
      </div>
    </div>
  );
}

export function NexusFamiliarExperience({ initialLegacyView }: { initialLegacyView?: LegacyView } = {}) {
  const [state, setState] = useState<NexusFamiliarState | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [actionRow, setActionRow] = useState<number | null>(null);
  const [behavior, setBehavior] = useState<FamiliarBehaviorName>("idle");
  const [position, setPosition] = useState(50);
  const [walkDuration, setWalkDuration] = useState(3200);
  const [isMoving, setIsMoving] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [romeCycle, setRomeCycle] = useState<NexusRomeCycle | null>(null);
  const [animationPreview, setAnimationPreview] = useState(false);
  const [adoptionPreviewMode, setAdoptionPreviewMode] = useState(false);
  const [manualRest, setManualRest] = useState(false);
  const [selectedStarterId, setSelectedStarterId] = useState(STARTER_FAMILIARS[0].id);
  const [selectedPaletteId, setSelectedPaletteId] = useState(STARTER_FAMILIARS[0].id);
  const [adoptionPageIndex, setAdoptionPageIndex] = useState(0);
  const [selectedSex, setSelectedSex] = useState<Exclude<FamiliarSex, "unspecified"> | null>(null);
  const [activeCare, setActiveCare] = useState<FamiliarCareCommand | null>(null);
  const [queuedCare, setQueuedCare] = useState<FamiliarCareCommand | null>(null);
  const [message, setMessage] = useState("Scegli il Famiglio che vuoi accogliere nella tua tana.");
  const [name, setName] = useState("");
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>("checking");
  const [cloudCheckNonce, setCloudCheckNonce] = useState(0);
  const [familiarSlots, setFamiliarSlots] = useState<FamiliarSlotSummary[]>([]);
  const [purchasedAppearanceIds, setPurchasedAppearanceIds] = useState<string[]>([]);
  const [purchasedOfferIds, setPurchasedOfferIds] = useState<string[]>([]);
  const [slotEntitlement, setSlotEntitlement] = useState<Pick<FamiliarSlotsPayload, "authenticated" | "passActive" | "slotLimit" | "preservedSlotCount" | "canStartPremiumSlot" | "status">>({});
  const [rosterOpen, setRosterOpen] = useState(false);
  const [slotAdoptionOpen, setSlotAdoptionOpen] = useState(false);
  const [slotBusy, setSlotBusy] = useState(false);
  const [missions, setMissions] = useState<FamiliarMissionView[]>([]);
  const [missionStatus, setMissionStatus] = useState<MissionStatus>("loading");
  const [missionAnnouncement, setMissionAnnouncement] = useState<MissionAnnouncement | null>(null);
  const [returnLoopView, setReturnLoopView] = useState<"missions" | FamiliarRitualView>("missions");
  const [ritualBusy, setRitualBusy] = useState(false);
  const [pendingWishAction, setPendingWishAction] = useState<FamiliarCareCommand | null>(null);
  const [claimingMission, setClaimingMission] = useState<string | null>(null);
  const [activeDashboardView, setActiveDashboardView] = useState<"den" | "outside" | "shop" | "legacy" | "progress">(initialLegacyView ? "legacy" : "den");
  const [mobilePanel, setMobilePanel] = useState<"actions" | "outside" | "shop" | "legacy" | "missions" | null>(initialLegacyView ? "legacy" : null);
  const [activeShopSectionId, setActiveShopSectionId] = useState<ShopSectionId>("ambienti");
  const [previewThemeId, setPreviewThemeId] = useState<string | null>(null);
  const [previewFamiliarId, setPreviewFamiliarId] = useState<string | null>(null);
  const [previewEquippedGadgetId, setPreviewEquippedGadgetId] = useState<string | null>(null);
  const [outingNow, setOutingNow] = useState(() => Date.now());
  const [outingNarrative, setOutingNarrative] = useState<{ phase: "departure" | "return"; text: string } | null>(null);
  const [outingSummary, setOutingSummary] = useState<OutingSummary | null>(null);
  const [desktopStageFit, setDesktopStageFit] = useState({ scale: 1, viewportHeight: DESKTOP_STAGE_HEIGHT });
  const [loreWiseIdPromptOpen, setLoreWiseIdPromptOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [tutorialKind, setTutorialKind] = useState<TutorialKind>("initial");
  const [tutorialStep, setTutorialStep] = useState(0);
  const [tutorialSpotlight, setTutorialSpotlight] = useState({ top: 84, left: 24, width: 340, height: 120 });
  const [tutorialCoachPlacement, setTutorialCoachPlacement] = useState<"top-left" | "top-right" | "bottom-left" | "bottom-right">("bottom-right");
  const [resetStep, setResetStep] = useState<0 | 1 | 2>(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [, setNotificationPermission] = useState<NotificationPermission | "unsupported">("default");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [, setGuestCompletedActions] = useState(0);
  const actionTimer = useRef<number | null>(null);
  const movementTimer = useRef<number | null>(null);
  const cloudSaveTimer = useRef<number | null>(null);
  const cloudRevisionRef = useRef(0);
  const cloudReadyRef = useRef(false);
  const cloudSignatureRef = useRef("");
  const initialLocalStateRef = useRef<NexusFamiliarState | null>(null);
  const persistFamiliarRef = useRef(persistFamiliar);
  const loadMissionsRef = useRef(loadMissions);
  const activeCareRef = useRef<FamiliarCareCommand | null>(null);
  const queuedCareRef = useRef<FamiliarCareCommand | null>(null);
  const stateRef = useRef<NexusFamiliarState | null>(null);
  const habitatRef = useRef<HTMLElement | null>(null);
  const petMoverRef = useRef<HTMLDivElement | null>(null);
  const dashboardPageRef = useRef<HTMLElement | null>(null);
  const guestCompletedActionsRef = useRef(0);
  const tutorialCoachRef = useRef<HTMLElement | null>(null);
  const rosterDialogRef = useRef<HTMLDivElement | null>(null);
  const tutorialSteps = tutorialKind === "initial" ? FAMILIAR_GUIDED_TUTORIAL_STEPS : FAMILIAR_CONTEXTUAL_TUTORIALS[tutorialKind];

  useEffect(() => {
    persistFamiliarRef.current = persistFamiliar;
    loadMissionsRef.current = loadMissions;
  });

  useEffect(() => {
    if (!tutorialOpen) return;
    if (tutorialCoachRef.current) tutorialCoachRef.current.scrollTop = 0;
    const step = tutorialSteps[Math.min(tutorialStep, tutorialSteps.length - 1)];
    setActiveDashboardView(step.view);
    const compact = window.matchMedia("(max-width: 720px)").matches;
    setMobilePanel(compact && "panel" in step ? step.panel : null);
    const measure = window.setTimeout(() => {
      const target = Array.from(document.querySelectorAll<HTMLElement>(`[data-tutorial-target="${step.target}"]`)).find((candidate) => {
        const candidateRect = candidate.getBoundingClientRect();
        return candidateRect.width > 0 && candidateRect.height > 0;
      });
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const padding = compact ? 6 : 10;
      const width = Math.min(window.innerWidth - 12, rect.width + padding * 2);
      const height = Math.min(window.innerHeight - 12, rect.height + padding * 2);
      const top = Math.min(window.innerHeight - height - 6, Math.max(6, rect.top - padding));
      const left = Math.min(window.innerWidth - width - 6, Math.max(6, rect.left - padding));
      const vertical = top + height / 2 < window.innerHeight / 2 ? "bottom" : "top";
      const horizontal = left + width / 2 < window.innerWidth / 2 ? "right" : "left";
      setTutorialCoachPlacement(`${vertical}-${horizontal}`);
      setTutorialSpotlight({ top, left, width, height });
    }, compact ? 700 : 220);
    return () => window.clearTimeout(measure);
  }, [tutorialOpen, tutorialStep, tutorialKind]);

  useEffect(() => {
    const dialog = rosterOpen ? rosterDialogRef.current : tutorialOpen ? tutorialCoachRef.current : null;
    if (!dialog) return;
    const focusable = () => Array.from(dialog.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex='-1'])"));
    window.setTimeout(() => focusable()[0]?.focus(), 0);
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (rosterOpen) { setSlotAdoptionOpen(false); setRosterOpen(false); }
        else closeTutorial();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusable();
      if (!items.length) return;
      const first = items[0];
      const last = items.at(-1)!;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [rosterOpen, tutorialOpen]);

  useEffect(() => {
    try {
      const previewParameters = new URLSearchParams(window.location.search);
      const resetTutorial = isLocalPreviewHost() && previewParameters.get("ripristina-tutorial") === "1";
      if (resetTutorial) {
        window.localStorage.removeItem(FAMILIAR_TUTORIAL_STORAGE_KEY);
        for (const kind of Object.keys(FAMILIAR_CONTEXTUAL_TUTORIALS) as ContextualTutorialKind[]) {
          window.localStorage.removeItem(`${FAMILIAR_CONTEXT_TIP_STORAGE_PREFIX}${kind}`);
          window.localStorage.removeItem(`lorewise:nexus-familiar:context-tip:v1:${kind}`);
        }
        previewParameters.delete("ripristina-tutorial");
        const remainingQuery = previewParameters.toString();
        window.history.replaceState(window.history.state, "", `${window.location.pathname}${remainingQuery ? `?${remainingQuery}` : ""}${window.location.hash}`);
      }
      const selectionPreview = isLocalPreviewHost() && previewParameters.get("anteprima-selezione") === "1";
      if (selectionPreview) {
        setAdoptionPreviewMode(true);
        setCloudStatus("local");
        return;
      }
      const completedActions = Math.max(0, Math.floor(Number(window.localStorage.getItem(FAMILIAR_GUEST_ACTION_STORAGE_KEY)) || 0));
      guestCompletedActionsRef.current = completedActions;
      setGuestCompletedActions(completedActions);
      setSoundEnabled(window.localStorage.getItem("lorewise:nexus-familiar:sound:v1") !== "off");
      setNotificationsEnabled(window.localStorage.getItem(FAMILIAR_NOTIFICATIONS_STORAGE_KEY) !== "off");
      setNotificationPermission(typeof Notification === "undefined" ? "unsupported" : Notification.permission);
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const checked = sanitizeFamiliarCloudState(JSON.parse(saved));
        if (!checked.ok) throw new Error(checked.error);
        initialLocalStateRef.current = checked.state;
        const restored = applyFamiliarTimePassage(checked.state);
        stateRef.current = restored;
        setState(restored);
        setMessage(`${restored.name} ti dà il bentornato a casa.`);
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated || !state || window.localStorage.getItem(FAMILIAR_TUTORIAL_STORAGE_KEY)) return;
    setTutorialKind("initial");
    setTutorialStep(0);
    setTutorialOpen(true);
  }, [hydrated, state?.familiarId]);

  useEffect(() => {
    const timer = window.setInterval(() => setOutingNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const updateCycle = () => setRomeCycle(nexusRomeCycle(new Date()));
    updateCycle();
    const timer = window.setInterval(updateCycle, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const updateStageFit = () => {
      const page = dashboardPageRef.current;
      if (!page) return;
      const viewportHeight = Math.max(1, window.innerHeight - page.getBoundingClientRect().top);
      const viewportWidth = Math.max(1, page.clientWidth || window.innerWidth);
      const scale = Math.min(viewportWidth / DESKTOP_STAGE_WIDTH, viewportHeight / DESKTOP_STAGE_HEIGHT);
      setDesktopStageFit((current) => current.scale === scale && current.viewportHeight === viewportHeight ? current : { scale, viewportHeight });
    };
    updateStageFit();
    window.addEventListener("resize", updateStageFit);
    return () => window.removeEventListener("resize", updateStageFit);
  }, [hydrated, state?.familiarId]);

  useEffect(() => {
    const previewParameter = new URLSearchParams(window.location.search).get("prova-animazioni");
    setAnimationPreview(isLocalPreviewHost() && previewParameter === "1");
  }, []);

  useEffect(() => {
    if (hydrated && state && !adoptionPreviewMode) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [adoptionPreviewMode, hydrated, state]);

  useEffect(() => {
    if (!hydrated || adoptionPreviewMode) return;
    let cancelled = false;
    const loadCloudFamiliar = async () => {
      setCloudStatus("checking");
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 8_000);
      try {
        const result = await fetch("/api/famiglio", { cache: "no-store", credentials: "same-origin", signal: controller.signal });
        if (cancelled) return;
        if (result.status === 401) {
          cloudReadyRef.current = false;
          setCloudStatus("local");
          return;
        }
        const payload = await result.json() as FamiliarCloudPayload;
        if (!result.ok) throw new Error(typeof payload.error === "string" ? payload.error : "Cloud non disponibile");
        const remoteChecked = payload.familiar ? sanitizeFamiliarCloudState(payload.familiar) : null;
        const remote = remoteChecked?.ok ? remoteChecked.state : null;
        const revision = Math.max(0, Math.floor(Number(payload.revision) || 0));
        const pendingDeleteId = window.localStorage.getItem(FAMILIAR_PENDING_DELETE_STORAGE_KEY);
        if (pendingDeleteId && remote?.familiarId === pendingDeleteId) {
          cloudReadyRef.current = false;
          setCloudStatus("local");
          return;
        }
        if (pendingDeleteId && !remote) window.localStorage.removeItem(FAMILIAR_PENDING_DELETE_STORAGE_KEY);
        cloudRevisionRef.current = revision;
        cloudReadyRef.current = true;
        guestCompletedActionsRef.current = 0;
        setGuestCompletedActions(0);
        setLoreWiseIdPromptOpen(false);
        window.localStorage.removeItem(FAMILIAR_GUEST_ACTION_STORAGE_KEY);
        window.sessionStorage.removeItem(FAMILIAR_ID_PROMPT_STORAGE_KEY);

        const preferred = newerFamiliarState(initialLocalStateRef.current, remote);
        if (preferred === "remote" && remote) {
          cloudSignatureRef.current = JSON.stringify(remote);
          const restored = applyFamiliarTimePassage(remote);
          updateFamiliarState(restored);
          setMessage(`${restored.name} ti dà il bentornato a casa.`);
          setCloudStatus("synced");
          return;
        }
        if (preferred === "local" && stateRef.current) {
          await persistFamiliarRef.current(stateRef.current, revision);
          return;
        }
        setCloudStatus("synced");
      } catch {
        if (!cancelled) {
          cloudReadyRef.current = false;
          setCloudStatus("error");
        }
      } finally {
        window.clearTimeout(timeout);
      }
    };
    void loadCloudFamiliar();
    return () => { cancelled = true; };
  }, [adoptionPreviewMode, hydrated, cloudCheckNonce]);

  useEffect(() => {
    if (!hydrated) return;
    const retryWhenOnline = () => setCloudCheckNonce((current) => current + 1);
    window.addEventListener("online", retryWhenOnline);
    return () => window.removeEventListener("online", retryWhenOnline);
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated || !state || !cloudReadyRef.current) return;
    const signature = JSON.stringify(state);
    if (signature === cloudSignatureRef.current) return;
    if (cloudSaveTimer.current) window.clearTimeout(cloudSaveTimer.current);
    setCloudStatus("syncing");
    cloudSaveTimer.current = window.setTimeout(() => {
      void persistFamiliarRef.current(stateRef.current ?? state, cloudRevisionRef.current);
    }, 900);
    return () => {
      if (cloudSaveTimer.current) window.clearTimeout(cloudSaveTimer.current);
    };
  }, [hydrated, state]);

  useEffect(() => {
    if (!hydrated || !state?.familiarId) return;
    void loadMissionsRef.current();
  }, [hydrated, state?.familiarId]);

  useEffect(() => {
    if (!hydrated || cloudStatus === "checking" || cloudStatus === "syncing") return;
    void loadFamiliarSlots();
  }, [hydrated, state?.familiarId, cloudStatus]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (behavior !== "rest" || actionRow !== null) setManualRest(false);
  }, [behavior, actionRow]);

  useEffect(() => () => {
    if (actionTimer.current) window.clearTimeout(actionTimer.current);
    if (movementTimer.current) window.clearTimeout(movementTimer.current);
    if (cloudSaveTimer.current) window.clearTimeout(cloudSaveTimer.current);
  }, []);

  useEffect(() => {
    if (!pendingWishAction || activeDashboardView !== "den" || mobilePanel !== null) return;
    const timer = window.setTimeout(() => {
      const command = pendingWishAction;
      setPendingWishAction(null);
      requestCare(command);
    }, 560);
    return () => window.clearTimeout(timer);
  }, [activeDashboardView, mobilePanel, pendingWishAction]);

  useEffect(() => {
    if (!state || actionRow !== null || activeCare !== null || isMoving || activeDashboardView !== "den" || mobilePanel !== null) return;
    if (behavior === "walk") {
      setBehavior("idle");
      return;
    }
    const dominantPersonality = dominantFamiliarPersonality(state.legacy);
    const personalityChoices: Record<ReturnType<typeof dominantFamiliarPersonality>, FamiliarBehaviorName[]> = {
      curiosity: ["walk", "walk", "idle", "sit"],
      affection: ["sit", "idle", "groom", "idle"],
      adventure: ["walk", "walk", "walk", "idle"],
      playfulness: ["walk", "idle", "walk", "sit"],
      calm: ["rest", "sit", "idle", "groom"],
    };
    const speciesChoices = familiarSpeciesProfile(familiarAppearance(state.appearanceId).family).autonomousBehaviors;
    const choices: FamiliarBehaviorName[] = ["idle", "walk", "sit", "groom", "rest", ...speciesChoices, ...personalityChoices[dominantPersonality]];
    const durations: Record<FamiliarBehaviorName, number> = { idle: 3600, walk: 5000, sit: 6500, groom: 5200, rest: 9000 };
    const delay = durations[behavior] + Math.random() * 1400;
    const autonomousTimer = window.setTimeout(() => {
      const available = choices.filter((candidate) => candidate !== behavior);
      const next = available[Math.floor(Math.random() * available.length)];
      if (next === "walk") {
        startWalk();
        return;
      }
      setBehavior(next);
    }, delay);
    return () => window.clearTimeout(autonomousTimer);
  }, [state, actionRow, activeCare, activeDashboardView, behavior, isMoving, mobilePanel]);

  const appearance = useMemo(() => familiarAppearance(previewFamiliarId ?? state?.appearanceId ?? "cat-1"), [previewFamiliarId, state?.appearanceId]);
  const visibleGadgetId = previewEquippedGadgetId ?? state?.den.equippedGadget ?? null;
  const dressedAppearance = useMemo(() => familiarAppearanceWithGadget(appearance, visibleGadgetId), [appearance, visibleGadgetId]);
  const selectedFamily = useMemo(() => familiarAppearance(selectedStarterId), [selectedStarterId]);
  const selectedStarter = useMemo(() => familiarAppearance(selectedPaletteId), [selectedPaletteId]);
  const paletteOptions = useMemo(() => familiarPalettes(selectedFamily.id), [selectedFamily.id]);
  const purchasedPremiumFamiliars = PREMIUM_FAMILIARS.filter((candidate) => purchasedAppearanceIds.includes(candidate.id));
  const availableAdoptionFamilies = animationPreview ? ALL_FAMILIARS : [...STARTER_FAMILIARS, ...purchasedPremiumFamiliars];
  const adoptionPages = animationPreview
    ? [STARTER_FAMILIARS, PREMIUM_FAMILIARS]
    : purchasedPremiumFamiliars.length > 0 ? [STARTER_FAMILIARS, purchasedPremiumFamiliars] : [STARTER_FAMILIARS];
  const slotAdoptionCandidates = [...STARTER_FAMILIARS, ...purchasedPremiumFamiliars];
  const visibleAdoptionFamilies = adoptionPages[Math.min(adoptionPageIndex, adoptionPages.length - 1)] ?? STARTER_FAMILIARS;
  const activeShopSection = SHOP_SECTIONS.find((section) => section.id === activeShopSectionId) ?? SHOP_SECTIONS[0];
  const mobileSpotlightSize = FAMILIAR_MOBILE_SPOTLIGHT_SIZES[familiarDisplayFamily(selectedFamily.family)];
  const mobileSpotlightBottomOffset = Math.round(mobileSpotlightSize * familiarOpticalBottomRatio(selectedStarter.family, "idle", null) * 100) / 100;
  const baseCycle = romeCycle ?? nexusRomeCycle(new Date(0));
  const activeThemeId = previewThemeId ?? state?.den.theme ?? "rifugio-iniziale";
  const activeThemeGeometry = nexusThemeGeometry(activeThemeId);
  const activeCycle = { ...baseCycle, background: nexusThemeBackground(activeThemeId, baseCycle.phase) };
  const visibleNeeds = animationPreview ? ANIMATION_PREVIEW_NEEDS : state?.needs ?? ANIMATION_PREVIEW_NEEDS;
  const condition = familiarCondition(visibleNeeds);
  const visibleBehavior: FamiliarBehaviorName = isMoving ? "walk" : behavior === "walk" ? "idle" : behavior;
  const lowestNeed = FAMILIAR_NEED_KEYS.reduce((lowest, key) => visibleNeeds[key] < visibleNeeds[lowest] ? key : lowest, FAMILIAR_NEED_KEYS[0]);
  const currentLevelAt = state ? familiarExperienceForLevel(state.level) : 0;
  const nextLevelAt = state ? familiarExperienceForLevel(Math.min(MAX_FAMILIAR_LEVEL, state.level + 1)) : 25;
  const levelProgress = state?.level === MAX_FAMILIAR_LEVEL ? 100 : state ? Math.min(100, Math.round((state.experience - currentLevelAt) / Math.max(1, nextLevelAt - currentLevelAt) * 100)) : 0;
  const nextMilestone = state ? familiarNextMilestone(state.level) : null;
  const unlockedMilestones = state ? familiarUnlockedMilestones(state.level) : [];
  const sleeping = manualRest && activeCare === "rest";
  const activeOuting = state?.outing ? FAMILIAR_DESTINATIONS.find((entry) => entry.id === state.outing?.destinationId) ?? null : null;
  const outingSeconds = state?.outing ? Math.max(0, Math.ceil((Date.parse(state.outing.endsAt) - outingNow) / 1000)) : 0;
  const petStageStyle = useMemo(() => {
    const growthScale = familiarGrowthScale(state?.level ?? 1);
    const family = familiarDisplayFamily(appearance.family);
    const dimensions = FAMILIAR_STAGE_SIZES[family];
    const groundedActionRow = actionRow === null ? null : effectiveActionRow(appearance, actionRow);
    const opticalBottomRatio = familiarOpticalBottomRatio(appearance.family, visibleBehavior, groundedActionRow);
    return {
      "--pet-size": `${dimensions.desktop}px`,
      "--mobile-pet-size": `${dimensions.mobile}px`,
      "--growth-scale": String(growthScale),
      "--theme-ground-bottom": `${100 - activeThemeGeometry.groundLinePercent}%`,
      "--mobile-theme-ground-bottom": `${100 - activeThemeGeometry.mobileGroundLinePercent}%`,
      "--pet-bottom-offset": `${Math.round(dimensions.desktop * growthScale * opticalBottomRatio * 100) / 100}px`,
      "--mobile-pet-bottom-offset": `${Math.round(dimensions.mobile * growthScale * opticalBottomRatio * 100) / 100}px`,
    } as CSSProperties;
  }, [actionRow, activeThemeGeometry.groundLinePercent, activeThemeGeometry.mobileGroundLinePercent, appearance, state?.level, visibleBehavior]);
  const legacyGroundStyle = useMemo(() => {
    const family = familiarDisplayFamily(appearance.family);
    const dimensions = FAMILIAR_PEDESTAL_SIZES[family];
    const opticalBottomRatio = familiarOpticalBottomRatio(appearance.family, "idle", null);
    return {
      "--personality-pet-size": `${dimensions.desktop}px`,
      "--personality-mobile-pet-size": `${Math.round(dimensions.mobile * 1.24)}px`,
      "--personality-pet-bottom-offset": `${Math.round(dimensions.desktop * opticalBottomRatio * 100) / 100}px`,
      "--personality-mobile-pet-bottom-offset": `${Math.round(dimensions.mobile * 1.24 * opticalBottomRatio * 100) / 100}px`,
    } as CSSProperties;
  }, [appearance.family]);

  useEffect(() => {
    if (!previewThemeId) return;
    const timer = window.setTimeout(() => {
      setPreviewThemeId(null);
      setMessage("Anteprima conclusa: è stata ripristinata la tana già in uso.");
    }, 8_000);
    return () => window.clearTimeout(timer);
  }, [previewThemeId]);

  useEffect(() => {
    if (movementTimer.current) window.clearTimeout(movementTimer.current);
    movementTimer.current = null;
    setIsMoving(false);
    setBehavior((current) => current === "walk" ? "idle" : current);
    setPosition((current) => Math.min(activeThemeGeometry.walkBounds[1], Math.max(activeThemeGeometry.walkBounds[0], current)));
  }, [activeThemeGeometry.walkBounds, activeThemeId]);

  function openDashboardView(view: "den" | "outside" | "shop" | "legacy" | "progress") {
    if (view !== "den") stopAutonomousWalk();
    setPreviewThemeId(null);
    setPreviewEquippedGadgetId(null);
    setPreviewFamiliarId(null);
    setActiveDashboardView(view);
    showContextualTip(view === "progress" ? "missions" : view === "den" ? null : view);
  }

  function toggleMobilePanel(panel: "actions" | "outside" | "shop" | "legacy" | "missions") {
    const opening = mobilePanel !== panel;
    if (opening) stopAutonomousWalk();
    setPreviewThemeId(null);
    setPreviewEquippedGadgetId(null);
    setPreviewFamiliarId(null);
    setMobilePanel(opening ? panel : null);
    if (opening && panel !== "actions") showContextualTip(panel === "missions" ? "missions" : panel);
  }

  function showContextualTip(kind: keyof typeof FAMILIAR_CONTEXTUAL_TIPS | null) {
    if (!kind) return;
    const storageKey = `${FAMILIAR_CONTEXT_TIP_STORAGE_PREFIX}${kind}`;
    if (window.localStorage.getItem(storageKey)) return;
    window.localStorage.setItem(storageKey, "seen");
    setMessage(FAMILIAR_CONTEXTUAL_TIPS[kind]);
    openGuidedTutorial(kind);
  }

  function openGuidedTutorial(kind: TutorialKind) {
    if (kind === "missions") setReturnLoopView("missions");
    setTutorialKind(kind);
    setTutorialStep(0);
    setTutorialOpen(true);
  }

  function openTutorialForCurrentSection() {
    const panelKind = mobilePanel && mobilePanel !== "actions" ? mobilePanel : null;
    const viewKind = activeDashboardView === "progress" ? "missions" : activeDashboardView === "den" ? null : activeDashboardView;
    openGuidedTutorial(panelKind ?? viewKind ?? "initial");
  }

  function updateFamiliarState(next: NexusFamiliarState, reaction?: FamiliarReaction) {
    const automaticReaction = familiarReactionForChange(stateRef.current, next);
    stateRef.current = next;
    setState(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("lorewise:familiar-updated"));
    if (reaction ?? automaticReaction) dispatchFamiliarReaction(reaction ?? automaticReaction!);
  }

  async function persistFamiliar(next: NexusFamiliarState, baseRevision: number, allowRetry = true) {
    if (!cloudReadyRef.current) return false;
    setCloudStatus("syncing");
    try {
      const result = await fetch("/api/famiglio", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: next, baseRevision }),
      });
      const payload = await result.json() as FamiliarCloudPayload;
      if (result.status === 409) {
        const remoteChecked = payload.familiar ? sanitizeFamiliarCloudState(payload.familiar) : null;
        const remote = remoteChecked?.ok ? remoteChecked.state : null;
        const revision = Math.max(0, Math.floor(Number(payload.revision) || 0));
        cloudRevisionRef.current = revision;
        if (remote && newerFamiliarState(next, remote) === "remote") {
          cloudSignatureRef.current = JSON.stringify(remote);
          updateFamiliarState(applyFamiliarTimePassage(remote));
          setCloudStatus("synced");
          return true;
        }
        if (allowRetry) {
          return persistFamiliar(next, revision, false);
        }
      }
      if (!result.ok) throw new Error(typeof payload.error === "string" ? payload.error : "Sincronizzazione non disponibile");
      const savedChecked = payload.familiar ? sanitizeFamiliarCloudState(payload.familiar) : null;
      cloudRevisionRef.current = Math.max(0, Math.floor(Number(payload.revision) || baseRevision + 1));
      const saved = savedChecked?.ok ? savedChecked.state : next;
      cloudSignatureRef.current = JSON.stringify(saved);
      if (JSON.stringify(saved) !== JSON.stringify(next)) updateFamiliarState(saved);
      setCloudStatus("synced");
      return true;
    } catch {
      cloudReadyRef.current = false;
      setCloudStatus("error");
      return false;
    }
  }

  async function commitEconomyState(next: NexusFamiliarState) {
    updateFamiliarState(next);
    if (!cloudReadyRef.current) return false;
    if (cloudSaveTimer.current) window.clearTimeout(cloudSaveTimer.current);
    cloudSaveTimer.current = null;
    return persistFamiliarRef.current(next, cloudRevisionRef.current);
  }

  async function runAuthoritativeCommand(command: "care" | "outing-start" | "outing-claim" | "theme" | "gadget" | "attendance", value = "", allowConflictRetry = true) {
    try {
      const result = await fetch("/api/famiglio/command", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command, value, baseRevision: cloudRevisionRef.current }),
      });
      const payload = await result.json() as FamiliarCommandPayload;
      const checked = payload.familiar ? sanitizeFamiliarCloudState(payload.familiar) : null;
      const revision = Math.max(0, Math.floor(Number(payload.revision) || cloudRevisionRef.current));
      if (checked?.ok) {
        cloudRevisionRef.current = revision;
        cloudSignatureRef.current = JSON.stringify(checked.state);
        updateFamiliarState(checked.state);
      }
      if (result.status === 409 && payload.conflict === true && checked?.ok && allowConflictRetry) {
        return runAuthoritativeCommand(command, value, false);
      }
      if (result.status === 409 && payload.missingFamiliar === true && allowConflictRetry && stateRef.current) {
        const saved = await persistFamiliarRef.current(stateRef.current, revision);
        if (saved) return runAuthoritativeCommand(command, value, false);
      }
      if (result.status === 401) {
        cloudReadyRef.current = false;
        setCloudStatus("local");
      }
      if (!result.ok || !checked?.ok) return { ok: false as const, error: typeof payload.error === "string" ? payload.error : "Comando non completato." };
      setCloudStatus("synced");
      return { ok: true as const, state: checked.state, message: typeof payload.message === "string" ? payload.message : "Operazione completata." };
    } catch {
      setCloudStatus("error");
      return { ok: false as const, error: "Connessione non disponibile. Riprova senza perdere la schermata corrente." };
    }
  }

  function localMissionPreview() {
    const seed = stateRef.current?.familiarId ?? "famiglio-ospite";
    return dailyFamiliarMissionsForCount(seed, romeDateKey(), [], familiarDailyMissionCount(stateRef.current?.level ?? 1)).map((mission) => ({
      ...mission,
      progress: 0,
      complete: false,
      claimed: false,
    }));
  }

  function updateMissionsWithAnnouncement(nextMissions: FamiliarMissionView[], announce: boolean) {
    setMissions(nextMissions);
    if (!announce || typeof window === "undefined") return;
    const ready = nextMissions.filter((mission) => mission.complete && !mission.claimed);
    if (ready.length === 0) return;
    const familiarId = stateRef.current?.familiarId ?? "famiglio-locale";
    const storageKey = `${FAMILIAR_MISSION_ANNOUNCED_STORAGE_PREFIX}:${familiarId}:${romeDateKey()}`;
    let announced = new Set<string>();
    try {
      const saved = JSON.parse(window.localStorage.getItem(storageKey) ?? "[]") as unknown;
      if (Array.isArray(saved)) announced = new Set(saved.filter((value): value is string => typeof value === "string"));
    } catch {
      announced = new Set<string>();
    }
    const fresh = ready.filter((mission) => !announced.has(mission.id));
    if (fresh.length === 0) return;
    fresh.forEach((mission) => announced.add(mission.id));
    window.localStorage.setItem(storageKey, JSON.stringify([...announced]));
    setMissionAnnouncement({ ids: fresh.map((mission) => mission.id), titles: fresh.map((mission) => mission.title) });
    setMessage(fresh.length === 1
      ? `Missione completata: ${fresh[0].title}. La ricompensa è pronta da riscuotere.`
      : `${fresh.length} missioni completate. Le ricompense sono pronte da riscuotere.`);
  }

  function openCompletedMissions() {
    setMissionAnnouncement(null);
    setReturnLoopView("missions");
    if (window.matchMedia("(max-width: 640px)").matches) {
      setMobilePanel("missions");
      return;
    }
    openDashboardView("progress");
  }

  async function loadMissions() {
    setMissionStatus("loading");
    if (isInsecureLanPreview()) {
      setMissions(localMissionPreview());
      setMissionStatus("preview");
      return;
    }
    try {
      const result = await fetch("/api/famiglio/missions", { cache: "no-store", credentials: "same-origin" });
      const payload = await result.json() as MissionApiPayload;
      if (result.status === 401) {
        setMissions(localMissionPreview());
        setMissionStatus("signin");
        return;
      }
      if (!result.ok || !Array.isArray(payload.missions)) throw new Error(payload.error ?? "Missioni non disponibili");
      updateMissionsWithAnnouncement(payload.missions, !payload.localPreview);
      setMissionStatus(payload.localPreview ? "preview" : "active");
    } catch {
      setMissions(localMissionPreview());
      setMissionStatus("error");
    }
  }

  function applySlotPayload(payload: FamiliarSlotsPayload) {
    setFamiliarSlots(Array.isArray(payload.slots) ? payload.slots : []);
    setPurchasedAppearanceIds(Array.isArray(payload.purchasedAppearanceIds) ? payload.purchasedAppearanceIds.filter((entry): entry is string => typeof entry === "string") : []);
    setPurchasedOfferIds(Array.isArray(payload.purchasedOfferIds) ? payload.purchasedOfferIds.filter((entry): entry is string => typeof entry === "string") : []);
    setSlotEntitlement({
      authenticated: payload.authenticated,
      passActive: payload.passActive,
      slotLimit: payload.slotLimit,
      preservedSlotCount: payload.preservedSlotCount,
      canStartPremiumSlot: payload.canStartPremiumSlot,
      status: payload.status,
    });
  }

  async function loadFamiliarSlots() {
    try {
      const result = await fetch("/api/famiglio/slots", { cache: "no-store", credentials: "same-origin" });
      const payload = await result.json() as FamiliarSlotsPayload;
      applySlotPayload(payload);
      if (!result.ok && result.status !== 401) throw new Error(typeof payload.error === "string" ? payload.error : "Slot non disponibili");
    } catch {
      setSlotEntitlement((current) => ({ ...current, authenticated: cloudStatus === "synced" }));
    }
  }

  async function startPremiumFamiliar(candidate: FamiliarAppearance) {
    const chosenName = name.trim().replace(/\s+/g, " ").slice(0, 24);
    if (chosenName.length < 2 || !selectedSex || slotBusy) {
      setMessage("Scegli nome e sesso del nuovo Famiglio prima di occupare lo slot.");
      return;
    }
    setSlotBusy(true);
    try {
      const created = createNexusFamiliar(new Date(), createFamiliarId(), candidate.id, { name: chosenName, sex: selectedSex });
      const result = await fetch("/api/famiglio/slots", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", state: created }),
      });
      const payload = await result.json() as FamiliarSlotsPayload;
      if (!result.ok) throw new Error(typeof payload.error === "string" ? payload.error : "Slot non disponibile");
      const checked = sanitizeFamiliarCloudState(payload.familiar);
      if (!checked.ok) throw new Error(checked.error);
      cloudRevisionRef.current = Math.max(1, Math.floor(Number(payload.revision) || 1));
      cloudSignatureRef.current = JSON.stringify(checked.state);
      cloudReadyRef.current = true;
      updateFamiliarState(checked.state);
      applySlotPayload(payload);
      setCloudStatus("synced");
      setSlotAdoptionOpen(false);
      setRosterOpen(false);
      setMessage(`${checked.state.name} occupa il nuovo slot Universe Pass. Gli altri legami restano intatti.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Non è stato possibile avviare il nuovo slot.");
    } finally {
      setSlotBusy(false);
    }
  }

  async function switchFamiliarSlot(familiarId: string) {
    if (slotBusy || familiarId === stateRef.current?.familiarId) return;
    setSlotBusy(true);
    try {
      const result = await fetch("/api/famiglio/slots", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "switch", familiarId }),
      });
      const payload = await result.json() as FamiliarSlotsPayload;
      if (!result.ok) throw new Error(typeof payload.error === "string" ? payload.error : "Cambio non disponibile");
      const checked = sanitizeFamiliarCloudState(payload.familiar);
      if (!checked.ok) throw new Error(checked.error);
      cloudRevisionRef.current = Math.max(1, Math.floor(Number(payload.revision) || 1));
      cloudSignatureRef.current = JSON.stringify(checked.state);
      updateFamiliarState(applyFamiliarTimePassage(checked.state));
      applySlotPayload(payload);
      setCloudStatus("synced");
      setRosterOpen(false);
      setMessage(`${checked.state.name} è ora il Famiglio attivo. Nessun altro legame è stato cancellato.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Cambio Famiglio temporaneamente non disponibile.");
    } finally {
      setSlotBusy(false);
    }
  }

  async function recordCareMission(sourceKey: FamiliarCareCommand) {
    if (isInsecureLanPreview()) return;
    try {
      await fetch("/api/famiglio/activity", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activity: "familiar_care", sourceKey }),
      });
      await loadMissionsRef.current();
    } catch {
      // La cura del Famiglio resta valida anche se le missioni sono momentaneamente offline.
    }
  }

  async function claimMission(missionId: string) {
    if (missionStatus !== "active" || claimingMission) return;
    setClaimingMission(missionId);
    try {
      const result = await fetch("/api/famiglio/missions", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ missionId }),
      });
      const payload = await result.json() as MissionApiPayload;
      if (!result.ok) throw new Error(payload.error ?? "Ricompensa non disponibile");
      const item = typeof payload.reward?.item === "string" ? payload.reward.item as FamiliarItemKey : null;
      const quantity = Math.max(0, Math.floor(Number(payload.reward?.quantity) || 0));
      const coins = Math.max(0, Math.floor(Number(payload.reward?.coins) || 0));
      const experience = Math.max(0, Math.floor(Number(payload.reward?.experience) || 0));
      const savedChecked = payload.familiar ? sanitizeFamiliarCloudState(payload.familiar) : null;
      if (!item || !FAMILIAR_ITEM_KEYS.includes(item) || quantity <= 0 || !savedChecked?.ok) throw new Error("Ricompensa non valida");
      cloudRevisionRef.current = Math.max(0, Math.floor(Number(payload.revision) || cloudRevisionRef.current));
      cloudSignatureRef.current = JSON.stringify(savedChecked.state);
      updateFamiliarState(savedChecked.state, { kind: "mission", title: "Missione completata", message: `${stateRef.current?.name ?? "Il Famiglio"} ha ricevuto la ricompensa.`, behavior: "sit" });
      setCloudStatus("synced");
      if (Array.isArray(payload.missions)) setMissions(payload.missions);
      setMessage(`Missione completata: ${quantity} ${quantity === 1 ? "oggetto" : "oggetti"}, ${coins} monete Nexus e ${experience} PE.`);
    } catch {
      setMessage("La ricompensa non è stata riscattata. Riprova tra poco.");
    } finally {
      setClaimingMission(null);
    }
  }

  function updateActiveCare(next: FamiliarCareCommand | null) {
    activeCareRef.current = next;
    setActiveCare(next);
  }

  function updateQueuedCare(next: FamiliarCareCommand | null) {
    queuedCareRef.current = next;
    setQueuedCare(next);
  }

  function finishCareAction() {
    const completed = activeCareRef.current;
    setActionRow(null);
    setBehavior("idle");
    setManualRest(false);
    updateActiveCare(null);
    actionTimer.current = null;
    if (completed && !animationPreview && cloudStatus === "local") {
      const count = completedGuestCareActions(guestCompletedActionsRef.current, completed);
      guestCompletedActionsRef.current = count;
      setGuestCompletedActions(count);
      window.localStorage.setItem(FAMILIAR_GUEST_ACTION_STORAGE_KEY, String(count));
      if (shouldShowLoreWiseIdPrompt(count, false) && !window.sessionStorage.getItem(FAMILIAR_ID_PROMPT_STORAGE_KEY)) {
        window.sessionStorage.setItem(FAMILIAR_ID_PROMPT_STORAGE_KEY, "shown");
        setLoreWiseIdPromptOpen(true);
      }
    }
    const next = queuedCareRef.current;
    if (next !== null) {
      updateQueuedCare(null);
      void executeCareCommand(next);
    }
  }

  function animateAction(row: number) {
    setManualRest(false);
    setWalkDuration(0);
    setPosition(50);
    setFlipped(false);
    setActionRow(row);
    const completeCycleDuration = (appearance.actionFrameDurationMs ?? 155) * actionFrameCount(appearance, row) + 120;
    actionTimer.current = window.setTimeout(finishCareAction, Math.max(CARE_ACTION_DURATION, completeCycleDuration));
  }

  function stopAutonomousWalk() {
    if (movementTimer.current) window.clearTimeout(movementTimer.current);
    movementTimer.current = null;
    if (!isMoving) {
      setBehavior((current) => current === "walk" ? "idle" : current);
      return;
    }
    const habitatRect = habitatRef.current?.getBoundingClientRect();
    const petRect = petMoverRef.current?.getBoundingClientRect();
    if (habitatRect && petRect && habitatRect.width > 0) {
      const currentCenter = petRect.left + petRect.width / 2 - habitatRect.left;
      setWalkDuration(0);
      setPosition(Math.min(100, Math.max(0, currentCenter / habitatRect.width * 100)));
    }
    setIsMoving(false);
    setBehavior("idle");
  }

  function startWalk() {
    if (activeDashboardView !== "den" || mobilePanel !== null) {
      stopAutonomousWalk();
      return;
    }
    setManualRest(false);
    if (actionTimer.current) window.clearTimeout(actionTimer.current);
    if (movementTimer.current) window.clearTimeout(movementTimer.current);
    setActionRow(null);
    const habitatWidth = habitatRef.current?.clientWidth ?? 1000;
    const petWidth = petMoverRef.current?.getBoundingClientRect().width ?? 250;
    const plan = planFamiliarWalk(appearance.family, position, habitatWidth, petWidth, activeThemeGeometry.walkBounds);
    if (!plan) {
      setIsMoving(false);
      setBehavior("idle");
      return;
    }
    setWalkDuration(plan.durationMs);
    setFlipped(plan.flipped);
    setPosition(plan.targetPercent);
    setIsMoving(true);
    setBehavior("walk");
    movementTimer.current = window.setTimeout(() => {
      setIsMoving(false);
      setBehavior("idle");
      movementTimer.current = null;
    }, plan.durationMs);
  }

  async function adopt(candidate: FamiliarAppearance) {
    const chosenName = name.trim().replace(/\s+/g, " ").slice(0, 24);
    if (chosenName.length < 2) {
      setMessage("Scegli un nome di almeno due caratteri per il tuo Famiglio.");
      return;
    }
    if (!selectedSex) {
      setMessage("Scegli il sesso del Famiglio prima di accoglierlo.");
      return;
    }
    const created = createNexusFamiliar(new Date(), createFamiliarId(), candidate.id, { name: chosenName, sex: selectedSex });
    await commitEconomyState(created);
    setName(created.name);
    setMessage(`${chosenName} è entrato nella tua tana. Il vostro legame comincia qui.`);
  }

  function selectStarter(candidate: FamiliarAppearance) {
    setSelectedStarterId(candidate.id);
    setSelectedPaletteId(candidate.id);
    setAdoptionPageIndex(PREMIUM_FAMILIARS.some((entry) => entry.id === candidate.id) ? 1 : 0);
    setMessage(`${candidate.name} ti sta osservando. Scopri la sua indole prima di accoglierlo.`);
  }

  function showAdoptionPage(nextPage: number) {
    const safePage = Math.max(0, Math.min(adoptionPages.length - 1, nextPage));
    const firstCandidate = adoptionPages[safePage]?.[0];
    if (firstCandidate) selectStarter(firstCandidate);
    else setAdoptionPageIndex(safePage);
  }

  async function executeCareCommand(command: FamiliarCareCommand) {
    const current = stateRef.current;
    if (!current) return;
    const species = familiarSpeciesProfile(familiarAppearance(current.appearanceId).family);
    stopAutonomousWalk();
    if (!animationPreview && cloudReadyRef.current) {
      const authoritative = await runAuthoritativeCommand("care", command);
      setMessage(authoritative.ok ? `${authoritative.message} ${species.careMessages[command]}` : authoritative.error);
      if (!authoritative.ok) return;
      void loadMissionsRef.current();
    }
    if (command === "rest") {
      if (!animationPreview && !cloudReadyRef.current) {
        const result = restFamiliar(current);
        updateFamiliarState(result.state);
        setMessage(result.ok ? `${result.message} ${species.careMessages.rest}` : result.error);
        if (!result.ok) return;
        void recordCareMission("rest");
      } else {
        setMessage(species.careMessages.rest);
      }
      updateActiveCare("rest");
      playFamiliarCue(appearance.family, command, soundEnabled);
      setActionRow(null);
      setBehavior("rest");
      setManualRest(true);
      actionTimer.current = window.setTimeout(finishCareAction, MANUAL_REST_DURATION);
      return;
    }

    if (!animationPreview && !cloudReadyRef.current) {
      const result = applyFamiliarItem(current, command);
      updateFamiliarState(result.state);
      setMessage(result.ok ? `${result.message} ${species.careMessages[command]}` : result.error);
      if (!result.ok) return;
      void recordCareMission(command);
    } else {
      setMessage(species.careMessages[command]);
    }
    updateActiveCare(command);
    playFamiliarCue(appearance.family, command, soundEnabled);
    animateAction(ACTION_ROW[command]);
  }

  function toggleSound() {
    const next = !soundEnabled;
    setSoundEnabled(next);
    window.localStorage.setItem("lorewise:nexus-familiar:sound:v1", next ? "on" : "off");
  }

  function toggleNeedNotifications() {
    if (notificationsEnabled) {
      setNotificationsEnabled(false);
      window.localStorage.setItem(FAMILIAR_NOTIFICATIONS_STORAGE_KEY, "off");
      window.dispatchEvent(new CustomEvent("lorewise:familiar-notifications-changed"));
      setMessage("Avvisi del Famiglio disattivati. Potrai riattivarli quando vuoi.");
      return;
    }

    setNotificationsEnabled(true);
    window.localStorage.setItem(FAMILIAR_NOTIFICATIONS_STORAGE_KEY, "on");
    window.dispatchEvent(new CustomEvent("lorewise:familiar-notifications-changed"));
    setMessage("Avvisi interni del Famiglio attivati su questo dispositivo.");
    if (typeof Notification === "undefined" || isInsecureLanPreview()) return;
    void (async () => {
      let permission: NotificationPermission = Notification.permission;
      try {
        if (permission !== "granted" && permission !== "denied") permission = await Notification.requestPermission();
      } catch {
        permission = "denied";
      }
      setNotificationPermission(permission);
      if (permission === "granted") setMessage("Avvisi del Famiglio attivati anche fuori dal sito.");
    })();
  }

  function closeTutorial() {
    if (tutorialKind === "initial") window.localStorage.setItem(FAMILIAR_TUTORIAL_STORAGE_KEY, "complete");
    else window.localStorage.setItem(`${FAMILIAR_CONTEXT_TIP_STORAGE_PREFIX}${tutorialKind}`, "seen");
    setTutorialOpen(false);
    setTutorialStep(0);
    if (tutorialKind === "initial") setMobilePanel(null);
    setTutorialKind("initial");
  }

  async function resetFamiliar() {
    const current = stateRef.current;
    if (!current) return;
    const synchronizedAccount = cloudReadyRef.current;
    if (synchronizedAccount) {
      try {
        const result = await fetch("/api/famiglio", { method: "DELETE", credentials: "same-origin" });
        const payload = await result.json() as FamiliarCloudPayload;
        if (!result.ok) {
          if (!isLocalPreviewHost()) {
            setMessage(typeof payload.error === "string" ? payload.error : "Il Famiglio non è stato cancellato. Riprova.");
            return;
          }
          window.localStorage.setItem(FAMILIAR_PENDING_DELETE_STORAGE_KEY, current.familiarId);
          cloudReadyRef.current = false;
          setCloudStatus("local");
        } else {
          window.localStorage.removeItem(FAMILIAR_PENDING_DELETE_STORAGE_KEY);
          cloudRevisionRef.current = Math.max(0, Math.floor(Number(payload.revision) || 0));
          const promoted = sanitizeFamiliarCloudState(payload.familiar);
          if (promoted.ok) {
            const next = applyFamiliarTimePassage(promoted.state, new Date());
            cloudSignatureRef.current = JSON.stringify(next);
            cloudReadyRef.current = true;
            stateRef.current = next;
            setState(next);
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            window.localStorage.removeItem(FAMILIAR_GUEST_ACTION_STORAGE_KEY);
            setGuestCompletedActions(0);
            guestCompletedActionsRef.current = 0;
            setResetStep(0);
            setName("");
            setSelectedSex(null);
            setMessage(`${next.name} è ora il Famiglio attivo. Nessun altro legame è stato eliminato.`);
            window.dispatchEvent(new CustomEvent("lorewise:familiar-updated"));
            void loadFamiliarSlots();
            return;
          }
          cloudSignatureRef.current = "";
        }
      } catch {
        if (!isLocalPreviewHost()) {
          setMessage("Il Famiglio non è stato cancellato: controlla la connessione e riprova.");
          return;
        }
        window.localStorage.setItem(FAMILIAR_PENDING_DELETE_STORAGE_KEY, current.familiarId);
        cloudReadyRef.current = false;
        setCloudStatus("local");
      }
    } else {
      cloudRevisionRef.current = 0;
    }
    cloudReadyRef.current = synchronizedAccount && !window.localStorage.getItem(FAMILIAR_PENDING_DELETE_STORAGE_KEY);
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(FAMILIAR_GUEST_ACTION_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent("lorewise:familiar-updated"));
    stateRef.current = null;
    setState(null);
    setGuestCompletedActions(0);
    guestCompletedActionsRef.current = 0;
    setResetStep(0);
    setName("");
    setSelectedSex(null);
    setMessage("Scegli il nuovo Famiglio. Livello, esperienza e missioni del precedente legame sono stati azzerati.");
    void loadFamiliarSlots();
  }

  function requestCare(command: FamiliarCareCommand) {
    if (!animationPreview && cloudStatus === "local" && shouldRequireLoreWiseIdForNextCare(guestCompletedActionsRef.current, false)) {
      setMobilePanel(null);
      window.location.assign("/account?modalita=registrazione&next=/famiglio");
      return;
    }
    const request = planFamiliarCareRequest(activeCareRef.current, queuedCareRef.current, sleeping);
    if (request.outcome === "blocked") {
      setMessage(request.reason === "sleeping" ? "Il Famiglio sta dormendo. Le cure torneranno disponibili al suo risveglio." : "Hai già scelto la prossima azione. Attendi che venga completata.");
      return;
    }
    if (request.outcome === "queue") {
      updateQueuedCare(command);
      setMessage(`${command === "rest" ? "Riposo" : ITEM_LABELS[command]} in attesa: inizierà appena termina l’azione attuale.`);
      return;
    }
    void executeCareCommand(command);
  }

  async function beginOuting(destinationId: string) {
    const current = stateRef.current;
    if (!current) return;
    const species = familiarSpeciesProfile(familiarAppearance(current.appearanceId).family);
    setOutingNarrative({ phase: "departure", text: species.departure });
    setMessage(species.departure);
    if (cloudReadyRef.current) {
      const authoritative = await runAuthoritativeCommand("outing-start", destinationId);
      setMessage(authoritative.ok ? `${species.departure} ${authoritative.message}` : authoritative.error);
      window.setTimeout(() => setOutingNarrative(null), 2_200);
      return;
    }
    const result = startFamiliarOuting(current, destinationId, new Date());
    if (result.ok) await commitEconomyState(result.state);
    else updateFamiliarState(result.state);
    setMessage(result.ok ? `${species.departure} ${result.message}` : result.error);
    window.setTimeout(() => setOutingNarrative(null), 2_200);
  }

  async function collectOuting() {
    const current = stateRef.current;
    if (!current) return;
    const species = familiarSpeciesProfile(familiarAppearance(current.appearanceId).family);
    const outing = FAMILIAR_DESTINATIONS.find((entry) => entry.id === current.outing?.destinationId);
    const previousDiscoveries = new Set(current.legacy.discoveries.map((entry) => entry.id));
    const previousPostcards = new Set(current.legacy.postcards.map((entry) => entry.id));
    const showSummary = (next: NexusFamiliarState) => {
      if (!outing) return;
      const reward = familiarOutingRewardForLevel(outing, current.level);
      const discovery = FAMILIAR_DISCOVERIES.find((entry) => next.legacy.discoveries.some((found) => found.id === entry.id) && !previousDiscoveries.has(entry.id));
      const postcard = FAMILIAR_POSTCARDS.find((entry) => next.legacy.postcards.some((found) => found.id === entry.id) && !previousPostcards.has(entry.id));
      setOutingSummary({ destination: outing.name, coins: reward.coins, experience: reward.experience, discovery, postcard });
    };
    setOutingNarrative({ phase: "return", text: species.returnHome });
    if (cloudReadyRef.current) {
      const authoritative = await runAuthoritativeCommand("outing-claim");
      if (authoritative.ok) showSummary(authoritative.state);
      setMessage(authoritative.ok ? `${species.returnHome} ${authoritative.message}` : authoritative.error);
      window.setTimeout(() => setOutingNarrative(null), 2_600);
      return;
    }
    const result = claimFamiliarOuting(current);
    if (result.ok) showSummary(result.state);
    if (result.ok) await commitEconomyState(result.state);
    else updateFamiliarState(result.state);
    setMessage(result.ok ? `${species.returnHome} ${result.message}` : result.error);
    window.setTimeout(() => setOutingNarrative(null), 2_600);
  }

  async function claimAttendance() {
    const current = stateRef.current;
    if (!current || ritualBusy) return;
    setRitualBusy(true);
    try {
      if (cloudReadyRef.current) {
        const result = await runAuthoritativeCommand("attendance");
        setMessage(result.ok ? result.message : result.error);
        return;
      }
      const result = claimFamiliarAttendance(current);
      if (result.ok) await commitEconomyState(result.state);
      else updateFamiliarState(result.state);
      setMessage(result.ok ? result.message : result.error);
    } finally {
      setRitualBusy(false);
    }
  }

  function followDailyWish(kind: FamiliarWishKind) {
    if (kind === "outing") {
      openDashboardView("outside");
      setMobilePanel(null);
      return;
    }
    openDashboardView("den");
    setMobilePanel(null);
    setReturnLoopView("missions");
    setMessage("Il desiderio prende vita nella tana…");
    setPendingWishAction(kind === "rest" ? "rest" : kind);
  }

  async function buyOrEquipTheme(offerId: string) {
    const current = stateRef.current;
    if (!current) return;
    if (cloudReadyRef.current) {
      const authoritative = await runAuthoritativeCommand("theme", offerId);
      if (authoritative.ok) setPreviewThemeId(null);
      setMessage(authoritative.ok ? authoritative.message : authoritative.error);
      return;
    }
    const result = purchaseFamiliarThemeWithCoins(current, offerId);
    if (result.ok) await commitEconomyState(result.state);
    else updateFamiliarState(result.state);
    if (result.ok) setPreviewThemeId(null);
    setMessage(result.ok ? result.message : result.error);
  }

  async function buyOrEquipGadget(gadgetId: string) {
    const current = stateRef.current;
    if (!current) return;
    if (cloudReadyRef.current) {
      const authoritative = await runAuthoritativeCommand("gadget", gadgetId);
      if (authoritative.ok) setPreviewEquippedGadgetId(null);
      setMessage(authoritative.ok ? authoritative.message : authoritative.error);
      return;
    }
    const result = purchaseFamiliarGadgetWithCoins(current, gadgetId);
    if (result.ok) await commitEconomyState(result.state);
    else updateFamiliarState(result.state);
    if (result.ok) setPreviewEquippedGadgetId(null);
    setMessage(result.ok ? result.message : result.error);
  }

  async function openPaidFamiliarCheckout(offerId: string) {
    setMessage("Preparazione del pagamento protetto…");
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productType: "merchandise", productCode: `LW-FAM-${offerId.toUpperCase()}` }),
      });
      const payload = await response.json() as { checkoutUrl?: unknown; error?: unknown };
      if (!response.ok || typeof payload.checkoutUrl !== "string") throw new Error(typeof payload.error === "string" ? payload.error : "Pagamento non disponibile.");
      window.location.assign(payload.checkoutUrl);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Pagamento non disponibile.");
    }
  }

  if (!hydrated) return <main className={styles.loading}><h1>Famigli del Nexus</h1><p>Il Nexus sta preparando la tana…</p></main>;

  if (!state) {
    return (
      <main
        ref={dashboardPageRef}
        className={`${styles.page} ${styles.adoptionPage}`}
        style={{ "--stage-viewport-height": `${desktopStageFit.viewportHeight}px` } as CSSProperties}
      >
        <section className={styles.mobileAdoption} aria-labelledby="mobile-adoption-title">
          <header className={styles.mobileAdoptionHeader}>
            <p className={styles.eyebrow}>IL PRIMO INCONTRO</p>
            <h1 id="mobile-adoption-title">Scegli il tuo Famiglio</h1>
            <p>Osservalo, personalizzalo e accoglilo nella tua tana.</p>
          </header>

          <div className={styles.mobileSpotlight} style={{ "--mobile-pet-size": `${mobileSpotlightSize}px`, "--mobile-spotlight-bottom-offset": `${mobileSpotlightBottomOffset}px` } as CSSProperties}>
            <Image
              className={styles.mobileSpotlightBackdrop}
              src="/famiglio/scenes/prato-celeste-selezione-v1.png"
              alt=""
              fill
              priority
              sizes="100vw"
              aria-hidden="true"
            />
            <BehaviorSprite key={`mobile-${selectedStarter.id}`} appearance={selectedStarter} behavior="idle" className={styles.mobileSpotlightSprite} />
            <div className={styles.mobileSpotlightName}>
              <strong>{selectedFamily.name}</strong>
              <span>{selectedFamily.temperament}</span>
            </div>
          </div>

          <div className={styles.mobileFamiliarPicker} aria-label="Scegli la specie del Famiglio">
            {availableAdoptionFamilies.map((candidate) => (
              <button key={candidate.id} type="button" aria-pressed={selectedFamily.id === candidate.id} onClick={() => selectStarter(candidate)}>
                <BehaviorSprite appearance={candidate} behavior="idle" className={styles.mobilePickerSprite} />
                <span>{candidate.family}</span>
              </button>
            ))}
          </div>

          <section className={styles.mobileAdoptionCard} aria-live="polite" aria-labelledby="mobile-selected-familiar">
            <div className={styles.mobileSelectedIntro}>
              <div>
                <p className={styles.eyebrow}>FAMIGLIO SELEZIONATO</p>
                <h2 id="mobile-selected-familiar">{selectedFamily.name}</h2>
              </div>
              <dl>
                <div><dt>Taglia</dt><dd>{selectedFamily.profile.size}</dd></div>
                <div><dt>Legame</dt><dd>{selectedFamily.profile.bond}</dd></div>
              </dl>
            </div>
            <p className={styles.mobileSelectedDescription}>{selectedFamily.profile.description}</p>

            <div className={styles.mobilePalettePicker} aria-label={`Colorazione di ${selectedFamily.name}`}>
              <span>Colorazione</span>
              <div>
                {paletteOptions.map((palette) => (
                  <button key={palette.id} type="button" aria-pressed={selectedStarter.id === palette.id} onClick={() => setSelectedPaletteId(palette.id)}>
                    <i>{palette.swatches.map((swatch) => <b key={swatch} style={{ backgroundColor: swatch }} />)}</i>
                    <em>{palette.label}</em>
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.mobileIdentityPicker}>
              <label htmlFor="mobile-starter-name">Nome</label>
              <input id="mobile-starter-name" value={name} maxLength={24} placeholder="Scrivi il suo nome" onChange={(event) => setName(event.target.value)} />
              <span>Sesso</span>
              <div>
                <button type="button" aria-pressed={selectedSex === "female"} onClick={() => setSelectedSex("female")}><b aria-hidden="true">♀</b><em>Femmina</em></button>
                <button type="button" aria-pressed={selectedSex === "male"} onClick={() => setSelectedSex("male")}><b aria-hidden="true">♂</b><em>Maschio</em></button>
              </div>
            </div>

            <button type="button" className={styles.mobileAdoptButton} onClick={() => adopt(selectedStarter)} disabled={name.trim().length < 2 || selectedSex === null}>
              Accogli {selectedFamily.name}
            </button>
          </section>
        </section>

        <section className={styles.adoptionStage} aria-labelledby="adoption-title">
          <div className={styles.adoptionCanvas}>
          <Image className={styles.sceneImage} src="/famiglio/scenes/prato-celeste-selezione-v1.png" alt="Prato incantato del Nexus sotto un cielo luminoso" fill priority sizes="100vw" />
          <div className={styles.adoptionCopy}>
            <p className={styles.eyebrow}>IL PRIMO INCONTRO</p>
            <h1 id="adoption-title">Chi entrerà<br />nella tua tana?</h1>
            <p>Osservali, scegli d’istinto e comincia a prendertene cura.</p>
          </div>
          <div className={styles.starters}>
            {visibleAdoptionFamilies.map((candidate, index) => {
              const preview = selectedFamily.id === candidate.id ? selectedStarter : candidate;
              const adoptionDimensions = FAMILIAR_STAGE_SIZES[familiarDisplayFamily(candidate.family)];
              const premiumNichePositions = [13.5, 31.5, 68.5, 86.5];
              const nicheX = adoptionPageIndex === 1 ? premiumNichePositions[index] ?? 50 : candidate.adoption.nicheX;
              return (
                <button
                  type="button"
                  className={styles.starter}
                  key={candidate.id}
                  onClick={() => selectStarter(candidate)}
                  aria-pressed={selectedFamily.id === candidate.id}
                  style={{
                    "--niche-x": `${nicheX}%`,
                    "--adoption-size": `min(${(adoptionDimensions.desktop / 15.36).toFixed(3)}vw, ${adoptionDimensions.desktop}px)`,
                    "--adoption-mobile-size": `${adoptionDimensions.mobile}px`,
                    "--adoption-shift": `${candidate.adoption.baselineShift}%`,
                  } as CSSProperties}
                >
                  <span className={styles.starterScene}>
                    <BehaviorSprite key={preview.id} appearance={preview} behavior="idle" />
                  </span>
                  <strong>{candidate.name}</strong>
                  <span>{candidate.temperament}</span>
                </button>
              );
            })}
          </div>
          {adoptionPages.length > 1 ? <nav className={styles.adoptionPager} aria-label="Sfoglia le collezioni di Famigli">
            <button type="button" onClick={() => showAdoptionPage(adoptionPageIndex - 1)} disabled={adoptionPageIndex === 0} aria-label="Famigli precedenti">‹</button>
            <span><strong>{adoptionPageIndex === 0 ? "Famigli iniziali" : "Famigli premium"}</strong><small>{adoptionPageIndex + 1} / {adoptionPages.length}</small></span>
            <button type="button" onClick={() => showAdoptionPage(adoptionPageIndex + 1)} disabled={adoptionPageIndex === adoptionPages.length - 1} aria-label="Famigli successivi">›</button>
          </nav> : null}
          <p className={styles.adoptionHint}>{message}</p>
          </div>
        </section>
        <section className={styles.starterProfile} aria-live="polite" aria-labelledby="selected-familiar-title">
          <div className={styles.profileIntro}>
            <p className={styles.eyebrow}>FAMIGLIO SELEZIONATO</p>
            <h2 id="selected-familiar-title">{selectedFamily.name}</h2>
            <p>{selectedFamily.profile.description}</p>
          </div>
          <div className={styles.profileOptions}>
            <dl className={styles.profileFacts}>
              <div><dt>Specie</dt><dd>{selectedFamily.family}</dd></div>
              <div><dt>Taglia</dt><dd>{selectedFamily.profile.size}</dd></div>
              <div><dt>Legame</dt><dd>{selectedFamily.profile.bond}</dd></div>
            </dl>
            <div className={styles.palettePicker} aria-label={`Colorazione di ${selectedFamily.name}`}>
              <span>Colorazione</span>
              <div>
                {paletteOptions.map((palette) => (
                  <button key={palette.id} type="button" aria-pressed={selectedStarter.id === palette.id} onClick={() => setSelectedPaletteId(palette.id)}>
                    <i>{palette.swatches.map((swatch) => <b key={swatch} style={{ backgroundColor: swatch }} />)}</i>
                    <em>{palette.label}</em>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className={styles.identityPicker}>
            <label htmlFor="starter-name">Il suo nome</label>
            <input id="starter-name" value={name} maxLength={24} placeholder="Scrivi un nome" onChange={(event) => setName(event.target.value)} />
            <span>Sesso</span>
            <div className={styles.sexPicker}>
              <button type="button" aria-pressed={selectedSex === "female"} onClick={() => setSelectedSex("female")}><b aria-hidden="true">♀</b><em>Femmina</em></button>
              <button type="button" aria-pressed={selectedSex === "male"} onClick={() => setSelectedSex("male")}><b aria-hidden="true">♂</b><em>Maschio</em></button>
            </div>
          </div>
          <button type="button" className={styles.adoptButton} onClick={() => adopt(selectedStarter)} disabled={name.trim().length < 2 || selectedSex === null}>
            Accogli {selectedFamily.name}
          </button>
        </section>
      </main>
    );
  }

  return (
    <main
      ref={dashboardPageRef}
      className={`${styles.page} ${styles.dashboardPage}`}
      data-familiar-dashboard
      style={{
        "--stage-scale": String(desktopStageFit.scale),
        "--stage-viewport-height": `${desktopStageFit.viewportHeight}px`,
        "--desktop-type-scale": String(Math.min(1.5, Math.max(1.18, 1 / Math.max(.01, desktopStageFit.scale)))),
      } as CSSProperties}
    >
      {loreWiseIdPromptOpen ? <section className={styles.premiumModalBackdrop} role="presentation">
        <div className={styles.premiumModal} role="dialog" aria-modal="true" aria-labelledby="familiar-id-prompt-title">
          <img src="/famiglio/navigation/tana-v1.webp" alt="" />
          <p className={styles.eyebrow}>PROTEGGI IL VOSTRO LEGAME</p>
          <h2 id="familiar-id-prompt-title">Due cure vere. Ora non perdere ciò che avete iniziato.</h2>
          <p>Puoi continuare come ospite, ma il LoreWise ID rende il Famiglio parte sicura del tuo universo.</p>
          <ol>{FAMILIAR_ID_ADVANTAGES.map((advantage, index) => <li key={advantage}><span>0{index + 1}</span>{advantage}</li>)}</ol>
          <div><Link href="/account?modalita=registrazione&next=/famiglio">Crea il LoreWise ID</Link><button type="button" onClick={() => setLoreWiseIdPromptOpen(false)}>Continua come ospite</button></div>
        </div>
      </section> : null}
      {rosterOpen ? <section className={styles.premiumModalBackdrop} role="presentation">
        <div ref={rosterDialogRef} className={`${styles.premiumModal} ${styles.rosterModal}`} role="dialog" aria-modal="true" aria-labelledby="familiar-roster-title">
          <p className={styles.eyebrow}>LOREWISE ID · SLOT FAMIGLIO</p>
          <h2 id="familiar-roster-title">I vostri legami restano al sicuro.</h2>
          <p>{slotEntitlement.status === "active"
            ? "Universe Pass attivo: puoi allevare fino a tre Famigli."
            : slotEntitlement.status === "expired-preserved"
              ? "Il Pass non è attivo: i Famigli già allevati restano disponibili, ma non puoi avviare nuovi slot premium."
              : slotEntitlement.authenticated === false
                ? "Accedi al LoreWise ID per controllare il Universe Pass e sincronizzare gli slot."
                : "Il Famiglio principale è disponibile senza abbonamento."}</p>
          <div className={styles.rosterGrid} aria-label="Slot Famiglio disponibili">
            {[0, 1, 2].map((index) => {
              const slot = familiarSlots[index];
              const slotAvailable = index === 0 || slotEntitlement.passActive || Boolean(slot);
              return <article key={slot?.familiarId ?? `slot-${index + 1}`} data-locked={!slotAvailable}>
                <span>Slot {index + 1}{index > 0 ? " · Universe Pass" : ""}</span>
                {slot ? <>
                  <BehaviorSprite appearance={familiarAppearance(slot.appearanceId)} behavior="idle" className={styles.rosterSprite} />
                  <strong>{slot.name}</strong><small>Livello {slot.level} · {slot.growthStage}</small>
                  <button type="button" disabled={slot.active || slotBusy} onClick={() => void switchFamiliarSlot(slot.familiarId)}>{slot.active ? "Attivo" : "Scegli"}</button>
                </> : <>
                  <strong>{slotAvailable ? "Pronto ad accogliere" : "Pass richiesto"}</strong>
                  <small>{index === 0 ? "Slot principale" : slotEntitlement.passActive ? "Il nuovo legame parte dal livello 1" : "Si riapre alla riattivazione del Pass"}</small>
                  {index > 0 && slotEntitlement.canStartPremiumSlot
                    ? <button type="button" onClick={() => { setName(""); setSelectedSex(null); setSelectedStarterId(STARTER_FAMILIARS[0].id); setSelectedPaletteId(STARTER_FAMILIARS[0].id); setSlotAdoptionOpen(true); }}>Accogli</button>
                    : null}
                </>}
              </article>;
            })}
          </div>
          {slotAdoptionOpen ? <section className={styles.slotAdoption} aria-labelledby="slot-adoption-title">
            <div><BehaviorSprite appearance={selectedStarter} behavior="idle" className={styles.slotAdoptionSprite} /><div><span className={styles.eyebrow}>NUOVO SLOT</span><h3 id="slot-adoption-title">{selectedFamily.name}</h3><p>{selectedFamily.profile.description}</p></div></div>
            <nav aria-label="Specie del nuovo Famiglio">{slotAdoptionCandidates.map((candidate) => <button type="button" key={candidate.id} aria-pressed={selectedStarter.id === candidate.id} onClick={() => selectStarter(candidate)}><BehaviorSprite appearance={candidate} behavior="idle" /><span>{candidate.family}</span></button>)}</nav>
            <label>Nome<input value={name} maxLength={24} onChange={(event) => setName(event.target.value)} /></label>
            <fieldset><legend>Sesso</legend><button type="button" aria-pressed={selectedSex === "female"} onClick={() => setSelectedSex("female")}>Femmina</button><button type="button" aria-pressed={selectedSex === "male"} onClick={() => setSelectedSex("male")}>Maschio</button></fieldset>
            <div><button type="button" onClick={() => setSlotAdoptionOpen(false)}>Annulla</button><button type="button" disabled={slotBusy || name.trim().length < 2 || !selectedSex} onClick={() => void startPremiumFamiliar(selectedStarter)}>{slotBusy ? "Attendi…" : "Avvia il nuovo legame"}</button></div>
          </section> : null}
          <div>{slotEntitlement.authenticated === false ? <Link href="/account?next=/famiglio">Accedi al LoreWise ID</Link> : null}<button type="button" onClick={() => { setSlotAdoptionOpen(false); setRosterOpen(false); }}>Chiudi</button></div>
        </div>
      </section> : null}
      {tutorialOpen ? <section className={styles.guidedTutorialLayer} role="dialog" aria-modal="true" aria-labelledby="familiar-tutorial-title">
        <span className={styles.guidedTutorialSpotlight} style={tutorialSpotlight} aria-hidden="true" />
        <article ref={tutorialCoachRef} className={`${styles.guidedTutorialCoach} ${styles[`guidedTutorialCoach_${tutorialCoachPlacement.replace("-", "_")}`]}`}>
          <div><span>{tutorialKind === "initial" ? "GUIDA DEI FAMIGLI" : `GUIDA · ${FAMILIAR_CONTEXTUAL_TUTORIAL_LABELS[tutorialKind]}`}</span><strong>{tutorialStep + 1} / {tutorialSteps.length}</strong></div>
          <h2 id="familiar-tutorial-title">{tutorialSteps[tutorialStep].title}</h2>
          <p>{tutorialSteps[tutorialStep].copy}</p>
          <footer>
            <button type="button" onClick={closeTutorial}>Chiudi guida</button>
            <button type="button" onClick={() => setTutorialStep((current) => Math.max(0, current - 1))} disabled={tutorialStep === 0}>Indietro</button>
            {tutorialStep < tutorialSteps.length - 1
              ? <button type="button" onClick={() => setTutorialStep((current) => Math.min(tutorialSteps.length - 1, current + 1))}>Continua</button>
              : <button type="button" onClick={closeTutorial}>{tutorialKind === "initial" ? "Entra nella tana" : "Ho capito"}</button>}
          </footer>
        </article>
      </section> : null}
      {resetStep ? <section className={styles.premiumModalBackdrop} role="presentation">
        <div className={styles.premiumModal} role="alertdialog" aria-modal="true" aria-labelledby="reset-familiar-title">
          <p className={styles.eyebrow}>CAMBIA FAMIGLIO · CONFERMA {resetStep} DI 2</p><h2 id="reset-familiar-title">{resetStep === 1 ? "Vuoi interrompere questo legame?" : "Ultima conferma: non potrai recuperare i progressi."}</h2>
          <p>Perderai livello, esperienza, giorni di cura, missioni, monete, sfondi, look, ricordi, personalità, reperti e cartoline del Famiglio attuale.</p>
          <div><button type="button" onClick={() => setResetStep(0)}>Annulla</button>{resetStep === 1 ? <button type="button" onClick={() => setResetStep(2)}>Conferma la perdita</button> : <button type="button" className={styles.dangerAction} onClick={() => void resetFamiliar()}>Cancella e ricomincia</button>}</div>
        </div>
      </section> : null}
      {missionAnnouncement ? <aside className={styles.missionAnnouncement} role="status" aria-live="assertive" aria-atomic="true">
        <img src={NAV_ICONS.missions} alt="" width={64} height={64} />
        <div>
          <span>MISSIONE COMPLETATA</span>
          <strong>{missionAnnouncement.titles.length === 1 ? missionAnnouncement.titles[0] : `${missionAnnouncement.titles.length} missioni completate`}</strong>
          <small>{missionAnnouncement.titles.length === 1 ? "La ricompensa è pronta da riscuotere." : "Le ricompense sono pronte da riscuotere."}</small>
        </div>
        <button type="button" onClick={openCompletedMissions}>Apri missioni</button>
        <button type="button" className={styles.missionAnnouncementClose} onClick={() => setMissionAnnouncement(null)} aria-label="Chiudi l’annuncio della missione">×</button>
      </aside> : null}
      {outingSummary ? <section className={styles.outingSummaryBackdrop} role="presentation">
        <article className={styles.outingSummary} role="dialog" aria-modal="true" aria-labelledby="outing-summary-title">
          {outingSummary.postcard ? <img className={styles.outingSummaryPostcard} src={outingSummary.postcard.image} alt={`Cartolina: ${outingSummary.postcard.title}`} /> : <img className={styles.outingSummarySeal} src={NAV_ICONS.outside} alt="" />}
          <div><span className={styles.eyebrow}>RITORNO DALLA PASSEGGIATA</span><h2 id="outing-summary-title">Bentornato dal {outingSummary.destination}</h2>
            <p>Il viaggio è diventato un nuovo frammento della vostra storia.</p>
            <ul><li><strong>+{outingSummary.coins}</strong> monete Nexus</li><li><strong>+{outingSummary.experience}</strong> PE</li>{outingSummary.discovery ? <li><img src={outingSummary.discovery.icon} alt="" /><span>Nuovo reperto: <strong>{outingSummary.discovery.name}</strong> · {outingSummary.discovery.rarity}</span></li> : null}</ul>
            {outingSummary.postcard ? <blockquote><strong>Nuova cartolina: {outingSummary.postcard.title}</strong><span>{outingSummary.postcard.message}</span></blockquote> : null}
            <button type="button" onClick={() => setOutingSummary(null)}>Conserva nel diario</button>
          </div>
        </article>
      </section> : null}
      <section className={styles.dashboardShell}>
        <header className={styles.dashboardHeader}>
        <div className={styles.identityCard} data-tutorial-target="identity">
          <p className={styles.eyebrow}>COMPAGNO DEL NEXUS</p>
          <h1>{state.name}</h1>
          <dl className={styles.familiarTraits}>
            <div><dt>Specie</dt><dd>{appearance.family}</dd></div>
            <div><dt>Sesso</dt><dd>{state.sex === "female" ? "Femmina" : state.sex === "male" ? "Maschio" : "Non indicato"}</dd></div>
            <div><dt>Crescita</dt><dd>{state.growthStage}</dd></div>
            <div><dt>Umore</dt><dd>{condition}</dd></div>
          </dl>
        </div>
        <div className={styles.headerStatus}>
            <div className={styles.level}><span>Livello</span><strong>{state.level}</strong><small>{state.level === MAX_FAMILIAR_LEVEL ? "Livello massimo" : `${state.experience} / ${nextLevelAt} PE`}</small></div>
          <p className={`${styles.cloudStatus} ${styles[`cloudStatus_${cloudStatus}`]}`} role="status">
            {cloudStatus === "checking" ? "Cerco il tuo Famiglio nel LoreWise ID…"
              : cloudStatus === "syncing" ? "Salvataggio nel LoreWise ID…"
                : cloudStatus === "synced" ? "Salvato nel LoreWise ID"
                  : cloudStatus === "local" ? "Salvato su questo dispositivo · accedi al LoreWise ID per sincronizzare"
                    : "Salvataggio locale attivo · sincronizzazione da riprovare"}
          </p>
          {cloudStatus === "error" ? <button type="button" className={styles.cloudRetry} onClick={() => setCloudCheckNonce((current) => current + 1)}>Riprova sincronizzazione</button> : null}
          <div className={styles.managementActions} data-tutorial-target="utilities"><button type="button" onClick={toggleSound} aria-pressed={soundEnabled}>{soundEnabled ? "Suoni attivi" : "Suoni disattivati"}</button><button type="button" onClick={toggleNeedNotifications} aria-pressed={notificationsEnabled}>{notificationsEnabled ? "Avvisi attivi" : "Attiva avvisi"}</button><button type="button" onClick={openTutorialForCurrentSection}>Guida</button><button type="button" onClick={() => { setRosterOpen(true); void loadFamiliarSlots(); }}>I miei Famigli</button><button type="button" onClick={() => setResetStep(1)}>Cambia Famiglio</button></div>
        </div>
        </header>

        <nav className={styles.focusTabs} aria-label="Sezioni del Famiglio">
          <button type="button" aria-pressed={activeDashboardView === "den"} onClick={() => openDashboardView("den")}>
            <span>01</span><img src={NAV_ICONS.den} alt="" width={34} height={34} /><strong>Tana</strong>
          </button>
          <button type="button" aria-pressed={activeDashboardView === "outside"} onClick={() => openDashboardView("outside")}>
            <span>02</span><img src={NAV_ICONS.outside} alt="" width={34} height={34} /><strong>Fuori casa</strong>
          </button>
          <button type="button" aria-pressed={activeDashboardView === "shop"} onClick={() => openDashboardView("shop")}>
            <span>03</span><img src={NAV_ICONS.shop} alt="" width={34} height={34} /><strong>Shop</strong>
          </button>
          <button type="button" aria-pressed={activeDashboardView === "legacy"} onClick={() => openDashboardView("legacy")}>
            <span>04</span><img src={NAV_ICONS.legacy} alt="" width={34} height={34} /><strong>Legame</strong>
          </button>
          <button type="button" aria-pressed={activeDashboardView === "progress"} onClick={() => openDashboardView("progress")}>
            <span>05</span><img src={NAV_ICONS.missions} alt="" width={34} height={34} /><strong>Missioni</strong>
          </button>
        </nav>

        <nav className={styles.mobileGameControls} aria-label="Comandi rapidi del Famiglio">
          <button
            type="button"
            className={mobilePanel === "actions" ? styles.mobileControlActive : ""}
            aria-expanded={mobilePanel === "actions"}
            aria-controls="mobile-care-drawer"
            onClick={() => toggleMobilePanel("actions")}
          >
            <img src={NEED_ICONS.happiness} alt="" width={42} height={42} />
            <span>Cura</span>
          </button>
          <button type="button" className={mobilePanel === "outside" ? styles.mobileControlActive : ""} aria-expanded={mobilePanel === "outside"} aria-controls="mobile-outside-drawer" onClick={() => toggleMobilePanel("outside")}>
            <img src={NAV_ICONS.outside} alt="" width={42} height={42} /><span>Fuori</span>
          </button>
          <button type="button" className={mobilePanel === "shop" ? styles.mobileControlActive : ""} aria-expanded={mobilePanel === "shop"} aria-controls="mobile-shop-drawer" onClick={() => toggleMobilePanel("shop")}>
            <img src={NAV_ICONS.shop} alt="" width={42} height={42} /><span>Shop</span>
          </button>
          <button type="button" className={mobilePanel === "legacy" ? styles.mobileControlActive : ""} aria-expanded={mobilePanel === "legacy"} aria-controls="mobile-legacy-drawer" onClick={() => toggleMobilePanel("legacy")}>
            <img src={NAV_ICONS.legacy} alt="" width={42} height={42} /><span>Legame</span>
          </button>
          <button
            type="button"
            className={mobilePanel === "missions" ? styles.mobileControlActive : ""}
            aria-expanded={mobilePanel === "missions"}
            aria-controls="mobile-missions-drawer"
            onClick={() => toggleMobilePanel("missions")}
          >
            <img src={NAV_ICONS.missions} alt="" width={42} height={42} />
            <span>Missioni</span>
          </button>
        </nav>
        {mobilePanel ? <button type="button" className={styles.mobileDrawerGuide} onClick={openTutorialForCurrentSection}><img src={NAV_ICONS.tutorial} alt="" /> Guida</button> : null}
        <p className={styles.mobileMessage} role="status">{message}</p>
        <section className={styles.mobileGrowthBar} aria-label={`Crescita ed evoluzione: livello ${state.level}, ${state.experience} punti esperienza su ${nextLevelAt}`}>
          <div className={styles.mobileGrowthHeading}>
            <span>Crescita ed evoluzione</span>
            <strong>{state.growthStage}</strong>
          </div>
          <div className={styles.mobileExperience}>
            <div><span>Livello {state.level}</span><strong>{state.level === MAX_FAMILIAR_LEVEL ? "MAX" : `${state.experience} / ${nextLevelAt} PE`}</strong></div>
            <div className={styles.mobileExperienceMeter} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={levelProgress}>
              <span style={{ width: `${levelProgress}%` }} />
            </div>
          </div>
          <small>{state.caredDays.length} {state.caredDays.length === 1 ? "giorno" : "giorni"} di cura</small>
        </section>

        <div className={`${styles.gameDeck} ${activeDashboardView === "den" ? styles.denDeck : styles.progressDeck}`}>
          <div className={styles.primaryFocus}>
              <div className={`${styles.denFocus} ${activeDashboardView === "den" ? styles.desktopViewActive : ""}`}>
                <section ref={habitatRef} className={styles.habitat} aria-label="Tana del Famiglio">
                  <Image className={styles.sceneImage} src={activeCycle.background} alt={`Tana illustrata frontale del Famiglio durante ${activeCycle.label.toLowerCase()}`} fill priority sizes="(max-width: 1380px) 100vw, 1380px" />
                  {outingNarrative ? <aside className={styles.outingNarrative} data-phase={outingNarrative.phase} role="status"><span>{outingNarrative.phase === "departure" ? "PARTENZA" : "RITORNO"}</span><strong>{outingNarrative.text}</strong></aside> : null}
                  {previewThemeId || previewEquippedGadgetId || previewFamiliarId ? <aside className={styles.themePreviewNotice} role="status"><span>{previewFamiliarId ? "Prova Famiglio premium locale · nessun acquisto" : previewEquippedGadgetId ? "Prova gadget temporanea · nessun acquisto" : "Anteprima temporanea · nessun acquisto effettuato"}</span><button type="button" onClick={() => { setPreviewThemeId(null); setPreviewEquippedGadgetId(null); setPreviewFamiliarId(null); setMessage("È stato ripristinato il Famiglio e la tana già in uso."); }}>Ripristina</button></aside> : null}
                  {!state.outing ? <div ref={petMoverRef} className={styles.petMover} data-moving={isMoving} data-tutorial-target="habitat" style={{ ...petStageStyle, "--pet-position": `${position}%`, "--walk-duration": `${walkDuration}ms` } as CSSProperties}>
                      {actionRow === null
                        ? <BehaviorSprite key={`${visibleBehavior}-${visibleGadgetId ?? "senza-gadget"}`} appearance={dressedAppearance} behavior={visibleBehavior} flipped={flipped} className={styles.heroSprite} />
                        : <ActionSprite appearance={dressedAppearance} row={actionRow} className={styles.heroSprite} />}
                      {sleeping && actionRow === null && behavior === "rest" ? <img className={styles.sleepEffect} src="/famiglio/effects/sonno-zzz-v2-discreto.png" alt="Il Famiglio dorme" /> : null}
                    </div> : <div className={styles.awayNotice} data-tutorial-target="habitat">
                      <img src={activeOuting?.icon ?? "/famiglio/time-icons/alba-v1.png"} alt="" />
                      <div className={styles.awayNoticeCopy} role="status">
                        <strong>{state.name} è fuori casa</strong>
                        <span>{outingSeconds > 0 ? `Rientra tra ${Math.floor(outingSeconds / 60)}:${String(outingSeconds % 60).padStart(2, "0")}` : "È pronto a rientrare"}</span>
                      </div>
                    </div>}
                  <p className={styles.speech}>{message}</p>
                  <div className={styles.nexusClock} aria-label={`Ore ${activeCycle.time}`}>
                    <img src={activeCycle.icon} alt="" width={72} height={72} />
                    <strong>{activeCycle.time}</strong>
                  </div>
                </section>
                <div className={styles.mobilePetIdentity}>
                  <div><strong>{state.name}</strong><button type="button" className={`${styles.mobileCloudStatus} ${styles[`cloudStatus_${cloudStatus}`]}`} onClick={() => cloudStatus === "error" && setCloudCheckNonce((current) => current + 1)} disabled={cloudStatus !== "error"}>{cloudStatus === "checking" ? "Controllo LoreWise ID…" : cloudStatus === "syncing" ? "Sincronizzazione…" : cloudStatus === "synced" ? "Sincronizzato" : cloudStatus === "local" ? "Salvataggio locale" : "Errore temporaneo · tocca per riprovare"}</button></div>
                  <span>Livello {state.level} · {state.growthStage}</span>
                </div>
                <section className={styles.mobileDenOverview} aria-label="Qui e ora del Famiglio">
                  <header><span>QUI E ORA</span><strong>{BEHAVIOR_LABELS[visibleBehavior]}</strong></header>
                  <div>
                    <article><img src={NAV_ICONS.den} alt="" /><span>Momento</span><strong>{condition}</strong></article>
                    <article><img src={NEED_ICONS[lowestNeed]} alt="" /><span>Da osservare</span><strong>{NEED_LABELS[lowestNeed]} {Math.round(visibleNeeds[lowestNeed])}</strong></article>
                    <article><img src={NAV_ICONS.shop} alt="" /><span>Per la tana</span><strong>{state.nexusCoins} monete</strong></article>
                  </div>
                  <button type="button" onClick={() => setMobilePanel("actions")}><img src={NEED_ICONS.happiness} alt="" /> Prenditene cura</button>
                  <div className={styles.mobileUtilityActions} data-tutorial-target="utilities"><button type="button" onClick={toggleSound} aria-pressed={soundEnabled}><img src={NAV_ICONS.sound} alt="" /><strong>{soundEnabled ? "Suono attivo" : "Suono spento"}</strong></button><button type="button" onClick={toggleNeedNotifications} aria-pressed={notificationsEnabled}><img src={NAV_ICONS.notifications} alt="" /><strong>{notificationsEnabled ? "Avvisi attivi" : "Attiva avvisi"}</strong></button><button type="button" onClick={openTutorialForCurrentSection}><img src={NAV_ICONS.tutorial} alt="" /><strong>Guida</strong></button><button type="button" onClick={() => { setRosterOpen(true); void loadFamiliarSlots(); }}><img src={NAV_ICONS.den} alt="" /><strong>Famigli</strong></button><button type="button" onClick={() => setResetStep(1)}><img src={NAV_ICONS.change} alt="" /><strong>Cambia</strong></button></div>
                </section>
              </div>
              <section id="mobile-outside-drawer" className={`${styles.featurePanel} ${activeDashboardView === "outside" ? styles.desktopViewActive : ""} ${mobilePanel === "outside" ? styles.mobileDrawerOpen : ""}`} aria-label="Fuori casa" aria-hidden={mobilePanel !== "outside" && activeDashboardView !== "outside"} data-tutorial-target="outside">
                <span className={styles.drawerHandle} aria-hidden="true" />
                <button type="button" className={styles.mobileDrawerClose} onClick={() => setMobilePanel(null)} aria-label="Chiudi fuori casa">×</button>
                <header className={styles.featureHeader} data-tutorial-target="outside-intro"><div><span className={styles.eyebrow}>FUORI CASA</span><h2>Piccole avventure, vere ricompense.</h2><p>{Math.max(0, MAX_DAILY_FAMILIAR_OUTINGS - state.dailyProgress.outingsStarted)} uscite disponibili oggi</p></div><strong className={styles.coinBalance}>{state.nexusCoins} monete</strong></header>
                {state.outing && activeOuting ? (
                  <article className={styles.activeOuting} data-tutorial-target="outside-options">
                    <img src={activeOuting.icon} alt="" width={88} height={88} />
                    <div><small>Avventura in corso</small><h3>{activeOuting.name}</h3><p>{outingSeconds > 0 ? `Rientro tra ${Math.floor(outingSeconds / 60)}:${String(outingSeconds % 60).padStart(2, "0")}` : "È tornato: ritira la ricompensa."}</p></div>
                    <button type="button" onClick={collectOuting} disabled={outingSeconds > 0}>{outingSeconds > 0 ? "In viaggio" : "Accoglilo"}</button>
                  </article>
                ) : (
                  <div className={styles.featureCards} data-tutorial-target="outside-options">
                    {FAMILIAR_DESTINATIONS.map((destination) => <article key={destination.id}>
                      <img src={destination.icon} alt="" width={76} height={76} /><div><h3>{destination.name}</h3><p>{destination.description}</p><small>{destination.minimumLevel && state.level < destination.minimumLevel ? `Si apre al livello ${destination.minimumLevel}` : `${destination.minutes} min · -${destination.energyCost} energia · +${destination.reward.coins} monete`}</small></div>
                      <button type="button" onClick={() => beginOuting(destination.id)} disabled={state.dailyProgress.outingsStarted >= MAX_DAILY_FAMILIAR_OUTINGS || state.level < (destination.minimumLevel ?? 1) || state.needs.energy < destination.energyCost}>{state.dailyProgress.outingsStarted >= MAX_DAILY_FAMILIAR_OUTINGS ? "Domani" : state.level < (destination.minimumLevel ?? 1) ? `Liv. ${destination.minimumLevel}` : "Parti"}</button>
                    </article>)}
                  </div>
                )}
              </section>

              <section id="mobile-shop-drawer" className={`${styles.featurePanel} ${activeDashboardView === "shop" ? styles.desktopViewActive : ""} ${mobilePanel === "shop" ? styles.mobileDrawerOpen : ""}`} aria-label="Shop del Famiglio" aria-hidden={mobilePanel !== "shop" && activeDashboardView !== "shop"} data-tutorial-target="shop">
                <span className={styles.drawerHandle} aria-hidden="true" />
                <button type="button" className={styles.mobileDrawerClose} onClick={() => setMobilePanel(null)} aria-label="Chiudi lo shop">×</button>
                <header className={styles.featureHeader}><div><span className={styles.eyebrow}>BOTTEGA DEL FAMIGLIO</span><h2>Tane complete, look e nuovi compagni.</h2></div><strong className={styles.coinBalance}>{state.nexusCoins} monete</strong></header>
                <nav className={styles.shopSectionTabs} aria-label="Reparti della Bottega" data-tutorial-target="shop-tabs">
                  {SHOP_SECTIONS.map((section, index) => <button key={section.id} type="button" aria-pressed={activeShopSectionId === section.id} onClick={() => setActiveShopSectionId(section.id)}>
                    <span>0{index + 1}</span><img src={section.icon} alt="" /><strong>{section.shortLabel}</strong>
                  </button>)}
                </nav>
                <div className={styles.shopSections} data-tutorial-target="shop-content"><section className={styles.shopSection} aria-labelledby={`shop-${activeShopSection.id}`}>
                  <header><span>{activeShopSection.id === "ambienti" ? "01" : activeShopSection.id === "oggetti" ? "02" : "03"}</span><div><h3 id={`shop-${activeShopSection.id}`}>{activeShopSection.label}</h3><p>{activeShopSection.description}</p></div></header>
                  <div className={styles.shopGrid}>{FAMILIAR_SHOP_OFFERS.filter((offer) => activeShopSection.kinds.some((kind) => kind === offer.kind) && (!offer.compatibleFamilies || offer.compatibleFamilies.includes(appearance.family))).map((offer) => {
                  const gadgetId = offer.kind === "gadget" ? offer.id : null;
                  const owned = Boolean((offer.themeId && state.den.unlockedThemes.includes(offer.themeId)) || (gadgetId && state.den.unlockedGadgets.includes(gadgetId)));
                  const active = Boolean((offer.themeId && state.den.theme === offer.themeId && !previewThemeId) || (gadgetId && (state.den.equippedGadget === gadgetId || previewEquippedGadgetId === gadgetId)));
                  const price = offer.priceCoins ? `${offer.priceCoins} monete` : `€ ${((offer.priceCents ?? 0) / 100).toFixed(2).replace(".", ",")}`;
                  const premiumAppearance = offer.kind === "familiar" && offer.appearanceId ? PREMIUM_FAMILIARS.find((entry) => entry.id === offer.appearanceId) : null;
                  const paidOwned = purchasedOfferIds.includes(offer.id) || Boolean(gadgetId && owned)
                    || Boolean(premiumAppearance && purchasedAppearanceIds.includes(premiumAppearance.id))
                    || (offer.bundleCategory === "familiars" && PREMIUM_FAMILIARS.every((candidate) => purchasedAppearanceIds.includes(candidate.id)));
                  const previewLook = () => {
                    setPreviewEquippedGadgetId(offer.id);
                    setActiveDashboardView("den");
                    setMobilePanel(null);
                    setMessage(`${offer.name} selezionato in prova: osserva il look durante movimenti e azioni.`);
                  };
                  return <article key={offer.id} data-kind={offer.kind}>
                    {premiumAppearance ? <BehaviorSprite appearance={premiumAppearance} behavior="idle" loop className={styles.shopFamiliarSprite} /> : <img src={offer.icon} alt="" width={220} height={120} />}
                    <h3>{offer.name}</h3><p>{offer.description}</p><strong>{price}</strong>
                    <div className={styles.shopActions}>
                      {offer.kind === "theme" && offer.themeId ? <button type="button" onClick={() => { setPreviewThemeId(offer.themeId ?? null); setActiveDashboardView("den"); setMobilePanel(null); setMessage(`Anteprima di ${offer.name}: la luce seguirà l'orario reale.`); }}>Anteprima</button> : null}
                      {offer.kind === "gadget" ? <button type="button" onClick={previewLook} disabled={previewEquippedGadgetId === offer.id}>{previewEquippedGadgetId === offer.id ? "Look selezionato" : animationPreview ? "Seleziona look" : "Prova sul Famiglio"}</button> : null}
                      {premiumAppearance && animationPreview ? <button type="button" onClick={() => { setPreviewFamiliarId(premiumAppearance.id); setPreviewEquippedGadgetId(null); setActiveDashboardView("den"); setMobilePanel(null); setMessage(`${premiumAppearance.name}: prova locale sbloccata. Puoi controllare camminata e azioni senza acquistarlo.`); }}>Prova gratis</button> : null}
                      {offer.kind === "theme" ? <button type="button" onClick={() => buyOrEquipTheme(offer.id)} disabled={active || (!owned && state.nexusCoins < (offer.priceCoins ?? 0))}>{active ? "In uso" : owned ? "Usa" : "Sblocca"}</button>
                        : offer.kind === "gadget" ? (animationPreview ? null : offer.priceCoins
                          ? <button type="button" onClick={() => buyOrEquipGadget(offer.id)} disabled={active || (!owned && state.nexusCoins < offer.priceCoins)}>{active ? "Indossato" : owned ? "Indossa" : "Sblocca"}</button>
                          : <button type="button" disabled={active} onClick={() => paidOwned ? void buyOrEquipGadget(offer.id) : void openPaidFamiliarCheckout(offer.id)}>{active ? "Indossato" : paidOwned ? "Indossa" : "Acquista"}</button>)
                          : <button type="button" disabled={paidOwned} onClick={() => void openPaidFamiliarCheckout(offer.id)}>{paidOwned ? "Disponibile" : "Acquista"}</button>}
                    </div>
                  </article>;
                })}</div></section></div>
              </section>
              <section id="mobile-legacy-drawer" className={`${styles.legacyFocus} ${activeDashboardView === "legacy" ? styles.desktopViewActive : ""} ${mobilePanel === "legacy" ? styles.mobileDrawerOpen : ""}`} aria-label="Diario, personalità e scoperte" aria-hidden={mobilePanel !== "legacy" && activeDashboardView !== "legacy"} data-tutorial-target="legacy">
                <span className={styles.drawerHandle} aria-hidden="true" />
                <button type="button" className={styles.mobileDrawerClose} onClick={() => setMobilePanel(null)} aria-label="Chiudi il legame">×</button>
                <NexusFamiliarLegacy state={state} familiarFamily={appearance.family} familiarGroundStyle={legacyGroundStyle} initialView={initialLegacyView} familiarSprite={<BehaviorSprite appearance={dressedAppearance} behavior="idle" className={styles.legacyPetSprite} />} />
              </section>
      <section
        id="mobile-missions-drawer"
        className={`${styles.lowerDeck} ${styles.missionsDrawer} ${activeDashboardView === "progress" ? styles.desktopViewActive : ""} ${mobilePanel === "missions" ? styles.mobileDrawerOpen : ""}`}
        aria-label="Missioni e crescita del Famiglio"
        aria-hidden={mobilePanel !== "missions" && activeDashboardView !== "progress"}
      >
        <span className={styles.drawerHandle} aria-hidden="true" />
        <button type="button" className={styles.mobileDrawerClose} onClick={() => setMobilePanel(null)} aria-label="Chiudi le missioni">×</button>
        <section className={styles.missionsPanel} aria-label="Missioni e rituali del Famiglio" data-tutorial-target="missions">
        <nav className={styles.returnLoopTabs} aria-label="Missioni e rituali quotidiani" data-tutorial-target="missions-tabs">
          <button type="button" aria-pressed={returnLoopView === "missions"} onClick={() => setReturnLoopView("missions")}><img src={NAV_ICONS.missions} alt="" /><span>Missioni</span></button>
          <button type="button" aria-pressed={returnLoopView === "attendance"} onClick={() => setReturnLoopView("attendance")}><img src="/famiglio/needs/salute-v2.png" alt="" /><span>Presenze</span></button>
          <button type="button" aria-pressed={returnLoopView === "wish"} onClick={() => setReturnLoopView("wish")}><img src="/famiglio/needs/felicita-v2.png" alt="" /><span>Desiderio</span></button>
        </nav>
        <div className={styles.missionView} hidden={returnLoopView !== "missions"}>
        <header className={styles.missionsHeader}>
          <div><span className={styles.eyebrow}>MISSIONI DI OGGI</span><h2 id="daily-missions-title">{missions.length === 4 ? "Quattro motivi per tornare." : "Tre piccoli motivi per tornare."}</h2></div>
          <p>{missionStatus === "loading" ? "Il Nexus sta scegliendo le tue missioni…"
            : missionStatus === "active" ? "Personali per oggi · cambiano domani a mezzanotte"
              : missionStatus === "preview" ? "Anteprima locale · i progressi si attiveranno online"
                : missionStatus === "signin" ? "Accedi al LoreWise ID per attivare progressi e ricompense"
                  : "Anteprima disponibile · la sincronizzazione verrà riprovata"}</p>
        </header>
        <div className={styles.missionList} data-tutorial-target="mission-list">
          {missions.map((mission, index) => {
            const percentage = Math.min(100, Math.round(mission.progress / Math.max(1, mission.target) * 100));
            return (
              <article key={mission.id} className={mission.claimed ? styles.missionClaimed : ""}>
                <span className={styles.missionNumber}>0{index + 1}</span>
                <div className={styles.missionCopy}>
                  <small>{MISSION_GROUP_LABELS[mission.group]}</small>
                  <h3>{mission.title}</h3>
                  <p>{mission.description}</p>
                  <div className={styles.missionProgress} role="progressbar" aria-label={`Progresso: ${mission.progress} su ${mission.target}`} aria-valuemin={0} aria-valuemax={mission.target} aria-valuenow={mission.progress}>
                    <i style={{ width: `${percentage}%` }} />
                  </div>
                  <strong>{mission.progress} / {mission.target}</strong>
                </div>
                <div className={styles.missionReward}>
                  <img className={styles.itemIcon} src={ITEM_ICONS[mission.reward.item]} alt="" width={38} height={38} loading="lazy" decoding="async" />
                  <span><small>Ricompensa</small><strong>{mission.reward.quantity}× {REWARD_LABELS[mission.reward.item]} · +{mission.group === "connect" ? 8 : mission.group === "explore" ? 6 : 5} monete</strong></span>
                  {mission.claimed ? <button type="button" disabled>Riscattata</button>
                    : mission.complete && missionStatus === "active"
                      ? <button type="button" onClick={() => void claimMission(mission.id)} disabled={claimingMission !== null}>{claimingMission === mission.id ? "Attendi…" : "Riscuoti"}</button>
                      : <Link href={missionStatus === "signin" ? "/account" : mission.href}>{missionStatus === "signin" ? "Accedi e inizia" : "Vai alla missione"}</Link>}
                </div>
              </article>
            );
          })}
        </div>
        <section className={styles.milestoneRoadmap} aria-label="Vantaggi di crescita del Famiglio" data-tutorial-target="growth">
          <header><span className={styles.eyebrow}>FINO AL LIVELLO {MAX_FAMILIAR_LEVEL}</span><h3>Il legame apre nuove parti del Nexus.</h3></header>
          <div>{FAMILIAR_MILESTONES.map((milestone) => <article key={milestone.level} data-unlocked={state.level >= milestone.level} data-claimed={state.claimedMilestoneLevels.includes(milestone.level)}>
            <strong>{milestone.level}</strong><span><b>{milestone.title}</b><small>{milestone.benefit}</small><em>Premio: {milestone.rewardLabel}</em></span>
          </article>)}</div>
        </section>
        </div>
        {returnLoopView !== "missions" ? <div className={styles.ritualView} data-tutorial-target="ritual"><NexusFamiliarRituals state={state} view={returnLoopView} busy={ritualBusy} onAttendance={() => void claimAttendance()} onWish={followDailyWish} /></div> : null}
        </section>

      </section>
          </div>

          <section className={styles.careGrid} aria-label="Esigenze e azioni sempre disponibili">
            <div className={styles.needsPanel} data-tutorial-target="needs">
              <div className={styles.panelTitle}><span>01</span><h2>Come sta</h2></div>
              <div className={styles.needs}>
                {FAMILIAR_NEED_KEYS.map((key) => <NeedMeter key={key} needKey={key} label={NEED_LABELS[key]} value={visibleNeeds[key]} />)}
              </div>
            </div>
            <div id="mobile-care-drawer" className={`${styles.actionsPanel} ${mobilePanel === "actions" ? styles.mobileDrawerOpen : ""}`} data-tutorial-target="care">
              <span className={styles.drawerHandle} aria-hidden="true" />
              <button type="button" className={styles.mobileDrawerClose} onClick={() => setMobilePanel(null)} aria-label="Chiudi le azioni">×</button>
              <div className={styles.panelTitle}><span>02</span><h2>Prenditene cura</h2></div>
              <div className={styles.actions}>
                {(["food", "soap", "toy", "medicine"] as FamiliarItemKey[]).map((item) => (
                  <button type="button" key={item} onClick={() => { requestCare(item); setMobilePanel(null); }} disabled={sleeping || queuedCare !== null || (!animationPreview && state.inventory[item] <= 0)}>
                    <img className={styles.itemIcon} src={ITEM_ICONS[item]} alt="" width={52} height={52} loading="eager" decoding="async" />
                    <span><strong><span className={styles.desktopActionLabel}>{ITEM_LABELS[item]}</span><span className={styles.mobileActionLabel}>{MOBILE_ITEM_LABELS[item]}</span></strong><small>{activeCare === item ? "In corso" : queuedCare === item ? "In attesa" : `Disponibili: ${state.inventory[item]}`}</small></span>
                  </button>
                ))}
                <button type="button" onClick={() => { requestCare("rest"); setMobilePanel(null); }} disabled={sleeping || queuedCare !== null}>
                  <img className={styles.itemIcon} src={NEED_ICONS.energy} alt="" width={52} height={52} loading="eager" decoding="async" />
                  <span><strong><span className={styles.desktopActionLabel}>Fai riposare</span><span className={styles.mobileActionLabel}>Riposa</span></strong><small>{activeCare === "rest" ? "Sta dormendo" : queuedCare === "rest" ? "In attesa" : "Recupera energia"}</small></span>
                </button>
              </div>
            </div>
            <section className={styles.progressPanel}>
              <div><span className={styles.eyebrow}>CRESCITA ED EVOLUZIONE</span><h2>Ogni cura lascia un segno.</h2></div>
              <p className={styles.nextBenefit}>{nextMilestone ? <>Prossimo vantaggio al livello <strong>{nextMilestone.level}</strong>: {nextMilestone.title} · {nextMilestone.rewardLabel}</> : <><strong>Livello massimo</strong>: Custode leggendario.</>}</p>
              <div className={styles.progressFacts}>
                <p><strong>{state.caredDays.length}</strong><span>giorni di cura</span></p>
                <p><strong>{state.experience}</strong><span>esperienza</span></p>
                <p><strong>{state.den.unlockedGadgets.length}</strong><span>gadget sbloccati</span></p>
                <p><strong>{unlockedMilestones.length}</strong><span>vantaggi ottenuti</span></p>
              </div>
            </section>
          </section>
        </div>
      </section>
    </main>
  );
}
