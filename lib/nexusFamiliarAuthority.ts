import { createNexusFamiliar, type NexusFamiliarState } from "./nexusFamiliar.ts";

export function familiarStarterStateIsTrusted(state: NexusFamiliarState, now = new Date()) {
  const starter = createNexusFamiliar(now, state.familiarId, state.appearanceId, { name: state.name, sex: state.sex });
  const earlyGuestExperience = Math.max(0, Math.floor(state.experience));
  return earlyGuestExperience <= 80
    && state.level === starter.level
    && state.nexusCoins === starter.nexusCoins
    && state.claimedMilestoneLevels.length === 0
    && state.caredDays.length === 1
    && state.inventory.food <= starter.inventory.food
    && state.inventory.soap <= starter.inventory.soap
    && state.inventory.medicine <= starter.inventory.medicine
    && state.inventory.toy <= starter.inventory.toy
    && state.den.unlockedThemes.length === 1
    && state.den.unlockedThemes[0] === "rifugio-iniziale"
    && state.den.unlockedGadgets.length === 0
    && state.outing === null
    && state.dailyProgress.careExperience === earlyGuestExperience
    && state.dailyProgress.outingsStarted === 0;
}

export function preserveAuthoritativeFamiliarState(current: NexusFamiliarState, incoming: NexusFamiliarState, now = new Date()): NexusFamiliarState {
  void incoming;
  return {
    ...current,
    name: current.name,
    sex: current.sex,
    appearanceId: current.appearanceId,
    updatedAt: now.toISOString(),
    experience: current.experience,
    level: current.level,
    growthStage: current.growthStage,
    claimedMilestoneLevels: current.claimedMilestoneLevels,
    caredDays: current.caredDays,
    lastCareDate: current.lastCareDate,
    needs: current.needs,
    inventory: current.inventory,
    den: current.den,
    nexusCoins: current.nexusCoins,
    dailyProgress: current.dailyProgress,
    outing: current.outing,
    legacy: current.legacy,
    familiarId: current.familiarId,
    bornAt: current.bornAt,
    species: current.species,
    schemaVersion: current.schemaVersion,
  };
}
