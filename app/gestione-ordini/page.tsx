import type { Metadata } from "next";
import Image from "next/image";
import { OrderAdminDashboard } from "@/components/OrderAdminDashboard";
import { requireAdminPage } from "@/lib/adminPageGuard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Ordini LoreWise · Area privata", robots: { index: false, follow: false } };

export default async function OrderAdminPage() {
  await requireAdminPage();
  return <main className="order-admin-page"><header><div className="shell"><Image src="/brand/icons/shop-concept-v1.webp" alt="Emblema archivio ordini LoreWise" width={1224} height={1285} unoptimized priority /><div><p className="eyebrow">GiWise Studio · Area privata</p><h1>Ordini<br />LoreWise.</h1><p>Un unico registro per opere, videogiochi, commissioni, abbonamenti e prodotti collegati al LoreWise ID.</p></div></div></header><div className="shell"><OrderAdminDashboard /></div></main>;
}
