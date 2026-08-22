import type { Metadata } from "next";
import Link from "next/link";
import { GameGuideExperience } from "@/components/GameGuideExperience";
import { getPublicGameGuides } from "@/lib/gameGuides";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Guide dei videogiochi | LoreWise Universe",
  description: "Guide complete, percorsi e consigli pratici dell’Atlante dei Giochi di LoreWise Universe.",
};

export default function PublicGameGuidesPage() {
  const guides = getPublicGameGuides();

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

    {guides.length ? <div className="shell public-game-guides-list">
      {guides.map((guide) => <GameGuideExperience guide={guide} context="public" key={guide.id} />)}
    </div> : <section className="shell public-game-guides-empty">
      <p className="eyebrow">Prima apertura · 24 agosto 2026</p>
      <h2>La prima guida è ancora nell’area VIP.</h2>
      <p>Lunedì “Il taccuino dell’isola”, la guida completa di Animal Crossing: New Horizons, entrerà automaticamente qui. Gli abbonati possono già leggerla nella sezione “Guida della settimana”.</p>
      <Link href="/vip-zone">Apri LoreWise VIP <span aria-hidden="true">→</span></Link>
    </section>}
  </main>;
}
