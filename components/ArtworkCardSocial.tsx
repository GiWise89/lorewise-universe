"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ART_COMMENT_LIMITS } from "@/lib/artCommunity";

type CommunityComment = {
  id: string;
  name: string;
  username: string | null;
  avatarUrl: string | null;
  body: string;
  replies: CommunityComment[];
};

type CommunityState = {
  authenticated: boolean;
  canParticipate: boolean;
  likeCount: number;
  viewerLiked: boolean;
  comments: CommunityComment[];
};

type ArtworkCardSocialProps = {
  artworkCode: string;
  artworkTitle: string;
  artworkSlug: string;
};

export function ArtworkCardSocial({ artworkCode, artworkTitle, artworkSlug }: ArtworkCardSocialProps) {
  const endpoint = `/api/art-community?artwork=${encodeURIComponent(artworkCode)}`;
  const [community, setCommunity] = useState<CommunityState | null>(null);
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    void fetch(endpoint, { headers: { accept: "application/json" }, cache: "no-store", credentials: "same-origin", signal: controller.signal })
      .then(async (response) => {
        const body = await response.json() as CommunityState & { error?: string };
        if (!response.ok) throw new Error(body.error || "Community non disponibile.");
        return body;
      })
      .then((body) => { if (active) { setCommunity(body); setMessage(""); } })
      .catch((error: unknown) => {
        if (active && !(error instanceof DOMException && error.name === "AbortError")) { setLoadFailed(true); setMessage("La Community non è disponibile in questo momento."); }
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [endpoint]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [open]);

  const commentCount = useMemo(
    () => community?.comments.reduce((total, entry) => total + 1 + entry.replies.length, 0) ?? 0,
    [community],
  );

  async function perform(payload: Record<string, unknown>) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", accept: "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });
      const body = await response.json() as CommunityState & { error?: string };
      if (!response.ok) throw new Error(body.error || "Operazione non completata.");
      setCommunity(body);
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

  async function publishReply(event: FormEvent<HTMLFormElement>, parentCommentId: string) {
    event.preventDefault();
    if (await perform({ action: "comment", comment: reply, parentCommentId })) {
      setReply("");
      setReplyingTo(null);
    }
  }

  function likeArtwork() {
    if (!community) {
      setMessage("La Community non è disponibile in questo momento.");
      return;
    }
    if (!community.authenticated) return;
    if (!community.canParticipate) {
      setMessage("Completa il profilo LoreWise prima di partecipare.");
      return;
    }
    void perform({ action: "toggle_like" });
  }

  return <>
    <div className="artwork-card-social" aria-label={`Interazioni per ${artworkTitle}`}>
      {community && !community.authenticated ? <Link href={`/account?next=${encodeURIComponent(`/arte/${artworkSlug}`)}`} aria-label={`Accedi per mettere Mi piace a ${artworkTitle}`}>
        <span aria-hidden="true">♡</span> <span className="artwork-social-label">Mi piace</span>
      </Link> : <button type="button" className={community?.viewerLiked ? "is-liked" : undefined} aria-pressed={community?.viewerLiked ?? false} disabled={busy || loading || loadFailed} onClick={likeArtwork}>
        <span aria-hidden="true">{community?.viewerLiked ? "♥" : "♡"}</span> <span className="artwork-social-label">{loading ? "Caricamento" : "Mi piace"}</span> <strong>{community ? community.likeCount : "—"}</strong>
      </button>}
      <button type="button" aria-expanded={open} onClick={() => setOpen(true)}>
        <span aria-hidden="true">💬</span> <span className="artwork-social-label">Commenti</span> {commentCount > 0 ? <strong>{commentCount}</strong> : null}
      </button>
      {loadFailed ? <p className="artwork-card-social-message" role="status">Community temporaneamente non disponibile.</p> : message && !open ? <p className="artwork-card-social-message" role="status">{message}</p> : null}
    </div>

    {open && typeof document !== "undefined" ? createPortal(<div className="artwork-card-comments-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <section className="artwork-card-comments-panel" role="dialog" aria-modal="true" aria-labelledby={`quick-comments-${artworkCode}`}>
        <header>
          <div><span>Conversazione sull’opera</span><small>{artworkCode}</small><h3 id={`quick-comments-${artworkCode}`}>{artworkTitle}</h3></div>
          <button type="button" aria-label="Chiudi i commenti" onClick={() => setOpen(false)}>×</button>
        </header>
        <div className="artwork-card-comments-summary"><strong>{community?.likeCount ?? 0}</strong> Mi piace · <strong>{commentCount}</strong> commenti</div>
        {community?.comments.length ? <ol className="artwork-card-comment-threads">{community.comments.slice(0, 3).map((entry) => <li className="artwork-card-comment-thread" key={entry.id}>
          <div className="artwork-card-comment-entry">
            <div className="artwork-card-comment-avatar">
              {entry.avatarUrl ? <Image src={entry.avatarUrl} alt="" width={52} height={52} unoptimized /> : <span aria-hidden="true">{entry.name.trim().slice(0, 1).toUpperCase() || "L"}</span>}
            </div>
            <div className="artwork-card-comment-copy">
              <div className="artwork-card-comment-author"><strong>{entry.name}</strong>{entry.username ? <small>@{entry.username}</small> : null}</div>
              <p>{entry.body}</p>
              {community.canParticipate ? <button className="artwork-card-comment-reply" type="button" aria-expanded={replyingTo === entry.id} onClick={() => { setReplyingTo((current) => current === entry.id ? null : entry.id); setReply(""); }}>Rispondi direttamente</button> : null}
            </div>
          </div>
          {entry.replies.length ? <ol className="artwork-card-comment-replies">{entry.replies.map((child) => <li className="artwork-card-comment-entry is-reply" key={child.id}>
            <div className="artwork-card-comment-avatar">{child.avatarUrl ? <Image src={child.avatarUrl} alt="" width={44} height={44} unoptimized /> : <span aria-hidden="true">{child.name.trim().slice(0, 1).toUpperCase() || "L"}</span>}</div>
            <div className="artwork-card-comment-copy"><div className="artwork-card-comment-author"><strong>{child.name}</strong>{child.username ? <small>@{child.username}</small> : null}</div><p>{child.body}</p></div>
          </li>)}</ol> : null}
          {replyingTo === entry.id ? <form className="artwork-card-reply-form" onSubmit={(event) => void publishReply(event, entry.id)}>
            <label htmlFor={`quick-reply-${entry.id}`}>Rispondi a {entry.name}</label>
            <textarea id={`quick-reply-${entry.id}`} value={reply} onChange={(event) => setReply(event.target.value)} minLength={ART_COMMENT_LIMITS.minimum} maxLength={ART_COMMENT_LIMITS.maximum} required placeholder={`Scrivi una risposta per ${entry.name}…`} />
            <div><small>{reply.length} / {ART_COMMENT_LIMITS.maximum}</small><button type="submit" disabled={busy}>Pubblica risposta</button></div>
          </form> : null}
        </li>)}</ol> : <p className="artwork-card-comments-empty">Ancora nessun commento. Puoi iniziare tu la conversazione.</p>}
        {loading ? <div className="artwork-card-comments-access"><p>Caricamento della conversazione…</p></div> : loadFailed ? <div className="artwork-card-comments-access"><p>Non è stato possibile caricare la Community. Riprova ricaricando la pagina.</p></div> : community?.canParticipate ? <form onSubmit={(event) => void publishComment(event)}>
          <label htmlFor={`quick-comment-${artworkCode}`}>Lascia un pensiero</label>
          <textarea id={`quick-comment-${artworkCode}`} value={comment} onChange={(event) => setComment(event.target.value)} minLength={ART_COMMENT_LIMITS.minimum} maxLength={ART_COMMENT_LIMITS.maximum} required placeholder="Che cosa ti trasmette quest’opera?" />
          <div><small>{comment.length} / {ART_COMMENT_LIMITS.maximum}</small><button type="submit" disabled={busy}>Pubblica</button></div>
        </form> : community?.authenticated ? <div className="artwork-card-comments-access"><p>Completa nome pubblico e nickname per partecipare.</p><Link href="/account#account-profile">Completa il profilo</Link></div> : <div className="artwork-card-comments-access"><p>Per mettere Mi piace e commentare serve il tuo LoreWise ID.</p><Link href="/account">Accedi o registrati</Link></div>}
        {message ? <p className="artwork-card-comments-message" role="status">{message}</p> : null}
        <Link className="artwork-card-comments-full" href={`/arte/${artworkSlug}#community-${artworkCode}`}>Apri la conversazione completa →</Link>
      </section>
    </div>, document.body) : null}
  </>;
}
