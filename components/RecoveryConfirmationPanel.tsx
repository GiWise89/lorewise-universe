"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createLoreWiseBrowserClient } from "@/lib/supabase/client";

export function RecoveryConfirmationPanel({ tokenHash, code, destination }: { tokenHash?: string; code?: string; destination: string }) {
  const [implicitSession, setImplicitSession] = useState<{ accessToken: string; refreshToken: string } | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (tokenHash || code) {
      queueMicrotask(() => setImplicitSession(null));
      return;
    }
    const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const accessToken = fragment.get("access_token");
    const refreshToken = fragment.get("refresh_token");
    const type = fragment.get("type");
    queueMicrotask(() => setImplicitSession(accessToken && refreshToken && type === "recovery" ? { accessToken, refreshToken } : null));
  }, [code, tokenHash]);

  async function confirmRecovery() {
    setBusy(true);
    setMessage("Verifica sicura in corso…");

    if (implicitSession) {
      const client = createLoreWiseBrowserClient();
      if (!client) {
        setBusy(false);
        setMessage("Il servizio di accesso non è configurato.");
        return;
      }
      const { error } = await client.auth.setSession({ access_token: implicitSession.accessToken, refresh_token: implicitSession.refreshToken });
      if (error) {
        setBusy(false);
        setMessage("Questo recupero non è più valido. Richiedi un nuovo messaggio dall’area account.");
        return;
      }
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
      await fetch("/api/account/sync", { method: "POST", headers: { accept: "application/json" } });
      window.location.replace(destination);
      return;
    }

    if (code) {
      const client = createLoreWiseBrowserClient();
      if (!client) {
        setBusy(false);
        setMessage("Il servizio di accesso non è configurato.");
        return;
      }
      const { error } = await client.auth.exchangeCodeForSession(code);
      if (error) {
        setBusy(false);
        setMessage("Il codice non può essere verificato. Se questa pagina era già aperta, attendi la correzione e usa una sola volta il messaggio più recente.");
        return;
      }
      await fetch("/api/account/sync", { method: "POST", headers: { accept: "application/json" } });
      window.location.replace(destination);
      return;
    }

    const response = await fetch("/api/account/recovery/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json", accept: "application/json" },
      body: JSON.stringify({ tokenHash, destination }),
    });
    const body = await response.json().catch(() => ({})) as { destination?: string; error?: string };
    if (!response.ok || !body.destination) {
      setBusy(false);
      setMessage(body.error || "Non è stato possibile verificare il recupero. Richiedi un nuovo messaggio dall’area account.");
      return;
    }
    window.location.replace(body.destination);
  }

  return <main className="auth-callback-page auth-confirm-page" aria-labelledby="auth-confirm-title">
    <div>
      <p className="eyebrow">LoreWise ID · conferma protetta</p>
      <h1 id="auth-confirm-title">Sei stato tu?</h1>
      <p>Il collegamento non ha ancora modificato il tuo account. Conferma qui sotto soltanto se hai richiesto tu una nuova password.</p>
      {tokenHash || code || implicitSession ? <button type="button" onClick={() => void confirmRecovery()} disabled={busy}>{busy ? "Verifica in corso…" : "Conferma il recupero password"}</button> : null}
      {!tokenHash && !code && implicitSession === undefined ? <p className="auth-confirm-message" role="status">Controllo del collegamento in corso…</p> : null}
      {!tokenHash && !code && implicitSession === null ? <p className="auth-confirm-message" role="status">Il collegamento di recupero è incompleto o non più valido.</p> : null}
      {message ? <p className="auth-confirm-message" role="status" aria-live="polite">{message}</p> : null}
      <Link href="/account">Annulla e torna all’area account</Link>
    </div>
  </main>;
}
