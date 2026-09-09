import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { HashTargetFocus } from "@/components/HashTargetFocus";
import { MembershipPurchaseButton } from "@/components/MembershipPurchaseButton";
import styles from "./pass-focus.module.css";

export const metadata: Metadata = {
  title: "LoreWise Universe Pass",
  description: "Confronta Supporter e Collector e scopri i vantaggi del LoreWise Universe Pass su arte, giochi, commissioni e partecipazione.",
};

const plans = [
  {
    name: "Supporter", code: "LW-PASS-SUPPORTER", price: "7,90 € / mese",
    purpose: "Per sostenere lo studio e partecipare di più.", featured: false,
    highlights: ["1 credito Arte al mese · massimo 2", "5% su commissioni e prodotti digitali ammessi", "Anteprime, candidature e badge Supporter"],
  },
  {
    name: "Collector", code: "LW-PASS-COLLECTOR", price: "13,90 € / mese",
    purpose: "Per collezionare e seguire LoreWise da vicino.", featured: true,
    highlights: ["2 crediti Arte al mese · massimo 4", "10% su commissioni e prodotti digitali ammessi", "Tutto Supporter, priorità e dossier estesi"],
  },
] as const;

const benefits = [
  { number: "01", title: "Arte", text: "Crediti mensili per le opere autorizzate e già riscattate sempre nel tuo archivio.", href: "/arte", action: "Esplora le opere" },
  { number: "02", title: "Commissioni", text: "Sconto del 5% con Supporter o del 10% con Collector, senza codici da ricordare.", href: "/commissioni", action: "Scopri le commissioni" },
  { number: "03", title: "Giochi", text: "Materiali anticipati, diari di sviluppo e candidature alle future sessioni di prova.", href: "/giochi", action: "Apri i giochi" },
  { number: "04", title: "Codex", text: "Raccolte personali sincronizzate e dossier originali estesi nel piano Collector.", href: "/enciclopedia", action: "Entra nel Codex" },
  { number: "05", title: "Community", text: "Votazioni, candidature e un badge discreto, senza privilegi di moderazione.", href: "/community", action: "Partecipa al Nexus" },
] as const;

const faq = [
  ["Posso continuare gratuitamente?", "Sì. Cataloghi pubblici, anteprime, diario e contenuti gratuiti restano accessibili senza Pass."],
  ["Come funzionano i crediti Arte?", "Arrivano dopo ogni mese pagato: uno per Supporter e due per Collector. Puoi usarli soltanto sulle opere indicate come disponibili."],
  ["Perdo le opere se annullo?", "No. Le opere già riscattate e la relativa licenza personale restano nel tuo archivio."],
  ["I giochi diventano a pagamento?", "No. Fuori Trama resta gratuito e The Wound Remembers resta giocabile. Il Pass aggiunge soltanto vantaggi e contenuti dichiarati."],
  ["Posso annullare il rinnovo?", "Sì. Rinnovo, periodo attivo e vantaggi sono gestibili dalla tua Area personale."],
] as const;

