import { horrorArtworkBundles } from "./horrorArtworkBundles.ts";
import { commissionWorks } from "./commissionCatalog.ts";
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
  plannedAt: string;
  endsAt: string;
  landingPath: string;
  email: MarketingCampaignCopy;
  social: PromotionSocialPost[];
};

const halloweenAssets = horrorArtworkBundles.flatMap((bundle) => bundle.artworks.map((artwork) => ({
  src: artwork.image,
  alt: `${bundle.title} · ${artwork.title}`,
})));

const halloweenSocialCopy = `Tre collezioni. Nove opere originali GiWise Studio.\n\nFede Corrotta, Incubi Interiori e Creature del Buio arrivano su LoreWise Universe dal 1° ottobre al 1° novembre 2026. Ogni collezione contiene tre pacchetti digitali protetti e tre licenze personali.\n\n24,90 € per collezione. Accedi con il tuo LoreWise ID e scegli il percorso che vuoi portare con te.\n\n#GiWiseStudio #LoreWiseUniverse #HalloweenArt #ArteDigitale`;

const holidayAssets = ["LW-COM-001", "LW-COM-011", "LW-COM-015"].map((code) => {
  const work = commissionWorks.find((entry) => entry.code === code);
  if (!work) throw new Error(`Commissione promozionale mancante: ${code}`);
  return { src: work.image, alt: `${work.title} · ${work.requestType} GiWise Studio` };
});

export const promotionCommunicationPacks: PromotionCommunicationPack[] = [
  {
    code: "GW-PROMO-HALLOWEEN-COLLECTIONS-2026",
    title: "Collezioni Halloween 2026",
    period: "1 ottobre – 1 novembre 2026",
    plannedAt: "2026-10-01T09:00:00+02:00",
    endsAt: "2026-11-01T23:59:59.999+01:00",
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
  {
    code: "GW-PROMO-FESTE-NEXUS-2026",
    title: "Feste nel Nexus 2026",
    period: "1 dicembre 2026 – 1 gennaio 2027",
    plannedAt: "2026-12-01T09:00:00+01:00",
    endsAt: "2027-01-01T23:59:59.999+01:00",
    landingPath: "/feste-nel-nexus",
    email: {
      subject: "Regala un mondo. O comincia il tuo.",
      heading: "Le Feste entrano nel Nexus.",
      body: "Dal 1° dicembre 2026 al 1° gennaio 2027, le commissioni GiWise Studio ricevono una tariffa dedicata sul preventivo finale.\n\nVisitatori −10%, Supporter −15%, Collector −20%. Puoi scegliere Ritratto Essenziale, Ritratto Completo oppure Opera Narrativa.\n\nInviare la richiesta è gratuito. Prima dell’inizio ricevi il preventivo completo e, se confermi, la tariffa resta acquisita anche quando la lavorazione prosegue dopo il 1° gennaio. Lo sconto non è cumulabile: viene applicato il vantaggio più conveniente.",
      actionLabel: "Scopri le Feste nel Nexus",
      actionUrl: "/feste-nel-nexus",
    },
    social: [
      {
        channel: "instagram_facebook",
        label: "Instagram e Facebook",
        format: "Carosello verticale · 3 commissioni reali",
        copy: "Regala un mondo. O comincia il tuo.\n\nDal 1° dicembre 2026 al 1° gennaio 2027, le commissioni GiWise Studio entrano nelle Feste del Nexus.\n\nVisitatori −10%\nSupporter −15%\nCollector −20%\n\nScegli tra Ritratto Essenziale, Ritratto Completo e Opera Narrativa. La richiesta è gratuita e lo sconto viene calcolato sul preventivo finale.\n\n#GiWiseStudio #LoreWiseUniverse #CommissioniArtistiche #RegaliOriginali",
        actionLabel: "Scopri la promozione",
        actionUrl: "/feste-nel-nexus",
        assets: holidayAssets,
      },
      {
        channel: "tiktok_reels",
        label: "TikTok e Reels",
        format: "Video verticale · ritratto, coppia e animale",
        copy: "Questo Natale non regalare qualcosa. Regala un mondo.\n\nDal 1° dicembre al 1° gennaio:\n−10% Visitatori\n−15% Supporter\n−20% Collector\n\nLa tariffa viene applicata al preventivo della commissione e resta tua anche se il lavoro termina dopo la scadenza.\n\nEntra nelle Feste del Nexus.",
        actionLabel: "Apri le Commissioni",
        actionUrl: "/feste-nel-nexus",
        assets: holidayAssets,
      },
      {
        channel: "discord",
        label: "Discord LoreWise",
        format: "Annuncio diretto",
        copy: "🎁 FESTE NEL NEXUS 2026\n\nRegala un mondo. O comincia il tuo.\n\n📅 1 dicembre 2026 – 1 gennaio 2027\n✨ Visitatori −10%\n✨ Supporter −15%\n✨ Collector −20%\n\nLa promozione vale per Ritratto Essenziale, Ritratto Completo e Opera Narrativa. Inviare la richiesta è gratuito: ricevi prima il preventivo completo e la tariffa resta acquisita anche se il lavoro prosegue dopo il 1° gennaio.\n\nLo sconto non è cumulabile: viene applicato il vantaggio più conveniente.",
        actionLabel: "Scopri le Feste nel Nexus",
        actionUrl: "/feste-nel-nexus",
        assets: holidayAssets,
      },
    ],
  },
];

export function getPromotionCommunicationPack(code: string | null | undefined) {
  return code ? promotionCommunicationPacks.find((pack) => pack.code === code) ?? null : null;
}
