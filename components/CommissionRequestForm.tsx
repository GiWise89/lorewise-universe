"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CORRUPTED_PORTRAIT_PACKAGE } from "@/lib/commissionPromotion";

type PackageOption = { name: string; price: string; image: string; alt: string; description: string; timing: string };
type RequestState = {
  name: string;
  email: string;
  category: string;
  packageName: string;
  intendedUse: string;
  idealDeadline: string;
  artworkReference: string;
  brief: string;
  includesMinor: boolean;
  guardianName: string;
  guardianConsent: boolean;
  portfolioConsent: boolean;
  privacyConsent: boolean;
  contentPolicyConsent: boolean;
};

const maxFiles = 3;
const maxFileSize = 8 * 1024 * 1024;
function isValidEuropeanDate(value: string) {
  if (!value) return true;
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return false;
  const [, day, month, year] = match;
  const parsed = new Date(Number(year), Number(month) - 1, Number(day));
  return parsed.getFullYear() === Number(year) && parsed.getMonth() === Number(month) - 1 && parsed.getDate() === Number(day);
}

function formatEuropeanDate(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

const initialState: RequestState = {
  name: "",
  email: "",
  category: "",
  packageName: "Da valutare insieme",
  intendedUse: "Personale",
  idealDeadline: "",
  artworkReference: "",
  brief: "",
  includesMinor: false,
  guardianName: "",
  guardianConsent: false,
  portfolioConsent: false,
  privacyConsent: false,
  contentPolicyConsent: false,
};

export function CommissionRequestForm({ categories, packages, initialPackage = "", initialReference = "", account }: { categories: readonly string[]; packages: readonly PackageOption[]; initialPackage?: string; initialReference?: string; account: { name: string; email: string } }) {
  const packageNames = new Set(packages.map((item) => item.name));
  const startingValues: RequestState = {
    ...initialState,
    name: account.name,
    email: account.email,
    category: initialPackage === CORRUPTED_PORTRAIT_PACKAGE ? "Trasformazioni fantasy/horror" : initialState.category,
    artworkReference: initialReference.slice(0, 120),
    packageName: packageNames.has(initialPackage) ? initialPackage : initialState.packageName,
  };
  const [step, setStep] = useState(1);
  const [values, setValues] = useState<RequestState>(startingValues);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (initialReference || initialPackage) document.getElementById("richiesta")?.scrollIntoView({ block: "start" });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [initialPackage, initialReference]);
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [referenceCode, setReferenceCode] = useState("");
  const [emailStatus, setEmailStatus] = useState<"sent" | "queued" | "failed" | "">("");

  const previews = useMemo(() => files.map((file) => ({ file, url: URL.createObjectURL(file) })), [files]);
  useEffect(() => () => previews.forEach((preview) => URL.revokeObjectURL(preview.url)), [previews]);

  function update<K extends keyof RequestState>(key: K, value: RequestState[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setFormError("");
  }

  function goToReferences() {
    if (values.name.trim().length < 2 || !/^\S+@\S+\.\S+$/.test(values.email) || !values.category || values.brief.trim().length < 20) {
      setFormError("Completa nome, email, categoria e una descrizione di almeno 20 caratteri.");
      return;
    }
    if (!isValidEuropeanDate(values.idealDeadline)) {
      setFormError("Inserisci la data nel formato europeo GG/MM/AAAA.");
      return;
    }
    setStep(2);
  }

  function chooseFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    const invalid = selected.some((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > maxFileSize);
    if (selected.length > maxFiles || invalid) {
      setFiles([]);
      setFileError("Scegli fino a 3 immagini JPG, PNG o WebP, massimo 8 MB ciascuna.");
      event.target.value = "";
      return;
    }
    setFiles(selected);
    setFileError("");
  }

  function goToReview() {
    if (!values.privacyConsent || !values.contentPolicyConsent) {
      setFormError("Per continuare devi accettare la politica dei contenuti e autorizzare il trattamento dei dati.");
      return;
    }
    if (values.includesMinor && (values.guardianName.trim().length < 2 || !values.guardianConsent)) {
      setFormError("Per un minore inserisci il nome del tutore e conferma l’autorizzazione.");
      return;
    }
    setFormError("");
    setStep(3);
  }

  async function submitRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFormError("");
    const payload = new FormData();
    Object.entries(values).forEach(([key, value]) => payload.append(key, String(value)));
    files.forEach((file) => payload.append("references", file));
    payload.append("website", "");

    try {
      const response = await fetch("/api/commission-requests", { method: "POST", body: payload });
      const result = await response.json() as { error?: string; referenceCode?: string; emailStatus?: "sent" | "queued" | "failed" };
      if (!response.ok || !result.referenceCode) throw new Error(result.error ?? "Invio non riuscito.");
      setReferenceCode(result.referenceCode);
      setEmailStatus(result.emailStatus ?? "queued");
      setStep(4);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Invio non riuscito. Riprova più tardi.");
    } finally {
      setSubmitting(false);
    }
  }

  if (step === 4) {
    return (
      <section className="commission-request-success" aria-live="polite">
        <p className="eyebrow">Richiesta ricevuta</p>
        <h3>La tua idea è entrata nell’archivio GiWise.</h3>
        <p>Conserva questo codice: identifica la richiesta e gli eventuali riferimenti allegati.</p>
        <strong>{referenceCode}</strong>
        {emailStatus === "sent" ? (
          <p>La conferma è stata inviata all’email del tuo LoreWise ID. Puoi seguire la pratica anche dalla tua area personale.</p>
        ) : (
          <p>La richiesta è al sicuro nell’archivio LoreWise. La conferma email è conservata nella coda di consegna e potrà essere reinviata senza duplicare la pratica.</p>
        )}
        <div className="button-row">
          <Link className="button button-primary" href="/commissioni/stato">Segui questa richiesta</Link>
          <button type="button" className="button button-ghost" onClick={() => { setValues(startingValues); setFiles([]); setReferenceCode(""); setEmailStatus(""); setStep(1); }}>Prepara una nuova richiesta</button>
        </div>
      </section>
    );
  }

  return (
    <form className="request-form commission-guided-form" onSubmit={submitRequest} noValidate>
      <header className="commission-form-progress">
        {["Richiesta", "Riferimenti", "Riepilogo"].map((label, index) => <span key={label} aria-current={step === index + 1 ? "step" : undefined}><b>{index + 1}</b>{label}</span>)}
      </header>

      {step === 1 ? (
        <fieldset className="commission-form-step">
          <legend>Racconta il progetto</legend>
          <div className="commission-account-recognized field-wide"><span>LoreWise ID riconosciuto</span><strong>{account.email}</strong><small>Il piano attivo e gli eventuali vantaggi saranno ricontrollati automaticamente quando GiWise Studio emetterà il preventivo.</small></div>
          <div><label htmlFor="request-name">Nome</label><input id="request-name" value={values.name} onChange={(event) => update("name", event.target.value)} autoComplete="name" required placeholder="Come possiamo chiamarti?" /></div>
          <div><label htmlFor="request-email">Email del LoreWise ID</label><input id="request-email" value={values.email} readOnly aria-readonly="true" autoComplete="email" required type="email" /></div>
          <div><label htmlFor="request-type">Tipo di disegno</label><select id="request-type" value={values.category} onChange={(event) => update("category", event.target.value)} required><option value="" disabled>Seleziona una tipologia</option>{categories.map((category) => <option key={category}>{category}</option>)}</select></div>
          <div><label htmlFor="request-use">Utilizzo previsto</label><select id="request-use" value={values.intendedUse} onChange={(event) => update("intendedUse", event.target.value)}><option>Personale</option><option>Commerciale da valutare</option><option>Non sono sicuro</option></select></div>
          <div className="field-wide commission-package-choice" role="radiogroup" aria-labelledby="request-package-label">
            <span id="request-package-label">Pacchetto indicativo</span>
            <div>
              {packages.map((item) => <label key={item.name} className={values.packageName === item.name ? "is-selected" : ""}><input type="radio" name="package-choice" value={item.name} checked={values.packageName === item.name} onChange={() => update("packageName", item.name)} /><Image src={item.image} alt={item.alt} width={1131} height={1600} loading="lazy" unoptimized /><span><strong>{item.name}</strong><b>{item.price}</b><small>{item.description} · {item.timing}</small></span></label>)}
              <label className={values.packageName === "Da valutare insieme" ? "is-selected commission-package-custom" : "commission-package-custom"}><input type="radio" name="package-choice" value="Da valutare insieme" checked={values.packageName === "Da valutare insieme"} onChange={() => update("packageName", "Da valutare insieme")} /><span><strong>Da valutare insieme</strong><small>Se l’idea non rientra perfettamente nei tre percorsi, scegliamo la soluzione dopo aver letto il brief.</small></span></label>
            </div>
          </div>
          <div><label htmlFor="request-deadline">Data ideale</label><input id="request-deadline" value={values.idealDeadline} onChange={(event) => update("idealDeadline", formatEuropeanDate(event.target.value))} type="text" inputMode="numeric" maxLength={10} placeholder="GG/MM/AAAA" aria-describedby="request-deadline-format" /><small id="request-deadline-format" className="commission-field-hint">Giorno / mese / anno</small></div>
          <div className="field-wide"><label htmlFor="request-reference">Opera del portfolio come riferimento</label><input id="request-reference" value={values.artworkReference} onChange={(event) => update("artworkReference", event.target.value)} placeholder="Per esempio: LW-COM-015 · Leo" /></div>
          <div className="field-wide"><label htmlFor="request-brief">Descrivi la tua idea</label><textarea id="request-brief" value={values.brief} onChange={(event) => update("brief", event.target.value)} rows={7} required minLength={20} placeholder="Soggetto, atmosfera, colori, dettagli importanti e risultato desiderato…" /></div>
          <input className="commission-honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
          {formError ? <p className="commission-form-error field-wide" role="alert">{formError}</p> : null}
          <div className="commission-form-actions field-wide"><span>Passaggio 1 di 3</span><button className="button button-primary" type="button" onClick={goToReferences}>Continua ai riferimenti</button></div>
        </fieldset>
      ) : null}

      {step === 2 ? (
        <fieldset className="commission-form-step commission-form-references">
          <legend>Riferimenti, privacy e autorizzazioni</legend>
          <div className="commission-upload field-wide">
            <label htmlFor="request-files"><strong>Immagini di riferimento</strong><span>Fino a 3 file JPG, PNG o WebP · massimo 8 MB ciascuno</span></label>
            <input id="request-files" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={chooseFiles} />
            {fileError ? <p className="commission-form-error" role="alert">{fileError}</p> : null}
            {previews.length ? <div className="commission-upload-previews">{previews.map(({ file, url }) => <figure key={`${file.name}-${file.lastModified}`}><Image src={url} alt="Anteprima del riferimento selezionato" width={180} height={180} unoptimized /><figcaption>{file.name}<small>{(file.size / 1024 / 1024).toFixed(1)} MB</small></figcaption></figure>)}</div> : null}
          </div>

          <label className="commission-consent field-wide"><input type="checkbox" checked={values.includesMinor} onChange={(event) => update("includesMinor", event.target.checked)} /><span><strong>La richiesta raffigura una persona minorenne</strong><small>Attiva questa voce anche se il minore compare insieme ad altre persone.</small></span></label>
          {values.includesMinor ? <div className="commission-minor-consent field-wide"><label htmlFor="request-guardian">Nome del genitore o tutore</label><input id="request-guardian" value={values.guardianName} onChange={(event) => update("guardianName", event.target.value)} /><label className="commission-consent"><input type="checkbox" checked={values.guardianConsent} onChange={(event) => update("guardianConsent", event.target.checked)} /><span><strong>Confermo di essere il genitore o tutore autorizzato</strong><small>Autorizzo l’uso delle immagini esclusivamente per valutare e realizzare la commissione.</small></span></label></div> : null}
          <label className="commission-consent field-wide"><input type="checkbox" checked={values.portfolioConsent} onChange={(event) => update("portfolioConsent", event.target.checked)} /><span><strong>Autorizzo facoltativamente la futura esposizione nel portfolio</strong><small>La mancata autorizzazione non modifica prezzo, valutazione o realizzazione del lavoro.</small></span></label>
          <label className="commission-consent commission-policy-consent field-wide"><input type="checkbox" checked={values.contentPolicyConsent} onChange={(event) => update("contentPolicyConsent", event.target.checked)} /><span><strong>Accetto la politica dei contenuti GiWise Studio</strong><small>Niente nudo, pornografia o politica; horror, gore e splatter solo moderati e non espliciti. <Link href="/commissioni/condizioni" target="_blank">Leggi le condizioni complete</Link>.</small></span></label>
          <label className="commission-consent field-wide"><input type="checkbox" checked={values.privacyConsent} onChange={(event) => update("privacyConsent", event.target.checked)} /><span><strong>Confermo di aver letto l’informativa privacy</strong><small>I dati necessari servono a valutare e gestire la richiesta; gli allegati non vengono pubblicati automaticamente né usati per addestrare sistemi di intelligenza artificiale. <Link href="/privacy" target="_blank">Apri l’informativa</Link>.</small></span></label>
          {formError ? <p className="commission-form-error field-wide" role="alert">{formError}</p> : null}
          <div className="commission-form-actions field-wide"><button className="button button-ghost" type="button" onClick={() => setStep(1)}>Indietro</button><button className="button button-primary" type="button" onClick={goToReview}>Controlla il riepilogo</button></div>
        </fieldset>
      ) : null}

      {step === 3 ? (
        <fieldset className="commission-form-step commission-form-review">
          <legend>Controlla prima dell’invio</legend>
          <dl className="field-wide">
            <div><dt>Cliente</dt><dd>{values.name} · {values.email}</dd></div>
            <div><dt>Richiesta</dt><dd>{values.category}</dd></div>
            <div><dt>Pacchetto</dt><dd>{values.packageName}</dd></div>
            <div><dt>Utilizzo</dt><dd>{values.intendedUse}</dd></div>
            <div><dt>Data ideale</dt><dd>{values.idealDeadline || "Da concordare"}</dd></div>
            <div><dt>Riferimento portfolio</dt><dd>{values.artworkReference || "Nessuno"}</dd></div>
            <div><dt>Allegati</dt><dd>{files.length ? files.map((file) => file.name).join(", ") : "Nessun allegato"}</dd></div>
            <div><dt>Portfolio</dt><dd>{values.portfolioConsent ? "Autorizzazione concessa" : "Non autorizzato"}</dd></div>
            <div><dt>Minore</dt><dd>{values.includesMinor ? `Sì · Tutore: ${values.guardianName}` : "No"}</dd></div>
            <div><dt>Regole del servizio</dt><dd>Politica contenuti accettata</dd></div>
          </dl>
          <div className="commission-review-brief field-wide"><span>Descrizione</span><p>{values.brief}</p></div>
          <p className="form-note">L’invio registra la richiesta e gli allegati nell’archivio protetto. Non effettua pagamenti e non conferma automaticamente il preventivo.</p>
          {formError ? <p className="commission-form-error field-wide" role="alert">{formError}</p> : null}
          <div className="commission-form-actions field-wide"><button className="button button-ghost" type="button" onClick={() => setStep(2)}>Modifica riferimenti</button><button className="button button-primary" type="submit" disabled={submitting}>{submitting ? "Archiviazione in corso…" : "Invia la richiesta"}</button></div>
        </fieldset>
      ) : null}
    </form>
  );
}
