"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ModerationPayload = {
  moderator: { email: string; role: "admin" | "moderator"; simulated?: boolean };
  stats: { openReports: number; visibleComments: number; hiddenComments: number; blockedAccounts: number };
  reports: Array<{
    commentId: string; artworkCode: string; body: string; commentStatus: string; authorName: string;
    authorEmail: string; reportCount: number; reasons: string[]; reportedAt: string;
  }>;
  blockedAccounts: Array<{ id: string; email: string; displayName: string; blockedAt: string }>;
  hiddenComments: Array<{ id: string; artworkCode: string; body: string; authorName: string; authorEmail: string; hiddenAt: string }>;
  events: Array<{ action: string; commentId: string | null; targetUserId: string | null; note: string | null; createdAt: string }>;
  error?: string;
  message?: string;
};

const actionLabels: Record<string, string> = {
  hide_comment: "Commento nascosto",
  restore_comment: "Commento ripristinato",
  delete_comment: "Commento eliminato",
  dismiss_reports: "Segnalazione archiviata",
  block_author: "Account bloccato",
  unblock_account: "Account sbloccato",
};

function createSimulationPayload(): ModerationPayload {
  return {
    moderator: { email: "admin.simulato@example.invalid", role: "admin", simulated: true },
    stats: { openReports: 2, visibleComments: 1, hiddenComments: 0, blockedAccounts: 0 },
    reports: [{
      commentId: "simulated-comment",
      artworkCode: "LW-ART-003",
      body: "Questo è un commento dimostrativo creato per provare la moderazione.",
      commentStatus: "visible",
      authorName: "Utente di prova",
      authorEmail: "utente.prova@example.invalid",
      reportCount: 2,
      reasons: ["Contenuto inappropriato", "Spam o pubblicità"],
      reportedAt: new Date().toISOString(),
    }],
    blockedAccounts: [],
    hiddenComments: [],
    events: [],
  };
}

function italianDate(value: string) {
  const normalized = /Z$|[+-]\d\d:\d\d$/.test(value) ? value : `${value.replace(" ", "T")}Z`;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("it-IT", { dateStyle: "short", timeStyle: "short" }).format(date);
}

function communityContentHref(code: string) {
  if (code.startsWith("GS-GAME-")) return code === "GS-GAME-001" ? "/giochi/the-wound-remembers" : "/giochi";
  return `/arte/${code.toLocaleLowerCase("it")}`;
}

