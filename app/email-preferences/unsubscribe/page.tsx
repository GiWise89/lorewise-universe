import type { Metadata } from "next";
import { MarketingUnsubscribePanel } from "@/components/MarketingUnsubscribePanel";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Preferenze email | LoreWise Universe", robots: { index: false, follow: false } };

export default async function MarketingUnsubscribePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  return <main className="marketing-unsubscribe-page"><MarketingUnsubscribePanel token={token} /></main>;
}
