import { PDFDocument, StandardFonts, degrees, rgb, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";

export type ArtworkCertificateData = {
  artworkCode: string;
  artworkTitle: string;
  artworkYear: string;
  editionLabel: string;
  holderName: string;
  holderEmail: string;
  licenseId: string;
  orderReference: string;
  issuedAt: string;
};

export type ArtworkCertificateAssets = {
  logo: Uint8Array;
  artworkPreview: Uint8Array;
  seal: Uint8Array;
};

const A4_LANDSCAPE: [number, number] = [841.89, 595.28];
const navy = rgb(23 / 255, 37 / 255, 84 / 255);
const plum = rgb(76 / 255, 29 / 255, 87 / 255);
const violet = rgb(124 / 255, 58 / 255, 237 / 255);
const magenta = rgb(219 / 255, 39 / 255, 119 / 255);
const rose = rgb(250 / 255, 232 / 255, 241 / 255);
const cream = rgb(1, 250 / 255, 244 / 255);
const gold = rgb(1, 209 / 255, 102 / 255);

function safePdfText(value: string) {
  return value
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/×/g, "x")
    .replace(/…/g, "...")
    .replace(/[^\u0020-\u007E\u00A0-\u00FF]/g, "");
}

function fitText(font: PDFFont, text: string, maxWidth: number, preferred: number, minimum = 8) {
  let size = preferred;
  while (size > minimum && font.widthOfTextAtSize(text, size) > maxWidth) size -= 0.5;
  return size;
}

function drawContained(page: PDFPage, image: PDFImage, x: number, y: number, width: number, height: number) {
  const scale = Math.min(width / image.width, height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  page.drawImage(image, {
    x: x + (width - drawWidth) / 2,
    y: y + (height - drawHeight) / 2,
    width: drawWidth,
    height: drawHeight,
  });
}

function drawRow(page: PDFPage, fonts: { regular: PDFFont; bold: PDFFont }, label: string, value: string, y: number) {
  const labelX = 354;
  const valueX = 472;
  const maxValueWidth = 274;
  page.drawText(label.toUpperCase(), { x: labelX, y, size: 8.5, font: fonts.bold, color: violet });
  const safeValue = safePdfText(value);
  page.drawText(safeValue, { x: valueX, y: y - 1, size: fitText(fonts.bold, safeValue, maxValueWidth, 11.5), font: fonts.bold, color: navy });
  page.drawLine({ start: { x: labelX, y: y - 12 }, end: { x: 746, y: y - 12 }, thickness: 0.65, color: plum, opacity: 0.2 });
}

export function certificateLicenseId(artworkCode: string, entitlementId: string) {
  const artworkNumber = artworkCode.replace(/^LW-ART-/i, "");
  const entitlementToken = entitlementId.replace(/[^a-z0-9]/gi, "").slice(0, 16).toUpperCase();
  return `LW-LIC-${artworkNumber}-${entitlementToken}`;
}

export async function createArtworkCertificatePdf(data: ArtworkCertificateData, assets: ArtworkCertificateAssets) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Certificato ${data.artworkCode} - ${data.holderName}`);
  pdf.setAuthor("GiWise Studio - LoreWise Universe");
  pdf.setSubject("Certificato digitale nominativo di licenza personale");
  pdf.setCreator("LoreWise Universe");
  pdf.setProducer("LoreWise Universe secure certificate service");
  pdf.setCreationDate(new Date());
  pdf.setModificationDate(new Date());

  const page = pdf.addPage(A4_LANDSCAPE);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const serifBold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const logo = await pdf.embedPng(assets.logo);
  const preview = await pdf.embedJpg(assets.artworkPreview);
  const seal = await pdf.embedPng(assets.seal);

  page.drawRectangle({ x: 0, y: 0, width: A4_LANDSCAPE[0], height: A4_LANDSCAPE[1], color: cream });
  page.drawCircle({ x: 716, y: 503, size: 154, color: gold, opacity: 0.28 });
  page.drawCircle({ x: 105, y: 2, size: 132, color: rose, opacity: 0.7 });
  page.drawRectangle({ x: 20, y: 20, width: 802, height: 555, borderColor: violet, borderWidth: 3.2 });
  page.drawRectangle({ x: 29, y: 29, width: 784, height: 537, borderColor: magenta, borderWidth: 0.9 });

  drawContained(page, logo, 638, 470, 158, 92);
  page.drawText("CERTIFICATO DIGITALE NOMINATIVO", { x: 59, y: 522, size: 10, font: bold, color: magenta });
  const editionLabel = safePdfText(data.editionLabel);
  page.drawText(editionLabel, { x: 59, y: 476, size: fitText(serifBold, editionLabel, 520, 36, 20), font: serifBold, color: navy });
  const title = safePdfText(data.artworkTitle);
  page.drawText(title, { x: 59, y: 436, size: fitText(serifBold, title, 520, 34, 19), font: serifBold, color: navy });
  page.drawText("GiWise Studio certifica questa copia digitale e la licenza personale associata.", { x: 59, y: 400, size: 12.5, font: regular, color: plum });

  page.drawRectangle({ x: 58, y: 93, width: 235, height: 285, color: rgb(1, 1, 1), borderColor: rgb(1, 1, 1), borderWidth: 4 });
  drawContained(page, preview, 63, 98, 225, 275);

  drawRow(page, { regular, bold }, "Opera", data.artworkCode, 349);
  drawRow(page, { regular, bold }, "Anno", data.artworkYear, 311);
  drawRow(page, { regular, bold }, "Intestatario", data.holderName, 273);
  drawRow(page, { regular, bold }, "LoreWise ID", data.holderEmail, 235);
  drawRow(page, { regular, bold }, "Licenza", data.licenseId, 197);
  drawRow(page, { regular, bold }, "Ordine", data.orderReference, 159);

  page.drawText(`Emesso il ${safePdfText(data.issuedAt)}. Licenza personale, non esclusiva e non trasferibile.`, { x: 354, y: 119, size: 8.7, font: regular, color: plum });
  page.drawText("Diritto d'autore e proprieta intellettuale restano a GiWise Studio.", { x: 354, y: 105, size: 8.7, font: regular, color: plum });
  page.drawText("La validita e collegata all'ordine e al LoreWise ID indicati nel documento.", { x: 354, y: 91, size: 8.7, font: regular, color: plum });

  page.drawImage(seal, { x: 691, y: 38, width: 111, height: 111, rotate: degrees(-7) });
  page.drawText("DOCUMENTO PERSONALE", { x: 59, y: 58, size: 7.5, font: bold, color: magenta });
  page.drawText("Verifica: lorewise.archive@gmail.com", { x: 59, y: 43, size: 7.5, font: regular, color: plum });

  return pdf.save({ useObjectStreams: true, addDefaultPage: false });
}
