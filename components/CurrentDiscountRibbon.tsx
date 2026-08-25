import Link from "next/link";
import { corruptedPortraitPromotion, getActiveCommissionPromotion } from "@/lib/commissionPromotion";

export function CurrentDiscountRibbon() {
  const promotion = process.env.LOREWISE_LOCAL_HALLOWEEN_PREVIEW === "true"
    ? corruptedPortraitPromotion
    : getActiveCommissionPromotion();
  const rates = promotion
    ? [
        { audience: "Visitatori", discount: `−${promotion.rates.visitor}%` },
        { audience: "Supporter", discount: `−${promotion.rates.supporter}%` },
        { audience: "Collector", discount: `−${promotion.rates.collector}%` },
      ]
    : [
        { audience: "Visitatori", discount: "Listino" },
        { audience: "Supporter", discount: "−5%" },
        { audience: "Collector", discount: "−10%" },
      ];

  const href = promotion ? `/commissioni?focus=${promotion.focusId}` : "/abbonamento?focus=piani";
  const badge = promotion?.shortLabel ?? "Sconti Universe Pass";
  const action = promotion ? promotion.label : "Confronta i vantaggi";

  return (
    <aside className="studio-ribbon studio-promotion-ribbon" aria-label="Sconti attualmente disponibili">
      <Link className="studio-ribbon-link" href={href} scroll={false} data-focus-navigation="true" aria-label={`${action}: ${rates.map((rate) => `${rate.audience} ${rate.discount}`).join(", ")}`}>
        <span className="studio-ribbon-badge"><i aria-hidden="true" /> {badge}</span>
        <strong className="studio-ribbon-title" aria-label={rates.map((rate) => `${rate.audience} ${rate.discount}`).join(", ")}>
          {rates.map((rate) => <span key={rate.audience}><small>{rate.audience}</small><b>{rate.discount}</b></span>)}
        </strong>
        <span className="studio-ribbon-action">{action} <b aria-hidden="true">→</b></span>
      </Link>
    </aside>
  );
}
