import type { Metadata } from "next";
import Image from "next/image";
import { GameDeliveryAdmin } from "@/components/GameDeliveryAdmin";

export const metadata: Metadata = { title: "Archivio giochi · Area privata", robots: { index: false, follow: false } };

export default function GameDeliveryAdminPage() {
  return <main className="delivery-admin-page game-delivery-admin-page">
    <header><div className="shell"><Image src="/games/the-wound-remembers/key-art-cover-v2.webp" alt="The Wound Remembers" width={1200} height={1600} unoptimized priority /><div><p className="eyebrow">GiWise Studio · Distribuzione privata</p><h1>Edizione<br />Windows.</h1><p>Archivio, quarantena e controllo qualità dell’installer di The Wound Remembers. Nessun file viene esposto con un indirizzo pubblico.</p></div></div></header>
    <div className="shell"><GameDeliveryAdmin /></div>
  </main>;
}
