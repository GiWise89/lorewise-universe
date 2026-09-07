import type { FamiliarHomeState } from "./famiglioHome.ts";
import { familiarCombatMotionProfile } from "./famiglioCombatMotion.ts";

export type FamiliarDailyMoment = {
  id: string;
  title: string;
  message: string;
};

const MOMENTS = [
  ["eco", "Un'eco nella Casa", "Si ferma ad ascoltare un suono lontano, poi torna vicino a te."],
  ["luce", "Un riflesso curioso", "Insegue per un istante una luce del Nexus sul pavimento."],
  ["tesoro", "Piccolo tesoro", "Ha trovato un oggetto insignificante e te lo mostra come fosse prezioso."],
  ["finestra", "Oltre la finestra", "Osserva il mondo fuori dalla Casa e sembra immaginare la prossima spedizione."],
  ["saluto", "Un saluto tutto suo", "Ti riconosce e reagisce con il gesto che usa soltanto con il suo Custode."],
  ["riposo", "Un momento quieto", "Sceglie il suo angolo preferito e si rilassa senza perdere di vista la stanza."],
] as const;

function dayKey(now: number) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(now));
}

function stableIndex(seed: string, length: number) {
  let hash = 2166136261;
  for (const char of seed) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return Math.abs(hash) % length;
}

export function familiarDailyMoment(familiarId: string, now = Date.now()): FamiliarDailyMoment {
  const [id, title, generic] = MOMENTS[stableIndex(`${familiarId}:${dayKey(now)}`, MOMENTS.length)];
  const archetype = familiarCombatMotionProfile(familiarId).archetype;
  const message = archetype === "creatura-volante" || archetype === "volatile"
    ? `${generic} Le ali accompagnano il movimento con piccoli battiti.`
    : archetype === "quadrupede-pesante" || archetype === "rettile-pesante"
      ? `${generic} Ogni passo ha un ritmo calmo e riconoscibile.`
      : archetype === "creatura-magica"
        ? `${generic} Una lieve risonanza luminosa segue la sua emozione.`
        : generic;
  return { id: `${dayKey(now)}-${id}`, title, message };
}

export function familiarReturnGreeting(home: Pick<FamiliarHomeState, "lastActionAt">, familiarName: string, now = Date.now()) {
  if (!home.lastActionAt) return `${familiarName} sta imparando a riconoscerti.`;
  const awayHours = Math.max(0, now - home.lastActionAt) / 3_600_000;
  if (awayHours >= 24) return `${familiarName} ti accoglie con grande entusiasmo.`;
  if (awayHours >= 6) return `${familiarName} si avvicina appena ti vede.`;
  return `${familiarName} continua serenamente la sua giornata con te.`;
}
