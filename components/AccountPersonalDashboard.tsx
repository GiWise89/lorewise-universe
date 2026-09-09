"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { BenefitsCenter } from "@/components/BenefitsCenter";
import { AccountProfilePanel } from "@/components/AccountProfilePanel";
import { HorizontalScrollHint } from "@/components/HorizontalScrollHint";
import { getCommissionPromotionForSubmission } from "@/lib/commissionPromotion";
import { horrorArtworkBundles } from "@/lib/horrorArtworkBundles";

type Dashboard = {
  identity: { email: string; displayName: string; role: string; status: string; memberSince: string };
  commerce: { testMode: boolean; mode: "test" | "live"; manualDelivery: boolean };
  summary: { orders: number; libraryItems: number; commissions: number; communityInteractions: number };
  orders: Array<{ referenceCode: string; type: string; status: string; currency: string; totalCents: number; paidAt: string | null; createdAt: string; itemCount: number; itemTitles: string; checkoutSessionId: string | null; productCode: string | null }>;
  library: Array<{ resourceType: string; resourceCode: string; title: string; status: string; downloadLimit: number | null; downloadCount: number; expiresAt: string | null; createdAt: string; deliveryStatus: string | null; deliveryFilename: string | null; deliveryVersion: string | null; orderProductCode: string | null; orderReferenceCode: string | null; collectionCode: string | null; collectionTitle: string | null; certificateAvailable: boolean }>;
  subscription: { planCode: string; status: string; currentPeriodEnd: string | null; cancelAtPeriodEnd: boolean; complimentary: boolean; expiresSoon: boolean; createdAt: string } | null;
  benefits: { code: string | null; name: string; active: boolean; commissionDiscountPercent: number; artworkCreditsPerMonth: number; artworkCreditCap: number; currentPeriodEnd: string | null };
  subscriptionInvoices: Array<{ invoiceId: string; amountPaidCents: number; currency: string; status: string; periodStart: string | null; periodEnd: string | null; paidAt: string | null }>;
  commissions: Array<{ referenceCode: string; category: string; packageName: string; status: string; quoteBaseCents: number | null; quoteDiscountCents: number; quoteCents: number | null; membershipPlanCode: string | null; membershipDiscountPercent: number; pricingDiscountCode: string | null; pricingDiscountLabel: string | null; pricingDiscountKind: string | null; pricingDiscountValue: number | null; createdAt: string; updatedAt: string }>;
  supportTickets: Array<{ referenceCode: string; category: string; subject: string; status: string; priority: string; adminNotes: string | null; createdAt: string; updatedAt: string }>;
  community: { likes: number; comments: number; openReports: number };
};

function halloweenPurchasePreview(): Dashboard {
  const now = "2026-10-08T18:30:00.000Z";
  const orders = horrorArtworkBundles.map((bundle, index) => ({
    referenceCode: `LW-HALLOWEEN-00${index + 1}`,
    type: "artwork",
    status: "paid",
    currency: "EUR",
    totalCents: 2490,
    paidAt: now,
    createdAt: now,
    itemCount: 1,
    itemTitles: `Collezione horror · ${bundle.title}`,
    checkoutSessionId: `cs_test_preview_halloween_${index + 1}`,
    productCode: bundle.code,
  }));
  const library = horrorArtworkBundles.flatMap((bundle) => bundle.artworks.map((artwork) => ({
    resourceType: "artwork",
    resourceCode: artwork.code,
    title: artwork.title ?? artwork.code,
    status: "active",
    downloadLimit: 3,
    downloadCount: 0,
    expiresAt: null,
    createdAt: now,
    deliveryStatus: "approved",
    deliveryFilename: `${artwork.code}-pacchetto.zip`,
    deliveryVersion: null,
    orderProductCode: bundle.code,
    orderReferenceCode: orders.find((order) => order.productCode === bundle.code)?.referenceCode ?? null,
    collectionCode: bundle.code,
    collectionTitle: bundle.title,
    certificateAvailable: true,
  })));
  return {
    identity: { email: "anteprima.halloween@lorewise.local", displayName: "Cliente Halloween", role: "member", status: "active", memberSince: now },
    commerce: { testMode: true, mode: "test", manualDelivery: false },
    summary: { orders: orders.length, libraryItems: library.length, commissions: 0, communityInteractions: 0 },
    orders,
    library,
    subscription: null,
    benefits: { code: null, name: "Visitatore", active: false, commissionDiscountPercent: 0, artworkCreditsPerMonth: 0, artworkCreditCap: 0, currentPeriodEnd: null },
    subscriptionInvoices: [], commissions: [], supportTickets: [], community: { likes: 0, comments: 0, openReports: 0 },
  };
}

type AccountView = "overview" | "benefits" | "library" | "commissions" | "orders" | "community" | "profile";

