import { requireVipAccess } from "@/lib/vipAccess";
import { VIP_AREAS, VIP_EDITORIAL_STATUS, VIP_EXPANSION, VIP_FUORI_TRAMA_DROP } from "@/lib/vipZone";
import { VIP_ART_DROP, VIP_ARTWORKS } from "@/data/vip-artworks";
import { VIP_ATELIER } from "@/data/vip-atelier";
import { VIP_DOWNLOAD_LIBRARY } from "@/data/vip-downloads";
import { buildVipMemberProfile } from "@/lib/vipMember";
import { getGameGuideBySlug, getVipWeeklyGuide } from "@/lib/gameGuides";
import { universePassBenefitFromCode } from "@/lib/universePass";

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const localPreviewRequest = ["localhost", "127.0.0.1"].includes(requestUrl.hostname);
    const localPreviewPass = localPreviewRequest && process.env.NODE_ENV !== "production"
      ? universePassBenefitFromCode("LW-PASS-COLLECTOR")
      : null;
    const access = localPreviewPass ? { pass: localPreviewPass } : await requireVipAccess();
    if ("error" in access) return access.error;
    const localGuidePreview = localPreviewRequest
      ? getGameGuideBySlug(requestUrl.searchParams.get("guida") ?? process.env.LOREWISE_GUIDE_PREVIEW_SLUG ?? "")
      : null;
    return Response.json({
      member: buildVipMemberProfile(access.pass),
      areas: VIP_AREAS,
      editorial: VIP_EDITORIAL_STATUS,
      expansion: VIP_EXPANSION,
      fuoriTrama: VIP_FUORI_TRAMA_DROP,
      art: { ...VIP_ART_DROP, artworks: VIP_ARTWORKS },
      atelier: VIP_ATELIER,
      downloads: VIP_DOWNLOAD_LIBRARY,
      weeklyGuide: localGuidePreview ?? getVipWeeklyGuide(),
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return Response.json({ error: "Non è stato possibile aprire la VIP Zone.", reason: "unavailable" }, { status: 503, headers: { "Cache-Control": "private, no-store" } });
  }
}
