export const MAX_FAMILIAR_LEVEL = 50;

export type FamiliarMilestone = {
  level: 5 | 10 | 20 | 23 | 35 | 40 | 50;
  title: string;
  benefit: string;
  rewardLabel: string;
  reward: {
    coins?: number;
    gadgetId?: "berretto-stellare" | "mantellina-custode";
    themeId?: "biblioteca-astrale";
  };
  scope: "profilo" | "nexus" | "archivio";
};

export const EXTRA_DAILY_MISSION_LEVEL = 10;

export function familiarDailyMissionCount(level: number) {
  return level >= EXTRA_DAILY_MISSION_LEVEL ? 4 : 3;
}

export const FAMILIAR_MILESTONES: FamiliarMilestone[] = [
  { level: 5, title: "Compagno riconosciuto", benefit: "Sigillo del Famiglio nel profilo LoreWise.", rewardLabel: "20 monete Nexus", reward: { coins: 20 }, scope: "profilo" },
  { level: 10, title: "Custode quotidiano", benefit: "1% di sconto idoneo e una missione giornaliera aggiuntiva.", rewardLabel: "30 monete Nexus", reward: { coins: 30 }, scope: "nexus" },
  { level: 20, title: "Legame esperto", benefit: "Titolo Community e sconto Famiglio dell'1,5%.", rewardLabel: "Berretto stellare", reward: { gadgetId: "berretto-stellare" }, scope: "profilo" },
  { level: 23, title: "Passo oltre la soglia", benefit: "Ricompense Fuori casa aumentate del 25% e sconto dell'1,5%.", rewardLabel: "50 monete Nexus", reward: { coins: 50 }, scope: "nexus" },
  { level: 35, title: "Custode dell'Archivio", benefit: "Pagine rare del diario e sconto Famiglio del 2%.", rewardLabel: "Biblioteca astrale", reward: { themeId: "biblioteca-astrale" }, scope: "archivio" },
  { level: 40, title: "Legame raro", benefit: "Emblema raro e sconto Famiglio del 2,5%.", rewardLabel: "Mantellina del Custode", reward: { gadgetId: "mantellina-custode" }, scope: "profilo" },
  { level: 50, title: "Custode leggendario", benefit: "Titolo massimo e sconto Famiglio del 3%.", rewardLabel: "200 monete Nexus", reward: { coins: 200 }, scope: "archivio" },
];

export function familiarExperienceForLevel(level: number) {
  const normalized = Math.min(MAX_FAMILIAR_LEVEL, Math.max(1, Math.floor(level)));
  return Math.pow(normalized - 1, 2) * 25;
}

export function familiarGrowthScale(level: number) {
  const normalized = Math.min(MAX_FAMILIAR_LEVEL, Math.max(1, Math.floor(level)));
  return Number((1 + ((normalized - 1) / (MAX_FAMILIAR_LEVEL - 1)) * .32).toFixed(4));
}

export function familiarUnlockedMilestones(level: number) {
  return FAMILIAR_MILESTONES.filter((milestone) => level >= milestone.level);
}

export function familiarNextMilestone(level: number) {
  return FAMILIAR_MILESTONES.find((milestone) => level < milestone.level) ?? null;
}
