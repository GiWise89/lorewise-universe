"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { getPromotionCommunicationPack, promotionCommunicationPacks } from "@/lib/promotionCommunications";

type Campaign = { id: string; code: string; subject: string; heading: string; body: string; actionLabel: string | null; actionUrl: string | null; status: string; recipientCount: number; sentCount: number; pendingCount: number; revokedCount: number; createdAt: string };
type Payload = { configured: boolean; audienceCount: number; consentEvents: number; adminEmail: string; campaigns: Campaign[]; error?: string };
const emptyDraft = { id: "", subject: "", heading: "", body: "", actionLabel: "", actionUrl: "" };

export function MarketingCampaignDashboard({ previewPackCode = "" }: { previewPackCode?: string }) {
  const previewPack = getPromotionCommunicationPack(previewPackCode);
  const [data, setData] = useState<Payload | null>(() => previewPack ? { configured: false, audienceCount: 0, consentEvents: 0, adminEmail: "anteprima@lorewise.local", campaigns: [] } : null);
  const [selectedPackCode, setSelectedPackCode] = useState(previewPack?.code ?? "");
  const [draft, setDraft] = useState(() => previewPack ? { id: "", ...previewPack.email, actionLabel: previewPack.email.actionLabel ?? "", actionUrl: previewPack.email.actionUrl ?? "" } : emptyDraft);
  const [message, setMessage] = useState("Apertura delle comunicazioni…");
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    if (previewPack) return;
    const response = await fetch("/api/admin/marketing-campaigns", { cache: "no-store" });
    const payload = await response.json() as Payload;
    if (!response.ok) throw new Error(payload.error || "Comunicazioni non disponibili.");
    setData(payload); setMessage("");
  }, [previewPack]);
  useEffect(() => { const timer = window.setTimeout(() => void load().catch((error: Error) => setMessage(error.message)), 0); return () => window.clearTimeout(timer); }, [load]);

  async function act(action: string, id?: string) {
    if ((action === "queue" || action === "send_pending") && !window.confirm(action === "queue" ? "Confermi il pubblico della campagna? Dopo questo passaggio la bozza non sarà più modificabile." : "Confermi l’invio ai destinatari ancora in attesa?")) return;
    setBusy(true); setMessage("Operazione in corso…");
    try {
      const payload = action === "save" ? { action, ...draft, id: draft.id || undefined } : { action, id };
      const response = await fetch("/api/admin/marketing-campaigns", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const body = await response.json() as { id?: string; message?: string; error?: string };
      if (!response.ok) throw new Error(body.error || "Operazione non riuscita.");
      setMessage(body.message || "Operazione completata.");
      if (action === "save") setDraft((current) => ({ ...current, id: body.id || current.id }));
      await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Operazione non riuscita."); }
    finally { setBusy(false); }
  }
  function edit(campaign: Campaign) { setDraft({ id: campaign.id, subject: campaign.subject, heading: campaign.heading, body: campaign.body, actionLabel: campaign.actionLabel || "", actionUrl: campaign.actionUrl || "" }); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function loadPromotionPack(code: string) {
    const pack = getPromotionCommunicationPack(code);
    setSelectedPackCode(code);
    if (!pack) return;
    setDraft({ id: "", subject: pack.email.subject, heading: pack.email.heading, body: pack.email.body, actionLabel: pack.email.actionLabel ?? "", actionUrl: pack.email.actionUrl ?? "" });
  }
  const selectedPack = getPromotionCommunicationPack(selectedPackCode);
  async function copySocialPost(copy: string, label: string) {
    try { await navigator.clipboard.writeText(copy); setMessage(`${label}: testo copiato.`); }
    catch { setMessage("Copia non disponibile: seleziona manualmente il testo."); }
  }
  if (!data) return <section className="email-admin-state"><strong>Novità di GiWise Studio</strong><p>{message}</p></section>;
  return <section className="email-admin-dashboard marketing-admin-dashboard">
    <header><div><p className="eyebrow">Comunicazioni facoltative</p><h1>Prima si prepara. Poi si decide.</h1><p>Le campagne GiWise Studio restano separate da ricevute e sicurezza. Salva la bozza, controlla l’anteprima, invia una prova e solo dopo congela il pubblico.</p></div><aside className={data.configured ? "is-ready" : "needs-key"}><strong>{data.audienceCount} iscritti attivi</strong><span>{data.configured ? `Invio di prova: ${data.adminEmail}` : "Resend non configurato: nessun invio reale possibile"}</span></aside></header>
    <section className="marketing-promotion-pack"><label>Pacchetto promozionale<select value={selectedPackCode} onChange={(event) => loadPromotionPack(event.target.value)}><option value="">Bozza libera</option>{promotionCommunicationPacks.map((pack) => <option value={pack.code} key={pack.code}>{pack.title} · {pack.period}</option>)}</select></label>{selectedPack ? <div><strong>{selectedPack.title}</strong><span>Email + {selectedPack.social.length} canali social · percorso {selectedPack.landingPath}</span></div> : <p>Ogni nuova promozione deve avere email, contenuti social e un percorso diretto prima dell’approvazione.</p>}</section>
    <div className="marketing-compose-layout"><form onSubmit={(event) => { event.preventDefault(); if (!previewPack) void act("save"); }}><h2>{draft.id ? "Modifica bozza" : previewPack ? "Email promozionale · anteprima locale" : "Nuova bozza"}</h2><label>Oggetto<input required maxLength={140} value={draft.subject} onChange={(event) => setDraft({ ...draft, subject: event.target.value })} /></label><label>Titolo principale<input required maxLength={180} value={draft.heading} onChange={(event) => setDraft({ ...draft, heading: event.target.value })} /></label><label>Messaggio<textarea required maxLength={4000} rows={9} value={draft.body} onChange={(event) => setDraft({ ...draft, body: event.target.value })} /></label><div><label>Testo pulsante<input maxLength={70} value={draft.actionLabel} onChange={(event) => setDraft({ ...draft, actionLabel: event.target.value })} placeholder="Scopri la novità" /></label><label>Percorso diretto<input maxLength={500} value={draft.actionUrl} onChange={(event) => setDraft({ ...draft, actionUrl: event.target.value })} placeholder="/novita" /></label></div><footer><button type="submit" disabled={busy || Boolean(previewPack)}>{previewPack ? "Solo anteprima · nessun invio" : draft.id ? "Aggiorna bozza" : "Salva bozza"}</button>{draft.id ? <button type="button" onClick={() => setDraft(emptyDraft)} disabled={busy}>Nuova</button> : null}</footer></form><article className="marketing-email-preview" aria-label="Anteprima email"><small>LoreWise Universe · GiWise Studio</small><h2>{draft.heading || "Il titolo della comunicazione"}</h2>{draft.body ? draft.body.split(/\n{2,}/).map((paragraph, index) => <p key={index}>{paragraph}</p>) : <p>Qui vedrai il messaggio esattamente nella sua struttura essenziale.</p>}{draft.actionLabel && draft.actionUrl ? <span>{draft.actionLabel}</span> : null}<footer>Revoca diretta sempre presente · nessun tracciamento pubblicitario</footer></article></div>
    {selectedPack ? <section className="marketing-social-kit" aria-labelledby="marketing-social-title"><header><div><p className="eyebrow">Pacchetto social coordinato</p><h2 id="marketing-social-title">Un messaggio, adattato al canale.</h2></div><span>{selectedPack.social.length} contenuti pronti · pubblicazione sempre manuale</span></header><div>{selectedPack.social.map((post) => <article key={post.channel}><header><div><strong>{post.label}</strong><small>{post.format}</small></div><button type="button" onClick={() => void copySocialPost(post.copy, post.label)}>Copia testo</button></header><p>{post.copy}</p><div className="marketing-social-assets">{post.assets.map((asset) => <figure key={`${post.channel}-${asset.src}`}><Image src={asset.src} alt={asset.alt} width={1131} height={1600} sizes="(max-width: 850px) 30vw, 220px" unoptimized /><figcaption>{asset.alt}</figcaption></figure>)}</div><footer><span>{post.actionLabel}</span><code>{post.actionUrl}</code></footer></article>)}</div></section> : null}
    {message ? <p className="email-admin-message" role="status">{message}</p> : null}
    <div className="email-admin-summary"><div><strong>{data.campaigns.length}</strong><span>Campagne</span></div><div><strong>{data.audienceCount}</strong><span>Iscritti</span></div><div><strong>{data.campaigns.reduce((sum, item) => sum + item.sentCount, 0)}</strong><span>Consegnate</span></div><div><strong>{data.consentEvents}</strong><span>Scelte registrate</span></div></div>
    {data.campaigns.length ? <ol className="email-admin-list">{data.campaigns.map((campaign) => <li key={campaign.id}><span className={`email-status email-status-${campaign.status}`}>{campaign.status}</span><div><strong>{campaign.subject}</strong><small>{campaign.code} · {campaign.recipientCount} destinatari · {campaign.sentCount} inviate · {campaign.revokedCount} revocate</small></div><div>{campaign.status === "draft" ? <><button type="button" disabled={busy} onClick={() => edit(campaign)}>Modifica</button><button type="button" disabled={busy || !data.configured} onClick={() => void act("send_test", campaign.id)}>Invia prova</button><button type="button" disabled={busy || !data.audienceCount} onClick={() => void act("queue", campaign.id)}>Metti in coda</button></> : null}{campaign.status === "queued" ? <button type="button" disabled={busy || !campaign.pendingCount || !data.configured} onClick={() => void act("send_pending", campaign.id)}>Invia in attesa</button> : null}</div></li>)}</ol> : <p className="email-admin-empty">Non ci sono ancora campagne. La prima nascerà come bozza e non invierà nulla.</p>}
  </section>;
}
