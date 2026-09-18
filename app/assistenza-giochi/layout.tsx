import type { Metadata } from "next";
import "./assistenza-giochi.css";

export const metadata: Metadata = { alternates: { canonical: "/assistenza-giochi" } };

export default function GameSupportLayout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
