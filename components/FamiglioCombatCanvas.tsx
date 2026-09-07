"use client";

import { useEffect, useMemo, useRef, type CSSProperties } from "react";
import type { FamiliarCombatTimelineEvent } from "../lib/famiglioCombat.ts";
import { familiarCombatMotionProfile, familiarCombatTravelProgress } from "../lib/famiglioCombatMotion.ts";
import type { FamiliarCombatPresentationCue } from "../lib/famiglioCombatPresentation.ts";

type PreviewCanvasProps = {
  src: string;
  label: string;
  className?: string;
  flip?: boolean;
  naturalScale?: number;
  fps?: number;
};

type BattleCanvasFighter = {
  id: string;
  name: string;
  spriteSrc: string;
  naturalScale: number;
};

type BattleCanvasProps = {
  className?: string;
  backgroundSrc: string;
  player: BattleCanvasFighter;
  opponent: BattleCanvasFighter;
  event: FamiliarCombatTimelineEvent | null;
  cue: FamiliarCombatPresentationCue | null;
  contactActors: readonly string[];
  entering: boolean;
  phaseDurationMs: number;
  label: string;
  opponentCorrupted?: boolean;
  corruptionIntensity?: number;
  campaignNpc?: {
    src: string;
    name: string;
    pose: "idle" | "command" | "cheer" | "anger" | "victory" | "defeat";
  } | null;
};

type BattleSpritePose =
  | "entrance"
  | "idle"
  | "run"
  | "attack"
  | "physical"
  | "magic"
  | "technique"
  | "guard"
  | "hit"
  | "victory"
  | "exhausted";

type FighterAnimationMode = "loop" | "progress" | "hold-start" | "hold-final" | "once" | "entrance";

type FighterAnimation = {
  pose: BattleSpritePose;
  mode: FighterAnimationMode;
};

type BattleLayout = {
  playerBaseX: number;
  opponentBaseX: number;
  playerContactX: number;
  opponentContactX: number;
  playerSize: number;
  opponentSize: number;
  floorY: number;
};

type PositionedVfx = {
  x: number;
  y: number;
  direction: 1 | -1;
  subjectScale: number;
};

type ParticleKind = "ember" | "crystal" | "spark" | "wind" | "leaf" | "arcane" | "water" | "stone" | "poison";
type ParticleTheme = { colors: readonly string[]; kind: ParticleKind };

const MAX_READY_IMAGES = 72;
const COMBAT_ANIMATION_PACING = 1.18;
const BATTLE_PREFETCH_POSES: readonly BattleSpritePose[] = [
  "entrance", "idle", "run", "attack", "physical", "magic", "technique", "guard", "hit", "victory", "exhausted",
];
const pendingImageCache = new Map<string, Promise<HTMLImageElement>>();
const readyImageCache = new Map<string, HTMLImageElement>();

function rememberReadyImage(src: string, image: HTMLImageElement) {
  readyImageCache.delete(src);
  readyImageCache.set(src, image);
  while (readyImageCache.size > MAX_READY_IMAGES) {
    const oldest = readyImageCache.keys().next().value as string | undefined;
    if (!oldest) break;
    readyImageCache.delete(oldest);
  }
}

function loadImage(src: string) {
  const ready = readyImageCache.get(src);
  if (ready) {
    rememberReadyImage(src, ready);
    return Promise.resolve(ready);
  }
  const cached = pendingImageCache.get(src);
  if (cached) return cached;
  const request = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      rememberReadyImage(src, image);
      resolve(image);
    };
    image.onerror = () => reject(new Error(`Immagine di combattimento non caricata: ${src}`));
    image.src = src;
  });
  pendingImageCache.set(src, request);
  void request.finally(() => {
    if (pendingImageCache.get(src) === request) pendingImageCache.delete(src);
  }).catch(() => undefined);
  return request;
}

export async function preloadFamiglioCombatImages(paths: readonly (string | null | undefined)[]) {
  await Promise.allSettled([...new Set(paths.filter((entry): entry is string => Boolean(entry)))].map(loadImage));
}

function easeInOut(progress: number) {
  const bounded = Math.max(0, Math.min(1, progress));
  return bounded < .5 ? 2 * bounded * bounded : 1 - ((-2 * bounded + 2) ** 2) / 2;
}

