"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { createLoreWiseBrowserClient } from "@/lib/supabase/client";

export default function AccountPasswordPage() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("Verifica del link di recupero…");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const client = createLoreWiseBrowserClient();
    if (!client) {
      queueMicrotask(() => setMessage("Il servizio di accesso non è configurato."));
      return;
    }
    void client.auth.getUser().then(({ data, error }) => {
      if (error || !data.user) setMessage("Il link non è valido o è scaduto. Richiedine uno nuovo dall’area account.");
      else { setReady(true); setMessage(""); }
    });
  }, []);

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.length < 8) return setMessage("La password deve contenere almeno 8 caratteri.");
    if (password !== confirmPassword) return setMessage("Le due password non coincidono.");
    setBusy(true);
    const response = await fetch("/api/account/password", {
      method: "POST",
      headers: { "Content-Type": "application/json", accept: "application/json" },
      body: JSON.stringify({ password }),
    });
    setBusy(false);
    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as { error?: string };
      return setMessage(body.error || "Non è stato possibile salvare la nuova password.");
    }
    window.location.replace("/account?accesso=password-impostata");
  }

  return <main className="account-password-page"><section aria-labelledby="account-password-title">
    <p className="eyebrow">LoreWise ID · sicurezza</p>
    <h1 id="account-password-title">Scegli la tua password.</h1>
    <p>Usa almeno 8 caratteri e non riutilizzare una password già impiegata altrove.</p>
    {ready ? <form onSubmit={(event) => void updatePassword(event)}>
      <label htmlFor="new-password">Nuova password</label><input id="new-password" type="password" autoComplete="new-password" minLength={8} required disabled={busy} value={password} onChange={(event) => setPassword(event.target.value)} />
      <label htmlFor="confirm-new-password">Conferma nuova password</label><input id="confirm-new-password" type="password" autoComplete="new-password" minLength={8} required disabled={busy} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
      <button type="submit" disabled={busy}>{busy ? "Salvataggio…" : "Salva la nuova password"}</button>
    </form> : null}
    {message ? <p role="status" aria-live="polite">{message}</p> : null}
    <Link href="/account">Torna all’area account</Link>
  </section></main>;
}
