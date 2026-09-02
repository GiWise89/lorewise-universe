"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { readLocalCodexBookmarks, removeLocalCodexBookmark } from "@/lib/localCodexBookmarks";

type Benefits = {
  pass: { active: boolean; name: string; code: string | null; currentPeriodEnd: string | null; communityBadge: string | null };
  wallet: { availableCredits: number; usedCredits: number; entries: Array<{ id: string; amount: number; remaining: number; status: string; assignedAt: string; expiresAt: string | null; resourceCode: string | null }> };
  discounts: { commissions: number; games: number; digitalProducts: number };
  familiar: { level: number; title: string; benefit: string; nextLevel: number | null; nextTitle: string | null; economyHistory: Array<{ eventType: string; coinDelta: number; balanceAfter: number; experienceDelta: number; createdAt: string }> };
  opportunities: Array<{ code: string; title: string; description: string; available: boolean; claim: { status: string } | null }>;
  collectorDossiers: Array<{ slug: string; title: string; concept: string; developmentFacts: Array<{ label: string; value: string }> }>;
  redeemableArtworks: Array<{ code: string; title: string }>;
  bookmarks: Array<{ slug: string; collection: string; createdAt: string }>;
  polls: Array<{ code: string; title: string; opensAt: string; closesAt: string; open: boolean; viewerOption: string | null; options: Array<{ code: string; label: string; votes: number }> }>;
  history: Array<{ type: string; action: string; amount: number; referenceCode: string | null; createdAt: string }>;
};

function date(value: string | null) {
  if (!value) return "Senza scadenza";
  const normalized = /Z$|[+-]\d\d:\d\d$/.test(value) ? value : `${value.replace(" ", "T")}Z`;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? value : new Intl.DateTimeFormat("it-IT", { dateStyle: "medium" }).format(parsed);
}

const actionLabels: Record<string, string> = {
  granted: "Crediti assegnati", cap_reached: "Limite di accumulo raggiunto", redeemed: "Credito utilizzato",
  revoked: "Credito revocato", cast: "Voto registrato", applied: "Candidatura inviata", access_granted: "Accesso registrato",
};

