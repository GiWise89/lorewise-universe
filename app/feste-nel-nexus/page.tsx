import type { Metadata } from "next";
import { HolidayNexusCampaignExperience, type HolidayNexusCampaignPhase } from "@/components/HolidayNexusCampaignExperience";
import { holidayNexusPromotion } from "@/lib/commissionPromotion";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Feste nel Nexus | Commissioni GiWise Studio",
  description: "Dal 1 dicembre 2026 al 1 gennaio 2027, una tariffa dedicata sulle commissioni GiWise Studio.",
};

function campaignPhase(at: Date): HolidayNexusCampaignPhase {
  if (at.getTime() < Date.parse(holidayNexusPromotion.startsAt)) return "upcoming";
  if (at.getTime() <= Date.parse(holidayNexusPromotion.endsAt)) return "active";
  return "ended";
}

export default async function HolidayNexusPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const preview = query?.anteprima === "feste"
    && (process.env.NODE_ENV !== "production" || process.env.LOREWISE_LOCAL_CALENDAR_PREVIEW === "true");
  return <HolidayNexusCampaignExperience phase={preview ? "active" : campaignPhase(new Date())} preview={preview} />;
}
