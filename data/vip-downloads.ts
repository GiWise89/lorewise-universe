export const VIP_DOWNLOAD_LIBRARY = {
  eyebrow: "Archivio digitale riservato",
  title: "Download VIP",
  introduction: "Raccolte originali GiWise Studio incluse nel Universe Pass. Ogni sfondo e disponibile in alta definizione per uso personale.",
  collections: [
    {
      id: "the-wound-remembers",
      code: "LW-VIP-DESKTOP-TWR-01",
      title: "The Wound Remembers",
      subtitle: "Archivio dei Custodi",
      description: "Tre sfondi desktop dedicati al mondo di The Wound Remembers, ora raccolti fuori dal dossier dell'espansione.",
      accent: "ember",
      bundle: { packageId: "twr-vip-drop-01-completo", label: "Scarica la raccolta completa" },
      items: [
        { code: "TWR-VIP-WALL-01", title: "Desktop VIP 01", image: "desktop-vip-01-preview", downloadAsset: "desktop-vip-01", packageId: "twr-desktop-vip-01", resolution: "1672 x 941", format: "PNG" },
        { code: "TWR-VIP-WALL-02", title: "Desktop VIP 02", image: "desktop-vip-02-preview", downloadAsset: "desktop-vip-02", packageId: "twr-desktop-vip-02", resolution: "1672 x 941", format: "PNG" },
        { code: "TWR-VIP-WALL-03", title: "Desktop VIP 03", image: "desktop-vip-03-preview", downloadAsset: "desktop-vip-03", packageId: "twr-desktop-vip-03", resolution: "1536 x 1024", format: "PNG" },
      ],
    },
    {
      id: "lorewise-match",
      code: "LW-VIP-DESKTOP-MATCH-01",
      title: "LoreWise Match",
      subtitle: "Tre visioni dall'Universo",
      description: "Una nuova trilogia di sfondi LoreWise creata da GiWise Studio e riservata agli abbonati.",
      accent: "violet",
      bundle: { packageId: "lorewise-match-vip-completo", label: "Scarica la raccolta completa" },
      items: [
        { code: "LW-MATCH-WALL-01", title: "LoreWise Match 01", image: "lorewise-match-01-preview", downloadAsset: "lorewise-match-01", packageId: "lorewise-match-desktop-vip-01", resolution: "1568 x 1003", format: "PNG" },
        { code: "LW-MATCH-WALL-02", title: "LoreWise Match 02", image: "lorewise-match-02-preview", downloadAsset: "lorewise-match-02", packageId: "lorewise-match-desktop-vip-02", resolution: "1536 x 1024", format: "PNG" },
        { code: "LW-MATCH-WALL-03", title: "LoreWise Match 03", image: "lorewise-match-03-preview", downloadAsset: "lorewise-match-03", packageId: "lorewise-match-desktop-vip-03", resolution: "1536 x 1024", format: "PNG" },
      ],
    },
  ],
  note: "I file originali non vengono caricati nella pagina: l'anteprima e alleggerita e protetta, mentre lo ZIP viene creato soltanto dopo la verifica del Pass.",
} as const;

export const VIP_WALLPAPERS_PRIVATE = [
  { mediaId: "desktop-vip-01", previewId: "desktop-vip-01-preview", sourceFile: "wallpapaer 1 twr.png", originalKey: "vip-zone/games/the-wound-remembers/wallpapers/desktop-vip-01.png", previewKey: "vip-zone/downloads/previews/desktop-vip-01.webp", downloadName: "the-wound-remembers-desktop-vip-01.png" },
  { mediaId: "desktop-vip-02", previewId: "desktop-vip-02-preview", sourceFile: "wallpapaer 2 twr.png", originalKey: "vip-zone/games/the-wound-remembers/wallpapers/desktop-vip-02.png", previewKey: "vip-zone/downloads/previews/desktop-vip-02.webp", downloadName: "the-wound-remembers-desktop-vip-02.png" },
  { mediaId: "desktop-vip-03", previewId: "desktop-vip-03-preview", sourceFile: "wallpapaer 3 twr.png", originalKey: "vip-zone/games/the-wound-remembers/wallpapers/desktop-vip-03.png", previewKey: "vip-zone/downloads/previews/desktop-vip-03.webp", downloadName: "the-wound-remembers-desktop-vip-03.png" },
  { mediaId: "lorewise-match-01", previewId: "lorewise-match-01-preview", sourceFile: "LoreWise match 1.png", originalKey: "vip-zone/downloads/lorewise-match/lorewise-match-01.png", previewKey: "vip-zone/downloads/previews/lorewise-match-01.webp", downloadName: "lorewise-match-desktop-vip-01.png" },
  { mediaId: "lorewise-match-02", previewId: "lorewise-match-02-preview", sourceFile: "Lorewise match 2.png", originalKey: "vip-zone/downloads/lorewise-match/lorewise-match-02.png", previewKey: "vip-zone/downloads/previews/lorewise-match-02.webp", downloadName: "lorewise-match-desktop-vip-02.png" },
  { mediaId: "lorewise-match-03", previewId: "lorewise-match-03-preview", sourceFile: "Lorewise match 3.png", originalKey: "vip-zone/downloads/lorewise-match/lorewise-match-03.png", previewKey: "vip-zone/downloads/previews/lorewise-match-03.webp", downloadName: "lorewise-match-desktop-vip-03.png" },
] as const;
