import type { NexusFamiliarState } from "./nexusFamiliar.ts";

export const FAMILIAR_BASE_SLOT_COUNT = 1;
export const PURCHASABLE_EXTRA_FAMILIAR_SLOTS = 2;
export const MAX_FAMILIAR_SLOT_COUNT = FAMILIAR_BASE_SLOT_COUNT + PURCHASABLE_EXTRA_FAMILIAR_SLOTS;
export const FAMILIAR_SLOT_OFFER_IDS = ["slot-famiglio-2", "slot-famiglio-3"] as const;

export type FamiliarSlotSummary = Pick<NexusFamiliarState, "familiarId" | "name" | "appearanceId" | "level" | "growthStage"> & {
  active: boolean;
};

export type FamiliarSlotEntitlement = {
  purchasedExtraSlots: number;
  slotLimit: 1 | 2 | 3;
  preservedSlotCount: number;
  canStartPremiumSlot: boolean;
  status: "standard" | "active";
};

export function familiarSlotEntitlement(purchasedExtraSlots: number, existingSlotCount: number): FamiliarSlotEntitlement {
  const preservedSlotCount = Math.min(MAX_FAMILIAR_SLOT_COUNT, Math.max(0, Math.floor(existingSlotCount)));
  const paidSlots = Math.min(PURCHASABLE_EXTRA_FAMILIAR_SLOTS, Math.max(0, Math.floor(purchasedExtraSlots)));
  const slotLimit = (FAMILIAR_BASE_SLOT_COUNT + paidSlots) as 1 | 2 | 3;
  return {
    purchasedExtraSlots: paidSlots,
    slotLimit,
    preservedSlotCount,
    canStartPremiumSlot: preservedSlotCount < slotLimit,
    status: paidSlots > 0 ? "active" : "standard",
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
