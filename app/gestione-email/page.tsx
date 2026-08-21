import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { TransactionalEmailDashboard } from "@/components/TransactionalEmailDashboard";
import { getLoreWiseUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Ricevute e notifiche | Centro Admin LoreWise", robots: { index: false, follow: false } };

export default async function TransactionalEmailPage() {
  const user = await getLoreWiseUser();
  if (!user) redirect("/account");
  return <main className="email-admin-page"><nav className="shell email-admin-back"><Link href="/admin">← Torna al Centro Admin</Link></nav><div className="shell"><TransactionalEmailDashboard /></div></main>;
}
