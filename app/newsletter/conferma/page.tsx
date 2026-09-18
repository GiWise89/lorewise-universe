import type { Metadata } from "next";
import Link from "next/link";
import styles from "@/components/NewsletterStatus.module.css";
import { env } from "@/lib/netlifyRuntime";
import { isNewsletterToken, isNewsletterTopic, newsletterTopicLabel, type NewsletterConfirmationOutcome } from "@/lib/newsletter";
import { confirmNewsletterSubscription } from "@/lib/newsletterServer";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Conferma iscrizione | LoreWise Universe", robots: { index: false, follow: false } };

type Outcome = NewsletterConfirmationOutcome | "unavailable";

const copy: Record<Outcome, { eyebrow: string; title: string; body: string }> = {
  confirm: { eyebrow: "Iscrizione confermata", title: "Benvenuto a bordo.", body: "Il tuo indirizzo è confermato. Ti scriveremo soltanto per quello che hai scelto, senza condividere l’email con altri." },
  already_confirmed: { eyebrow: "Già confermata", title: "Sei già dei nostri.", body: "Questa iscrizione era già attiva: non devi fare altro." },
  expired: { eyebrow: "Link scaduto", title: "Il link è scaduto.", body: "Per sicurezza i link di conferma durano 48 ore. Iscriviti di nuovo dal sito e riceverai un messaggio aggiornato." },
  invalid: { eyebrow: "Link non valido", title: "Questo link non funziona.", body: "Il link potrebbe essere incompleto, già sostituito da uno più recente oppure appartenere a un’iscrizione annullata." },
  unavailable: { eyebrow: "Servizio non disponibile", title: "Riprova tra poco.", body: "Non è stato possibile confermare l’iscrizione in questo momento. Il link resta valido: riaprilo più tardi." },
};

async function confirm(token: string) {
  if (!isNewsletterToken(token)) return { outcome: "invalid" as Outcome, topic: null, unsubscribeToken: null };
  const database = (env as unknown as { DB?: D1Database }).DB;
  if (!database) return { outcome: "unavailable" as Outcome, topic: null, unsubscribeToken: null };
  try {
    return await confirmNewsletterSubscription(database, token);
  } catch {
    return { outcome: "unavailable" as Outcome, topic: null, unsubscribeToken: null };
  }
}

export default async function NewsletterConfirmPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  const result = await confirm(token);
  const text = copy[result.outcome];
  const label = result.topic && isNewsletterTopic(result.topic) ? newsletterTopicLabel(result.topic) : null;
  const confirmed = result.outcome === "confirm" || result.outcome === "already_confirmed";
  return <main className={styles.page}>
    <section className={styles.card} aria-labelledby="newsletter-confirm-title">
      <p className={styles.eyebrow}>{text.eyebrow}</p>
      <h1 id="newsletter-confirm-title">{text.title}</h1>
      <p>{text.body}</p>
      {confirmed && label ? <p className={styles.topic}>Iscrizione: <strong>{label}</strong></p> : null}
      <div className={styles.actions}>
        {result.topic === "cronache" ? <Link className={styles.primary} href="/cronache-del-nexus">Apri le novità dal Nexus</Link> : <Link className={styles.primary} href="/giochi">Esplora i giochi</Link>}
        <Link href="/">Torna alla home</Link>
      </div>
      {confirmed && result.unsubscribeToken ? <p className={styles.fine}>Hai cambiato idea? <Link href={`/newsletter/disiscrizione?token=${encodeURIComponent(result.unsubscribeToken)}`}>Annulla l’iscrizione</Link> in qualsiasi momento.</p> : null}
    </section>
  </main>;
}
