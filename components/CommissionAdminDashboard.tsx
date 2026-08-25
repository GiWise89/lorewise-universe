"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { commissionDiscountForSubmission, getCommissionPromotionForSubmission } from "@/lib/commissionPromotion";

type RequestFile = { id: string; originalName: string; contentType: string; size: number };
type CommissionRequest = {
  id: string;
  referenceCode: string;
  name: string;
  email: string;
  category: string;
  packageName: string;
  intendedUse: string;
  idealDeadline: string | null;
  artworkReference: string | null;
  brief: string;
  includesMinor: boolean;
  guardianName: string | null;
  guardianConsent: boolean;
  portfolioConsent: boolean;
  privacyConsent: boolean;
  contentPolicyConsent: boolean;
  status: string;
  customerId: string | null;
  quoteBaseCents: number | null;
  quoteDiscountCents: number | null;
  quoteCents: number | null;
  depositCents: number | null;
  membershipPlanCode: string | null;
  membershipDiscountPercent: number;
  benefitSnapshotAt: string | null;
  activeMembership: { code: string | null; name: string; active: boolean; commissionDiscountPercent: number; currentPeriodEnd: string | null };
  adminNotes: string;
  launchSlotReserved: boolean;
  clientResponse: string | null;
  clientMessage: string | null;
  clientRespondedAt: string | null;
  quoteTermsAcceptedAt: string | null;
  quoteTermsVersion: string | null;
  createdAt: string;
  updatedAt: string;
  files: RequestFile[];
};

type DashboardData = {
  requests: CommissionRequest[];
  launchSlots: { total: number; reserved: number };
  admin: { displayName: string; email: string; localPreview: boolean };
};

const statusOptions = [
  ["new", "Nuova"],
  ["reviewing", "In valutazione"],
  ["quoted", "Preventivo inviato"],
  ["accepted", "Accettata"],
  ["in_progress", "In lavorazione"],
  ["awaiting_balance", "Saldo richiesto"],
  ["balance_paid", "Saldo pagato"],
  ["payment_issue", "Verifica pagamento"],
  ["completed", "Completata"],
  ["declined", "Non accettata"],
  ["cancelled", "Annullata"],
] as const;

const statusLabels = Object.fromEntries(statusOptions);

function displayDate(value: string | null) {
  if (!value) return "Non indicata";
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value;
  const normalized = value.includes("T") ? value : `${value.replace(" ", "T")}Z`;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime())
    ? value
    : new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(parsed);
}

function fileSize(size: number) {
  return size >= 1024 * 1024 ? `${(size / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(size / 1024)} KB`;
}

