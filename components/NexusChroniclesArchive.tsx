"use client";

import dynamic from "next/dynamic";
import type { ChroniclePanel } from "@/lib/nexusChroniclePanels";
import type { NexusChronicle, NexusChronicleCategoryFilter } from "@/lib/nexusChronicles";

const NexusChroniclesFeed = dynamic(
  () => import("@/components/NexusChroniclesFeed").then((module) => module.NexusChroniclesFeed),
  { loading: () => <p className="nexus-archive-loading" role="status">Apertura delle Cronache…</p> },
);

export function NexusChroniclesArchive({ chronicles, initialPanel, initialCategory, initialChronicleId, showCategories }: {
  chronicles: NexusChronicle[];
  initialPanel: ChroniclePanel;
  initialCategory: NexusChronicleCategoryFilter;
  initialChronicleId?: string;
  showCategories: boolean;
}) {
  return <NexusChroniclesFeed chronicles={chronicles} initialPanel={initialPanel} initialCategory={initialCategory} initialChronicleId={initialChronicleId} showCategories={showCategories} />;
}
