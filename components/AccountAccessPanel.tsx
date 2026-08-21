"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ACCOUNT_MINIMUM_AGE, ACCOUNT_PRIVACY_VERSION } from "@/lib/accountPolicy";
import { createLoreWiseBrowserClient, createLoreWiseRecoveryClient } from "@/lib/supabase/client";

type AuthMode = "login" | "register" | "recover";

function authErrorMessage(error: { code?: string; message: string; status?: number }, email: string) {
  if (error.status === 429 || error.code === "over_email_send_rate_limit" || /rate limit/i.test(error.message)) return `Hai richiesto più email ravvicinate per ${email}. Attendi circa un’ora dall’ultimo invio, poi riprova una sola volta.`;
  if (error.code === "invalid_credentials" || /invalid login credentials/i.test(error.message)) return "Email o password non corrette.";
  if (error.code === "email_not_confirmed" || /email not confirmed/i.test(error.message)) return "Devi ancora confermare il tuo indirizzo email.";
  if (error.code === "user_already_exists" || /already registered|already exists/i.test(error.message)) return "Questa email è già registrata. Accedi oppure imposta una nuova password.";
  if (error.code === "weak_password" || /password/i.test(error.message)) return "La password non rispetta i requisiti di sicurezza.";
  return "Non è stato possibile completare l’operazione. Controlla i dati e riprova.";
}

