"use client";

import dynamic from "next/dynamic";

// Il PiP dipende da cataloghi Famiglio molto pesanti e legge solo dati del browser
// (localStorage + API): lo carichiamo in un chunk separato, esclusivamente lato client.
export const NexusPetNavigationPip = dynamic(
  () => import("@/components/NexusPetNavigationPip").then((module) => module.NexusPetNavigationPip),
  { ssr: false, loading: () => null },
);
