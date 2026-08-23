import type { Metadata } from "next";

export const metadata: Metadata = { alternates: { canonical: "/download-app" } };

export default function DownloadAppLayout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
