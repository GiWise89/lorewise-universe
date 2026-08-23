import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: {
    title: "LoreWise Universe | Codex, giochi, arte e mondi da esplorare",
    description: "LoreWise Universe di GiWise Studio: esplora il LoreWise Codex, giochi indie, arte originale e il dietro le quinte dei mondi creativi.",
    type: "website",
    url: "/",
    siteName: "LoreWise Universe",
    locale: "it_IT",
    images: [{ url: "/og.webp", width: 1736, height: 909, alt: "LoreWise Universe, l’universo creativo di GiWise Studio" }],
  },
};

const portals = [
  { key: "arte", title: "Arte in vetrina", note: "Opere originali protette da filigrana", href: "/arte", image: "/brand/icons/arte-concept-v1.webp", width: 1224, height: 1285 },
  { key: "commissioni", title: "Commissioni", note: "Un disegno creato per la tua idea", href: "/commissioni", image: "/brand/icons/commissioni-concept-v1.webp", width: 1536, height: 1024 },
  { key: "giochi", title: "Giochi e app", note: "Anteprime e diari di GiWise Studio", href: "/giochi", image: "/brand/icons/giochi-concept-v1.webp", width: 1536, height: 1024 },
  { key: "enciclopedia", title: "Enciclopedia", note: "Personaggi, opere e mondi collegati", href: "/enciclopedia", image: "/brand/icons/enciclopedia-concept-v1.webp", width: 1352, height: 1163 },
  { key: "shop", title: "GiWise Shop", note: "Merch, accessori e collezioni ufficiali", href: "/shop", image: "/brand/icons/shop-concept-v1.webp", width: 1173, height: 1341 },
  { key: "social", title: "Social e assistenza", note: "Contatti, richieste e canali ufficiali", href: "/contatti", image: "/brand/icons/social-assistenza-concept-v1.webp", width: 1536, height: 1024 },
  { key: "diario", title: "Dove nascono i mondi", note: "Bozze, passioni e dietro le quinte", href: "/dove-nascono-i-mondi", image: "/brand/icons/dove-nascono-i-mondi-concept-v1.webp", width: 1024, height: 1024 },
  { key: "vip", title: "LoreWise VIP", note: "Anteprime e contenuti riservati al Pass", href: "/vip-zone", image: "/brand/icons/lorewise-vip-official-v1.webp", width: 1024, height: 1024 },
];

