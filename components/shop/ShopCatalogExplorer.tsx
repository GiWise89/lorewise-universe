"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { getShopProductDetailHref } from "@/lib/shop-product-details";
import { shopStorefrontCategories, type ShopStorefrontProduct } from "@/lib/shop-storefront";

const pageSize = 12;

type Props = {
  products: ShopStorefrontProduct[];
  initialCategory: string;
};

export default function ShopCatalogExplorer({ products, initialCategory }: Props) {
  const supportedInitialCategory = shopStorefrontCategories.some((category) => category.value === initialCategory)
    ? initialCategory
    : "Tutti";
  const [category, setCategory] = useState(supportedInitialCategory);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("it");
    return products.filter((product) => {
      const categoryMatches = category === "Tutti" || product.category === category;
      const queryMatches = !normalizedQuery || product.name.toLocaleLowerCase("it").includes(normalizedQuery);
      return categoryMatches && queryMatches;
    });
  }, [category, products, query]);

  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const visibleProducts = filteredProducts.slice((safePage - 1) * pageSize, safePage * pageSize);

  const selectCategory = (nextCategory: string) => {
    setCategory(nextCategory);
    setPage(1);
  };

  const updateQuery = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  return (
    <>
      <div className="shop-catalog-controls">
        <nav aria-label="Filtra il catalogo per categoria">
          {shopStorefrontCategories.map((item) => (
            <button
              key={item.value}
              type="button"
              className={category === item.value ? "is-active" : undefined}
              aria-pressed={category === item.value}
              onClick={() => selectCategory(item.value)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <label>
          <span>Cerca un prodotto</span>
          <input value={query} onChange={(event) => updateQuery(event.target.value)} placeholder="Titolo o soggetto" type="search" />
        </label>
      </div>

      <div className="shop-catalog-result-line" aria-live="polite">
        <span>{String(filteredProducts.length).padStart(3, "0")}</span>
        <p>{filteredProducts.length === 1 ? "prodotto" : "prodotti"}</p>
        <small>Pagina {safePage} di {pageCount}</small>
      </div>

      {visibleProducts.length ? (
        <div className="shop-catalog-ledger">
          {visibleProducts.map((product) => (
            <article key={product.id}>
              <a className="shop-catalog-artwork" href={getShopProductDetailHref(product.id) ?? product.href} {...(getShopProductDetailHref(product.id) ? {} : { target: "_blank", rel: "noopener noreferrer" })} aria-label={getShopProductDetailHref(product.id) ? `Apri la scheda LoreWise di ${product.name}` : `Apri ${product.name} su GiWiseShop.it`}>
                <Image src={product.image} alt={product.name} fill sizes="(max-width: 680px) 100vw, (max-width: 1100px) 50vw, 33vw" style={{ objectFit: "contain", objectPosition: "center" }} unoptimized />
              </a>
              <div className="shop-catalog-copy">
                <div><span>{product.id} · {product.category}</span><strong>{product.price}</strong></div>
                <h2>{product.name}</h2>
                <p>Prezzo verificato il 19 agosto 2026. Varianti, disponibilità e costo finale vengono confermati nella scheda esterna.</p>
                <a href={getShopProductDetailHref(product.id) ?? product.href} {...(getShopProductDetailHref(product.id) ? {} : { target: "_blank", rel: "noopener noreferrer" })}>{getShopProductDetailHref(product.id) ? "Esplora la scheda LoreWise" : "Apri prodotto e varianti"} <span aria-hidden="true">{getShopProductDetailHref(product.id) ? "→" : "↗"}</span></a>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="shop-catalog-empty"><strong>Nessun prodotto trovato.</strong><p>Prova un nome più breve oppure cambia categoria.</p></div>
      )}

      {pageCount > 1 ? (
        <nav className="shop-catalog-pagination" aria-label="Pagine del catalogo">
          <button type="button" disabled={safePage === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>← Precedente</button>
          <span>{String(safePage).padStart(2, "0")} / {String(pageCount).padStart(2, "0")}</span>
          <button type="button" disabled={safePage === pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))}>Successiva →</button>
        </nav>
      ) : null}
    </>
  );
}
