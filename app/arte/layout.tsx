import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/arte" },
};

export default function ArtLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
