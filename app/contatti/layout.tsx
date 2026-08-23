import type { Metadata } from "next";

export const metadata: Metadata = { alternates: { canonical: "/contatti" } };

export default function ContactsLayout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
