import type { Metadata } from "next";

export const metadata: Metadata = { alternates: { canonical: "/condizioni-vendita-giochi" } };

export default function GameSalesTermsLayout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
