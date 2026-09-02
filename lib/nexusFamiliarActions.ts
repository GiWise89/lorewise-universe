import type { FamiliarItemKey } from "@/lib/nexusFamiliar";

export type FamiliarCareCommand = FamiliarItemKey | "rest";

export type FamiliarCareRequest =
  | { outcome: "start" }
  | { outcome: "queue" }
  | { outcome: "blocked"; reason: "sleeping" | "queue-full" };

export function planFamiliarCareRequest(
  active: FamiliarCareCommand | null,
  queued: FamiliarCareCommand | null,
  sleeping: boolean,
): FamiliarCareRequest {
  if (sleeping || active === "rest") return { outcome: "blocked", reason: "sleeping" };
  if (active !== null && queued !== null) return { outcome: "blocked", reason: "queue-full" };
  if (active !== null) return { outcome: "queue" };
  return { outcome: "start" };
}
