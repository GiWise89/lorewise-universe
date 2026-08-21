import type { UniversePassBenefit } from "./universePass.ts";

export type VipAccessReason = "signed-out" | "disabled" | "pass-required";

export function evaluateVipAccess(input: { authenticated: boolean; accountActive: boolean; passActive: boolean }) {
  if (!input.authenticated) return { allowed: false, reason: "signed-out" as const };
  if (!input.accountActive) return { allowed: false, reason: "disabled" as const };
  if (!input.passActive) return { allowed: false, reason: "pass-required" as const };
  return { allowed: true, reason: null } as const;
}

export function buildVipMemberProfile(pass: UniversePassBenefit) {
  return {
    plan: pass.name,
    badge: pass.communityBadge,
    artworkDiscountPercent: pass.artworkDiscountPercent,
    collectorDossiers: pass.collectorDossiers,
    accessLabel: pass.collectorDossiers ? "Dossier estesi Collector" : "Anteprime e materiali Supporter",
  };
}
