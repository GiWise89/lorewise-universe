import type { FamiliarCareCommand } from "./nexusFamiliarActions.ts";

const FAMILY_TONE: Record<string, number> = { Gatto: 760, Cane: 520, Lupo: 390, Coniglio: 720, Volpe: 650, Tartaruga: 430, Gallina: 840, Pappagallo: 920, Orso: 340 };
const ACTION_OFFSET: Record<FamiliarCareCommand, number> = { food: 0, soap: 120, toy: 240, medicine: -80, rest: -180 };

export function playFamiliarCue(family: string, action: FamiliarCareCommand, enabled: boolean) {
  if (!enabled || typeof window === "undefined") return;
  const AudioContextClass = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;
  const context = new AudioContextClass();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const start = context.currentTime;
  oscillator.type = family === "Pappagallo" || family === "Gallina" ? "square" : "triangle";
  oscillator.frequency.setValueAtTime(Math.max(160, (FAMILY_TONE[family] ?? 560) + ACTION_OFFSET[action]), start);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(120, (FAMILY_TONE[family] ?? 560) * .72), start + .22);
  gain.gain.setValueAtTime(.0001, start);
  gain.gain.exponentialRampToValueAtTime(.045, start + .025);
  gain.gain.exponentialRampToValueAtTime(.0001, start + .28);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + .3);
  oscillator.addEventListener("ended", () => void context.close(), { once: true });
}
