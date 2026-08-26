"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ACCOUNT_DELETION_CONFIRMATION, ACCOUNT_PROFILE_LIMITS } from "@/lib/accountPolicy";

type Profile = {
  email: string;
  displayName: string;
  username: string;
  profileVisibility: "public" | "private";
  avatarUrl: string | null;
  role: string;
  locale: string;
  communityEmails: boolean;
  studioUpdatesEmails: boolean;
  codexSpoilerPreference: "protected" | "open";
  privacyVersion: string | null;
  privacyAcceptedAt: string | null;
  createdAt: string;
  updatedAt: string;
  status: string;
  deletionRequestedAt: string | null;
  profileComplete: boolean;
  missingProfileFields: Array<"displayName" | "username">;
};

const DEFAULT_AVATARS = [
  { id: "violet", src: "/profile-avatars/default-violet.svg", label: "Sagoma viola" },
  { id: "coral", src: "/profile-avatars/default-coral.svg", label: "Sagoma corallo" },
  { id: "cyan", src: "/profile-avatars/default-cyan.svg", label: "Sagoma azzurra" },
  { id: "gold", src: "/profile-avatars/default-gold.svg", label: "Sagoma dorata" },
] as const;

async function prepareAvatar(file: File, zoom: number, positionX: number, positionY: number) {
  const bitmap = await createImageBitmap(file);
  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("Non è stato possibile preparare l'immagine.");
  }

  const scale = Math.max(size / bitmap.width, size / bitmap.height) * zoom;
  const drawWidth = bitmap.width * scale;
  const drawHeight = bitmap.height * scale;
  const drawX = -(drawWidth - size) * (positionX / 100);
  const drawY = -(drawHeight - size) * (positionY / 100);
  context.drawImage(bitmap, drawX, drawY, drawWidth, drawHeight);
  bitmap.close();

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Non è stato possibile creare il ritratto.")), "image/webp", 0.9);
  });
}

