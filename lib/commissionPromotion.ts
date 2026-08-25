export const CORRUPTED_PORTRAIT_PACKAGE = "La mia versione corrotta";

export const commissionOpeningPromotion = {
  id: "nexus-opening-2026",
  focusId: "promozione-apertura",
  label: "Promozione di apertura",
  shortLabel: "Promo apertura attiva",
  title: "Più vantaggi per chi entra ora nel Nexus.",
  description: "Lo sconto viene calcolato sul preventivo finale e resta acquisito anche se il lavoro termina dopo la scadenza.",
  startsAt: "2026-08-22T00:00:00+02:00",
  endsAt: "2026-09-30T23:59:59.999+02:00",
  period: "Dal 22 agosto al 30 settembre 2026",
  deadlineLabel: "Richieste inviate entro il 30 settembre 2026",
  rates: { visitor: 10, supporter: 15, collector: 20 },
  eligiblePackage: null,
} as const;

export const corruptedPortraitPromotion = {
  id: "halloween-corrupted-portrait-2026",
  focusId: "la-mia-versione-corrotta",
  label: "La mia versione corrotta",
  shortLabel: "Halloween · fino a −25%",
  title: "Scopri la tua versione corrotta.",
  description: "Un ritratto personale reinterpretato in stile horror. Valgono le stesse regole delle commissioni ordinarie; lo sconto sul preventivo finale è del 15% per i Visitatori, 20% per i Supporter e 25% per i Collector, senza cumulo con altri sconti.",
  startsAt: "2026-10-26T00:00:00+01:00",
  endsAt: "2026-11-01T23:59:59.999+01:00",
  period: "Dal 26 ottobre al 1° novembre 2026",
  deadlineLabel: "Richieste La mia versione corrotta inviate entro il 1° novembre 2026",
  rates: { visitor: 15, supporter: 20, collector: 25 },
  eligiblePackage: CORRUPTED_PORTRAIT_PACKAGE,
} as const;

export type CommissionPromotion = typeof commissionOpeningPromotion | typeof corruptedPortraitPromotion;

function isPromotionActive(promotion: CommissionPromotion, at: Date | string = new Date()) {
  const timestamp = at instanceof Date ? at.getTime() : Date.parse(at);
  return Number.isFinite(timestamp)
    && timestamp >= Date.parse(promotion.startsAt)
    && timestamp <= Date.parse(promotion.endsAt);
}

export function isCommissionOpeningPromotionActive(at: Date | string = new Date()) {
  return isPromotionActive(commissionOpeningPromotion, at);
}

export function isCorruptedPortraitPromotionActive(at: Date | string = new Date()) {
  return isPromotionActive(corruptedPortraitPromotion, at);
}

export function getActiveCommissionPromotion(at: Date | string = new Date()): CommissionPromotion | null {
  if (isCommissionOpeningPromotionActive(at)) return commissionOpeningPromotion;
  if (isCorruptedPortraitPromotionActive(at)) return corruptedPortraitPromotion;
  return null;
}

export function getCommissionPromotionForSubmission(packageName: string, submittedAt: Date | string) {
  if (packageName === CORRUPTED_PORTRAIT_PACKAGE
    && typeof process !== "undefined"
    && process.env.LOREWISE_LOCAL_HALLOWEEN_PREVIEW === "true") {
    return corruptedPortraitPromotion;
  }
  const promotion = getActiveCommissionPromotion(submittedAt);
  if (!promotion) return null;
  if (promotion.eligiblePackage && promotion.eligiblePackage !== packageName) return null;
  return promotion;
}

export function commissionPromotionDiscountPercent(planCode: string | null | undefined, promotion: CommissionPromotion = commissionOpeningPromotion) {
  if (planCode === "LW-PASS-COLLECTOR") return promotion.rates.collector;
  if (planCode === "LW-PASS-SUPPORTER") return promotion.rates.supporter;
  return promotion.rates.visitor;
}

export function commissionDiscountForSubmission({ planCode, ordinaryDiscountPercent, submittedAt, packageName = "" }: {
  planCode: string | null | undefined;
  ordinaryDiscountPercent: number;
  submittedAt: Date | string;
  packageName?: string;
}) {
  const promotion = getCommissionPromotionForSubmission(packageName, submittedAt);
  if (!promotion) return ordinaryDiscountPercent;
  return Math.max(ordinaryDiscountPercent, commissionPromotionDiscountPercent(planCode, promotion));
}
