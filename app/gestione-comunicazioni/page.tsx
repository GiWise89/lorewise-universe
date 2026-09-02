import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MarketingCampaignDashboard } from "@/components/MarketingCampaignDashboard";
import { getLoreWiseUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Comunicazioni GiWise Studio | Centro Admin LoreWise", robots: { index: false, follow: false } };

export default async function MarketingCampaignPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const previewKind = typeof query?.anteprima === "string" ? query.anteprima : "";
  const localPreview = (previewKind === "halloween" || previewKind === "feste") && process.env.LOREWISE_LOCAL_CALENDAR_PREVIEW === "true";
  const previewPackCode = previewKind === "feste" ? "GW-PROMO-FESTE-NEXUS-2026" : "GW-PROMO-HALLOWEEN-COLLECTIONS-2026";
  const user = await getLoreWiseUser();
  if (!user && !localPreview) redirect("/account");
  return <main className="email-admin-page"><nav className="shell email-admin-back"><Link href={localPreview ? previewKind === "feste" ? "/cronache-del-nexus?anteprima=tutte&sezione=promozione#promozione" : "/arte?anteprima=halloween#collezioni-horror" : "/admin"}>{localPreview ? "← Torna all’anteprima della campagna" : "← Torna al Centro Admin"}</Link></nav><div className="shell"><MarketingCampaignDashboard previewPackCode={localPreview ? previewPackCode : ""} /></div></main>;
}