export function AccountProfilePanel() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [profileVisibility, setProfileVisibility] = useState<"public" | "private">("public");
  const [communityEmails, setCommunityEmails] = useState(false);
  const [studioUpdatesEmails, setStudioUpdatesEmails] = useState(false);
  const [codexSpoilerPreference, setCodexSpoilerPreference] = useState<"protected" | "open">("protected");
  const [message, setMessage] = useState("Caricamento del profilo…");
  const [busy, setBusy] = useState(false);
  const [deletionConfirmation, setDeletionConfirmation] = useState("");
  const [deletionUnderstood, setDeletionUnderstood] = useState(false);
  const [avatarFileName, setAvatarFileName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState("");
  const [avatarZoom, setAvatarZoom] = useState(1);
  const [avatarPositionX, setAvatarPositionX] = useState(50);
  const [avatarPositionY, setAvatarPositionY] = useState(50);
  const [selectedDefaultAvatar, setSelectedDefaultAvatar] = useState("");

  useEffect(() => () => {
    if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
  }, [avatarPreviewUrl]);

  async function chooseDefaultAvatar(avatar: (typeof DEFAULT_AVATARS)[number]) {
    try {
      const response = await fetch(avatar.src);
      if (!response.ok) throw new Error("Avatar non disponibile.");
      const blob = await response.blob();
      const file = new File([blob], `${avatar.id}.svg`, { type: "image/svg+xml" });
      setAvatarFile(file);
      setAvatarFileName(avatar.label);
      setAvatarPreviewUrl(URL.createObjectURL(file));
      setSelectedDefaultAvatar(avatar.id);
      setAvatarZoom(1);
      setAvatarPositionX(50);
      setAvatarPositionY(50);
      setMessage("Avatar selezionato. Salvalo per applicarlo al profilo.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Avatar non disponibile.");
    }
  }

  useEffect(() => {
    let active = true;
    void fetch("/api/account/profile", { headers: { accept: "application/json" } })
      .then(async (response) => {
        const body = await response.json() as { profile?: Profile; error?: string };
        if (!response.ok || !body.profile) throw new Error(body.error || "Profilo non disponibile.");
        if (!active) return;
        setProfile(body.profile);
        setDisplayName(body.profile.displayName);
        setUsername(body.profile.username);
        setProfileVisibility(body.profile.profileVisibility);
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
        body: JSON.stringify({ displayName, username, profileVisibility, communityEmails, studioUpdatesEmails, codexSpoilerPreference }),
      });
      const body = await response.json() as { profile?: Profile; error?: string; message?: string };
      if (!response.ok || !body.profile) throw new Error(body.error || "Salvataggio non completato.");
      setProfile(body.profile);
      setDisplayName(body.profile.displayName);
      setUsername(body.profile.username);
      window.localStorage.setItem("lorewise-codex-spoilers", body.profile.codexSpoilerPreference);
      setMessage(body.message || "Preferenze salvate.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Salvataggio non completato.");
    } finally {
      setBusy(false);
    }
  }

  async function updateAvatar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (!avatarFile) {
      setMessage("Scegli prima un'immagine.");
      return;
    }
    setBusy(true);
    setMessage("Caricamento dell'immagine…");
    try {
      const croppedAvatar = await prepareAvatar(avatarFile, avatarZoom, avatarPositionX, avatarPositionY);
      const form = new FormData();
      form.append("avatar", croppedAvatar, "immagine-profilo.webp");
      const response = await fetch("/api/account/avatar", { method: "POST", body: form });
      const body = await response.json() as { error?: string; message?: string; avatarUrl?: string | null };
      if (!response.ok) throw new Error(body.error || "Caricamento non completato.");
      const refreshed = await fetch("/api/account/profile", { headers: { accept: "application/json" }, cache: "no-store" });
      const result = await refreshed.json() as { profile?: Profile };
      if (result.profile) setProfile(result.profile);
      else if (body.avatarUrl) setProfile((current) => current ? { ...current, avatarUrl: body.avatarUrl ?? null, updatedAt: new Date().toISOString() } : current);
      formElement.reset();
      setAvatarFileName("");
      setAvatarFile(null);
      setAvatarPreviewUrl("");
      setAvatarZoom(1);
      setAvatarPositionX(50);
      setAvatarPositionY(50);
      setMessage(body.message || "Immagine aggiornata.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Caricamento non completato."); }
    finally { setBusy(false); }
  }

  async function removeAvatar() {
    setBusy(true);
    setMessage("Rimozione dell'immagine…");
    try {
      const response = await fetch("/api/account/avatar", { method: "DELETE", headers: { accept: "application/json" } });
      const body = await response.json() as { error?: string; message?: string };
      if (!response.ok) throw new Error(body.error || "Rimozione non completata.");
      setProfile((current) => current ? { ...current, avatarUrl: null, updatedAt: new Date().toISOString() } : current);
      setMessage(body.message || "Immagine rimossa.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Rimozione non completata."); }
    finally { setBusy(false); }
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
    {profile && !profile.profileComplete ? <div className="account-profile-required" role="status"><strong>Completa il profilo per continuare</strong><p>Nome pubblico e nickname sono obbligatori. L’immagine del profilo resta una scelta personale.</p></div> : null}
    {profile ? <div className="account-profile-editor"><form className="account-avatar-form" onSubmit={(event) => void updateAvatar(event)}>
      <div className="account-avatar-preview">
        <div className="account-avatar-image-frame">
          {avatarPreviewUrl ? <Image src={avatarPreviewUrl} alt="Anteprima della nuova immagine del profilo" fill sizes="168px" unoptimized style={{ objectPosition: `${avatarPositionX}% ${avatarPositionY}%`, transform: `scale(${avatarZoom})` }} /> : profile.avatarUrl ? <Image src={`${profile.avatarUrl}?v=${encodeURIComponent(profile.updatedAt || "1")}`} alt="La tua immagine del profilo" fill sizes="168px" unoptimized /> : <div className="account-avatar-fallback" aria-hidden="true">{(displayName || username || "L").slice(0, 1).toUpperCase()}</div>}
        </div>
        <span>{avatarPreviewUrl ? "Nuovo ritratto" : "Anteprima profilo"}</span>
      </div>
      <div className="account-avatar-copy"><small>Identità visiva</small><h3>La tua immagine</h3><p>Scegli un ritratto riconoscibile per commenti, profilo e Community.</p></div>
      <div className="account-avatar-defaults">
        <div><strong>Avatar predefiniti</strong><small>Scegli una sagoma semplice</small></div>
        <div role="group" aria-label="Avatar predefiniti">
          {DEFAULT_AVATARS.map((avatar) => <button className={selectedDefaultAvatar === avatar.id ? "is-selected" : ""} type="button" key={avatar.id} aria-label={`Scegli ${avatar.label}`} aria-pressed={selectedDefaultAvatar === avatar.id} onClick={() => void chooseDefaultAvatar(avatar)}><Image src={avatar.src} alt="" width={72} height={72} unoptimized /></button>)}
        </div>
      </div>
      <div className="account-avatar-divider"><span>oppure usa una tua foto</span></div>
      <input className="account-avatar-input" id="profile-avatar" name="avatar" type="file" accept="image/png,image/jpeg,image/webp" required onChange={(event) => {
        const selectedFile = event.currentTarget.files?.[0] ?? null;
        setAvatarFile(selectedFile);
        setAvatarFileName(selectedFile?.name ?? "");
        setAvatarPreviewUrl(selectedFile ? URL.createObjectURL(selectedFile) : "");
        setSelectedDefaultAvatar("");
        setAvatarZoom(1);
        setAvatarPositionX(50);
        setAvatarPositionY(50);
      }} />
      <label className="account-avatar-picker" htmlFor="profile-avatar"><strong>Scegli immagine</strong><span>{avatarFileName || "Nessun file selezionato"}</span></label>
      {avatarPreviewUrl ? <fieldset className="account-avatar-adjustments">
        <legend>Regola il ritaglio</legend>
        <label><span>Zoom</span><input type="range" min="1" max="2.2" step="0.05" value={avatarZoom} onChange={(event) => setAvatarZoom(Number(event.target.value))} /></label>
        <label><span>Orizzontale</span><input type="range" min="0" max="100" value={avatarPositionX} onChange={(event) => setAvatarPositionX(Number(event.target.value))} /></label>
        <label><span>Verticale</span><input type="range" min="0" max="100" value={avatarPositionY} onChange={(event) => setAvatarPositionY(Number(event.target.value))} /></label>
      </fieldset> : null}
      <small className="account-avatar-format">PNG, JPG o WebP · ritratto finale ottimizzato</small>
      <div className="account-avatar-actions"><button type="submit" disabled={busy || !avatarFile}>{busy ? "Caricamento…" : "Salva questo ritratto"}</button>{profile.avatarUrl ? <button className="account-avatar-remove" type="button" disabled={busy} onClick={() => void removeAvatar()}>Rimuovi attuale</button> : null}</div>
    </form><form className="account-profile-settings" onSubmit={(event) => void saveProfile(event)}>
      <div className="account-profile-identity"><span>LoreWise ID</span><strong>{profile.email}</strong><small>Ruolo: {profile.role === "member" ? "Membro" : profile.role} · Lingua: Italiano</small></div>
      <div className="account-profile-fields">
        <div className="account-profile-field">
          <label htmlFor="profile-display-name">Nome pubblico o firma</label>
          <input id="profile-display-name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={ACCOUNT_PROFILE_LIMITS.displayName} placeholder="Come vuoi essere chiamato" />
        </div>
        <div className="account-profile-field">
          <label htmlFor="profile-username">Nickname univoco</label>
          <input id="profile-username" value={username} onChange={(event) => setUsername(event.target.value.toLowerCase().replace(/\s+/g, ".").replace(/[^a-z0-9._]/g, "").replace(/^[._]+/, ""))} minLength={3} maxLength={ACCOUNT_PROFILE_LIMITS.username} pattern="[a-z0-9][a-z0-9._]{2,23}" placeholder="es. giwise89" autoCapitalize="none" autoCorrect="off" spellCheck={false} required />
          <small className="account-profile-help">Sarà visibile come @{username || "nickname"}. Spazi e caratteri non validi vengono sistemati automaticamente.</small>
        </div>
      </div>
      <div className="account-profile-preferences">
        <fieldset><legend>Visibilità del profilo</legend>
          <label><input type="radio" name="profile-visibility" checked={profileVisibility === "public"} onChange={() => setProfileVisibility("public")} /><span><strong>Pubblico</strong><small>Nome, nickname e immagine sono visibili nella Community.</small></span></label>
          <label><input type="radio" name="profile-visibility" checked={profileVisibility === "private"} onChange={() => setProfileVisibility("private")} /><span><strong>Riservato</strong><small>Commenti visibili, profilo personale non consultabile.</small></span></label>
        </fieldset>
        <fieldset id="comunicazioni"><legend>Comunicazioni facoltative</legend>
          <label><input type="checkbox" checked={communityEmails} onChange={(event) => setCommunityEmails(event.target.checked)} /><span><strong>Community</strong><small>Risposte, moderazione e novità legate alle tue interazioni.</small></span></label>
          <label><input type="checkbox" checked={studioUpdatesEmails} onChange={(event) => setStudioUpdatesEmails(event.target.checked)} /><span><strong>GiWise Studio</strong><small>Nuove opere, videogiochi, commissioni e promozioni. Puoi revocare il consenso qui o direttamente da ogni email.</small></span></label>
        </fieldset>
        <fieldset className="account-codex-preference"><legend>LoreWise Codex</legend>
          <label><input type="radio" name="codex-spoilers" value="protected" checked={codexSpoilerPreference === "protected"} onChange={() => setCodexSpoilerPreference("protected")} /><span><strong>Protezione spoiler</strong><small>Le cronologie restano chiuse finché non scegli di mostrarle.</small></span></label>
          <label><input type="radio" name="codex-spoilers" value="open" checked={codexSpoilerPreference === "open"} onChange={() => setCodexSpoilerPreference("open")} /><span><strong>Cronologie aperte</strong><small>I capitoli biografici mostrano subito anche gli eventi con spoiler.</small></span></label>
        </fieldset>
      </div>
      <div className="account-profile-actions"><button type="submit" disabled={busy}>{busy ? "Salvataggio…" : "Salva le preferenze"}</button><Link href="/privacy">Consulta l’informativa account</Link>{message ? <p className="account-profile-message" role="status" aria-live="polite">{message}</p> : null}</div>
    </form></div> : null}
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
  </section>;
}
