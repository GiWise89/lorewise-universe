import { requireVipAccess } from "@/lib/vipAccess";
import { VIP_AREAS, VIP_EDITORIAL_STATUS, VIP_EXPANSION, VIP_FUORI_TRAMA_DROP } from "@/lib/vipZone";
import { VIP_ART_DROP, VIP_ARTWORKS } from "@/data/vip-artworks";
import { VIP_ATELIER } from "@/data/vip-atelier";
import { VIP_DOWNLOAD_LIBRARY } from "@/data/vip-downloads";
import { buildVipMemberProfile } from "@/lib/vipMember";
import { getVipWeeklyGuide } from "@/lib/gameGuides";

export async function GET() {
  try {
    const access = await requireVipAccess();
    if ("error" in access) return access.error;
    return Response.json({
      member: buildVipMemberProfile(access.pass),
      areas: VIP_AREAS,
      editorial: VIP_EDITORIAL_STATUS,
      expansion: VIP_EXPANSION,
      fuoriTrama: VIP_FUORI_TRAMA_DROP,
      art: { ...VIP_ART_DROP, artworks: VIP_ARTWORKS },
      atelier: VIP_ATELIER,
      downloads: VIP_DOWNLOAD_LIBRARY,
      weeklyGuide: getVipWeeklyGuide(),
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return Response.json({ error: "Non è stato possibile aprire la VIP Zone.", reason: "unavailable" }, { status: 503, headers: { "Cache-Control": "private, no-store" } });
  }
}
