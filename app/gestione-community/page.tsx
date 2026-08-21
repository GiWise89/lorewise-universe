import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { CommunityModerationDashboard } from "@/components/CommunityModerationDashboard";
import { getLoreWiseUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Moderazione Community · Area privata",
  description: "Area riservata alla moderazione di commenti, recensioni e segnalazioni della Community LoreWise.",
  robots: { index: false, follow: false },
};

export default async function CommunityManagementPage() {
  const user = await getLoreWiseUser();
  if (!user) redirect("/account");
  return <main className="community-admin-page">
    <header className="community-admin-hero"><div className="shell"><Image src="/brand/icons/social-assistenza-concept-v1.webp" alt="Emblema illustrato della Community LoreWise" width={1224} height={1285} priority unoptimized /><div><p className="eyebrow">LoreWise Universe · area riservata</p><h1>Custodisci la conversazione.</h1><p>Segnalazioni, decisioni e blocchi vengono trattati in un unico archivio amministrativo, senza esporre email o note private nelle pagine pubbliche.</p></div></div></header>
    <div className="shell community-admin-workspace"><CommunityModerationDashboard /></div>
  </main>;
}
