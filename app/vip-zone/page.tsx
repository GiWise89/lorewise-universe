import type { Metadata } from "next";
import { VipGamesExperience } from "@/components/VipGamesExperience";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "LoreWise VIP",
  description: "Anteprime e dossier riservati agli abbonati Universe Pass.",
  robots: { index: false, follow: false, noarchive: true, noimageindex: true },
};

type VipArea = "guides" | "games" | "art" | "atelier" | "downloads";
type VipGame = "the-wound-remembers" | "fuori-trama";

const vipAreas = new Set<VipArea>(["guides", "games", "art", "atelier", "downloads"]);
const vipGames = new Set<VipGame>(["the-wound-remembers", "fuori-trama"]);

export default async function VipZonePage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const requestedArea = typeof query?.area === "string" ? query.area as VipArea : "guides";
  const requestedGame = typeof query?.game === "string" ? query.game as VipGame : "the-wound-remembers";
  const guidePreview = typeof query?.guida === "string" ? query.guida : "";
  const initialArea = vipAreas.has(requestedArea) ? requestedArea : "guides";
  const initialGame = vipGames.has(requestedGame) ? requestedGame : "the-wound-remembers";
  return <main className="vip-zone-page"><VipGamesExperience initialArea={initialArea} initialGame={initialGame} guidePreview={guidePreview} /></main>;
}
