import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { HorizontalScrollHint } from "@/components/HorizontalScrollHint";
import { HashTargetFocus } from "@/components/HashTargetFocus";
import { MembershipPurchaseButton } from "@/components/MembershipPurchaseButton";

export const metadata: Metadata = {
  title: "LoreWise Universe Pass",
  description: "Arte, giochi, commissioni, Codex e partecipazione: tutti i vantaggi del LoreWise Universe Pass.",
};

const plans = [
  {
    name: "Supporter", code: "LW-PASS-SUPPORTER", price: "7,90 € / mese", kicker: "Per sostenere e partecipare",
    art: "1 credito Arte ogni mese · massimo 2", discount: "5% automatico",
    benefits: ["Un’opera originale autorizzata per ogni credito", "5% su commissioni, giochi e prodotti digitali ammessi", "Diari anticipati, materiali di sviluppo e demo riservate", "Candidature alle beta e votazioni verificate", "Codex personale e badge Supporter nella Community"],
  },
  {
    name: "Collector", code: "LW-PASS-COLLECTOR", price: "13,90 € / mese", kicker: "Per collezionare e seguire da vicino",
    art: "2 crediti Arte ogni mese · massimo 4", discount: "10% automatico", featured: true,
    benefits: ["Due opere originali autorizzate per ogni mese pagato", "10% su commissioni, giochi e prodotti digitali ammessi", "Tutti i vantaggi Supporter e accessi anticipati", "Priorità sulle commissioni e dossier GiWise estesi", "Edizioni digitali numerate, licenza nominativa e badge Collector"],
  },
];

const faq = [
  ["Come vengono applicati gli sconti?", "Il sistema riconosce il piano dal LoreWise ID e calcola lo sconto sul server. Non servono codici promozionali e nel riepilogo vedrai prezzo iniziale, percentuale e totale finale."],
  ["Quando arrivano i crediti Arte?", "Solo dopo la conferma del pagamento mensile. Nell’Area personale trovi assegnazione, utilizzo e scadenza. I crediti non possono essere duplicati o trasferiti."],
  ["Perdo le opere già riscattate se annullo?", "No. Le opere già riscattate e la relativa licenza personale restano nel tuo archivio. Terminano soltanto i vantaggi legati al piano attivo."],
  ["I giochi sono compresi?", "The Wound Remembers e Demon Match Three entreranno nel Pass quando le rispettive edizioni scaricabili saranno approvate. L’acquisto singolo resterà disponibile per chi vuole conservarne una licenza permanente."],
  ["Fuori Trama sarà a pagamento?", "No. Fuori Trama è previsto gratuito per tutti. Gli abbonati potranno ricevere diari anticipati, materiali di sviluppo e candidature alle future beta."],
  ["Posso comprare un’opera senza abbonarmi?", "Sì. Il catalogo Arte mantiene anche l’acquisto singolo. Il Pass aggiunge crediti mensili e vantaggi, ma non chiude l’accesso ai visitatori."],
  ["Il badge dà privilegi nella Community?", "No. Indica soltanto Supporter o Collector: non assegna poteri di moderazione e non rende un giudizio più autorevole degli altri."],
];

const passAreas = [
  { id: "arte", label: "Arte", description: "Crediti mensili, opere autorizzate e archivio personale.", icon: "/brand/icons/vip-art-v1.webp" },
  { id: "giochi", label: "Giochi", description: "Edizioni incluse, accessi anticipati e diari di sviluppo.", icon: "/brand/icons/vip-games-v1.webp" },
  { id: "commissioni", label: "Commissioni", description: "Sconti riconosciuti automaticamente dal LoreWise ID.", icon: "/brand/icons/commissioni-panoramica-v2.webp" },
  { id: "codex", label: "Codex", description: "Personaggi, opere e dossier custoditi nel tuo archivio.", icon: "/brand/icons/pass-codex-v1.webp" },
  { id: "community", label: "Community", description: "Votazioni, candidature e partecipazione verificabile.", icon: "/brand/icons/pass-community-v1.webp" },
] as const;

