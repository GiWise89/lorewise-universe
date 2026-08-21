import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CommissionStatusTracker } from "@/components/CommissionStatusTracker";

export const metadata: Metadata = {
  title: "Segui la tua richiesta",
  description: "Consulta lo stato della tua commissione artistica GiWise Studio con codice richiesta ed email.",
  robots: { index: false, follow: false },
};

export default function CommissionStatusPage() {
  return (
    <main className="commission-status-page">
      <section className="commission-status-hero">
        <div className="shell">
          <Image src="/brand/icons/commissioni-concept-v1.webp" alt="Emblema illustrato GiWise Commissioni" width={1224} height={1285} unoptimized priority />
          <div><p className="eyebrow">GiWise Studio · Area cliente</p><h1>Segui la tua<br />richiesta.</h1><p>Un accesso riservato per sapere dove si trova il tuo progetto, consultare il preventivo e comunicare la tua decisione.</p><Link href="/commissioni">Torna alle commissioni</Link></div>
        </div>
      </section>
      <div className="shell"><CommissionStatusTracker /></div>
    </main>
  );
}
