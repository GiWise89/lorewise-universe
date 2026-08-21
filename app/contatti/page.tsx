import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { UniverseGuide } from "@/components/UniverseGuide";

export const metadata: Metadata = { title: "Social, assistenza e contatti" };

const externalLinkProps = { target: "_blank", rel: "noopener noreferrer" } as const;

type IconName = "discord" | "instagram" | "tiktok" | "facebook" | "whatsapp" | "mail" | "shop" | "account" | "support";

function ChannelIcon({ name }: { name: IconName }) {
  const common = { viewBox: "0 0 24 24", "aria-hidden": true } as const;
  if (name === "instagram") return <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.9"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4.1" /><circle cx="17.4" cy="6.7" r="1" fill="currentColor" stroke="none" /></svg>;
  if (name === "facebook") return <svg {...common} fill="currentColor"><path d="M14.2 8.2V6.5c0-.8.5-1 1.1-1H18V2.2c-.5-.1-2-.2-3.4-.2-3.3 0-5.5 2-5.5 5.7v.5H6v3.7h3.1V22h4.5V11.9h3.1l.6-3.7h-3.1Z" /></svg>;
  if (name === "tiktok") return <svg {...common} fill="currentColor"><path d="M14.1 2h3.5c.2 1.2.8 2.3 1.7 3.1.8.8 1.8 1.3 2.7 1.5v3.6c-1.8 0-3.4-.6-4.7-1.5v6.4a6.9 6.9 0 1 1-6.9-6.9c.4 0 .8 0 1.2.1V12a3.3 3.3 0 1 0 2.5 3.2V2Z" /></svg>;
  if (name === "discord") return <svg {...common} fill="currentColor"><path d="M19.7 5.3A16 16 0 0 0 15.8 4l-.5 1a14.3 14.3 0 0 0-6.6 0l-.5-1a16 16 0 0 0-3.9 1.3C1.8 9.1 1.1 12.8 1.4 16.4A15.7 15.7 0 0 0 6.2 19l1.2-1.7c-.7-.3-1.4-.7-2-1.2l.5-.4c3.8 1.8 8.3 1.8 12.1 0l.6.4c-.7.5-1.4.9-2.1 1.2l1.2 1.7a15.7 15.7 0 0 0 4.8-2.6c.4-4.2-.7-7.8-2.8-11.1ZM8.3 14.3c-1.1 0-2-1-2-2.2 0-1.2.9-2.2 2-2.2s2 1 2 2.2c0 1.2-.9 2.2-2 2.2Zm7.4 0c-1.1 0-2-1-2-2.2 0-1.2.9-2.2 2-2.2s2 1 2 2.2c0 1.2-.9 2.2-2 2.2Z" /></svg>;
  if (name === "whatsapp") return <svg {...common} fill="currentColor"><path d="M20.5 3.5A11.8 11.8 0 0 0 12.1 0C5.5 0 .2 5.3.2 11.9c0 2.1.6 4.2 1.6 6L.1 24l6.2-1.6a12 12 0 0 0 5.7 1.4h.1c6.5 0 11.8-5.3 11.8-11.9 0-3.2-1.2-6.2-3.4-8.4Zm-8.4 18.3h-.1a9.9 9.9 0 0 1-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4a9.8 9.8 0 0 1-1.5-5.3 9.9 9.9 0 1 1 9.9 9.9Zm5.4-7.4c-.3-.1-1.7-.8-2-.9-.2-.1-.5-.1-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-1.8-.9-3-1.6-4.2-3.7-.3-.5.3-.5.9-1.7.1-.2 0-.4 0-.6l-.9-2.2c-.2-.5-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.2-1.2 2.9s1.2 3.3 1.4 3.5c.1.2 2.5 3.8 6 5.3 2.2.9 3.1 1 4.2.8.7-.1 1.7-.7 1.9-1.4.2-.7.2-1.3.2-1.4-.1-.1-.4-.2-.7-.3Z" /></svg>;
  if (name === "mail") return <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2.5" y="4.5" width="19" height="15" rx="2" /><path d="m4 7 8 6 8-6" /></svg>;
  if (name === "shop") return <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 9v12h16V9M2 9l2-6h16l2 6" /><path d="M2 9c0 2 3 2.8 5 0 0 2 3 2.8 5 0 0 2 3 2.8 5 0 0 2 3 2.8 5 0M9 21v-6h6v6" /></svg>;
  if (name === "account") return <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="4" /><path d="M4 22c.5-5 3.1-7.5 8-7.5S19.5 17 20 22" /></svg>;
  return <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4h16v13H8l-4 4V4Z" /><path d="M8 9h8M8 13h5" /></svg>;
}

