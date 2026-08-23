import Link from "next/link";
import { commissionOpeningPromotion, isCommissionOpeningPromotionActive } from "@/lib/commissionPromotion";

export function CurrentDiscountRibbon() {
  const promotionActive = isCommissionOpeningPromotionActive();
  const rates = promotionActive
    ? [
        { audience: "Visitatori", discount: `−${commissionOpeningPromotion.rates.visitor}%` },
        { audience: "Supporter", discount: `−${commissionOpeningPromotion.rates.supporter}%` },
        { audience: "Collector", discount: `−${commissionOpeningPromotion.rates.collector}%` },
      ]
    : [
        { audience: "Visitatori", discount: "Listino" },
        { audience: "Supporter", discount: "−5%" },
        { audience: "Collector", discount: "−10%" },
      ];

  const href = promotionActive ? "/commissioni?focus=promozione-apertura" : "/abbonamento?focus=piani";
  const badge = promotionActive ? commissionOpeningPromotion.shortLabel : "Sconti Universe Pass";
  const action = promotionActive ? "Scopri la promozione" : "Confronta i vantaggi";

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
