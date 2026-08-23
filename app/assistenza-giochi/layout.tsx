import type { Metadata } from "next";

export const metadata: Metadata = { alternates: { canonical: "/assistenza-giochi" } };

export default function GameSupportLayout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
