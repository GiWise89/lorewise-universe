import type { Metadata } from "next";
import { FamiglioNexusRebuild } from "@/components/FamiglioNexusRebuild";

export const metadata: Metadata = {
  title: "Famigli del Nexus",
  description: "Scegli il tuo primo Famiglio e crea un nuovo legame nel Nexus.",
};

export default function FamiliarPage() {
  return <FamiglioNexusRebuild />;
}
