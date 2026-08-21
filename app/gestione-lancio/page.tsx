import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { LaunchReadinessDashboard } from "@/components/LaunchReadinessDashboard";
import { LaunchOwnerDecisions } from "@/components/LaunchOwnerDecisions";
import { getLoreWiseUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Prontezza al lancio · Area privata", robots: { index: false, follow: false } };

export default async function LaunchReadinessPage() {
  const user = await getLoreWiseUser();
  if (!user) redirect("/account");
  return <main className="launch-readiness-page">
    <header className="launch-readiness-hero"><div className="shell">
      <Image src="/brand/lorewise-universe-logo-concept-c.webp" alt="Emblema LoreWise Universe" width={1536} height={1024} unoptimized priority />
      <div><p className="eyebrow">GiWise Studio · Regia privata</p><h1>Prontezza<br />al lancio.</h1><p>Una lettura unica di account, pagamenti, consegne, legalità e servizi esterni. Nessuna attivazione reale avviene da questa pagina.</p></div>
    </div></header>
    <div className="shell"><LaunchReadinessDashboard /><LaunchOwnerDecisions /></div>
  </main>;
}
