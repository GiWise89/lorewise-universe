import { combatMoveById, type CombatAffinity, type CombatMove, type CombatStatus } from "./famiglioCombatCatalog.ts";
import type { FamiliarCombatEventPhase, FamiliarCombatTimelineEvent } from "./famiglioCombat.ts";

export type FamiliarCombatPresentationElement = CombatAffinity | "ghiaccio" | "fulmine" | "veleno";
export type FamiliarCombatPresentationPlacement = "actor" | "target" | "travel" | "arena";

export type FamiliarCombatVfxSheet = {
  id: string;
  path: string;
  frameWidth: number;
  frameHeight: number;
  columns: number;
  rows: number;
  frameCount: number;
  fps: number;
  loop: boolean;
};

export type FamiliarCombatMovePresentation = {
  element: FamiliarCombatPresentationElement;
  windupVfxId: string;
  travelVfxId: string | null;
  impactVfxId: string;
  statusVfxId: string | null;
  audioId: string;
  usesAdvance: boolean;
  usesProjectile: boolean;
};

export type FamiliarCombatPresentationCue = {
  eventId: string;
  phase: FamiliarCombatEventPhase;
  placement: FamiliarCombatPresentationPlacement;
  vfx: FamiliarCombatVfxSheet | null;
  audioId: string | null;
  audioPath: string | null;
  durationMs: number;
  directionAware: boolean;
  blendMode: "normal" | "screen";
  scale: number;
};

function sheet(
  id: string,
  file: string,
  frameWidth: number,
  frameHeight: number,
  _sourceColumns: number,
  _sourceRows: number,
  frameCount: number,
  fps: number,
  loop = false,
): FamiliarCombatVfxSheet {
  return {
    id,
    path: `/famiglio/rebuild/combat/vfx/${file}`,
    frameWidth,
    frameHeight,
    columns: frameCount,
    rows: 1,
    frameCount,
    fps,
    loop,
  };
}

