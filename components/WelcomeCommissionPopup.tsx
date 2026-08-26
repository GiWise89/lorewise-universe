"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { isWelcomeCommissionOfferActive, WELCOME_COMMISSION_OFFER } from "@/lib/welcomeCommissionOffer";

export function WelcomeCommissionPopup({ preview = false }: { preview?: boolean }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!preview && !isWelcomeCommissionOfferActive()) return;
    if (!preview && window.localStorage.getItem(WELCOME_COMMISSION_OFFER.dismissalKey) === "true") return;
    const frame = window.requestAnimationFrame(() => setVisible(true));
    return () => window.cancelAnimationFrame(frame);
  }, [preview]);

  function closePopup() {
    window.localStorage.setItem(WELCOME_COMMISSION_OFFER.dismissalKey, "true");
    setVisible(false);
  }

  if (!visible) return null;

  return <aside className="welcome-commission-popup" role="dialog" aria-modal="false" aria-labelledby="welcome-commission-title" aria-describedby="welcome-commission-description">
    <button className="welcome-commission-close" type="button" onClick={closePopup} aria-label="Chiudi l’offerta di benvenuto"><span aria-hidden="true">×</span></button>
    <Image className="welcome-commission-emblem" src="/brand/lorewise-wax-seal-v1.webp" alt="Sigillo LoreWise Universe" width={1536} height={1536} unoptimized />
    <div className="welcome-commission-copy">
      <small>Bonus per nuovi e attuali iscritti</small>
      <h2 id="welcome-commission-title">{WELCOME_COMMISSION_OFFER.title}</h2>
      <p id="welcome-commission-description">{WELCOME_COMMISSION_OFFER.description}</p>
      <Link href={WELCOME_COMMISSION_OFFER.href}>{WELCOME_COMMISSION_OFFER.action}<span aria-hidden="true">→</span></Link>
    </div>
  </aside>;
}
