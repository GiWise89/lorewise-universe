"use client";

import Link from "next/link";
import { useId, useState, type FormEvent } from "react";
import type { NewsletterTopic } from "@/lib/newsletter";
import styles from "./NewsletterSignup.module.css";

type NewsletterSignupProps = {
  variant: "cronache" | "avvisami";
  /** Argomento dell’iscrizione: “cronache” per la lettera settimanale, “avvisami:<codice>” per un singolo avviso. */
  topic?: NewsletterTopic;
  tone?: "light" | "dark";
  compact?: boolean;
  headingLevel?: 2 | 3;
  title?: string;
  description?: string;
  className?: string;
};

type SubmitState = "idle" | "loading" | "success" | "error";

export function NewsletterSignup({ variant, topic = "cronache", tone = "dark", compact = false, headingLevel = 2, title, description, className }: NewsletterSignupProps) {
  const id = useId();
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [state, setState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");
  const isCronache = variant === "cronache";
  const Heading = headingLevel === 3 ? "h3" : "h2";
  const heading = title ?? (isCronache ? "Le Cronache del lunedì" : "Avvisami quando esce");
  const intro = description ?? (!isCronache
    ? "Lascia l’email: ti scriveremo una sola volta, quando sarà disponibile. Nessun’altra comunicazione."
    : compact
      ? "Ogni lunedì le novità dal Nexus, direttamente nella posta."
      : "Ogni lunedì una lettera dal Nexus: nuove uscite, giochi in sviluppo, arte e appuntamenti. Niente spam, ti disiscrivi con un clic.");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "loading") return;
    if (!consent) { setState("error"); setMessage("Per continuare accetta l’informativa privacy."); return; }
    setState("loading"); setMessage("");
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, topic, consent, website }),
      });
      const body = await response.json().catch(() => ({})) as { message?: string; error?: string };
      if (!response.ok) throw new Error(body.error || "Iscrizione non riuscita. Riprova tra poco.");
      setState("success");
      setMessage(body.message || "Controlla la posta per confermare l’iscrizione.");
      setEmail(""); setConsent(false);
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Iscrizione non riuscita. Riprova tra poco.");
    }
  }

  const rootClass = [styles.root, tone === "light" ? styles.light : styles.dark, compact ? styles.compact : "", isCronache ? styles.cronache : styles.avvisami, className ?? ""].filter(Boolean).join(" ");

  return <section className={rootClass} aria-labelledby={`${id}-title`}>
    <div className={styles.copy}>
      <p className={styles.eyebrow}>{isCronache ? "Newsletter settimanale" : "Avviso di uscita"}</p>
      <Heading id={`${id}-title`} className={styles.title}>{heading}</Heading>
      <p className={styles.intro}>{intro}</p>
    </div>
    {state === "success" ? <p className={styles.success} role="status">{message}</p> : <form className={styles.form} onSubmit={(event) => void submit(event)} aria-describedby={message ? `${id}-message` : undefined}>
      <div className={styles.field}>
        <label htmlFor={`${id}-email`}>Indirizzo email</label>
        <div className={styles.row}>
          <input id={`${id}-email`} name="email" type="email" inputMode="email" autoComplete="email" required maxLength={254} placeholder="nome@esempio.it" value={email} onChange={(event) => setEmail(event.target.value)} disabled={state === "loading"} />
          <button type="submit" disabled={state === "loading"}>{state === "loading" ? "Invio…" : isCronache ? "Iscriviti" : "Avvisami"}</button>
        </div>
      </div>
      <div className={styles.trap} aria-hidden="true">
        <label htmlFor={`${id}-website`}>Lascia vuoto questo campo</label>
        <input id={`${id}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} />
      </div>
      <label className={styles.consent} htmlFor={`${id}-consent`}>
        <input id={`${id}-consent`} name="consent" type="checkbox" required checked={consent} onChange={(event) => setConsent(event.target.checked)} disabled={state === "loading"} />
        <span>Ho letto l’<Link href="/privacy">informativa privacy</Link> e {isCronache ? "voglio ricevere Le Cronache del lunedì" : "acconsento a ricevere questo avviso"}. Riceverai un’email per confermare.</span>
      </label>
      {state === "error" ? <p id={`${id}-message`} className={styles.error} role="alert">{message}</p> : null}
    </form>}
  </section>;
}