export default async function MembershipPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const focusPlans = query?.focus === "piani";
  return (
    <main className="pass-page">
      <HashTargetFocus targetId="piani" active={focusPlans} />
      <section className="pass-hero" aria-labelledby="pass-title">
        <div className="pass-hero-shade" />
        <div className="shell pass-hero-layout">
          <div className="pass-hero-copy">
            <p className="pass-eyebrow">LoreWise Universe Pass</p>
            <h1 id="pass-title">Il tuo posto<br />dentro LoreWise.</h1>
            <p className="pass-lead">Un solo LoreWise ID collega Arte, Giochi, Commissioni, Codex e Community. Il piano viene riconosciuto automaticamente e ogni vantaggio compare dove serve.</p>
            <div className="pass-hero-actions"><Link className="pass-button pass-button-primary" href="#piani">Confronta i piani</Link><Link className="pass-button pass-button-ghost" href="#vantaggi">Scopri tutti i vantaggi</Link></div>
            <p className="pass-test-note"><span>Pagamento trasparente</span> Il pulsante indica sempre se Stripe opera in prova oppure in modalità reale prima di aprire il checkout.</p>
          </div>
          <div className="pass-hero-universe" aria-label="Le cinque aree collegate dal LoreWise Universe Pass">
            <span className="pass-universe-orbit pass-universe-orbit-outer" aria-hidden="true" />
            <span className="pass-universe-orbit pass-universe-orbit-inner" aria-hidden="true" />
            <span className="pass-universe-spark pass-universe-spark-one" aria-hidden="true">✦</span>
            <span className="pass-universe-spark pass-universe-spark-two" aria-hidden="true">✧</span>
            <Image className="pass-universe-mark" src="/brand/lorewise-universe-logo-concept-c.webp" alt="LoreWise Universe" width={1200} height={1200} priority unoptimized />
            <span className="pass-universe-node pass-universe-node-art">Arte</span>
            <span className="pass-universe-node pass-universe-node-games">Giochi</span>
            <span className="pass-universe-node pass-universe-node-commissions">Commissioni</span>
            <span className="pass-universe-node pass-universe-node-codex">Codex</span>
            <span className="pass-universe-node pass-universe-node-community">Community</span>
          </div>
        </div>
      </section>

      <nav className="pass-section-nav" aria-label="Vantaggi inclusi">
        <HorizontalScrollHint className="pass-scroll-hint" />
        <div className="shell">
          {passAreas.map((area) => <a href={`#${area.id}`} data-area={area.id} key={area.id}>
            <Image className="pass-area-icon" src={area.icon} alt="" aria-hidden="true" width={768} height={768} unoptimized />
            <span>
              <small>Vantaggio incluso</small>
              <strong>{area.label}</strong>
              <em>{area.description}</em>
            </span>
            <b>Scopri <i aria-hidden="true">→</i></b>
          </a>)}
        </div>
      </nav>

      <section className="pass-intro shell" id="vantaggi"><p className="pass-eyebrow">Non una raccolta di promesse</p><h2>Ogni vantaggio ha un posto, una regola e uno storico.</h2><p>Crediti, sconti, accessi e partecipazione sono collegati allo stesso account. Puoi vedere cosa hai, quando lo hai ricevuto e come è stato utilizzato.</p></section>

      <section className="pass-chapter pass-chapter-art" id="arte"><div className="shell pass-chapter-grid">
        <div className="pass-visual pass-art-visual">{[40, 63, 35].map((number) => <Image key={number} src={`/artworks/previews/lw-art-${String(number).padStart(3, "0")}-preview.jpg`} alt={`Anteprima protetta LW-ART-${String(number).padStart(3, "0")}`} width={1131} height={1600} />)}</div>
        <div className="pass-chapter-copy"><p className="pass-eyebrow">01 · Arte originale</p><h2>La collezione cresce con te.</h2><p>Ogni mese pagato assegna crediti reali nel portafoglio del tuo account. Li usi soltanto sulle opere autorizzate alla distribuzione, con file protetto e licenza personale.</p><dl className="pass-facts"><div><dt>Supporter</dt><dd>1 credito · massimo 2</dd></div><div><dt>Collector</dt><dd>2 crediti · massimo 4</dd></div><div><dt>Dopo l’annullamento</dt><dd>Le opere riscattate restano tue</dd></div></dl><Link className="pass-text-link" href="/arte">Esplora Arte in Vetrina <span aria-hidden="true">→</span></Link></div>
      </div></section>

      <section className="pass-chapter pass-chapter-games" id="giochi"><div className="shell">
        <div className="pass-section-heading"><div><p className="pass-eyebrow">02 · Giochi GiWise</p><h2>Gioca, prova, segui lo sviluppo.</h2></div><p>Edizioni comprese durante il piano attivo, accessi anticipati e acquisto permanente restano percorsi distinti e sempre dichiarati.</p></div>
        <div className="pass-game-stage">
          <article className="pass-game pass-game-wound"><Image className="pass-game-bg" src="/games/the-wound-remembers/gameplay-battle.webp" alt="Battaglia reale di The Wound Remembers" fill sizes="(max-width: 900px) 100vw, 50vw" /><div className="pass-game-overlay" /><div className="pass-game-copy"><Image src="/games/the-wound-remembers/logo-white-v2.webp" alt="The Wound Remembers" width={520} height={210} /><span>€7,99 al lancio · €9,99 in futuro</span><p>Edizione inclusa nel Pass quando il pacchetto scaricabile sarà approvato.</p></div></article>
          <article className="pass-game pass-game-demon"><Image className="pass-game-bg" src="/games/demon-match-three/gameplay-current-battle.webp" alt="Griglia di gioco reale di Demon Match Three" fill sizes="(max-width: 900px) 100vw, 50vw" /><div className="pass-game-overlay" /><div className="pass-game-copy"><Image src="/games/demon-match-three/logo-official-v2.webp" alt="Demon Match Three" width={560} height={300} /><span>€5,99 al lancio · €7,99 in futuro</span><p>EXE e APK saranno distribuiti direttamente dal catalogo LoreWise.</p></div></article>
        </div>
        <div className="pass-game-foot"><p><strong>Fuori Trama resta gratuito per tutti.</strong> Il Pass aggiunge materiali anticipati, diari e candidature alle beta: non vende l’accesso al gioco.</p><Link className="pass-text-link" href="/giochi">Apri il catalogo Giochi <span aria-hidden="true">→</span></Link></div>
      </div></section>

      <section className="pass-chapter pass-chapter-commissions" id="commissioni"><div className="shell pass-chapter-grid pass-chapter-reverse">
        <div className="pass-visual pass-commission-visual"><Image src="/commissions/previews-webp/lw-com-001-preview.webp" alt="Esempio reale dal portfolio Commissioni LoreWise" fill sizes="(max-width: 900px) 100vw, 48vw" /></div>
        <div className="pass-chapter-copy"><p className="pass-eyebrow">03 · Commissioni</p><h2>Il tuo prezzo sa già chi sei.</h2><p>Nessun codice da ricordare o condividere. Quando richiedi un disegno, il server legge il piano attivo dal LoreWise ID e mostra il calcolo completo prima della conferma.</p><div className="pass-price-example" aria-label="Esempio di sconto automatico su una commissione da 79 euro"><span>Commissione Dettagliata</span><strong>€79,00</strong><div><small>Supporter · −5%</small><b>€75,05</b></div><div><small>Collector · −10%</small><b>€71,10</b></div></div><Link className="pass-text-link" href="/commissioni">Scopri le Commissioni <span aria-hidden="true">→</span></Link></div>
      </div></section>

      <section className="pass-chapter pass-chapter-codex" id="codex"><div className="shell pass-chapter-grid">
        <div className="pass-codex-pair" aria-label="Tre personaggi conservabili nel Codex personale">
          <figure><Image src="/codex/display/fuori-trama/batman.webp" alt="Batman nel Codex LoreWise" fill sizes="(max-width: 900px) 34vw, 18vw" /><figcaption>Universi eroici</figcaption></figure>
          <figure><Image src="/codex/display/fuori-trama/lara-croft.webp" alt="Lara Croft nel Codex LoreWise" fill sizes="(max-width: 900px) 40vw, 21vw" /><figcaption>Icone videoludiche</figcaption></figure>
          <figure><Image src="/codex/display/fuori-trama/son-goku.webp" alt="Son Goku nel Codex LoreWise" fill sizes="(max-width: 900px) 34vw, 18vw" /><figcaption>Leggende anime</figcaption></figure>
        </div>
        <div className="pass-chapter-copy"><p className="pass-eyebrow">04 · Codex personale</p><h2>Il tuo archivio, non una lista anonima.</h2><p>Salva personaggi, opere e dossier preferiti in raccolte collegate al tuo account. Collector riceve inoltre dossier estesi dedicati esclusivamente ai contenuti originali GiWise.</p><ul className="pass-checks"><li>Segnalibri sincronizzati</li><li>Personaggi e opere preferiti</li><li>Raccolte personalizzate</li><li>Dossier originali estesi per Collector</li></ul><Link className="pass-text-link" href="/enciclopedia">Entra nel Codex <span aria-hidden="true">→</span></Link></div>
      </div></section>

      <section className="pass-chapter pass-chapter-community" id="community"><div className="shell pass-community-layout"><div><p className="pass-eyebrow">05 · Community e sviluppo</p><h2>Partecipa. Senza comprare autorevolezza.</h2></div><div className="pass-community-list"><article><span>01</span><h3>Votazioni verificabili</h3><p>Un voto per LoreWise ID, con apertura, chiusura e risultato visibili.</p></article><article><span>02</span><h3>Candidature ai test</h3><p>Sessioni reali con periodo, requisiti e posti dichiarati.</p></article><article><span>03</span><h3>Badge discreto</h3><p>Supporter o Collector accanto alle recensioni, senza privilegi di moderazione.</p></article></div></div></section>

      <section className="pass-benefit-center shell" aria-labelledby="benefit-center-title">
        <div className="pass-center-copy"><p className="pass-eyebrow">Centro “I miei vantaggi”</p><h2 id="benefit-center-title">Tutto quello che hai. Tutto quello che hai usato.</h2><p>Una schermata unica nell’Area personale riunisce piano, crediti, sconti, accessi anticipati, votazioni, candidature e storico.</p><Link className="pass-button pass-button-light" href="/account#vantaggi">Apri l’Area personale</Link></div>
        <div className="pass-center-preview" aria-label="Anteprima del Centro I miei vantaggi"><div className="pass-center-top"><span>LoreWise ID verificato</span><b>Collector · attivo</b></div><div className="pass-center-metrics"><article><small>Crediti Arte</small><strong>2</strong><span>Disponibili</span></article><article><small>Sconto automatico</small><strong>10%</strong><span>Applicato dal server</span></article><article><small>Opportunità</small><strong>3</strong><span>Aperte ora</span></article></div><div className="pass-center-history"><span>Ultima attività</span><b>Credito mensile assegnato</b><small>Registrato nello storico dell’account</small></div></div>
      </section>

      <section className="pass-pricing" id="piani" data-anchor-focus="true" tabIndex={-1} aria-labelledby="plans-title"><div className="shell">
        <div className="pass-section-heading"><div><p className="pass-eyebrow">Scegli il tuo livello</p><h2 id="plans-title">Due modi di entrare più a fondo.</h2></div><p>Puoi continuare a visitare gratuitamente LoreWise. Il Pass serve a sostenere, collezionare e partecipare di più.</p></div>
        <div className="pass-visitor"><div><span>Visitatore</span><strong>Gratuito</strong></div><p>Cataloghi pubblici, anteprime protette, diario pubblico e contenuti gratuiti restano accessibili senza abbonamento.</p></div>
        <div className="pass-plan-grid">{plans.map((plan) => <article key={plan.name} className={plan.featured ? "pass-plan-card pass-plan-featured" : "pass-plan-card"}>{plan.featured ? <span className="pass-plan-label">Più completo</span> : null}<p>{plan.kicker}</p><h3>{plan.name}</h3><div className="pass-plan-price">{plan.price}</div><div className="pass-plan-highlights"><span>{plan.art}</span><span>{plan.discount}</span></div><ul>{plan.benefits.map((benefit) => <li key={benefit}>{benefit}</li>)}</ul><MembershipPurchaseButton productCode={plan.code} priceLabel={plan.price} /></article>)}</div>
        <p className="pass-checkout-note">Il pagamento passa da Stripe e viene collegato al LoreWise ID. Prezzo, rinnovo mensile, annullamento e vantaggi restano visibili e gestibili dall’Area personale.</p>
      </div></section>

      <section className="pass-how shell" aria-labelledby="how-title"><p className="pass-eyebrow">Come funziona</p><h2 id="how-title">Dal piano al vantaggio, senza passaggi nascosti.</h2><ol><li><span>01</span><div><strong>Accedi</strong><p>Il LoreWise ID identifica un solo account.</p></div></li><li><span>02</span><div><strong>Scegli il piano</strong><p>Supporter o Collector, con rinnovo mensile.</p></div></li><li><span>03</span><div><strong>Pagamento confermato</strong><p>I vantaggi nascono soltanto dopo conferma.</p></div></li><li><span>04</span><div><strong>Assegnazione</strong><p>Crediti e accessi entrano nel Centro vantaggi.</p></div></li><li><span>05</span><div><strong>Applicazione automatica</strong><p>Sconti e permessi vengono calcolati dal server.</p></div></li><li><span>06</span><div><strong>Storico verificabile</strong><p>Ogni utilizzo resta visibile nell’account.</p></div></li></ol></section>

      <section className="pass-faq shell" aria-labelledby="faq-title"><p className="pass-eyebrow">Domande chiare, prima di aderire</p><h2 id="faq-title">Tutto quello che devi sapere.</h2><div>{faq.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></section>

      <section className="pass-final"><div className="shell pass-final-inner"><div><p className="pass-eyebrow">LoreWise Universe Pass</p><h2>Non guardare soltanto l’universo.<br />Entra a farne parte.</h2><p>Parti da Supporter o scegli Collector per ottenere più crediti, più sconto e dossier estesi.</p></div><div className="pass-final-actions">{plans.map((plan) => <div key={plan.name}><strong>{plan.name}</strong><MembershipPurchaseButton productCode={plan.code} priceLabel={plan.price} /></div>)}</div></div></section>
    </main>
  );
}