export const FAMILIAR_COMBAT_VFX_SHEETS: Readonly<Record<string, FamiliarCombatVfxSheet>> = {
  cast: sheet("cast", "cast-frontal.png", 192, 192, 5, 3, 15, 24),
  motion: sheet("motion", "motion-arrow.png", 192, 192, 5, 4, 20, 28),
  projectile: sheet("projectile", "projectile-bolt.png", 192, 192, 5, 4, 20, 28),
  impact: sheet("impact", "impact-light.png", 192, 192, 5, 3, 15, 30),
  block: sheet("block", "block-circle.png", 192, 192, 5, 4, 20, 24),
  hit: sheet("hit", "hit-heavy.png", 192, 192, 5, 3, 15, 30),
  win: sheet("win", "win-wave.png", 192, 192, 5, 3, 15, 22),
  lose: sheet("lose", "lose-fade.png", 192, 192, 5, 3, 15, 20),

  "veleno-cast": sheet("veleno-cast", "element-veleno-cast.png", 128, 128, 6, 6, 32, 24),
  "veleno-projectile": sheet("veleno-projectile", "element-veleno-projectile.png", 64, 64, 6, 8, 48, 30),
  "veleno-impact": sheet("veleno-impact", "element-veleno-impact.png", 64, 64, 6, 6, 32, 30),
  "vento-cast": sheet("vento-cast", "element-vento-cast.png", 128, 128, 6, 6, 32, 24),
  "vento-projectile": sheet("vento-projectile", "element-vento-projectile.png", 64, 64, 6, 8, 48, 30),
  "vento-impact": sheet("vento-impact", "element-vento-impact.png", 64, 64, 6, 6, 32, 30),
  "arcano-cast": sheet("arcano-cast", "element-arcano-cast.png", 128, 128, 6, 6, 32, 24),
  "arcano-projectile": sheet("arcano-projectile", "element-arcano-projectile.png", 64, 64, 6, 8, 48, 30),
  "arcano-impact": sheet("arcano-impact", "element-arcano-impact.png", 64, 64, 6, 6, 32, 30),
  "natura-cast": sheet("natura-cast", "element-natura-cast.png", 128, 128, 6, 6, 32, 24),
  "natura-projectile": sheet("natura-projectile", "element-natura-projectile.png", 64, 64, 6, 8, 48, 30),
  "natura-impact": sheet("natura-impact", "element-natura-impact.png", 64, 64, 6, 6, 32, 30),
  "ardore-cast": sheet("ardore-cast", "element-ardore-cast.png", 120, 120, 6, 4, 24, 24),
  "ardore-projectile": sheet("ardore-projectile", "element-ardore-projectile.png", 64, 64, 6, 8, 48, 30),
  "ardore-impact": sheet("ardore-impact", "element-ardore-impact.png", 64, 64, 6, 6, 32, 30),
  "antico-cast": sheet("antico-cast", "element-antico-cast.png", 128, 128, 6, 6, 32, 24),
  "antico-projectile": sheet("antico-projectile", "element-antico-projectile.png", 64, 64, 6, 8, 48, 30),
  "antico-impact": sheet("antico-impact", "element-antico-impact.png", 64, 64, 6, 6, 32, 30),
  "ghiaccio-cast": sheet("ghiaccio-cast", "element-ghiaccio-cast.png", 64, 64, 6, 6, 32, 24),
  "ghiaccio-projectile": sheet("ghiaccio-projectile", "element-ghiaccio-projectile.png", 120, 120, 6, 8, 48, 30),
  "ghiaccio-impact": sheet("ghiaccio-impact", "element-ghiaccio-impact.png", 64, 64, 4, 4, 16, 28),
  "fulmine-cast": sheet("fulmine-cast", "element-fulmine-cast.png", 128, 128, 6, 6, 32, 28),
  "fulmine-projectile": sheet("fulmine-projectile", "element-fulmine-projectile.png", 64, 64, 6, 8, 48, 32),
  "fulmine-impact": sheet("fulmine-impact", "element-fulmine-impact.png", 64, 64, 6, 6, 32, 32),
  "marea-cast": sheet("marea-cast", "element-marea-cast.png", 128, 128, 8, 4, 32, 24),
  "marea-projectile": sheet("marea-projectile", "element-marea-projectile.png", 64, 64, 6, 8, 48, 30),
  "marea-impact": sheet("marea-impact", "element-marea-impact.png", 64, 64, 6, 6, 32, 30),

  "premium-asunder": sheet("premium-asunder", "premium/magic-asunder.png", 64, 80, 19, 1, 19, 24),
  "premium-black-hole": sheet("premium-black-hole", "premium/magic-black-hole.png", 64, 48, 45, 1, 45, 30),
  "premium-douse": sheet("premium-douse", "premium/magic-douse.png", 96, 64, 27, 1, 27, 28),
  "premium-fireball": sheet("premium-fireball", "premium/magic-fireball.png", 96, 64, 14, 1, 14, 26),
  "premium-impact": sheet("premium-impact", "premium/magic-impact.png", 64, 48, 4, 1, 4, 24),
  "premium-terra-spike": sheet("premium-terra-spike", "premium/magic-terra-spike.png", 96, 32, 24, 1, 24, 28),
  "premium-thunderbolt": sheet("premium-thunderbolt", "premium/magic-thunderbolt.png", 64, 80, 24, 1, 24, 28),
  "premium-vine-boom": sheet("premium-vine-boom", "premium/magic-vine-boom.png", 96, 32, 34, 1, 34, 30),
  "premium-whirlwind": sheet("premium-whirlwind", "premium/magic-whirlwind.png", 64, 48, 19, 1, 19, 26),
  "ultimate-natura": sheet("ultimate-natura", "premium/skyfall-natura.png", 96, 96, 24, 1, 24, 28),
  "ultimate-marea": sheet("ultimate-marea", "premium/skyfall-marea.png", 96, 96, 24, 1, 24, 28),
  "ultimate-ardore": sheet("ultimate-ardore", "premium/skyfall-ardore.png", 96, 96, 24, 1, 24, 28),
  "ultimate-vento": sheet("ultimate-vento", "premium/skyfall-vento.png", 96, 96, 24, 1, 24, 28),
  "ultimate-arcano": sheet("ultimate-arcano", "premium/skyfall-arcano.png", 96, 96, 24, 1, 24, 28),
  "ultimate-antico": sheet("ultimate-antico", "premium/skyfall-antico.png", 96, 96, 24, 1, 24, 28),

  "status-armatura": sheet("status-armatura", "status-armatura.png", 64, 64, 4, 4, 16, 20),
  "status-focus": sheet("status-focus", "status-focus.png", 64, 64, 4, 4, 16, 20),
  "status-burn": sheet("status-burn", "status-burn.png", 64, 64, 4, 4, 16, 20),
  "status-freeze": sheet("status-freeze", "status-freeze.png", 64, 64, 4, 4, 16, 20),
  "status-poison": sheet("status-poison", "status-poison.png", 64, 64, 4, 4, 16, 20, true),
  "status-sleep": sheet("status-sleep", "status-sleep.png", 64, 64, 4, 4, 16, 20, true),
  "status-heal": sheet("status-heal", "status-heal.png", 64, 64, 4, 4, 16, 20),
  "status-regen": sheet("status-regen", "status-regen.png", 64, 64, 4, 4, 16, 20, true),
  "status-guard": sheet("status-guard", "status-guard.png", 64, 64, 4, 4, 16, 20),
  "status-shock": sheet("status-shock", "status-shock.png", 64, 64, 4, 4, 16, 20),
  "status-slow": sheet("status-slow", "status-slow.png", 64, 64, 4, 4, 16, 20),
  "status-weaken": sheet("status-weaken", "status-weaken.png", 64, 64, 4, 4, 16, 20),
};

