import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "LoreWise VIP",
  description: "La soglia premium verso l’Area VIP e il LoreWise Universe Pass.",
};

const vipPaths = [
  {
    key: "area",
    number: "01",
    eyebrow: "Contenuti ed eventi",
    title: "Area VIP",
    description: "Guide settimanali, download, eventi, votazioni e anteprime riservate riuniti in un’esperienza ordinata.",
    action: "Entra nell’Area VIP",
    href: "/vip-zone",
    image: "/brand/icons/lorewise-vip-official-v1.webp",
    alt: "Emblema dell’Area LoreWise VIP",
  },
  {
    key: "pass",
    number: "02",
    eyebrow: "Accesso e vantaggi",
    title: "Universe Pass",
    description: "Piani, crediti Arte, sconti, partecipazione e storico dei vantaggi collegati al tuo LoreWise ID.",
    action: "Scopri Universe Pass",
    href: "/abbonamento",
    image: "/brand/lorewise-universe-logo-concept-c.webp",
    alt: "LoreWise Universe by GiWise Studio",
  },
] as const;

export default function VipGatewayPage() {
  return <main className="vip-gateway">
    <section className="vip-gateway-scene" aria-labelledby="vip-gateway-title">
      <div className="vip-gateway-aura" aria-hidden="true"><i /><i /><i /><i /></div>
      <div className="shell vip-gateway-inner">
        <header className="vip-gateway-heading">
          <Image src="/brand/navigation/vip.webp" alt="" width={420} height={420} priority unoptimized />
          <p>Ingresso riservato · LoreWise Universe</p>
          <h1 id="vip-gateway-title">Il privilegio<br />ha due porte.</h1>
          <span>Una conduce ai contenuti che vivi. L’altra governa il Pass che li rende accessibili.</span>
        </header>

        <nav className="vip-thresholds" aria-label="I due percorsi LoreWise VIP">
          {vipPaths.map((path) => <Link className={`vip-threshold vip-threshold-${path.key}`} href={path.href} key={path.key}>
            <span className="vip-threshold-light" aria-hidden="true" />
            <span className="vip-threshold-emblem"><Image src={path.image} alt={path.alt} width={720} height={720} sizes="(max-width: 700px) 40vw, 20vw" unoptimized /></span>
            <span className="vip-threshold-copy"><small>{path.number} · {path.eyebrow}</small><strong>{path.title}</strong><span>{path.description}</span><b>{path.action} <i aria-hidden="true">→</i></b></span>
          </Link>)}
        </nav>

        <p className="vip-gateway-note">Un solo LoreWise ID · accessi verificati · vantaggi sempre tracciabili</p>
      </div>
    </section>
  </main>;
}
