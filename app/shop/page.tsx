import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { shopCollections, shopProducts, shopSupportLinks } from "@/lib/shop-catalog";
import { UniverseGuide } from "@/components/UniverseGuide";

export const metadata: Metadata = {
  title: "GiWise Shop | Merch, accessori e collezioni",
  description: "La vetrina LoreWise dedicata a GiWise Shop: abbigliamento, setup, gadget, collezioni artistiche e prodotti personalizzati.",
};

const externalLinkProps = { target: "_blank", rel: "noopener noreferrer" } as const;

export default function ShopPage() {
  return (
    <main className="giwise-shop-page">
      <section className="giwise-shop-hero" aria-labelledby="giwise-shop-title">
        <div className="shell giwise-shop-hero-inner">
          <div className="giwise-shop-hero-copy">
            <p className="eyebrow">Merch, arte e accessori · GiWise Studio</p>
            <h1 id="giwise-shop-title">Il lato da indossare dell’universo GiWise.</h1>
            <p>Una selezione reale di abbigliamento, oggetti per il setup, stampe e prodotti personalizzabili. LoreWise presenta le collezioni; GiWiseShop.it gestisce produzione, pagamento e consegna.</p>
            <div className="giwise-shop-hero-actions">
              <a href="https://giwiseshop.it/collections/nuovi-arrivi" {...externalLinkProps}>Scopri i nuovi arrivi <span aria-hidden="true">→</span></a>
              <Link href="/shop/catalogo">Esplora il catalogo</Link>
            </div>
            <p className="giwise-shop-verification">103 creazioni collegate allo shop ufficiale, con prezzo e disponibilità mostrati nella pagina del prodotto.</p>
          </div>
          <div className="giwise-shop-hero-visual" aria-label="Anteprima delle collezioni GiWise Shop">
            <Image className="giwise-shop-hero-emblem" src="/brand/icons/shop-concept-v1.webp" alt="Emblema GiWise Shop" width={1224} height={1285} priority unoptimized />
            <Image className="giwise-shop-hero-product giwise-shop-hero-product-one" src="/shop/products/mousepad-giwise-gaming.webp" alt="MousePad GiWise Gaming" width={1600} height={1067} priority unoptimized />
            <Image className="giwise-shop-hero-product giwise-shop-hero-product-two" src="/shop/products/quadro-echoes-of-childhood.webp" alt="Quadro Echoes of Childhood" width={1024} height={1536} priority unoptimized />
          </div>
        </div>
      </section>

      <nav className="shell giwise-shop-collections" aria-label="Collezioni GiWise Shop">
        {shopCollections.map((collection, index) => (
          <a key={collection.href} href={collection.label === "Nuovi arrivi" || collection.label === "Personalizza" ? collection.href : `/shop/catalogo?categoria=${encodeURIComponent(collection.label)}`} {...(collection.label === "Nuovi arrivi" || collection.label === "Personalizza" ? externalLinkProps : {})}>
            <Image src={collection.image} alt="" width={900} height={1100} unoptimized />
            <span><small>{String(index + 1).padStart(2, "0")}</small><strong>{collection.label}</strong><i aria-hidden="true">→</i></span>
          </a>
        ))}
      </nav>

      <section className="giwise-shop-catalog" id="catalogo-giwise" aria-labelledby="giwise-shop-catalog-title">
        <div className="shell">
          <header className="giwise-shop-section-heading">
            <div><p className="eyebrow">Selezione dal catalogo reale</p><h2 id="giwise-shop-catalog-title">Dodici ingressi nello shop.</h2></div>
            <p>Prezzi e disponibilità possono cambiare sul negozio esterno. La scheda Hoplix rimane sempre la fonte definitiva prima dell’acquisto.</p>
          </header>
          <div className="giwise-shop-product-ledger">
            {shopProducts.map((product) => (
              <article key={product.href} className="giwise-shop-product">
                <a className="giwise-shop-product-image" href={product.href} aria-label={`Apri ${product.name} su GiWiseShop.it`} {...externalLinkProps}>
                  <Image src={product.image} alt={product.name} fill sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw" style={{ objectFit: "contain", objectPosition: "center" }} unoptimized />
                </a>
                <div className="giwise-shop-product-copy">
                  <div><span>{product.category}</span><strong>{product.price}</strong></div>
                  <h3>{product.name}</h3>
                  <p>{product.note}</p>
                  <a href={product.href} {...externalLinkProps}>Vedi prodotto e varianti <span aria-hidden="true">→</span></a>
                </div>
              </article>
            ))}
          </div>
          <Link className="giwise-shop-all-products" href="/shop/catalogo">Consulta i 103 prodotti in LoreWise <span aria-hidden="true">→</span></Link>
        </div>
      </section>

      <section className="giwise-shop-identities" aria-labelledby="shop-identities-title">
        <div className="shell">
          <div className="giwise-shop-identities-intro">
            <p className="eyebrow">Tre percorsi distinti</p>
            <h2 id="shop-identities-title">Ogni prodotto dichiara da dove nasce.</h2>
            <p>La nuova vetrina separa il mondo originale GiWise, le fan collection e i lavori personalizzati. Non useremo l’etichetta “ufficiale” per soggetti appartenenti ad altri universi.</p>
          </div>
          <div className="giwise-shop-identity-paths">
            <article><Image src="/shop/products/quadro-gaze-of-madness.webp" alt="Quadro The Gaze of Madness" width={1024} height={1536} unoptimized /><span>01</span><h3>Originali GiWise</h3><p>Design, atmosfere e opere nate nell’archivio creativo dello Studio.</p></article>
            <article><Image src="/shop/products/itachi-red-tshirt.webp" alt="T-Shirt della fan collection" width={1024} height={1536} unoptimized /><span>02</span><h3>Fan collection</h3><p>Tributi e interpretazioni riconoscibili, sempre separati dal canone GiWise.</p></article>
            <article><Image src="/shop/products/cuscino-personalizzabile.webp" alt="Esempio di cuscino personalizzabile" width={1024} height={1536} unoptimized /><span>03</span><h3>Creato per te</h3><p>Prodotti costruiti da un brief personale e realizzati solo dopo l’approvazione.</p></article>
          </div>
        </div>
      </section>

      <section className="shell giwise-shop-custom" aria-labelledby="shop-custom-title">
        <div className="giwise-shop-custom-visual"><Image src="/shop/products/cuscino-personalizzabile.webp" alt="Esempio di prodotto GiWise personalizzato" fill sizes="(max-width: 800px) 100vw, 46vw" style={{ objectFit: "contain", objectPosition: "center" }} unoptimized /></div>
        <div className="giwise-shop-custom-copy">
          <p className="eyebrow">GiWise Custom Studio</p>
          <h2 id="shop-custom-title">La tua idea diventa un oggetto reale.</h2>
          <p>Il servizio di personalizzazione riguarda il prodotto fisico: abbigliamento, mousepad, tazze, cover, cuscini, poster e altri supporti. Rimane distinto dalla commissione di un’opera digitale, ma può partire dallo stesso brief creativo.</p>
          <ol><li><span>01</span><div><strong>Racconta l’idea</strong><p>Soggetto, prodotto, stile e destinazione d’uso.</p></div></li><li><span>02</span><div><strong>Ricevi il preventivo</strong><p>Costo della progettazione più prezzo del prodotto.</p></div></li><li><span>03</span><div><strong>Approva il mockup</strong><p>La produzione parte soltanto dopo la conferma.</p></div></li></ol>
          <a href="https://giwiseshop.it/pages/personalizza-il-tuo-prodotto" {...externalLinkProps}>Vai al servizio di personalizzazione <span aria-hidden="true">→</span></a>
        </div>
      </section>

      <section className="giwise-shop-fulfilment" aria-labelledby="shop-fulfilment-title">
        <div className="shell giwise-shop-fulfilment-inner">
          <Image src="/brand/icons/shop-concept-v1.webp" alt="" width={1224} height={1285} unoptimized />
          <div><p className="eyebrow">Acquisto protetto sul negozio esterno</p><h2 id="shop-fulfilment-title">LoreWise presenta. Hoplix produce&nbsp;e consegna.</h2><p>I prodotti vengono stampati su ordinazione. Varianti, pagamento, costi di spedizione e tracking restano gestiti dalle schede GiWiseShop.it e dalle condizioni Hoplix.</p></div>
          <ol><li><span>01</span><strong>Scegli</strong><small>Apri il prodotto e seleziona le varianti disponibili.</small></li><li><span>02</span><strong>Ordina</strong><small>Completa pagamento e indirizzo direttamente su Hoplix.</small></li><li><span>03</span><strong>Segui</strong><small>Usa email e numero d’ordine per controllare la consegna.</small></li></ol>
        </div>
      </section>

      <aside className="shell giwise-shop-support" aria-label="Assistenza GiWise Shop">
        <div><p className="eyebrow">Dopo l’acquisto</p><h2>Ordini, condizioni e assistenza.</h2></div>
        <nav aria-label="Collegamenti di supporto Hoplix">{shopSupportLinks.map((link) => <a key={link.href} href={link.href} {...externalLinkProps}>{link.label}<span aria-hidden="true">↗</span></a>)}</nav>
      </aside>
      <UniverseGuide current="GiWise Shop" items={[
        { href: "/arte", label: "Arte in vetrina", description: "Opere digitali con identità, licenza e disponibilità dichiarate." },
        { href: "/commissioni", label: "Commissioni", description: "Un disegno costruito a partire dalla tua storia." },
        { href: "/contatti", label: "Assistenza", description: "Canali ufficiali per informazioni e supporto." },
      ]} />
    </main>
  );
}
