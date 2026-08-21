"use client";

import { useCallback, useEffect, useState } from "react";

type EmailRow = { id: string; recipientEmail: string; subject: string; status: string; attempts: number; lastError: string | null; sentAt: string | null; createdAt: string };
type Payload = { configured: boolean; sender: string; summary: { total: number; sent: number; queued: number; failed: number; archived: number }; emails: EmailRow[]; error?: string };

function dateTime(value: string | null) {
  if (!value) return "—";
  const parsed = new Date(/Z$|[+-]\d\d:\d\d$/.test(value) ? value : `${value.replace(" ", "T")}Z`);
  return Number.isNaN(parsed.getTime()) ? value : new Intl.DateTimeFormat("it-IT", { dateStyle: "medium", timeStyle: "short" }).format(parsed);
}

export function TransactionalEmailDashboard() {
  const [data, setData] = useState<Payload | null>(null);
  const [message, setMessage] = useState("Apertura della coda email…");
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    const response = await fetch("/api/admin/transactional-emails", { cache: "no-store" });
    const payload = await response.json() as Payload;
    if (!response.ok) throw new Error(payload.error || "Coda email non disponibile.");
    setData(payload); setMessage("");
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => { void load().catch((error: Error) => setMessage(error.message)); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  async function retry(id?: string) {
    setBusy(true); setMessage("Tentativo di invio in corso…");
    try {
      const response = await fetch("/api/admin/transactional-emails", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(id ? { id } : { action: "retry_pending" }) });
      const payload = await response.json() as { processed?: number; error?: string };
      if (!response.ok) throw new Error(payload.error || "Invio non riuscito.");
      setMessage(`${payload.processed ?? 0} messaggi elaborati.`); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Invio non riuscito."); }
    finally { setBusy(false); }
  }
  async function archive(id: string) {
    setBusy(true); setMessage("Archiviazione in corso…");
    try {
      const response = await fetch("/api/admin/transactional-emails", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action: "archive" }) });
      const payload = await response.json() as { processed?: number; error?: string };
      if (!response.ok) throw new Error(payload.error || "Archiviazione non riuscita.");
      setMessage(payload.processed ? "Messaggio archiviato senza perdere la traccia amministrativa." : "Il messaggio non era più archiviabile."); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Archiviazione non riuscita."); }
    finally { setBusy(false); }
  }
  if (!data) return <section className="email-admin-state"><strong>Consegna transazionale</strong><p>{message}</p></section>;
  return <section className="email-admin-dashboard">
    <header><div><p className="eyebrow">Ricevute e notifiche</p><h1>Ogni messaggio lascia una traccia.</h1><p>Acquisti, rinnovi e commissioni entrano prima nella coda LoreWise; Resend li consegna senza poter duplicare lo stesso evento.</p></div><aside className={data.configured ? "is-ready" : "needs-key"}><strong>{data.configured ? "Resend collegato" : "Chiave Resend necessaria"}</strong><span>{data.sender}</span></aside></header>
    <div className="email-admin-summary"><div><strong>{data.summary.total}</strong><span>Totali</span></div><div><strong>{data.summary.sent}</strong><span>Consegnati</span></div><div><strong>{data.summary.queued}</strong><span>In coda</span></div><div><strong>{data.summary.failed}</strong><span>Da riprovare</span></div><div><strong>{data.summary.archived}</strong><span>Archiviati</span></div></div>
    <div className="email-admin-toolbar"><p>{data.configured ? "Il provider è pronto. Gli errori possono essere reinviati in sicurezza." : "La coda è operativa e conserva i messaggi; per la consegna reale serve RESEND_API_KEY."}</p><button type="button" disabled={busy || (!data.summary.queued && !data.summary.failed)} onClick={() => void retry()}>{busy ? "Elaborazione…" : "Invia messaggi in attesa"}</button></div>
    {message ? <p className="email-admin-message" role="status">{message}</p> : null}
    {data.emails.length ? <ol className="email-admin-list">{data.emails.map((email) => <li key={email.id}><span className={`email-status email-status-${email.status}`}>{email.status}</span><div><strong>{email.subject}</strong><small>{email.recipientEmail} · creato {dateTime(email.createdAt)}</small>{email.lastError ? <p>{email.lastError}</p> : null}</div><div><small>{email.attempts} tentativi</small><span>{email.sentAt ? dateTime(email.sentAt) : email.status === "archived" ? "Archiviato senza invio" : "Non ancora inviato"}</span>{email.status !== "sent" && email.status !== "archived" ? <><button type="button" disabled={busy} onClick={() => void retry(email.id)}>Riprova</button><button type="button" disabled={busy} onClick={() => void archive(email.id)}>Archivia</button></> : null}</div></li>)}</ol> : <p className="email-admin-empty">La coda è vuota. I prossimi eventi commerciali compariranno qui.</p>}
  </section>;
}
