"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createLoreWiseBrowserClient } from "@/lib/supabase/client";

const navIcons: Record<string, string> = {
  "/": "/brand/navigation/lorewise-universe-logo.webp",
  "/arte": "/brand/navigation/arte.webp",
  "/abbonamento": "/brand/navigation/lorewise-wax-seal.webp",
  "/commissioni": "/brand/navigation/commissioni.webp",
  "/mondi": "/brand/navigation/mondi.webp",
  "/dove-nascono-i-mondi": "/brand/navigation/mondi.webp",
  "/giochi": "/brand/navigation/giochi.webp",
  "/giochi/the-wound-remembers": "/brand/navigation/giochi.webp",
  "/vip-zone": "/brand/navigation/vip.webp",
  "/vip": "/brand/navigation/vip.webp",
  "/enciclopedia": "/brand/icons/enciclopedia-concept-v1.webp",
  "/shop": "/brand/navigation/shop.webp",
  "/account": "/brand/navigation/account.webp",
  "/famiglio": "/famiglio/navigation/tana-v1.webp",
  "/cronache-del-nexus": "/brand/navigation/lorewise-wax-seal.webp",
  "/community": "/brand/icons/social-assistenza-concept-v1.webp",
  "/contatti": "/brand/navigation/account.webp",
};

const desktopNavigation = [
  {
    label: "Giochi",
    accent: "giochi",
    children: [
      { label: "The Wound Remembers", description: "Il card RPG dark fantasy giocabile ora", href: "/giochi/the-wound-remembers", badge: "Gioca ora" },
      { label: "Tutti i giochi", description: "Progetti disponibili e mondi in sviluppo", href: "/giochi" },
    ],
  },
  {
    label: "Esplora",
    accent: "mondi",
    children: [
      { label: "Scopri i mondi", description: "Il punto di partenza per storie e personaggi", href: "/mondi" },
      { label: "LoreWise Codex", description: "Personaggi, universi e legami da approfondire", href: "/enciclopedia" },
      { label: "Cronache del Nexus", description: "Le novità e ciò che accade nell’universo", href: "/cronache-del-nexus", badge: "Novità" },
      { label: "Dove nascono i mondi", description: "Bozze e storie dal diario di GiWise Studio", href: "/dove-nascono-i-mondi" },
    ],
  },
  {
    label: "Arte e servizi",
    accent: "arte",
    children: [
      { label: "Arte originale", description: "Opere, collezioni e licenze dichiarate con chiarezza", href: "/arte" },
      { label: "Commissioni", description: "Trasforma la tua idea in un’opera personale", href: "/commissioni" },
      { label: "GiWise Shop", description: "Merchandising e collezioni ufficiali", href: "/shop" },
    ],
  },
  {
    label: "Community",
    accent: "vip",
    children: [
      { label: "Entra nella Community", description: "Canali ufficiali e spazi per partecipare", href: "/community" },
      { label: "Area VIP", description: "Eventi e contenuti dedicati alla community", href: "/vip-zone" },
      { label: "Universe Pass", description: "Scopri i vantaggi e scegli ciò che ti serve", href: "/abbonamento" },
      { label: "Contatti", description: "Parla direttamente con GiWise Studio", href: "/contatti" },
    ],
  },
] as const;

const mobileExploreLinks = [
  { label: "Tutti i giochi", href: "/giochi" },
  { label: "LoreWise Codex", href: "/enciclopedia" },
  { label: "Diario creativo", href: "/dove-nascono-i-mondi" },
  { label: "Commissioni", href: "/commissioni" },
  { label: "GiWise Shop", href: "/shop" },
  { label: "Il mio Famiglio", href: "/famiglio" },
  { label: "Universe Pass", href: "/abbonamento" },
  { label: "Account", href: "/account" },
] as const;

const mobilePrimaryLinks = [
  { label: "Gioca ora", href: "/giochi/the-wound-remembers" },
  { label: "Scopri i mondi", href: "/mondi" },
  { label: "Arte e servizi", href: "/arte" },
  { label: "Community", href: "/community" },
] as const;

const desktopGroupIcons = {
  Giochi: "/brand/navigation/giochi.webp",
  Esplora: "/brand/navigation/mondi.webp",
  "Arte e servizi": "/brand/navigation/arte.webp",
  Community: "/brand/icons/social-assistenza-concept-v1.webp",
} as const;

