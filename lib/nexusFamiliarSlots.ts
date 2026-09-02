import type { NexusFamiliarState } from "./nexusFamiliar.ts";

export const FAMILIAR_BASE_SLOT_COUNT = 1;
export const UNIVERSE_PASS_EXTRA_FAMILIAR_SLOTS = 2;
export const MAX_FAMILIAR_SLOT_COUNT = FAMILIAR_BASE_SLOT_COUNT + UNIVERSE_PASS_EXTRA_FAMILIAR_SLOTS;

export type FamiliarSlotSummary = Pick<NexusFamiliarState, "familiarId" | "name" | "appearanceId" | "level" | "growthStage"> & {
  active: boolean;
};

export type FamiliarSlotEntitlement = {
  passActive: boolean;
  slotLimit: 1 | 3;
  preservedSlotCount: number;
  canStartPremiumSlot: boolean;
  status: "standard" | "active" | "expired-preserved";
};

export function familiarSlotEntitlement(passActive: boolean, existingSlotCount: number): FamiliarSlotEntitlement {
  const preservedSlotCount = Math.min(MAX_FAMILIAR_SLOT_COUNT, Math.max(0, Math.floor(existingSlotCount)));
  return {
    passActive,
    slotLimit: passActive ? 3 : 1,
    preservedSlotCount,
    canStartPremiumSlot: passActive && preservedSlotCount < MAX_FAMILIAR_SLOT_COUNT,
    status: passActive ? "active" : preservedSlotCount > FAMILIAR_BASE_SLOT_COUNT ? "expired-preserved" : "standard",
  };
}

export function familiarSlotSummary(state: NexusFamiliarState, active: boolean): FamiliarSlotSummary {
  return {
    familiarId: state.familiarId,
    name: state.name,
    appearanceId: state.appearanceId,
    level: state.level,
    growthStage: state.growthStage,
    active,
  };
}
