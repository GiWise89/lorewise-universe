import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const [catalogSource, auditSource] = process.argv.slice(2);

if (!catalogSource || !auditSource) {
  throw new Error("Uso: node scripts/import-shop-catalog-audit.mjs <catalogo.json> <audit.json>");
}

const projectRoot = process.cwd();
const dataRoot = path.join(projectRoot, "data");
const docsRoot = path.join(projectRoot, "docs");
const catalog = JSON.parse(await readFile(catalogSource, "utf8"));
const audit = JSON.parse(await readFile(auditSource, "utf8"));

await Promise.all([
  mkdir(dataRoot, { recursive: true }),
  mkdir(docsRoot, { recursive: true }),
]);

const catalogOutput = path.join(dataRoot, "shop-live-catalog.json");
const auditOutput = path.join(dataRoot, "shop-asset-audit.json");
const storefrontOutput = path.join(dataRoot, "shop-storefront-catalog.json");

await writeFile(catalogOutput, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
await writeFile(auditOutput, `${JSON.stringify(audit, null, 2)}\n`, "utf8");

const slugify = (value) => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "")
  .slice(0, 78);

const storefrontProducts = catalog.products.flatMap((product, index) => {
  const candidates = audit.entries
    .filter((entry) => entry.products.some((candidate) => candidate.href === product.href))
    .sort((left, right) => {
      const leftScore = left.status === "exact-verified" ? 0 : 1;
      const rightScore = right.status === "exact-verified" ? 0 : 1;
      return leftScore - rightScore || left.file.localeCompare(right.file, "it", { sensitivity: "base" });
    });

  if (!candidates.length) return [];

  const sourceFile = candidates[0].file;
  const productSlug = slugify(`${product.name}-${index + 1}`);
  return [{
    id: `GS-${String(index + 1).padStart(3, "0")}`,
    name: product.name,
    price: product.price,
    category: product.category,
    href: product.href,
    sourceFile,
    image: `/shop/catalog/${productSlug}.webp`,
    verifiedOn: catalog.verifiedOn,
  }];
});

const storefront = {
  verifiedOn: catalog.verifiedOn,
  source: catalog.source,
  productCount: storefrontProducts.length,
  excludedPublicProducts: catalog.products
    .filter((product) => !storefrontProducts.some((candidate) => candidate.href === product.href))
    .map(({ name, price, category, href }) => ({ name, price, category, href, reason: "Immagine locale non presente" })),
  products: storefrontProducts,
};

await writeFile(storefrontOutput, `${JSON.stringify(storefront, null, 2)}\n`, "utf8");

const statusLabels = {
  "exact-verified": "Corrispondenza esatta",
  "variant-verified": "Variante verificata nella scheda",
  "reference-only": "File di servizio, non prodotto",
  "not-public": "Nessuna scheda pubblica attiva",
};

const statusCounts = audit.entries.reduce((counts, entry) => {
  counts[entry.status] = (counts[entry.status] ?? 0) + 1;
  return counts;
}, {});

const categoryCounts = catalog.products.reduce((counts, product) => {
  counts[product.category] = (counts[product.category] ?? 0) + 1;
  return counts;
}, {});

const rows = audit.entries
  .slice()
  .sort((left, right) => left.file.localeCompare(right.file, "it", { sensitivity: "base" }))
  .map((entry) => {
    const product = entry.products[0];
    const destination = product
      ? `[${product.name}](${product.href}) — ${product.price}`
      : entry.status === "reference-only"
        ? "Materiale informativo interno"
        : "Non presente nel catalogo pubblico verificato";

    return `| ${entry.file.replaceAll("|", "\\|")} | ${statusLabels[entry.status] ?? entry.status} | ${destination} |`;
  });

const report = `# GiWise Shop — registro immagini e catalogo verificato

Verifica eseguita il 19 agosto 2026 confrontando la cartella locale con le immagini e le varianti pubblicate su [GiWiseShop.it](https://giwiseshop.it/).

## Risultato

- File locali controllati: **${audit.entries.length}**
- Corrispondenze esatte con asset pubblici: **${statusCounts["exact-verified"] ?? 0}**
- Varianti confermate nelle schede prodotto: **${statusCounts["variant-verified"] ?? 0}**
- File informativi, non destinati al catalogo: **${statusCounts["reference-only"] ?? 0}**
- Immagini prive di una scheda pubblica attiva: **${statusCounts["not-public"] ?? 0}**
- Prodotti pubblici rilevati: **${catalog.products.length}**

## Prodotti pubblici per sezione

${Object.entries(categoryCounts).map(([category, count]) => `- ${category}: **${count}**`).join("\n")}

## Regole applicate

- Una corrispondenza è “esatta” soltanto quando il file locale coincide con un asset effettivamente servito dal negozio.
- Le felpe e le altre varianti non mostrate come anteprima principale sono collegate solo dopo averne verificato la presenza nel selettore della scheda prodotto.
- Guide alle taglie e materiali informativi non diventano prodotti.
- Un file senza una scheda pubblica attiva resta escluso dalla vetrina fino a una decisione esplicita.
- Nomi, prezzi e indirizzi restano quelli pubblicati da GiWiseShop; LoreWise non simula disponibilità o checkout.

## Registro completo

| File locale | Verifica | Scheda associata |
| --- | --- | --- |
${rows.join("\n")}
`;

const reportOutput = path.join(docsRoot, "giwise-shop-catalog-audit.md");
await writeFile(reportOutput, report, "utf8");

console.log(`Catalogo: ${path.relative(projectRoot, catalogOutput)}`);
console.log(`Associazioni: ${path.relative(projectRoot, auditOutput)}`);
console.log(`Vetrina: ${path.relative(projectRoot, storefrontOutput)}`);
console.log(`Rapporto: ${path.relative(projectRoot, reportOutput)}`);