export default async function MembershipPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const focusPlans = query?.focus === "piani";

  return <main className={styles.page}>
    <HashTargetFocus targetId="piani" active={focusPlans} />
    <section className={styles.hero} aria-labelledby="pass-title">
      <div className={`shell ${styles.heroLayout}`}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>LoreWise Universe Pass</p>
          <h1 id="pass-title">Più vicino ai mondi che ami.</h1>
          <p>Colleziona opere, ottieni vantaggi sulle commissioni e partecipa più da vicino ai progetti GiWise. Tutto con il tuo LoreWise ID.</p>
          <div className={styles.actions}><a className={styles.primaryButton} href="#piani">Confronta i piani</a><a className={styles.secondaryButton} href="#vantaggi">Vedi cosa include</a></div>
          <small>LoreWise resta visitabile gratuitamente. Il Pass aggiunge vantaggi, non chiude le porte.</small>
        </div>
        <div className={styles.heroMark}>
          <span aria-hidden="true" />
          <Image src="/brand/lorewise-universe-logo-concept-c.webp" alt="LoreWise Universe" width={1200} height={1200} priority unoptimized />
          <ul aria-label="Vantaggi principali"><li>Arte</li><li>Giochi</li><li>Commissioni</li><li>Community</li></ul>
        </div>
      </div>
    </section>

    <section className={styles.plans} id="piani" data-anchor-focus="true" tabIndex={-1} aria-labelledby="plans-title"><div className="shell">
      <header className={styles.sectionHeading}><div><p className={styles.eyebrow}>Scegli in un colpo d’occhio</p><h2 id="plans-title">Gratuito, Supporter o Collector.</h2></div><p>Parti dal livello che corrisponde al modo in cui vuoi vivere LoreWise. Puoi cambiare idea dalla tua Area personale.</p></header>
      <article className={styles.visitor}><div><strong>Visitatore</strong><span>Gratuito</span></div><p>Esplora mondi, giochi, opere, Codex e contenuti pubblici.</p><Link href="/mondi">Inizia dai mondi →</Link></article>
      <div className={styles.planGrid}>{plans.map((plan) => <article className={plan.featured ? `${styles.planCard} ${styles.featured}` : styles.planCard} key={plan.code}>
        <div className={styles.planTop}>{plan.featured ? <small>Più completo</small> : <small>Per iniziare</small>}<h3>{plan.name}</h3><strong>{plan.price}</strong><p>{plan.purpose}</p></div>
        <ul>{plan.highlights.map((benefit) => <li key={benefit}>{benefit}</li>)}</ul>
        <MembershipPurchaseButton productCode={plan.code} priceLabel={plan.price} />
      </article>)}</div>
      <p className={styles.planNote}>Prima di confermare vedrai sempre prezzo, rinnovo mensile e modalità disponibile. Gli acquisti e i vantaggi restano collegati al tuo LoreWise ID.</p>
    </div></section>

    <section className={styles.benefits} id="vantaggi" aria-labelledby="benefits-title"><div className="shell">
      <header className={styles.sectionHeading}><div><p className={styles.eyebrow}>Cosa include il Pass</p><h2 id="benefits-title">Cinque vantaggi per vivere LoreWise più da vicino.</h2></div><p>Ogni voce porta direttamente all’area in cui puoi usarla o approfondirla.</p></header>
      <div className={styles.benefitGrid}>{benefits.map((benefit) => <article key={benefit.number}><span>{benefit.number}</span><h3>{benefit.title}</h3><p>{benefit.text}</p><Link href={benefit.href}>{benefit.action} →</Link></article>)}</div>
    </div></section>

    <section className={styles.gameSpotlight} aria-labelledby="pass-game-title">
      <Image src="/games/the-wound-remembers/gameplay-battle.webp" alt="Battaglia reale di The Wound Remembers" fill sizes="100vw" />
      <div className={styles.gameShade} />
      <div className={`shell ${styles.gameCopy}`}><div><p className={styles.eyebrow}>Il gioco al centro dell’universo</p><Image src="/games/the-wound-remembers/logo-white-v2.webp" alt="The Wound Remembers" width={520} height={210} /><h2 id="pass-game-title">Gioca ora. Il Pass ti porta dietro le quinte.</h2><p>The Wound Remembers resta giocabile per tutti. Con il Pass puoi seguire materiali, diari e opportunità riservate quando vengono aperte.</p><a href="https://thewoundremembers.com/" target="_blank" rel="noopener noreferrer">Gioca a The Wound Remembers ↗</a></div><aside className={styles.nextGame}><Image src="/games/demon-match-three/gameplay-portal-backdrop-v1.webp" alt="Scenario di Demon Match Three" fill sizes="(max-width: 700px) 100vw, 28vw" /><span /><Image src="/games/demon-match-three/logo-official-v2.webp" alt="Demon Match Three" width={560} height={300} /><small>Android nativo · in sviluppo</small><Link href="/giochi/demon-match-three">Segui il progetto →</Link></aside></div>
    </section>

    <section className={`shell ${styles.how}`} aria-labelledby="pass-how-title"><header><p className={styles.eyebrow}>Come funziona</p><h2 id="pass-how-title">Tre passaggi. Poi trovi tutto nel tuo spazio.</h2></header><ol><li><span>01</span><div><strong>Accedi</strong><p>Usa o crea il tuo LoreWise ID.</p></div></li><li><span>02</span><div><strong>Scegli</strong><p>Confronta Supporter e Collector.</p></div></li><li><span>03</span><div><strong>Usa i vantaggi</strong><p>Li ritrovi nelle aree collegate e nel tuo account.</p></div></li></ol><Link href="/account">Apri l’Area personale →</Link></section>

    <section className={`shell ${styles.faq}`} aria-labelledby="pass-faq-title"><header><p className={styles.eyebrow}>Prima di scegliere</p><h2 id="pass-faq-title">Le risposte essenziali.</h2></header><div>{faq.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></section>
  </main>;
}
