import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MarketingCampaignDashboard } from "@/components/MarketingCampaignDashboard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Anteprima comunicazioni promozionali | LoreWise Universe",
  robots: { index: false, follow: false },
};

export default async function LocalPromotionCommunicationsPreview({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  if (process.env.LOREWISE_LOCAL_CALENDAR_PREVIEW !== "true") redirect("/account");
  const query = await searchParams;
  const holidayPreview = query?.campagna === "feste";
  const previewPackCode = holidayPreview ? "GW-PROMO-FESTE-NEXUS-2026" : "GW-PROMO-HALLOWEEN-COLLECTIONS-2026";
  const returnHref = holidayPreview ? "/cronache-del-nexus?anteprima=tutte&sezione=promozione#promozione" : "/arte?anteprima=halloween#collezioni-horror";
  return <main className="email-admin-page"><nav className="shell email-admin-back"><Link href={returnHref}>← Torna all’anteprima della campagna</Link></nav><div className="shell"><MarketingCampaignDashboard previewPackCode={previewPackCode} /></div></main>;
}
