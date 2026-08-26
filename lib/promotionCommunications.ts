import { horrorArtworkBundles } from "./horrorArtworkBundles.ts";
import type { MarketingCampaignCopy } from "./marketingEmail.ts";

export type PromotionSocialPost = {
  channel: "instagram_facebook" | "tiktok_reels" | "discord";
  label: string;
  format: string;
  copy: string;
  actionLabel: string;
  actionUrl: string;
  assets: Array<{ src: string; alt: string }>;
};

export type PromotionCommunicationPack = {
  code: string;
  title: string;
  period: string;
  landingPath: string;
  email: MarketingCampaignCopy;
  social: PromotionSocialPost[];
};

const halloweenAssets = horrorArtworkBundles.flatMap((bundle) => bundle.artworks.map((artwork) => ({
  src: artwork.image,
  alt: `${bundle.title} · ${artwork.title}`,
})));

const halloweenSocialCopy = `Tre collezioni. Nove opere originali GiWise Studio.\n\nFede Corrotta, Incubi Interiori e Creature del Buio arrivano su LoreWise Universe dal 1° ottobre al 1° novembre 2026. Ogni collezione contiene tre pacchetti digitali protetti e tre licenze personali.\n\n24,90 € per collezione. Accedi con il tuo LoreWise ID e scegli il percorso che vuoi portare con te.\n\n#GiWiseStudio #LoreWiseUniverse #HalloweenArt #ArteDigitale`;

export const promotionCommunicationPacks: PromotionCommunicationPack[] = [
  {
    code: "GW-PROMO-HALLOWEEN-COLLECTIONS-2026",
    title: "Collezioni Halloween 2026",
    period: "1 ottobre – 1 novembre 2026",
    landingPath: "/arte#collezioni-horror",
    email: {
      subject: "Tre collezioni originali entrano nell’ombra",
      heading: "Quale oscurità porterai con te?",
      body: "Dal 1° ottobre al 1° novembre, LoreWise Universe apre tre collezioni Halloween composte esclusivamente da opere originali GiWise Studio.\n\nFede Corrotta, Incubi Interiori e Creature del Buio raccolgono tre opere ciascuna. Ogni collezione costa 24,90 € e comprende tre pacchetti digitali protetti con licenza personale.\n\nAccedi con il tuo LoreWise ID, esplora tutte le opere e scegli la collezione che ti rappresenta.",
      actionLabel: "Scopri le tre collezioni",
      actionUrl: "/arte#collezioni-horror",
    },
    social: [
      {
        channel: "instagram_facebook",
        label: "Instagram e Facebook",
        format: "Carosello · 9 anteprime protette",
        copy: halloweenSocialCopy,
        actionLabel: "Scopri le collezioni",
        actionUrl: "/arte#collezioni-horror",
        assets: halloweenAssets,
      },
      {
        channel: "tiktok_reels",
        label: "TikTok e Reels",
        format: "Sequenza verticale · 3 capitoli",
        copy: "Tre collezioni entrano nell’ombra.\n\n1. Fede Corrotta\n2. Incubi Interiori\n3. Creature del Buio\n\nNove opere originali GiWise Studio. Tre pacchetti protetti per collezione. 24,90 € dal 1° ottobre al 1° novembre 2026.\n\nScoprile su LoreWise Universe.",
        actionLabel: "Apri LoreWise Universe",
        actionUrl: "/arte#collezioni-horror",
        assets: halloweenAssets,
      },
      {
        channel: "discord",
        label: "Discord LoreWise",
        format: "Annuncio diretto",
        copy: "🎃 COLLEZIONI HALLOWEEN 2026\n\nFede Corrotta, Incubi Interiori e Creature del Buio sono tre raccolte di opere originali GiWise Studio. Ogni collezione comprende 3 pacchetti digitali protetti e 3 licenze personali.\n\n📅 1 ottobre – 1 novembre 2026\n💶 24,90 € per collezione\n🔐 Download collegati al LoreWise ID\n\nScegli la tua collezione su LoreWise Universe.",
        actionLabel: "Vai alle collezioni",
        actionUrl: "/arte#collezioni-horror",
        assets: halloweenAssets.slice(0, 3),
      },
    ],
  },
];

export function getPromotionCommunicationPack(code: string | null | undefined) {
  return code ? promotionCommunicationPacks.find((pack) => pack.code === code) ?? null : null;
}
