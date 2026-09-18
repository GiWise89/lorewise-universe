"use client";

import { useEffect, useRef } from "react";

export type CampaignNpcPose = "idle" | "command" | "cheer" | "anger" | "victory" | "defeat";

const NPC_ROW: Record<CampaignNpcPose, number> = {
  idle: 0,
  command: 1,
  cheer: 2,
  anger: 3,
  victory: 4,
  defeat: 5,
};

export function FamiglioCampaignNpcCanvas({ src, label, hue = 0, className, pose = "idle", grounded = false, hitFlash = false }: { src: string; label: string; hue?: number; className?: string; pose?: CampaignNpcPose; grounded?: boolean; hitFlash?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    let disposed = false;
    let request = 0;
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      const columns = 8;
      const rows = 6;
      const frameWidth = image.naturalWidth / columns;
      const frameHeight = image.naturalHeight / rows;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const sourceCanvas = grounded ? document.createElement("canvas") : null;
      const sourceContext = sourceCanvas?.getContext("2d", { willReadFrequently: true }) ?? null;
      if (sourceCanvas && sourceContext) {
        sourceCanvas.width = image.naturalWidth;
        sourceCanvas.height = image.naturalHeight;
        sourceContext.drawImage(image, 0, 0);
      }
      const started = performance.now();
      const paint = (now: number) => {
        if (disposed) return;
        context.clearRect(0, 0, canvas.width, canvas.height);
        const elapsed = now - started;
        const step = Math.floor(elapsed / (pose === "idle" ? 180 : 150));
        const frame = reduced ? 0 : pose === "defeat" ? Math.min(columns - 1, step) : step % columns;
        const row = NPC_ROW[pose];
        let sx = frame * frameWidth;
        let sy = row * frameHeight;
        let sw = frameWidth;
        let sh = frameHeight;
        if (grounded && sourceContext) {
          const pixels = sourceContext.getImageData(sx, sy, sw, sh).data;
          let minX = sw, minY = sh, maxX = -1, maxY = -1;
          for (let y = 0; y < sh; y += 1) for (let x = 0; x < sw; x += 1) {
            if (pixels[(y * sw + x) * 4 + 3] > 8) {
              minX = Math.min(minX, x); minY = Math.min(minY, y);
              maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
            }
          }
          if (maxX >= minX && maxY >= minY) {
            sx += minX; sy += minY; sw = maxX - minX + 1; sh = maxY - minY + 1;
          }
        }
        const scale = Math.min((canvas.width - 12) / sw, (canvas.height - (grounded ? 0 : 8)) / sh);
        const width = sw * scale;
        const height = sh * scale;
        context.save();
        context.imageSmoothingEnabled = false;
        context.filter = hue ? `hue-rotate(${hue}deg)` : "none";
        context.drawImage(image, sx, sy, sw, sh, (canvas.width - width) / 2, canvas.height - height, width, height);
        if (hitFlash) {
          context.filter = "none";
          context.globalCompositeOperation = "source-atop";
          context.fillStyle = "rgba(255, 32, 48, 0.72)";
          context.fillRect(0, 0, canvas.width, canvas.height);
        }
        context.restore();
        if (!reduced) request = window.requestAnimationFrame(paint);
      };
      request = window.requestAnimationFrame(paint);
    };
    image.src = src;
    return () => { disposed = true; if (request) window.cancelAnimationFrame(request); };
  }, [grounded, hue, pose, src, hitFlash]);

  return <canvas ref={canvasRef} className={className} width={240} height={240} role="img" aria-label={label} />;
}
