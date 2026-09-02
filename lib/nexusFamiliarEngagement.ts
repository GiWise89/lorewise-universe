import type { FamiliarBehaviorName } from "./nexusFamiliarCatalog.ts";
import type { NexusFamiliarState } from "./nexusFamiliar.ts";

export const FAMILIAR_NOTIFICATIONS_STORAGE_KEY = "lorewise:nexus-familiar:notifications:v1";
export const FAMILIAR_PIP_EVENT = "lorewise:familiar-reaction";
export type FamiliarPipMode = "open" | "minimized" | "closed";

export function familiarPipModeForViewport(savedMode: string | null, compactViewport: boolean): FamiliarPipMode {
  if (savedMode === "closed") return "closed";
  if (compactViewport) return "minimized";
  return savedMode === "minimized" ? "minimized" : "open";
}

export type FamiliarReactionKind = "artwork" | "story" | "mission" | "purchase" | "level" | "outing" | "reward";

export type FamiliarReaction = {
  kind: FamiliarReactionKind;
  title: string;
  message: string;
  behavior: FamiliarBehaviorName;
};

export type FamiliarSmartAlert = {
  key: string;
  title: string;
  message: string;
  reaction: FamiliarReaction;
};

function localDateKey(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

export function familiarReactionForPath(pathname: string, familiarName: string): FamiliarReaction | null {
  const path = pathname.toLocaleLowerCase("it");
  if (/^\/arte\/[^/]+/.test(path)) return { kind: "artwork", title: `${familiarName} osserva con te`, message: "Si ferma davanti all’opera e ne segue ogni dettaglio.", behavior: "sit" };
  if (/^\/dove-nascono-i-mondi\//.test(path) || /^\/giochi\//.test(path)) return { kind: "story", title: `${familiarName} sente una nuova storia`, message: "Riconosce una strada inesplorata nel Nexus.", behavior: "idle" };
  if (/^\/cronache-del-nexus/.test(path) || /^\/enciclopedia\//.test(path)) return { kind: "story", title: `${familiarName} ascolta`, message: "Rimane vicino mentre scopri un nuovo frammento di lore.", behavior: "sit" };
  if (/^\/commissioni/.test(path) || /^\/shop/.test(path)) return { kind: "purchase", title: `${familiarName} è curioso`, message: "Ti accompagna senza interrompere ciò che stai facendo.", behavior: "idle" };
  return null;
}

export function familiarReactionForChange(previous: NexusFamiliarState | null, next: NexusFamiliarState): FamiliarReaction | null {
  if (!previous || previous.familiarId !== next.familiarId) return null;
  if (next.level > previous.level) return { kind: "level", title: `Livello ${next.level} raggiunto`, message: `${next.name} festeggia il vostro legame.`, behavior: "sit" };
  if (previous.outing && !next.outing) return { kind: "outing", title: `${next.name} è tornato`, message: "Ha riportato ricompense e una nuova traccia dal Nexus.", behavior: "idle" };
  const unlockedSomething = next.den.unlockedThemes.length > previous.den.unlockedThemes.length || next.den.unlockedGadgets.length > previous.den.unlockedGadgets.length;
  if (unlockedSomething) return { kind: "purchase", title: "Nuovo elemento sbloccato", message: `${next.name} vuole provarlo nella tana.`, behavior: "groom" };
  return null;
}

export function familiarSmartAlerts(state: NexusFamiliarState, now = new Date()): FamiliarSmartAlert[] {
  const date = localDateKey(now);
  const alerts: FamiliarSmartAlert[] = [];
  if (state.outing && Date.parse(state.outing.endsAt) <= now.getTime()) alerts.push({
    key: `${date}:${state.familiarId}:outing:${state.outing.endsAt}`,
    title: `${state.name} è tornato dall’uscita`,
    message: "La ricompensa è pronta nella sezione Fuori casa.",
    reaction: { kind: "outing", title: `${state.name} è tornato`, message: "Accoglilo per ritirare ciò che ha trovato.", behavior: "idle" },
  });
  const lowest = Object.entries(state.needs).sort((left, right) => left[1] - right[1])[0];
  if (lowest && lowest[1] < 20) {
    const labels: Record<string, string> = { health: "salute", hunger: "fame", hygiene: "igiene", energy: "energia", happiness: "felicità" };
    const label = labels[lowest[0]] ?? "benessere";
    alerts.push({
      key: `${date}:${state.familiarId}:need:${lowest[0]}`,
      title: `${state.name} ha davvero bisogno di te`,
      message: `La ${label} è scesa a ${Math.round(lowest[1])}.`,
      reaction: { kind: "reward", title: "Serve una cura", message: `La ${label} è molto bassa: ${Math.round(lowest[1])}.`, behavior: "sit" },
    });
  }
  alerts.push({
    key: `${date}:${state.familiarId}:daily-missions`,
    title: "Nuove missioni del Famiglio",
    message: "Le attività di oggi sono disponibili.",
    reaction: { kind: "mission", title: "Nuove missioni", message: `${state.name} è pronto a seguirti nel Nexus.`, behavior: "sit" },
  });
  return alerts;
}

export function dispatchFamiliarReaction(reaction: FamiliarReaction) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<FamiliarReaction>(FAMILIAR_PIP_EVENT, { detail: reaction }));
}
