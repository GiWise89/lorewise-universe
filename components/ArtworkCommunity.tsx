"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { ART_COMMENT_LIMITS, ART_REPORT_REASONS } from "@/lib/artCommunity";

type CommunityComment = {
  id: string;
  name: string;
  username: string | null;
  avatarUrl: string | null;
  body: string;
  createdAt: string;
  edited: boolean;
  ownedByViewer: boolean;
  membershipBadge: string | null;
  likeCount: number;
  viewerLiked: boolean;
  replies: CommunityComment[];
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

function Initials({ name }: { name: string }) {
  return <span className="community-avatar-fallback" aria-hidden="true">{name.trim().slice(0, 1).toUpperCase() || "L"}</span>;
}

function Author({ entry }: { entry: CommunityComment }) {
  const content = <><strong>{entry.name}</strong>{entry.username ? <small>@{entry.username}</small> : null}</>;
  return <div className="community-author">
    {entry.avatarUrl ? <Image src={entry.avatarUrl} alt="" width={52} height={52} unoptimized /> : <Initials name={entry.name} />}
    {entry.username ? <Link href={`/profilo/${encodeURIComponent(entry.username)}`}>{content}</Link> : <span>{content}</span>}
  </div>;
}

export function ArtworkCommunity({ artworkCode, artworkTitle }: { artworkCode: string; artworkTitle: string }) {
  const endpoint = `/api/art-community?artwork=${encodeURIComponent(artworkCode)}`;
  const [community, setCommunity] = useState<CommunityState | null>(null);
  const [comment, setComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingBody, setEditingBody] = useState("");
  const [message, setMessage] = useState("Caricamento della conversazione…");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch(endpoint, { headers: { accept: "application/json" }, cache: "no-store" });
    const body = await response.json() as CommunityState & { error?: string };
    if (!response.ok) throw new Error(body.error || "Community non disponibile.");
    setCommunity(body);
    setMessage("");
  }, [endpoint]);

  useEffect(() => { void load().catch((error: Error) => setMessage(error.message)); }, [load]);

  async function perform(payload: Record<string, unknown>) {
    setBusy(true);
    setMessage("Operazione in corso…");
    try {
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", accept: "application/json" }, body: JSON.stringify(payload) });
      const body = await response.json() as CommunityState & { error?: string; message?: string };
      if (!response.ok) throw new Error(body.error || "Operazione non completata.");
      if (Array.isArray(body.comments)) setCommunity(body);
      else await load();
      setMessage(body.message || "Conversazione aggiornata.");
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Operazione non completata.");
      return false;
    } finally { setBusy(false); }
  }

  async function publishComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (await perform({ action: "comment", comment })) setComment("");
  }

  async function publishReply(event: FormEvent<HTMLFormElement>, parentCommentId: string) {
    event.preventDefault();
    if (await perform({ action: "comment", comment: reply, parentCommentId })) { setReply(""); setReplyingTo(null); }
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

  function CommentCard({ entry, nested = false }: { entry: CommunityComment; nested?: boolean }) {
    return <li className={nested ? "community-comment is-reply" : "community-comment"} id={`comment-${entry.id}`}>
      <Author entry={entry} />
      <div className="community-comment-content">
        <div className="community-comment-meta">
          {entry.membershipBadge ? <span className={`community-member-badge is-${entry.membershipBadge.toLowerCase()}`}>{entry.membershipBadge}</span> : null}
          <time>{europeanDate(entry.createdAt)}</time>{entry.edited ? <small>Modificato</small> : null}
        </div>
        {editingId === entry.id ? <form className="art-community-edit" onSubmit={(event) => void saveEdit(event, entry.id)}>
          <label htmlFor={`edit-${entry.id}`}>Modifica il commento</label>
          <textarea id={`edit-${entry.id}`} value={editingBody} onChange={(event) => setEditingBody(event.target.value)} minLength={ART_COMMENT_LIMITS.minimum} maxLength={ART_COMMENT_LIMITS.maximum} required />
          <div><button type="submit" disabled={busy}>Salva</button><button type="button" onClick={() => setEditingId(null)}>Annulla</button></div>
        </form> : <p>{entry.body}</p>}
        {editingId !== entry.id ? <div className="community-comment-actions">
          {community?.canParticipate ? <button type="button" className={entry.viewerLiked ? "is-liked" : undefined} aria-pressed={entry.viewerLiked} disabled={busy} onClick={() => void perform({ action: "toggle_comment_like", commentId: entry.id })}>♥ {entry.likeCount ? entry.likeCount : "Mi piace"}</button> : entry.likeCount ? <span>♥ {entry.likeCount}</span> : null}
          {!nested && community?.canParticipate ? <button type="button" onClick={() => { setReplyingTo((current) => current === entry.id ? null : entry.id); setReply(""); }}>Rispondi</button> : null}
          {entry.ownedByViewer && community?.canParticipate ? <><button type="button" onClick={() => { setEditingId(entry.id); setEditingBody(entry.body); }}>Modifica</button><button type="button" disabled={busy} onClick={() => void perform({ action: "delete_comment", commentId: entry.id })}>Elimina</button></> : community?.canParticipate ? <details><summary>Segnala</summary><form onSubmit={(event) => void reportComment(event, entry.id)}><label htmlFor={`reason-${entry.id}`}>Motivo</label><select id={`reason-${entry.id}`} name="reason">{ART_REPORT_REASONS.map((reason) => <option key={reason}>{reason}</option>)}</select><button type="submit" disabled={busy}>Invia segnalazione</button></form></details> : null}
        </div> : null}
        {replyingTo === entry.id ? <form className="community-reply-compose" onSubmit={(event) => void publishReply(event, entry.id)}><label htmlFor={`reply-${entry.id}`}>Rispondi a {entry.name}</label><textarea id={`reply-${entry.id}`} value={reply} onChange={(event) => setReply(event.target.value)} minLength={ART_COMMENT_LIMITS.minimum} maxLength={ART_COMMENT_LIMITS.maximum} required placeholder="Scrivi una risposta…" /><div><small>{reply.length} / {ART_COMMENT_LIMITS.maximum}</small><button type="submit" disabled={busy}>Pubblica risposta</button></div></form> : null}
      </div>
      {entry.replies.length ? <ol className="community-replies">{entry.replies.map((child) => <CommentCard key={child.id} entry={child} nested />)}</ol> : null}
    </li>;
  }

  const commentCount = community?.comments.reduce((total, entry) => total + 1 + entry.replies.length, 0) ?? 0;

  return <section className="art-community" aria-labelledby={`community-${artworkCode}`} id={`community-${artworkCode}`}>
    <div className="shell art-community-heading">
      <Image src="/brand/art-portals/originals-seal-card-v1.webp" alt="" width={256} height={256} unoptimized />
      <div><p className="eyebrow">Community LoreWise</p><h2>L’opera continua nella conversazione.</h2><p>Metti Mi piace, racconta cosa ti ha colpito e rispondi agli altri membri sotto l’anteprima protetta di <strong>{artworkTitle}</strong>.</p></div>
      <div className="art-community-stats"><span><strong>{community?.likeCount ?? 0}</strong> Mi piace</span><span><strong>{commentCount}</strong> commenti</span></div>
    </div>

    <div className="shell art-community-social-bar">
      {community?.canParticipate ? <button type="button" className={community.viewerLiked ? "is-liked" : undefined} aria-pressed={community.viewerLiked} disabled={busy} onClick={() => void perform({ action: "toggle_like" })}>♥ {community.viewerLiked ? "Ti piace" : "Mi piace"}</button> : <Link href="/account">Accedi per mettere Mi piace</Link>}
      <a href={`#compose-${artworkCode}`}>◯ Commenta</a>
    </div>

    <div className="shell art-community-body">
      <div className="art-community-comments">
        <header><span>{commentCount}</span><div><p className="eyebrow">Conversazione</p><h3>Commenti dei membri</h3></div></header>
        {community?.comments.length ? <ol>{community.comments.map((entry) => <CommentCard key={entry.id} entry={entry} />)}</ol> : community ? <p className="art-community-empty">Ancora nessun commento. Puoi iniziare tu la conversazione.</p> : null}
      </div>

      <aside className="art-community-compose" id={`compose-${artworkCode}`}>
        <p className="eyebrow">Aggiungi un commento</p>
        {community?.canParticipate ? <><h3>Che cosa ti trasmette?</h3><form onSubmit={(event) => void publishComment(event)}><label htmlFor={`comment-${artworkCode}`}>Commento</label><textarea id={`comment-${artworkCode}`} value={comment} onChange={(event) => setComment(event.target.value)} minLength={ART_COMMENT_LIMITS.minimum} maxLength={ART_COMMENT_LIMITS.maximum} required placeholder="Scrivi il tuo commento…" /><div><small>{comment.length} / {ART_COMMENT_LIMITS.maximum}</small><button type="submit" disabled={busy}>Pubblica</button></div></form></> : community?.authenticated ? <><h3>Interazioni sospese</h3><p>Controlla lo stato del profilo prima di partecipare.</p><Link href="/account">Apri il tuo profilo</Link></> : <><h3>Entra nella conversazione</h3><p>Crea il tuo profilo LoreWise con nome, nickname e immagine personale.</p><Link href="/account">Accedi o registrati</Link></>}
        {message ? <p className="art-community-message" role="status" aria-live="polite">{message}</p> : null}
        <small className="art-community-rules">Profili verificati · protezione antispam · segnalazioni riservate alla moderazione</small>
      </aside>
    </div>
  </section>;
}
