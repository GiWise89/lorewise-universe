import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { NexusChroniclesFeed } from "@/components/NexusChroniclesFeed";
import { nexusChronicles } from "@/lib/nexusChronicles";

export const metadata: Metadata = {
  title: "Cronache del Nexus",
  description: "Opere, giochi, dossier e nuovi frammenti del LoreWise Universe.",
};

export default function NexusChroniclesPage() {
  return <main className="nexus-chronicles-page">
    <section className="nexus-chronicles-hero" aria-labelledby="nexus-chronicles-title">
      <div className="shell nexus-chronicles-hero-inner">
        <div className="nexus-chronicles-seal"><Image src="/brand/lorewise-wax-seal-v1.webp" alt="Sigillo del LoreWise Universe" width={1536} height={1536} priority unoptimized /></div>
        <div>
          <p className="eyebrow">Il giornale ufficiale del LoreWise Universe</p>
          <h1 id="nexus-chronicles-title">Cronache del Nexus</h1>
          <p>Opere, giochi, dossier e nuovi frammenti dell’universo. Ogni cronaca racconta un cambiamento reale, mostra ciò che possiamo anticipare e protegge le sorprese che devono ancora arrivare.</p>
        </div>
        <aside><span>Edizione corrente</span><strong>Prima trasmissione</strong><small>{nexusChronicles.length} cronaca pubblicata</small></aside>
      </div>
    </section>

    <section className="nexus-chronicles-archive shell" aria-labelledby="nexus-archive-title">
      <header>
        <div><p className="eyebrow">Archivio in espansione</p><h2 id="nexus-archive-title">Cosa sta accadendo nel Nexus.</h2></div>
      </header>
      <NexusChroniclesFeed chronicles={nexusChronicles} />
    </section>

    <section className="nexus-chronicles-membership" aria-labelledby="nexus-membership-title">
      <div className="shell">
        <Image src="/brand/icons/lorewise-vip-official-v1.webp" alt="" width={1024} height={1024} unoptimized />
        <div><p className="eyebrow">Oltre la cronaca pubblica</p><h2 id="nexus-membership-title">Vuoi entrare dietro le porte riservate?</h2><p>Le Cronache mostrano ciò che si muove nell’universo. LoreWise VIP apre dossier, anteprime, vantaggi e occasioni di partecipazione dedicate agli abbonati.</p></div>
        <Link href="/abbonamento">Scopri il Pass <span aria-hidden="true">→</span></Link>
      </div>
    </section>
  </main>;
}
