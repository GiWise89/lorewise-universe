"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ART_COMMENT_LIMITS, ART_REPORT_REASONS } from "@/lib/artCommunity";

type CommunityComment = {
  id: string;
  author: string;
  body: string;
  createdAt: string;
  edited: boolean;
  ownedByViewer: boolean;
  membershipBadge: string | null;
};

type CommunityState = {
  authenticated: boolean;
  canParticipate: boolean;
  likeCount: number;
  viewerLiked: boolean;
  comments: CommunityComment[];
};

function europeanDate(value: string) {
  const normalized = /Z$|[+-]\d\d:\d\d$/.test(value) ? value : `${value.replace(" ", "T")}Z`;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("it-IT", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function ArtworkCommunity({ artworkCode, artworkTitle }: { artworkCode: string; artworkTitle: string }) {
  const endpoint = `/api/art-community?artwork=${encodeURIComponent(artworkCode)}`;
  const [community, setCommunity] = useState<CommunityState | null>(null);
  const [comment, setComment] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingBody, setEditingBody] = useState("");
  const [message, setMessage] = useState("Caricamento delle reazioni…");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    void fetch(endpoint, { headers: { accept: "application/json" } })
      .then(async (response) => {
        const body = await response.json() as CommunityState & { error?: string };
        if (!response.ok) throw new Error(body.error || "Community non disponibile.");
        if (!active) return;
        setCommunity(body);
        setMessage("");
      })
      .catch((error: Error) => active && setMessage(error.message));
    return () => { active = false; };
  }, [endpoint]);

  async function perform(payload: Record<string, unknown>) {
    setBusy(true);
    setMessage("Operazione in corso…");
    try {
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", accept: "application/json" }, body: JSON.stringify(payload) });
      const body = await response.json() as (CommunityState & { error?: string; message?: string });
      if (!response.ok) throw new Error(body.error || "Operazione non completata.");
      if (Array.isArray(body.comments)) setCommunity(body);
      setMessage(body.message || "Reazione aggiornata.");
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Operazione non completata.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function publishComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (await perform({ action: "comment", comment })) setComment("");
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>, commentId: string) {
    event.preventDefault();
    if (await perform({ action: "edit_comment", commentId, comment: editingBody })) setEditingId(null);
  }

  async function reportComment(event: FormEvent<HTMLFormElement>, commentId: string) {
    event.preventDefault();
    const details = event.currentTarget.closest("details");
    const form = new FormData(event.currentTarget);
    await perform({ action: "report_comment", commentId, reason: form.get("reason") });
    details?.removeAttribute("open");
  }

  return <section className="art-community" aria-labelledby={`community-${artworkCode}`}>
    <div className="shell art-community-heading">
      <Image src="/brand/art-portals/originals-seal-card-v1.webp" alt="" width={256} height={256} unoptimized />
      <div><p className="eyebrow">Reazioni dalla community</p><h2 id={`community-${artworkCode}`}>L’opera continua negli occhi di chi guarda.</h2><p>Apprezzamenti e commenti riguardano l’anteprima protetta di <strong>{artworkTitle}</strong>. La filigrana e le limitazioni dei download restano invariate; nessun commento dimostrativo verrà pubblicato.</p></div>
      <div className="art-community-like"><strong>{community?.likeCount ?? 0}</strong><span>{community?.likeCount === 1 ? "apprezzamento" : "apprezzamenti"}</span>{community?.canParticipate ? <button type="button" aria-pressed={community.viewerLiked} disabled={busy} onClick={() => void perform({ action: "toggle_like" })}>{community.viewerLiked ? "Rimuovi il tuo apprezzamento" : "Lascia un apprezzamento"}</button> : community?.authenticated ? <small>Interazioni temporaneamente sospese</small> : <Link href="/account">Accedi per lasciare un apprezzamento</Link>}</div>
    </div>

    <div className="shell art-community-body">
      <div className="art-community-comments">
        <header><span>{community?.comments.length ?? 0}</span><div><p className="eyebrow">Conversazione</p><h3>Commenti dei membri.</h3></div></header>
        {community?.comments.length ? <ol>{community.comments.map((entry) => <li key={entry.id}>
          <div className="art-community-comment-meta"><strong>{entry.author}</strong>{entry.membershipBadge ? <span className={`community-member-badge is-${entry.membershipBadge.toLowerCase()}`}>{entry.membershipBadge}</span> : null}<time>{europeanDate(entry.createdAt)}</time>{entry.edited ? <small>Modificato</small> : null}</div>
          {editingId === entry.id ? <form className="art-community-edit" onSubmit={(event) => void saveEdit(event, entry.id)}><label htmlFor={`edit-${entry.id}`}>Modifica il commento</label><textarea id={`edit-${entry.id}`} value={editingBody} onChange={(event) => setEditingBody(event.target.value)} minLength={ART_COMMENT_LIMITS.minimum} maxLength={ART_COMMENT_LIMITS.maximum} required /><div><button type="submit" disabled={busy}>Salva</button><button type="button" onClick={() => setEditingId(null)}>Annulla</button></div></form> : <p>{entry.body}</p>}
          {editingId !== entry.id ? <div className="art-community-comment-actions">{entry.ownedByViewer && community.canParticipate ? <><button type="button" onClick={() => { setEditingId(entry.id); setEditingBody(entry.body); }}>Modifica</button><button type="button" disabled={busy} onClick={() => void perform({ action: "delete_comment", commentId: entry.id })}>Elimina</button></> : community.canParticipate ? <details><summary>Segnala</summary><form onSubmit={(event) => void reportComment(event, entry.id)}><label htmlFor={`reason-${entry.id}`}>Motivo</label><select id={`reason-${entry.id}`} name="reason">{ART_REPORT_REASONS.map((reason) => <option key={reason}>{reason}</option>)}</select><button type="submit" disabled={busy}>Invia segnalazione</button></form></details> : null}</div> : null}
        </li>)}</ol> : community ? <p className="art-community-empty">Nessun commento pubblicato. La conversazione inizierà con utenti reali, senza contenuti dimostrativi.</p> : null}
      </div>

      <aside className="art-community-compose">
        <p className="eyebrow">La tua voce</p>
        {community?.canParticipate ? <><h3>Scrivi con cura.</h3><form onSubmit={(event) => void publishComment(event)}><label htmlFor={`comment-${artworkCode}`}>Commento</label><textarea id={`comment-${artworkCode}`} value={comment} onChange={(event) => setComment(event.target.value)} minLength={ART_COMMENT_LIMITS.minimum} maxLength={ART_COMMENT_LIMITS.maximum} required placeholder="Cosa ti ha colpito dell’opera?" /><div><small>{comment.length} / {ART_COMMENT_LIMITS.maximum}</small><button type="submit" disabled={busy}>Pubblica il commento</button></div></form></> : community?.authenticated ? <><h3>Interazioni sospese.</h3><p>Questo profilo non può pubblicare o segnalare contenuti finché il blocco o la richiesta di cancellazione restano attivi.</p><Link href="/account">Controlla lo stato del profilo</Link></> : <><h3>Entra nella conversazione.</h3><p>Like e commenti sono riservati ai profili verificati. Il tuo indirizzo email non verrà mostrato pubblicamente.</p><Link href="/account">Accedi o crea LoreWise ID</Link></>}
        {message ? <p className="art-community-message" role="status" aria-live="polite">{message}</p> : null}
        <small className="art-community-rules">Antispam attivo · un apprezzamento per account · commenti modificabili o eliminabili · segnalazioni sottoposte a moderazione</small>
      </aside>
    </div>
  </section>;
}