export function AccountAccessPanel({ configured, userEmail }: { configured: boolean; userEmail?: string }) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [minimumAgeConfirmed, setMinimumAgeConfirmed] = useState(false);
  const [communityEmails, setCommunityEmails] = useState(false);
  const [studioUpdatesEmails, setStudioUpdatesEmails] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode);
    setPassword("");
    setConfirmPassword("");
    setPrivacyAccepted(false);
    setMinimumAgeConfirmed(false);
    setCommunityEmails(false);
    setStudioUpdatesEmails(false);
    setMessage("");
  }

  async function submitCredentials(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const targetEmail = email.trim();
    if (mode === "register" && password !== confirmPassword) return setMessage("Le due password non coincidono.");
    if (mode === "register" && !privacyAccepted) return setMessage("Per creare il profilo devi leggere e accettare l’informativa account.");
    if (mode === "register" && !minimumAgeConfirmed) return setMessage(`Per creare LoreWise ID devi confermare di avere almeno ${ACCOUNT_MINIMUM_AGE} anni.`);
    if (mode !== "recover" && password.length < 8) return setMessage("La password deve contenere almeno 8 caratteri.");

    setBusy(true);
    setMessage(mode === "login" ? "Verifica delle credenziali…" : mode === "register" ? "Creazione del profilo…" : `Invio delle istruzioni a ${targetEmail}…`);

    if (mode === "login") {
      let useBrowserFallback = false;
      try {
        const response = await fetch("/api/account/session", {
          method: "POST",
          headers: { accept: "application/json", "content-type": "application/json" },
          body: JSON.stringify({ email: targetEmail, password }),
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => null) as { error?: string } | null;
          if (response.status !== 503) {
            setBusy(false);
            return setMessage(payload?.error || "Non è stato possibile completare l’accesso. Riprova.");
          }
          useBrowserFallback = true;
        }
      } catch {
        useBrowserFallback = true;
      }

      if (useBrowserFallback) {
        const browserClient = createLoreWiseBrowserClient();
        if (!browserClient) {
          setBusy(false);
          return setMessage("Il servizio di accesso non è ancora collegato.");
        }
        const { data, error } = await browserClient.auth.signInWithPassword({ email: targetEmail, password });
        if (error || !data.session) {
          setBusy(false);
          return setMessage(authErrorMessage(error ?? { message: "Sessione non creata." }, targetEmail));
        }
      }

      setBusy(false);
      window.location.assign("/account?accesso=sessione-attiva");
      return;
    }

    const client = createLoreWiseBrowserClient();
    if (!client) {
        setBusy(false);
      return setMessage("Il servizio di accesso non è ancora collegato.");
    }

    if (mode === "register") {
      const { data, error } = await client.auth.signUp({
        email: targetEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/account`,
          data: {
            privacy_version: ACCOUNT_PRIVACY_VERSION,
            minimum_age_confirmed: ACCOUNT_MINIMUM_AGE,
            community_emails: communityEmails,
            studio_updates_emails: studioUpdatesEmails,
          },
        },
      });
      setBusy(false);
      if (error) return setMessage(authErrorMessage(error, targetEmail));
      if (data.session) window.location.assign("/account?accesso=confermato");
      else setMessage(`Profilo creato per ${targetEmail}. Conferma una sola volta l’email ricevuta, poi potrai accedere con la password.`);
      return;
    }

    const recoveryDestination = new URL("/auth/confirm", window.location.origin);
    recoveryDestination.searchParams.set("next", "/account/password");
    const recoveryClient = createLoreWiseRecoveryClient();
    if (!recoveryClient) {
      setBusy(false);
      return setMessage("Il servizio di recupero non è configurato.");
    }
    const { error } = await recoveryClient.auth.resetPasswordForEmail(targetEmail, { redirectTo: recoveryDestination.toString() });
    setBusy(false);
    if (error) return setMessage(authErrorMessage(error, targetEmail));
    setMessage(`Istruzioni inviate a ${targetEmail}. L’email aprirà prima una conferma protetta LoreWise: il recupero partirà soltanto quando premerai il pulsante.`);
  }

  async function signOut() {
    setBusy(true);
    await fetch("/api/account/session", { method: "DELETE", headers: { accept: "application/json" } });
    window.location.assign("/account");
  }

  if (userEmail) return <section className="account-session" aria-label="Sessione LoreWise"><span>Profilo verificato</span><strong>{userEmail}</strong><button type="button" onClick={() => void signOut()} disabled={busy}>Esci dall’account</button></section>;

  return <section className="account-signin" aria-labelledby="account-signin-title">
    <div><p className="eyebrow">LoreWise ID</p><h2 id="account-signin-title">Entra nel tuo universo.</h2><p>Registrati con email e password oppure accedi al tuo profilo. L’email serve una sola volta per confermare l’identità e per recuperare la password.</p></div>
    {configured ? <div className="account-signin-actions">
      <div className="account-auth-modes" aria-label="Scegli il tipo di accesso">
        <button type="button" aria-pressed={mode === "login"} onClick={() => changeMode("login")}>Accedi</button>
        <button type="button" aria-pressed={mode === "register"} onClick={() => changeMode("register")}>Registrati</button>
        <button type="button" aria-pressed={mode === "recover"} onClick={() => changeMode("recover")}>Imposta o recupera password</button>
      </div>
      <form onSubmit={(event) => void submitCredentials(event)}>
        <label htmlFor="account-email">La tua email</label>
        <input id="account-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required disabled={busy} placeholder="nome@esempio.it" />
        {mode !== "recover" ? <><label htmlFor="account-password">Password</label><input id="account-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} required disabled={busy} placeholder="Almeno 8 caratteri" /></> : null}
        {mode === "register" ? <><label htmlFor="account-password-confirm">Conferma password</label><input id="account-password-confirm" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" minLength={8} required disabled={busy} placeholder="Ripeti la password" /></> : null}
        {mode === "register" ? <fieldset className="account-registration-consents"><legend>Privacy e comunicazioni</legend>
          <label><input type="checkbox" checked={minimumAgeConfirmed} onChange={(event) => setMinimumAgeConfirmed(event.target.checked)} required disabled={busy} /><span><strong>Confermo di avere almeno {ACCOUNT_MINIMUM_AGE} anni</strong><small>Necessario per creare LoreWise ID. I contenuti contrassegnati 18+ restano comunque riservati esclusivamente agli adulti.</small></span></label>
          <label><input type="checkbox" checked={privacyAccepted} onChange={(event) => setPrivacyAccepted(event.target.checked)} required disabled={busy} /><span><strong>Accetto l’informativa account</strong><small>Necessaria per creare e gestire il profilo. <Link href="/privacy" target="_blank">Leggi la bozza locale</Link>.</small></span></label>
          <label><input type="checkbox" checked={communityEmails} onChange={(event) => setCommunityEmails(event.target.checked)} disabled={busy} /><span><strong>Aggiornamenti dalla Community</strong><small>Facoltativi. Potrai disattivarli in qualsiasi momento.</small></span></label>
          <label><input type="checkbox" checked={studioUpdatesEmails} onChange={(event) => setStudioUpdatesEmails(event.target.checked)} disabled={busy} /><span><strong>Novità di GiWise Studio</strong><small>Facoltative e separate dalla creazione dell’account.</small></span></label>
        </fieldset> : null}
        <button type="submit" disabled={busy}>{busy ? "Operazione in corso…" : mode === "login" ? "Accedi al profilo" : mode === "register" ? "Crea il profilo" : "Invia le istruzioni"}</button>
      </form>
      {message ? <p role="status" aria-live="polite">{message}</p> : null}
    </div> : <div className="account-signin-pending"><strong>Collegamento non ancora attivo</strong><p>La schermata è pronta. Servono le credenziali del progetto Supabase e il servizio email prima di aprire le registrazioni.</p></div>}
  </section>;
}
