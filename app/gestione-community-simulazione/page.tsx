import type { Metadata } from "next";
import { headers } from "next/headers";
import Image from "next/image";
import { notFound } from "next/navigation";
import { CommunityModerationDashboard } from "@/components/CommunityModerationDashboard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Simulazione amministratore",
  description: "Scenario dimostrativo locale del pannello di moderazione LoreWise.",
  robots: { index: false, follow: false },
};

export default async function CommunityModerationSimulationPage() {
  const requestHeaders = await headers();
  const host = (requestHeaders.get("host") ?? "").toLowerCase();
  const isLocal = host === "localhost" || host.startsWith("localhost:") || host === "127.0.0.1" || host.startsWith("127.0.0.1:") || host === "[::1]" || host.startsWith("[::1]:");
  if (!isLocal && process.env.NODE_ENV === "production") notFound();

  return <main className="community-admin-page">
    <header className="community-admin-hero"><div className="shell"><Image src="/brand/icons/social-assistenza-concept-v1.webp" alt="Emblema illustrato della Community LoreWise" width={1224} height={1285} priority unoptimized /><div><p className="eyebrow">LoreWise Universe · simulazione amministratore</p><h1>Proviamo ogni decisione.</h1><p>Uno scenario indipendente dall’account reale permette di verificare l’interfaccia di moderazione senza modificare utenti, commenti o segnalazioni autentiche.</p></div></div></header>
    <div className="shell community-admin-workspace"><CommunityModerationDashboard simulation /></div>
  </main>;
}
