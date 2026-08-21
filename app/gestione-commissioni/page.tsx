import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CommissionAdminDashboard } from "@/components/CommissionAdminDashboard";
import { getCommissionAdmin } from "@/lib/commissionAdminAuth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "GiWise Commissioni · Area privata",
  description: "Area riservata per la gestione delle richieste artistiche GiWise Studio.",
  robots: { index: false, follow: false },
};

export default async function CommissionAdminPage() {
  const admin = await getCommissionAdmin();
  if (!admin) {
    return (
      <main className="commission-admin-access-denied">
        <Image src="/brand/icons/commissioni-concept-v1.webp" alt="Emblema GiWise Commissioni" width={1224} height={1285} unoptimized />
        <small>Area privata GiWise Studio</small>
        <h1>Accesso non autorizzato.</h1>
        <p>Accedi con il profilo amministratore LoreWise ID. I dati delle richieste restano protetti.</p>
        <Link href="/account">Accedi con LoreWise ID</Link>
      </main>
    );
  }

  return (
    <main className="commission-admin-page">
      <header className="commission-admin-hero">
        <div className="shell">
          <Image src="/brand/icons/commissioni-concept-v1.webp" alt="Emblema illustrato GiWise Commissioni" width={1224} height={1285} unoptimized priority />
          <div><p className="eyebrow">GiWise Studio · Archivio riservato</p><h1>GiWise<br />Commissioni.</h1><p>Valuta ogni richiesta, consulta i riferimenti, prepara il preventivo e accompagna il lavoro fino alla consegna.</p></div>
        </div>
      </header>
      <div className="shell"><CommissionAdminDashboard /></div>
    </main>
  );
}
