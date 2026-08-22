import type { Metadata } from "next";
import { NotificationCenter } from "@/components/NotificationCenter";

export const metadata: Metadata = { title: "Notifiche | LoreWise Universe", description: "Centro notifiche personale LoreWise." };

export default function NotificationsPage() { return <NotificationCenter />; }
