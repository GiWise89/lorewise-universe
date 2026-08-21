"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type CheckoutStatus = {
  configured: boolean;
  authenticated: boolean;
  testMode: boolean;
  mode?: "test" | "live";
  blockers?: string[];
  deliveryReady?: boolean | null;
  deliveryMode?: "automatic" | "manual" | null;
};

export function GamePurchaseButton({ productCode, priceLabel }: { productCode: string; priceLabel: string }) {
  const [status, setStatus] = useState<CheckoutStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Verifica dell’archivio privato in corso…");

  useEffect(() => {
    let active = true;
    fetch(`/api/checkout?productType=game&productCode=${encodeURIComponent(productCode)}`, { cache: "no-store" })
      .then(async (response) => response.json() as Promise<CheckoutStatus>)
      .then((payload) => {
        if (!active) return;
        setStatus(payload);
        if (!payload.configured) setMessage(payload.blockers?.[0] || "Pagamento protetto non ancora disponibile.");
        else if (payload.deliveryReady !== true) setMessage("Installer verificato, ma non ancora archiviato nella consegna privata.");
        else if (!payload.authenticated) setMessage("Accedi al LoreWise ID collegato all’acquisto.");
        else if (payload.testMode) setMessage("Checkout Stripe test pronto · nessun addebito reale.");
        else if (payload.deliveryMode === "manual") setMessage("Pagamento reale · installer consegnato privatamente all'email del LoreWise ID dopo la verifica dell'ordine.");
        else setMessage("Pagamento reale · installer disponibile nella Libreria dopo la conferma Stripe.");
      })
      .catch(() => { if (active) setMessage("Stato della distribuzione temporaneamente non disponibile."); });
    return () => { active = false; };
  }, [productCode]);

  async function purchase() {
    setBusy(true);
    setMessage("Preparazione dell’ordine protetto…");
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productType: "game", productCode }),
      });
      const payload = await response.json() as { checkoutUrl?: string; error?: string };
      if (!response.ok || !payload.checkoutUrl) throw new Error(payload.error || "Checkout non disponibile.");
      window.location.assign(payload.checkoutUrl);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Checkout non disponibile.");
      setBusy(false);
    }
  }

  if (status?.configured && status.deliveryReady && !status.authenticated) {
    return <div className="game-purchase-action"><Link href="/account">Accedi per acquistare · {priceLabel}</Link><span role="status">{message}</span></div>;
  }
  return <div className="game-purchase-action">
    <button type="button" disabled={!status?.configured || status.deliveryReady !== true || busy} onClick={purchase}>
      {busy ? "Preparazione ordine…" : status?.deliveryReady ? `${status.testMode ? "Acquista in modalità test" : "Acquista il gioco"} · ${priceLabel}` : `Acquisto bloccato · ${priceLabel}`}
    </button>
    <span role="status">{message}</span>
  </div>;
}
