import type { SyntheticEvent } from "react";

const VIP_FALLBACK = "/brand/icons/lorewise-vip-official-v1.webp";

export function showVipMediaFallback(event: SyntheticEvent<HTMLImageElement>) {
  const image = event.currentTarget;
  if (image.dataset.vipFallback === "true") return;
  image.dataset.vipFallback = "true";
  image.src = VIP_FALLBACK;
  image.alt = "Anteprima VIP temporaneamente non disponibile";
  image.classList.add("vip-media-fallback");
}
