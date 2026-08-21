import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { SupportAdminDashboard } from "@/components/SupportAdminDashboard";
import { requireOrderAdmin } from "@/lib/orderAdminAuth";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Assistenza LoreWise · Area privata", robots: { index: false, follow: false } };
export default async function SupportAdminPage() { const auth = await requireOrderAdmin(); if ("response" in auth) redirect("/account"); return <main className="support-admin-page"><header><div className="shell"><Image src="/brand/icons/social-assistenza-concept-v1.webp" alt="Emblema assistenza LoreWise" width={1224} height={1285} priority unoptimized /><div><p className="eyebrow">GiWise Studio · Area privata</p><h1>Centro<br />Assistenza.</h1><p>Richieste generali, giochi, account, commissioni, Universe Pass e privacy in una sola coda verificabile.</p></div></div></header><div className="shell"><SupportAdminDashboard /></div></main>; }