export function CommunityModerationDashboard({ simulation = false }: { simulation?: boolean }) {
  const [data, setData] = useState<ModerationPayload | null>(() => simulation ? createSimulationPayload() : null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [message, setMessage] = useState(simulation ? "" : "Caricamento dell’archivio di moderazione…");
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (simulation) return;
    let active = true;
    void fetch("/api/art-community/moderation", { headers: { accept: "application/json" } })
      .then(async (response) => {
        const body = await response.json() as ModerationPayload;
        if (!response.ok) throw new Error(body.error || "Moderazione non disponibile.");
        if (!active) return;
        setData(body);
        setMessage("");
      })
      .catch((error: Error) => active && setMessage(error.message));
    return () => { active = false; };
  }, [simulation]);

  async function moderate(commentId: string, action: string, targetUserId?: string) {
    const operationId = targetUserId || commentId;
    setBusyId(operationId);
    setMessage("Registrazione dell’azione…");
    if (simulation) {
      if (action === "reset_simulation") {
        setData(createSimulationPayload());
        setNotes({});
        setMessage("Scenario amministratore ripristinato.");
        setBusyId(null);
        return;
      }
      setData((current) => {
        if (!current) return current;
        const report = current.reports.find((item) => item.commentId === commentId);
        if (!report) return current;
        const stats = { ...current.stats };
        let reports = current.reports;
        if (action === "hide_comment" && report.commentStatus === "visible") {
          stats.visibleComments = Math.max(0, stats.visibleComments - 1);
          stats.hiddenComments += 1;
          reports = reports.map((item) => item.commentId === commentId ? { ...item, commentStatus: "hidden" } : item);
        } else if (action === "restore_comment" && report.commentStatus === "hidden") {
          stats.hiddenComments = Math.max(0, stats.hiddenComments - 1);
          stats.visibleComments += 1;
          reports = reports.map((item) => item.commentId === commentId ? { ...item, commentStatus: "visible" } : item);
        } else if (["dismiss_reports", "delete_comment", "block_author"].includes(action)) {
          stats.openReports = Math.max(0, stats.openReports - report.reportCount);
          if (action === "delete_comment") {
            if (report.commentStatus === "hidden") stats.hiddenComments = Math.max(0, stats.hiddenComments - 1);
            else stats.visibleComments = Math.max(0, stats.visibleComments - 1);
          }
          if (action === "block_author") stats.blockedAccounts += 1;
          reports = reports.filter((item) => item.commentId !== commentId);
        }
        return {
          ...current,
          stats,
          reports,
          events: [{ action, commentId, targetUserId: "simulated-user", note: notes[commentId]?.trim() || null, createdAt: new Date().toISOString() }, ...current.events],
        };
      });
      setMessage("Azione simulata e registrata nel registro di prova.");
      setBusyId(null);
      return;
    }
    try {
      const response = await fetch("/api/art-community/moderation", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", accept: "application/json" },
        body: JSON.stringify({ commentId, targetUserId, action, note: notes[operationId] ?? "" }),
      });
      const body = await response.json() as ModerationPayload;
      if (!response.ok) throw new Error(body.error || "Azione non completata.");
      setData(body);
      setMessage(body.message || "Azione completata.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Azione non completata.");
    } finally {
      setBusyId(null);
    }
  }

  if (!data) return <section className="community-admin-state" aria-live="polite"><strong>GiWise Community</strong><p>{message}</p><Link href="/account">Torna all’area account</Link></section>;

  return <>
    {data.moderator.simulated ? <section className="community-admin-simulation" role="status">
      <div><strong>Modalità prova locale</strong><p>Nomi, email, commento e segnalazioni in questa schermata sono dati fittizi. Nessun account reale viene modificato.</p></div>
      <button type="button" disabled={busyId === "simulation"} onClick={() => void moderate("simulation", "reset_simulation")}>Ripristina scenario</button>
    </section> : null}
    <section className="community-admin-summary" aria-label="Riepilogo moderazione">
      <div><span>Segnalazioni aperte</span><strong>{data.stats.openReports}</strong></div>
      <div><span>Commenti visibili</span><strong>{data.stats.visibleComments}</strong></div>
      <div><span>Commenti nascosti</span><strong>{data.stats.hiddenComments}</strong></div>
      <div><span>Account bloccati</span><strong>{data.stats.blockedAccounts}</strong></div>
    </section>

    <section className="community-admin-reports" aria-labelledby="community-reports-title">
      <header><div><p className="eyebrow">Coda di controllo</p><h2 id="community-reports-title">Segnalazioni da valutare.</h2></div><strong>{data.moderator.role === "admin" ? "Amministratore" : "Moderatore"}<small>{data.moderator.email}</small></strong></header>
      {data.reports.length ? <ol>{data.reports.map((report, index) => <li key={report.commentId}>
        <span>{String(index + 1).padStart(2, "0")}</span>
        <article>
          <div className="community-admin-report-meta"><Link href={communityContentHref(report.artworkCode)}>{report.artworkCode}</Link><time>{italianDate(report.reportedAt)}</time><strong>{report.reportCount} {report.reportCount === 1 ? "segnalazione" : "segnalazioni"}</strong></div>
          <blockquote>{report.body || "Commento già rimosso"}</blockquote>
          <p><strong>{report.authorName}</strong><small>{report.authorEmail}</small></p>
          <ul>{report.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
          <label htmlFor={`moderation-note-${report.commentId}`}>Nota privata</label>
          <textarea id={`moderation-note-${report.commentId}`} value={notes[report.commentId] ?? ""} onChange={(event) => setNotes((current) => ({ ...current, [report.commentId]: event.target.value }))} maxLength={300} placeholder="Motivazione o riferimento interno…" />
          <div className="community-admin-actions">
            {report.commentStatus === "hidden" ? <button type="button" disabled={busyId === report.commentId} onClick={() => void moderate(report.commentId, "restore_comment")}>Ripristina</button> : <button type="button" disabled={busyId === report.commentId} onClick={() => void moderate(report.commentId, "hide_comment")}>Nascondi</button>}
            <button type="button" disabled={busyId === report.commentId} onClick={() => void moderate(report.commentId, "dismiss_reports")}>Archivia segnalazione</button>
            {data.moderator.role === "admin" ? <><button type="button" className="danger" disabled={busyId === report.commentId} onClick={() => void moderate(report.commentId, "delete_comment")}>Elimina commento</button><button type="button" className="danger" disabled={busyId === report.commentId} onClick={() => void moderate(report.commentId, "block_author")}>Blocca account</button></> : null}
          </div>
        </article>
      </li>)}</ol> : <div className="community-admin-empty"><strong>Nessuna segnalazione aperta.</strong><p>La coda resterà vuota finché non arriveranno interazioni reali da controllare.</p></div>}
      {message ? <p className="community-admin-message" role="status" aria-live="polite">{message}</p> : null}
    </section>

    <section className="community-admin-history" aria-labelledby="community-history-title"><header><p className="eyebrow">Registro riservato</p><h2 id="community-history-title">Ultime azioni.</h2></header>{data.events.length ? <ol>{data.events.map((event, index) => <li key={`${event.createdAt}-${index}`}><time>{italianDate(event.createdAt)}</time><strong>{actionLabels[event.action] ?? event.action}</strong><span>{event.note || "Nessuna nota privata"}</span></li>)}</ol> : <p>Nessuna azione di moderazione registrata.</p>}</section>

    <section className="community-admin-history" aria-labelledby="community-hidden-title">
      <header><p className="eyebrow">Contenuti sospesi</p><h2 id="community-hidden-title">Commenti oscurati.</h2></header>
      {data.hiddenComments.length ? <ol>{data.hiddenComments.map((comment) => <li key={comment.id}>
        <time>{italianDate(comment.hiddenAt)}</time><strong>{comment.artworkCode} · {comment.authorName}</strong><span>{comment.body}</span>
        <button type="button" disabled={busyId === comment.id} onClick={() => void moderate(comment.id, "restore_comment")}>Ripristina commento</button>
      </li>)}</ol> : <p>Nessun commento oscurato.</p>}
    </section>

    <section className="community-admin-history" aria-labelledby="community-blocked-title">
      <header><p className="eyebrow">Accessi sospesi</p><h2 id="community-blocked-title">Account bloccati.</h2></header>
      {data.blockedAccounts.length ? <ol>{data.blockedAccounts.map((account) => <li key={account.id}>
        <time>{italianDate(account.blockedAt)}</time><strong>{account.displayName}</strong><span>{account.email}</span>
        <button type="button" disabled={busyId === account.id} onClick={() => void moderate("", "unblock_account", account.id)}>Sblocca account</button>
      </li>)}</ol> : <p>Nessun account bloccato.</p>}
    </section>
  </>;
}
