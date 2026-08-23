import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/giochi/guide" },
};

export default function GameGuidesLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
