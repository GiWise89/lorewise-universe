import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import styles from "./community-focus.module.css";

export const metadata: Metadata = {
  title: "Community & Social",
  description: "Entra nella community LoreWise: Discord, conversazioni sulle opere, recensioni dei giochi e canali ufficiali GiWise Studio.",
  alternates: { canonical: "/community" },
};

const externalLinkProps = { target: "_blank", rel: "noopener noreferrer" } as const;
const socialChannels = [
  { label: "Instagram", handle: "@giwisestudio", href: "https://www.instagram.com/giwisestudio?igsh=ZmowcDRrOW93Nmd6", icon: "instagram" },
  { label: "TikTok Studio", handle: "@giwisestudio", href: "https://www.tiktok.com/@giwisestudio?_r=1&_t=ZG-9919HEFKZLl", icon: "tiktok" },
  { label: "TikTok Arte", handle: "@giwiseart", href: "https://www.tiktok.com/@giwiseart?_r=1&_t=ZG-9919K0dELsv", icon: "tiktok" },
  { label: "Facebook", handle: "Pagina ufficiale", href: "https://www.facebook.com/share/1DBE9rAfBQ/", icon: "facebook" },
] as const;

function SocialIcon({ name }: { name: (typeof socialChannels)[number]["icon"] }) {
  if (name === "instagram") return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4.2" /><circle cx="17.4" cy="6.7" r="1" className={styles.iconFill} /></svg>;
  if (name === "tiktok") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 3v11.3a4.2 4.2 0 1 1-3.4-4.1v3.1a1.4 1.4 0 1 0 .6 1.1V3h2.8Z" /><path d="M14.5 3c.5 2.7 2.1 4.3 4.5 4.6v3.1c-1.8-.1-3.3-.7-4.5-1.7" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path className={styles.iconFill} d="M13.8 21v-8h2.8l.4-3.2h-3.2V7.7c0-.9.3-1.6 1.7-1.6h1.8V3.2c-.3 0-1.4-.2-2.6-.2-2.6 0-4.4 1.6-4.4 4.5v2.3H7.4V13h2.9v8h3.5Z" /></svg>;
}

