import type { Metadata } from "next";

export const metadata: Metadata = { alternates: { canonical: "/licenza-arte" } };

export default function ArtLicenseLayout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
