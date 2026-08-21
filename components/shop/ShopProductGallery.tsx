"use client";

import Image from "next/image";
import { useState } from "react";

type GalleryImage = { src: string; alt: string; label: string };

export default function ShopProductGallery({ images }: { images: GalleryImage[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex] ?? images[0];

  return (
    <div className="shop-product-gallery">
      <div className="shop-product-gallery-stage">
        <Image src={activeImage.src} alt={activeImage.alt} fill sizes="(max-width: 900px) 100vw, 52vw" style={{ objectFit: "contain", objectPosition: "center" }} priority unoptimized />
        <span>{activeImage.label}</span>
      </div>
      {images.length > 1 ? (
        <div className="shop-product-gallery-choices" aria-label="Scegli l’anteprima del prodotto">
          {images.map((image, index) => (
            <button key={image.src} type="button" className={index === activeIndex ? "is-active" : undefined} aria-pressed={index === activeIndex} onClick={() => setActiveIndex(index)}>
              <span className="shop-product-gallery-thumb"><Image src={image.src} alt="" fill sizes="96px" style={{ objectFit: "contain", objectPosition: "center" }} unoptimized /></span>
              <span>{image.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
