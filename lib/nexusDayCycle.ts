export type NexusDayPhase = "alba" | "giorno" | "pomeriggio" | "tramonto" | "notte";

export type NexusRomeCycle = {
  phase: NexusDayPhase;
  label: string;
  time: string;
  background: string;
  icon: string;
};

const PHASE_ASSETS: Record<NexusDayPhase, Omit<NexusRomeCycle, "phase" | "time">> = {
  alba: { label: "Alba nel Nexus", background: "/famiglio/scenes/tana-alba-room-v2.png", icon: "/famiglio/time-icons/alba-v1.png" },
  giorno: { label: "Mattina nel Nexus", background: "/famiglio/scenes/tana-giorno-room-v2.png", icon: "/famiglio/time-icons/giorno-v1.png" },
  pomeriggio: { label: "Pomeriggio nel Nexus", background: "/famiglio/scenes/tana-pomeriggio-room-v2.png", icon: "/famiglio/time-icons/pomeriggio-v1.png" },
  tramonto: { label: "Tramonto nel Nexus", background: "/famiglio/scenes/tana-tramonto-room-v2.png", icon: "/famiglio/time-icons/tramonto-v1.png" },
  notte: { label: "Notte nel Nexus", background: "/famiglio/scenes/tana-notte-room-v2.png", icon: "/famiglio/time-icons/notte-v1.png" },
};

export type FamiliarHabitatTheme = {
  id: string;
  name: string;
  description: string;
  cover: string;
  backgrounds: Record<NexusDayPhase, string>;
  groundLinePercent: number;
  mobileGroundLinePercent: number;
  walkBounds: readonly [number, number];
};

export const FAMILIAR_HABITAT_THEMES: FamiliarHabitatTheme[] = [
  {
    id: "rifugio-iniziale",
    name: "Rifugio del Nexus",
    description: "La tana originale, calda e protetta.",
    cover: "/famiglio/scenes/tana-giorno-room-v2.png",
    backgrounds: {
      alba: "/famiglio/scenes/tana-alba-room-v2.png",
      giorno: "/famiglio/scenes/tana-giorno-room-v2.png",
      pomeriggio: "/famiglio/scenes/tana-pomeriggio-room-v2.png",
      tramonto: "/famiglio/scenes/tana-tramonto-room-v2.png",
      notte: "/famiglio/scenes/tana-notte-room-v2.png",
    },
    groundLinePercent: 92,
    mobileGroundLinePercent: 98,
    walkBounds: [2, 98],
  },
  {
    id: "giardino-lucciole",
    name: "Giardino delle lucciole",
    description: "Un cortile incantato che cambia davvero dalla prima luce alla notte.",
    cover: "/famiglio/themes/giardino-lucciole/giorno-v1.png",
    backgrounds: {
      alba: "/famiglio/themes/giardino-lucciole/alba-v1.png",
      giorno: "/famiglio/themes/giardino-lucciole/giorno-v1.png",
      pomeriggio: "/famiglio/themes/giardino-lucciole/pomeriggio-v1.png",
      tramonto: "/famiglio/themes/giardino-lucciole/tramonto-v1.png",
      notte: "/famiglio/themes/giardino-lucciole/notte-v1.png",
    },
    groundLinePercent: 91,
    mobileGroundLinePercent: 91,
    walkBounds: [2, 98],
  },
  {
    id: "biblioteca-astrale",
    name: "Biblioteca astrale",
    description: "Una casa silenziosa fra libri, camino e mappe del cielo.",
    cover: "/famiglio/themes/biblioteca-astrale/giorno-v1.png",
    backgrounds: {
      alba: "/famiglio/themes/biblioteca-astrale/alba-v1.png",
      giorno: "/famiglio/themes/biblioteca-astrale/giorno-v1.png",
      pomeriggio: "/famiglio/themes/biblioteca-astrale/pomeriggio-v1.png",
      tramonto: "/famiglio/themes/biblioteca-astrale/tramonto-v1.png",
      notte: "/famiglio/themes/biblioteca-astrale/notte-v1.png",
    },
    groundLinePercent: 94,
    mobileGroundLinePercent: 94,
    walkBounds: [2, 98],
  },
  {
    id: "serra-celeste",
    name: "Serra celeste",
    description: "Una dimora luminosa tra vetrate, fiori magici e acqua.",
    cover: "/famiglio/themes/serra-celeste/giorno-v1.png",
    backgrounds: {
      alba: "/famiglio/themes/serra-celeste/alba-v1.png",
      giorno: "/famiglio/themes/serra-celeste/giorno-v1.png",
      pomeriggio: "/famiglio/themes/serra-celeste/pomeriggio-v1.png",
      tramonto: "/famiglio/themes/serra-celeste/tramonto-v1.png",
      notte: "/famiglio/themes/serra-celeste/notte-v1.png",
    },
    groundLinePercent: 92,
    mobileGroundLinePercent: 92,
    walkBounds: [2, 98],
  },
  {
    id: "cucina-alchemica",
    name: "Cucina dell'Alchimista",
    description: "Una cucina incantata fra rame, erbe, pozioni e un focolare sempre acceso.",
    cover: "/famiglio/themes/cucina-alchemica/giorno-v1.png",
    backgrounds: {
      alba: "/famiglio/themes/cucina-alchemica/alba-v1.png",
      giorno: "/famiglio/themes/cucina-alchemica/giorno-v1.png",
      pomeriggio: "/famiglio/themes/cucina-alchemica/pomeriggio-v1.png",
      tramonto: "/famiglio/themes/cucina-alchemica/tramonto-v1.png",
      notte: "/famiglio/themes/cucina-alchemica/notte-v1.png",
    },
    groundLinePercent: 76,
    mobileGroundLinePercent: 76,
    walkBounds: [2, 98],
  },
];

export function nexusThemeBackground(themeId: string, phase: NexusDayPhase) {
  const theme = FAMILIAR_HABITAT_THEMES.find((entry) => entry.id === themeId) ?? FAMILIAR_HABITAT_THEMES[0];
  return theme.backgrounds[phase];
}

export function nexusThemeGeometry(themeId: string) {
  const theme = FAMILIAR_HABITAT_THEMES.find((entry) => entry.id === themeId) ?? FAMILIAR_HABITAT_THEMES[0];
  return { groundLinePercent: theme.groundLinePercent, mobileGroundLinePercent: theme.mobileGroundLinePercent, walkBounds: theme.walkBounds };
}

export function nexusDayPhaseForHour(hour: number): NexusDayPhase {
  const normalized = ((Math.floor(hour) % 24) + 24) % 24;
  if (normalized >= 5 && normalized < 8) return "alba";
  if (normalized >= 8 && normalized < 12) return "giorno";
  if (normalized >= 12 && normalized < 17) return "pomeriggio";
  if (normalized >= 17 && normalized < 20) return "tramonto";
  return "notte";
}

export function nexusRomeCycle(at = new Date()): NexusRomeCycle {
  const parts = new Intl.DateTimeFormat("it-IT", {
    timeZone: "Europe/Rome",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(at);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00";
  const phase = nexusDayPhaseForHour(hour);
  return { phase, time: `${String(hour).padStart(2, "0")}:${minute}`, ...PHASE_ASSETS[phase] };
}
