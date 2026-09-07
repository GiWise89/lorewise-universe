import Image from "next/image";
import Link from "next/link";
import { navigation } from "@/lib/content";

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
          <p className="footer-statement">Arte, storie, giochi e mondi da esplorare in un unico universo creativo.</p>
          <Link className="footer-primary-link" href="/contatti">Parliamone <span aria-hidden="true">→</span></Link>
        </div>
        <div className="footer-column"><h2>Esplora</h2><ul>{navigation.map((item) => <li key={item.href}><Link href={item.href}>{item.label}</Link></li>)}</ul></div>
        <div className="footer-column"><h2>Tutela e assistenza</h2><ul><li><Link href="/contatti">Contatti e informazioni</Link></li><li><Link href="/assistenza-giochi">Assistenza giochi</Link></li><li><Link href="/contatti#social">Canali social</Link></li><li><Link href="/arte#protezione">Protezione delle opere</Link></li><li><Link href="/licenza-arte">Licenza personale Arte</Link></li><li><Link href="/commissioni/condizioni">Condizioni commissioni</Link></li><li><Link href="/condizioni-vendita-giochi">Condizioni giochi digitali</Link></li><li><Link href="/privacy">Privacy e dati</Link></li></ul></div>
      </div>
      <div className="shell footer-bottom"><span>© {new Date().getFullYear()} GiWise Studio. Tutti i diritti riservati.</span><span>Opere originali protette e distribuite secondo licenza.</span></div>
    </footer>
  );
}
