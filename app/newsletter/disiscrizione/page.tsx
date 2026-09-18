import type { Metadata } from "next";
import { NewsletterUnsubscribePanel } from "@/components/NewsletterUnsubscribePanel";
import styles from "@/components/NewsletterStatus.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Annulla iscrizione | LoreWise Universe", robots: { index: false, follow: false } };

export default async function NewsletterUnsubscribePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  return <main className={styles.page}><NewsletterUnsubscribePanel token={token} /></main>;
}
