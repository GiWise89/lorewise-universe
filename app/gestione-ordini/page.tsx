import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { OrderAdminDashboard } from "@/components/OrderAdminDashboard";
import { getLoreWiseUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Ordini LoreWise · Area privata", robots: { index: false, follow: false } };

export default async function OrderAdminPage() {
  const user = await getLoreWiseUser();
  if (!user) redirect("/account");
  return <main className="order-admin-page"><header><div className="shell"><Image src="/brand/icons/shop-concept-v1.webp" alt="Emblema archivio ordini LoreWise" width={1224} height={1285} unoptimized priority /><div><p className="eyebrow">GiWise Studio · Area privata</p><h1>Ordini<br />LoreWise.</h1><p>Un unico registro per opere, videogiochi, commissioni, abbonamenti e prodotti collegati al LoreWise ID.</p></div></div></header><div className="shell"><OrderAdminDashboard /></div></main>;
}
