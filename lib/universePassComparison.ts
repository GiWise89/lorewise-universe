import { UNIVERSE_PASS_PLANS, universePassBenefitFromCode, type UniversePassBenefit, type UniversePassCode } from "./universePass.ts";

/**
 * Tabella comparativa Gratis / Universe Pass.
 * Ogni cella deriva dai vantaggi dichiarati in UNIVERSE_PASS_PLANS (e dal profilo
 * Visitatore): nessun prezzo o beneficio viene scritto a mano in questa pagina.
 */
export type PassComparisonColumn = { key: "free" | UniversePassCode; label: string; benefit: UniversePassBenefit };
export type PassComparisonCell = { included: boolean; text: string };
export type PassComparisonRow = { key: string; label: string; cells: PassComparisonCell[] };

export function passComparisonColumns(): PassComparisonColumn[] {
  return [
    { key: "free", label: "Gratis", benefit: universePassBenefitFromCode(null) },
    ...(Object.keys(UNIVERSE_PASS_PLANS) as UniversePassCode[]).map((code) => {
      const benefit = universePassBenefitFromCode(code);
      return { key: code, label: `Universe Pass ${benefit.name}`, benefit };
    }),
  ];
}

const yes = (text = "Incluso"): PassComparisonCell => ({ included: true, text });
const no = (): PassComparisonCell => ({ included: false, text: "Non incluso" });
const percent = (value: number) => (value > 0 ? yes(`−${value}%`) : no());
const flag = (value: boolean) => (value ? yes() : no());

export function passComparisonRows(columns = passComparisonColumns()): PassComparisonRow[] {
  const row = (key: string, label: string, cell: (benefit: UniversePassBenefit) => PassComparisonCell): PassComparisonRow => ({
    key, label, cells: columns.map((column) => cell(column.benefit)),
  });
  return [
    row("public", "Mondi, giochi, opere, Codex e contenuti pubblici", () => yes()),
    // L’Area VIP è aperta a qualsiasi Universe Pass attivo (vedi lib/vipAccess.ts).
    row("vip-area", "Area VIP: guide in anteprima, atelier e download", (benefit) => flag(benefit.active)),
    row("art-credits", "Crediti Arte mensili", (benefit) => benefit.artworkCreditsPerMonth > 0
      ? yes(`${benefit.artworkCreditsPerMonth} al mese · massimo ${benefit.artworkCreditCap}`)
      : no()),
    row("artwork", "Sconto su opere d’arte", (benefit) => percent(benefit.artworkDiscountPercent)),
    row("commission", "Sconto sulle commissioni", (benefit) => percent(benefit.commissionDiscountPercent)),
    row("game", "Sconto sui giochi", (benefit) => percent(benefit.gameDiscountPercent)),
    row("digital", "Sconto su prodotti digitali ammessi", (benefit) => percent(benefit.digitalDiscountPercent)),
    row("early-access", "Materiali e aggiornamenti anticipati", (benefit) => flag(benefit.earlyAccess)),
    row("beta", "Candidature alle sessioni di prova", (benefit) => flag(benefit.betaApplications)),
    row("dossiers", "Dossier originali estesi", (benefit) => flag(benefit.collectorDossiers)),
    row("badge", "Badge community", (benefit) => (benefit.communityBadge ? yes(benefit.communityBadge) : no())),
  ];
}

export function formatMonthlyPrice(amountCents: number) {
  return `${(amountCents / 100).toFixed(2).replace(".", ",")} € / mese`;
}
