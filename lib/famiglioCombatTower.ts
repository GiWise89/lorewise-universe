import { FAMILIAR_COMBAT_CATALOG, FAMILIAR_COMBAT_CIRCUITS } from "./famiglioCombatCatalog.ts";

export type FamiliarTowerFloorRank = "sfida" | "mini-boss" | "elite" | "boss";
export type FamiliarTowerFloor = {
  floor: number;
  opponentId: string;
  opponentLevel: number;
  circuitId: (typeof FAMILIAR_COMBAT_CIRCUITS)[number]["id"];
  rank: FamiliarTowerFloorRank;
  backgroundSrc: string;
  teamBattle: boolean;
  opponentTeamIds: readonly string[];
};
export type FamiliarTowerRun = { id: string; seed: number; currentFloor: number; floors: readonly FamiliarTowerFloor[] };

const FLOOR_RULES = [
  ["sfida", 0, .2, -1, "prime-orme"], ["sfida", .08, .3, -1, "prime-orme"],
  ["sfida", .18, .42, -2, "bosco-risonanze"], ["mini-boss", .38, .56, 1, "bosco-risonanze"],
  ["sfida", .34, .6, 1, "grotte-celesti"], ["sfida", .46, .68, 1, "grotte-celesti"],
  ["sfida", .56, .78, 2, "rovine-arcane"], ["mini-boss", .7, .88, 2, "rovine-arcane"],
  ["elite", .82, .97, 3, "valle-titani"], ["boss", .92, 1, 4, "soglia-leggendaria"],
] as const;
// I primi tre piani sono di riscaldamento: il rivale ha una frazione del
// livello del giocatore (e uno o due livelli in meno), così anche un Famiglio comune,
// in fondo al roster per forza, li supera di norma. I piani 8-10 restano
// sfide facoltative e dure.
const FLOOR_LEVEL_SCALE = [.75, .8, .85, 1, 1, 1, 1, 1, 1, 1] as const;

export const FAMILIAR_TOWER_FLOOR_BACKGROUNDS = [
  "/famiglio/rebuild/combat/arenas/cortile-prime-orme-v1.webp",
  "/famiglio/rebuild/combat/arenas/bosco-risonanze-v1.webp",
  "/famiglio/rebuild/combat/campaign/arenas/01-cortile-reietti-v1.webp",
  "/famiglio/rebuild/combat/arenas/grotte-celesti-v1.webp",
  "/famiglio/rebuild/combat/campaign/arenas/02-passaggio-velo-v1.webp",
  "/famiglio/rebuild/combat/arenas/rovine-arcane-v1.webp",
  "/famiglio/rebuild/combat/campaign/arenas/03-sala-custodi-v1.webp",
  "/famiglio/rebuild/combat/campaign/arenas/04-forgia-araldi-v1.webp",
  "/famiglio/rebuild/combat/arenas/soglia-leggendaria-v1.webp",
  "/famiglio/rebuild/combat/campaign/arenas/05-trono-nulla-v1.webp",
] as const;

export function familiarTowerFloorBackground(floor: number | null | undefined) {
  const index = Math.max(0, Math.min(FAMILIAR_TOWER_FLOOR_BACKGROUNDS.length - 1, Math.floor(Number(floor) || 1) - 1));
  return FAMILIAR_TOWER_FLOOR_BACKGROUNDS[index];
}

function hashSeed(value: number | string) {
  const text = String(value);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) { hash ^= text.charCodeAt(index); hash = Math.imul(hash, 16777619); }
  return hash >>> 0 || 0x9e3779b9;
}
function nextRandom(seed: number) {
  let next = seed >>> 0 || 0x9e3779b9;
  next ^= next << 13; next ^= next >>> 17; next ^= next << 5; next >>>= 0;
  return [next / 0x100000000, next || 0x9e3779b9] as const;
}
function power(entry: (typeof FAMILIAR_COMBAT_CATALOG)[number]) {
  const rarity = { comune: 0, raro: 1, epico: 2, leggendario: 3 }[entry.rarity] ?? 0;
  return entry.baseStats.hp * .18 + entry.baseStats.attack * .34 + entry.baseStats.defense * .28 + entry.baseStats.speed * .2 + rarity * 8;
}

export function createFamiliarTowerRun(playerId: string, playerLevel: number, seed: number | string = Date.now()): FamiliarTowerRun {
  let rngState = hashSeed(`${seed}:${playerId}:${playerLevel}`);
  const roster = FAMILIAR_COMBAT_CATALOG.filter((entry) => entry.id !== playerId).sort((a, b) => power(a) - power(b) || a.id.localeCompare(b.id));
  const used = new Set<string>();
  const floors = FLOOR_RULES.map(([rank, minPercentile, maxPercentile, levelBonus, circuitId], index) => {
    const minimum = Math.min(roster.length - 1, Math.floor((roster.length - 1) * minPercentile));
    const maximum = Math.max(minimum, Math.min(roster.length - 1, Math.ceil((roster.length - 1) * maxPercentile)));
    let pool = roster.slice(minimum, maximum + 1).filter((entry) => !used.has(entry.id));
    if (!pool.length) pool = roster.slice(minimum, maximum + 1);
    const [roll, next] = nextRandom(rngState); rngState = next;
    const selected = pool[Math.min(pool.length - 1, Math.floor(roll * pool.length))] ?? roster[index % roster.length];
    used.add(selected.id);
    const teamBattle = [4, 8, 10].includes(index + 1);
    // Le riserve rivali hanno una forza vicina a quella del titolare del piano.
    // Prima erano i due Famigli più deboli dell'intero roster, così il boss
    // del decimo piano entrava con gatto e uccellino come compagni e i piani
    // 3 contro 3 erano i più facili della Torre invece dei più impegnativi.
    const supportPool = roster
      .filter((entry) => entry.id !== selected.id && !used.has(entry.id))
      .sort((a, b) => Math.abs(power(a) - power(selected)) - Math.abs(power(b) - power(selected)) || a.id.localeCompare(b.id));
    const supportIds = teamBattle ? supportPool.slice(0, 2).map((entry) => entry.id) : [];
    supportIds.forEach((id) => used.add(id));
    return {
      floor: index + 1,
      opponentId: selected.id,
      opponentLevel: Math.max(1, Math.min(50, Math.round(playerLevel * FLOOR_LEVEL_SCALE[index]) + levelBonus)),
      circuitId,
      rank,
      backgroundSrc: familiarTowerFloorBackground(index + 1),
      teamBattle,
      opponentTeamIds: [selected.id, ...supportIds].slice(0, 3),
    };
  });
  return { id: `tower-${rngState.toString(16)}`, seed: rngState, currentFloor: 1, floors };
}
export function familiarTowerFloor(run: FamiliarTowerRun | null) { return run?.floors[run.currentFloor - 1] ?? null; }
export function advanceFamiliarTower(run: FamiliarTowerRun) { return run.currentFloor >= run.floors.length ? null : { ...run, currentFloor: run.currentFloor + 1 }; }