export default function CommunityPage() {
  return <main className={styles.page}>
    <section className={styles.hero} aria-labelledby="community-title">
      <Image src="/games/the-wound-remembers/key-art-scene-4k-v3.webp" alt="Il mondo di The Wound Remembers" fill sizes="100vw" priority />
      <div className={styles.heroShade} />
      <div className={`shell ${styles.heroLayout}`}>
        <div><p className={styles.eyebrow}>Community LoreWise</p><h1 id="community-title">Partecipa al Nexus.</h1><p>Parla dei giochi, commenta le opere e segui ciò che GiWise Studio sta costruendo. Scegli tu da dove iniziare.</p><div className={styles.actions}><a className={styles.discordButton} href="https://discord.gg/3SFCYTKaU" {...externalLinkProps}>Entra su Discord ↗</a><Link className={styles.accountButton} href="/account">Usa il tuo LoreWise ID</Link></div></div>
        <aside><strong>Da qui puoi</strong><ul><li>incontrare altri membri;</li><li>commentare opere e giochi;</li><li>seguire annunci e sviluppo.</li></ul></aside>
      </div>
    </section>

    <section className={`shell ${styles.choose}`} aria-labelledby="community-choose-title">
      <header><p className={styles.eyebrow}>Scegli il tuo ingresso</p><h2 id="community-choose-title">Tre modi per esserci.</h2></header>
      <div className={styles.choiceGrid}>
        <a href="https://discord.gg/3SFCYTKaU" {...externalLinkProps}><span>01</span><strong>Parla con la community</strong><p>Discussioni, annunci, feedback e incontri nel server Discord.</p><b>Apri Discord ↗</b></a>
        <Link href="/arte#art-index"><span>02</span><strong>Commenta le opere</strong><p>Metti Mi piace e partecipa alle conversazioni direttamente nell’archivio.</p><b>Vai alla collezione →</b></Link>
        <Link href="/giochi"><span>03</span><strong>Segui e valuta i giochi</strong><p>Scopri cosa è giocabile, lascia recensioni e segui i progetti in sviluppo.</p><b>Apri i giochi →</b></Link>
      </div>
    </section>

    <section className={styles.mainWorld} aria-labelledby="community-world-title"><div className={`shell ${styles.worldGrid}`}>
      <div className={styles.worldVisual}><Image src="/games/the-wound-remembers/gameplay-battle.webp" alt="Combattimento in The Wound Remembers" fill sizes="(max-width: 800px) 100vw, 55vw" /><Image src="/games/the-wound-remembers/logo-white-v2.webp" alt="The Wound Remembers" width={520} height={210} /></div>
      <div className={styles.worldCopy}><p className={styles.eyebrow}>Il mondo da vivere ora</p><h2 id="community-world-title">La community parte da una ferita condivisa.</h2><p>The Wound Remembers è il cuore giocabile del Nexus: crea il tuo Patto, affronta le Nemesi e porta il confronto nella community.</p><div><a href="https://thewoundremembers.com/" {...externalLinkProps}>Gioca ora ↗</a><Link href="/giochi/the-wound-remembers">Scopri il progetto →</Link></div></div>
    </div></section>

    <section className={`shell ${styles.spaces}`} aria-labelledby="community-spaces-title">
      <header><div><p className={styles.eyebrow}>Ogni spazio ha uno scopo</p><h2 id="community-spaces-title">Dentro LoreWise o sui social?</h2></div><p>Nel sito partecipi ai contenuti. Sui canali ufficiali segui conversazioni, annunci e lavorazioni.</p></header>
      <div className={styles.spaceGrid}>
        <article><span>Nel sito</span><h3>La tua voce resta accanto al contenuto.</h3><ul><li>Mi piace e commenti sulle opere</li><li>Recensioni nelle schede dei giochi disponibili</li><li>Attività collegate al LoreWise ID</li></ul><Link href="/account#account-community">Apri la tua attività →</Link></article>
        <article><span>Discord e social</span><h3>Segui lo studio mentre i mondi crescono.</h3><ul><li>Annunci e novità della community</li><li>Discussioni su giochi, arte e dossier</li><li>Video, anteprime e lavorazioni</li></ul><a href="https://discord.gg/3SFCYTKaU" {...externalLinkProps}>Entra nel server →</a></article>
      </div>
    </section>

    <section className={styles.famiglio} aria-labelledby="community-famiglio-title"><div className={`shell ${styles.famiglioGrid}`}><Image src="/famiglio/navigation/tana-v1.webp" alt="Ingresso alla tana del Famiglio" width={1024} height={1024} unoptimized /><div><p className={styles.eyebrow}>Il tuo compagno nel Nexus</p><h2 id="community-famiglio-title">Prenditi cura del tuo Famiglio.</h2><p>Un compagno permanente che cresce attraverso cura, missioni e attività nel LoreWise Universe.</p><Link href="/famiglio">Entra nella tana →</Link></div></div></section>

    <section className={`shell ${styles.social}`} aria-labelledby="community-social-title"><header><p className={styles.eyebrow}>Canali ufficiali</p><h2 id="community-social-title">Segui il lato che preferisci.</h2></header><div>{socialChannels.map((channel) => <a href={channel.href} key={`${channel.label}-${channel.handle}`} {...externalLinkProps}><span className={styles.socialIcon}><SocialIcon name={channel.icon} /></span><span className={styles.socialText}><small>{channel.label}</small><strong>{channel.handle}</strong></span><span className={styles.socialArrow}>↗</span></a>)}</div></section>

    <section className={styles.help}><div className="shell"><div><p className={styles.eyebrow}>Cerchi assistenza?</p><h2>Community e supporto non sono la stessa porta.</h2></div><p>Per account, ordini, commissioni o problemi tecnici trovi percorsi dedicati nella pagina Contatti.</p><Link href="/contatti">Vai a contatti e assistenza →</Link></div></section>
  </main>;
}
