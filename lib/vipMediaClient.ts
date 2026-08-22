import type { SyntheticEvent } from "react";

const TRANSPARENT_PIXEL = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";

export function showVipMediaFallback(event: SyntheticEvent<HTMLImageElement>) {
  const image = event.currentTarget;
  if (image.dataset.vipFallback === "true") return;
  image.dataset.vipFallback = "true";
  image.src = TRANSPARENT_PIXEL;
  image.alt = "Anteprima VIP temporaneamente non disponibile";
  image.classList.add("vip-media-fallback");
}
