"use client";

import Image from "next/image";
import { useRef } from "react";
import type { CreativeJournalImage } from "@/lib/creativeJournal";

type Props = {
  image: CreativeJournalImage;
  caption: string;
  className?: string;
  priority?: boolean;
};

export function CreativeJournalPhoto({ image, caption, className = "", priority = false }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <figure className={`diary-photo ${className}`.trim()}>
        <span className="diary-tape" aria-hidden="true" />
        <button type="button" className="diary-photo-open" onClick={() => dialogRef.current?.showModal()} aria-label={`Ingrandisci: ${caption}`}>
          <Image
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            sizes="(max-width: 760px) 92vw, (max-width: 1100px) 70vw, 46vw"
            priority={priority}
            unoptimized
          />
          <span aria-hidden="true">Ingrandisci</span>
        </button>
        <figcaption>{caption}</figcaption>
      </figure>
      <dialog ref={dialogRef} className="diary-lightbox" onClick={(event) => {
        if (event.target === dialogRef.current) dialogRef.current?.close();
      }}>
        <form method="dialog"><button type="submit" aria-label="Chiudi immagine">Chiudi ×</button></form>
        <Image src={image.src} alt={image.alt} width={image.width} height={image.height} sizes="96vw" unoptimized />
        <p>{caption} · anteprima protetta</p>
      </dialog>
    </>
  );
}
