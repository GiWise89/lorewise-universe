import type { Metadata } from "next";
import "./arte.css";

export const metadata: Metadata = {
  alternates: { canonical: "/arte" },
};

export default function ArtLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
