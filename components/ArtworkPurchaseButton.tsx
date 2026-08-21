"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type CheckoutStatus = { configured: boolean; authenticated: boolean; testMode: boolean; mode?: "test" | "live"; blockers?: string[]; deliveryReady?: boolean | null; deliveryMode?: "automatic" | "manual" | null };

export function ArtworkPurchaseButton({ productCode, priceLabel }: { productCode: string; priceLabel: string }) {
  const [status, setStatus] = useState<CheckoutStatus | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("Verifica del pagamento protetto in corso…");
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`/api/checkout?productType=artwork&productCode=${encodeURIComponent(productCode)}`, { cache: "no-store" })
      .then(async (response) => response.json() as Promise<CheckoutStatus>)
      .then((payload) => {
        if (!active) return;
        setStatus(payload);
        setHasError(false);
        if (!payload.configured) setMessage(payload.blockers?.[0] || "Pagamento protetto non ancora disponibile.");
        else if (payload.deliveryReady === false) setMessage("Pacchetto privato non ancora approvato: l’acquisto resta bloccato.");
        else if (!payload.authenticated) setMessage("Accedi al tuo LoreWise ID prima dell'acquisto.");
        else if (payload.testMode) setMessage("Checkout Stripe in modalità test · nessun addebito reale.");
        else if (payload.deliveryMode === "manual") setMessage("Pagamento reale · consegna privata all'email associata al LoreWise ID dopo la verifica dell'ordine.");
        else setMessage("Pagamento reale · download protetto disponibile dopo la conferma Stripe.");
      })
      .catch(() => { if (active) { setHasError(true); setMessage("Stato del pagamento temporaneamente non disponibile."); } });
    return () => { active = false; };
  }, [productCode]);

  async function startCheckout() {
    setSubmitting(true);
    setHasError(false);
    setMessage("Preparazione dell'ordine protetto…");
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
      setHasError(true);
      setMessage(error instanceof Error ? error.message : "Checkout non disponibile.");
      setSubmitting(false);
    }
  }

  if (status?.configured && !status.authenticated) {
    return <div className="artwork-purchase-action"><Link className="artwork-purchase-login" href="/account">Accedi per acquistare · {priceLabel}</Link><span className={hasError ? "purchase-feedback-error" : undefined} role="status">{message}</span></div>;
  }
  return <div className="artwork-purchase-action">
    <button type="button" disabled={!status?.configured || status.deliveryReady !== true || submitting} onClick={startCheckout} aria-describedby="purchase-status">
      {submitting ? "Preparazione ordine…" : status?.configured ? `${status.testMode ? "Acquista in modalità test" : "Acquista ora"} · ${priceLabel}` : `Acquisto protetto · ${priceLabel}`}
    </button>
    <span id="purchase-status" className={hasError ? "purchase-feedback-error" : undefined} role={hasError ? "alert" : "status"}>{message}</span>
  </div>;
}
