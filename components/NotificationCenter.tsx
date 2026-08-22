"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Item = { id: string; scope: "personal" | "admin"; type: string; title: string; message: string; targetUrl: string; createdAt: string; readAt: string | null };

function date(value: string) {
  const normalized = /Z$|[+-]\d\d:\d\d$/.test(value) ? value : `${value.replace(" ", "T")}Z`;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? value : new Intl.DateTimeFormat("it-IT", { dateStyle: "medium", timeStyle: "short" }).format(parsed);
}

export function NotificationCenter() {
  const [items, setItems] = useState<Item[]>([]);
  const [unread, setUnread] = useState(0);
  const [message, setMessage] = useState("Caricamento…");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch("/api/notifications", { cache: "no-store", headers: { accept: "application/json" } });
    const body = await response.json() as { notifications?: Item[]; unreadCount?: number; error?: string };
    if (!response.ok) throw new Error(body.error || "Notifiche non disponibili.");
    setItems(body.notifications ?? []);
    setUnread(body.unreadCount ?? 0);
    setMessage("");
  }, []);

  useEffect(() => {
    let active = true;
    void fetch("/api/notifications", { cache: "no-store", headers: { accept: "application/json" } })
      .then(async (response) => {
        const body = await response.json() as { notifications?: Item[]; unreadCount?: number; error?: string };
        if (!response.ok) throw new Error(body.error || "Notifiche non disponibili.");
        if (active) {
          setItems(body.notifications ?? []);
          setUnread(body.unreadCount ?? 0);
          setMessage("");
        }
      })
      .catch((error: Error) => { if (active) setMessage(error.message); });
    return () => { active = false; };
  }, []);

  async function update(action: "read" | "read_all" | "dismiss" | "dismiss_read", item?: Item) {
    setBusy(true);
    try {
      const response = await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, id: item?.id, scope: item?.scope }) });
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error || "Aggiornamento non riuscito.");
      await load();
      window.dispatchEvent(new CustomEvent("lorewise:notifications-updated"));
    } catch (error) { setMessage(error instanceof Error ? error.message : "Aggiornamento non riuscito."); }
    finally { setBusy(false); }
  }

  return <main className="notifications-page">
    <section className="shell notifications-hero"><p className="eyebrow">Il tuo LoreWise ID</p><h1>Notifiche</h1><p>Risposte, reazioni e comunicazioni importanti raccolte in un solo posto.</p><strong>{unread}<span>da leggere</span></strong></section>
    <section className="shell notifications-panel" aria-labelledby="notification-list-title">
      <header><div><p className="eyebrow">Aggiornamenti personali</p><h2 id="notification-list-title">La tua attività recente</h2></div><div><button type="button" disabled={busy || unread === 0} onClick={() => void update("read_all")}>Segna tutte come lette</button><button type="button" disabled={busy || !items.some((item) => item.readAt)} onClick={() => void update("dismiss_read")}>Rimuovi quelle lette</button></div></header>
      {message ? <p className="notifications-message" role="status">{message}</p> : null}
      {items.length ? <ol>{items.map((item) => <li key={`${item.scope}:${item.id}`} className={item.readAt ? "is-read" : "is-unread"}><span className="notification-symbol" aria-hidden="true">{item.type === "comment_like" ? "♥" : item.type === "reply" ? "↩" : "◆"}</span><div><small>{item.scope === "admin" ? "Amministrazione" : "Community"} · {date(item.createdAt)}</small><strong>{item.title}</strong><p>{item.message}</p></div><div><Link href={item.targetUrl} onClick={() => { if (!item.readAt) void update("read", item); }}>Apri</Link>{!item.readAt ? <button type="button" disabled={busy} onClick={() => void update("read", item)}>Segna letta</button> : null}<button type="button" disabled={busy} onClick={() => void update("dismiss", item)}>Rimuovi</button></div></li>)}</ol> : !message ? <p className="notifications-empty">Non ci sono notifiche da mostrare.</p> : null}
    </section>
  </main>;
}
