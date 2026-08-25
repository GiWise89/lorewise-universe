"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { getCommissionPromotionForSubmission } from "@/lib/commissionPromotion";

type PublicRequest = {
  referenceCode: string;
  clientFirstName: string;
  category: string;
  packageName: string;
  intendedUse: string;
  idealDeadline: string | null;
  status: string;
  quoteBaseCents: number | null;
  quoteDiscountCents: number;
  quoteCents: number | null;
  depositCents: number | null;
  membershipPlanCode: string | null;
  membershipDiscountPercent: number;
  benefitSnapshotAt: string | null;
  clientResponse: string | null;
  clientMessage: string | null;
  clientRespondedAt: string | null;
  createdAt: string;
  updatedAt: string;
  quoteTermsAcceptedAt: string | null;
  quoteTermsVersion: string | null;
};

const stages = [
  ["new", "Ricevuta"],
  ["reviewing", "Valutazione"],
  ["quoted", "Preventivo"],
  ["accepted", "Confermata"],
  ["in_progress", "Lavorazione"],
  ["awaiting_balance", "Saldo"],
  ["balance_paid", "Saldo pagato"],
  ["completed", "Completata"],
] as const;

const stageIndex: Record<string, number> = Object.fromEntries(stages.map(([status], index) => [status, index]));

