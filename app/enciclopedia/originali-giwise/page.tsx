import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { CodexIndex } from "@/components/CodexIndex";
import { codexEntries } from "@/lib/codex";
import { createCodexIndexEntries } from "@/lib/codexIndex";

export const metadata: Metadata = {
  title: "Originali GiWise · LoreWise Codex",
  description: "Archivio autonomo dei personaggi e degli universi originali creati da GiWise Studio.",
};

export default function GiWiseOriginalsPage() {
  const entries = codexEntries.filter((entry) => entry.catalog.origin === "giwise-original");
  const indexEntries = createCodexIndexEntries(entries);
  return <main className="codex-home codex-originals-home">
    <section className="codex-originals-hero">
      <div className="shell codex-originals-hero-grid">
        <div>
          <p className="eyebrow">LoreWise Codex · Archivio d’autore</p>
          <h1>Originali<br />GiWise.</h1>
          <p>Un archivio separato dedicato esclusivamente ai personaggi, alle fazioni e alle storie create da GiWise Studio.</p>
          <Link href="/enciclopedia">← Torna all’Enciclopedia</Link>
        </div>
        <figure><Image src="/codex/seals/giwise-original-seal-v1.webp" alt="Sigillo GiWise Original" width={360} height={360} priority /><figcaption>Canone originale · GiWise Studio</figcaption></figure>
      </div>
    </section>
    <div className="shell"><CodexIndex entries={indexEntries} eyebrow="Canone originale" title="Personaggi GiWise Studio." description={`${entries.length} dossier originali, con lore, relazioni, cronologia e materiali del progetto separati dagli universi di terzi.`} /></div>
  </main>;
}
