import Image from "next/image";

export default function Loading() {
  return <div className="system-state-page" role="status" aria-live="polite" aria-busy="true">
    <Image src="/brand/lorewise-universe-logo-concept-c.webp" alt="" width={1536} height={1024} priority unoptimized />
    <p className="eyebrow">LoreWise Universe</p>
    <h2>Il prossimo mondo si sta aprendo.</h2>
    <p>Stiamo preparando immagini, dossier e strumenti collegati al tuo percorso.</p>
    <span className="system-state-progress" aria-hidden="true" />
  </div>;
}
