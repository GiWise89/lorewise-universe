import type { FamiliarCareCommand } from "./nexusFamiliarActions.ts";

const ACTION_SAMPLE: Record<FamiliarCareCommand, string> = {
  food: "/famiglio/rebuild/audio/care/food-soft.ogg",
  soap: "/famiglio/rebuild/audio/care/soap-sparkle.ogg",
  toy: "/famiglio/rebuild/audio/care/toy-step.ogg",
  medicine: "/famiglio/rebuild/audio/care/medicine-chime.ogg",
  rest: "/famiglio/rebuild/audio/care/rest-soft.ogg",
};

const FAMILIAR_VOICE_SAMPLE: ReadonlyArray<{ pattern: RegExp; src: string }> = [
  { pattern: /^(bird|uccellino)$/i, src: "/famiglio/rebuild/audio/animals/bird-chirp-1.wav" },
  { pattern: /^(parrot|pappagallo)$/i, src: "/famiglio/rebuild/audio/animals/bird-chirp-2.wav" },
  { pattern: /^(chicken|gallina|gallina\/pulcino)$/i, src: "/famiglio/rebuild/audio/animals/bird-chirp-3.wav" },
  { pattern: /^(pteranodon|pteranodonte)$/i, src: "/famiglio/rebuild/audio/animals/bird-chirp-4.wav" },
];

export type FamiliarHomeAudioAction = "feed" | "play" | "clean" | "care" | "rest";
export type FamiliarInterfaceAudioAction = "select" | "confirm";

const INTERFACE_SAMPLE: Record<FamiliarInterfaceAudioAction, string> = {
  select: "/famiglio/rebuild/audio/ui/menu-select.ogg",
  confirm: "/famiglio/rebuild/audio/ui/menu-confirm.ogg",
};

let lastInterfaceCueAt = 0;

const HOME_ACTION_AUDIO: Record<FamiliarHomeAudioAction, FamiliarCareCommand> = {
  feed: "food",
  play: "toy",
  clean: "soap",
  care: "medicine",
  rest: "rest",
};

function familiarVoiceSample(identity: string) {
  return FAMILIAR_VOICE_SAMPLE.find(({ pattern }) => pattern.test(identity))?.src ?? null;
}

export function playFamiliarCue(family: string, action: FamiliarCareCommand, enabled: boolean, volume = 1) {
  if (!enabled || typeof window === "undefined") return;
  const normalizedVolume = Math.min(1, Math.max(0, volume));
  if (normalizedVolume <= 0) return;
  const sample = new Audio(ACTION_SAMPLE[action]);
  sample.volume = (action === "rest" ? .34 : .48) * normalizedVolume;
  void sample.play().catch(() => undefined);
  const voiceSrc = action === "rest" ? null : familiarVoiceSample(family);
  if (!voiceSrc) return;
  const voice = new Audio(voiceSrc);
  voice.preload = "auto";
  voice.volume = .24 * normalizedVolume;
  void voice.play().catch(() => undefined);
}

export function playFamiliarHomeActionCue(familiarIdentity: string, action: FamiliarHomeAudioAction, enabled = true, volume = 1) {
  playFamiliarCue(familiarIdentity, HOME_ACTION_AUDIO[action], enabled, volume);
}

export function playFamiliarInterfaceCue(action: FamiliarInterfaceAudioAction, enabled = true, volume = 1) {
  if (!enabled || typeof window === "undefined") return;
  const now = performance.now();
  if (now - lastInterfaceCueAt < 55) return;
  lastInterfaceCueAt = now;
  const normalizedVolume = Math.min(1, Math.max(0, volume));
  if (normalizedVolume <= 0) return;
  const sample = new Audio(INTERFACE_SAMPLE[action]);
  sample.preload = "auto";
  sample.volume = (action === "select" ? .14 : .18) * normalizedVolume;
  void sample.play().catch(() => undefined);
}