function spritePathForPose(src: string, pose: BattleSpritePose) {
  const match = src.match(/^(.*\/)[^/?#]+(\.png(?:[?#].*)?)$/i);
  return match ? `${match[1]}${pose}${match[2]}` : src;
}

function requestedPose(src: string): BattleSpritePose {
  const name = src.split(/[?#]/, 1)[0].split("/").pop()?.replace(/\.png$/i, "") ?? "idle";
  if (name === "win") return "victory";
  if (name === "lose") return "exhausted";
  if (name === "physical") return "attack";
  if (["entrance", "idle", "run", "attack", "physical", "magic", "technique", "guard", "hit", "victory", "exhausted"].includes(name)) {
    return name as BattleSpritePose;
  }
  return "idle";
}

function resultPose(fighterId: string, playerId: string, event: FamiliarCombatTimelineEvent) {
  const playerWon = /victory|vittoria|win/i.test(`${event.vfxCue} ${event.message}`);
  const fighterWon = fighterId === playerId ? playerWon : !playerWon;
  return fighterWon ? "victory" : "exhausted";
}

function resolveFighterAnimation(
  fighterId: string,
  playerId: string,
  suppliedSpriteSrc: string,
  event: FamiliarCombatTimelineEvent | null,
  entering: boolean,
): FighterAnimation {
  if (!event) {
    if (entering) return { pose: "entrance", mode: "entrance" };
    const pose = requestedPose(suppliedSpriteSrc);
    if (pose === "victory" || pose === "exhausted") return { pose, mode: "once" };
    return { pose: "idle", mode: "loop" };
  }

  // `once` resta identico anche quando Arena rimuove l'evento di risultato:
  // così vittoria/sconfitta non ripartono da capo prima di fermarsi sul frame finale.
  if (event.phase === "result") return { pose: resultPose(fighterId, playerId, event), mode: "once" };

  const isActor = event.actorId === fighterId;
  const isTarget = event.targetId === fighterId;
  // L'impatto mostra il contatto e il VFX. La posa `hit` viene riprodotta
  // soltanto nel successivo evento di reazione, evitando il doppio colpo.
  if (event.phase === "reaction" && isTarget && Number(event.amount) > 0) {
    return { pose: "hit", mode: "progress" };
  }
  if (!isActor) return { pose: "idle", mode: "loop" };

  if (event.phase === "advance") {
    return event.actionKind === "physical" ? { pose: "run", mode: "progress" } : { pose: "idle", mode: "loop" };
  }
  if (event.phase === "return") {
    return event.actionKind === "physical" ? { pose: "run", mode: "progress" } : { pose: "idle", mode: "loop" };
  }
  if (event.phase === "windup") {
    if (event.actionKind === "physical") return { pose: "attack", mode: "hold-start" };
    if (event.actionKind === "guard") return { pose: "guard", mode: "hold-start" };
    if (event.actionKind === "magic") return { pose: "magic", mode: "progress" };
    return { pose: "technique", mode: "progress" };
  }
  if (event.phase === "projectile") return { pose: "magic", mode: "hold-final" };
  if (event.phase === "impact") {
    return event.actionKind === "physical" ? { pose: "physical", mode: "progress" } : { pose: "magic", mode: "hold-final" };
  }
  if (event.phase === "guard") return { pose: "guard", mode: "progress" };
  if (event.phase === "status") return { pose: "technique", mode: "hold-final" };
  return { pose: "idle", mode: "loop" };
}

function animationFrame(
  familiarId: string,
  animation: FighterAnimation,
  now: number,
  phaseProgress: number,
  entranceProgress: number,
  poseStartedAt: number,
  reducedMotion: boolean,
  frameCount: number,
) {
  const lastFrame = Math.max(0, frameCount - 1);
  const motion = familiarCombatMotionProfile(familiarId);
  if (animation.mode === "hold-start") return 0;
  if (animation.mode === "hold-final") return lastFrame;
  if (reducedMotion) return animation.mode === "loop" ? Math.min(1, lastFrame) : lastFrame;
  if (animation.mode === "progress") return Math.min(lastFrame, Math.floor(phaseProgress * frameCount));
  if (animation.mode === "entrance") return Math.min(lastFrame, Math.floor(entranceProgress * frameCount));
  if (animation.mode === "once") return Math.min(lastFrame, Math.floor(Math.max(0, now - poseStartedAt) / (motion.actionFrameMs * COMBAT_ANIMATION_PACING)));
  const frameDuration = (animation.pose === "run" ? motion.runFrameMs : motion.idleFrameMs) * COMBAT_ANIMATION_PACING;
  return Math.floor(now / frameDuration) % frameCount;
}

function spriteFrameCount(image: HTMLImageElement) {
  return Math.max(1, Math.round(image.naturalWidth / Math.max(1, image.naturalHeight)));
}

function fighterFacesLeft(fighterId: string, playerId: string, event: FamiliarCombatTimelineEvent | null) {
  const facesLeftAtRest = fighterId !== playerId;
  if (event?.phase === "return" && event.actionKind === "physical" && event.actorId === fighterId) return !facesLeftAtRest;
  return facesLeftAtRest;
}

function drawStripFrame(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  frame: number,
  x: number,
  floorY: number,
  size: number,
  flip: boolean,
  opacity = 1,
) {
  const frameCount = spriteFrameCount(image);
  const frameWidth = image.naturalWidth / frameCount;
  const frameHeight = image.naturalHeight;
  const drawTop = floorY - size * (146 / 160);
  context.save();
  context.globalAlpha = opacity;
  context.imageSmoothingEnabled = false;
  context.translate(x, 0);
  context.scale(flip ? -1 : 1, 1);
  context.drawImage(
    image,
    (frame % frameCount) * frameWidth,
    0,
    frameWidth,
    frameHeight,
    -size / 2,
    drawTop,
    size,
    size,
  );
  context.restore();
}

export function FamiglioCombatPreviewCanvas({
  src,
  label,
  className,
  flip = false,
  naturalScale = 1,
  fps = 3.2,
}: PreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewScale = Math.max(.88, Math.min(1.12, naturalScale));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    let disposed = false;
    let animationRequest = 0;
    let frameTimer = 0;
    let image: HTMLImageElement | null = null;
    let startedAt = 0;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const paint = (now: number) => {
      animationRequest = 0;
      if (disposed || document.hidden) return;
      context.clearRect(0, 0, canvas.width, canvas.height);
      if (image) {
        const frameCount = spriteFrameCount(image);
        const frame = reducedMotion ? Math.min(1, frameCount - 1) : Math.floor((now - startedAt) / (1000 / fps)) % frameCount;
        drawStripFrame(context, image, frame, canvas.width / 2, canvas.height * .94, canvas.height * .83 * previewScale, flip);
      }
      if (!reducedMotion) {
        window.clearTimeout(frameTimer);
        frameTimer = window.setTimeout(() => {
          if (!disposed && !document.hidden && !animationRequest) {
            animationRequest = window.requestAnimationFrame(paint);
          }
        }, Math.max(80, 1000 / fps));
      }
    };

    const requestPaint = () => {
      if (!disposed && !document.hidden && !animationRequest) {
        animationRequest = window.requestAnimationFrame(paint);
      }
    };
    const stop = () => {
      window.clearTimeout(frameTimer);
      if (animationRequest) window.cancelAnimationFrame(animationRequest);
      animationRequest = 0;
    };
    const onVisibilityChange = () => {
      if (document.hidden) stop();
      else requestPaint();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    startedAt = performance.now();
    void loadImage(src).then((loaded) => {
      if (disposed) return;
      image = loaded;
      startedAt = performance.now();
      requestPaint();
    }).catch(() => {
      image = null;
    });

    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      stop();
    };
  }, [flip, fps, previewScale, src]);

  return <canvas ref={canvasRef} className={className} width="320" height="320" role="img" aria-label={label} />;
}

function battleLayout(width: number, height: number, playerScale: number, opponentScale: number): BattleLayout {
  const baseSize = height * .44;
  const playerSize = baseSize * playerScale;
  const opponentSize = baseSize * opponentScale;
  const edgePadding = width * .045;
  const playerBaseX = Math.min(width * .34, Math.max(width * .19, edgePadding + playerSize * .5));
  const opponentBaseX = Math.max(width * .66, Math.min(width * .81, width - edgePadding - opponentSize * .5));
  const contactPoint = width * .5;
  const playerContactX = Math.max(playerBaseX, contactPoint - playerSize * .23);
  const opponentContactX = Math.min(opponentBaseX, contactPoint + opponentSize * .23);
  return {
    playerBaseX,
    opponentBaseX,
    playerContactX,
    opponentContactX,
    playerSize,
    opponentSize,
    floorY: height * .88,
  };
}

function fighterX(
  fighterId: string,
  playerId: string,
  layout: BattleLayout,
  event: FamiliarCombatTimelineEvent | null,
  contactActors: readonly string[],
  phaseProgress: number,
) {
  const player = fighterId === playerId;
  const base = player ? layout.playerBaseX : layout.opponentBaseX;
  const contact = player ? layout.playerContactX : layout.opponentContactX;
  const actor = event?.actorId === fighterId;
  const target = event?.targetId === fighterId;
  const travelsToContact = actor && event?.actionKind === "physical";
  const travelProgress = familiarCombatTravelProgress(fighterId, phaseProgress);
  if (event?.phase === "advance" && travelsToContact) return base + (contact - base) * travelProgress;
  if (event?.phase === "return" && travelsToContact) return contact + (base - contact) * travelProgress;
  if (event?.phase === "impact" && event.missed && target) {
    const fighterSize = player ? layout.playerSize : layout.opponentSize;
    return base + (player ? -1 : 1) * Math.sin(phaseProgress * Math.PI) * fighterSize * .2;
  }
  return contactActors.includes(fighterId) ? contact : base;
}

function vfxPosition(
  event: FamiliarCombatTimelineEvent,
  cue: FamiliarCombatPresentationCue,
  playerId: string,
  layout: BattleLayout,
  eventActorX: number,
  eventTargetX: number,
  height: number,
  phaseProgress: number,
): PositionedVfx {
  const actorIsPlayer = event.actorId === playerId;
  const targetIsPlayer = event.targetId === playerId;
  const actorSize = actorIsPlayer ? layout.playerSize : layout.opponentSize;
  const targetSize = targetIsPlayer ? layout.playerSize : layout.opponentSize;
  const baseSize = height * .36;
  const actorY = layout.floorY - actorSize * .43;
  const targetY = layout.floorY - targetSize * .43;
  const forwardDirection: 1 | -1 = actorIsPlayer ? 1 : -1;
  const movementDirection: 1 | -1 = event.phase === "return" ? (forwardDirection === 1 ? -1 : 1) : forwardDirection;
  const actorScale = actorSize / baseSize;
  const targetScale = targetSize / baseSize;

  if (cue.placement === "travel" && (event.phase === "advance" || event.phase === "return")) {
    return {
      x: eventActorX,
      y: actorY + actorSize * .08,
      direction: movementDirection,
      subjectScale: actorScale,
    };
  }
  if (cue.placement === "travel") {
    const startX = eventActorX + forwardDirection * actorSize * .18;
    const endX = eventTargetX - forwardDirection * targetSize * .18;
    const travelProgress = easeInOut(phaseProgress);
    return {
      x: startX + (endX - startX) * travelProgress,
      y: actorY + (targetY - actorY) * travelProgress - Math.sin(phaseProgress * Math.PI) * height * .1,
      direction: forwardDirection,
      subjectScale: (actorScale + targetScale) / 2,
    };
  }
  if (cue.placement === "actor") {
    return { x: eventActorX, y: actorY, direction: forwardDirection, subjectScale: actorScale };
  }
  if (cue.placement === "target") {
    return { x: eventTargetX, y: targetY, direction: forwardDirection, subjectScale: targetScale };
  }
  return {
    x: (layout.playerBaseX + layout.opponentBaseX) / 2,
    y: height * .58,
    direction: forwardDirection,
    subjectScale: (actorScale + targetScale) / 2,
  };
}

function drawVfx(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  cue: FamiliarCombatPresentationCue,
  event: FamiliarCombatTimelineEvent,
  playerId: string,
  layout: BattleLayout,
  eventActorX: number,
  eventTargetX: number,
  height: number,
  phaseProgress: number,
  elapsedMs: number,
  reducedMotion: boolean,
) {
  const sheet = cue.vfx;
  if (!sheet) return;
  const frame = reducedMotion
    ? Math.min(sheet.frameCount - 1, Math.floor(sheet.frameCount * .55))
    : sheet.loop
      ? Math.floor(elapsedMs / (1000 / sheet.fps)) % sheet.frameCount
      : Math.min(sheet.frameCount - 1, Math.floor(phaseProgress * sheet.frameCount));
  const column = frame % sheet.columns;
  const row = Math.floor(frame / sheet.columns);
  const position = vfxPosition(event, cue, playerId, layout, eventActorX, eventTargetX, height, phaseProgress);
  const motionVfx = cue.placement === "travel" && (event.phase === "advance" || event.phase === "return");
  const baseSize = motionVfx ? height * .16 : cue.placement === "travel" ? height * .19 : height * .29;
  const speciesScale = Math.max(.78, Math.min(1.28, position.subjectScale));
  const size = baseSize * cue.scale * speciesScale;
  const frameAspect = sheet.frameWidth / sheet.frameHeight;
  const drawWidth = frameAspect >= 1 ? size : size * frameAspect;
  const drawHeight = frameAspect >= 1 ? size / frameAspect : size;
  context.save();
  context.imageSmoothingEnabled = false;
  context.globalCompositeOperation = cue.blendMode === "screen" ? "screen" : "source-over";
  context.translate(position.x, position.y);
  if (cue.directionAware && position.direction < 0) context.scale(-1, 1);
  context.drawImage(
    image,
    column * sheet.frameWidth,
    row * sheet.frameHeight,
    sheet.frameWidth,
    sheet.frameHeight,
    -drawWidth / 2,
    -drawHeight / 2,
    drawWidth,
    drawHeight,
  );
  context.restore();
  const particleTheme = particleThemeForVfx(sheet.id, cue.audioId);
  if (particleTheme) {
    drawParticleField(
      context,
      position.x,
      position.y,
      size * .54,
      elapsedMs,
      phaseProgress,
      particleTheme,
      reducedMotion ? 4 : cue.placement === "travel" ? 9 : 14,
      cue.placement === "travel" ? .62 : .78,
    );
  }
}

function particleThemeForVfx(vfxId: string, audioId: string | null): ParticleTheme | null {
  const id = `${vfxId} ${audioId ?? ""}`.toLowerCase();
  if (/ardore|fire|burn/.test(id)) return { colors: ["#ffec76", "#ff8a2c", "#ef3556"], kind: "ember" };
  if (/ghiaccio|ice|freeze|frost/.test(id)) return { colors: ["#efffff", "#8eeeff", "#729cff"], kind: "crystal" };
  if (/fulmine|thunder|shock|lightning/.test(id)) return { colors: ["#fff7a0", "#ffe13f", "#a8edff"], kind: "spark" };
  if (/vento|wind|whirl/.test(id)) return { colors: ["#e9ffff", "#9ef2dc", "#74c8ff"], kind: "wind" };
  if (/natura|vine|heal|regen/.test(id)) return { colors: ["#e9ff91", "#79df7a", "#2ca86b"], kind: "leaf" };
  if (/marea|water|douse/.test(id)) return { colors: ["#e8fbff", "#68d8ff", "#477dff"], kind: "water" };
  if (/arcano|black-hole|focus|cast/.test(id)) return { colors: ["#ffd2ff", "#cf78ff", "#7652ff"], kind: "arcane" };
  if (/antico|asunder|terra/.test(id)) return { colors: ["#ffe39a", "#c69b63", "#80614b"], kind: "stone" };
  if (/veleno|poison/.test(id)) return { colors: ["#d9ff7a", "#7ae44d", "#9b5de5"], kind: "poison" };
  return null;
}

function particleSeed(value: string) {
  let seed = 0;
  for (let index = 0; index < value.length; index += 1) seed = (seed * 31 + value.charCodeAt(index)) >>> 0;
  return seed;
}

function drawParticleField(
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  elapsedMs: number,
  progress: number,
  theme: ParticleTheme,
  count: number,
  opacity: number,
) {
  const seed = particleSeed(`${theme.kind}:${count}`);
  context.save();
  context.globalCompositeOperation = "screen";
  for (let index = 0; index < count; index += 1) {
    const phase = (elapsedMs / (1500 + index * 37) + index / count + (seed % 97) / 97) % 1;
    const angle = phase * Math.PI * 2 + index * 2.399;
    const burst = .5 + Math.sin(progress * Math.PI) * .42;
    const orbit = radius * (burst + (index % 4) * .09);
    const x = centerX + Math.cos(angle) * orbit;
    const y = centerY + Math.sin(angle) * orbit * .62 - phase * radius * .18;
    const size = Math.max(1.4, radius * (.025 + (index % 3) * .009));
    context.globalAlpha = opacity * (.38 + .62 * Math.sin(Math.PI * phase));
    context.fillStyle = theme.colors[index % theme.colors.length];
    context.strokeStyle = context.fillStyle;
    context.lineWidth = Math.max(1, size * .34);
    context.save();
    context.translate(x, y);
    context.rotate(angle);
    context.beginPath();
    if (theme.kind === "wind") {
      context.moveTo(-size * 1.8, 0);
      context.quadraticCurveTo(0, -size, size * 1.8, 0);
      context.stroke();
    } else if (theme.kind === "crystal" || theme.kind === "spark" || theme.kind === "arcane") {
      context.moveTo(0, -size * 1.5);
      context.lineTo(size * .72, 0);
      context.lineTo(0, size * 1.5);
      context.lineTo(-size * .72, 0);
      context.closePath();
      context.fill();
    } else if (theme.kind === "leaf") {
      context.ellipse(0, 0, size * 1.25, size * .62, 0, 0, Math.PI * 2);
      context.fill();
    } else if (theme.kind === "ember") {
      context.moveTo(0, -size * 1.6);
      context.quadraticCurveTo(size, 0, 0, size * 1.1);
      context.quadraticCurveTo(-size, 0, 0, -size * 1.6);
      context.fill();
    } else {
      context.arc(0, 0, size, 0, Math.PI * 2);
      context.fill();
    }
    context.restore();
  }
  context.restore();
}

export function FamiglioBattleCanvas({
  className,
  backgroundSrc,
  player,
  opponent,
  event,
  cue,
  contactActors,
  entering,
  phaseDurationMs,
  label,
  opponentCorrupted = false,
  corruptionIntensity = .55,
  campaignNpc = null,
}: BattleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const eventStartRef = useRef(0);
  const entranceStartRef = useRef(0);
  const playerPoseStartRef = useRef(0);
  const opponentPoseStartRef = useRef(0);
  const imagesRef = useRef({
    background: null as HTMLImageElement | null,
    backgroundSrc: "",
    player: null as HTMLImageElement | null,
    playerSrc: "",
    opponent: null as HTMLImageElement | null,
    opponentSrc: "",
    vfx: null as HTMLImageElement | null,
    vfxSrc: "",
    corruption: null as HTMLImageElement | null,
    npc: null as HTMLImageElement | null,
    npcSrc: "",
  });
  const { id: playerId, spriteSrc: playerSpriteSrc, naturalScale: playerScale } = player;
  const { id: opponentId, spriteSrc: opponentSpriteSrc, naturalScale: opponentScale } = opponent;
  const playerAnimation = useMemo(
    () => resolveFighterAnimation(playerId, playerId, playerSpriteSrc, event, entering),
    [entering, event, playerId, playerSpriteSrc],
  );
  const opponentAnimation = useMemo(
    () => resolveFighterAnimation(opponentId, playerId, opponentSpriteSrc, event, entering),
    [entering, event, opponentId, opponentSpriteSrc, playerId],
  );
  const resolvedPlayerSpriteSrc = spritePathForPose(playerSpriteSrc, playerAnimation.pose);
  const resolvedOpponentSpriteSrc = spritePathForPose(opponentSpriteSrc, opponentAnimation.pose);

  useEffect(() => {
    eventStartRef.current = performance.now();
  }, [event?.id]);

  useEffect(() => {
    if (entering) entranceStartRef.current = performance.now();
  }, [entering]);

  useEffect(() => {
    playerPoseStartRef.current = performance.now();
  }, [playerAnimation.mode, playerAnimation.pose]);

  useEffect(() => {
    opponentPoseStartRef.current = performance.now();
  }, [opponentAnimation.mode, opponentAnimation.pose]);

  useEffect(() => {
    void preloadFamiglioCombatImages([
      backgroundSrc,
      ...BATTLE_PREFETCH_POSES.map((pose) => spritePathForPose(playerSpriteSrc, pose)),
      ...BATTLE_PREFETCH_POSES.map((pose) => spritePathForPose(opponentSpriteSrc, pose)),
      opponentCorrupted ? "/famiglio/rebuild/combat/vfx/corruption-aura-purple-v1.png" : null,
      campaignNpc?.src,
    ]);
  }, [backgroundSrc, campaignNpc?.src, opponentCorrupted, opponentSpriteSrc, playerSpriteSrc]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    let disposed = false;
    let animationRequest = 0;
    let frameTimer = 0;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const schedulePaint = (delayMs = 0) => {
      if (disposed || document.hidden || animationRequest || frameTimer) return;
      if (delayMs <= 0) {
        animationRequest = window.requestAnimationFrame(paint);
        return;
      }
      frameTimer = window.setTimeout(() => {
        frameTimer = 0;
        if (!disposed && !document.hidden && !animationRequest) {
          animationRequest = window.requestAnimationFrame(paint);
        }
      }, delayMs);
    };

    const assign = (slot: "background" | "player" | "opponent", src: string) => {
      const sourceSlot = `${slot}Src` as "backgroundSrc" | "playerSrc" | "opponentSrc";
      const ready = readyImageCache.get(src);
      imagesRef.current[sourceSlot] = src;
      imagesRef.current[slot] = ready ?? null;
      void loadImage(src).then((image) => {
        if (!disposed && imagesRef.current[sourceSlot] === src) {
          imagesRef.current[slot] = image;
          schedulePaint();
        }
      }).catch(() => undefined);
    };
    assign("background", backgroundSrc);
    assign("player", resolvedPlayerSpriteSrc);
    assign("opponent", resolvedOpponentSpriteSrc);
    if (opponentCorrupted) {
      void loadImage("/famiglio/rebuild/combat/vfx/corruption-aura-purple-v1.png").then((image) => {
        if (!disposed) { imagesRef.current.corruption = image; schedulePaint(); }
      }).catch(() => undefined);
    } else imagesRef.current.corruption = null;
    if (campaignNpc?.src) {
      imagesRef.current.npcSrc = campaignNpc.src;
      void loadImage(campaignNpc.src).then((image) => {
        if (!disposed && imagesRef.current.npcSrc === campaignNpc.src) {
          imagesRef.current.npc = image;
          schedulePaint();
        }
      }).catch(() => undefined);
    } else {
      imagesRef.current.npc = null;
      imagesRef.current.npcSrc = "";
    }
    const vfxSrc = cue?.vfx?.path ?? "";
    if (!vfxSrc) {
      imagesRef.current.vfx = null;
      imagesRef.current.vfxSrc = "";
    } else {
      const ready = readyImageCache.get(vfxSrc);
      imagesRef.current.vfx = ready ?? null;
      imagesRef.current.vfxSrc = vfxSrc;
      void loadImage(vfxSrc).then((image) => {
        if (!disposed && imagesRef.current.vfxSrc === vfxSrc) {
          imagesRef.current.vfx = image;
          schedulePaint();
        }
      }).catch(() => undefined);
    }

    const paint = (now: number) => {
      animationRequest = 0;
      if (disposed || document.hidden) return;
      const width = canvas.width;
      const height = canvas.height;
      context.clearRect(0, 0, width, height);
      context.imageSmoothingEnabled = true;
      const images = imagesRef.current;
      if (images.background) context.drawImage(images.background, 0, 0, width, height);
      else {
        const fallback = context.createLinearGradient(0, 0, 0, height);
        fallback.addColorStop(0, "#243352");
        fallback.addColorStop(1, "#171020");
        context.fillStyle = fallback;
        context.fillRect(0, 0, width, height);
      }

      const shade = context.createLinearGradient(0, 0, 0, height);
      shade.addColorStop(0, "rgba(9,5,16,.18)");
      shade.addColorStop(.54, "rgba(9,5,16,0)");
      shade.addColorStop(1, "rgba(9,5,16,.30)");
      context.fillStyle = shade;
      context.fillRect(0, 0, width, height);

      const eventElapsedMs = Math.max(0, now - eventStartRef.current);
      const progress = reducedMotion ? 1 : Math.max(0, Math.min(1, eventElapsedMs / Math.max(220, phaseDurationMs)));
      const layout = battleLayout(width, height, playerScale, opponentScale);
      const playerX = fighterX(playerId, playerId, layout, event, contactActors, progress);
      const opponentX = fighterX(opponentId, playerId, layout, event, contactActors, progress);
      const entranceElapsedMs = now - entranceStartRef.current;
      const playerEntranceProgress = reducedMotion || !entering ? 1 : Math.max(0, Math.min(1, entranceElapsedMs / familiarCombatMotionProfile(playerId).entranceDurationMs));
      const opponentEntranceProgress = reducedMotion || !entering ? 1 : Math.max(0, Math.min(1, entranceElapsedMs / familiarCombatMotionProfile(opponentId).entranceDurationMs));
      const playerEntranceX = -layout.playerSize * .6;
      const opponentEntranceX = width + layout.opponentSize * .6;
      const playerDrawX = playerEntranceX + (playerX - playerEntranceX) * familiarCombatTravelProgress(playerId, playerEntranceProgress);
      const opponentDrawX = opponentEntranceX + (opponentX - opponentEntranceX) * familiarCombatTravelProgress(opponentId, opponentEntranceProgress);

      // Il Custode corrotto appartiene alla profondita della scena: viene
      // disegnato prima dei Famigli, quindi il giocatore gli resta sempre davanti.
      if (campaignNpc && images.npc) {
        const npcRows = { idle: 0, command: 1, cheer: 2, anger: 3, victory: 4, defeat: 5 } as const;
        const npcColumns = 8;
        const npcFrameWidth = images.npc.naturalWidth / npcColumns;
        const npcFrameHeight = images.npc.naturalHeight / 6;
        const npcFrame = reducedMotion ? 0 : Math.floor(now / 135) % npcColumns;
        const npcSize = height * .31;
        const npcX = width * .5;
        const npcFloorY = layout.floorY - height * .12;
        context.save();
        context.imageSmoothingEnabled = false;
        context.drawImage(images.npc, npcFrame * npcFrameWidth, npcRows[campaignNpc.pose] * npcFrameHeight, npcFrameWidth, npcFrameHeight, npcX - npcSize / 2, npcFloorY - npcSize, npcSize, npcSize);
        context.font = `700 ${Math.max(18, Math.round(height * .026))}px monospace`;
        context.textAlign = "center";
        context.textBaseline = "middle";
        const labelWidth = context.measureText(campaignNpc.name).width + 28;
        const labelY = npcFloorY - npcSize + 10;
        context.fillStyle = "rgba(18,8,29,.92)";
        context.strokeStyle = "#ffe06d";
        context.lineWidth = 2;
        context.beginPath();
        context.roundRect(npcX - labelWidth / 2, labelY - 17, labelWidth, 34, 17);
        context.fill();
        context.stroke();
        context.fillStyle = "#fff1bc";
        context.fillText(campaignNpc.name, npcX, labelY + 1);
        context.restore();
      }

      context.save();
      context.fillStyle = "rgba(12,5,18,.34)";
      context.beginPath();
      context.ellipse(playerDrawX, layout.floorY + 4, layout.playerSize * .25, layout.playerSize * .045, 0, 0, Math.PI * 2);
      context.ellipse(opponentDrawX, layout.floorY + 4, layout.opponentSize * .25, layout.opponentSize * .045, 0, 0, Math.PI * 2);
      context.fill();
      context.restore();

      const playerFrameCount = images.player ? spriteFrameCount(images.player) : 1;
      const opponentFrameCount = images.opponent ? spriteFrameCount(images.opponent) : 1;
      const playerFrame = animationFrame(playerId, playerAnimation, now, progress, playerEntranceProgress, playerPoseStartRef.current, reducedMotion, playerFrameCount);
      const opponentFrame = animationFrame(opponentId, opponentAnimation, now, progress, opponentEntranceProgress, opponentPoseStartRef.current, reducedMotion, opponentFrameCount);
      if (images.player) {
        drawStripFrame(
          context,
          images.player,
          playerFrame,
          playerDrawX,
          layout.floorY,
          layout.playerSize,
          fighterFacesLeft(playerId, playerId, event),
        );
      }
      if (opponentCorrupted && images.corruption) {
        const frameCount = 16;
        const frame = reducedMotion ? 7 : Math.floor(now / 115) % frameCount;
        const frameWidth = images.corruption.naturalWidth / 4;
        const frameHeight = images.corruption.naturalHeight / 4;
        const size = layout.opponentSize * (1.22 + Math.min(.22, corruptionIntensity * .12));
        context.save();
        context.imageSmoothingEnabled = false;
        context.globalAlpha = Math.min(.72, .42 + corruptionIntensity * .2);
        context.globalCompositeOperation = "source-over";
        context.drawImage(images.corruption, (frame % 4) * frameWidth, Math.floor(frame / 4) * frameHeight, frameWidth, frameHeight, opponentDrawX - size / 2, layout.floorY - size * .92, size, size);
        context.restore();
        drawParticleField(
          context,
          opponentDrawX,
          layout.floorY - size * .43,
          size * .43,
          now,
          (now % 1800) / 1800,
          { colors: ["#f3b2ff", "#c653ff", "#7430d8"], kind: "arcane" },
          reducedMotion ? 4 : 12,
          Math.min(.68, .4 + corruptionIntensity * .18),
        );
      }
      if (images.opponent) {
        drawStripFrame(
          context,
          images.opponent,
          opponentFrame,
          opponentDrawX,
          layout.floorY,
          layout.opponentSize,
          fighterFacesLeft(opponentId, playerId, event),
        );
      }
      if (event && cue?.vfx && images.vfx && images.vfxSrc === cue.vfx.path) {
        const eventActorX = event.actorId === playerId ? playerX : opponentX;
        const eventTargetX = event.targetId === playerId ? playerX : opponentX;
        drawVfx(context, images.vfx, cue, event,
          playerId,
          layout,
          eventActorX,
          eventTargetX,
          height,
          progress,
          eventElapsedMs,
          reducedMotion,
        );
      }

      if (event?.phase === "impact" && event.missed) {
        const targetIsPlayer = event.targetId === playerId;
        const targetX = targetIsPlayer ? playerDrawX : opponentDrawX;
        const targetSize = targetIsPlayer ? layout.playerSize : layout.opponentSize;
        const floatProgress = Math.sin(progress * Math.PI);
        context.save();
        context.translate(targetX, layout.floorY - targetSize * (.86 + floatProgress * .16));
        context.rotate((targetIsPlayer ? -1 : 1) * .06 * floatProgress);
        context.globalAlpha = Math.max(.2, 1 - Math.max(0, progress - .68) / .32);
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.lineJoin = "round";
        context.font = `900 ${Math.max(34, Math.round(height * .074))}px monospace`;
        context.lineWidth = Math.max(7, height * .012);
        context.strokeStyle = "rgba(25, 8, 35, .96)";
        context.strokeText("MISS", 0, 0);
        context.lineWidth = Math.max(2, height * .004);
        context.strokeStyle = "#ffffff";
        context.strokeText("MISS", 0, 0);
        context.fillStyle = "#ffd85b";
        context.fillText("MISS", 0, 0);
        context.restore();
      }

      if (reducedMotion) return;
      const playerOnceRunning = playerAnimation.mode === "once" && now - playerPoseStartRef.current < 450;
      const opponentOnceRunning = opponentAnimation.mode === "once" && now - opponentPoseStartRef.current < 450;
      const eventRunning = Boolean(event) && progress < 1;
      const entranceRunning = entering && (playerEntranceProgress < 1 || opponentEntranceProgress < 1);
      const idleRunning = !event && (playerAnimation.mode === "loop" || opponentAnimation.mode === "loop" || opponentCorrupted);
      if (eventRunning || entranceRunning || playerOnceRunning || opponentOnceRunning || idleRunning) {
        const eventFps = cue?.vfx?.fps ?? ((event?.phase === "advance" || event?.phase === "return" || event?.phase === "projectile") ? 30 : 12);
        const frameDelay = eventRunning || entranceRunning
          ? Math.max(33, 1000 / Math.min(30, Math.max(8, eventFps)))
          : idleRunning
            ? 360
            : 150;
        schedulePaint(frameDelay);
      }
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        window.clearTimeout(frameTimer);
        frameTimer = 0;
        if (animationRequest) window.cancelAnimationFrame(animationRequest);
        animationRequest = 0;
      } else {
        schedulePaint();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    schedulePaint();
    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.clearTimeout(frameTimer);
      if (animationRequest) window.cancelAnimationFrame(animationRequest);
    };
  }, [
    backgroundSrc,
    contactActors,
    cue,
    entering,
    event,
    opponentAnimation,
    opponentCorrupted,
    corruptionIntensity,
    campaignNpc,
    opponentId,
    opponentScale,
    phaseDurationMs,
    playerAnimation,
    playerId,
    playerScale,
    resolvedOpponentSpriteSrc,
    resolvedPlayerSpriteSrc,
  ]);

  return <canvas
    ref={canvasRef}
    className={className}
    width="1280"
    height="720"
    role="img"
    aria-label={label}
    style={{ "--battle-aspect": "16 / 9" } as CSSProperties}
  />;
}
