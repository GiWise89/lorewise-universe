import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OrderDetailPanel } from "@/components/OrderDetailPanel";
import { getLoreWiseUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Riepilogo ordine · LoreWise ID", robots: { index: false, follow: false } };

export default async function OrderDetailPage({ params }: { params: Promise<{ reference: string }> }) {
  const user = await getLoreWiseUser();
  if (!user) redirect("/account");
  const { reference } = await params;
  return <main className="order-detail-page"><div className="shell"><OrderDetailPanel referenceCode={reference} /></div></main>;
}
