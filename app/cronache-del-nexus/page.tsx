import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { NexusChroniclesFeed } from "@/components/NexusChroniclesFeed";
import { NexusNewsSpotlight } from "@/components/NexusNewsSpotlight";
import { chroniclePanelFromQuery } from "@/lib/nexusChroniclePanels";
import { getNexusChronicles, nexusChronicleCategoryFromQuery, nexusChronicleCategories } from "@/lib/nexusChronicles";

export const metadata: Metadata = {
  title: "Cronache del Nexus",
  description: "Opere, giochi, dossier e nuovi frammenti del LoreWise Universe.",
};

export const dynamic = "force-dynamic";

type NexusNewsArea = "evidenza" | "archivio" | "categorie";

function newsAreaFromQuery(value?: string): NexusNewsArea {
  return value === "archivio" || value === "categorie" ? value : "evidenza";
}

export default async function NexusChroniclesPage({ searchParams }: { searchParams: Promise<{ anteprima?: string; sezione?: string; novita?: string; categoria?: string; cronaca?: string; vista?: string }> }) {
  const params = await searchParams;
  const localCalendarPreview = params.anteprima === "tutte"
    && (process.env.NODE_ENV !== "production" || process.env.LOREWISE_LOCAL_CALENDAR_PREVIEW === "true");
  const editorialDate = localCalendarPreview ? new Date("2026-12-07T12:00:00+01:00") : new Date();
  const releasedChronicles = getNexusChronicles(editorialDate);
  const nexusChronicles = localCalendarPreview
    ? releasedChronicles.map((chronicle) => chronicle.promotion.theme === "holiday"
      ? {
          ...chronicle,
          promotion: {
            ...chronicle.promotion,
            href: `${chronicle.promotion.href}${chronicle.promotion.href.includes("?") ? "&" : "?"}anteprima=feste`,
          },
        }
      : chronicle)
    : releasedChronicles;
  const currentChronicle = nexusChronicles[0];
  const initialPanel = chroniclePanelFromQuery(params.sezione);
  const initialCategory = nexusChronicleCategoryFromQuery(params.categoria);
  const activeArea = newsAreaFromQuery(params.vista);
  return <main className="nexus-chronicles-page">
    <section className="nexus-chronicles-hero" aria-labelledby="nexus-chronicles-title">
      <div className="shell nexus-chronicles-hero-inner">
        <div className="nexus-chronicles-seal"><Image src="/brand/lorewise-wax-seal-v1.webp" alt="Sigillo del LoreWise Universe" width={1536} height={1536} priority unoptimized /></div>
        <div>
          <p className="eyebrow">Il giornale ufficiale del LoreWise Universe</p>
          <h1 id="nexus-chronicles-title">Cronache del Nexus</h1>
          <p>Opere, giochi, dossier e nuovi frammenti dell’universo. Ogni cronaca racconta un cambiamento reale, mostra ciò che possiamo anticipare e protegge le sorprese che devono ancora arrivare.</p>
        </div>
        <aside><span>Edizione corrente</span><strong>{currentChronicle?.issue ?? "In preparazione"}</strong><small>{nexusChronicles.length} {nexusChronicles.length === 1 ? "cronaca pubblicata" : "cronache pubblicate"}</small></aside>
      </div>
    </section>

    <nav className="nexus-news-directory shell" aria-label="Indice delle Novità dal Nexus">
      <header><p className="eyebrow">Indice delle Novità</p><h2>Scegli cosa vuoi scoprire.</h2><p>Le storie in evidenza, tutte le Cronache e i singoli argomenti sono raccolti in percorsi distinti e facili da ritrovare.</p></header>
      <div>
        <Link href="/cronache-del-nexus?vista=evidenza#novita-in-primo-piano" aria-current={activeArea === "evidenza" ? "page" : undefined}><span>01</span><strong>In evidenza</strong><small>Famiglio, vantaggi e giochi</small></Link>
        <Link href="/cronache-del-nexus?vista=archivio#archivio-cronache" aria-current={activeArea === "archivio" ? "page" : undefined}><span>02</span><strong>Tutte le Cronache</strong><small>Dalla più recente alla prima</small></Link>
        <Link href="/cronache-del-nexus?vista=categorie#archivio-cronache" aria-current={activeArea === "categorie" ? "page" : undefined}><span>03</span><strong>Categorie</strong><small>{nexusChronicleCategories.length - 1} percorsi tematici</small></Link>
      </div>
    </nav>

    {activeArea === "evidenza" ? <NexusNewsSpotlight panel={params.novita} /> : null}

    {activeArea !== "evidenza" ? <section className="nexus-chronicles-archive shell" id="archivio-cronache" aria-labelledby="nexus-archive-title">
      <header>
        <div><p className="eyebrow">{activeArea === "categorie" ? "Percorsi tematici" : "Archivio ordinato"}</p><h2 id="nexus-archive-title">{activeArea === "categorie" ? "Scegli un argomento." : "Tutte le Cronache del Nexus."}</h2><p>{activeArea === "categorie" ? "Apri una categoria e consulta soltanto le notizie che ne fanno parte." : "Scegli un’edizione dalla più recente alla prima e leggine una alla volta."}</p></div>
      </header>
      <NexusChroniclesFeed chronicles={nexusChronicles} initialPanel={initialPanel} initialCategory={activeArea === "categorie" ? initialCategory : "all"} initialChronicleId={params.cronaca} showCategories={activeArea === "categorie"} />
    </section> : null}

    <section className="nexus-chronicles-membership" aria-labelledby="nexus-membership-title">
      <div className="shell">
        <Image src="/brand/icons/lorewise-vip-official-v1.webp" alt="" width={1024} height={1024} unoptimized />
        <div><p className="eyebrow">Oltre la cronaca pubblica</p><h2 id="nexus-membership-title">Vuoi entrare dietro le porte riservate?</h2><p>Le Cronache mostrano ciò che si muove nell’universo. LoreWise VIP apre dossier, anteprime, vantaggi e occasioni di partecipazione dedicate agli abbonati.</p></div>
        <Link href="/abbonamento">Scopri il Pass <span aria-hidden="true">→</span></Link>
      </div>
    </section>
  </main>;
}
