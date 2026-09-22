import Image from "next/image";
import Link from "next/link";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { footerSupportLinks, siteAreas } from "@/lib/siteNavigation";

// Stesse aree e stessi nomi del menu: la colonna mostra ogni area e le sue voci principali.
const footerExplore = siteAreas.flatMap((area) => [
  { label: area.label, href: area.href },
  ...area.links.filter((link) => link.footer && link.href !== area.href),
]);

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div className="footer-identity">
          <div className="footer-brand-lockup">
            <Link className="brand brand-footer" href="/" aria-label="LoreWise Universe, home"><Image src="/brand/lorewise-universe-logo-concept-c.webp" alt="" width={1536} height={1024} unoptimized /></Link>
            <Image className="footer-seal" src="/brand/lorewise-wax-seal-256-v1.webp" alt="Sigillo LoreWise Universe" width={256} height={256} unoptimized />
          </div>
          <p className="footer-kicker">Un progetto originale GiWise Studio</p>
          <p className="footer-statement">LoreWise Universe è il sito di GiWise Studio: giochi, mondi, arte originale e community in un unico posto.</p>
          <Link className="footer-primary-link" href="/giochi">Scopri i giochi <span aria-hidden="true">→</span></Link>
          <div style={{ marginTop: 28, maxWidth: 520 }}><NewsletterSignup variant="cronache" topic="cronache" tone="dark" compact /></div>
        </div>
        <div className="footer-column"><h2>Esplora</h2><ul>{footerExplore.map(({ label, href }) => <li key={href}><Link href={href}>{label}</Link></li>)}</ul></div>
        <div className="footer-column"><h2>Aiuto e condizioni</h2><ul>{footerSupportLinks.map(({ label, href }) => <li key={href}><Link href={href}>{label}</Link></li>)}</ul></div>
      </div>
      <div className="shell footer-bottom"><span>© {new Date().getFullYear()} GiWise Studio. Tutti i diritti riservati.</span><span>Opere originali protette e distribuite secondo licenza.</span></div>
    </footer>
  );
}
