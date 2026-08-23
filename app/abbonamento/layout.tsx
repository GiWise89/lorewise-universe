import type { Metadata } from "next";

export const metadata: Metadata = { alternates: { canonical: "/abbonamento" } };

export default function SubscriptionLayout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
