import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminControlCenter } from "@/components/AdminControlCenter";
import { requireOrderAdmin } from "@/lib/orderAdminAuth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Centro Admin LoreWise",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const auth = await requireOrderAdmin();
  if ("response" in auth) redirect("/account");
  return <main className="admin-center-page">
    <header className="admin-center-hero"><div className="shell"><div><p className="eyebrow">GiWise Studio · accesso riservato</p><h1>Centro<br />Admin.</h1><p>Utenti, vantaggi, pagamenti, commissioni, contenuti e pubblicazione governati da un’unica cabina operativa.</p><div><Link href="/account">Area personale</Link><a href="#admin-users">Gestione utenti</a></div></div><Image src="/brand/lorewise-universe-logo-concept-c.webp" alt="Emblema LoreWise Universe" width={1536} height={1024} priority unoptimized /></div></header>
    <div className="shell admin-center-content"><AdminControlCenter /></div>
  </main>;
}