function isCurrentRoute(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState<number | null>(null);
  const notificationRefreshQueued = useRef(false);

  useEffect(() => {
    if (!menuOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setMenuOpen(false);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => { document.documentElement.style.overflow = previousOverflow; };
  }, [menuOpen]);

  useEffect(() => {
    let active = true;
    let authenticated = false;
    let pending = false;
    let controller: AbortController | null = null;
    let unsubscribeFromAuth: (() => void) | null = null;
    async function refreshNotifications() {
      if (!authenticated) return;
      if (pending) { notificationRefreshQueued.current = true; return; }
      pending = true;
      notificationRefreshQueued.current = false;
      controller = new AbortController();
      const timeout = window.setTimeout(() => controller?.abort(), 4_000);
      try {
        const response = await fetch("/api/notifications", { headers: { accept: "application/json" }, cache: "no-store", signal: controller.signal });
        if (response.status === 401) authenticated = false;
        if (!response.ok) {
          if (active) setUnreadNotifications(null);
          return;
        }
        const body = await response.json() as { unreadCount?: number };
        if (active) setUnreadNotifications(body.unreadCount ?? 0);
      } catch {
        if (active) setUnreadNotifications(null);
      } finally {
        window.clearTimeout(timeout);
        pending = false;
        if (active && notificationRefreshQueued.current) void refreshNotifications();
      }
    }
    async function initializeNotifications() {
      const client = createLoreWiseBrowserClient();
      if (!client) return;
      const { data } = await client.auth.getSession();
      if (!active) return;
      authenticated = Boolean(data.session);
      if (authenticated) void refreshNotifications();
      const { data: authListener } = client.auth.onAuthStateChange((_event, session) => {
        authenticated = Boolean(session);
        if (!active) return;
        if (authenticated) void refreshNotifications();
        else {
          controller?.abort();
          setUnreadNotifications(null);
        }
      });
      unsubscribeFromAuth = () => authListener.subscription.unsubscribe();
    }
    void initializeNotifications();
    const refreshAfterRead = () => void refreshNotifications();
    window.addEventListener("lorewise:notifications-updated", refreshAfterRead);
    const refresh = window.setInterval(() => {
      if (authenticated && document.visibilityState === "visible") void refreshNotifications();
    }, 45_000);
    return () => {
      active = false;
      controller?.abort();
      unsubscribeFromAuth?.();
      window.removeEventListener("lorewise:notifications-updated", refreshAfterRead);
      window.clearInterval(refresh);
    };
  }, [pathname]);

  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link className="brand" href="/" aria-label="LoreWise Universe, home"><Image src="/brand/navigation/lorewise-universe-logo.webp" alt="" width={320} height={213} priority unoptimized /></Link>
        <button className="mobile-menu-trigger" type="button" aria-label={menuOpen ? "Chiudi il menu principale" : "Apri il menu principale"} aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen((open) => !open)}>
          <Image src="/brand/navigation/lorewise-wax-seal.webp" alt="" width={128} height={128} unoptimized /><span>{menuOpen ? "Chiudi" : "Menu"}</span>
        </button>
        <nav className="desktop-navigation" aria-label="Navigazione principale">
          <ul className="nav-list">
            {desktopNavigation.map((item) => {
              const isActive = item.children.some((child) => isCurrentRoute(pathname, child.href));
              return <li className="nav-group" key={item.label}><details><summary className={`nav-button nav-button-${item.accent}${isActive ? " is-active" : ""}`}><Image className="nav-art-icon" src={desktopGroupIcons[item.label]} alt="" width={1224} height={1285} unoptimized /><span>{item.label}</span><svg viewBox="0 0 12 8" aria-hidden="true"><path d="m1 1 5 5 5-5" /></svg></summary><div className="nav-group-menu">{item.children.map((child) => <Link className={isCurrentRoute(pathname, child.href) ? "is-active" : undefined} aria-current={isCurrentRoute(pathname, child.href) ? "page" : undefined} href={child.href} key={child.href}><span>{child.label}{"badge" in child ? <b>{child.badge}</b> : null}</span><small>{child.description}</small></Link>)}</div></details></li>;
            })}
          </ul>
        </nav>
        <div className="header-actions">
        <Link className={isCurrentRoute(pathname, "/famiglio") ? "header-familiar is-active" : "header-familiar"} href="/famiglio" aria-label="Apri il mio Famiglio del Nexus" title="Il mio Famiglio">
          <Image src="/famiglio/navigation/tana-v1.webp" alt="" width={112} height={112} unoptimized />
        </Link>
        <Link className={isCurrentRoute(pathname, "/cerca") ? "header-search is-active" : "header-search"} href="/cerca" aria-label="Cerca in LoreWise Universe" title="Cerca nell’universo">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m16 16 5 5" /></svg>
        </Link>
        <Link className={unreadNotifications ? "header-admin-alert has-unread" : "header-admin-alert"} href="/notifiche" aria-label={unreadNotifications ? `${unreadNotifications} notifiche da leggere. Apri il Centro notifiche.` : "Apri il Centro notifiche."} title="Centro notifiche">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg>
          {unreadNotifications ? <span>{unreadNotifications > 99 ? "99+" : unreadNotifications}</span> : null}
        </Link>
        <Link className={isCurrentRoute(pathname, "/account") ? "header-contact is-active" : "header-contact"} aria-current={isCurrentRoute(pathname, "/account") ? "page" : undefined} href="/account">
          <Image src="/brand/navigation/account.webp" alt="" width={112} height={112} unoptimized />
          <span>Account</span>
        </Link>
        </div>
      </div>
      <nav id="mobile-navigation" className={menuOpen ? "mobile-navigation is-open" : "mobile-navigation"} aria-label="Navigazione mobile" hidden={!menuOpen}>
        <div className="mobile-navigation-heading"><span>Il tuo ingresso nel LoreWise Universe</span><strong>Cosa vuoi fare?</strong></div>
        <ul className="mobile-navigation-primary">
          {mobilePrimaryLinks.map((item) => {
            const active = isCurrentRoute(pathname, item.href);
            return <li key={item.href}><Link className={active ? "is-active" : undefined} aria-current={active ? "page" : undefined} href={item.href} onClick={() => setMenuOpen(false)}><Image src={navIcons[item.href]} alt="" width={1224} height={1285} unoptimized /><span>{item.label}</span></Link></li>;
          })}
        </ul>
        <div id="mobile-explore-links" className="mobile-explore-links is-open"><header><span>Accessi rapidi</span><small>Le destinazioni utili, raccolte senza interrompere il percorso.</small></header><ul>{mobileExploreLinks.map((item) => <li key={item.href}><Link className={isCurrentRoute(pathname, item.href) ? "is-active" : undefined} aria-current={isCurrentRoute(pathname, item.href) ? "page" : undefined} href={item.href} onClick={() => setMenuOpen(false)}><Image src={navIcons[item.href]} alt="" width={1224} height={1285} unoptimized /><span>{item.label}</span></Link></li>)}</ul></div>
      </nav>
    </header>
  );
}
