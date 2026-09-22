"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createLoreWiseBrowserClient } from "@/lib/supabase/client";
import { activeSiteLink, siteAreas } from "@/lib/siteNavigation";
import styles from "./SiteHeader.module.css";

function isCurrentRoute(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState<number | null>(null);
  const notificationRefreshQueued = useRef(false);
  const syncNotifications = useRef<(() => void) | null>(null);
  const desktopNavigationRef = useRef<HTMLElement>(null);
  const sectionLinksRef = useRef<HTMLDivElement>(null);

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
      desktopNavigationRef.current?.querySelectorAll("details[open]").forEach((details) => details.removeAttribute("open"));
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  useEffect(() => {
    const navigation = desktopNavigationRef.current;
    if (!navigation) return;
    const closeGroups = (except?: Element | null) => navigation.querySelectorAll("details[open]").forEach((details) => { if (details !== except) details.removeAttribute("open"); });
    const closeOnOutsidePointer = (event: PointerEvent) => { if (!navigation.contains(event.target as Node)) closeGroups(); };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const openGroup = navigation.querySelector("details[open]");
      if (!openGroup) return;
      const focusWasInside = openGroup.contains(document.activeElement);
      closeGroups();
      if (focusWasInside) openGroup.querySelector("summary")?.focus();
    };
    const closeOnFocusLeave = (event: FocusEvent) => {
      const group = (event.target as Element | null)?.closest("details");
      if (group && !group.contains(event.relatedTarget as Node | null)) group.removeAttribute("open");
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    navigation.addEventListener("focusout", closeOnFocusLeave);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
      navigation.removeEventListener("focusout", closeOnFocusLeave);
    };
  }, []);

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
    let client: ReturnType<typeof createLoreWiseBrowserClient> | null = null;
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
      client = createLoreWiseBrowserClient();
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
    // Dopo ogni navigazione basta rileggere la sessione locale e aggiornare il contatore: l'ascoltatore auth resta unico.
    syncNotifications.current = () => {
      if (!client) return;
      void client.auth.getSession().then(({ data }) => {
        if (!active) return;
        authenticated = Boolean(data.session);
        if (authenticated) void refreshNotifications();
      });
    };
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
      syncNotifications.current = null;
    };
  }, []);

  // Su schermi stretti la barra di sezione scorre: porta in vista la voce della pagina aperta.
  useEffect(() => {
    const strip = sectionLinksRef.current;
    const activeLink = strip?.querySelector<HTMLElement>("[aria-current='page']");
    if (!strip || !activeLink) return;
    const overflowRight = activeLink.offsetLeft + activeLink.offsetWidth - (strip.scrollLeft + strip.clientWidth);
    if (overflowRight > 0) strip.scrollLeft += overflowRight + 16;
  }, [pathname]);

  const notificationPathname = useRef(pathname);
  useEffect(() => {
    if (notificationPathname.current === pathname) return;
    notificationPathname.current = pathname;
    syncNotifications.current?.();
  }, [pathname]);

  const current = activeSiteLink(pathname);
  // La barra di sezione mostra dove sei e le altre pagine della stessa area.
  // Il Famiglio è un'esperienza a schermo intero e la home ha già le quattro aree.
  const showSectionBar = Boolean(current) && !isCurrentRoute(pathname, "/famiglio");
  const closeMenu = () => setMenuOpen(false);

  return (
    <>
    <header className="site-header">
      <div className="shell header-inner">
        <Link className="brand" href="/" aria-label="LoreWise Universe, home"><Image src="/brand/navigation/lorewise-universe-logo.webp" alt="" width={320} height={213} priority unoptimized /></Link>
        <button className="mobile-menu-trigger" type="button" aria-label={menuOpen ? "Chiudi il menu principale" : "Apri il menu principale"} aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen((open) => !open)}>
          <Image src="/brand/navigation/lorewise-wax-seal.webp" alt="" width={128} height={128} unoptimized /><span>{menuOpen ? "Chiudi" : "Menu"}</span>
        </button>
        <nav className="desktop-navigation" aria-label="Navigazione principale" ref={desktopNavigationRef}>
          <ul className="nav-list">
            {siteAreas.map((area) => {
              const isActive = current?.area.key === area.key;
              return <li className="nav-group" key={area.key}><details><summary className={`nav-button nav-button-${area.accent}${isActive ? " is-active" : ""}`}><Image className="nav-art-icon" src={area.icon} alt="" width={1224} height={1285} unoptimized /><span>{area.label}</span><svg viewBox="0 0 12 8" aria-hidden="true"><path d="m1 1 5 5 5-5" /></svg></summary><div className="nav-group-menu">{area.links.map((link) => {
                const linkActive = current?.link.href === link.href;
                return <Link className={linkActive ? "is-active" : undefined} aria-current={linkActive ? "page" : undefined} href={link.href} key={link.href}><span>{link.label}{link.badge ? <b>{link.badge}</b> : null}</span><small>{link.description}</small></Link>;
              })}</div></details></li>;
            })}
          </ul>
        </nav>
        <div className="header-actions">
        <Link className={isCurrentRoute(pathname, "/cerca") ? "header-search is-active" : "header-search"} href="/cerca" aria-label="Cerca in LoreWise Universe" title="Cerca nell’universo">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m16 16 5 5" /></svg>
        </Link>
        {/* Le notifiche servono solo a chi ha fatto l'accesso: il contatore resta null finché non c'è una sessione. */}
        {unreadNotifications !== null ? <Link className={unreadNotifications ? "header-admin-alert has-unread" : "header-admin-alert"} href="/notifiche" aria-label={unreadNotifications ? `${unreadNotifications} notifiche da leggere. Apri il Centro notifiche.` : "Apri il Centro notifiche."} title="Centro notifiche">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg>
          {unreadNotifications ? <span>{unreadNotifications > 99 ? "99+" : unreadNotifications}</span> : null}
        </Link> : null}
        <Link className={isCurrentRoute(pathname, "/account") ? "header-contact is-active" : "header-contact"} aria-current={isCurrentRoute(pathname, "/account") ? "page" : undefined} href="/account">
          <Image src="/brand/navigation/community-v2.webp" alt="" width={112} height={112} unoptimized />
          <span>Account</span>
        </Link>
        </div>
      </div>
      <nav id="mobile-navigation" className={menuOpen ? "mobile-navigation is-open" : "mobile-navigation"} aria-label="Navigazione mobile" hidden={!menuOpen}>
        <div className="mobile-navigation-heading"><span>LoreWise Universe</span><strong>Dove vuoi andare?</strong></div>
        <div className={styles.menuAreas}>
          {siteAreas.map((area) => (
            <section className={styles.menuArea} key={area.key} aria-labelledby={`menu-area-${area.key}`}>
              <h2 className={styles.menuAreaTitle} id={`menu-area-${area.key}`}><Image src={area.icon} alt="" width={1224} height={1285} unoptimized /><span>{area.label}</span></h2>
              <ul className={styles.menuLinks}>
                {area.links.map((link) => {
                  const linkActive = current?.link.href === link.href;
                  return <li className={styles.menuItem} key={link.href}><Link className={`${styles.menuLink}${linkActive ? ` ${styles.menuLinkActive}` : ""}`} aria-current={linkActive ? "page" : undefined} href={link.href} onClick={closeMenu}><strong className={styles.menuLabel}>{link.label}{link.badge ? <b>{link.badge}</b> : null}</strong><small className={styles.menuDescription}>{link.description}</small></Link></li>;
                })}
              </ul>
            </section>
          ))}
        </div>
        <ul className={styles.menuUtilities}>
          <li className={styles.menuItem}><Link className={styles.menuUtility} href="/account" onClick={closeMenu}>Account</Link></li>
          <li className={styles.menuItem}><Link className={styles.menuUtility} href="/cerca" onClick={closeMenu}>Cerca</Link></li>
          <li className={styles.menuItem}><Link className={styles.menuUtility} href="/contatti" onClick={closeMenu}>Contatti</Link></li>
        </ul>
      </nav>
    </header>
    {showSectionBar && current ? (
      <nav className={styles.sectionBar} aria-label={`Sezione ${current.area.label}`}>
        <div className={styles.sectionInner} ref={sectionLinksRef}>
          <Link className={styles.sectionArea} href={current.area.href}>{current.area.label}</Link>
          <ul className={styles.sectionLinks}>
            {current.area.links.map((link) => {
              const linkActive = current.link.href === link.href;
              return <li key={link.href}><Link className={`${styles.sectionLink}${linkActive ? ` ${styles.sectionLinkActive}` : ""}`} aria-current={linkActive ? "page" : undefined} href={link.href}>{link.label}</Link></li>;
            })}
          </ul>
        </div>
      </nav>
    ) : null}
    </>
  );
}
