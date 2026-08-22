export const commissionOpeningPromotion = {
  id: "nexus-opening-2026",
  label: "Promozione di apertura",
  shortLabel: "Promo apertura attiva",
  startsAt: "2026-08-22T00:00:00+02:00",
  endsAt: "2026-09-30T23:59:59.999+02:00",
  period: "Dal 22 agosto al 30 settembre 2026",
  deadlineLabel: "Richieste inviate entro il 30 settembre 2026",
  rates: { visitor: 10, supporter: 15, collector: 20 },
} as const;

export function isCommissionOpeningPromotionActive(at: Date | string = new Date()) {
  const timestamp = at instanceof Date ? at.getTime() : Date.parse(at);
  return Number.isFinite(timestamp)
    && timestamp >= Date.parse(commissionOpeningPromotion.startsAt)
    && timestamp <= Date.parse(commissionOpeningPromotion.endsAt);
}

export function commissionPromotionDiscountPercent(planCode: string | null | undefined) {
  if (planCode === "LW-PASS-COLLECTOR") return commissionOpeningPromotion.rates.collector;
  if (planCode === "LW-PASS-SUPPORTER") return commissionOpeningPromotion.rates.supporter;
  return commissionOpeningPromotion.rates.visitor;
}

export function commissionDiscountForSubmission({ planCode, ordinaryDiscountPercent, submittedAt }: {
  planCode: string | null | undefined;
  ordinaryDiscountPercent: number;
  submittedAt: Date | string;
}) {
  return isCommissionOpeningPromotionActive(submittedAt)
    ? commissionPromotionDiscountPercent(planCode)
    : ordinaryDiscountPercent;
}
