import type { Metadata } from "next";
import { NexusFamiliarExperience } from "@/components/NexusFamiliarExperience";
import type { LegacyView } from "@/components/NexusFamiliarLegacy";

export const metadata: Metadata = {
  title: "Il mio Famiglio del Nexus",
  description: "Adotta, cura e fai crescere il tuo Famiglio del Nexus.",
};

const LEGACY_VIEW_BY_SECTION: Record<string, LegacyView> = {
  diario: "diary",
  personalita: "personality",
  scoperte: "discoveries",
};

export default async function FamiliarPage({ searchParams }: { searchParams: Promise<{ sezione?: string | string[] }> }) {
  const rawSection = (await searchParams).sezione;
  const section = Array.isArray(rawSection) ? rawSection[0] : rawSection;
  return <NexusFamiliarExperience initialLegacyView={section ? LEGACY_VIEW_BY_SECTION[section] : undefined} />;
}
