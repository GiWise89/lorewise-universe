"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BlackFridayCountdown } from "@/components/BlackFridayCountdown";
import { blackFridayCampaign, blackFridayTeaser, getBlackFridayCampaignPhase, isBlackFridayTeaserActive } from "@/lib/blackFridayTeaser";
import { getActiveCommissionPromotion, holidayNexusPromotion, type CommissionPromotion } from "@/lib/commissionPromotion";

export function CurrentDiscountRibbon({ initialPromotion = null, previewBlackFriday = false, previewCampaign = false, previewHoliday = false }: { initialPromotion?: CommissionPromotion | null; previewBlackFriday?: boolean; previewCampaign?: boolean; previewHoliday?: boolean }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const refresh = () => setNow(new Date());
    refresh();
    const timer = window.setInterval(refresh, 1_000);
    return () => window.clearInterval(timer);
  }, []);

  const showBlackFridayTeaser = previewBlackFriday || (now ? isBlackFridayTeaserActive(now) : false);
  if (showBlackFridayTeaser) return (
    <aside className="studio-ribbon black-friday-ribbon" aria-label="Conto alla rovescia per il Black Friday 2026">
      <Link className="black-friday-ribbon-link" href={`${blackFridayTeaser.href}${previewBlackFriday ? "?anteprima=1" : ""}`}>
        <Image src="/promotions/black-friday/countdown-clock-emblem-v1.webp" alt="Medaglione con orologio e portale cosmico" width={1254} height={1254} unoptimized />
        <span className="black-friday-ribbon-copy"><small>{blackFridayTeaser.shortLabel}</small><strong>{blackFridayTeaser.label}</strong></span>
        <BlackFridayCountdown compact preview={previewBlackFriday} />
        <span className="black-friday-ribbon-action">Entra nell’attesa <b aria-hidden="true">→</b></span>
      </Link>
    </aside>
  );

  const campaignPhase = previewCampaign ? "black-friday" : now ? getBlackFridayCampaignPhase(now) : "teaser";
  if (campaignPhase === "black-friday" || campaignPhase === "cyber-monday") return (
    <aside className="studio-ribbon black-friday-ribbon is-campaign" aria-label="Promozione Black Friday e Cyber Monday 2026">
      <div className="black-friday-ribbon-link">
        <Image src="/promotions/black-friday/campaign-hero-v1.webp" alt="Tre percorsi promozionali collegati nell’osservatorio cosmico" width={1536} height={1024} unoptimized />
        <span className="black-friday-ribbon-copy"><small>{campaignPhase === "cyber-monday" ? "Cyber Monday · Ultime ore" : blackFridayCampaign.period}</small><strong>{blackFridayCampaign.label}</strong></span>
        <nav className="black-friday-ribbon-routes" aria-label="Accessi diretti alle offerte">
          <Link href="/shop/catalogo"><small>01</small><strong>Shop</strong><span>Tutto il catalogo</span></Link>
          <Link href="/abbonamento?focus=piani"><small>02</small><strong>Pass</strong><span>Primo mese</span></Link>
          <Link href="/vip-zone?area=downloads#cyber-nexus"><small>03</small><strong>Cyber Nexus</strong><span>Incluso nel Pass</span></Link>
        </nav>
        <Link className="black-friday-ribbon-action" href="/black-friday">Vedi la campagna <b aria-hidden="true">→</b></Link>
      </div>
    </aside>
  );

  const promotion = previewHoliday ? holidayNexusPromotion : now ? getActiveCommissionPromotion(now) : initialPromotion;
  if (promotion?.id === holidayNexusPromotion.id) return (
    <aside className="studio-ribbon holiday-home-ribbon" aria-label="Promozione Feste nel Nexus 2026">
      <Link className="holiday-home-ribbon-link" href={`/feste-nel-nexus${previewHoliday ? "?anteprima=feste" : ""}`}>
        <Image className="holiday-home-ribbon-decoration" src="/promotions/holiday/christmas-garland-divider-v1.webp" alt="" width={2172} height={724} unoptimized />
        <span className="holiday-home-ribbon-copy"><small>1 dicembre 2026 · 1 gennaio 2027</small><strong>Feste nel Nexus</strong><span>Regala un mondo. O comincia il tuo.</span></span>
        <span className="holiday-home-ribbon-rates"><b>−{holidayNexusPromotion.rates.visitor}%</b><b>−{holidayNexusPromotion.rates.supporter}%</b><b>−{holidayNexusPromotion.rates.collector}%</b></span>
        <span className="holiday-home-ribbon-action">Scopri la promozione <b aria-hidden="true">→</b></span>
      </Link>
    </aside>
  );
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
