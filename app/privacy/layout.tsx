import type { Metadata } from "next";
import "./privacy.css";

export const metadata: Metadata = { alternates: { canonical: "/privacy" } };

export default function PrivacyLayout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