const accountViews: Array<{ id: AccountView; label: string }> = [
  { id: "overview", label: "Panoramica" },
  { id: "benefits", label: "Universe Pass" },
  { id: "library", label: "Acquisti e libreria" },
  { id: "commissions", label: "Commissioni" },
  { id: "orders", label: "Ordini" },
  { id: "community", label: "Community" },
  { id: "profile", label: "Profilo" },
];
const primaryAccountViews = accountViews.filter((view) => !["orders", "community"].includes(view.id));
const secondaryAccountViews = accountViews.filter((view) => ["orders", "community"].includes(view.id));

function readAccountView(): AccountView {
  const requestedView = window.location.hash.replace(/^#(?:account-)?/, "") as AccountView;
  return accountViews.some((view) => view.id === requestedView) ? requestedView : "overview";
}

function subscribeToAccountView(onStoreChange: () => void) {
  window.addEventListener("hashchange", onStoreChange);
  return () => window.removeEventListener("hashchange", onStoreChange);
}

const statusLabels: Record<string, string> = {
  active: "Attivo", revoked: "Revocato", paid: "Pagato", failed: "Non riuscito", past_due: "Pagamento scaduto", pending: "In attesa", incomplete: "Da completare", canceled: "Annullato", refund_pending: "Rimborso in corso", refunded: "Rimborsato", disputed: "Contestato",
  deletion_requested: "Cancellazione richiesta", new: "Ricevuta", reviewing: "In valutazione", quoted: "Preventivo inviato",
  accepted: "Accettata", in_progress: "In lavorazione", delivered: "Consegnata", rejected: "Non accettata",
  awaiting_balance: "Saldo richiesto", balance_paid: "Saldo pagato", payment_issue: "Verifica pagamento", completed: "Completata",
  open: "Assistenza ricevuta", waiting_user: "Risposta richiesta", resolved: "Risolta", closed: "Chiusa",
};

function dateLabel(value: string | null) {
  if (!value) return "—";
  const normalized = /Z$|[+-]\d\d:\d\d$/.test(value) ? value : `${value.replace(" ", "T")}Z`;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

function money(cents: number | null, currency = "EUR") {
  if (cents === null) return "Preventivo non emesso";
  return new Intl.NumberFormat("it-IT", { style: "currency", currency }).format(cents / 100);
}

function ArtworkLibraryEntry({ item }: { item: Dashboard["library"][number] }) {
  const remaining = item.downloadLimit === null ? null : Math.max(0, item.downloadLimit - item.downloadCount);
  const packageReady = item.status === "active" && item.deliveryStatus === "approved" && (remaining === null || remaining > 0);
  return <li className="personal-library-entry">
    <div><strong>{item.title}</strong><small>{item.resourceCode} · {statusLabels[item.status] ?? item.status}</small></div>
    <div className="personal-library-actions">
      {packageReady ? <a className="personal-library-download" href={`/api/artwork-download?code=${encodeURIComponent(item.resourceCode)}`}>
        Scarica il pacchetto <span>{remaining === null ? "Accesso attivo" : `${remaining} di ${item.downloadLimit} disponibili`}</span>
      </a> : <span className="personal-library-delivery-state">
        {item.status === "revoked" ? "Licenza revocata dopo rimborso o contestazione" : remaining === 0 ? "Download pacchetto esauriti" : item.deliveryStatus === "sent" ? "Collegamento privato inviato alla tua email LoreWise" : item.deliveryStatus === "pending" ? "Consegna privata in preparazione" : "Consegna in controllo qualità"}
      </span>}
      {item.certificateAvailable ? <a className="personal-certificate-download" href={`/api/artwork-certificate?code=${encodeURIComponent(item.resourceCode)}`}>
        Certificato nominativo <span>PDF personale · sempre disponibile</span>
      </a> : null}
    </div>
  </li>;
}

function GameLibraryEntry({ item }: { item: Dashboard["library"][number] }) {
  const remaining = item.downloadLimit === null ? null : Math.max(0, item.downloadLimit - item.downloadCount);
  const packageReady = item.status === "active" && item.deliveryStatus === "approved" && (remaining === null || remaining > 0);
  return <li className="personal-library-entry">
    <div><strong>{item.title}</strong><small>{item.resourceCode}{item.deliveryVersion ? ` · versione ${item.deliveryVersion}` : ""} · {statusLabels[item.status] ?? item.status}</small></div>
    <div className="personal-library-actions">
      {packageReady ? <a className="personal-library-download" href={`/api/game-download?code=${encodeURIComponent(item.resourceCode)}`}>
        Scarica per Windows <span>{remaining === null ? "Installer personale · accesso attivo" : `${remaining} di ${item.downloadLimit} download disponibili`}</span>
      </a> : <span className="personal-library-delivery-state">{item.status === "revoked" ? "Licenza revocata dopo rimborso o contestazione" : remaining === 0 ? "Download installer esauriti" : item.deliveryStatus === "sent" ? "Collegamento privato inviato alla tua email LoreWise" : item.deliveryStatus === "pending" ? "Installer in preparazione per la consegna privata" : "Installer in controllo qualità"}</span>}
    </div>
  </li>;
}

export function AccountPersonalDashboard({ successfulSessionId = "", localHalloweenPreview = false }: { successfulSessionId?: string; localHalloweenPreview?: boolean }) {
  const [data, setData] = useState<Dashboard | null>(() => localHalloweenPreview ? halloweenPurchasePreview() : null);
  const [message, setMessage] = useState("Apertura del tuo archivio personale…");
  const [subscriptionMessage, setSubscriptionMessage] = useState("");
  const [subscriptionBusy, setSubscriptionBusy] = useState(false);
  const [showPurchaseGuide, setShowPurchaseGuide] = useState(Boolean(successfulSessionId));
  const activeView = useSyncExternalStore(subscribeToAccountView, readAccountView, () => "overview");

  useEffect(() => {
    if (localHalloweenPreview) return;
    let active = true;
    void fetch("/api/account/dashboard", { headers: { accept: "application/json" } })
      .then(async (response) => {
        const body = await response.json() as Dashboard & { error?: string };
        if (!response.ok) throw new Error(body.error || "Area personale non disponibile.");
        if (!active) return;
        setData(body);
        setMessage("");
      })
      .catch((error: Error) => active && setMessage(error.message));
    return () => { active = false; };
  }, [localHalloweenPreview]);

  async function updateSubscription(cancelAtPeriodEnd: boolean) {
    if (cancelAtPeriodEnd && !window.confirm("Vuoi disattivare il rinnovo mensile? Il Universe Pass resterà attivo fino alla fine del periodo già pagato.")) return;
    setSubscriptionBusy(true);
    setSubscriptionMessage(data?.commerce.testMode ? "Aggiornamento dell’abbonamento di prova…" : "Aggiornamento dell’abbonamento…");
    try {
      const response = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancelAtPeriodEnd }),
      });
      const payload = await response.json() as { success?: boolean; cancelAtPeriodEnd?: boolean; currentPeriodEnd?: string | null; error?: string };
      if (!response.ok || !payload.success) throw new Error(payload.error || "Aggiornamento non disponibile.");
      setData((current) => current?.subscription ? {
        ...current,
        subscription: { ...current.subscription, cancelAtPeriodEnd: Boolean(payload.cancelAtPeriodEnd), currentPeriodEnd: payload.currentPeriodEnd ?? current.subscription.currentPeriodEnd },
      } : current);
      setSubscriptionMessage(cancelAtPeriodEnd ? "Rinnovo disattivato: il piano resta valido fino alla fine del periodo." : data?.commerce.testMode ? "Rinnovo mensile di prova riattivato." : "Rinnovo mensile riattivato.");
    } catch (error) {
      setSubscriptionMessage(error instanceof Error ? error.message : "Aggiornamento non disponibile.");
    } finally {
      setSubscriptionBusy(false);
    }
  }

  if (!data) return <section className="personal-dashboard-loading" aria-live="polite"><Image src="/brand/lorewise-universe-logo-concept-c.webp" alt="" width={1536} height={1024} unoptimized /><div><strong>Archivio LoreWise ID</strong><p>{message}</p></div></section>;

  const canModerate = ["admin", "moderator"].includes(data.identity.role);
  const artworkItems = data.library.filter((item) => ["artwork", "art", "license"].includes(item.resourceType));
  const gameItems = data.library.filter((item) => ["game", "app", "software"].includes(item.resourceType));
  const artworkCollectionGroups = horrorArtworkBundles.map((bundle) => ({
    bundle,
    items: artworkItems.filter((item) => item.collectionCode === bundle.code || item.orderProductCode === bundle.code),
  })).filter((group) => group.items.length > 0);
  const groupedArtworkCodes = new Set(artworkCollectionGroups.flatMap((group) => group.items.map((item) => item.resourceCode)));
  const standaloneArtworkItems = artworkItems.filter((item) => !groupedArtworkCodes.has(item.resourceCode));
  const successfulOrder = successfulSessionId
    ? data.orders.find((order) => order.checkoutSessionId === successfulSessionId && order.status === "paid")
    : null;
  const successfulSubscription = successfulOrder?.type === "subscription";
  const successfulCommission = successfulOrder?.type === "commission";
  const purchasedItems = successfulOrder?.productCode
    ? data.library.filter((item) => (item.resourceCode === successfulOrder.productCode || item.orderProductCode === successfulOrder.productCode) && item.status === "active")
    : [];
  const purchasedItem = purchasedItems[0] ?? null;
  const purchasedCollection = successfulOrder?.productCode
    ? horrorArtworkBundles.find((bundle) => bundle.code === successfulOrder.productCode) ?? null
    : null;
  const purchasedRemaining = purchasedItem?.downloadLimit === null
    ? null
    : purchasedItem ? Math.max(0, purchasedItem.downloadLimit - purchasedItem.downloadCount) : 0;
  const purchasedIsArtwork = Boolean(purchasedItem && ["artwork", "art", "license"].includes(purchasedItem.resourceType));
  const purchasedAutomaticReady = purchasedItems.length > 0 && purchasedItems.every((item) => item.deliveryStatus === "approved");
  const renewalSuffix = data.commerce.testMode ? " di prova" : "";
  const purchasedDownloadUrl = purchasedItem
    ? purchasedIsArtwork
      ? `/api/artwork-download?code=${encodeURIComponent(purchasedItem.resourceCode)}`
      : `/api/game-download?code=${encodeURIComponent(purchasedItem.resourceCode)}`
    : "";
  const accountTasks = [
    ...data.orders.filter((order) => ["pending", "payment_issue", "refund_pending"].includes(order.status)).slice(0, 3).map((order) => ({ tone: "urgent", title: statusLabels[order.status] ?? order.status, detail: `${order.itemTitles || order.type} · ${order.referenceCode}`, href: `/account/ordini/${encodeURIComponent(order.referenceCode)}`, action: "Apri ordine" })),
    ...data.commissions.filter((commission) => ["quoted", "accepted", "awaiting_balance", "payment_issue"].includes(commission.status)).slice(0, 3).map((commission) => ({ tone: commission.status === "payment_issue" ? "urgent" : "active", title: statusLabels[commission.status] ?? commission.status, detail: `${commission.packageName} · ${commission.referenceCode}`, href: "/commissioni/stato", action: "Apri pratica" })),
    ...data.library.filter((item) => item.status === "active" && item.deliveryStatus === "approved" && (item.downloadLimit === null || item.downloadCount < item.downloadLimit)).slice(0, 2).map((item) => ({ tone: "ready", title: "Download disponibile", detail: item.title, href: "#account-library", action: "Apri libreria" })),
    ...data.supportTickets.filter((ticket) => ["waiting_user", "open", "reviewing"].includes(ticket.status)).slice(0, 3).map((ticket) => ({ tone: ticket.status === "waiting_user" ? "urgent" : "active", title: statusLabels[ticket.status] ?? ticket.status, detail: `${ticket.subject} · ${ticket.referenceCode}`, href: "/assistenza-giochi#ticket", action: ticket.status === "waiting_user" ? "Leggi la risposta" : "Segui ticket" })),
    ...(data.subscription?.expiresSoon ? [{ tone: "active", title: "Periodo del Pass in scadenza", detail: `Termine previsto: ${dateLabel(data.subscription.currentPeriodEnd)}`, href: "#account-benefits", action: "Controlla vantaggi" }] : []),
  ];

  function closePurchaseGuide() {
    setShowPurchaseGuide(false);
    window.history.replaceState({}, "", "/account");
  }

  function openView(view: AccountView) {
    window.history.replaceState({}, "", `/account#account-${view}`);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    window.requestAnimationFrame(() => document.querySelector(".personal-dashboard-nav")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  return <section className="personal-dashboard" aria-labelledby="personal-dashboard-title">
    {showPurchaseGuide ? <div className="purchase-success-backdrop" role="presentation">
      <section className="purchase-success-dialog" role="dialog" aria-modal="true" aria-labelledby="purchase-success-title" aria-describedby="purchase-success-description">
        <button className="purchase-success-close" type="button" onClick={closePurchaseGuide} aria-label={successfulSubscription ? "Chiudi il riepilogo del Universe Pass" : successfulCommission ? "Chiudi il riepilogo della commissione" : "Chiudi le istruzioni di download"}>Chiudi</button>
        <Image className="purchase-success-seal" src="/brand/lorewise-wax-seal-v1.webp" alt="Sigillo LoreWise Universe" width={1024} height={1024} />
        <div className="purchase-success-copy">
          <p className="eyebrow">{successfulSubscription ? "Universe Pass · attivazione confermata" : successfulCommission ? "Commissione · pagamento confermato" : "Acquisto confermato · consegna protetta"}</p>
          <h2 id="purchase-success-title">{successfulSubscription ? "Il tuo Universe Pass è attivo." : successfulCommission ? "Il pagamento del progetto è registrato." : purchasedCollection && purchasedAutomaticReady ? "Le tre opere sono pronte nella tua Libreria." : purchasedAutomaticReady ? "Ora puoi scaricare ciò che hai acquistato." : "Acquisto registrato. Prepariamo la consegna privata."}</h2>
          <p id="purchase-success-description">{successfulSubscription ? "Crediti, sconti e accessi sono collegati al tuo LoreWise ID e compaiono nel Centro vantaggi." : successfulCommission ? "La pratica è stata aggiornata automaticamente. Puoi seguirne ogni passaggio nell’Area personale e nella pagina Stato commissione." : purchasedCollection && purchasedAutomaticReady ? `${purchasedCollection.title} contiene tre pacchetti protetti. Ogni opera ha il proprio download e il proprio certificato personale, sempre collegati a questo LoreWise ID.` : purchasedAutomaticReady ? "Il file non parte automaticamente: rimane custodito nella tua Libreria LoreWise, così potrai ritrovarlo anche dopo aver chiuso questa pagina." : "Riceverai il collegamento privato all'indirizzo email associato al tuo LoreWise ID dopo la verifica dell'ordine. L'originale non viene esposto pubblicamente."}</p>
          {successfulOrder ? <div className="purchase-success-order"><span>Ordine</span><strong>{successfulOrder.itemTitles || successfulOrder.productCode}</strong><small>{successfulOrder.referenceCode} · {money(successfulOrder.totalCents, successfulOrder.currency)}</small></div> : <p className="purchase-success-waiting" role="status">Stripe ha ricevuto il pagamento. La licenza sta comparendo nella Libreria: attendi qualche istante e aggiorna la pagina.</p>}
          {successfulSubscription ? <ol>
            <li><b>01</b><span><strong>Controlla il piano</strong>Stato, periodo corrente e rinnovo sono visibili qui sotto.</span></li>
            <li><b>02</b><span><strong>Usa i vantaggi</strong>Crediti Arte e sconti vengono applicati dal server al tuo LoreWise ID.</span></li>
            <li><b>03</b><span><strong>Segui i rinnovi</strong>Ogni pagamento mensile confermato entra nello storico del piano.</span></li>
          </ol> : successfulCommission ? <ol>
            <li><b>01</b><span><strong>Pagamento associato</strong>Acconto o saldo sono collegati alla richiesta corretta.</span></li>
            <li><b>02</b><span><strong>Stato aggiornato</strong>La lavorazione procede soltanto secondo il preventivo accettato.</span></li>
            <li><b>03</b><span><strong>Assistenza tracciata</strong>Ordine e pratica restano disponibili nel tuo account.</span></li>
          </ol> : <ol>
            <li><b>01</b><span><strong>{purchasedCollection && purchasedAutomaticReady ? "Scegli uno dei tre pacchetti" : purchasedAutomaticReady ? "Scarica il pacchetto" : "Attendi la consegna privata"}</strong>{purchasedCollection && purchasedAutomaticReady ? "I download restano separati, così puoi scaricare soltanto l’opera che ti serve." : purchasedAutomaticReady ? "Contiene il file acquistato. Ogni scaricamento utilizza uno dei tentativi disponibili." : "GiWise Studio verifica l'ordine e invia il collegamento soltanto all'email del LoreWise ID."}</span></li>
            <li><b>02</b><span><strong>Conserva {purchasedCollection ? "i certificati" : "il certificato"}</strong>{purchasedCollection ? "Ogni opera dispone del proprio PDF nominativo collegato all’ordine e alla licenza personale." : "Il PDF nominativo prova l’associazione tra ordine, LoreWise ID e licenza personale."}</span></li>
            <li><b>03</b><span><strong>Ritrovalo quando vuoi</strong>Account → Libreria → Arte e licenze.</span></li>
          </ol>}
          <div className="purchase-success-actions">
            {successfulSubscription ? <button type="button" onClick={() => { closePurchaseGuide(); openView("benefits"); }}>Apri i miei vantaggi</button> : successfulCommission ? <button type="button" onClick={() => { closePurchaseGuide(); openView("commissions"); }}>Apri la commissione</button> : purchasedCollection && purchasedAutomaticReady ? <button type="button" onClick={() => { closePurchaseGuide(); openView("library"); }}>Apri i tre download <span>Pacchetti e certificati</span></button> : purchasedAutomaticReady && purchasedItem && purchasedRemaining !== 0 ? <a className="purchase-success-download" href={purchasedDownloadUrl}>{purchasedIsArtwork ? "Scarica il pacchetto" : "Scarica il gioco"}<span>{purchasedRemaining === null ? "Accesso attivo" : purchasedRemaining === 1 ? "1 download disponibile" : `${purchasedRemaining} download disponibili`}</span></a> : <button type="button" onClick={() => { closePurchaseGuide(); openView("orders"); }}>Segui la consegna</button>}
            {purchasedCollection && successfulOrder ? <Link className="purchase-success-certificate" href={`/account/ordini/${encodeURIComponent(successfulOrder.referenceCode)}`}>Apri ricevuta e licenze <span>{successfulOrder.referenceCode}</span></Link> : purchasedIsArtwork && purchasedItem?.certificateAvailable ? <a className="purchase-success-certificate" href={`/api/artwork-certificate?code=${encodeURIComponent(purchasedItem.resourceCode)}`}>Scarica il certificato <span>PDF nominativo</span></a> : null}
          </div>
          <small className="purchase-success-note">{successfulSubscription ? "Il Pass resta gestibile dall’Area personale; l’annullamento del rinnovo non cancella le opere già riscattate." : successfulCommission ? "La ricevuta dell’ordine non sostituisce il preventivo e le condizioni già accettate." : "Il certificato non consuma download. Il pacchetto acquistato sì."}</small>
        </div>
      </section>
    </div> : null}
    <header className="personal-dashboard-intro">
      <div><p className="eyebrow">Archivio personale · LoreWise ID</p><h2 id="personal-dashboard-title">{data.identity.displayName ? `Bentornato, ${data.identity.displayName}.` : "Il tuo universo è qui."}</h2><p>Solo attività, licenze e richieste collegate al tuo account. Nessun contenuto dimostrativo viene inserito in questo archivio.</p></div>
      <aside><span>{statusLabels[data.identity.status] ?? data.identity.status}</span><strong>{data.identity.email}</strong><small>Membro dal {dateLabel(data.identity.memberSince)}</small></aside>
    </header>

    <nav className="personal-dashboard-nav" aria-label="Sezioni dell’Area personale">
      <HorizontalScrollHint className="personal-dashboard-scroll-hint" />
      {primaryAccountViews.map((view) => <button key={view.id} type="button" aria-pressed={activeView === view.id} onClick={() => openView(view.id)}>{view.label}</button>)}
      <details className="personal-dashboard-more" open={secondaryAccountViews.some((view) => view.id === activeView)}><summary>Altro</summary><div>{secondaryAccountViews.map((view) => <button key={view.id} type="button" aria-pressed={activeView === view.id} onClick={() => openView(view.id)}>{view.label}</button>)}</div></details>
      {canModerate ? <Link className="personal-dashboard-admin-switch" href={data.identity.role === "admin" ? "/admin" : "/gestione-community"}>{data.identity.role === "admin" ? "Admin" : "Moderazione"}<span aria-hidden="true">↗</span></Link> : null}
    </nav>

    <section id="account-overview" className="account-workspace-panel" aria-label="Panoramica account" hidden={activeView !== "overview"}>
      <section id="account-tasks" className="account-task-center" aria-labelledby="account-task-title"><header><div><p className="eyebrow">La tua prossima azione</p><h3 id="account-task-title">Da fare ora.</h3></div><strong>{accountTasks.length}<span>attività</span></strong></header>{accountTasks.length ? <ol>{accountTasks.map((task, index) => <li className={`tone-${task.tone}`} key={`${task.href}-${index}`}><span aria-hidden="true" /><div><strong>{task.title}</strong><p>{task.detail}</p></div>{task.href === "#account-library" || task.href === "#account-benefits" ? <button type="button" onClick={() => openView(task.href === "#account-library" ? "library" : "benefits")}>{task.action} →</button> : <a href={task.href}>{task.action} →</a>}</li>)}</ol> : <div className="account-task-empty"><strong>Tutto sotto controllo.</strong><p>Non ci sono pagamenti, richieste o consegne che richiedono una tua azione.</p><Link href="/cerca">Esplora LoreWise</Link></div>}</section>

      {canModerate ? <div className="personal-admin-entry"><Image src="/brand/icons/social-assistenza-concept-v1.webp" alt="" width={1224} height={1285} unoptimized /><div><p className="eyebrow">Ruolo {data.identity.role === "admin" ? "amministratore" : "moderatore"}</p><strong>{data.community.openReports ? `${data.community.openReports} segnalazioni da valutare` : "Centro operativo disponibile"}</strong></div><div className="personal-admin-actions"><Link href={data.identity.role === "admin" ? "/admin" : "/gestione-community"}>{data.identity.role === "admin" ? "Apri il Centro Admin" : "Apri la moderazione"}</Link></div></div> : null}

      <ol className="personal-dashboard-numbers" aria-label="Riepilogo personale">
        <li><span>01</span><strong>{data.summary.orders}</strong><small>Ordini registrati</small></li>
        <li><span>02</span><strong>{data.summary.libraryItems}</strong><small>Contenuti in libreria</small></li>
        <li><span>03</span><strong>{data.summary.commissions}</strong><small>Commissioni collegate</small></li>
        <li><span>04</span><strong>{data.summary.communityInteractions}</strong><small>Interazioni Community</small></li>
      </ol>
    </section>

    <div className="account-workspace-panel personal-dashboard-chapters" hidden={activeView !== "benefits"}>
      <BenefitsCenter />
      <article className="personal-chapter personal-pass">
        <header><Image src="/brand/lorewise-universe-logo-concept-c.webp" alt="" width={1536} height={1024} unoptimized /><div><p className="eyebrow">Universe Pass</p><h3>Il tuo accesso.</h3></div></header>
        {data.subscription ? <div className="personal-active-pass"><strong>Universe Pass {data.benefits.name !== "Visitatore" ? data.benefits.name : data.subscription.planCode.replace("LW-PASS-", "")}</strong><span>{data.subscription.complimentary ? "Collector permanente" : statusLabels[data.subscription.status] ?? data.subscription.status}</span><p>{data.subscription.complimentary ? "Accesso proprietario senza scadenza e senza rinnovo." : data.subscription.currentPeriodEnd ? "Periodo corrente fino al " + dateLabel(data.subscription.currentPeriodEnd) + "." : "Periodo non ancora definito."}</p>{data.benefits.active ? <dl className="personal-pass-benefits"><div><dt>Commissioni</dt><dd>Sconto automatico {data.benefits.commissionDiscountPercent}%</dd></div><div><dt>Arte</dt><dd>{data.benefits.artworkCreditsPerMonth} {data.benefits.artworkCreditsPerMonth === 1 ? "credito mensile" : "crediti mensili"} · massimo {data.benefits.artworkCreditCap}</dd></div></dl> : <small>I vantaggi sono sospesi finché il piano non risulta attivo e pagato.</small>}{!data.subscription.complimentary && data.subscription.cancelAtPeriodEnd ? <small>Il rinnovo risulta disattivato.</small> : null}{!data.subscription.complimentary && ["active", "trialing", "past_due"].includes(data.subscription.status) ? <button type="button" disabled={subscriptionBusy} onClick={() => void updateSubscription(!data.subscription?.cancelAtPeriodEnd)}>{data.subscription.cancelAtPeriodEnd ? "Riattiva rinnovo" + renewalSuffix : "Disattiva il rinnovo" + renewalSuffix}</button> : null}{subscriptionMessage ? <p role="status">{subscriptionMessage}</p> : null}{data.subscriptionInvoices.length ? <ol className="personal-pass-invoices">{data.subscriptionInvoices.map((invoice) => <li key={invoice.invoiceId}><div><b>{money(invoice.amountPaidCents, invoice.currency)}</b><small>{invoice.periodStart && invoice.periodEnd ? dateLabel(invoice.periodStart) + " – " + dateLabel(invoice.periodEnd) : dateLabel(invoice.paidAt)}</small></div><span>{statusLabels[invoice.status] ?? invoice.status}</span></li>)}</ol> : data.subscription.complimentary ? <small>Nessun pagamento richiesto per questo accesso.</small> : <small>Nessun pagamento di rinnovo registrato.</small>}</div> : <div className="personal-empty"><strong>Nessun abbonamento attivo.</strong><p>{data.commerce.testMode ? "I piani Supporter e Collector sono disponibili nel collaudo Stripe test." : "Scegli Supporter o Collector e gestisci rinnovo e vantaggi dal tuo LoreWise ID."}</p><Link href="/abbonamento">Consulta i piani</Link></div>}
      </article>
    </div>

    <div id="account-orders" className="account-workspace-panel personal-dashboard-chapters account-single-chapter" hidden={activeView !== "orders"}>
      <article className="personal-chapter personal-orders">
        <header><Image src="/brand/icons/shop-concept-v1.webp" alt="" width={1224} height={1285} unoptimized /><div><p className="eyebrow">Ordini e ricevute</p><h3>I tuoi acquisti.</h3></div></header>
        {data.orders.length ? <ol>{data.orders.map((order) => <li key={order.referenceCode}><div><strong>{order.itemTitles || order.type}</strong><small>{order.referenceCode} · {dateLabel(order.createdAt)}</small></div><span>{statusLabels[order.status] ?? order.status}</span><b>{money(order.totalCents, order.currency)}</b><Link className="personal-order-detail" href={`/account/ordini/${encodeURIComponent(order.referenceCode)}`}>Apri riepilogo</Link></li>)}</ol> : <div className="personal-empty"><strong>Nessun ordine registrato.</strong><p>Gli acquisti compariranno qui soltanto dopo la conferma reale del pagamento.</p><div><Link href="/arte">Esplora l’Arte</Link><Link href="/giochi">Scopri Giochi e App</Link></div></div>}
      </article>

    </div>

    <div id="account-library" className="account-workspace-panel personal-dashboard-chapters account-single-chapter" hidden={activeView !== "library"}>
      <article className="personal-chapter personal-library">
        <header><Image src="/brand/icons/arte-concept-v1.webp" alt="" width={1224} height={1285} unoptimized /><div><p className="eyebrow">Arte, giochi e licenze</p><h3>La tua libreria.</h3></div></header>
        {data.library.length ? <div className="personal-library-columns"><section><h4>Arte e licenze</h4>{artworkItems.length ? <div className="personal-library-art-groups">
          {artworkCollectionGroups.map(({ bundle, items }) => <section className="personal-library-collection" key={bundle.code} aria-labelledby={`library-${bundle.slug}`}>
            <header><div><small>Collezione completa · 3 opere</small><h5 id={`library-${bundle.slug}`}>{bundle.title}</h5></div><span>{items[0]?.orderReferenceCode ?? bundle.code}</span></header>
            <ul>{items.map((item) => <ArtworkLibraryEntry key={`${item.resourceType}-${item.resourceCode}`} item={item} />)}</ul>
            <footer><Link href={`/account/ordini/${encodeURIComponent(items[0]?.orderReferenceCode ?? "")}`}>Ricevuta e riepilogo</Link><Link href="/licenza-arte">Condizioni della licenza personale</Link></footer>
          </section>)}
          {standaloneArtworkItems.length ? <section className="personal-library-standalone"><h5>Opere singole</h5><ul>{standaloneArtworkItems.map((item) => <ArtworkLibraryEntry key={`${item.resourceType}-${item.resourceCode}`} item={item} />)}</ul></section> : null}
        </div> : <p>Nessuna opera posseduta.</p>}</section><section><h4>Giochi e applicazioni</h4>{gameItems.length ? <ul>{gameItems.map((item) => <GameLibraryEntry key={`${item.resourceType}-${item.resourceCode}`} item={item} />)}</ul> : <p>Nessun gioco acquistato.</p>}</section></div> : <div className="personal-empty"><strong>La libreria è ancora vuota.</strong><p>Download e file appariranno esclusivamente dopo l’assegnazione di una licenza o di un diritto verificato.</p></div>}
      </article>

    </div>

    <div id="account-commissions" className="account-workspace-panel personal-dashboard-chapters account-single-chapter" hidden={activeView !== "commissions"}>
      <article className="personal-chapter personal-commissions">
        <header><Image src="/brand/icons/commissioni-concept-v1.webp" alt="" width={1224} height={1285} unoptimized /><div><p className="eyebrow">Lavori su richiesta</p><h3>Le tue commissioni.</h3></div></header>
        {data.commissions.length ? <ol>{data.commissions.map((commission) => <li key={commission.referenceCode}><div><strong>{commission.packageName}</strong><small>{commission.referenceCode} · {commission.category}</small>{commission.quoteDiscountCents ? <small>{commission.pricingDiscountLabel ?? getCommissionPromotionForSubmission(commission.packageName, commission.createdAt)?.label ?? commission.membershipPlanCode ?? "Sconto"}{commission.pricingDiscountKind === "percentage" ? ` · ${commission.pricingDiscountValue ?? commission.membershipDiscountPercent}%` : ""}: −{money(commission.quoteDiscountCents)}</small> : null}</div><span>{statusLabels[commission.status] ?? commission.status}</span><b>{money(commission.quoteCents)}</b></li>)}</ol> : <div className="personal-empty"><strong>Nessuna commissione collegata.</strong><p>Le nuove richieste vengono collegate direttamente al LoreWise ID e ricevono automaticamente i vantaggi del piano attivo.</p><Link href="/commissioni">Richiedi un progetto</Link></div>}
      </article>

    </div>

    <div id="account-community" className="account-workspace-panel personal-dashboard-chapters account-single-chapter" hidden={activeView !== "community"}>
      <article className="personal-chapter personal-community-account">
        <header><Image src="/brand/icons/social-assistenza-concept-v1.webp" alt="" width={1224} height={1285} unoptimized /><div><p className="eyebrow">Reazioni dalla Community</p><h3>La tua voce.</h3></div></header>
        <div className="personal-community-counts"><div><strong>{data.community.likes}</strong><span>Like lasciati</span></div><div><strong>{data.community.comments}</strong><span>Commenti pubblicati</span></div></div>
        <p>Puoi gestire commenti e recensioni direttamente dalla scheda dell’opera o del gioco interessato.</p><div className="personal-admin-actions"><Link href="/arte">Vai alla collezione Arte</Link><Link href="/giochi">Vai ai giochi</Link></div>
      </article>
    </div>

    <div className="account-workspace-panel account-profile-panel" hidden={activeView !== "profile"}><AccountProfilePanel /></div>
  </section>;
}
