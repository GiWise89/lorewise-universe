export const ART_COMMENT_LIMITS = {
  minimum: 3,
  maximum: 800,
  cooldownSeconds: 45,
} as const;

export const ART_REPORT_REASONS = [
  "Offesa o molestia",
  "Spam o pubblicità",
  "Contenuto sessuale inappropriato",
  "Violenza o odio",
  "Violazione dei diritti",
] as const;
