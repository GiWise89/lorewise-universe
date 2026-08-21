import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ShopProductGallery from "@/components/shop/ShopProductGallery";
import { getShopProductDetail, shopProductDetails } from "@/lib/shop-product-details";

export function generateStaticParams() {
  return shopProductDetails.map((product) => ({ id: product.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const product = getShopProductDetail(id);
  if (!product) return {};
  return { title: `${product.name} | GiWise Shop`, description: product.introduction };
}

export default async function ShopProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = getShopProductDetail(id);
  if (!product) notFound();

  return (
    <main className="shop-product-page">
      <header className="shop-product-masthead">
        <div className="shell">
          <Link href="/shop/catalogo">← Torna al catalogo</Link>
          <div className="shop-product-title-line"><span>{product.id}</span><span>{product.category}</span><span>{product.identity}</span></div>
          <h1>{product.name}</h1>
          <p>{product.introduction}</p>
        </div>
      </header>

      <section className="shell shop-product-presentation" aria-label={`Presentazione di ${product.name}`}>
        <ShopProductGallery images={product.images} />
        <div className="shop-product-purchase">
          <p className="eyebrow">Edizione e acquisto</p>
          <div className="shop-product-price"><span>A partire da</span><strong>{product.price}</strong></div>
          <p>{product.description}</p>
          <dl>{product.facts.map((fact) => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl>
          <a href={product.externalHref} target="_blank" rel="noopener noreferrer">Scegli variante e acquista <span aria-hidden="true">↗</span></a>
          <small>Prezzo e varianti verificati il {product.verifiedOn}. Il pagamento avviene sul negozio esterno.</small>
        </div>
      </section>

      <section className="shop-product-variants" aria-labelledby="shop-product-variants-title">
        <div className="shell">
          <p className="eyebrow">Varianti verificate</p>
          <h2 id="shop-product-variants-title">Consulta l’opzione verificata, poi conferma sul negozio.</h2>
          <div>{product.variants.map((variant, index) => <article key={variant.name}><span>{String(index + 1).padStart(2, "0")}</span><h3>{variant.name}</h3><strong>{variant.price}</strong><p>{variant.note}</p></article>)}</div>
        </div>
      </section>

      <aside className="shell shop-product-checkout-note">
        <div><p className="eyebrow">Prima di ordinare</p><h2>La scheda esterna rimane decisiva.</h2></div>
        <p>Controlla il capo selezionato, il colore, la taglia, il prezzo finale e i costi di spedizione prima del pagamento. LoreWise presenta il prodotto; produzione, ordine e consegna sono gestiti da GiWiseShop.it tramite Hoplix.</p>
      </aside>
    </main>
  );
}
