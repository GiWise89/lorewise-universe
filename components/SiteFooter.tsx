import Image from "next/image";
import Link from "next/link";

const footerExplore = [
  ["Giochi", "/giochi"], ["Mondi", "/mondi"], ["Arte", "/arte"], ["Commissioni", "/commissioni"],
  ["LoreWise Codex", "/enciclopedia"], ["GiWise Shop", "/shop"], ["Community", "/community"], ["Universe Pass", "/abbonamento"],
] as const;

const footerSupport = [
  ["Contatti", "/contatti"], ["Assistenza giochi", "/assistenza-giochi"], ["Privacy", "/privacy"],
  ["Condizioni commissioni", "/commissioni/condizioni"], ["Condizioni giochi", "/condizioni-vendita-giochi"],
] as const;

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div className="footer-identity">
          <div className="footer-brand-lockup">
            <Link className="brand brand-footer" href="/" aria-label="LoreWise Universe, home"><Image src="/brand/lorewise-universe-logo-concept-c.webp" alt="" width={1536} height={1024} unoptimized /></Link>
            <Image className="footer-seal" src="/brand/lorewise-wax-seal-v1.webp" alt="Sigillo LoreWise Universe" width={512} height={512} unoptimized />
          </div>
          <p className="footer-kicker">Un progetto originale GiWise Studio</p>
          <p className="footer-statement">The Wound Remembers è il card RPG dark fantasy di GiWise Studio, ospitato dentro LoreWise Universe.</p>
          <Link className="footer-primary-link" href="/giochi/the-wound-remembers">Scopri e gioca <span aria-hidden="true">→</span></Link>
        </div>
        <div className="footer-column"><h2>Esplora</h2><ul>{footerExplore.map(([label, href]) => <li key={href}><Link href={href}>{label}</Link></li>)}</ul></div>
        <div className="footer-column"><h2>Aiuto e condizioni</h2><ul>{footerSupport.map(([label, href]) => <li key={href}><Link href={href}>{label}</Link></li>)}</ul></div>
      </div>
      <div className="shell footer-bottom"><span>© {new Date().getFullYear()} GiWise Studio. Tutti i diritti riservati.</span><span>Opere originali protette e distribuite secondo licenza.</span></div>
    </footer>
  );
}
