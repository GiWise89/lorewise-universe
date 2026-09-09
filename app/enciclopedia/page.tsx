import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { CodexIndex } from "@/components/CodexIndex";
import { codexEntries } from "@/lib/codex";
import { createCodexIndexEntries, createCodexIndexFacets } from "@/lib/codexIndex";
import { UniverseGuide } from "@/components/UniverseGuide";

const description = "LoreWise Codex: dossier di personaggi e universi con identità, biografie, relazioni, continuità e fonti, separando il canone GiWise dagli universi documentati.";

export const metadata: Metadata = {
  title: "LoreWise Codex · Enciclopedia di personaggi e universi",
  description,
  alternates: { canonical: "/enciclopedia" },
  openGraph: {
    title: "LoreWise Codex · Enciclopedia di personaggi e universi",
    description,
    type: "website",
    url: "/enciclopedia",
    siteName: "LoreWise Universe",
    locale: "it_IT",
    images: [{ url: "/codex/seals/lorewise-codex-emblem-v1.webp", alt: "Emblema LoreWise Codex" }],
  },
  twitter: { card: "summary_large_image", title: "LoreWise Codex", description, images: ["/codex/seals/lorewise-codex-emblem-v1.webp"] },
};

export default function EncyclopediaPage() {
  const indexEntries = createCodexIndexEntries(codexEntries)
    .sort((first, second) => first.displayTitle.localeCompare(second.displayTitle, "it", { sensitivity: "base" }));
  const originalCount = codexEntries.filter((entry) => entry.catalog.origin === "giwise-original").length;
  const documentedCount = codexEntries.length - originalCount;

  return <main className="codex-home">
    <section className="codex-home-hero">
      <div className="shell codex-home-hero-grid">
        <div className="codex-home-copy">
          <p className="eyebrow">Archivio delle Convergenze</p>
          <h1>LoreWise Codex.</h1>
          <p className="codex-home-subtitle">Ogni personaggio ha una traccia.</p>
          <p>Cerca subito per nome, universo oppure opera. Il canone originale GiWise e i dossier documentati restano distinti anche quando vengono esplorati nello stesso indice.</p>
          <a className="codex-home-search-entry" href="#codex-search"><span aria-hidden="true">⌕</span><strong>Cerca nel Codex</strong><small>{codexEntries.length} dossier disponibili</small></a>
        </div>
        <aside className="codex-home-signature">
          <Image className="codex-home-scene" src="/backgrounds/codex-archive-convergences-scene-v1.webp" alt="Archivio delle Convergenze, con il grande Codex aperto fra biblioteche, astri e correnti luminose" width={1833} height={858} priority unoptimized />
          <Image className="codex-home-emblem" src="/codex/seals/lorewise-codex-emblem-v1.webp" alt="Emblema LoreWise Codex con libro aperto e simbolo triangolare GiWise" width={1206} height={1305} priority unoptimized />
          <div className="codex-home-manifesto" aria-label="Cosa trovi nel LoreWise Codex">
            <span>01</span><strong>Lore originale dichiarata.</strong>
            <span>02</span><strong>Spoiler sotto controllo.</strong>
            <span>03</span><strong>Fonti collegate ai fatti.</strong>
          </div>
        </aside>
      </div>
    </section>

    <div id="indice-codex" className="shell codex-index-stage"><CodexIndex entries={indexEntries.slice(0, 6)} totalEntries={indexEntries.length} originalTotal={originalCount} documentedTotal={documentedCount} facets={createCodexIndexFacets(indexEntries)} description={`${originalCount} dossier originali e ${documentedCount} dossier documentati, sempre riconoscibili.`} /></div>

    <section className="shell codex-secondary-paths" aria-labelledby="codex-secondary-title">
      <header><p className="eyebrow">Percorsi specialistici</p><h2 id="codex-secondary-title">Quando vuoi entrare più a fondo.</h2></header>
      <div>
        <Link href="/enciclopedia/originali-giwise"><Image src="/codex/seals/giwise-original-seal-v1.webp" alt="" width={320} height={320} /><span><small>Archivio autonomo</small><strong>Originali GiWise</strong><span>Esplora soltanto personaggi, fazioni e lore creati da GiWise Studio.</span><b>Apri l’archivio d’autore →</b></span></Link>
        <Link href="/enciclopedia/proposte-vip"><Image src="/brand/icons/lorewise-vip-official-v1.webp" alt="" width={1024} height={1024} unoptimized /><span><small>Partecipazione riservata</small><strong>Proposte VIP</strong><span>Suggerisci un futuro dossier senza interrompere la consultazione principale.</span><b>Apri lo spazio proposte →</b></span></Link>
      </div>
    </section>

    <UniverseGuide current="LoreWise Codex" items={[
      { href: "/mondi", label: "Mondi", description: "Torna alle tre correnti narrative del LoreWise Universe." },
      { href: "/giochi", label: "Giochi e app", description: "I mondi interattivi e il loro stato reale." },
      { href: "/dove-nascono-i-mondi", label: "Dietro le quinte", description: "Dal primo segno al progetto completo." },
    ]} />
  </main>;
}
