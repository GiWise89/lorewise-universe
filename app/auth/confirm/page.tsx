import type { Metadata } from "next";
import { RecoveryConfirmationPanel } from "@/components/RecoveryConfirmationPanel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Conferma recupero password",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

function safeDestination(value: string | string[] | undefined) {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : "/account/password";
}

export default async function RecoveryConfirmationPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const tokenHash = typeof query?.token_hash === "string" ? query.token_hash : "";
  const code = typeof query?.code === "string" ? query.code : "";
  const type = typeof query?.type === "string" ? query.type : "";

  return <RecoveryConfirmationPanel tokenHash={tokenHash && type === "recovery" ? tokenHash : undefined} code={code || undefined} destination={safeDestination(query?.next)} />;
}
