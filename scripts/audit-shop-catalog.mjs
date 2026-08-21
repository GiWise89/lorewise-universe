import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const storefront = JSON.parse(readFileSync("data/shop-storefront-catalog.json", "utf8"));
const liveCatalog = JSON.parse(readFileSync("data/shop-live-catalog.json", "utf8"));
const products = storefront.products;

assert.equal(products.length, storefront.productCount, "Il totale dichiarato non coincide con il catalogo");
assert.equal(new Set(products.map((product) => product.id)).size, products.length, "Sono presenti codici duplicati");
assert.equal(new Set(products.map((product) => product.href)).size, products.length, "Sono presenti collegamenti duplicati");
assert.equal(new Set(products.map((product) => product.image)).size, products.length, "Sono presenti immagini duplicate");

const liveByHref = new Map(liveCatalog.products.map((product) => [product.href, product]));

for (const product of products) {
  assert.match(product.id, /^GS-\d{3}$/, `Codice LoreWise non valido: ${product.id}`);
  assert.match(product.href, /^https:\/\/giwiseshop\.it\//, `${product.id}: collegamento esterno non valido`);
  assert.ok(existsSync(join(process.cwd(), "public", product.image.replace(/^\//, ""))), `${product.id}: immagine locale mancante`);

  const liveProduct = liveByHref.get(product.href);
  assert.ok(liveProduct, `${product.id}: collegamento assente dal catalogo pubblico verificato`);
  assert.equal(product.name, liveProduct.name, `${product.id}: nome non allineato`);
  assert.equal(product.price, liveProduct.price, `${product.id}: prezzo non allineato`);
  assert.equal(product.category, liveProduct.category, `${product.id}: categoria non allineata`);
}

const excluded = storefront.excludedPublicProducts ?? [];
for (const product of excluded) {
  assert.ok(liveByHref.has(product.href), `Prodotto escluso non rintracciato: ${product.name}`);
  assert.ok(product.reason, `Motivazione di esclusione mancante: ${product.name}`);
}

const numericIds = products.map((product) => Number(product.id.slice(3)));
assert.deepEqual(numericIds, [...numericIds].sort((a, b) => a - b), "I codici LoreWise non sono ordinati");
assert.equal(Math.max(...numericIds) - products.length, excluded.length, "Le lacune nei codici non coincidono con i prodotti esclusi documentati");

console.log(`Shop audit superato: ${products.length} prodotti, ${products.length} immagini locali e ${products.length} collegamenti allineati.`);
console.log(`Prodotti pubblici esclusi e documentati: ${excluded.length}.`);
