"use client";

import { FormEvent, MouseEvent, useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type Overview = {
  identity: { email: string };
  summary: { users: number; activeUsers: number; subscriptions: number; pendingOrders: number; support: number; commissions: number; reports: number; deliveries: number; pendingEmails: number; unreadNotifications: number };
  analytics: {
    configuredHost: string;
    totals: { today: number; last7Days: number; last30Days: number; allTime: number; sessions30Days: number };
    daily: Array<{ day: string; views: number; sessions: number }>;
    topPages: Array<{ path: string; views: number; sessions: number }>;
    referrers: Array<{ host: string; views: number }>;
    twrFunnel: { landingViews30Days: number; playClicks30Days: number; landingToPlayPercent: number; sources: Array<{ source: string; clicks: number }> };
  };
  notifications: Array<{ id: string; category: string; severity: string; title: string; message: string; referenceCode: string | null; targetUrl: string; createdAt: string; readAt: string | null }>;
  recentActions: Array<{ action: string; note: string | null; createdAt: string; adminEmail: string | null; targetEmail: string | null }>;
};

type UserRow = {
  id: string; email: string; displayName: string; role: string; status: string; createdAt: string; updatedAt: string;
  planCode: string | null; planStatus: string | null; credits: number; orders: number; libraryItems: number; owner: boolean;
};

type FamiglioCustodianSummary = {
  totalCustodians: number;
  totalFamiliars: number;
  custodians: Array<{
    customerId: string;
    email: string;
    displayName: string;
    accountStatus: string;
    revision: number;
    createdAt: string;
    updatedAt: string;
    familiars: Array<{ speciesId: string; speciesName: string; familiarName: string }>;
  }>;
};

const modules = [
  { code: "01", title: "Utenti", description: "Profili, ruoli, stato, crediti e diritti collegati al LoreWise ID.", href: "#admin-users", icon: "/brand/icons/social-assistenza-concept-v1.webp", tone: "cyan" },
  { code: "02", title: "Abbonamenti e vantaggi", description: "Piani, rinnovi, crediti, sconti e accessi assegnati dal motore vantaggi.", href: "#admin-users", icon: "/brand/lorewise-universe-logo-concept-c.webp", tone: "violet" },
  { code: "03", title: "Ordini e rimborsi", description: "Pagamenti, rimborsi e revoca dei diritti dopo conferma.", href: "/gestione-ordini", icon: "/brand/icons/shop-concept-v1.webp", tone: "gold" },
  { code: "04", title: "Commissioni", description: "Brief, allegati, preventivi, sconti automatici e avanzamento lavori.", href: "/gestione-commissioni", icon: "/brand/icons/commissioni-concept-v1.webp", tone: "pink" },
  { code: "05", title: "Arte e licenze", description: "Pacchetti protetti, certificati, controllo qualità e consegne personali.", href: "/gestione-consegne-arte", icon: "/brand/icons/arte-concept-v1.webp", tone: "rose" },
  { code: "06", title: "Giochi e applicazioni", description: "Build Windows, pacchetti privati, versioni e accessi al download.", href: "/gestione-consegne-giochi", icon: "/brand/icons/giochi-concept-v1.webp", tone: "cyan" },
  { code: "07", title: "Community", description: "Segnalazioni, contenuti sospesi, blocchi e registro moderazione.", href: "/gestione-community", icon: "/brand/icons/social-assistenza-concept-v1.webp", tone: "violet" },
  { code: "08", title: "Pubblicazione", description: "Configurazione, pagamenti di prova, archivi e barriere di lancio.", href: "/gestione-lancio", icon: "/brand/lorewise-universe-logo-concept-c.webp", tone: "gold" },
  { code: "09", title: "Ricevute e notifiche", description: "Coda email, consegne Resend, errori e reinvii senza duplicazioni.", href: "/gestione-email", icon: "/brand/icons/social-assistenza-concept-v1.webp", tone: "pink" },
  { code: "10", title: "Centro assistenza", description: "Ticket collegati agli utenti, priorità, stato e risposte tracciate.", href: "/gestione-assistenza", icon: "/brand/icons/social-assistenza-concept-v1.webp", tone: "cyan" },
  { code: "11", title: "Visite del sito", description: "Visualizzazioni, sessioni anonime, pagine più consultate e provenienza del traffico pubblico.", href: "#admin-analytics", icon: "/brand/lorewise-universe-logo-concept-c.webp", tone: "violet" },
  { code: "12", title: "Comunicazioni GiWise Studio", description: "Bozze, anteprime, pubblico consenziente, prove e invii delle novità facoltative.", href: "/gestione-comunicazioni", icon: "/brand/icons/social-assistenza-concept-v1.webp", tone: "rose" },
];

const famiglioCustodiansModule = { code: "13", title: "Custodi dei Famigli", description: "Account LoreWise ID che hanno schiuso un Famiglio, email, Case attive e ultima sincronizzazione.", href: "#admin-famiglio-custodians", icon: "/famiglio/rebuild/nexus-pet-emblem-v2.png", tone: "gold" };

const actionLabels: Record<string, string> = { set_role: "Ruolo modificato", set_status: "Stato account modificato", grant_art_credit: "Credito Arte assegnato" };
const notificationLabels: Record<string, string> = { user: "Nuovo utente", purchase: "Acquisto", commission: "Preventivo", refund: "Rimborso", support: "Assistenza", payment: "Pagamento", community: "Community", delivery: "Controllo qualità", email: "Email transazionale" };

function date(value: string) {
  const parsed = new Date(/Z$|[+-]\d\d:\d\d$/.test(value) ? value : `${value.replace(" ", "T")}Z`);
  return Number.isNaN(parsed.getTime()) ? value : new Intl.DateTimeFormat("it-IT", { dateStyle: "medium", timeStyle: "short" }).format(parsed);
}

async function readApiResponse<T>(response: Response): Promise<T & { error?: string }> {
  const payload = await response.text();
  if (!payload) {
    const error = response.status === 401
      ? "La sessione è scaduta. Accedi di nuovo dall’Area personale."
      : response.status === 403
        ? "Questo profilo non dispone dei permessi amministrativi."
        : "Il servizio non ha restituito una risposta valida.";
    return { error } as T & { error?: string };
  }

  try {
    return JSON.parse(payload) as T & { error?: string };
  } catch {
    return { error: "Il Centro Admin non è temporaneamente disponibile." } as T & { error?: string };
  }
}

export function AdminControlCenter() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [famiglioCustodians, setFamiglioCustodians] = useState<FamiglioCustodianSummary | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("Apertura del Centro Admin…");
  const [busy, setBusy] = useState(false);
  const [notificationCategory, setNotificationCategory] = useState("all");
  const [notificationSeverity, setNotificationSeverity] = useState("all");

  const loadOverview = useCallback(async () => {
    const response = await fetch("/api/admin/overview", { headers: { accept: "application/json" } });
    const body = await readApiResponse<Overview>(response);
    if (!response.ok) throw new Error(body.error || "Centro Admin non disponibile.");
    setOverview(body);
  }, []);

  const loadUsers = useCallback(async (nextSearch: string, nextStatus: string) => {
    const parameters = new URLSearchParams();
    if (nextSearch) parameters.set("search", nextSearch);
    if (nextStatus !== "all") parameters.set("status", nextStatus);
    const response = await fetch(`/api/admin/users?${parameters.toString()}`, { headers: { accept: "application/json" } });
    const body = await readApiResponse<{ users?: UserRow[] }>(response);
    if (!response.ok || !body.users) throw new Error(body.error || "Registro utenti non disponibile.");
    setUsers(body.users);
    setSelectedId((current) => body.users?.some((user) => user.id === current) ? current : (body.users?.[0]?.id ?? ""));
  }, []);

  const loadFamiglioCustodians = useCallback(async () => {
    const response = await fetch("/api/admin/famigli", { headers: { accept: "application/json" } });
    if (response.status === 403) { setFamiglioCustodians(null); return; }
    const body = await readApiResponse<FamiglioCustodianSummary>(response);
    if (!response.ok || !body.custodians) throw new Error(body.error || "Registro dei Custodi non disponibile.");
    setFamiglioCustodians(body);
  }, []);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      void Promise.all([loadOverview(), loadUsers("", "all"), loadFamiglioCustodians()]).then(() => active && setMessage("")).catch((error: Error) => active && setMessage(error.message));
    }, 0);
    const refresh = window.setInterval(() => {
      if (document.visibilityState === "visible") void loadOverview().catch(() => undefined);
    }, 45_000);
    return () => { active = false; window.clearTimeout(timer); window.clearInterval(refresh); };
  }, [loadFamiglioCustodians, loadOverview, loadUsers]);

  useEffect(() => {
    if (!overview) return;
    document.title = overview.summary.unreadNotifications
      ? `(${overview.summary.unreadNotifications}) Centro Admin LoreWise`
      : "Centro Admin LoreWise";
    return () => { document.title = "LoreWise Universe"; };
  }, [overview]);

  async function updateUser(action: string, value: string) {
    const selected = users.find((user) => user.id === selectedId);
    if (!selected) return;
    const sensitive = action === "set_status" && value === "blocked" || action === "set_role" && value === "admin";
    if (sensitive && !window.confirm(`Confermi l’operazione su ${selected.email}? L’azione verrà registrata.`)) return;
    setBusy(true); setMessage("Registrazione dell’operazione…");
    try {
      const response = await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json", accept: "application/json" }, body: JSON.stringify({ customerId: selected.id, action, value, note }) });
      const body = await readApiResponse<{ message?: string }>(response);
      if (!response.ok) throw new Error(body.error || "Operazione non completata.");
      setMessage(body.message || "Operazione completata."); setNote("");
      await Promise.all([loadUsers(search, status), loadOverview()]);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Operazione non completata."); }
    finally { setBusy(false); }
  }

  async function readNotification(id?: string) {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", accept: "application/json" },
        body: JSON.stringify(id ? { action: "read", id } : { action: "read_all" }),
      });
      const body = await readApiResponse<{ message?: string }>(response);
      if (!response.ok) throw new Error(body.error || "Notifica non aggiornata.");
      await loadOverview();
      window.dispatchEvent(new Event("lorewise:notifications-updated"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Notifica non aggiornata.");
    } finally {
      setBusy(false);
    }
  }

  async function dismissNotification(id?: string) {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", accept: "application/json" },
        body: JSON.stringify(id ? { action: "dismiss", id } : { action: "dismiss_read" }),
      });
      const body = await readApiResponse<{ message?: string }>(response);
      if (!response.ok) throw new Error(body.error || "Notifica non rimossa.");
      await loadOverview();
      window.dispatchEvent(new Event("lorewise:notifications-updated"));
    } catch (error) { setMessage(error instanceof Error ? error.message : "Notifica non rimossa."); }
    finally { setBusy(false); }
  }

  async function openNotification(event: MouseEvent<HTMLAnchorElement>, id: string, targetUrl: string) {
    event.preventDefault();
    setBusy(true);
    try {
      const response = await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", accept: "application/json" },
        body: JSON.stringify({ action: "read", id }),
        keepalive: true,
      });
      const body = await readApiResponse<{ message?: string }>(response);
      if (!response.ok) throw new Error(body.error || "Notifica non aggiornata.");
      window.dispatchEvent(new Event("lorewise:notifications-updated"));
      window.location.assign(targetUrl);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Notifica non aggiornata.");
      setBusy(false);
    }
  }

  function searchUsers(event: FormEvent) { event.preventDefault(); setMessage("Ricerca nel registro…"); void loadUsers(search, status).then(() => setMessage("")).catch((error: Error) => setMessage(error.message)); }
  const selected = users.find((user) => user.id === selectedId) ?? null;
  const visibleNotifications = overview?.notifications.filter((item) => (notificationCategory === "all" || item.category === notificationCategory) && (notificationSeverity === "all" || item.severity === notificationSeverity)) ?? [];
  const analyticsPeak = Math.max(1, ...(overview?.analytics.daily.map((entry) => entry.views) ?? [0]));
  const number = new Intl.NumberFormat("it-IT");
  const visibleModules = famiglioCustodians ? [famiglioCustodiansModule, ...modules] : modules;

  if (!overview) return <section className="admin-center-state"><Image src="/brand/lorewise-universe-logo-concept-c.webp" alt="" width={1536} height={1024} unoptimized /><strong>Centro Admin LoreWise</strong><p>{message}</p><Link href="/account">Torna all’account</Link></section>;

  return <>
    <section className="admin-command-summary" aria-labelledby="admin-summary-title">
      <header><div><p className="eyebrow">Situazione operativa</p><h2 id="admin-summary-title">Tutto ciò che richiede attenzione.</h2></div><span>Sessione amministratore<strong>{overview.identity.email}</strong></span></header>
      <div className="admin-metrics">
        <article><small>Utenti attivi</small><strong>{overview.summary.activeUsers}</strong><span>su {overview.summary.users} profili</span></article>
        <article><small>Universe Pass</small><strong>{overview.summary.subscriptions}</strong><span>piani attivi</span></article>
        <article className={overview.summary.pendingOrders ? "needs-attention" : ""}><small>Ordini</small><strong>{overview.summary.pendingOrders}</strong><span>da verificare</span></article>
        <article className={overview.summary.commissions ? "needs-attention" : ""}><small>Commissioni</small><strong>{overview.summary.commissions}</strong><span>aperte</span></article>
        <article className={overview.summary.reports ? "needs-attention" : ""}><small>Community</small><strong>{overview.summary.reports}</strong><span>segnalazioni</span></article>
        <article className={overview.summary.support ? "needs-attention" : ""}><small>Assistenza</small><strong>{overview.summary.support}</strong><span>richieste</span></article>
        <article className={overview.summary.pendingEmails ? "needs-attention" : ""}><small>Email</small><strong>{overview.summary.pendingEmails}</strong><span>in coda o da riprovare</span></article>
      </div>
    </section>

    {famiglioCustodians ? <section id="admin-famiglio-custodians" className="admin-famiglio-custodians" aria-labelledby="admin-famiglio-custodians-title">
      <header><div><p className="eyebrow">Nexus Pet · archivio proprietario</p><h2 id="admin-famiglio-custodians-title">Custodi dei Famigli.</h2><p>Riepilogo privato degli account LoreWise che hanno completato almeno una schiusa e sincronizzato una Casa.</p></div><div className="admin-famiglio-totals"><span><strong>{number.format(famiglioCustodians.totalCustodians)}</strong>Custodi</span><span><strong>{number.format(famiglioCustodians.totalFamiliars)}</strong>Famigli</span></div></header>
      {famiglioCustodians.custodians.length ? <div className="admin-famiglio-table" role="region" aria-label="Elenco privato dei Custodi" tabIndex={0}><table><thead><tr><th>Custode</th><th>Email</th><th>Famigli</th><th>Ultima sincronizzazione</th><th>Stato</th></tr></thead><tbody>{famiglioCustodians.custodians.map((custodian) => <tr key={custodian.customerId}><td><strong>{custodian.displayName || "Profilo LoreWise"}</strong><small>{custodian.familiars.length} {custodian.familiars.length === 1 ? "Casa attiva" : "Case attive"}</small></td><td><a href={`mailto:${custodian.email}`}>{custodian.email}</a></td><td><ul>{custodian.familiars.map((familiar, index) => <li key={`${familiar.speciesId}-${index}`}><strong>{familiar.familiarName}</strong><span>{familiar.speciesName}</span></li>)}</ul></td><td><time dateTime={custodian.updatedAt}>{date(custodian.updatedAt)}</time></td><td><span className={`admin-famiglio-status is-${custodian.accountStatus}`}>{custodian.accountStatus}</span></td></tr>)}</tbody></table></div> : <p className="admin-famiglio-empty">Nessun account ha ancora sincronizzato un Famiglio schiuso.</p>}
      <p className="admin-famiglio-privacy">Visibile esclusivamente all’account proprietario. I salvataggi anonimi presenti soltanto sul dispositivo non contengono un’email e non compaiono qui.</p>
    </section> : null}

    <section id="admin-analytics" className="admin-analytics" aria-labelledby="admin-analytics-title">
      <header><div><p className="eyebrow">Statistiche del dominio pubblico</p><h2 id="admin-analytics-title">Quanto viene esplorato LoreWise.</h2><p>Rilevazione proprietaria attiva soltanto su <strong>{overview.analytics.configuredHost}</strong>. Non vengono salvati IP, email, cookie pubblicitari o cronologia personale.</p></div><span>Ultimo aggiornamento<strong>adesso</strong></span></header>
      <div className="admin-analytics-totals">
        <article><small>TWR · Landing</small><strong>{number.format(overview.analytics.twrFunnel.landingViews30Days)}</strong><span>sessioni · 30 giorni</span></article>
        <article><small>TWR · Click Gioca</small><strong>{number.format(overview.analytics.twrFunnel.playClicks30Days)}</strong><span>{overview.analytics.twrFunnel.landingToPlayPercent}% dalla landing</span></article>
        <article><small>Oggi</small><strong>{number.format(overview.analytics.totals.today)}</strong><span>visualizzazioni</span></article>
        <article><small>Ultimi 7 giorni</small><strong>{number.format(overview.analytics.totals.last7Days)}</strong><span>visualizzazioni</span></article>
        <article><small>Ultimi 30 giorni</small><strong>{number.format(overview.analytics.totals.last30Days)}</strong><span>visualizzazioni</span></article>
        <article><small>Sessioni tecniche · 30 giorni</small><strong>{number.format(overview.analytics.totals.sessions30Days)}</strong><span>non equivalgono a persone uniche</span></article>
        <article><small>Periodo conservato</small><strong>{number.format(overview.analytics.totals.allTime)}</strong><span>ultimi 90 giorni</span></article>
      </div>
      <div className="admin-analytics-layout">
        <article className="admin-analytics-chart"><header><strong>Andamento degli ultimi 14 giorni</strong><small>Visite alle pagine pubbliche</small></header>{overview.analytics.daily.length ? <ol>{overview.analytics.daily.map((entry) => <li key={entry.day}><span>{new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "short" }).format(new Date(`${entry.day}T12:00:00Z`))}</span><div><i style={{ height: `${Math.max(6, Math.round(entry.views / analyticsPeak * 100))}%` }} /></div><strong>{number.format(entry.views)}</strong></li>)}</ol> : <p>La raccolta inizierà dopo la pubblicazione sul dominio online.</p>}</article>
        <article className="admin-analytics-ranking"><header><strong>Pagine più viste</strong><small>Ultimi 30 giorni</small></header>{overview.analytics.topPages.length ? <ol>{overview.analytics.topPages.map((entry) => <li key={entry.path}><code>{entry.path}</code><span>{number.format(entry.views)} visite</span><small>{number.format(entry.sessions)} sessioni</small></li>)}</ol> : <p>Nessuna visita pubblica ancora registrata.</p>}</article>
        <article className="admin-analytics-referrers"><header><strong>Provenienza</strong><small>Solo dominio referente, mai URL completi</small></header>{overview.analytics.referrers.length ? <ol>{overview.analytics.referrers.map((entry) => <li key={entry.host}><span>{entry.host}</span><strong>{number.format(entry.views)}</strong></li>)}</ol> : <p>Nessuna provenienza ancora registrata.</p>}</article>
      </div>
      <p className="admin-analytics-note">Una “visualizzazione” corrisponde all’apertura di una pagina pubblica. Le sessioni sono identificatori casuali temporanei, rigenerati al nuovo caricamento e trasformati in hash giornalieri: servono a leggere l’andamento, non a profilare i visitatori.</p>
    </section>

    <section id="admin-notifications" className="admin-notification-center" aria-labelledby="admin-notifications-title">
      <header><div><p className="eyebrow">Centro notifiche</p><h2 id="admin-notifications-title">Non devi scoprirlo per caso.</h2><p>Nuove iscrizioni, acquisti, preventivi, rimborsi, assistenza e controlli urgenti confluiscono qui automaticamente.</p></div><strong>{overview.summary.unreadNotifications}<span>da leggere</span></strong></header>
      <div className="admin-notification-toolbar"><div><label>Tipo<select value={notificationCategory} onChange={(event) => setNotificationCategory(event.target.value)}><option value="all">Tutti</option>{Object.entries(notificationLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label>Priorità<select value={notificationSeverity} onChange={(event) => setNotificationSeverity(event.target.value)}><option value="all">Tutte</option><option value="critical">Critica</option><option value="high">Alta</option><option value="medium">Media</option><option value="info">Informativa</option></select></label></div><div><button type="button" disabled={busy} onClick={() => void loadOverview().catch((error: Error) => setMessage(error.message))}>Aggiorna</button><button type="button" disabled={busy || !overview.summary.unreadNotifications} onClick={() => void readNotification()}>Segna tutte come lette</button><button type="button" disabled={busy || !visibleNotifications.some((item) => item.readAt)} onClick={() => void dismissNotification()}>Rimuovi quelle lette</button></div></div>
      {visibleNotifications.length ? <ol>{visibleNotifications.map((item) => <li key={item.id} className={`${item.readAt ? "is-read" : "is-unread"} severity-${item.severity}`}><span className="admin-notification-signal" aria-hidden="true" /><div><small>{notificationLabels[item.category] || item.category} · {date(item.createdAt)}</small><strong>{item.title}</strong><p>{item.message}</p>{item.referenceCode ? <code>{item.referenceCode}</code> : null}</div><div><Link href={item.targetUrl} onClick={(event) => item.readAt ? undefined : void openNotification(event, item.id, item.targetUrl)}>Apri gestione →</Link>{!item.readAt ? <button type="button" disabled={busy} onClick={() => void readNotification(item.id)}>Segna letta</button> : <span>Letta</span>}<button type="button" disabled={busy} onClick={() => void dismissNotification(item.id)}>Rimuovi</button></div></li>)}</ol> : <p className="admin-notification-empty">Nessuna notifica corrisponde ai filtri selezionati.</p>}
    </section>

    <section className="admin-module-grid" aria-labelledby="admin-modules-title"><header><p className="eyebrow">Aree di gestione</p><h2 id="admin-modules-title">Un solo centro, {visibleModules.length} archivi.</h2></header><div>{visibleModules.map((module) => <Link className={`admin-module tone-${module.tone}`} href={module.href} key={module.code}><span>{module.code}</span><Image src={module.icon} alt="" width={1224} height={1285} unoptimized /><div><strong>{module.title}</strong><p>{module.description}</p><b>Apri la gestione →</b></div></Link>)}</div></section>

    <section id="admin-users" className="admin-users" aria-labelledby="admin-users-title">
      <header><div><p className="eyebrow">LoreWise ID</p><h2 id="admin-users-title">Gestione utenti.</h2><p>Ruoli, stato, piano, crediti e diritti vengono letti dallo stesso profilo. Ogni modifica amministrativa resta nel registro attività.</p></div><strong>{users.length}<span>profili visualizzati</span></strong></header>
      <form className="admin-user-search" onSubmit={searchUsers}><label><span>Cerca</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Email, nome o LoreWise ID" /></label><label><span>Stato</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Tutti</option><option value="active">Attivi</option><option value="blocked">Sospesi</option><option value="deletion_requested">Cancellazione richiesta</option></select></label><button type="submit" disabled={busy}>Cerca nel registro</button></form>
      <div className="admin-user-workspace">
        <div className="admin-user-list" role="list" aria-label="Utenti LoreWise">{users.map((user) => <button type="button" role="listitem" className={user.id === selectedId ? "is-selected" : ""} onClick={() => { setSelectedId(user.id); setMessage(""); }} key={user.id}><span>{user.owner ? "Proprietario" : user.role}</span><strong>{user.displayName || user.email}</strong><small>{user.email} · {user.status}</small><b>{user.planCode ? user.planCode.replace("LW-PASS-", "") : "Nessun piano"}</b></button>)}{!users.length ? <p>Nessun profilo corrisponde ai filtri.</p> : null}</div>
        <article className="admin-user-detail">{selected ? <><header><div><small>{selected.id}</small><h3>{selected.displayName || "Profilo LoreWise"}</h3><a href={`mailto:${selected.email}`}>{selected.email}</a></div><span>{selected.owner ? "Account proprietario" : selected.status}</span></header>
          <dl><div><dt>Ruolo</dt><dd>{selected.role}</dd></div><div><dt>Piano</dt><dd>{selected.planCode ? `${selected.planCode} · ${selected.planStatus}` : "Nessuno"}</dd></div><div><dt>Crediti Arte</dt><dd>{selected.credits}</dd></div><div><dt>Ordini</dt><dd>{selected.orders}</dd></div><div><dt>Libreria</dt><dd>{selected.libraryItems}</dd></div><div><dt>Membro dal</dt><dd>{date(selected.createdAt)}</dd></div></dl>
          <label className="admin-action-note"><span>Nota amministrativa</span><textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} placeholder="Motivo dell’intervento o riferimento interno" /></label>
          <div className="admin-user-actions"><section><strong>Stato account</strong><button type="button" disabled={busy || selected.owner} onClick={() => void updateUser("set_status", selected.status === "blocked" ? "active" : "blocked")}>{selected.status === "blocked" ? "Riattiva account" : "Sospendi account"}</button></section><section><strong>Ruolo operativo</strong><select value={selected.role} disabled={busy || selected.owner} onChange={(event) => void updateUser("set_role", event.target.value)}><option value="member">Utente</option><option value="moderator">Moderatore</option><option value="admin">Amministratore</option></select></section><section><strong>Credito manuale</strong><div><button type="button" disabled={busy} onClick={() => void updateUser("grant_art_credit", "1")}>+1 credito Arte</button><button type="button" disabled={busy} onClick={() => void updateUser("grant_art_credit", "3")}>+3 crediti Arte</button></div></section></div>
        </> : <p>Seleziona un profilo per aprire la scheda amministrativa.</p>}</article>
      </div>{message ? <p className="admin-center-message" role="status">{message}</p> : null}
    </section>

    <section className="admin-audit" aria-labelledby="admin-audit-title"><header><p className="eyebrow">Registro protetto</p><h2 id="admin-audit-title">Ultime attività amministrative.</h2></header>{overview.recentActions.length ? <ol>{overview.recentActions.map((entry, index) => <li key={`${entry.createdAt}-${index}`}><time>{date(entry.createdAt)}</time><strong>{actionLabels[entry.action] || entry.action}</strong><span>{entry.targetEmail || "Sistema LoreWise"}</span><p>{entry.note || "Nessuna nota aggiuntiva."}</p></li>)}</ol> : <p className="admin-audit-empty">Nessuna modifica amministrativa ancora registrata.</p>}</section>
  </>;
}
