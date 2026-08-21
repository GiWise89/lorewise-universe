"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ACCOUNT_DELETION_CONFIRMATION, ACCOUNT_PROFILE_LIMITS } from "@/lib/accountPolicy";

type Profile = {
  email: string;
  displayName: string;
  role: string;
  locale: string;
  communityEmails: boolean;
  studioUpdatesEmails: boolean;
  codexSpoilerPreference: "protected" | "open";
  privacyVersion: string | null;
  privacyAcceptedAt: string | null;
  createdAt: string;
  status: string;
  deletionRequestedAt: string | null;
};

export function AccountProfilePanel() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [communityEmails, setCommunityEmails] = useState(false);
  const [studioUpdatesEmails, setStudioUpdatesEmails] = useState(false);
  const [codexSpoilerPreference, setCodexSpoilerPreference] = useState<"protected" | "open">("protected");
  const [message, setMessage] = useState("Caricamento del profilo…");
  const [busy, setBusy] = useState(false);
  const [deletionConfirmation, setDeletionConfirmation] = useState("");
  const [deletionUnderstood, setDeletionUnderstood] = useState(false);

  useEffect(() => {
    let active = true;
    void fetch("/api/account/profile", { headers: { accept: "application/json" } })
      .then(async (response) => {
        const body = await response.json() as { profile?: Profile; error?: string };
        if (!response.ok || !body.profile) throw new Error(body.error || "Profilo non disponibile.");
        if (!active) return;
        setProfile(body.profile);
        setDisplayName(body.profile.displayName);
        setCommunityEmails(body.profile.communityEmails);
        setStudioUpdatesEmails(body.profile.studioUpdatesEmails);
        setCodexSpoilerPreference(body.profile.codexSpoilerPreference);
        window.localStorage.setItem("lorewise-codex-spoilers", body.profile.codexSpoilerPreference);
        setMessage("");
      })
      .catch((error: Error) => active && setMessage(error.message));
    return () => { active = false; };
  }, []);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("Salvataggio in corso…");
    try {
      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", accept: "application/json" },
        body: JSON.stringify({ displayName, communityEmails, studioUpdatesEmails, codexSpoilerPreference }),
      });
      const body = await response.json() as { profile?: Profile; error?: string; message?: string };
      if (!response.ok || !body.profile) throw new Error(body.error || "Salvataggio non completato.");
      setProfile(body.profile);
      window.localStorage.setItem("lorewise-codex-spoilers", body.profile.codexSpoilerPreference);
      setMessage(body.message || "Preferenze salvate.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Salvataggio non completato.");
    } finally {
      setBusy(false);
    }
  }

  async function requestDeletion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("Registrazione della richiesta…");
    try {
      const response = await fetch("/api/account/deletion-request", {
        method: "POST",
        headers: { "Content-Type": "application/json", accept: "application/json" },
        body: JSON.stringify({ confirmation: deletionConfirmation, understood: deletionUnderstood }),
      });
      const body = await response.json() as { status?: string; requestedAt?: string; error?: string; message?: string };
      if (!response.ok) throw new Error(body.error || "Richiesta non completata.");
      setProfile((current) => current ? { ...current, status: body.status ?? "deletion_requested", deletionRequestedAt: body.requestedAt ?? new Date().toISOString(), communityEmails: false, studioUpdatesEmails: false } : current);
      setCommunityEmails(false);
      setStudioUpdatesEmails(false);
      setDeletionConfirmation("");
      setDeletionUnderstood(false);
      setMessage(body.message || "Richiesta registrata.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Richiesta non completata.");
    } finally {
      setBusy(false);
    }
  }

  async function cancelDeletion() {
    setBusy(true);
    setMessage("Annullamento della richiesta…");
    try {
      const response = await fetch("/api/account/deletion-request", { method: "DELETE", headers: { accept: "application/json" } });
      const body = await response.json() as { status?: string; error?: string; message?: string };
      if (!response.ok) throw new Error(body.error || "Annullamento non completato.");
      setProfile((current) => current ? { ...current, status: body.status ?? "active", deletionRequestedAt: null } : current);
      setMessage(body.message || "Richiesta annullata.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Annullamento non completato.");
    } finally {
      setBusy(false);
    }
  }

  return <section id="account-profile" className="account-profile" aria-labelledby="account-profile-title">
    <header><p className="eyebrow">Profilo e preferenze</p><h2 id="account-profile-title">Il tuo spazio, alle tue condizioni.</h2><p>Email di servizio e comunicazioni facoltative restano separate. Le preferenze possono essere cambiate in qualsiasi momento.</p></header>
    {profile ? <form onSubmit={(event) => void saveProfile(event)}>
      <div className="account-profile-identity"><span>LoreWise ID</span><strong>{profile.email}</strong><small>Ruolo: {profile.role === "member" ? "Membro" : profile.role} · Lingua: Italiano</small></div>
      <label htmlFor="profile-display-name">Nome pubblico o firma</label>
      <input id="profile-display-name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={ACCOUNT_PROFILE_LIMITS.displayName} placeholder="Come vuoi essere chiamato" />
      <fieldset><legend>Comunicazioni facoltative</legend>
        <label><input type="checkbox" checked={communityEmails} onChange={(event) => setCommunityEmails(event.target.checked)} /><span><strong>Community</strong><small>Risposte, moderazione e novità legate alle tue interazioni.</small></span></label>
        <label><input type="checkbox" checked={studioUpdatesEmails} onChange={(event) => setStudioUpdatesEmails(event.target.checked)} /><span><strong>GiWise Studio</strong><small>Uscite, diari di sviluppo e novità dello studio.</small></span></label>
      </fieldset>
      <fieldset className="account-codex-preference"><legend>LoreWise Codex</legend>
        <label><input type="radio" name="codex-spoilers" value="protected" checked={codexSpoilerPreference === "protected"} onChange={() => setCodexSpoilerPreference("protected")} /><span><strong>Protezione spoiler</strong><small>Le cronologie restano chiuse finché non scegli di mostrarle.</small></span></label>
        <label><input type="radio" name="codex-spoilers" value="open" checked={codexSpoilerPreference === "open"} onChange={() => setCodexSpoilerPreference("open")} /><span><strong>Cronologie aperte</strong><small>I capitoli biografici mostrano subito anche gli eventi con spoiler.</small></span></label>
      </fieldset>
      <div className="account-profile-actions"><button type="submit" disabled={busy}>{busy ? "Salvataggio…" : "Salva le preferenze"}</button><Link href="/privacy">Consulta l’informativa account</Link></div>
    </form> : null}
    {profile ? <div className="account-deletion">
      <p className="eyebrow">Controllo dell’account</p>
      <h3>Richiedi la cancellazione.</h3>
      {profile.status === "deletion_requested" ? <div className="account-deletion-pending"><strong>Richiesta registrata</strong><p>Le nuove interazioni Community sono sospese. La richiesta non elimina automaticamente ricevute o dati che devono essere conservati per obblighi amministrativi.</p>{profile.deletionRequestedAt ? <small>Richiesta del {new Intl.DateTimeFormat("it-IT", { dateStyle: "short", timeStyle: "short" }).format(new Date(profile.deletionRequestedAt))}</small> : null}<button type="button" disabled={busy} onClick={() => void cancelDeletion()}>Annulla la richiesta</button></div> : <form onSubmit={(event) => void requestDeletion(event)}>
        <p>La richiesta disattiva le interazioni e avvia la verifica dei dati eliminabili. L’identità di accesso verrà rimossa soltanto al completamento della procedura.</p>
        <label htmlFor="account-deletion-confirmation">Scrivi <strong>{ACCOUNT_DELETION_CONFIRMATION}</strong></label>
        <input id="account-deletion-confirmation" value={deletionConfirmation} onChange={(event) => setDeletionConfirmation(event.target.value)} autoComplete="off" />
        <label className="account-deletion-check"><input type="checkbox" checked={deletionUnderstood} onChange={(event) => setDeletionUnderstood(event.target.checked)} /><span>Ho compreso che perderò l’accesso ai contenuti personali dopo il completamento della cancellazione.</span></label>
        <button type="submit" disabled={busy || deletionConfirmation !== ACCOUNT_DELETION_CONFIRMATION || !deletionUnderstood}>Invia richiesta di cancellazione</button>
      </form>}
    </div> : null}
    {message ? <p className="account-profile-message" role="status" aria-live="polite">{message}</p> : null}
  </section>;
}
