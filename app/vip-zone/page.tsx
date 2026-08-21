import type { Metadata } from "next";
import { VipGamesExperience } from "@/components/VipGamesExperience";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "LoreWise VIP",
  description: "Anteprime e dossier riservati agli abbonati Universe Pass.",
  robots: { index: false, follow: false, noarchive: true, noimageindex: true },
};

export default function VipZonePage() {
  return <main className="vip-zone-page"><VipGamesExperience /></main>;
}
