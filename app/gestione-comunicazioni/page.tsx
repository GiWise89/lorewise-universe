import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MarketingCampaignDashboard } from "@/components/MarketingCampaignDashboard";
import { getLoreWiseUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Comunicazioni GiWise Studio | Centro Admin LoreWise", robots: { index: false, follow: false } };

export default async function MarketingCampaignPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const localPreview = query?.anteprima === "halloween" && process.env.LOREWISE_LOCAL_CALENDAR_PREVIEW === "true";
  const user = await getLoreWiseUser();
  if (!user && !localPreview) redirect("/account");
  return <main className="email-admin-page"><nav className="shell email-admin-back"><Link href={localPreview ? "/arte?anteprima=halloween#collezioni-horror" : "/admin"}>{localPreview ? "← Torna alle collezioni locali" : "← Torna al Centro Admin"}</Link></nav><div className="shell"><MarketingCampaignDashboard previewPackCode={localPreview ? "GW-PROMO-HALLOWEEN-COLLECTIONS-2026" : ""} /></div></main>;
}
