export const BLACK_FRIDAY_TEASER_STARTS_AT = "2026-11-02T00:00:00+01:00";
export const BLACK_FRIDAY_TEASER_ENDS_AT = "2026-11-22T23:59:59.999+01:00";
export const BLACK_FRIDAY_CAMPAIGN_STARTS_AT = "2026-11-23T00:00:00+01:00";
export const BLACK_FRIDAY_STARTS_AT = "2026-11-27T00:00:00+01:00";
export const CYBER_MONDAY_STARTS_AT = "2026-11-30T00:00:00+01:00";
export const BLACK_FRIDAY_CAMPAIGN_ENDS_AT = "2026-11-30T23:59:59.999+01:00";

export const blackFridayTeaser = {
  label: "Il portale del Black Friday si avvicina",
  shortLabel: "Conto alla rovescia",
  href: "/black-friday",
  period: "Dal 2 al 22 novembre 2026",
  targetLabel: "27 novembre 2026",
} as const;

export const blackFridayCampaign = {
  label: "Black Friday + Cyber Monday",
  period: "Dal 23 al 30 novembre 2026",
  shop: {
    label: "GiWise Shop",
    title: "Tutto il catalogo entra nel Varco Nero.",
    offer: "Sconto su tutti i prodotti",
    description: "Abbigliamento, accessori, casa e collezioni GiWise Shop partecipano alla campagna tramite il codice promozionale dedicato.",
    href: "/shop/catalogo",
    action: "Esplora tutti i prodotti",
    image: "/promotions/black-friday/path-shop-v1.webp",
  },
  pass: {
    label: "Universe Pass",
    title: "Il primo ingresso costa meno.",
    offer: "Supporter 5,90 € · Collector 9,90 €",
    description: "Il prezzo promozionale riguarda il primo mese; dal rinnovo successivo torna il prezzo ordinario mostrato prima della conferma.",
    href: "/abbonamento?focus=piani",
    action: "Confronta i due Pass",
    image: "/promotions/black-friday/path-pass-v1.webp",
  },
  cyber: {
    label: "Cyber Monday · 30 novembre",
    title: "Tre opere. Sei formati. Un solo varco digitale.",
    offer: "Incluso nel Universe Pass",
    description: "La trilogia di wallpaper con composizioni desktop e smartphone è già disponibile senza costi aggiuntivi per gli abbonati Supporter e Collector.",
    href: "/vip-zone?area=downloads#cyber-nexus",
    action: "Apri i Download VIP",
    image: "/promotions/black-friday/path-cyber-nexus-v1.webp",
  },
  cyberWorks: [
    {
      id: "il-cuore-del-nexus",
      number: "01",
      title: "Il Cuore del Nexus",
      description: "Il cristallo centrale collega mondi lontani attraverso orbite di luce: il punto in cui ogni possibilità può incontrarne un’altra.",
      desktopPreview: "/promotions/black-friday/cyber-nexus/01-il-cuore-del-nexus-desktop-preview.webp",
      mobilePreview: "/promotions/black-friday/cyber-nexus/01-il-cuore-del-nexus-mobile-preview.webp",
    },
    {
      id: "la-citta-oltre-il-varco",
      number: "02",
      title: "La Città oltre il Varco",
      description: "Una città sospesa, attraversata da cascate celesti e ponti di energia, appare oltre un portale monumentale.",
      desktopPreview: "/promotions/black-friday/cyber-nexus/02-la-citta-oltre-il-varco-desktop-preview.webp",
      mobilePreview: "/promotions/black-friday/cyber-nexus/02-la-citta-oltre-il-varco-mobile-preview.webp",
    },
    {
      id: "archivio-delle-stelle",
      number: "03",
      title: "L’Archivio delle Stelle",
      description: "Un codex di cristallo apre le proprie pagine sotto un planetario impossibile, custodendo mappe di universi ancora inesplorati.",
      desktopPreview: "/promotions/black-friday/cyber-nexus/03-archivio-delle-stelle-desktop-preview.webp",
      mobilePreview: "/promotions/black-friday/cyber-nexus/03-archivio-delle-stelle-mobile-preview.webp",
    },
  ],
} as const;

export type BlackFridayCampaignPhase = "teaser" | "black-friday" | "cyber-monday" | "ended";

export function getBlackFridayCampaignPhase(at: Date | string = new Date()): BlackFridayCampaignPhase {
  const timestamp = at instanceof Date ? at.getTime() : Date.parse(at);
  if (!Number.isFinite(timestamp) || timestamp < Date.parse(BLACK_FRIDAY_CAMPAIGN_STARTS_AT)) return "teaser";
  if (timestamp < Date.parse(CYBER_MONDAY_STARTS_AT)) return "black-friday";
  if (timestamp <= Date.parse(BLACK_FRIDAY_CAMPAIGN_ENDS_AT)) return "cyber-monday";
  return "ended";
}

export function isBlackFridayTeaserActive(at: Date | string = new Date()) {
  const timestamp = at instanceof Date ? at.getTime() : Date.parse(at);
  return Number.isFinite(timestamp)
    && timestamp >= Date.parse(BLACK_FRIDAY_TEASER_STARTS_AT)
    && timestamp <= Date.parse(BLACK_FRIDAY_TEASER_ENDS_AT);
}
