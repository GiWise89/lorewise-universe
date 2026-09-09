import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Mondi",
  description: "La soglia narrativa verso le Cronache del Nexus, il diario creativo e il LoreWise Codex.",
};

const worldPaths = [
  {
    key: "nexus",
    number: "01",
    eyebrow: "Il presente dell’universo",
    title: "Novità dal Nexus",
    description: "Annunci, calendario editoriale, nuove guide e tutto ciò che cambia ogni lunedì.",
    action: "Segui le Cronache",
    href: "/cronache-del-nexus",
    image: "/brand/lorewise-wax-seal-v1.webp",
    imageAlt: "Sigillo delle Cronache del Nexus",
  },
  {
    key: "origins",
    number: "02",
    eyebrow: "Il processo creativo",
    title: "Dove nascono i mondi",
    description: "Bozze autentiche, lavorazioni, passioni e storie dello Studio prima del risultato finale.",
    action: "Apri il Diario",
    href: "/dove-nascono-i-mondi",
    image: "/brand/icons/dove-nascono-i-mondi-concept-v1.webp",
    imageAlt: "Emblema del diario Dove nascono i mondi",
  },
  {
    key: "codex",
    number: "03",
    eyebrow: "La memoria dei mondi",
    title: "LoreWise Codex",
    description: "Personaggi, universi, continuità e fonti custoditi in dossier editoriali distinti.",
    action: "Consulta il Codex",
    href: "/enciclopedia",
    image: "/codex/seals/lorewise-codex-emblem-v1.webp",
    imageAlt: "Emblema del LoreWise Codex",
  },
] as const;

export default function WorldsGatewayPage() {
  return <main className="worlds-gateway">
    <section className="worlds-gateway-scene" aria-labelledby="worlds-gateway-title">
      <div className="worlds-gateway-stars" aria-hidden="true"><i /><i /><i /><i /><i /></div>
      <div className="shell worlds-gateway-inner">
        <header className="worlds-gateway-heading">
          <Image src="/brand/navigation/mondi.webp" alt="" width={420} height={420} priority unoptimized />
          <div><p>Archivio narrativo · GiWise Studio</p><h1 id="worlds-gateway-title">Tre sentieri.<br />Un solo universo.</h1></div>
          <p>Scopri ciò che accade nei mondi, osserva come nascono e approfondisci personaggi e legami nel Codex.</p>
        </header>

        <nav className="worlds-convergence" aria-label="I tre percorsi dell’area Mondi">
          {worldPaths.map((path) => <Link className={`worlds-route worlds-route-${path.key}`} href={path.href} key={path.key}>
            <span className="worlds-route-orbit" aria-hidden="true" />
            <span className="worlds-route-emblem"><Image src={path.image} alt={path.imageAlt} width={560} height={560} sizes="(max-width: 760px) 34vw, 16vw" unoptimized /></span>
            <span className="worlds-route-copy"><small>{path.number} · {path.eyebrow}</small><strong>{path.title}</strong><span>{path.description}</span><b>{path.action} <i aria-hidden="true">→</i></b></span>
          </Link>)}
        </nav>

        <footer className="worlds-gateway-legend"><span>Ciò che accade</span><i aria-hidden="true" /><span>Come nasce</span><i aria-hidden="true" /><span>Come si approfondisce</span></footer>
      </div>
    </section>
  </main>;
}
