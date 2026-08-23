import type { Metadata } from "next";

export const metadata: Metadata = { alternates: { canonical: "/cronache-del-nexus" } };

export default function NexusChroniclesLayout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