export function CommissionAdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setMessage("");
    const params = new URLSearchParams({ status: statusFilter, search });
    try {
      const response = await fetch(`/api/commission-admin?${params}`, { cache: "no-store" });
      const result = await response.json() as DashboardData & { error?: string };
      if (!response.ok) throw new Error(result.error || "Impossibile caricare le richieste.");
      setData(result);
      setSelectedId((current) => result.requests.some((item) => item.id === current) ? current : result.requests[0]?.id ?? "");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Errore durante il caricamento.");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    // Il caricamento iniziale sincronizza la vista con l'archivio D1.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadRequests();
  }, [loadRequests]);

  const selected = useMemo(() => data?.requests.find((item) => item.id === selectedId) ?? null, [data, selectedId]);
  const visibleRequests = useMemo(() => {
    const requests = [...(data?.requests ?? [])];
    if (sortOrder === "oldest") return requests.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    if (sortOrder === "deadline") return requests.sort((a, b) => (a.idealDeadline || "99/99/9999").split("/").reverse().join("").localeCompare((b.idealDeadline || "99/99/9999").split("/").reverse().join("")));
    if (sortOrder === "status") return requests.sort((a, b) => a.status.localeCompare(b.status));
    return requests.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [data?.requests, sortOrder]);
  const statusCounts = useMemo(() => Object.fromEntries(statusOptions.map(([status]) => [status, data?.requests.filter((item) => item.status === status).length ?? 0])), [data?.requests]);
  const remainingSlots = data ? Math.max(0, data.launchSlots.total - data.launchSlots.reserved) : 10;
  const quoteDiscountPercent = selected?.benefitSnapshotAt ? selected.membershipDiscountPercent : selected ? commissionDiscountForSubmission({
    planCode: selected.activeMembership.code,
    ordinaryDiscountPercent: selected.activeMembership.commissionDiscountPercent,
    submittedAt: selected.createdAt,
    packageName: selected.packageName,
  }) : 0;
  const selectedPromotion = selected ? getCommissionPromotionForSubmission(selected.packageName, selected.createdAt) : null;
  const quoteBenefitName = selectedPromotion ? selectedPromotion.label
    : selected?.benefitSnapshotAt
    ? selected.membershipPlanCode === "LW-PASS-COLLECTOR" ? "Collector" : selected.membershipPlanCode === "LW-PASS-SUPPORTER" ? "Supporter" : "Visitatore"
    : selected?.activeMembership.name ?? "Visitatore";
  const quotePreview = selected?.quoteBaseCents == null ? null : {
    baseCents: selected.quoteBaseCents,
    discountPercent: quoteDiscountPercent,
    discountCents: Math.round(selected.quoteBaseCents * quoteDiscountPercent / 100),
    finalCents: selected.quoteBaseCents - Math.round(selected.quoteBaseCents * quoteDiscountPercent / 100),
  };
  const pricingLocked = Boolean(selected?.quoteTermsAcceptedAt) || ["accepted", "in_progress", "awaiting_balance", "balance_paid", "completed"].includes(selected?.status ?? "");

  function updateSelected(patch: Partial<CommissionRequest>) {
    if (!selected) return;
    setData((current) => current ? {
      ...current,
      requests: current.requests.map((item) => item.id === selected.id ? { ...item, ...patch } : item),
    } : current);
  }

  async function saveSelected() {
    if (!selected) return;
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/commission-admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selected.id,
          status: selected.status,
          quoteBaseCents: selected.quoteBaseCents,
          depositCents: selected.depositCents,
          adminNotes: selected.adminNotes,
          launchSlotReserved: selected.launchSlotReserved,
        }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Salvataggio non riuscito.");
      setMessage("Modifiche salvate correttamente.");
      await loadRequests();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Salvataggio non riuscito.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteSelected() {
    if (!selected || !window.confirm(`Eliminare definitivamente ${selected.referenceCode} e tutti i suoi allegati?`)) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/commission-admin?id=${encodeURIComponent(selected.id)}`, { method: "DELETE" });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Eliminazione non riuscita.");
      setSelectedId("");
      setMessage("Richiesta e allegati eliminati.");
      await loadRequests();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Eliminazione non riuscita.");
    } finally {
      setSaving(false);
    }
  }

  function exportCsv() {
    if (!visibleRequests.length) return;
    const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const rows = [["Codice", "Cliente", "Email", "LoreWise ID", "Piano", "Sconto %", "Categoria", "Pacchetto", "Stato", "Prezzo base EUR", "Sconto EUR", "Totale EUR", "Data ideale", "Ricevuta", "Risposta cliente"]];
    visibleRequests.forEach((item) => rows.push([item.referenceCode, item.name, item.email, item.customerId ?? "", item.membershipPlanCode ?? "Visitatore", String(item.membershipDiscountPercent), item.category, item.packageName, statusLabels[item.status] ?? item.status, item.quoteBaseCents == null ? "" : String(item.quoteBaseCents / 100), item.quoteDiscountCents == null ? "" : String(item.quoteDiscountCents / 100), item.quoteCents == null ? "" : String(item.quoteCents / 100), item.idealDeadline ?? "", item.createdAt, item.clientResponse ?? ""]));
    const blob = new Blob(["\uFEFF" + rows.map((row) => row.map(escape).join(";")).join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `giwise-commissioni-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const emailSubject = selected ? encodeURIComponent(`GiWise Studio · ${selected.referenceCode}`) : "";
  const quoteText = selected?.quoteCents != null ? `Il preventivo finale è di ${(selected.quoteCents / 100).toLocaleString("it-IT", { style: "currency", currency: "EUR" })}${selected.membershipDiscountPercent ? `, con lo sconto ${selectedPromotion?.label ?? "Universe Pass"} del ${selected.membershipDiscountPercent}% già applicato` : ""}.` : "";
  const emailBody = selected ? encodeURIComponent(`Ciao ${selected.name},\n\nti contatto in merito alla tua richiesta ${selected.referenceCode}.\n${quoteText}\n\nGiWise Studio`) : "";

  return (
    <div className="commission-admin-workspace">
      <section className="commission-admin-summary" aria-label="Riepilogo commissioni">
        <div><small>Richieste visibili</small><strong>{data?.requests.length ?? 0}</strong></div>
        <div><small>Posti lancio prenotati</small><strong>{data?.launchSlots.reserved ?? 0}<span>/10</span></strong></div>
        <div><small>Posti ancora disponibili</small><strong>{remainingSlots}</strong></div>
        <div className="commission-admin-identity"><small>Sessione</small><strong>{data?.admin.localPreview ? "Anteprima locale protetta" : data?.admin.displayName ?? "GiWise Studio"}</strong></div>
      </section>

      <section className="commission-admin-controls" aria-label="Ricerca e filtri">
        <label><span>Cerca</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Codice, cliente o email" /></label>
        <label><span>Stato</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">Tutte le richieste</option>{statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label><span>Ordina</span><select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}><option value="newest">Più recenti</option><option value="oldest">Meno recenti</option><option value="deadline">Data ideale</option><option value="status">Stato</option></select></label>
        <button className="button button-ghost" type="button" onClick={() => void loadRequests()}>Aggiorna archivio</button>
        <button className="button button-ghost" type="button" disabled={!visibleRequests.length} onClick={exportCsv}>Esporta CSV</button>
      </section>

      <section className="commission-admin-status-counts" aria-label="Richieste per stato">{statusOptions.map(([status, label]) => <span key={status}><b>{statusCounts[status]}</b>{label}</span>)}</section>

      {message && <p className="commission-admin-message" role="status">{message}</p>}

      <div className="commission-admin-grid">
        <aside className="commission-admin-list" aria-label="Elenco richieste">
          <header><small>Archivio riservato</small><h2>Richieste ricevute</h2></header>
          {loading && <p className="commission-admin-empty">Caricamento in corso…</p>}
          {!loading && !data?.requests.length && <p className="commission-admin-empty">Nessuna richiesta corrisponde ai filtri selezionati.</p>}
          {visibleRequests.map((item) => (
            <button key={item.id} type="button" className={item.id === selectedId ? "is-selected" : ""} onClick={() => { setSelectedId(item.id); setMessage(""); }}>
              <span><b>{statusLabels[item.status] ?? item.status}</b><time>{displayDate(item.createdAt)}</time></span>
              {item.clientResponse && <i>Risposta cliente</i>}
              <strong>{item.name}</strong>
              <small>{item.referenceCode}</small>
              {item.activeMembership.active ? <i className="commission-admin-pass">{item.activeMembership.name} · −{item.activeMembership.commissionDiscountPercent}%</i> : <i className="commission-admin-pass is-visitor">Visitatore · nessuno sconto</i>}
              <em>{item.category} · {item.packageName}</em>
            </button>
          ))}
        </aside>

        <article className="commission-admin-dossier" aria-live="polite">
          {!selected && <div className="commission-admin-placeholder"><small>GiWise Commissioni</small><h2>Seleziona una richiesta.</h2><p>Qui appariranno brief, riferimenti, consenso, preventivo e stato del lavoro.</p></div>}
          {selected && <>
            <header>
              <div><small>{selected.referenceCode}</small><h2>{selected.name}</h2><a href={`mailto:${selected.email}`}>{selected.email}</a></div>
              <span data-status={selected.status}>{statusLabels[selected.status] ?? selected.status}</span>
            </header>

            <section className="commission-admin-facts" aria-label="Dati richiesta">
              <dl>
                <div><dt>Ricevuta</dt><dd>{displayDate(selected.createdAt)}</dd></div>
                <div><dt>Categoria</dt><dd>{selected.category}</dd></div>
                <div><dt>Pacchetto</dt><dd>{selected.packageName}</dd></div>
                <div><dt>Utilizzo</dt><dd>{selected.intendedUse}</dd></div>
                <div><dt>Data ideale</dt><dd>{displayDate(selected.idealDeadline)}</dd></div>
                <div><dt>Opera citata</dt><dd>{selected.artworkReference || "Nessuna"}</dd></div>
                <div><dt>LoreWise ID</dt><dd>{selected.customerId ? "Account collegato" : "Richiesta precedente da collegare"}</dd></div>
                <div><dt>Universe Pass</dt><dd>{selected.activeMembership.active ? `${selected.activeMembership.name} · sconto automatico ${selected.activeMembership.commissionDiscountPercent}%` : "Visitatore · nessuno sconto"}</dd></div>
              </dl>
            </section>

            <section className="commission-admin-brief"><small>Descrizione del cliente</small><p>{selected.brief}</p></section>

            {selected.includesMinor && <section className="commission-admin-warning"><strong>Richiesta con minore</strong><p>Tutore indicato: {selected.guardianName || "non indicato"}. Consenso dichiarato: {selected.guardianConsent ? "sì" : "no"}.</p></section>}

            <section className="commission-admin-consents">
              <small>Autorizzazioni</small>
              <p><b>{selected.portfolioConsent ? "Autorizzato" : "Non autorizzato"}</b> per la futura esposizione nel portfolio.</p>
              <p><b>{selected.contentPolicyConsent ? "Accettata" : "Non registrata"}</b> politica dei contenuti · privacy {selected.privacyConsent ? "autorizzata" : "non registrata"}.</p>
              {selected.quoteTermsAcceptedAt && <p><b>Preventivo accettato</b> il {displayDate(selected.quoteTermsAcceptedAt)} · {selected.quoteTermsVersion ?? "versione non registrata"}.</p>}
            </section>

            {selected.clientResponse && <section className="commission-admin-client-response">
              <small>Risposta del cliente</small>
              <strong>{selected.clientResponse === "accepted" ? "Preventivo accettato" : "Chiarimento richiesto"}</strong>
              <time>{displayDate(selected.clientRespondedAt)}</time>
              {selected.clientMessage && <p>{selected.clientMessage}</p>}
            </section>}

            <section className="commission-admin-files">
              <small>Allegati del cliente · {selected.files.length}</small>
              {selected.files.length === 0 ? <p>Nessun riferimento allegato.</p> : <div>{selected.files.map((file) => <a key={file.id} href={`/api/commission-admin/file?id=${encodeURIComponent(file.id)}`} target="_blank" rel="noopener noreferrer"><strong>{file.originalName}</strong><span>{file.contentType.replace("image/", "").toUpperCase()} · {fileSize(file.size)}</span></a>)}</div>}
            </section>

            <section className="commission-admin-editor" aria-label="Gestione richiesta">
              <div className="commission-admin-editor-heading"><small>Gestione interna</small><h3>Stato e preventivo</h3></div>
              <label><span>Stato della richiesta</span><select value={selected.status} onChange={(event) => updateSelected({ status: event.target.value })}>{statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label><span>Prezzo iniziale in euro</span><input type="number" min="0" step="0.01" disabled={pricingLocked} value={selected.quoteBaseCents == null ? "" : selected.quoteBaseCents / 100} onChange={(event) => updateSelected({ quoteBaseCents: event.target.value === "" ? null : Math.round(Number(event.target.value) * 100) })} placeholder="es. 49,00" /></label>
              <label><span>Acconto concordato in euro</span><input type="number" min="0.01" step="0.01" disabled={pricingLocked} value={selected.depositCents == null ? "" : selected.depositCents / 100} onChange={(event) => updateSelected({ depositCents: event.target.value === "" ? null : Math.round(Number(event.target.value) * 100) })} placeholder="es. 24,50" /></label>
              {pricingLocked && <p className="field-wide commission-admin-pricing-lock" role="status">Preventivo accettato: prezzo, sconto e acconto sono protetti e non possono più essere modificati.</p>}
              <div className="commission-admin-benefit-preview field-wide">
                <span>Calcolo automatico Universe Pass</span>
                {quotePreview ? <dl>
                  <div><dt>Prezzo iniziale</dt><dd>{(quotePreview.baseCents / 100).toLocaleString("it-IT", { style: "currency", currency: "EUR" })}</dd></div>
                  <div><dt>{quoteBenefitName} · sconto {quotePreview.discountPercent}%</dt><dd>−{(quotePreview.discountCents / 100).toLocaleString("it-IT", { style: "currency", currency: "EUR" })}</dd></div>
                  <div><dt>Totale finale</dt><dd>{(quotePreview.finalCents / 100).toLocaleString("it-IT", { style: "currency", currency: "EUR" })}</dd></div>
                </dl> : <p>Inserisci il prezzo iniziale: il server applicherà automaticamente il piano riconosciuto.</p>}
                <small>Al salvataggio il server ricontrolla l’abbonamento e registra il risultato definitivo.</small>
              </div>
              <label className="field-wide"><span>Note private GiWise Studio</span><textarea rows={5} maxLength={4000} value={selected.adminNotes} onChange={(event) => updateSelected({ adminNotes: event.target.value })} placeholder="Valutazione, modifiche richieste, accordi e prossime azioni…" /></label>
              <label className="commission-admin-slot field-wide"><input type="checkbox" checked={selected.launchSlotReserved} onChange={(event) => updateSelected({ launchSlotReserved: event.target.checked })} /><span><strong>Conta tra le 10 commissioni di lancio</strong><small>Attivalo solo quando l’incarico è realmente confermato.</small></span></label>
              <div className="commission-admin-actions field-wide">
                <button className="button button-primary" type="button" disabled={saving} onClick={() => void saveSelected()}>{saving ? "Salvataggio…" : "Salva modifiche"}</button>
                <a className="button button-ghost" href={`mailto:${selected.email}?subject=${emailSubject}&body=${emailBody}`}>Prepara email al cliente</a>
                <button className="commission-admin-delete" type="button" disabled={saving} onClick={() => void deleteSelected()}>Elimina dati e allegati</button>
              </div>
            </section>
          </>}
        </article>
      </div>
    </div>
  );
}
