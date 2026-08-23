import type { Metadata } from "next";
import ContactsPage from "@/app/contatti/page";

export const metadata: Metadata = {
  title: "Community & Social",
  description: "Canali social ufficiali, Discord, assistenza e spazi di partecipazione del LoreWise Universe.",
  alternates: { canonical: "/community" },
};

export default function CommunityPage() {
  return <ContactsPage />;
}
