// Mappa unica del sito: menu desktop, menu mobile, barra di sezione, home e footer
// leggono tutti da qui, così ogni ingresso mostra le stesse quattro aree con gli stessi nomi.
// Le etichette sono in italiano semplice; i nomi del mondo (Codex, Cronache, Universe Pass)
// restano nelle descrizioni e nei titoli delle pagine.

export type SiteLink = {
  label: string;
  description: string;
  href: string;
  badge?: string;
  /** Percorsi che appartengono a questa voce pur avendo un indirizzo diverso. */
  aliases?: readonly string[];
  /** Voce mostrata anche nella colonna "Esplora" del footer. */
  footer?: boolean;
};

export type SiteArea = {
  key: "giochi" | "mondi" | "arte" | "community";
  label: string;
  accent: "giochi" | "mondi" | "arte" | "vip";
  icon: string;
  image: string;
  summary: string;
  href: string;
  links: readonly SiteLink[];
};

export const siteAreas: readonly SiteArea[] = [
  {
    key: "giochi",
    label: "Giochi",
    accent: "giochi",
    icon: "/brand/navigation/giochi-v2.webp",
    image: "/brand/icons/giochi-v2.webp",
    summary: "The Wound Remembers è giocabile ora nel browser. Qui trovi anche i progetti in sviluppo.",
    href: "/giochi",
    links: [
      { label: "Tutti i giochi", description: "Giochi disponibili e progetti in sviluppo", href: "/giochi", footer: true },
      { label: "The Wound Remembers", description: "Il card RPG dark fantasy, giocabile ora", href: "/giochi/the-wound-remembers", badge: "Gioca ora" },
      { label: "Guide ai giochi", description: "Sistemi, percorsi e consigli per continuare", href: "/giochi/guide", aliases: ["/giochi/nexus-pet"] },
    ],
  },
  {
    key: "mondi",
    label: "Mondi",
    accent: "mondi",
    icon: "/brand/navigation/mondi-v2.webp",
    image: "/brand/home-portals/porta-mondi-v2.webp",
    summary: "Gli universi di LoreWise, i loro personaggi e le novità su ciò che succede.",
    href: "/mondi",
    links: [
      { label: "Tutti i mondi", description: "Da dove iniziare: universi, storie e personaggi", href: "/mondi", footer: true },
      { label: "Enciclopedia", description: "Il LoreWise Codex: personaggi, luoghi e legami", href: "/enciclopedia", footer: true },
      { label: "Novità", description: "Le Cronache del Nexus: cosa succede nell’universo", href: "/cronache-del-nexus", badge: "Nuovo", aliases: ["/feste-nel-nexus"] },
      { label: "Dietro le quinte", description: "Dove nascono i mondi: bozze e diario dello studio", href: "/dove-nascono-i-mondi" },
    ],
  },
  {
    key: "arte",
    label: "Arte",
    accent: "arte",
    icon: "/brand/navigation/arte-v2.webp",
    image: "/brand/home-portals/porta-crea-v2.webp",
    summary: "Opere originali da collezionare, commissioni su misura e lo shop ufficiale.",
    href: "/arte",
    links: [
      { label: "Opere originali", description: "Opere e collezioni, con licenze chiare", href: "/arte", footer: true, aliases: ["/licenza-arte"] },
      { label: "Commissioni", description: "Richiedi un’opera personale partendo dalla tua idea", href: "/commissioni", footer: true },
      { label: "Shop", description: "Merchandising e collezioni ufficiali GiWise", href: "/shop", footer: true },
    ],
  },
  {
    key: "community",
    label: "Community",
    accent: "vip",
    icon: "/brand/navigation/community-v2.webp",
    image: "/brand/home-portals/porta-nexus-v2.webp",
    summary: "Discord e canali ufficiali, il tuo Famiglio da far crescere e l’abbonamento.",
    href: "/community",
    links: [
      { label: "Community", description: "Discord, canali ufficiali e spazi per partecipare", href: "/community", footer: true },
      { label: "Il tuo Famiglio", description: "Adotta un compagno e fallo crescere ogni giorno", href: "/famiglio" },
      { label: "Abbonamento", description: "Universe Pass: piani, vantaggi e Area VIP", href: "/abbonamento", footer: true, aliases: ["/vip-zone", "/vip"] },
    ],
  },
];

export const footerSupportLinks = [
  { label: "Contatti", href: "/contatti" },
  { label: "Assistenza giochi", href: "/assistenza-giochi" },
  { label: "Privacy", href: "/privacy" },
  { label: "Condizioni commissioni", href: "/commissioni/condizioni" },
  { label: "Condizioni giochi", href: "/condizioni-vendita-giochi" },
] as const;

function matches(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function linkMatchLength(pathname: string, link: SiteLink) {
  return [link.href, ...(link.aliases ?? [])].reduce((best, href) => matches(pathname, href) ? Math.max(best, href.length) : best, -1);
}

/** La voce più specifica che corrisponde al percorso, così "/giochi/guide" non accende anche "Tutti i giochi". */
export function activeSiteLink(pathname: string): { area: SiteArea; link: SiteLink } | null {
  let found: { area: SiteArea; link: SiteLink; length: number } | null = null;
  for (const area of siteAreas) {
    for (const link of area.links) {
      const length = linkMatchLength(pathname, link);
      if (length > (found?.length ?? -1)) found = { area, link, length };
    }
  }
  return found ? { area: found.area, link: found.link } : null;
}
