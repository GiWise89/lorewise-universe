import type { Metadata } from "next";
import Link from "next/link";
import { GameGuideExperience } from "@/components/GameGuideExperience";
import { getPublicGameGuides } from "@/lib/gameGuides";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Guide dei videogiochi | LoreWise Universe",
  description: "Guide complete, percorsi e consigli pratici dell’Atlante dei Giochi di LoreWise Universe.",
};

type PublicGameGuidesPageProps = {
  searchParams: Promise<{ gioco?: string | string[] }>;
};

export default async function PublicGameGuidesPage({ searchParams }: PublicGameGuidesPageProps) {
  const guides = getPublicGameGuides();
  const requestedGame = (await searchParams).gioco;
  const selectedSlug = typeof requestedGame === "string" ? requestedGame : "";
  const selectedGuide = guides.find((guide) => guide.slug === selectedSlug) ?? null;

  return <main className="public-game-guides-page">
    <header className="public-game-guides-header">
      <div className="shell">
        <p className="eyebrow">Giochi e app · Atlante dei Giochi</p>
        <h1>Guide complete,<br />senza perdere il gusto della scoperta.</h1>
        <p>Ogni lunedì la guida della settimana lascia l’anteprima VIP ed entra in questa raccolta pubblica. Percorsi pratici, immagini leggibili e spoiler sempre separati.</p>
        <dl>
          <div><dt>Guide pubbliche</dt><dd>{guides.length}</dd></div>
          <div><dt>Nuovi arrivi</dt><dd>Ogni lunedì</dd></div>
          <div><dt>Anteprima</dt><dd>LoreWise VIP</dd></div>
        </dl>
      </div>
    </header>

    {guides.length ? <>
      <section className="public-game-guides-picker" aria-labelledby="guide-picker-title">
        <div className="shell">
          <div className="public-game-guides-picker-heading">
            <div>
              <p className="eyebrow">Scegli il gioco</p>
              <h2 id="guide-picker-title">Quale guida vuoi aprire?</h2>
            </div>
            <p>Seleziona un titolo: verrà mostrata soltanto la sua guida.</p>
          </div>
          <nav className="public-game-guides-picker-grid" aria-label="Guide disponibili per gioco">
            {guides.map((guide, index) => {
              const isSelected = guide.slug === selectedGuide?.slug;
              return <Link
                className={isSelected ? "is-selected" : undefined}
                href={`/giochi/guide?gioco=${encodeURIComponent(guide.slug)}#guida-selezionata`}
                aria-current={isSelected ? "page" : undefined}
                key={guide.id}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{guide.game}</strong>
                <i aria-hidden="true">→</i>
              </Link>;
            })}
          </nav>
        </div>
      </section>

      {selectedGuide ? <section className="public-game-guides-selection" id="guida-selezionata" aria-label={`Guida selezionata: ${selectedGuide.game}`}>
        <div className="shell public-game-guides-list">
          <GameGuideExperience guide={selectedGuide} context="public" />
        </div>
      </section> : <section className="shell public-game-guides-prompt" aria-live="polite">
        <span aria-hidden="true">↑</span>
        <div><strong>Scegli un gioco per iniziare.</strong><p>La guida si aprirà qui senza caricare tutte le altre nella stessa pagina.</p></div>
      </section>}
    </> : <section className="shell public-game-guides-empty">
      <p className="eyebrow">Prima apertura · 24 agosto 2026</p>
      <h2>La prima guida è ancora nell’area VIP.</h2>
      <p>Lunedì “Il taccuino dell’isola”, la guida completa di Animal Crossing: New Horizons, entrerà automaticamente qui. Gli abbonati possono già leggerla nella sezione “Guida della settimana”.</p>
      <Link href="/vip-zone">Apri LoreWise VIP <span aria-hidden="true">→</span></Link>
    </section>}
  </main>;
}
