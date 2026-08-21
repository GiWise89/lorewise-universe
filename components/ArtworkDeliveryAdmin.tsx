"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type Delivery = { artworkCode: string; filename: string; size: number; sha256: string; status: string; approvedAt: string | null; updatedAt: string };
type AutomaticDelivery = { filename: string; size: number; sha256: string; status: "ready" | "cataloged" };
type ArtworkOption = { code: string; title: string; image: string; priceLabel: string | null; tierLabel: string | null; automaticDelivery: AutomaticDelivery | null };
type ArchivePayload = { artworks?: ArtworkOption[]; deliveries?: Delivery[]; error?: string };

function sizeLabel(bytes: number) {
  return new Intl.NumberFormat("it-IT", { maximumFractionDigits: 2 }).format(bytes / 1024 / 1024) + " MB";
}

async function apiPayload(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) return await response.json() as ArchivePayload & { message?: string };
  const text = await response.text();
  if (response.status === 413) throw new Error("Il server ha rifiutato il pacchetto perché supera il limite di caricamento configurato.");
  throw new Error(text.trim() || `Risposta del server non valida (${response.status}).`);
}

export function ArtworkDeliveryAdmin() {
  const [artworks, setArtworks] = useState<ArtworkOption[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [artworkCode, setArtworkCode] = useState("LW-ART-003");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("Caricamento delle opere vendibili…");
  const [busy, setBusy] = useState(false);
  const [qualityChecks, setQualityChecks] = useState({ masterIdentical: false, manifestVerified: false, certificateSeparate: false });
  const selected = useMemo(() => artworks.find((item) => item.code === artworkCode) ?? artworks[0] ?? null, [artworks, artworkCode]);
  const currentDelivery = deliveries.find((item) => item.artworkCode === selected?.code);
  const automaticDelivery = selected?.automaticDelivery ?? null;
  const deliveryApproved = automaticDelivery?.status === "ready" || currentDelivery?.status === "approved";

  async function loadArchive() {
    const response = await fetch("/api/artwork-deliveries/admin", { headers: { accept: "application/json" } });
    const body = await apiPayload(response);
    if (!response.ok) throw new Error(body.error || "Archivio non disponibile.");
    setArtworks(body.artworks ?? []);
    setDeliveries(body.deliveries ?? []);
  }

  useEffect(() => {
    let active = true;
    void fetch("/api/artwork-deliveries/admin", { headers: { accept: "application/json" } })
      .then(async (response) => {
        const body = await apiPayload(response);
        if (!response.ok) throw new Error(body.error || "Archivio non disponibile.");
        if (!active) return;
        setArtworks(body.artworks ?? []);
        setDeliveries(body.deliveries ?? []);
        setMessage("");
      })
      .catch((error: Error) => active && setMessage(error.message));
    return () => { active = false; };
  }, []);

  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (!selected || !file) return setMessage("Scegli prima l’opera e il suo pacchetto ZIP.");
    setBusy(true);
    setMessage("Sto controllando il pacchetto e lo sto trasferendo nell’archivio privato…");
    const formData = new FormData();
    formData.set("artworkCode", selected.code);
    formData.set("package", file);
    try {
      const response = await fetch("/api/artwork-deliveries/admin", { method: "POST", body: formData });
      const body = await apiPayload(response);
      if (!response.ok) throw new Error(body.error || "Attivazione non completata.");
      setFile(null);
      setQualityChecks({ masterIdentical: false, manifestVerified: false, certificateSeparate: false });
      (formElement.elements.namedItem("package") as HTMLInputElement).value = "";
      await loadArchive();
      setMessage(`${body.message} Non sarà venduto né scaricabile finché non verrà approvato.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Attivazione non completata.");
    } finally { setBusy(false); }
  }

  async function approveDelivery() {
    if (!selected || !currentDelivery || currentDelivery.status !== "qa_pending") return;
    setBusy(true);
    setMessage("Verifica finale del file privato e della sua impronta SHA-256…");
    try {
      const response = await fetch("/api/artwork-deliveries/admin", {
        method: "PATCH",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ artworkCode: selected.code, sha256: currentDelivery.sha256, ...qualityChecks }),
      });
      const body = await apiPayload(response);
      if (!response.ok) throw new Error(body.error || "Approvazione non completata.");
      await loadArchive();
      setMessage(body.message || "Pacchetto approvato.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Approvazione non completata.");
    } finally { setBusy(false); }
  }

  return <>
    <ol className="delivery-admin-guide" aria-label="Come funziona l’Archivio vendite Arte">
      <li><span>01</span><div><strong>Pacchetti già preparati</strong><p>Tutte le opere vendibili sono collegate al proprio ZIP verificato.</p></div></li>
      <li><span>02</span><div><strong>Archivio privato</strong><p>I file vengono sincronizzati insieme, senza caricarli uno alla volta.</p></div></li>
      <li><span>03</span><div><strong>Consegna automatica</strong><p>Dopo acquisto o credito, il cliente trova subito il download nel proprio account.</p></div></li>
    </ol>

    <section className="delivery-admin-workspace">
      <form onSubmit={upload}>
        <p className="eyebrow">Solo in caso di necessità</p><h2>Sostituzione manuale.</h2>
        <label><span>1. Opera da collegare</span><select value={selected?.code ?? artworkCode} onChange={(event) => { setArtworkCode(event.target.value); setFile(null); setQualityChecks({ masterIdentical: false, manifestVerified: false, certificateSeparate: false }); }} required>{artworks.map((artwork) => <option key={artwork.code} value={artwork.code}>{artwork.code} · {artwork.title}</option>)}</select></label>
        <label><span>2. Pacchetto che riceverà il cliente</span><input name="package" type="file" accept=".zip,application/zip" onChange={(event) => setFile(event.target.files?.[0] ?? null)} required /></label>
        {file ? <div className="delivery-selected-file"><strong>{file.name}</strong><small>{sizeLabel(file.size)} · rimarrà nell’archivio privato</small></div> : <p className="delivery-file-help">Non serve per il lavoro normale: usalo soltanto per sostituire temporaneamente un pacchetto automatico.</p>}
        <button type="submit" disabled={busy || !selected || !file}>{busy ? "Protezione in corso…" : currentDelivery ? "Sostituisci il file da verificare" : "Invia al controllo qualità"}</button>
        <p className="delivery-admin-feedback" aria-live="polite">{message}</p>
      </form>

      <div className="delivery-customer-preview">
        <p className="eyebrow">Controllo prima dell’attivazione</p><h2>Cosa riceverà.</h2>
        {selected ? <div className="delivery-artwork-summary"><Image src={selected.image} alt={`Anteprima protetta di ${selected.title}`} width={900} height={1200} unoptimized /><div><small>{selected.code}</small><h3>{selected.title}</h3><p>{selected.tierLabel} · {selected.priceLabel}</p><strong>{automaticDelivery?.status === "ready" ? "Pacchetto automatico verificato" : automaticDelivery ? "Pacchetto automatico catalogato · da sincronizzare" : deliveryApproved ? "Pacchetto manuale approvato" : currentDelivery ? "In quarantena · controllo necessario" : "Pacchetto non disponibile"}</strong></div></div> : <p>Caricamento dell’elenco opere…</p>}
        <ul><li>File artistici previsti dalla fascia</li><li>Licenza personale e manifest SHA-256</li><li>Massimo 3 download per licenza</li><li>Nessun indirizzo pubblico permanente</li></ul>
        {currentDelivery?.status === "qa_pending" ? <section className="delivery-quality-gate" aria-labelledby="delivery-quality-title">
          <p className="eyebrow">Firma amministrativa</p><h3 id="delivery-quality-title">Approva soltanto dopo i tre controlli.</h3>
          <code>{currentDelivery.sha256}</code>
          <label><input type="checkbox" checked={qualityChecks.masterIdentical} onChange={(event) => setQualityChecks((current) => ({ ...current, masterIdentical: event.target.checked }))} /><span>Il PNG master è identico byte per byte all’originale.</span></label>
          <label><input type="checkbox" checked={qualityChecks.manifestVerified} onChange={(event) => setQualityChecks((current) => ({ ...current, manifestVerified: event.target.checked }))} /><span>Manifesto, contenuti e SHA-256 del pacchetto sono stati verificati.</span></label>
          <label><input type="checkbox" checked={qualityChecks.certificateSeparate} onChange={(event) => setQualityChecks((current) => ({ ...current, certificateSeparate: event.target.checked }))} /><span>Il certificato nominativo è separato e non contiene dati precompilati nello ZIP.</span></label>
          <button type="button" disabled={busy || !Object.values(qualityChecks).every(Boolean)} onClick={approveDelivery}>Approva il pacchetto verificato</button>
        </section> : deliveryApproved ? <p className="delivery-approved-note">Approvato il {currentDelivery!.approvedAt ? new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(`${currentDelivery!.approvedAt.replace(" ", "T")}Z`)) : "—"}. Il file può essere assegnato soltanto tramite una licenza valida.</p> : null}
      </div>
    </section>

    <section className="delivery-admin-register"><header><p className="eyebrow">Situazione attuale</p><h2>Pacchetti automatici.</h2><p>Ogni ZIP è associato al codice dell’opera e controllato tramite dimensione e impronta SHA-256 prima della consegna.</p></header>{artworks.length ? <ol>{artworks.map((artwork) => { const item = artwork.automaticDelivery; return <li key={artwork.code}><strong>{artwork.title}</strong><span>{artwork.code}{item ? ` · ${sizeLabel(item.size)}` : ""}</span><small>{item ? `Controllo SHA-256: ${item.sha256.slice(0, 12)}…` : "Pacchetto non catalogato"}</small><em className={item?.status === "ready" ? "is-approved" : "is-pending"}>{item?.status === "ready" ? "Automatico e pronto" : item ? "Da sincronizzare" : "Non disponibile"}</em></li>; })}</ol> : <p className="delivery-register-empty">Caricamento del catalogo automatico…</p>}</section>
  </>;
}
