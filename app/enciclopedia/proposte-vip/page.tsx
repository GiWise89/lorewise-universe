import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CodexSuggestionForm } from "@/components/CodexSuggestionForm";

export const metadata: Metadata = {
  title: "Proposte VIP | LoreWise Codex",
  description: "Spazio editoriale riservato per proporre i prossimi dossier del LoreWise Codex.",
};

export default function CodexVipSuggestionsPage() {
  return <main className="codex-home codex-proposal-page">
    <header className="codex-proposal-hero">
      <div className="shell">
        <Link href="/enciclopedia" className="back-link">← Torna al LoreWise Codex</Link>
        <div>
          <Image src="/brand/icons/lorewise-vip-official-v1.webp" alt="" width={1024} height={1024} priority unoptimized />
          <section>
            <p className="eyebrow">Partecipazione riservata</p>
            <h1>Proposte VIP.</h1>
            <p>Un unico spazio per suggerire nuovi personaggi e seguire lo stato delle richieste editoriali.</p>
          </section>
        </div>
      </div>
    </header>
    <section className="shell codex-proposal-workspace" aria-label="Strumento editoriale Proposte VIP">
      <CodexSuggestionForm />
    </section>
  </main>;
}