export default function ContactsPage() {
  return <main className="social-contact-page">
    <PageHero eyebrow="GiWise Studio · rete ufficiale" title="Entra nel mondo GiWise." description="Community, dietro le quinte, assistenza e contatti: ogni canale ha uno scopo preciso e una destinazione verificata." aside="Qui trovi soltanto collegamenti ufficiali. Per la tua sicurezza non inviare mai password, codici di accesso, documenti o dati completi di pagamento tramite social e WhatsApp." />

    <section className="section shell studio-socials" id="social" aria-labelledby="studio-socials-title">
      <header><div><p className="eyebrow">Social GiWise Studio</p><h2 id="studio-socials-title">Non solo post.<br />Segui ciò che prende vita.</h2></div><p>Ogni profilo racconta una parte diversa dello studio: nuovi progetti, lavorazioni artistiche, anticipazioni e aggiornamenti del LoreWise Universe.</p></header>
      <div className="official-social-grid">
        <a className="official-social-card instagram" href="https://www.instagram.com/giwisestudio?igsh=ZmowcDRrOW93Nmd6" {...externalLinkProps}><span className="brand-icon"><ChannelIcon name="instagram" /></span><small>Studio e progetti</small><h3>Instagram</h3><p>Anteprime visive, opere, copertine e momenti creativi selezionati dallo studio.</p><strong>@giwisestudio <span>↗</span></strong></a>
        <a className="official-social-card tiktok" href="https://www.tiktok.com/@giwisestudio?_r=1&amp;_t=ZG-9919HEFKZLl" {...externalLinkProps}><span className="brand-icon"><ChannelIcon name="tiktok" /></span><small>Video e aggiornamenti</small><h3>TikTok</h3><p>Clip dei progetti, novità rapide e passaggi di sviluppo raccontati in movimento.</p><strong>@giwisestudio <span>↗</span></strong></a>
        <a className="official-social-card art" href="https://www.tiktok.com/@giwiseart?_r=1&amp;_t=ZG-9919K0dELsv" {...externalLinkProps}><span className="brand-icon"><ChannelIcon name="tiktok" /></span><small>Arte e lavorazioni</small><h3>GiWiseArt</h3><p>Disegni, commissioni, processi creativi e dettagli dedicati alla produzione artistica.</p><strong>@giwiseart <span>↗</span></strong></a>
        <a className="official-social-card facebook" href="https://www.facebook.com/share/1DBE9rAfBQ/" {...externalLinkProps}><span className="brand-icon"><ChannelIcon name="facebook" /></span><small>Notizie dello studio</small><h3>Facebook</h3><p>Aggiornamenti, pubblicazioni e collegamenti principali in uno spazio facile da seguire.</p><strong>Pagina ufficiale <span>↗</span></strong></a>
      </div>
    </section>

    <section className="section discord-stage" aria-labelledby="discord-title"><div className="shell discord-stage-inner">
      <div className="discord-emblem"><ChannelIcon name="discord" /><i /><i /></div>
      <div className="discord-copy"><p className="eyebrow">La community</p><h2 id="discord-title">Il punto d’incontro<br />del LoreWise Universe.</h2><p>Entra nel Discord GiWise Studio per parlare dei progetti, condividere feedback e seguire più da vicino l’evoluzione dei giochi e dell’archivio.</p></div>
      <div className="discord-benefits"><ul><li>Novità e annunci della community</li><li>Discussioni su giochi, arte e dossier</li><li>Feedback e confronto con gli altri membri</li></ul><a className="discord-button" href="https://discord.gg/3SFCYTKaU" {...externalLinkProps}><ChannelIcon name="discord" /><span>Entra nel server Discord</span><b>↗</b></a><small>Discord è uno spazio di community. Ordini, pagamenti e assistenza personale vanno gestiti nei canali ufficiali indicati sotto.</small></div>
    </div></section>

    <section className="section shell support-hub" id="assistenza" aria-labelledby="support-hub-title">
      <header><div><p className="eyebrow">Assistenza ufficiale</p><h2 id="support-hub-title">La richiesta giusta,<br />subito nel posto giusto.</h2></div><p>Account, giochi, commissioni e ordini seguono percorsi separati. Così la richiesta conserva il proprio contesto e può essere collegata al LoreWise ID o all’ordine corretto.</p></header>
      <div className="support-route-grid">
        <article><Image src="/brand/icons/social-assistenza-concept-v1.webp" alt="" width={1024} height={1024} unoptimized /><span className="route-number">01</span><div><small>LoreWise Universe</small><h3>Account, Pass e archivio</h3><p>Accesso, vantaggi, licenze digitali, collaborazioni e richieste generali.</p><div className="route-actions"><Link href="/account"><ChannelIcon name="account" />Area personale</Link><a href="mailto:lorewise.archive@gmail.com"><ChannelIcon name="mail" />Scrivi all’assistenza</a></div></div></article>
        <article><Image src="/brand/icons/giochi-concept-v1.webp" alt="" width={1024} height={1024} unoptimized /><span className="route-number">02</span><div><small>Giochi e applicazioni</small><h3>Download e supporto tecnico</h3><p>Installazione, aggiornamenti, account di gioco e segnalazioni tecniche.</p><div className="route-actions"><Link href="/assistenza-giochi"><ChannelIcon name="support" />Apri l’assistenza giochi</Link></div></div></article>
        <article><Image src="/brand/icons/arte-concept-v1.webp" alt="" width={1024} height={1024} unoptimized /><span className="route-number">03</span><div><small>Arte su richiesta</small><h3>Commissioni e disegni</h3><p>Preventivi, dettagli del progetto, consegne e controllo dello stato della richiesta.</p><div className="route-actions"><Link href="/commissioni">Richiedi una commissione</Link><Link href="/commissioni/stato">Controlla lo stato</Link><a className="whatsapp-action" href="https://wa.me/393505312999" {...externalLinkProps}><ChannelIcon name="whatsapp" />WhatsApp</a></div></div></article>
        <article><Image src="/brand/icons/shop-concept-v1.webp" alt="" width={1024} height={1024} unoptimized /><span className="route-number">04</span><div><small>Prodotti e spedizioni</small><h3>GiWise Shop</h3><p>Informazioni prima dell’ordine, produzione, spedizione e tracciamento degli acquisti.</p><div className="route-actions"><a href="https://giwiseshop.it/contacts" {...externalLinkProps}><ChannelIcon name="support" />Assistenza ordini</a><a href="https://giwiseshop.it/tracking" {...externalLinkProps}>Traccia spedizione</a><a className="whatsapp-action" href="https://wa.me/393505312999" {...externalLinkProps}><ChannelIcon name="whatsapp" />WhatsApp</a></div></div></article>
      </div>
    </section>

    <section className="section shop-social-stage" aria-labelledby="shop-social-title"><div className="shell shop-social-layout">
      <div className="shop-social-visual"><Image src="/brand/icons/shop-concept-v1.webp" alt="Simbolo GiWise Shop" width={1024} height={1024} unoptimized /><span /><span /></div>
      <div className="shop-social-copy"><p className="eyebrow">GiWise Shop</p><h2 id="shop-social-title">Prodotti, novità<br />e contatto diretto.</h2><p>Segui il catalogo anche sui suoi profili dedicati oppure entra direttamente nel negozio. Per prodotti e commissioni è disponibile il contatto WhatsApp ufficiale.</p>
        <div className="shop-contact-links">
          <a className="shop-store" href="https://giwiseshop.it/" {...externalLinkProps}><ChannelIcon name="shop" /><span><small>Catalogo ufficiale</small><strong>Visita GiWise Shop</strong></span><b>↗</b></a>
          <a className="instagram" href="https://www.instagram.com/giwise_shop?igsh=ZnV4ZTBna2c5NDdj" {...externalLinkProps}><ChannelIcon name="instagram" /><span><small>Instagram</small><strong>@giwise_shop</strong></span><b>↗</b></a>
          <a className="tiktok" href="https://www.tiktok.com/%40giwise_gaming?_r=1&amp;_t=ZN-9335QHKdlA6" {...externalLinkProps}><ChannelIcon name="tiktok" /><span><small>TikTok</small><strong>@giwise_gaming</strong></span><b>↗</b></a>
          <a className="facebook" href="https://www.facebook.com/share/1bvoLHUXZb/?mibextid=wwXIfr" {...externalLinkProps}><ChannelIcon name="facebook" /><span><small>Facebook</small><strong>GiWise Shop</strong></span><b>↗</b></a>
          <a className="whatsapp" href="https://wa.me/393505312999" {...externalLinkProps}><ChannelIcon name="whatsapp" /><span><small>Shop e commissioni</small><strong>+39 350 531 2999</strong></span><b>↗</b></a>
          <a className="email" href="mailto:Giwiseshop@outlook.it"><ChannelIcon name="mail" /><span><small>Assistenza commerciale</small><strong>Giwiseshop@outlook.it</strong></span><b>→</b></a>
        </div>
      </div>
    </div></section>

    <section className="section shell contact-compass" aria-labelledby="contact-compass-title"><header><p className="eyebrow">Guida rapida</p><h2 id="contact-compass-title">Dimmi cosa cerchi.<br />Ti indico la porta.</h2></header><div>
      <article><span>01</span><p>Vuoi vedere novità, opere e progetti?</p><a href="#social">Segui i social GiWise ↑</a></article>
      <article><span>02</span><p>Vuoi parlare con la community?</p><a href="https://discord.gg/3SFCYTKaU" {...externalLinkProps}>Entra su Discord ↗</a></article>
      <article><span>03</span><p>Hai un problema con un gioco o il tuo account?</p><Link href="/assistenza-giochi">Apri l’assistenza →</Link></article>
      <article><span>04</span><p>Vuoi un disegno o informazioni su un prodotto?</p><a href="https://wa.me/393505312999" {...externalLinkProps}>Scrivi su WhatsApp ↗</a></article>
    </div></section>
    <UniverseGuide current="Social e assistenza" items={[
      { href: "/account", label: "LoreWise ID", description: "Profilo, vantaggi, richieste e archivio personale." },
      { href: "/assistenza-giochi", label: "Supporto tecnico", description: "Installazione, aggiornamenti e giochi GiWise Studio." },
      { href: "/commissioni", label: "Commissioni", description: "Preventivo e percorso per un’opera su richiesta." },
    ]} />
  </main>;
}