export const FAMILIAR_COMBAT_AUDIO_PATHS: Readonly<Record<string, string>> = Object.freeze({
  cast: "/famiglio/rebuild/combat/audio/cast.wav",
  motion: "/famiglio/rebuild/combat/audio/motion.wav",
  impact: "/famiglio/rebuild/combat/audio/impact.wav",
  block: "/famiglio/rebuild/combat/audio/block.wav",
  hit: "/famiglio/rebuild/combat/audio/hit.wav",
  win: "/famiglio/rebuild/combat/audio/win.wav",
  lose: "/famiglio/rebuild/combat/audio/lose.wav",
  "affinity-fire": "/famiglio/rebuild/combat/audio/affinity-fire.wav",
  "affinity-water": "/famiglio/rebuild/combat/audio/affinity-water.wav",
  "affinity-wind": "/famiglio/rebuild/combat/audio/affinity-wind.wav",
  "affinity-nature": "/famiglio/rebuild/combat/audio/affinity-nature.wav",
  "affinity-arcane": "/famiglio/rebuild/combat/audio/affinity-arcane.wav",
  "affinity-ancient": "/famiglio/rebuild/combat/audio/affinity-ancient.wav",
  "affinity-ice": "/famiglio/rebuild/combat/audio/affinity-ice.wav",
  "affinity-lightning": "/famiglio/rebuild/combat/audio/affinity-lightning.wav",
  "affinity-poison": "/famiglio/rebuild/combat/audio/affinity-poison.wav",
  heal: "/famiglio/rebuild/combat/audio/heal.wav",
});

type ElementSet = { cast: string; projectile: string; impact: string; audio: string };

