import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { CodexIndex } from "@/components/CodexIndex";
import { codexCategories, codexEntries } from "@/lib/codex";
import { createCodexIndexEntries } from "@/lib/codexIndex";
import { UniverseGuide } from "@/components/UniverseGuide";
import { CodexSuggestionForm } from "@/components/CodexSuggestionForm";

export const metadata: Metadata = {
  title: "LoreWise Codex",
  description: "Enciclopedia dei personaggi e degli universi di LoreWise Universe.",
};

export default function EncyclopediaPage() {
  const originalEntries = codexEntries.filter((entry) => entry.catalog.origin === "giwise-original");
  const documentedEntries = codexEntries.filter((entry) => entry.catalog.origin !== "giwise-original");
  const documentedIndexEntries = createCodexIndexEntries(documentedEntries);
  return <main className="codex-home">
    <section className="codex-home-hero">
      <div className="shell codex-home-hero-grid">
        <div className="codex-home-copy">
          <p className="eyebrow">Archivio delle Convergenze</p>
          <h1>LoreWise<br />Codex.</h1>
          <p className="codex-home-subtitle">Enciclopedia dei personaggi e degli universi</p>
          <p>Identità, biografie, continuità, relazioni e fonti riunite in un archivio editoriale pensato per distinguere il canone dalle interpretazioni.</p>
          <a href="#percorsi-codex">Esplora i dossier</a>
        </div>
        <aside className="codex-home-signature">
          <Image className="codex-home-scene" src="/backgrounds/codex-archive-convergences-scene-v1.webp" alt="Archivio delle Convergenze, con il grande Codex aperto fra biblioteche, astri e correnti luminose" width={1833} height={858} priority unoptimized />
          <Image className="codex-home-emblem" src="/codex/seals/lorewise-codex-emblem-v1.webp" alt="Emblema LoreWise Codex con libro aperto e simbolo triangolare GiWise" width={1206} height={1305} priority unoptimized />
          <div className="codex-home-manifesto" aria-label="Principi editoriali del LoreWise Codex">
            <span>01</span><strong>Lore originale sempre dichiarata.</strong>
            <span>02</span><strong>Spoiler sotto controllo.</strong>
            <span>03</span><strong>Fonti collegate ai fatti.</strong>
          </div>
        </aside>
      </div>
    </section>

    <section id="percorsi-codex" className="shell codex-library-portals" aria-labelledby="codex-library-title">
      <header><p className="eyebrow">Due archivi distinti</p><h2 id="codex-library-title">Il canone GiWise non si mescola agli altri universi.</h2></header>
      <div className="codex-library-routes">
        <Link className="codex-library-route" href="/enciclopedia/originali-giwise">
          <span className="codex-library-emblem"><Image src="/codex/seals/giwise-original-seal-v1.webp" alt="Sigillo GiWise Original" width={320} height={320} /></span>
          <span className="codex-library-copy"><small>01 · Archivio d’autore · {originalEntries.length} dossier</small><strong>Originali GiWise</strong><span>Personaggi, fazioni e lore creati da GiWise Studio, custoditi in un archivio autonomo.</span><b>Entra nell’archivio originale <i aria-hidden="true">→</i></b></span>
        </Link>
        <a className="codex-library-route" href="#indice-codex">
          <span className="codex-library-emblem"><Image src="/codex/seals/lorewise-codex-emblem-v1.webp" alt="Emblema LoreWise Codex" width={1206} height={1305} unoptimized /></span>
          <span className="codex-library-copy"><small>02 · Enciclopedia documentata · {documentedEntries.length} dossier</small><strong>Personaggi e universi</strong><span>Opere esterne e adattamenti catalogati con fonti, versioni e continuità sempre separate.</span><b>Consulta l’enciclopedia <i aria-hidden="true">→</i></b></span>
        </a>
      </div>
    </section>

    <section className="shell codex-category-ledger" aria-labelledby="codex-category-title">
      <header><p className="eyebrow">Percorsi editoriali</p><h2 id="codex-category-title">Ogni universo trova il proprio indice.</h2></header>
      <ol>{codexCategories.map((category, index) => <li key={category}><Link href={category === "Universi originali GiWise Studio" ? "/enciclopedia/originali-giwise" : `/enciclopedia?categoria=${encodeURIComponent(category)}#indice-codex`}><span>{String(index + 1).padStart(2, "0")}</span><strong>{category}</strong>{category === "Universi originali GiWise Studio" && <b>Archivio separato</b>}</Link></li>)}</ol>
    </section>

    <div id="proposte-codex-vip" className="shell"><CodexSuggestionForm /></div>
    <div id="indice-codex" className="shell"><CodexIndex entries={documentedIndexEntries} eyebrow="Universi documentati" title="Personaggi e opere esterne." /></div>
    <UniverseGuide current="LoreWise Codex" items={[
      { href: "/enciclopedia/originali-giwise", label: "Originali GiWise", description: "Il canone creato e custodito da GiWise Studio." },
      { href: "/giochi", label: "Giochi e app", description: "I mondi interattivi e il loro stato reale." },
      { href: "/dove-nascono-i-mondi", label: "Dietro le quinte", description: "Dal primo segno al progetto completo." },
    ]} />
  </main>;
}