export default function Home() {
  const closingPortals = ["shop", "commissioni", "social"].map((key) => portals.find((portal) => portal.key === key)!);

  return (
    <main className="universe-home">
      <section className="universe-map" aria-label="Mappa di LoreWise Universe">
        <div id="mappa-universo" className="portal-stage shell">
          <div className="universe-orbits" aria-hidden="true">
            <span className="orbit-particle orbit-particle-cyan" />
            <span className="orbit-particle orbit-particle-gold" />
            <span className="orbit-particle orbit-particle-violet" />
          </div>
          <div className="universe-logo">
            <Image src="/brand/lorewise-universe-logo-concept-c.webp" alt="LoreWise Universe, by GiWise Studio" width={1536} height={1024} priority unoptimized />
            <h1>Scegli il tuo ingresso</h1>
          </div>
          {portals.map((portal) => (
            <Link className={`illustrated-portal portal-${portal.key}`} href={portal.href} key={portal.key}>
              <Image src={portal.image} alt="" width={portal.width} height={portal.height} unoptimized />
              <span><strong>{portal.title}</strong><small>{portal.note}</small></span>
            </Link>
          ))}
        </div>
      </section>

      <aside className="studio-ribbon" aria-label="Cronache del Nexus">
        <Link className="studio-ribbon-link" href="/cronache-del-nexus" aria-label="Apri tutte le novità nelle Cronache del Nexus">
          <span className="studio-ribbon-badge"><i aria-hidden="true" /> Novità nell’universo</span>
          <strong className="studio-ribbon-title">Cronache del Nexus</strong>
          <span className="studio-ribbon-action">Apri le novità <b aria-hidden="true">→</b></span>
        </Link>
      </aside>

      <section className="home-story art-story shell" aria-labelledby="art-story-title">
        <div className="home-art-preview" aria-label="Tre opere protette in fase di catalogazione">
          <Image src="/artworks/previews/lw-art-024-preview.jpg" alt="Anteprima protetta LW-ART-024" width={1131} height={1600} unoptimized />
          <Image src="/artworks/previews/lw-art-032-preview.jpg" alt="Anteprima protetta LW-ART-032" width={1128} height={1600} unoptimized />
          <Image src="/artworks/previews/lw-art-018-preview.jpg" alt="Anteprima protetta LW-ART-018" width={1131} height={1600} unoptimized />
        </div>
        <div className="story-copy">
          <p className="eyebrow">Opere Originali in Vendita</p>
          <h2 id="art-story-title">La vetrina non nasconde l’autore.</h2>
          <p>L’archivio protetto riunisce opere originali acquistabili, edizioni riservate agli abbonati e lavori espositivi senza download. Ogni scheda dichiara con chiarezza disponibilità, licenza e modalità di accesso.</p>
          <div className="story-actions"><Link href="/arte">Entra nella galleria <span aria-hidden="true">→</span></Link><Link href="/abbonamento">Scopri Supporter e Collector <span aria-hidden="true">→</span></Link><Link href="/commissioni">Richiedi un’opera su misura <span aria-hidden="true">→</span></Link></div>
        </div>
      </section>

      <section className="game-story" aria-labelledby="game-story-title">
        <div className="shell story-inner">
          <div className="story-copy">
            <p className="eyebrow">GiWise Studio · Diario di sviluppo</p>
            <h2 id="game-story-title">Segui un gioco mentre prende vita.</h2>
            <p>Gameplay, immagini reali, aggiornamenti e stato delle edizioni raccontano ogni progetto senza confondere ciò che è disponibile con ciò che è ancora in sviluppo.</p>
            <Link className="story-primary-link" href="/giochi">Scopri i progetti in sviluppo <span aria-hidden="true">→</span></Link>
          </div>
          <div className="story-game-visual" aria-label="Dossier dei videogiochi GiWise Studio">
            <Link className="story-dossier-card story-dossier-wound" href="/giochi/the-wound-remembers" aria-label="Apri il dossier di The Wound Remembers">
              <span className="story-dossier-cover"><Image src="/games/the-wound-remembers/catalog-cover-generated-v1.webp" alt="Copertina del dossier di The Wound Remembers" fill sizes="(max-width: 900px) 82vw, 26vw" unoptimized /></span>
              <span className="story-dossier-meta"><Image src="/games/the-wound-remembers/logo-white-v2.webp" alt="The Wound Remembers" width={520} height={210} unoptimized /><small>Disponibile e in aggiornamento</small></span>
            </Link>
            <Link className="story-dossier-card story-dossier-fuori" href="/giochi/lorewise-fuori-trama-next" aria-label="Apri il dossier di Fuori Trama">
              <span className="story-dossier-cover"><Image src="/games/lorewise-fuori-trama-next/catalog-cover-generated-v1.webp" alt="Copertina del dossier di Fuori Trama" fill sizes="(max-width: 900px) 82vw, 26vw" unoptimized /></span>
              <span className="story-dossier-meta"><Image src="/games/lorewise-fuori-trama-next/logo-official-v2.webp" alt="Fuori Trama" width={560} height={260} unoptimized /><small>In sviluppo</small></span>
            </Link>
            <Link className="story-dossier-card story-dossier-demon" href="/giochi/demon-match-three" aria-label="Apri il dossier di Demon Match Three">
              <span className="story-dossier-cover"><Image src="/games/demon-match-three/hero-ritual-chapel-v1.jpg" alt="Copertina del dossier di Demon Match Three" fill sizes="(max-width: 900px) 82vw, 26vw" unoptimized /></span>
              <span className="story-dossier-meta"><Image src="/games/demon-match-three/logo-official-v2.webp" alt="Demon Match Three" width={560} height={300} unoptimized /><small>In sviluppo</small></span>
            </Link>
          </div>
        </div>
      </section>

      <section className="worlds-home-story" aria-labelledby="worlds-home-title">
        <div className="shell worlds-home-inner">
          <div className="worlds-home-visual">
            <Image src="/creative-journal/previews/lw-wip-001-a-preview.jpg" alt="Pagina protetta del diario creativo con un disegno in lavorazione" width={1200} height={1600} unoptimized />
            <span className="worlds-home-stamp">Il diario è aperto</span>
            <ol aria-label="Tre momenti del processo creativo">
              <li><span>01</span> La prima bozza</li>
              <li><span>02</span> La lavorazione</li>
              <li><span>03</span> Il risultato</li>
            </ol>
          </div>
          <div className="story-copy">
            <p className="eyebrow">Il diario creativo di GiWise Studio</p>
            <h2 id="worlds-home-title">Dove nascono i mondi.</h2>
            <p>Fotografie dalla tavoletta grafica, disegni ancora aperti e versioni complete. Una raccolta fatta come un diario, pagina dopo pagina.</p>
            <Link className="story-primary-link" href="/dove-nascono-i-mondi">Sfoglia il diario <span aria-hidden="true">→</span></Link>
          </div>
        </div>
      </section>

      <section className="lore-story" aria-labelledby="lore-story-title">
        <div className="shell lore-story-inner">
          <Image src="/brand/icons/enciclopedia-concept-v1.webp" alt="Emblema dell’Enciclopedia" width={1352} height={1163} unoptimized />
          <div>
            <p className="eyebrow">LoreWise Codex</p>
            <h2 id="lore-story-title">Una vera enciclopedia di personaggi.</h2>
            <p>Identità, biografie, continuità, relazioni e fonti vengono ordinate in dossier collegati. I personaggi GiWise restano in un archivio distinto dagli universi documentati.</p>
            <Link className="story-primary-link" href="/enciclopedia">Apri l’enciclopedia <span aria-hidden="true">→</span></Link>
          </div>
        </div>
      </section>

      <section className="home-finale" aria-labelledby="finale-title">
        <div className="shell home-finale-inner">
          <Image className="finale-seal" src="/brand/lorewise-wax-seal-v1.webp" alt="Sigillo LoreWise Universe" width={1536} height={1536} unoptimized />
          <div className="finale-copy"><p className="eyebrow">Il tuo posto nell’universo</p><h2 id="finale-title">Colleziona. Immagina. Chiedi. Condividi.</h2><p>GiWise Shop, commissioni e assistenza sono le porte dirette tra le creazioni e chi le sceglie.</p>
            <nav className="finale-routes" aria-label="Servizi LoreWise Universe">{closingPortals.map((portal) => <Link href={portal.href} key={portal.key}><strong>{portal.title}</strong><small>{portal.note}</small><span aria-hidden="true">→</span></Link>)}</nav>
          </div>
        </div>
      </section>
    </main>
  );
}
