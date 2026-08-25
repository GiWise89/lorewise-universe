"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";

type Suggestion = {
  id: string;
  character: string;
  universe: string;
  reason: string;
  status: string;
  createdAt: string;
};

const LOCAL_KEY = "lorewise-vip-codex-suggestions";
const STATUS_LABELS: Record<string, string> = {
  submitted: "Ricevuta",
  reviewing: "In valutazione",
  accepted: "Accolta",
  published: "Pubblicata",
  rejected: "Non programmata",
};

function localSuggestions() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(LOCAL_KEY) || "[]") as unknown;
    return Array.isArray(parsed) ? parsed as Suggestion[] : [];
  } catch {
    return [];
  }
}

function formattedDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function CodexSuggestionForm() {
  const [access, setAccess] = useState<"loading" | "vip" | "locked">("loading");
  const [localOnly, setLocalOnly] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/codex-suggestions", {
      cache: "no-store",
      headers: { accept: "application/json" },
      signal: controller.signal,
    })
      .then(async (response) => {
        const body = await response.json() as { localOnly?: boolean; suggestions?: Suggestion[] };
        if (!response.ok) {
          setAccess("locked");
          return;
        }
        setAccess("vip");
        setLocalOnly(Boolean(body.localOnly));
        setSuggestions(body.localOnly ? localSuggestions() : body.suggestions || []);
      })
      .catch(() => setAccess("locked"));
    return () => controller.abort();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setMessageTone("success");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const payload = {
      character: form.get("character"),
      universe: form.get("universe"),
      reason: form.get("reason"),
    };
    try {
      const response = await fetch("/api/codex-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json", accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json() as { error?: string; localOnly?: boolean; suggestion?: Suggestion };
      if (!response.ok || !body.suggestion) throw new Error(body.error || "Proposta non registrata.");
      const next = [body.suggestion, ...suggestions];
      setSuggestions(next);
      if (body.localOnly || localOnly) window.localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
      formElement.reset();
      setMessage(body.localOnly ? "Proposta salvata nella prova locale." : "Proposta inviata alla coda editoriale del Codex.");
    } catch (error) {
      setMessageTone("error");
      setMessage(error instanceof Error ? error.message : "Proposta non registrata.");
    } finally {
      setBusy(false);
    }
  }

  if (access === "loading") return <section className="codex-suggestion codex-suggestion-loading" aria-live="polite">Verifica dell’accesso VIP…</section>;
  if (access === "locked") return <section className="codex-suggestion codex-suggestion-locked">
    <div><p className="eyebrow">Accesso riservato</p><h2>Serve un LoreWise Pass attivo.</h2><p>Le proposte editoriali e il loro storico personale sono disponibili ai membri VIP idonei.</p><a href="/vip">Scopri LoreWise VIP →</a></div>
  </section>;

  return <section className="codex-suggestion" aria-labelledby="codex-suggestion-title">
    <header className="codex-suggestion-intro">
      <Image src="/brand/icons/lorewise-vip-official-v1.webp" alt="" width={1024} height={1024} unoptimized />
      <div>
        <p className="eyebrow">Partecipazione editoriale · Solo LoreWise VIP</p>
        <h2 id="codex-suggestion-title">Manca un personaggio?</h2>
        <p>Segnalaci chi vorresti trovare nel Codex. Controlleremo fonti, continuità e materiale disponibile; le proposte accolte entreranno nei prossimi aggiornamenti.</p>
      </div>
    </header>

    <ol className="codex-suggestion-flow" aria-label="Come funziona la proposta">
      <li><span>01</span><div><strong>Controlla il Codex</strong><p>Cerca prima il personaggio nell’indice.</p></div></li>
      <li><span>02</span><div><strong>Invia la proposta</strong><p>Indica nome, universo e perché ti interessa.</p></div></li>
      <li><span>03</span><div><strong>Segui lo stato</strong><p>La richiesta resta visibile nel tuo storico VIP.</p></div></li>
    </ol>

    <form onSubmit={(event) => void submit(event)}>
      <label><span>Nome del personaggio</span><input name="character" minLength={2} maxLength={90} placeholder="Es. nome completo" autoComplete="off" required /></label>
      <label><span>Opera o universo</span><input name="universe" minLength={2} maxLength={90} placeholder="Es. serie, film, gioco o manga" autoComplete="off" required /></label>
      <label className="codex-suggestion-reason"><span>Perché dovrebbe entrare nel Codex?</span><textarea name="reason" minLength={10} maxLength={600} rows={5} placeholder="Raccontaci cosa rende interessante questo personaggio." required /></label>
      <div className="codex-suggestion-submit">
        <p>La proposta non garantisce la pubblicazione: ogni scheda viene verificata prima di entrare nell’archivio.</p>
        <button type="submit" disabled={busy}>{busy ? "Invio…" : "Invia la proposta"}</button>
      </div>
    </form>

    {message ? <p className={`codex-suggestion-message is-${messageTone}`} role="status" aria-live="polite">{message}</p> : null}

    {suggestions.length ? <section className="codex-suggestion-history" aria-labelledby="codex-suggestion-history-title">
      <header><div><p className="eyebrow">Archivio personale</p><h3 id="codex-suggestion-history-title">Le tue proposte</h3></div></header>
      <ol>{suggestions.map((item) => <li key={item.id}>
        <div><strong>{item.character}</strong><span>{item.universe}</span></div>
        <div className="codex-suggestion-status"><small>{STATUS_LABELS[item.status] || item.status}</small><time dateTime={item.createdAt}>{formattedDate(item.createdAt)}</time></div>
      </li>)}</ol>
    </section> : null}
  </section>;
}
