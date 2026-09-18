import type { Metadata } from "next";
import "./licenza-gioco.css";

export const metadata: Metadata = { alternates: { canonical: "/licenza-gioco" } };

export default function GameLicenseLayout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
