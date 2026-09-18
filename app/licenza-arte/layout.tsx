import type { Metadata } from "next";
import "./licenza-arte.css";

export const metadata: Metadata = { alternates: { canonical: "/licenza-arte" } };

export default function ArtLicenseLayout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