export const FAMILIAR_COMBAT_ELEMENT_SETS: Readonly<Record<FamiliarCombatPresentationElement, ElementSet>> = {
  natura: { cast: "natura-cast", projectile: "natura-projectile", impact: "premium-vine-boom", audio: "affinity-nature" },
  marea: { cast: "marea-cast", projectile: "marea-projectile", impact: "premium-douse", audio: "affinity-water" },
  ardore: { cast: "ardore-cast", projectile: "ardore-projectile", impact: "premium-fireball", audio: "affinity-fire" },
  vento: { cast: "vento-cast", projectile: "vento-projectile", impact: "premium-whirlwind", audio: "affinity-wind" },
  arcano: { cast: "arcano-cast", projectile: "arcano-projectile", impact: "premium-black-hole", audio: "affinity-arcane" },
  antico: { cast: "antico-cast", projectile: "antico-projectile", impact: "premium-asunder", audio: "affinity-ancient" },
  ghiaccio: { cast: "ghiaccio-cast", projectile: "ghiaccio-projectile", impact: "ultimate-marea", audio: "affinity-ice" },
  fulmine: { cast: "fulmine-cast", projectile: "fulmine-projectile", impact: "premium-thunderbolt", audio: "affinity-lightning" },
  veleno: { cast: "veleno-cast", projectile: "veleno-projectile", impact: "ultimate-natura", audio: "affinity-poison" },
};

export const FAMILIAR_COMBAT_ULTIMATE_VFX: Readonly<Record<CombatAffinity, string>> = {
  natura: "ultimate-natura",
  marea: "ultimate-marea",
  ardore: "ultimate-ardore",
  vento: "ultimate-vento",
  arcano: "ultimate-arcano",
  antico: "ultimate-antico",
};

const STATUS_PRESENTATION: Readonly<Record<CombatStatus, { vfx: string; audio: string }>> = {
  burn: { vfx: "status-burn", audio: "affinity-fire" },
  freeze: { vfx: "status-freeze", audio: "affinity-ice" },
  poison: { vfx: "status-poison", audio: "affinity-poison" },
  paralysis: { vfx: "status-shock", audio: "affinity-lightning" },
  sleep: { vfx: "status-sleep", audio: "cast" },
  slow: { vfx: "status-slow", audio: "affinity-water" },
  weaken: { vfx: "status-weaken", audio: "impact" },
  guard: { vfx: "status-guard", audio: "block" },
  regen: { vfx: "status-regen", audio: "heal" },
  focus: { vfx: "status-focus", audio: "cast" },
};

export function familiarCombatPresentationElement(move: CombatMove): FamiliarCombatPresentationElement {
  const identity = `${move.id} ${move.name} ${move.vfx} ${move.audio}`.toLowerCase();
  if (move.status === "freeze" || /ice|frost|brina|ghiacc|glac/.test(identity)) return "ghiaccio";
  if (move.status === "paralysis") return "fulmine";
  if (move.status === "poison") return "veleno";
  if (move.status === "sleep") return "arcano";
  if (/lightning|electric|thunder|fulmin|shock|tonant/.test(identity)) return "fulmine";
  if (/poison|toxic|acid|velen|spore|corrosi/.test(identity)) return "veleno";
  return move.affinity;
}

export function familiarCombatMovePresentation(move: CombatMove): FamiliarCombatMovePresentation {
  const element = familiarCombatPresentationElement(move);
  const elementSet = FAMILIAR_COMBAT_ELEMENT_SETS[element];
  const status = move.status ? STATUS_PRESENTATION[move.status] : null;
  const restore = move.damageClass === "restore";
  const physical = move.damageClass === "physical";
  return {
    element,
    windupVfxId: restore ? "status-heal" : physical ? "motion" : elementSet.cast,
    travelVfxId: move.animation === "projectile" ? elementSet.projectile : move.animation === "charge" ? "motion" : null,
    impactVfxId: restore
      ? "status-regen"
      : move.source === "ultimate"
        ? FAMILIAR_COMBAT_ULTIMATE_VFX[move.affinity]
        : physical
          ? "premium-impact"
          : elementSet.impact,
    statusVfxId: status?.vfx ?? (move.damageClass === "status" ? "status-focus" : null),
    audioId: restore ? "heal" : status?.audio ?? (physical ? "impact" : elementSet.audio),
    usesAdvance: move.animation === "charge",
    usesProjectile: move.animation === "projectile",
  };
}

