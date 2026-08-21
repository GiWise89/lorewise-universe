"use client";

import { FormEvent, useState } from "react";

export function CodexBookmarkButton({ slug }: { slug: string }) {
  const [collection, setCollection] = useState("Preferiti");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      const response = await fetch("/api/account/benefits", {
        method: "POST", headers: { "Content-Type": "application/json", accept: "application/json" },
        body: JSON.stringify({ action: "bookmark", slug, collection }),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Salvataggio non disponibile.");
      setMessage("Salvato nel tuo Codex");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Salvataggio non disponibile.");
    } finally { setBusy(false); }
  }

  return <form className="codex-bookmark-control" onSubmit={(event) => void save(event)}>
    <label htmlFor={`collection-${slug}`}>Raccolta personale</label>
    <input id={`collection-${slug}`} value={collection} onChange={(event) => setCollection(event.target.value)} maxLength={40} required />
    <button type="submit" disabled={busy}>Salva nel Codex</button>
    {message ? <small role="status">{message}</small> : null}
  </form>;
}
