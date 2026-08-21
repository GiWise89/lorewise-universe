"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ART_COMMENT_LIMITS, ART_REPORT_REASONS } from "@/lib/artCommunity";

type Review = { id: string; author: string; membershipBadge: string | null; body: string; rating: number; version: string; createdAt: string; edited: boolean; ownedByViewer: boolean };
type Community = { authenticated: boolean; canParticipate: boolean; reviewCount: number; averageRating: number | null; viewerReviewId: string | null; viewerRating: number | null; viewerVersion: string | null; reviews: Review[] };

function date(value: string) {
  const normalized = /Z$|[+-]\d\d:\d\d$/.test(value) ? value : `${value.replace(" ", "T")}Z`;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? value : new Intl.DateTimeFormat("it-IT", { dateStyle: "medium" }).format(parsed);
}

export function GameCommunityReviews({ gameCode, gameTitle, currentVersion }: { gameCode: string; gameTitle: string; currentVersion: string }) {
  const endpoint = `/api/game-community?game=${encodeURIComponent(gameCode)}`;
  const [community, setCommunity] = useState<Community | null>(null);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [message, setMessage] = useState("Caricamento delle recensioni…");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    void fetch(endpoint, { headers: { accept: "application/json" } }).then(async (response) => {
      const body = await response.json() as Community & { error?: string };
      if (!response.ok) throw new Error(body.error || "Recensioni non disponibili.");
      if (!active) return;
      setCommunity(body);
      const mine = body.reviews.find((item) => item.ownedByViewer);
      if (mine) { setRating(mine.rating); setReview(mine.body); }
      setMessage("");
    }).catch((error: Error) => active && setMessage(error.message));
    return () => { active = false; };
  }, [endpoint]);

  async function perform(payload: Record<string, unknown>) {
    setBusy(true);
    setMessage("Operazione in corso…");
    try {
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", accept: "application/json" }, body: JSON.stringify(payload) });
      const body = await response.json() as Community & { error?: string; message?: string };
      if (!response.ok) throw new Error(body.error || "Operazione non completata.");
      if (Array.isArray(body.reviews)) setCommunity(body);
      setMessage(body.message || "Recensione aggiornata.");
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Operazione non completata.");
      return false;
    } finally { setBusy(false); }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await perform({ action: "review", rating, review });
  }

  async function report(event: FormEvent<HTMLFormElement>, commentId: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (await perform({ action: "report_review", commentId, reason: form.get("reason") })) event.currentTarget.closest("details")?.removeAttribute("open");
  }

  return <section className="game-community-live" aria-labelledby={`game-community-${gameCode}`}>
    <div className="shell game-community-live-heading"><div><p className="eyebrow">Community verificata</p><h2 id={`game-community-${gameCode}`}>Chi ha giocato racconta {gameTitle}.</h2><p>Un voto per LoreWise ID, sempre associato alla versione provata. Nessuna recensione dimostrativa viene pubblicata.</p></div><aside><strong>{community?.averageRating == null ? "—" : `${community.averageRating} / 5`}</strong><span>{community?.reviewCount ?? 0} {community?.reviewCount === 1 ? "recensione" : "recensioni"}</span><small>Versione corrente {currentVersion}</small></aside></div>
    <div className="shell game-community-live-body"><div className="game-community-review-list">
      {community?.reviews.length ? <ol>{community.reviews.map((entry) => <li key={entry.id}><header><strong>{entry.author}</strong>{entry.membershipBadge ? <span className={`community-member-badge is-${entry.membershipBadge.toLowerCase()}`}>{entry.membershipBadge}</span> : null}<span aria-label={`${entry.rating} stelle su 5`}>{"★".repeat(entry.rating)}{"☆".repeat(5 - entry.rating)}</span><time>{date(entry.createdAt)}</time></header><small>Versione provata {entry.version}{entry.edited ? " · aggiornata" : ""}</small><p>{entry.body}</p>{entry.ownedByViewer ? <button type="button" disabled={busy} onClick={() => void perform({ action: "delete_review", commentId: entry.id })}>Elimina la mia recensione</button> : community.canParticipate ? <details><summary>Segnala</summary><form onSubmit={(event) => void report(event, entry.id)}><select name="reason" aria-label="Motivo della segnalazione">{ART_REPORT_REASONS.map((reason) => <option key={reason}>{reason}</option>)}</select><button type="submit" disabled={busy}>Invia alla moderazione</button></form></details> : null}</li>)}</ol> : community ? <p className="game-community-empty">Non ci sono ancora recensioni reali per questa versione.</p> : null}
    </div><aside className="game-community-compose"><p className="eyebrow">La tua esperienza</p>{community?.canParticipate ? <form onSubmit={(event) => void submit(event)}><label htmlFor={`game-rating-${gameCode}`}>Valutazione</label><select id={`game-rating-${gameCode}`} value={rating} onChange={(event) => setRating(Number(event.target.value))}>{[5,4,3,2,1].map((value) => <option value={value} key={value}>{value} su 5</option>)}</select><label htmlFor={`game-review-${gameCode}`}>Recensione della versione {currentVersion}</label><textarea id={`game-review-${gameCode}`} value={review} onChange={(event) => setReview(event.target.value)} minLength={20} maxLength={ART_COMMENT_LIMITS.maximum} rows={7} required placeholder="Cosa funziona, cosa miglioreresti e quale parte hai provato?" /><small>{review.length} / {ART_COMMENT_LIMITS.maximum}</small><button type="submit" disabled={busy}>{community.viewerReviewId ? "Aggiorna recensione" : "Pubblica recensione"}</button></form> : community?.authenticated ? <><h3>Interazioni sospese.</h3><Link href="/account">Controlla il profilo</Link></> : <><h3>Accedi per recensire.</h3><p>Il voto e la recensione restano collegati al tuo LoreWise ID verificato.</p><Link href="/account">Accedi o crea LoreWise ID</Link></>}{message ? <p role="status" aria-live="polite">{message}</p> : null}</aside></div>
  </section>;
}
