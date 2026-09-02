export type ChroniclePanel = "overview" | "signals" | "studio" | "promotion" | "guides" | "benefits";

export const nexusChroniclePanels: Array<{
  id: ChroniclePanel;
  number: string;
  label: string;
  query: string;
  anchor: string;
}> = [
  { id: "overview", number: "01", label: "In primo piano", query: "in-primo-piano", anchor: "in-primo-piano" },
  { id: "signals", number: "02", label: "Aggiornamenti", query: "aggiornamenti", anchor: "aggiornamenti" },
  { id: "studio", number: "03", label: "Laboratorio", query: "laboratorio", anchor: "laboratorio" },
  { id: "promotion", number: "04", label: "Promozioni", query: "promozione", anchor: "promozione" },
  { id: "guides", number: "05", label: "Guide e demo", query: "guide-demo", anchor: "guide-demo" },
  { id: "benefits", number: "06", label: "Area VIP", query: "area-vip", anchor: "area-vip" },
];

export function chroniclePanelFromQuery(value: string | null | undefined): ChroniclePanel {
  return nexusChroniclePanels.find((panel) => panel.query === value)?.id ?? "overview";
}

export function chroniclePanelAddress(panelId: ChroniclePanel) {
  return nexusChroniclePanels.find((panel) => panel.id === panelId) ?? nexusChroniclePanels[0];
}
