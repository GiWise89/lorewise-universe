// Memoria locale (browser) dei replay delle battaglie: diario della battaglia in
// corso e coda dei resoconti da far verificare al server. Tutto è opzionale: senza
// localStorage la battaglia resta giocabile e il resoconto viene inviato subito.
import type { FamiliarCombatReward } from "./famiglioCombat.ts";
import type { FamiliarCombatJournal, FamiliarCombatReplay, FamiliarCombatResolvedOutcome } from "./famiglioCombatVerification.ts";

const JOURNALS_KEY = "lorewise:famiglio:combat-journals";
const REPORTS_KEY = "lorewise:famiglio:combat-reports";
const MAX_JOURNALS = 6;
const MAX_REPORTS = 25;

export type FamiglioCombatBattleReport = {
  battleId: string;
  houseIndex: number;
  /** null quando il diario non è ricostruibile (battaglia iniziata con una versione precedente). */
  replay: FamiliarCombatReplay | null;
  localOutcome: FamiliarCombatResolvedOutcome;
  localReward: FamiliarCombatReward | null;
};

export type FamiglioCombatVerificationStatus = "local" | "pending" | "offline" | "verified" | "rejected";

export type FamiglioCombatVerificationView = {
  status: FamiglioCombatVerificationStatus;
  /** Premio accreditato dal server (o dal motore locale in modalità ospite/anteprima). */
  reward: FamiliarCombatReward | null;
  message: string | null;
};

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* Memoria locale facoltativa. */ }
}

function readJournals(): FamiliarCombatJournal[] {
  const stored = readJson<unknown>(JOURNALS_KEY, []);
  return Array.isArray(stored) ? stored.filter((entry): entry is FamiliarCombatJournal => Boolean(entry) && typeof entry === "object" && typeof (entry as FamiliarCombatJournal).battleId === "string") : [];
}

const memoryJournals = new Map<string, FamiliarCombatJournal>();

export function saveFamiglioCombatJournal(journal: FamiliarCombatJournal) {
  memoryJournals.set(journal.battleId, journal);
  const journals = [journal, ...readJournals().filter((entry) => entry.battleId !== journal.battleId)].slice(0, MAX_JOURNALS);
  writeJson(JOURNALS_KEY, journals);
}

export function loadFamiglioCombatJournal(battleId: string): FamiliarCombatJournal | null {
  return memoryJournals.get(battleId) ?? readJournals().find((entry) => entry.battleId === battleId) ?? null;
}

export function readFamiglioCombatReports(): FamiglioCombatBattleReport[] {
  const stored = readJson<unknown>(REPORTS_KEY, []);
  return Array.isArray(stored) ? stored.filter((entry): entry is FamiglioCombatBattleReport => Boolean(entry) && typeof entry === "object" && typeof (entry as FamiglioCombatBattleReport).battleId === "string") : [];
}

export function writeFamiglioCombatReports(reports: readonly FamiglioCombatBattleReport[]) {
  writeJson(REPORTS_KEY, reports.slice(-MAX_REPORTS));
}
