"use client";

import { useEffect, useState } from "react";

type AdminData = {
  summary: { total: number; paid: number; pending: number; canceled: number; refunded: number; paidCents: number };
  orders: Array<{ id: string; referenceCode: string; orderType: string; status: string; currency: string; totalCents: number; paidAt: string | null; createdAt: string; customerEmail: string; titles: string; deliveryMode: string; deliveryStatus: string | null; deliverySentAt: string | null }>;
  supportRequests: Array<{ id: string; referenceCode: string; orderReference: string; requestType: string; reason: string; details: string; status: string; adminNotes: string; createdAt: string; updatedAt: string; customerEmail: string; orderStatus: string; canRefund: boolean }>;
  testMode: boolean;
};

const labels: Record<string, string> = { paid: "Pagato", pending: "In attesa", canceled: "Annullato", refund_pending: "Rimborso in corso", refunded: "Rimborsato", open: "Aperta", reviewing: "In valutazione", approved: "Approvata", rejected: "Non approvata", resolved: "Risolta" };
const supportStatuses = ["open", "reviewing", "approved", "rejected", "resolved"];
const money = (cents: number, currency = "EUR") => new Intl.NumberFormat("it-IT", { style: "currency", currency }).format(cents / 100);
const date = (value: string) => new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(`${value.replace(" ", "T")}Z`));

