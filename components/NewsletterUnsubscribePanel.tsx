"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./NewsletterStatus.module.css";

export function NewsletterUnsubscribePanel({ token }: { token: string }) {
  const [state, setState] = useState<"checking" | "ready" | "invalid" | "done">("checking");
  const [message, setMessage] = useState("Controllo del link…");
  const [label, setLabel] = useState("questa lista");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    void fetch(`/api/newsletter/unsubscribe?token=${encodeURIComponent(token)}`, { cache: "no-store" })
      .then((response) => response.json() as Promise<{ valid?: boolean; label?: string; alreadyUnsubscribed?: boolean }>)
      .then((body) => {
        if (!active) return;
        if (body.valid !== true) { setState("invalid"); setMessage("Questo link non è valido o non è più disponibile."); return; }
        if (body.label) setLabel(body.label);
        if (body.alreadyUnsubscribed) { setState("done"); setMessage("Questa iscrizione risulta già annullata: non riceverai altre email."); return; }
        setState("ready"); setMessage("");
      })
      .catch(() => { if (active) { setState("invalid"); setMessage("Non è stato possibile controllare il link."); } });
    return () => { active = false; };
  }, [token]);

  async function unsubscribe() {
    setBusy(true); setMessage("Annullamento in corso…");
    try {
      const response = await fetch("/api/newsletter/unsubscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
      const body = await response.json() as { message?: string; error?: string };
      if (!response.ok) throw new Error(body.error || "Annullamento non riuscito.");
      setState("done"); setMessage(body.message || "Iscrizione annullata.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Annullamento non riuscito."); }
    finally { setBusy(false); }
  }

  return <section className={styles.card} aria-labelledby="newsletter-unsubscribe-title">
    <p className={styles.eyebrow}>Preferenze email</p>
    <h1 id="newsletter-unsubscribe-title">{state === "done" ? "Scelta registrata." : "Vuoi annullare l’iscrizione?"}</h1>
    <p role="status" aria-live="polite">{state === "ready" ? `Smetterai di ricevere le email per “${label}”. Le altre iscrizioni e le comunicazioni del tuo LoreWise ID non cambiano.` : message}</p>
    <div className={styles.actions}>
      {state === "ready" ? <button type="button" className={styles.primary} disabled={busy} onClick={() => void unsubscribe()}>{busy ? "Annullamento…" : "Annulla l’iscrizione"}</button> : null}
      <Link href="/">Torna alla home</Link>
    </div>
  </section>;
}
