"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { navigation } from "@/lib/content";

const navIcons: Record<string, string> = {
  "/arte": "/brand/icons/arte-concept-v1.webp",
  "/abbonamento": "/brand/lorewise-wax-seal-v1.webp",
  "/commissioni": "/brand/icons/commissioni-concept-v1.webp",
  "/dove-nascono-i-mondi": "/brand/icons/dove-nascono-i-mondi-concept-v1.webp",
  "/giochi": "/brand/icons/giochi-concept-v1.webp",
  "/vip-zone": "/brand/icons/lorewise-vip-official-v1.webp",
  "/enciclopedia": "/brand/icons/enciclopedia-concept-v1.webp",
  "/shop": "/brand/icons/shop-concept-v1.webp",
  "/account": "/brand/icons/social-assistenza-concept-v1.webp",
};

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
    let active = true;
    let pending = false;
    let controller: AbortController | null = null;
    async function refreshNotifications() {
      if (pending) { notificationRefreshQueued.current = true; return; }
      pending = true;
      notificationRefreshQueued.current = false;
      controller = new AbortController();
      const timeout = window.setTimeout(() => controller?.abort(), 4_000);
      try {
        const response = await fetch("/api/notifications", { headers: { accept: "application/json" }, cache: "no-store", signal: controller.signal });
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
    void refreshNotifications();
    const refreshAfterRead = () => void refreshNotifications();
    window.addEventListener("lorewise:notifications-updated", refreshAfterRead);
    const refresh = window.setInterval(() => {
      if (document.visibilityState === "visible") void refreshNotifications();
    }, 45_000);
    return () => {
      active = false;
      controller?.abort();
      window.removeEventListener("lorewise:notifications-updated", refreshAfterRead);
      window.clearInterval(refresh);
    };
  }, [pathname]);

  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link className="brand" href="/" aria-label="LoreWise Universe, home"><Image src="/brand/lorewise-universe-logo-concept-c.webp" alt="" width={1536} height={1024} priority unoptimized /></Link>
        <button className="mobile-menu-trigger" type="button" aria-label={menuOpen ? "Chiudi il menu principale" : "Apri il menu principale"} aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen((open) => !open)}>
          <Image src="/brand/lorewise-wax-seal-v1.webp" alt="" width={512} height={512} unoptimized /><span>{menuOpen ? "Chiudi" : "Menu"}</span>
        </button>
        <nav className="desktop-navigation" aria-label="Navigazione principale">
          <ul className="nav-list">
            {navigation.map((item) => {
              const isActive = isCurrentRoute(pathname, item.href);
              const section = item.href.slice(1);
              return <li key={item.href}><Link className={`nav-button nav-button-${section}${isActive ? " is-active" : ""}`} aria-current={isActive ? "page" : undefined} href={item.href}>{item.label}</Link></li>;
            })}
          </ul>
        </nav>
        <div className="header-actions">
        <Link className={isCurrentRoute(pathname, "/cerca") ? "header-search is-active" : "header-search"} href="/cerca" aria-label="Cerca in LoreWise Universe" title="Cerca nell’universo">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m16 16 5 5" /></svg>
        </Link>
        <Link className={unreadNotifications ? "header-admin-alert has-unread" : "header-admin-alert"} href="/notifiche" aria-label={unreadNotifications ? `${unreadNotifications} notifiche da leggere. Apri il Centro notifiche.` : "Apri il Centro notifiche."} title="Centro notifiche">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg>
          {unreadNotifications ? <span>{unreadNotifications > 99 ? "99+" : unreadNotifications}</span> : null}
        </Link>
        <Link className={isCurrentRoute(pathname, "/contatti") ? "header-contact is-active" : "header-contact"} aria-current={isCurrentRoute(pathname, "/contatti") ? "page" : undefined} href="/contatti">
          <Image src="/brand/icons/social-assistenza-concept-v1.webp" alt="" width={1224} height={1285} unoptimized />
          <span>Parliamone</span>
        </Link>
        </div>
      </div>
      <nav id="mobile-navigation" className={menuOpen ? "mobile-navigation is-open" : "mobile-navigation"} aria-label="Navigazione mobile" hidden={!menuOpen}>
        <ul><li><Link className={isCurrentRoute(pathname, "/cerca") ? "is-active" : undefined} aria-current={isCurrentRoute(pathname, "/cerca") ? "page" : undefined} href="/cerca" onClick={() => setMenuOpen(false)}><Image src="/brand/lorewise-universe-logo-concept-c.webp" alt="" width={1536} height={1024} unoptimized /><span>Cerca</span></Link></li>{navigation.map((item) => {
          const isActive = isCurrentRoute(pathname, item.href);
          const isFeatured = item.href === "/dove-nascono-i-mondi";
          return <li className={isFeatured ? "mobile-navigation-featured" : undefined} key={item.href}><Link className={isActive ? "is-active" : undefined} aria-current={isActive ? "page" : undefined} href={item.href} onClick={() => setMenuOpen(false)}><Image src={navIcons[item.href]} alt="" width={1224} height={1285} unoptimized /><span>{item.label}</span></Link></li>;
        })}</ul>
      </nav>
    </header>
  );
}