export function OrderAdminDashboard() {
  const [data, setData] = useState<AdminData | null>(null);
  const [message, setMessage] = useState("Caricamento dell’archivio…");
  const [busyId, setBusyId] = useState("");

  async function load() {
    const response = await fetch("/api/orders/admin", { headers: { accept: "application/json" }, cache: "no-store" });
    const body = await response.json() as AdminData & { error?: string };
    if (!response.ok) throw new Error(body.error || "Archivio non disponibile.");
    setData(body); setMessage("");
  }

  useEffect(() => {
    let active = true;
    void fetch("/api/orders/admin", { headers: { accept: "application/json" }, cache: "no-store" }).then(async (response) => {
      const body = await response.json() as AdminData & { error?: string };
      if (!response.ok) throw new Error(body.error || "Archivio non disponibile.");
      if (active) { setData(body); setMessage(""); }
    }).catch((error: Error) => active && setMessage(error.message));
    return () => { active = false; };
  }, []);

  async function saveRequest(id: string, status: string, adminNotes: string) {
    setBusyId(id); setMessage("");
    try {
      const response = await fetch("/api/orders/admin", { method: "PATCH", headers: { "content-type": "application/json", accept: "application/json" }, body: JSON.stringify({ id, status, adminNotes }) });
      const body = await response.json() as { message?: string; error?: string };
      if (!response.ok) throw new Error(body.error || "Aggiornamento non riuscito.");
      setMessage(body.message || "Richiesta aggiornata."); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Aggiornamento non riuscito."); }
    finally { setBusyId(""); }
  }

  async function refundRequest(id: string, adminNotes: string) {
    if (!window.confirm(`Confermi il rimborso completo Stripe${data?.testMode ? " in modalità test" : " reale"}? La licenza e i download verranno revocati dopo la conferma.`)) return;
    setBusyId(id); setMessage("");
    try {
      const response = await fetch("/api/orders/admin", { method: "PATCH", headers: { "content-type": "application/json", accept: "application/json" }, body: JSON.stringify({ id, action: "refund", adminNotes }) });
      const body = await response.json() as { message?: string; error?: string };
      if (!response.ok) throw new Error(body.error || "Rimborso non riuscito.");
      setMessage(body.message || "Rimborso registrato."); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Rimborso non riuscito."); }
    finally { setBusyId(""); }
  }

  async function updateDelivery(id: string, status: "pending" | "sent") {
    const question = status === "sent"
      ? "Confermi di avere inviato il collegamento privato all'email LoreWise indicata?"
      : "Riportare questa consegna in attesa?";
    if (!window.confirm(question)) return;
    setBusyId(id); setMessage("");
    try {
      const response = await fetch("/api/orders/admin", { method: "PATCH", headers: { "content-type": "application/json", accept: "application/json" }, body: JSON.stringify({ id, action: "delivery", status }) });
      const body = await response.json() as { message?: string; error?: string };
      if (!response.ok) throw new Error(body.error || "Aggiornamento della consegna non riuscito.");
      setMessage(body.message || "Consegna aggiornata."); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Aggiornamento della consegna non riuscito."); }
    finally { setBusyId(""); }
  }

  if (!data) return <section className="order-admin-loading" aria-live="polite"><strong>Archivio commerciale LoreWise</strong><p>{message}</p></section>;
  return <div className="order-admin-dashboard">
    <p className="order-admin-test"><strong>{data.testMode ? "Ambiente di prova." : "Ambiente commerciale reale."}</strong> {data.testMode ? "Ordini e rimborsi usano Stripe test e non producono incassi reali." : "Ordini, rimborsi e revoche producono effetti reali: verifica sempre riferimento, cliente e importo prima di confermare."}</p>
    {message ? <p className="order-admin-message" role="status">{message}</p> : null}
    <ol className="order-admin-summary"><li><span>Ordini</span><strong>{data.summary.total}</strong></li><li><span>Pagati</span><strong>{data.summary.paid}</strong></li><li><span>Rimborsati</span><strong>{data.summary.refunded}</strong></li><li><span>{data.testMode ? "Totale test" : "Totale incassato"}</span><strong>{money(data.summary.paidCents)}</strong></li></ol>
    <section className="order-admin-register"><header><p className="eyebrow">Registro commerciale</p><h2>Ordini LoreWise.</h2></header><div className="order-admin-table"><div className="order-admin-row order-admin-head"><span>Ordine</span><span>Cliente</span><span>Stato</span><span>Totale</span></div>{data.orders.map((order) => <article className="order-admin-row" key={order.id}><div><strong>{order.titles || order.orderType}</strong><small>{order.referenceCode} · {date(order.createdAt)}{order.deliveryMode === "manual" ? ` · consegna ${order.deliveryStatus === "sent" ? "inviata" : "da inviare"}` : ""}</small>{order.deliveryMode === "manual" && order.status === "paid" ? <button type="button" disabled={busyId === order.id} onClick={() => void updateDelivery(order.id, order.deliveryStatus === "sent" ? "pending" : "sent")}>{busyId === order.id ? "Aggiornamento..." : order.deliveryStatus === "sent" ? "Riapri consegna" : "Segna come consegnato"}</button> : null}</div><span>{order.customerEmail}</span><em>{labels[order.status] ?? order.status}</em><b>{money(order.totalCents, order.currency)}</b></article>)}</div></section>
    <section className="order-admin-support"><header><p className="eyebrow">Assistenza e rimborsi</p><h2>Richieste da valutare.</h2><p>Una richiesta di rimborso deve essere prima approvata. Solo allora compare il comando Stripe che revoca licenza e download dopo la conferma.</p></header>{data.supportRequests.length ? <div>{data.supportRequests.map((request) => <SupportEditor key={request.id} request={request} busy={busyId === request.id} onSave={saveRequest} onRefund={refundRequest} testMode={data.testMode} />)}</div> : <p className="order-admin-empty">Nessuna richiesta di assistenza o rimborso.</p>}</section>
  </div>;
}

function SupportEditor({ request, busy, onSave, onRefund, testMode }: { request: AdminData["supportRequests"][number]; busy: boolean; onSave: (id: string, status: string, notes: string) => Promise<void>; onRefund: (id: string, notes: string) => Promise<void>; testMode: boolean }) {
  const [status, setStatus] = useState(request.status);
  const [notes, setNotes] = useState(request.adminNotes);
  return <article className="order-support-editor"><header><div><span>{request.requestType === "refund" ? "Rimborso" : "Assistenza"}</span><h3>{request.reason}</h3><small>{request.referenceCode} · ordine {request.orderReference} · {request.customerEmail}</small></div><time>{date(request.createdAt)}</time></header><p>{request.details}</p><div><label>Stato<select value={status} onChange={(event) => setStatus(event.target.value)}>{supportStatuses.map((value) => <option key={value} value={value}>{labels[value]}</option>)}</select></label><label>Risposta e note<textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} maxLength={3000} placeholder="Risposta visibile al cliente nella scheda ordine" /></label><button type="button" disabled={busy} onClick={() => void onSave(request.id, status, notes)}>{busy ? "Salvataggio…" : "Salva valutazione"}</button>{request.canRefund ? <button className="order-refund-action" type="button" disabled={busy} onClick={() => void onRefund(request.id, notes)}>{busy ? "Rimborso…" : `Esegui rimborso Stripe${testMode ? " test" : ""}`}</button> : null}</div></article>;
}
