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

export function FamiglioCampaignNpcCanvas({ src, label, hue = 0, className, pose = "idle" }: { src: string; label: string; hue?: number; className?: string; pose?: CampaignNpcPose }) {
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
      const started = performance.now();
      const paint = (now: number) => {
        if (disposed) return;
        context.clearRect(0, 0, canvas.width, canvas.height);
        const elapsed = now - started;
        const frame = reduced ? 0 : Math.floor(elapsed / (pose === "command" || pose === "anger" ? 105 : 135)) % columns;
        const row = NPC_ROW[pose];
        const scale = Math.min((canvas.width - 12) / frameWidth, (canvas.height - 8) / frameHeight);
        const width = frameWidth * scale;
        const height = frameHeight * scale;
        context.save();
        context.imageSmoothingEnabled = false;
        context.filter = hue ? `hue-rotate(${hue}deg)` : "none";
        context.drawImage(image, frame * frameWidth, row * frameHeight, frameWidth, frameHeight, (canvas.width - width) / 2, canvas.height - height, width, height);
        context.restore();
        if (!reduced) request = window.requestAnimationFrame(paint);
      };
      request = window.requestAnimationFrame(paint);
    };
    image.src = src;
    return () => { disposed = true; if (request) window.cancelAnimationFrame(request); };
  }, [hue, pose, src]);

  return <canvas ref={canvasRef} className={className} width={240} height={240} role="img" aria-label={label} />;
}
