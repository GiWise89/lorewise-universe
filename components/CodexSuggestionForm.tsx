"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type Suggestion = { id: string; character: string; universe: string; reason: string; status: string; createdAt: string };
const LOCAL_KEY = "lorewise-vip-codex-suggestions";

function localSuggestions() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(LOCAL_KEY) || "[]") as unknown;
    return Array.isArray(parsed) ? parsed as Suggestion[] : [];
  } catch { return []; }
}

export function CodexSuggestionForm() {
  const [access, setAccess] = useState<"loading" | "vip" | "locked">("loading");
  const [localOnly, setLocalOnly] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/codex-suggestions", { cache: "no-store", headers: { accept: "application/json" }, signal: controller.signal })
      .then(async (response) => {
        const body = await response.json() as { localOnly?: boolean; suggestions?: Suggestion[] };
        if (!response.ok) { setAccess("locked"); return; }
        setAccess("vip");
        setLocalOnly(Boolean(body.localOnly));
        setSuggestions(body.localOnly ? localSuggestions() : body.suggestions || []);
      })
      .catch(() => setAccess("locked"));
    return () => controller.abort();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setMessage("");
    const form = new FormData(event.currentTarget);
    const payload = { character: form.get("character"), universe: form.get("universe"), reason: form.get("reason") };
    try {
      const response = await fetch("/api/codex-suggestions", { method: "POST", headers: { "Content-Type": "application/json", accept: "application/json" }, body: JSON.stringify(payload) });
      const body = await response.json() as { error?: string; localOnly?: boolean; suggestion?: Suggestion };
      if (!response.ok || !body.suggestion) throw new Error(body.error || "Proposta non registrata.");
      const next = [body.suggestion, ...suggestions];
      setSuggestions(next);
      if (body.localOnly || localOnly) window.localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
      event.currentTarget.reset();
      setMessage(body.localOnly ? "Proposta salvata nella prova locale." : "Proposta inviata alla coda editoriale del Codex.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Proposta non registrata."); }
    finally { setBusy(false); }
  }

  if (access === "loading") return <section className="codex-suggestion codex-suggestion-loading" aria-live="polite"><p>Verifica del Pass in corso…</p></section>;
  if (access === "locked") return <section className="codex-suggestion codex-suggestion-locked"><div><p className="eyebrow">Proposte al Codex · LoreWise VIP</p><h2>Chi manca dalla raccolta?</h2><p>I membri VIP possono suggerire nuovi personaggi. Le proposte vengono controllate e raccolte per i successivi aggiornamenti editoriali.</p><Link href="/vip-zone">Entra nella VIP Zone →</Link></div></section>;
  return <section className="codex-suggestion"><header><img src="/brand/icons/lorewise-vip-official-v1.webp" alt="" width="1024" height="1024" /><div><p className="eyebrow">Proposte al Codex · LoreWise VIP</p><h2>Proponi un personaggio assente.</h2><p>La richiesta entra nella coda editoriale. Prima della pubblicazione controlleremo fonti, continuità e disponibilità del materiale; le nuove schede arriveranno in aggiornamenti periodici.</p></div></header>
    <form onSubmit={(event) => void submit(event)}><label>Personaggio<input name="character" minLength={2} maxLength={90} required /></label><label>Opera o universo<input name="universe" minLength={2} maxLength={90} required /></label><label className="codex-suggestion-reason">Perché dovrebbe entrare nel Codex?<textarea name="reason" minLength={10} maxLength={600} rows={4} required /></label><button type="submit" disabled={busy}>{busy ? "Invio…" : "Invia la proposta"}</button></form>
    {message ? <p className="codex-suggestion-message" role="status">{message}</p> : null}
    {suggestions.length ? <div className="codex-suggestion-history"><h3>Le tue proposte</h3><ol>{suggestions.map((item) => <li key={item.id}><div><strong>{item.character}</strong><span>{item.universe}</span></div><small>{item.status === "submitted" ? "Ricevuta" : item.status}</small></li>)}</ol></div> : null}
  </section>;
}
