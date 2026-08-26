import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MarketingCampaignDashboard } from "@/components/MarketingCampaignDashboard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Anteprima comunicazioni promozionali | LoreWise Universe",
  robots: { index: false, follow: false },
};

export default function LocalPromotionCommunicationsPreview() {
  if (process.env.LOREWISE_LOCAL_CALENDAR_PREVIEW !== "true") redirect("/account");
  return <main className="email-admin-page"><nav className="shell email-admin-back"><Link href="/arte?anteprima=halloween#collezioni-horror">← Torna alle collezioni locali</Link></nav><div className="shell"><MarketingCampaignDashboard previewPackCode="GW-PROMO-HALLOWEEN-COLLECTIONS-2026" /></div></main>;
}
