"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type CheckoutStatus = { configured: boolean; authenticated: boolean; testMode?: boolean; mode?: "test" | "live"; blockers?: string[] };

export function MembershipPurchaseButton({ productCode, priceLabel }: { productCode: string; priceLabel: string }) {
  const [status, setStatus] = useState<CheckoutStatus | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("Verifica del pagamento protetto in corso…");

  useEffect(() => {
    let active = true;
    fetch(`/api/checkout?productType=subscription&productCode=${encodeURIComponent(productCode)}`, { cache: "no-store" })
      .then(async (response) => response.json() as Promise<CheckoutStatus>)
      .then((payload) => {
        if (!active) return;
        setStatus(payload);
        if (!payload.configured) setMessage(payload.blockers?.[0] || "Pagamento ricorrente non ancora disponibile.");
        else if (!payload.authenticated) setMessage("Accedi al tuo LoreWise ID per scegliere questo piano.");
        else if (payload.testMode) setMessage("Checkout Stripe test · rinnovo mensile simulato · nessun addebito reale.");
        else setMessage("Pagamento reale · rinnovo mensile gestibile in qualsiasi momento dall'Area personale.");
      })
      .catch(() => { if (active) setMessage("Stato dell’abbonamento temporaneamente non disponibile."); });
    return () => { active = false; };
  }, [productCode]);

  async function startCheckout() {
    setSubmitting(true);
    setMessage(status?.testMode ? "Preparazione dell’abbonamento di prova…" : "Preparazione dell’abbonamento…");
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productType: "subscription", productCode }),
      });
      const payload = await response.json() as { checkoutUrl?: string; error?: string };
      if (!response.ok || !payload.checkoutUrl) throw new Error(payload.error || "Checkout non disponibile.");
      window.location.assign(payload.checkoutUrl);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Checkout non disponibile.");
      setSubmitting(false);
    }
  }

  if (status?.configured && !status.authenticated) {
    return <div className="membership-purchase-action"><Link href="/account">Accedi e scegli · {priceLabel}</Link><span role="status">{message}</span></div>;
  }
  return <div className="membership-purchase-action">
    <button type="button" disabled={!status?.configured || submitting} onClick={startCheckout}>
      {submitting ? "Preparazione…" : `Scegli il piano · ${priceLabel}`}
    </button>
    <span role="status">{message}</span>
  </div>;
}
