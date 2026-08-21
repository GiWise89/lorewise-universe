"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type OrderDetail = {
  referenceCode: string; type: string; status: string; currency: string; subtotalCents: number; discountCents: number;
  benefitPlanCode: string | null; benefitDiscountPercent: number; totalCents: number;
  paidAt: string | null; createdAt: string; updatedAt: string; canCancel: boolean; testMode: boolean;
  items: Array<{ productCode: string; productType: string; title: string; quantity: number; unitAmountCents: number; licenseType: string | null }>;
  supportRequests: Array<{ referenceCode: string; requestType: string; reason: string; details: string; status: string; adminNotes: string | null; resolvedAt: string | null; createdAt: string; updatedAt: string }>;
};

const statusLabels: Record<string, string> = {
  paid: "Pagato", pending: "In attesa", canceled: "Annullato", checkout_failed: "Apertura pagamento non riuscita", refund_pending: "Rimborso in corso", refunded: "Rimborsato", disputed: "Contestato",
  open: "Aperta", reviewing: "In valutazione", approved: "Approvata", rejected: "Non approvata", resolved: "Risolta",
};

function dateTime(value: string | null) {
  if (!value) return "—";
  const normalized = /Z$|[+-]\d\d:\d\d$/.test(value) ? value : `${value.replace(" ", "T")}Z`;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("it-IT", { dateStyle: "long", timeStyle: "short" }).format(date);
}

function money(cents: number, currency: string) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency }).format(cents / 100);
}