function displayDate(value: string | null, includeTime = false) {
  if (!value) return "Da concordare";
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value;
  const parsed = new Date(value.includes("T") ? value : `${value.replace(" ", "T")}Z`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("it-IT", includeTime
    ? { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }
    : { day: "2-digit", month: "2-digit", year: "numeric" }).format(parsed);
}

export function CommissionStatusTracker() {
  const [referenceCode, setReferenceCode] = useState("");
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<PublicRequest | null>(null);
  const [clarification, setClarification] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  async function startPayment() {
    if (!result) return;
    setCheckoutLoading(true);
    setError("");
    try {
      const response = await fetch("/api/commission-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referenceCode: result.referenceCode }),
      });
      const payload = await response.json() as { checkoutUrl?: string; error?: string };
      if (!response.ok || !payload.checkoutUrl) throw new Error(payload.error || "Pagamento non disponibile.");
      window.location.assign(payload.checkoutUrl);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Pagamento non disponibile.");
      setCheckoutLoading(false);
    }
  }

  async function requestStatus(action = "lookup", clientMessage = "") {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/commission-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referenceCode, email, action, message: clientMessage, termsAccepted }),
      });
      const body = await response.json() as { request?: PublicRequest; error?: string };
      if (!response.ok || !body.request) throw new Error(body.error || "Consultazione non riuscita.");
      setResult(body.request);
      if (action === "accept_quote") setMessage("Preventivo accettato. GiWise Studio potrà ora confermare tempi e avvio del lavoro.");
      if (action === "request_clarification") {
        setMessage("Richiesta di chiarimento registrata nell’area GiWise.");
        setClarification("");
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Consultazione non riuscita.");
    } finally {
      setLoading(false);
    }
  }

  function submitLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void requestStatus();
  }

  const currentStage = result ? (stageIndex[result.status] ?? -1) : -1;
  const isClosed = result?.status === "declined" || result?.status === "cancelled";
  const canRespond = Boolean(result?.quoteCents != null && !isClosed && result?.status === "quoted");

  return (
    <div className="commission-status-workspace">
      <form className="commission-status-access" onSubmit={submitLookup}>
        <p className="eyebrow">Accesso alla pratica</p>
        <h2>Ritrova il tuo progetto.</h2>
        <p>Inserisci esattamente il codice ricevuto e l’email usata nel modulo. Nessun allegato o dato riservato viene mostrato qui.</p>
        <Link className="commission-status-conditions-link" href="/commissioni/condizioni" target="_blank" rel="noopener noreferrer">Consulta condizioni e politica dei contenuti</Link>
        <label><span>Codice richiesta</span><input value={referenceCode} onChange={(event) => setReferenceCode(event.target.value.toUpperCase())} placeholder="LW-REQ-20260818-ABC123" autoComplete="off" required /></label>
        <label><span>Email</span><input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" placeholder="nome@esempio.it" required /></label>
        {error && <p className="commission-status-error" role="alert">{error}</p>}
        <button className="button button-primary" type="submit" disabled={loading}>{loading ? "Consultazione…" : "Mostra la richiesta"}</button>
      </form>

      <section className="commission-status-result" aria-live="polite">
        {!result ? <div className="commission-status-empty"><small>GiWise Studio</small><h2>Il percorso dell’opera apparirà qui.</h2><p>Dalla ricezione della richiesta fino alla consegna finale, ogni passaggio rimane leggibile e ordinato.</p></div> : <>
          <header><div><small>{result.referenceCode}</small><h2>Ciao {result.clientFirstName}.</h2><p>Ultimo aggiornamento: {displayDate(result.updatedAt, true)}</p></div><strong>{isClosed ? (result.status === "cancelled" ? "Annullata" : "Non accettata") : stages[currentStage]?.[1] ?? result.status}</strong></header>

          {!isClosed && <ol className="commission-status-timeline" aria-label="Avanzamento della commissione">
            {stages.map(([status, label], index) => <li key={status} className={index < currentStage ? "is-complete" : index === currentStage ? "is-current" : ""} aria-current={index === currentStage ? "step" : undefined}><span>{String(index + 1).padStart(2, "0")}</span><strong>{label}</strong></li>)}
          </ol>}

          <dl className="commission-status-facts">
            <div><dt>Richiesta inviata</dt><dd>{displayDate(result.createdAt)}</dd></div>
            <div><dt>Tipo di opera</dt><dd>{result.category}</dd></div>
            <div><dt>Modalità scelta</dt><dd>{result.packageName}</dd></div>
            <div><dt>Utilizzo</dt><dd>{result.intendedUse}</dd></div>
            <div><dt>Data ideale</dt><dd>{displayDate(result.idealDeadline)}</dd></div>
          </dl>

          {result.quoteCents != null && <section className="commission-status-quote">
            <small>Preventivo GiWise Studio</small>
            <strong>{(result.quoteCents / 100).toLocaleString("it-IT", { style: "currency", currency: "EUR" })}</strong>
            <dl className="commission-status-benefit-breakdown">
              <div><dt>Prezzo iniziale</dt><dd>{((result.quoteBaseCents ?? result.quoteCents) / 100).toLocaleString("it-IT", { style: "currency", currency: "EUR" })}</dd></div>
              <div><dt>{result.membershipDiscountPercent ? `${getCommissionPromotionForSubmission(result.packageName, result.createdAt)?.label ?? (result.membershipPlanCode ? "Universe Pass" : "Visitatore")} · sconto ${result.membershipDiscountPercent}%` : "Visitatore · nessuno sconto"}</dt><dd>−{(result.quoteDiscountCents / 100).toLocaleString("it-IT", { style: "currency", currency: "EUR" })}</dd></div>
              <div><dt>Totale finale</dt><dd>{(result.quoteCents / 100).toLocaleString("it-IT", { style: "currency", currency: "EUR" })}</dd></div>
            </dl>
            <p>Il preventivo diventa operativo soltanto dopo la conferma del cliente e le successive indicazioni di GiWise Studio.</p>
            {result.depositCents != null ? <p><b>Acconto concordato:</b> {(result.depositCents / 100).toLocaleString("it-IT", { style: "currency", currency: "EUR" })}</p> : null}
          </section>}

          {["accepted", "awaiting_balance"].includes(result.status) ? <section className="commission-status-payment">
            <p className="eyebrow">Pagamento protetto · Stripe</p>
            <h3>{result.status === "accepted" ? "Conferma l’acconto concordato." : "Completa il saldo finale."}</h3>
            <p>Devi accedere con lo stesso indirizzo email usato nella richiesta. L’importo resta quello del preventivo accettato e viene verificato dal server prima di aprire Stripe.</p>
            <button className="button button-primary" type="button" disabled={checkoutLoading} onClick={() => void startPayment()}>{checkoutLoading ? "Preparazione…" : result.status === "accepted" ? "Paga l'acconto" : "Paga il saldo"}</button>
          </section> : null}

          {result.clientResponse === "accepted" && <p className="commission-status-confirmation"><strong>Preventivo accettato</strong>La tua conferma è stata registrata il {displayDate(result.quoteTermsAcceptedAt ?? result.clientRespondedAt, true)}{result.quoteTermsVersion ? ` · Condizioni ${result.quoteTermsVersion}` : ""}.</p>}
          {result.clientResponse === "clarification_requested" && <p className="commission-status-confirmation"><strong>Chiarimento richiesto</strong>Il tuo messaggio è stato registrato il {displayDate(result.clientRespondedAt, true)}: “{result.clientMessage}”</p>}

          {canRespond && <section className="commission-status-response">
            <p className="eyebrow">La tua decisione</p>
            <h3>Come vuoi proseguire?</h3>
            <label className="commission-status-terms"><input type="checkbox" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} /><span>Ho letto e accetto le <Link href="/commissioni/condizioni" target="_blank" rel="noopener noreferrer">condizioni del servizio e la politica dei contenuti</Link> indicate nel preventivo.</span></label>
            <button className="button button-primary" type="button" disabled={loading || !termsAccepted} onClick={() => void requestStatus("accept_quote")}>Accetta il preventivo</button>
            <details>
              <summary>Vorrei prima un chiarimento</summary>
              <label><span>Messaggio per GiWise Studio</span><textarea value={clarification} onChange={(event) => setClarification(event.target.value)} minLength={10} maxLength={1000} rows={4} placeholder="Scrivi qui il dubbio o la modifica che vuoi discutere…" /></label>
              <button className="button button-ghost" type="button" disabled={loading || clarification.trim().length < 10} onClick={() => void requestStatus("request_clarification", clarification)}>Invia la richiesta di chiarimento</button>
            </details>
          </section>}
          {message && <p className="commission-status-message" role="status">{message}</p>}
        </>}
      </section>
    </div>
  );
}
