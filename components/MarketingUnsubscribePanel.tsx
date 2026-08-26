"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function MarketingUnsubscribePanel({ token }: { token: string }) {
  const [state, setState] = useState<"checking" | "ready" | "invalid" | "done">("checking");
  const [message, setMessage] = useState("Controllo del link…");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    void fetch(`/api/email-preferences/unsubscribe?token=${encodeURIComponent(token)}`, { cache: "no-store" })
      .then((response) => response.json())
      .then((body: unknown) => {
        const valid = typeof body === "object" && body !== null && "valid" in body && body.valid === true;
        if (active) { setState(valid ? "ready" : "invalid"); setMessage(valid ? "" : "Questo link non è valido o non è più disponibile."); }
      })
      .catch(() => { if (active) { setState("invalid"); setMessage("Non è stato possibile controllare il link."); } });
    return () => { active = false; };
  }, [token]);

  async function unsubscribe() {
    setBusy(true); setMessage("Disattivazione in corso…");
    try {
      const response = await fetch("/api/email-preferences/unsubscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
      const body = await response.json() as { message?: string; error?: string };
      if (!response.ok) throw new Error(body.error || "Disattivazione non riuscita.");
      setState("done"); setMessage(body.message || "Comunicazioni disattivate.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Disattivazione non riuscita."); }
    finally { setBusy(false); }
  }

  return <section className="marketing-unsubscribe-card">
    <p className="eyebrow">Preferenze email</p>
    <h1>{state === "done" ? "Scelta aggiornata." : "Vuoi fermare le novità dello Studio?"}</h1>
    <p>{state === "ready" ? "Disattiveremo soltanto le email facoltative su opere, giochi, commissioni e promozioni. Ricevute, sicurezza e messaggi necessari al tuo LoreWise ID non cambieranno." : message}</p>
    {state === "ready" ? <button type="button" disabled={busy} onClick={() => void unsubscribe()}>{busy ? "Disattivazione…" : "Disattiva Novità di GiWise Studio"}</button> : null}
    <Link href="/account">Apri le preferenze del LoreWise ID</Link>
  </section>;
}