function cue(
  event: FamiliarCombatTimelineEvent,
  placement: FamiliarCombatPresentationPlacement,
  vfxId: string | null,
  audioId: string | null,
  options: { directionAware?: boolean; blendMode?: "normal" | "screen"; scale?: number } = {},
): FamiliarCombatPresentationCue {
  const vfx = vfxId ? FAMILIAR_COMBAT_VFX_SHEETS[vfxId] ?? null : null;
  const naturalDurationMs = vfx && !vfx.loop ? Math.round(vfx.frameCount / vfx.fps * 1000) : 0;
  return {
    eventId: event.id,
    phase: event.phase,
    placement,
    vfx,
    audioId,
    audioPath: audioId ? FAMILIAR_COMBAT_AUDIO_PATHS[audioId] ?? null : null,
    durationMs: Math.max(event.durationMs, naturalDurationMs),
    directionAware: options.directionAware ?? false,
    blendMode: options.blendMode ?? "screen",
    scale: options.scale ?? 1,
  };
}

export function familiarCombatPresentationCue(
  event: FamiliarCombatTimelineEvent,
  suppliedMove?: CombatMove | null,
): FamiliarCombatPresentationCue {
  const move = suppliedMove ?? combatMoveById(event.moveId) ?? null;
  const movePresentation = move ? familiarCombatMovePresentation(move) : null;
  if (event.phase === "result") {
    const victory = /victory|vittoria|win/i.test(`${event.vfxCue} ${event.message}`);
    return cue(event, "actor", victory ? "win" : "lose", victory ? "win" : "lose", { scale: 1.15 });
  }
  if (event.phase === "advance") return cue(event, "travel", "motion", "motion", { directionAware: true, scale: 0.85 });
  if (event.phase === "return") return cue(event, "travel", "motion", null, { directionAware: true, scale: 0.75 });
  if (event.phase === "reaction") return cue(event, "target", "hit", "hit", { scale: 0.9 });
  if (event.phase === "guard") return cue(event, "target", movePresentation?.statusVfxId ?? "status-guard", "block", { scale: 0.95 });
  if (event.phase === "status") {
    const eventStatus = event.statusId && event.statusId in STATUS_PRESENTATION
      ? STATUS_PRESENTATION[event.statusId as CombatStatus]
      : null;
    const statusVfx = eventStatus?.vfx ?? movePresentation?.statusVfxId ?? (event.actionKind === "heal" ? "status-heal" : "status-focus");
    const primaryStatusAction = move?.damageClass === "status" || move?.damageClass === "restore" || !move;
    return cue(event, event.targetId === event.actorId ? "actor" : "target", statusVfx, primaryStatusAction ? eventStatus?.audio ?? movePresentation?.audioId ?? "cast" : null, { scale: 0.82 });
  }
  if (event.phase === "projectile") return cue(event, "travel", movePresentation?.travelVfxId ?? "projectile", movePresentation?.audioId ?? "cast", { directionAware: true, scale: 0.9 });
  if (event.phase === "impact") {
    if (event.missed) return cue(event, "target", null, null, { scale: 0.9 });
    const impactAudio = event.amount === 0
      ? null
      : move?.damageClass === "physical" || move?.animation === "projectile"
        ? "impact"
        : movePresentation?.audioId ?? "impact";
    return cue(event, "target", movePresentation?.impactVfxId ?? "impact", impactAudio, { scale: 1.05 });
  }
  const windupAudio = move?.damageClass === "physical" ? null : "cast";
  return cue(event, "actor", movePresentation?.windupVfxId ?? "cast", windupAudio, { scale: 0.9 });
}
