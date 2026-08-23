import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { GameGuideExperience } from "@/components/GameGuideExperience";
import type { GameGuide } from "@/lib/gameGuides";
import minecraftGuideJson from "@/data/minecraft-guide.json";
import skyrimGuideJson from "@/data/skyrim-guide.json";
import worldOfWarcraftGuideJson from "@/data/world-of-warcraft-guide.json";

export const dynamic = "force-dynamic";
export const metadata = { title: "Anteprima locale guida | LoreWise Universe", robots: { index: false, follow: false } };

export default async function LocalGuidePreviewPage({ searchParams }: { searchParams?: Promise<{ guida?: string }> }) {
  const requestHeaders = await headers();
  const host = (requestHeaders.get("host") ?? "").toLowerCase();
  const isLocal = host === "localhost" || host.startsWith("localhost:") || host === "127.0.0.1" || host.startsWith("127.0.0.1:") || host === "[::1]" || host.startsWith("[::1]:");
  if (!isLocal && process.env.NODE_ENV === "production") notFound();

  const requestedGuide = (await searchParams)?.guida;
  const guide = (requestedGuide === "world-of-warcraft"
    ? worldOfWarcraftGuideJson
    : requestedGuide === "skyrim" ? skyrimGuideJson : minecraftGuideJson) as GameGuide;

  return <main className="public-game-guides-page">
    <header className="public-game-guides-header">
      <div className="shell">
        <p className="eyebrow">Anteprima locale · non pubblicata</p>
        <h1>Controllo editoriale<br />della prossima guida.</h1>
        <p>Questa pagina esiste soltanto in locale per verificare contenuti, immagini, switch e resa grafica prima della rotazione automatica.</p>
      </div>
    </header>
    <div className="shell public-game-guides-list"><GameGuideExperience guide={guide} context="vip" /></div>
  </main>;
}
