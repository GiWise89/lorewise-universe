import type { Metadata } from "next";

export const metadata: Metadata = { alternates: { canonical: "/enciclopedia/originali-giwise" } };

export default function GiWiseOriginalsLayout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
