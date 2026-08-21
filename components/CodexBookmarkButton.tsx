"use client";

import { FormEvent, useState } from "react";
import { saveLocalCodexBookmark } from "@/lib/localCodexBookmarks";

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
      if (!response.ok) {
        if (response.status === 401 || response.status === 503) {
          saveLocalCodexBookmark(slug, collection);
          setMessage("Salvato su questo dispositivo. Accedi al LoreWise ID per sincronizzarlo.");
          return;
        }
        throw new Error(payload.error || "Salvataggio non disponibile.");
      }
      saveLocalCodexBookmark(slug, collection);
      setMessage("Salvato nel tuo Codex");
    } catch (error) {
      saveLocalCodexBookmark(slug, collection);
      setMessage(error instanceof Error
        ? `Salvato su questo dispositivo. Sincronizzazione non riuscita: ${error.message}`
        : "Salvato su questo dispositivo.");
    } finally { setBusy(false); }
  }

  return <form className="codex-bookmark-control" onSubmit={(event) => void save(event)}>
    <label htmlFor={`collection-${slug}`}>Raccolta personale</label>
    <input id={`collection-${slug}`} value={collection} onChange={(event) => setCollection(event.target.value)} maxLength={40} required />
    <button type="submit" disabled={busy}>Salva nel Codex</button>
    {message ? <small role="status">{message}</small> : null}
  </form>;
}