export function BenefitsCenter() {
  const [data, setData] = useState<Benefits | null>(null);
  const [message, setMessage] = useState("Caricamento dei vantaggi…");
  const [busy, setBusy] = useState(false);
  const [artworkCode, setArtworkCode] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      const response = await fetch("/api/account/benefits", { headers: { accept: "application/json" } });
      let payload = await response.json() as Benefits & { error?: string };
      if (!response.ok) throw new Error(payload.error || "Vantaggi non disponibili.");
      const remoteSlugs = new Set(payload.bookmarks.map((bookmark) => bookmark.slug));
      for (const bookmark of readLocalCodexBookmarks()) {
        if (remoteSlugs.has(bookmark.slug)) continue;
        const sync = await fetch("/api/account/benefits", {
          method: "POST",
          headers: { "Content-Type": "application/json", accept: "application/json" },
          body: JSON.stringify({ action: "bookmark", slug: bookmark.slug, collection: bookmark.collection }),
        });
        if (sync.ok) payload = await sync.json() as Benefits;
      }
      if (active) { setData(payload); setArtworkCode(payload.redeemableArtworks[0]?.code ?? ""); setMessage(""); }
    };
    void load().catch((error: Error) => active && setMessage(error.message));
    return () => { active = false; };
  }, []);

  async function perform(payload: Record<string, unknown>) {
    setBusy(true);
    setMessage("Aggiornamento dei vantaggi…");
    try {
      const response = await fetch("/api/account/benefits", { method: "POST", headers: { "Content-Type": "application/json", accept: "application/json" }, body: JSON.stringify(payload) });
      const body = await response.json() as Benefits & { error?: string };
      if (!response.ok) throw new Error(body.error || "Operazione non completata.");
      if (payload.action === "remove_bookmark" && typeof payload.slug === "string") removeLocalCodexBookmark(payload.slug);
      setData(body);
      setMessage("Vantaggio aggiornato sul tuo LoreWise ID.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Operazione non completata.");
    } finally { setBusy(false); }
  }

  function vote(event: FormEvent<HTMLFormElement>, pollCode: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void perform({ action: "vote", pollCode, optionCode: form.get("optionCode") });
  }

  if (!data) return <article className="personal-chapter personal-benefits-center"><p role="status">{message}</p></article>;

  return <article id="account-benefits" className="personal-chapter personal-benefits-center" aria-labelledby="benefits-center-title">
    <header className="benefits-center-heading"><div><p className="eyebrow">I miei vantaggi</p><h3 id="benefits-center-title">Tutto ciò che il tuo piano riconosce.</h3></div><span className={`member-badge ${data.pass.active ? "is-active" : ""}`}>{data.pass.communityBadge || "LoreWise ID"}</span></header>
    <div className="benefits-center-summary">
      <section><small>Crediti Arte disponibili</small><strong>{data.wallet.availableCredits}</strong><span>{data.wallet.usedCredits} già utilizzati</span></section>
      <section><small>Commissioni</small><strong>{data.discounts.commissions}%</strong><span>sconto automatico</span></section>
      <section><small>Giochi</small><strong>{data.discounts.games}%</strong><span>sconto automatico</span></section>
      <section><small>Prodotti digitali</small><strong>{data.discounts.digitalProducts}%</strong><span>sconto automatico</span></section>
    </div>

    <section className="benefit-panel familiar-benefit-panel" aria-labelledby="familiar-benefit-title">
      <div><small>Legame con il Famiglio · livello {data.familiar.level}</small><h4 id="familiar-benefit-title">{data.familiar.title}</h4><p>{data.familiar.benefit}</p></div>
      <div>{data.familiar.nextLevel ? <><small>Prossimo traguardo</small><strong>Livello {data.familiar.nextLevel}</strong><span>{data.familiar.nextTitle}</span></> : <><small>Traguardo massimo</small><strong>Livello 50</strong><span>Custode leggendario</span></>}</div>
      <Link href="/famiglio">Apri il Famiglio</Link>
    </section>

    <div className="benefits-center-grid">
      <section className="benefit-panel"><h4>Portafoglio crediti</h4><p>Ogni credito nasce da una mensilità confermata. Il riscatto crea una licenza permanente nella tua libreria.</p>
        {data.wallet.availableCredits ? <form onSubmit={(event) => { event.preventDefault(); void perform({ action: "redeem_art_credit", artworkCode }); }}><label htmlFor="benefit-artwork">Opera originale</label><select id="benefit-artwork" value={artworkCode} onChange={(event) => setArtworkCode(event.target.value)}>{data.redeemableArtworks.map((artwork) => <option value={artwork.code} key={artwork.code}>{artwork.title} · {artwork.code}</option>)}</select><button type="submit" disabled={busy || !artworkCode}>Usa un credito Arte</button></form> : <small>Nessun credito riscattabile in questo momento.</small>}
        {data.wallet.entries.length ? <ol className="benefit-ledger">{data.wallet.entries.map((entry) => <li key={entry.id}><div><strong>{entry.remaining} / {entry.amount}</strong><span>{entry.status}</span></div><small>Assegnato {date(entry.assignedAt)} · scade {date(entry.expiresAt)}</small></li>)}</ol> : null}
      </section>

      <section className="benefit-panel"><h4>Accessi e candidature</h4><ol className="benefit-opportunities">{data.opportunities.map((item) => <li key={item.code}><div><strong>{item.title}</strong><p>{item.description}</p></div>{item.claim ? <span>{item.claim.status === "granted" ? "Accesso registrato" : "Candidatura inviata"}</span> : <button type="button" disabled={busy || !item.available} onClick={() => void perform({ action: item.code.includes("beta") ? "apply" : "claim_access", benefitCode: item.code })}>{item.code.includes("beta") ? "Candidati" : "Registra accesso"}</button>}</li>)}</ol>
        {data.collectorDossiers.length ? <div className="collector-dossiers"><h5>Dossier Collector · originali GiWise</h5>{data.collectorDossiers.map((entry) => <details key={entry.slug}><summary>{entry.title}</summary><p>{entry.concept}</p><dl>{entry.developmentFacts.map((fact) => <div key={`${entry.slug}-${fact.label}`}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl><Link href={`/enciclopedia/${entry.slug}`}>Apri il dossier canonico</Link></details>)}</div> : null}
      </section>

      <section className="benefit-panel benefit-polls"><h4>Votazioni aperte</h4>{data.polls.map((poll) => <form key={poll.code} onSubmit={(event) => vote(event, poll.code)}><strong>{poll.title}</strong><small>Aperta fino al {date(poll.closesAt)} · un voto per LoreWise ID</small>{poll.options.map((option) => <label key={option.code}><input type="radio" name="optionCode" value={option.code} disabled={!poll.open || Boolean(poll.viewerOption)} required defaultChecked={poll.viewerOption === option.code} /><span>{option.label}</span><b>{option.votes}</b></label>)}{poll.viewerOption ? <em>Voto registrato e non duplicabile.</em> : <button type="submit" disabled={busy || !poll.open || !data.pass.active}>Registra il voto</button>}</form>)}</section>

      <section className="benefit-panel"><h4>Codex personale</h4><p>Segnalibri e raccolte sono collegati al LoreWise ID.</p>{data.bookmarks.length ? <ol className="benefit-bookmarks">{data.bookmarks.map((bookmark) => <li key={bookmark.slug}><Link href={`/enciclopedia/${bookmark.slug}`}>{bookmark.slug}</Link><span>{bookmark.collection}</span><button type="button" disabled={busy} onClick={() => void perform({ action: "remove_bookmark", slug: bookmark.slug })}>Rimuovi</button></li>)}</ol> : <small>Non hai ancora salvato personaggi. Usa “Salva nel Codex” dall’indice enciclopedico.</small>}
        <h4 className="benefit-history-title">Storico vantaggi</h4>{data.history.length ? <ol className="benefit-history">{data.history.slice(0, 12).map((entry, index) => <li key={`${entry.createdAt}-${index}`}><span>{actionLabels[entry.action] || entry.action}</span><small>{entry.referenceCode || entry.type} · {date(entry.createdAt)}</small></li>)}</ol> : <small>Nessun utilizzo registrato.</small>}
      </section>
    </div>
    {message ? <p className="benefits-center-message" role="status" aria-live="polite">{message}</p> : null}
  </article>;
}
