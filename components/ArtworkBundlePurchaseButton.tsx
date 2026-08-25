"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type CheckoutStatus = {
  configured: boolean;
  authenticated: boolean;
  testMode: boolean;
  blockers?: string[];
  deliveryReady?: boolean | null;
  saleWindowActive?: boolean;
};

export function ArtworkBundlePurchaseButton({ productCode }: { productCode: string }) {
  const [status, setStatus] = useState<CheckoutStatus | null>(null);
  const [message, setMessage] = useState("Verifica della collezione in corso…");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`/api/checkout?productType=artwork&productCode=${encodeURIComponent(productCode)}`, { cache: "no-store" })
      .then(async (response) => response.json() as Promise<CheckoutStatus>)
      .then((payload) => {
        if (!active) return;
        setStatus(payload);
        if (payload.saleWindowActive === false) setMessage("Acquisto disponibile dal 1° ottobre al 1° novembre 2026.");
        else if (!payload.configured) setMessage(payload.blockers?.[0] || "Pagamento protetto non ancora disponibile.");
        else if (payload.deliveryReady === false) setMessage("I tre file privati devono essere approvati prima dell’acquisto.");
        else if (!payload.authenticated) setMessage("Accedi al tuo LoreWise ID per acquistare la collezione.");
        else if (payload.testMode) setMessage("Checkout Stripe in modalità test · nessun addebito reale.");
        else setMessage("Tre licenze personali e tre download protetti dopo la conferma Stripe.");
      })
      .catch(() => setMessage("Stato del pagamento temporaneamente non disponibile."));
    return () => { active = false; };
  }, [productCode]);

  async function startCheckout() {
    setSubmitting(true);
    setMessage("Preparazione della collezione…");
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productType: "artwork", productCode }),
      });
      const payload = await response.json() as { checkoutUrl?: string; error?: string };
      if (!response.ok || !payload.checkoutUrl) throw new Error(payload.error || "Checkout non disponibile.");
      window.location.assign(payload.checkoutUrl);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Checkout non disponibile.");
      setSubmitting(false);
    }
  }

  if (status?.saleWindowActive && status.configured && !status.authenticated) {
    return <div className="horror-bundle-action"><Link href="/account">Accedi per acquistare · 24,90 €</Link><span role="status">{message}</span></div>;
  }

  const enabled = Boolean(status?.saleWindowActive && status.configured && status.deliveryReady && !submitting);
  return <div className="horror-bundle-action">
    <button type="button" disabled={!enabled} onClick={startCheckout}>{submitting ? "Preparazione…" : "Collezione completa · 24,90 €"}</button>
    <span role="status">{message}</span>
  </div>;
}
