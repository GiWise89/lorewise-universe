import Image from "next/image";
import Link from "next/link";
import { HorizontalScrollHint } from "@/components/HorizontalScrollHint";

const externalLinkProps = { target: "_blank", rel: "noopener noreferrer" } as const;

export function ShopBridge() {
  return (
    <aside className="shop-bridge" aria-label="Collegamento tra LoreWise Universe e GiWise Shop">
      <div className="shell shop-bridge-inner">
        <div className="shop-bridge-identity">
          <Image src="/brand/icons/shop-concept-v1.webp" alt="" width={1224} height={1285} unoptimized />
          <div>
            <span>LoreWise Universe presenta</span>
            <strong>GiWise Shop</strong>
          </div>
        </div>

        <p>Merch e accessori collegati all’universo GiWise. Produzione, pagamento e spedizione sono gestiti da Hoplix.</p>

        <nav aria-label="Navigazione dell’area GiWise Shop">
          <HorizontalScrollHint className="shop-bridge-scroll-hint" />
          <Link href="/shop">Vetrina</Link>
          <Link href="/shop/catalogo">Catalogo verificato</Link>
          <a href="https://giwiseshop.it/" {...externalLinkProps}>Apri GiWiseShop.it <span aria-hidden="true">↗</span></a>
        </nav>
      </div>
    </aside>
  );
}
