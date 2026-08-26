import { BlackFridayCampaignExperience } from "@/components/BlackFridayCampaignExperience";
import { getBlackFridayCampaignPhase, type BlackFridayCampaignPhase } from "@/lib/blackFridayTeaser";

export default async function BlackFridayPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const localCalendarPreview = process.env.NODE_ENV !== "production" || process.env.LOREWISE_LOCAL_CALENDAR_PREVIEW === "true";
  const requestedPreview = typeof query?.anteprima === "string" ? query.anteprima : "";
  const previewPhase = localCalendarPreview && ["teaser", "black-friday", "cyber-monday"].includes(requestedPreview)
    ? requestedPreview as Exclude<BlackFridayCampaignPhase, "ended">
    : localCalendarPreview && requestedPreview === "1" ? "teaser" : undefined;
  return <BlackFridayCampaignExperience initialPhase={getBlackFridayCampaignPhase()} previewPhase={previewPhase} />;
}
