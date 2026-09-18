import type { Metadata } from "next";
import Image from "next/image";
import { ArtworkDeliveryAdmin } from "@/components/ArtworkDeliveryAdmin";
import { requireAdminPage } from "@/lib/adminPageGuard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Archivio vendite Arte · Area privata", robots: { index: false, follow: false } };

export default async function ArtworkDeliveryAdminPage() {
  await requireAdminPage();
  return <main className="delivery-admin-page">
    <header><div className="shell"><Image src="/brand/icons/arte-concept-v1.webp" alt="Emblema Arte in Vetrina" width={1224} height={1285} unoptimized priority /><div><p className="eyebrow">GiWise Studio · Area privata</p><h1>Archivio<br />vendite Arte.</h1><p>Qui decidi quale pacchetto riceverà il cliente dopo un pagamento confermato. I file completi non entrano mai nella Vetrina pubblica.</p></div></div></header>
    <div className="shell"><ArtworkDeliveryAdmin /></div>
  </main>;
}
