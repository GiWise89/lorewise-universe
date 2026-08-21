"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GAME_INSTALLER_DIRECT_UPLOAD_MAX_BYTES, gameInstallerUploadPolicy, verifiedWindowsInstaller } from "@/lib/gameDeliveryPolicy";

type Delivery = {
  productCode: string; gameCode: string; platform: string; version: string; filename: string;
  size: number; sha256: string; signatureStatus: string; scanStatus: string;
  installTestStatus: string; updateTestStatus: string; status: string; approvedAt: string | null;
};
type Payload = { product?: { code: string; title: string; amountCents: number; currency: string } | null; delivery?: Delivery | null; uploadPolicy?: typeof gameInstallerUploadPolicy; error?: string; message?: string };

function sizeLabel(bytes: number) {
  return new Intl.NumberFormat("it-IT", { maximumFractionDigits: 2 }).format(bytes / 1024 / 1024) + " MB";
}

async function apiPayload(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) return await response.json() as Payload;
  const text = await response.text();
  if (response.status === 413) throw new Error("Il server ha rifiutato l'installer perché supera il limite di caricamento.");
  throw new Error(text.trim() || `Risposta del server non valida (${response.status}).`);
}

export function GameDeliveryAdmin() {
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [version, setVersion] = useState("");
  const [uploadReceipt, setUploadReceipt] = useState("");
  const [busy, setBusy] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [message, setMessage] = useState("Apertura dell'archivio privato…");
  const [checks, setChecks] = useState({ unsignedDistributionAccepted: false, scanPassed: false, installPassed: false, updatePlanAccepted: false });
  const oversizedFile = Boolean(file && file.size > GAME_INSTALLER_DIRECT_UPLOAD_MAX_BYTES);

  async function loadArchive() {
    const response = await fetch("/api/game-deliveries/admin", { headers: { accept: "application/json" } });
    const body = await apiPayload(response);
    setNeedsLogin(response.status === 401 || response.status === 403);
    if (!response.ok) throw new Error(body.error || "Archivio Windows non disponibile.");
    setDelivery(body.delivery ?? null);
  }

  useEffect(() => {
    let active = true;
    const loginHint = window.setTimeout(() => {
      if (active) setNeedsLogin(true);
    }, 6000);
    void fetch("/api/game-deliveries/admin", { headers: { accept: "application/json" } })
      .then(async (response) => {
        const body = await apiPayload(response);
        setNeedsLogin(response.status === 401 || response.status === 403);
        if (!response.ok) throw new Error(body.error || "Archivio Windows non disponibile.");
        if (!active) return;
        setDelivery(body.delivery ?? null);
        setNeedsLogin(false);
        setMessage("");
      })
      .catch((error: Error) => active && setMessage(error.message));
    return () => { active = false; window.clearTimeout(loginHint); };
  }, []);

  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!file) return setMessage("Scegli prima l'installer EXE da mettere in quarantena.");
    if (oversizedFile) return setMessage(`Il file supera ${gameInstallerUploadPolicy.directUploadMaxLabel}: non è stato inviato. Prima configureremo un trasferimento grande file dedicato.`);
    setBusy(true);
    setMessage("Calcolo dell'impronta e trasferimento nell'archivio privato…");
    const data = new FormData();
    data.set("version", version);
    data.set("installer", file);
    try {
      const response = await fetch("/api/game-deliveries/admin", { method: "POST", body: data });
      const body = await apiPayload(response);
      if (!response.ok) throw new Error(body.error || "Caricamento non completato.");
      setFile(null);
      setChecks({ unsignedDistributionAccepted: false, scanPassed: false, installPassed: false, updatePlanAccepted: false });
      (form.elements.namedItem("installer") as HTMLInputElement).value = "";
      await loadArchive();
      setMessage(body.message || "Installer archiviato in quarantena.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Caricamento non completato.");
    } finally { setBusy(false); }
  }

  async function approve() {
    if (!delivery || delivery.status !== "qa_pending") return;
    setBusy(true);
    setMessage("Ricalcolo dell'impronta e registrazione del controllo qualità…");
    try {
      const response = await fetch("/api/game-deliveries/admin", {
        method: "PATCH", headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ sha256: delivery.sha256, ...checks }),
      });
      const body = await apiPayload(response);
      if (!response.ok) throw new Error(body.error || "Approvazione non completata.");
      await loadArchive();
      setMessage(body.message || "Installer approvato.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Approvazione non completata.");
    } finally { setBusy(false); }
  }

  async function registerPrivateUpload() {
    let receipt: unknown;
    try {
      receipt = JSON.parse(uploadReceipt);
    } catch {
      return setMessage("La ricevuta non è un JSON valido. Copia tutto il contenuto del file generato dal trasferimento R2.");
    }
    setBusy(true);
    setMessage("Verifica del file già trasferito nel deposito privato…");
    try {
      const response = await fetch("/api/game-deliveries/admin", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify(receipt),
      });
      const body = await apiPayload(response);
      if (!response.ok) throw new Error(body.error || "Registrazione del file grande non completata.");
      setUploadReceipt("");
      setChecks({ unsignedDistributionAccepted: false, scanPassed: false, installPassed: false, updatePlanAccepted: false });
      await loadArchive();
      setMessage(body.message || "File grande registrato in quarantena.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Registrazione del file grande non completata.");
    } finally { setBusy(false); }
  }

  return <>
    <section className="game-delivery-audit" aria-labelledby="game-delivery-audit-title">
      <div><p className="eyebrow">Collaudo Windows · stato corrente</p><h2 id="game-delivery-audit-title">La build desktop corretta è verificata.</h2><p>Il pacchetto 1.0.2 contiene la build desktop corrente completa. L’archivio privato e l’aggiornamento automatico restano separati dal collaudo dell’eseguibile.</p></div>
      <dl><div><dt>Versione</dt><dd>{verifiedWindowsInstaller.version} · {(verifiedWindowsInstaller.size / 1024 / 1024).toFixed(2)} MB</dd></div><div><dt>SHA-256</dt><dd><code>{verifiedWindowsInstaller.sha256}</code></dd></div><div><dt>Defender</dt><dd>{verifiedWindowsInstaller.scanStatus}</dd></div><div><dt>Ciclo locale</dt><dd>{verifiedWindowsInstaller.runtimeStatus}</dd></div><div><dt>Firma</dt><dd className="is-pending">{verifiedWindowsInstaller.signatureStatus}</dd></div><div><dt>Aggiornamento</dt><dd className="is-pending">{verifiedWindowsInstaller.updateStatus}</dd></div></dl>
    </section>

    <ol className="delivery-admin-guide" aria-label="Percorso di approvazione dell’edizione Windows">
      <li><span>01</span><div><strong>Archivia la build</strong><p>Il file entra in quarantena privata e riceve un’impronta SHA-256.</p></div></li>
      <li><span>02</span><div><strong>Completa le verifiche</strong><p>Trasparenza, scansione, installazione pulita e aggiornamento sono obbligatori.</p></div></li>
      <li><span>03</span><div><strong>Collauda la consegna</strong><p>Solo dopo l’approvazione proveremo ordine e download con un account di test.</p></div></li>
    </ol>

    <section className="delivery-admin-workspace game-delivery-workspace">
      <form onSubmit={upload}>
        <p className="eyebrow">Archivio privato</p><h2>Metti in quarantena.</h2>
        <label><span>1. Versione dichiarata</span><input value={version} onChange={(event) => setVersion(event.target.value)} inputMode="text" placeholder="Esempio: 1.0.1" pattern="\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?" required /></label>
        <label><span>2. Installer Windows x64</span><input name="installer" type="file" accept=".exe,application/vnd.microsoft.portable-executable" onChange={(event) => setFile(event.target.files?.[0] ?? null)} required /></label>
        {file ? <div className={`delivery-selected-file${oversizedFile ? " is-oversized" : ""}`}><strong>{file.name}</strong><small>{sizeLabel(file.size)} · {oversizedFile ? `oltre il limite diretto di ${gameInstallerUploadPolicy.directUploadMaxLabel}` : "destinazione privata"}</small></div> : <p className="delivery-file-help">Seleziona esclusivamente la build corrente prodotta da GiWise Studio. Il caricamento diretto accetta fino a {gameInstallerUploadPolicy.directUploadMaxLabel} e non abilita la vendita.</p>}
        {oversizedFile ? <p className="game-delivery-size-warning"><strong>File grande rilevato.</strong> L’EXE non verrà inviato da questo modulo. Dopo la verifica predisporremo un trasferimento privato adatto alla sua dimensione reale.</p> : null}
        <button type="submit" disabled={busy || !file || oversizedFile}>{busy ? "Controllo in corso…" : delivery ? "Sostituisci la build in quarantena" : "Archivia per il controllo qualità"}</button>
        <div className="game-delivery-receipt">
          <span className="eyebrow">Installer oltre 150 MB</span>
          <h3>Registra la ricevuta del trasferimento privato.</h3>
          <p>Incolla il JSON creato dal comando R2. LoreWise controllerà chiave privata, dimensione e SHA-256 prima di registrare la build; nessun byte dell’EXE passa dal browser.</p>
          <label><span>Ricevuta JSON verificata</span><textarea value={uploadReceipt} onChange={(event) => setUploadReceipt(event.target.value)} spellCheck={false} placeholder={'{\n  "action": "register_existing",\n  "remoteVerified": true\n}'} /></label>
          <button type="button" disabled={busy || !uploadReceipt.trim()} onClick={registerPrivateUpload}>Verifica e registra in quarantena</button>
        </div>
        <p className="delivery-admin-feedback" aria-live="polite">{message}</p>
        {needsLogin ? <Link className="game-delivery-login" href="/account">Accedi al LoreWise ID amministratore</Link> : null}
      </form>

      <div className="delivery-customer-preview">
        <p className="eyebrow">Barriera di pubblicazione</p><h2>Quattro prove, nessuna scorciatoia.</h2>
        {delivery ? <div className="game-delivery-file"><strong>{delivery.filename}</strong><span>Versione {delivery.version} · {sizeLabel(delivery.size)}</span><code>{delivery.sha256}</code><em className={delivery.status === "approved" ? "is-approved" : "is-pending"}>{delivery.status === "approved" ? "Approvato" : "In quarantena"}</em></div> : <p>Nessun installer è ancora registrato nell’archivio LoreWise.</p>}
        {delivery?.status === "qa_pending" ? <section className="delivery-quality-gate">
          <label><input type="checkbox" checked={checks.unsignedDistributionAccepted} onChange={(event) => setChecks((current) => ({ ...current, unsignedDistributionAccepted: event.target.checked }))} /><span>La build non firmata è dichiarata come distribuzione indipendente e l’avviso Windows è spiegato al cliente.</span></label>
          <label><input type="checkbox" checked={checks.scanPassed} onChange={(event) => setChecks((current) => ({ ...current, scanPassed: event.target.checked }))} /><span>Scansione antivirus completata senza rilevamenti.</span></label>
          <label><input type="checkbox" checked={checks.installPassed} onChange={(event) => setChecks((current) => ({ ...current, installPassed: event.target.checked }))} /><span>Installazione, avvio e disinstallazione provati su Windows x64 pulito.</span></label>
          <label><input type="checkbox" checked={checks.updatePlanAccepted} onChange={(event) => setChecks((current) => ({ ...current, updatePlanAccepted: event.target.checked }))} /><span>Prima distribuzione dichiarata: finché il canale automatico non sarà collaudato, gli aggiornamenti verranno forniti manualmente dall’area personale.</span></label>
          <button type="button" disabled={busy || !Object.values(checks).every(Boolean)} onClick={approve}>Approva la build verificata</button>
        </section> : delivery?.status === "approved" ? <p className="delivery-approved-note">Build approvata. Il prodotto resta comunque in modalità prova finché checkout e download non superano il collaudo completo.</p> : null}
      </div>
    </section>
  </>;
}