export function OrderDetailPanel({ referenceCode }: { referenceCode: string }) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [message, setMessage] = useState("Caricamento del riepilogo protetto…");
  const [busy, setBusy] = useState(false);
  const [supportType, setSupportType] = useState<"support" | "refund">("support");
  const [supportReason, setSupportReason] = useState("");
  const [supportDetails, setSupportDetails] = useState("");

  async function load() {
    const response = await fetch(`/api/account/orders/${encodeURIComponent(referenceCode)}`, { headers: { accept: "application/json" }, cache: "no-store" });
    const body = await response.json() as { order?: OrderDetail; error?: string };
    if (!response.ok || !body.order) throw new Error(body.error || "Ordine non disponibile.");
    setOrder(body.order);
    setMessage("");
  }

  useEffect(() => {
    let active = true;
    void fetch(`/api/account/orders/${encodeURIComponent(referenceCode)}`, { headers: { accept: "application/json" }, cache: "no-store" })
      .then(async (response) => {
        const body = await response.json() as { order?: OrderDetail; error?: string };
        if (!response.ok || !body.order) throw new Error(body.error || "Ordine non disponibile.");
        if (!active) return;
        setOrder(body.order);
        setMessage("");
      })
      .catch((error: Error) => active && setMessage(error.message));
    return () => { active = false; };
  }, [referenceCode]);

  async function cancelOrder() {
    if (!order) return;
    if (!window.confirm(`Vuoi chiudere questa sessione Stripe${order.testMode ? " di prova" : ""} e annullare l’ordine?`)) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/account/orders/${encodeURIComponent(referenceCode)}`, {
        method: "PATCH", headers: { "content-type": "application/json", accept: "application/json" }, body: JSON.stringify({ action: "cancel" }),
      });
      const body = await response.json() as { message?: string; error?: string };
      if (!response.ok) throw new Error(body.error || "Annullamento non riuscito.");
      setMessage(body.message || "Ordine annullato.");
      await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Annullamento non riuscito."); }
    finally { setBusy(false); }
  }

  async function submitSupport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/account/orders/${encodeURIComponent(referenceCode)}`, {
        method: "POST", headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ requestType: supportType, reason: supportReason, details: supportDetails }),
      });
      const body = await response.json() as { message?: string; error?: string };
      if (!response.ok) throw new Error(body.error || "Richiesta non registrata.");
      setSupportReason("");
      setSupportDetails("");
      setMessage(body.message || "Richiesta registrata.");
      await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Richiesta non registrata."); }
    finally { setBusy(false); }
  }

  if (!order) return <section className="order-detail-loading" aria-live="polite"><strong>Archivio ordini LoreWise</strong><p>{message}</p></section>;

  return <section className="order-document" aria-labelledby="order-document-title">
    <header>
      <div><p className="eyebrow">Riepilogo d’ordine · LoreWise ID</p><h1 id="order-document-title">{order.referenceCode}</h1><p>Documento personale di riepilogo. Non costituisce fattura né ricevuta fiscale.</p></div>
      <span className={`order-status order-status-${order.status}`}>{statusLabels[order.status] ?? order.status}</span>
    </header>

    {order.testMode ? <p className="order-test-notice"><strong>Modalità di prova.</strong> Questo ordine appartiene al collaudo Stripe e non rappresenta un incasso reale.</p> : null}
    {message ? <p className="order-action-message" role="status">{message}</p> : null}

    <dl className="order-facts">
      <div><dt>Ordine</dt><dd>{order.referenceCode}</dd></div>
      <div><dt>Creato</dt><dd>{dateTime(order.createdAt)}</dd></div>
      <div><dt>Pagamento</dt><dd>{order.paidAt ? dateTime(order.paidAt) : "Non completato"}</dd></div>
      <div><dt>Canale</dt><dd>Stripe Checkout · ambiente test</dd></div>
    </dl>

    <div className="order-lines">
      <div className="order-lines-heading"><span>Contenuto</span><span>Quantità</span><span>Importo</span></div>
      {order.items.map((item) => <article key={`${item.productType}-${item.productCode}`}>
        <div><strong>{item.title}</strong><small>{item.productCode} · {item.licenseType === "personal-digital" ? "Licenza digitale personale" : item.productType}</small></div>
        <span>{item.quantity}</span><b>{money(item.unitAmountCents * item.quantity, order.currency)}</b>
      </article>)}
    </div>

    <div className="order-total">{order.discountCents > 0 ? <div><small>Prezzo iniziale {money(order.subtotalCents, order.currency)}</small><b>{order.benefitPlanCode} · sconto automatico {order.benefitDiscountPercent}%: −{money(order.discountCents, order.currency)}</b></div> : null}<span>Totale</span><strong>{money(order.totalCents, order.currency)}</strong></div>

    <section className="order-support" aria-labelledby="order-support-title">
      <div><p className="eyebrow">Assistenza collegata</p><h2 id="order-support-title">Serve aiuto con questo ordine?</h2><p>Ogni richiesta conserva il riferimento dell’ordine. Una domanda di rimborso avvia la valutazione amministrativa; soltanto il successivo rimborso Stripe confermato revoca licenza e download.</p></div>
      {order.supportRequests.length ? <ol>{order.supportRequests.map((request) => <li key={request.referenceCode}><div><strong>{request.requestType === "refund" ? "Valutazione rimborso" : "Assistenza ordine"}</strong><small>{request.referenceCode} · {dateTime(request.createdAt)}</small></div><span>{statusLabels[request.status] ?? request.status}</span><p>{request.reason}</p>{request.adminNotes ? <em>Risposta GiWise Studio: {request.adminNotes}</em> : null}</li>)}</ol> : <form onSubmit={(event) => void submitSupport(event)}>
        <label>Tipo di richiesta<select value={supportType} onChange={(event) => setSupportType(event.target.value as "support" | "refund")}><option value="support">Assistenza sull’ordine</option>{order.status === "paid" ? <option value="refund">Richiesta di rimborso</option> : null}</select></label>
        <label>Motivo<input value={supportReason} onChange={(event) => setSupportReason(event.target.value)} minLength={3} maxLength={120} required placeholder="Esempio: problema con il download" /></label>
        <label>Descrivi la situazione<textarea value={supportDetails} onChange={(event) => setSupportDetails(event.target.value)} minLength={20} maxLength={3000} required rows={5} placeholder="Spiega cosa è successo e quale soluzione ti aspetti." /></label>
        <button type="submit" disabled={busy}>{busy ? "Invio…" : "Invia la richiesta"}</button>
      </form>}
    </section>
    <footer>
      <div><strong>GiWise Studio · LoreWise Universe</strong><p>Ordine collegato al LoreWise ID autenticato. Licenze e download rimangono disponibili nell’area personale secondo le condizioni applicabili.</p></div>
      <div className="order-actions"><Link href="/account">Torna all’area personale</Link><button type="button" onClick={() => window.print()}>Stampa o salva PDF</button>{order.canCancel ? <button className="order-cancel" type="button" disabled={busy} onClick={() => void cancelOrder()}>{busy ? "Annullamento…" : `Annulla ordine${order.testMode ? " di prova" : ""}`}</button> : null}</div>
    </footer>
  </section>;
}
