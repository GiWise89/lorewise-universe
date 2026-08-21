import type { Metadata } from "next";
import Link from "next/link";
import ShopCatalogExplorer from "@/components/shop/ShopCatalogExplorer";
import { shopStorefrontProducts, shopStorefrontVerifiedOn } from "@/lib/shop-storefront";

export const metadata: Metadata = {
  title: "Catalogo GiWise Shop",
  description: "Catalogo editoriale GiWise Shop con immagini locali verificate e collegamenti alle schede reali Hoplix.",
};

export default async function ShopCatalogPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const requestedCategory = Array.isArray(query?.categoria) ? query?.categoria[0] : query?.categoria;

  return (
    <main className="shop-catalog-page">
      <header className="shop-catalog-hero">
        <div className="shell">
          <Link href="/shop">← Torna a GiWise Shop</Link>
          <p className="eyebrow">Archivio commerciale verificato</p>
          <h1>Ogni immagine conduce al prodotto giusto.</h1>
          <div>
            <p>Una selezione costruita confrontando le immagini locali con il catalogo pubblico. LoreWise organizza e presenta; il negozio esterno conferma varianti, disponibilità e pagamento.</p>
            <strong>{shopStorefrontProducts.length}<span>prodotti con immagine verificata</span></strong>
          </div>
          <small>Ultimo controllo: {shopStorefrontVerifiedOn}</small>
        </div>
      </header>

      <section className="shell shop-catalog-explorer" aria-label="Catalogo prodotti GiWise Shop">
        <ShopCatalogExplorer products={shopStorefrontProducts} initialCategory={requestedCategory ?? "Tutti"} />
      </section>

      <aside className="shop-catalog-handoff">
        <div className="shell"><p className="eyebrow">Prima dell’ordine</p><h2>LoreWise non sostituisce il checkout.</h2><p>Aprendo una scheda passerai a GiWiseShop.it. Controlla sempre prodotto selezionato, colore, taglia, prezzo aggiornato e costi di spedizione prima di pagare.</p></div>
      </aside>
    </main>
  );
}
