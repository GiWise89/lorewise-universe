import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import * as mupdf from "mupdf";
import { createArtworkCertificatePdf } from "../lib/artworkCertificate.ts";

const root = resolve(import.meta.dirname, "..");
const output = resolve(root, "output", "pdf", "LW-ART-003-certificato-esempio.pdf");
const previewOutput = resolve(root, "tmp", "pdfs", "LW-ART-003-certificato-esempio-page-1.png");
await mkdir(resolve(root, "output", "pdf"), { recursive: true });
await mkdir(resolve(root, "tmp", "pdfs"), { recursive: true });

const [logo, artworkPreview, seal] = await Promise.all([
  readFile(resolve(root, "public", "brand", "lorewise-universe-logo-concept-c.png")),
  readFile(resolve(root, "public", "artworks", "previews", "lw-art-003-preview.jpg")),
  readFile(resolve(root, "public", "brand", "lorewise-wax-seal-v1.png")),
]);

const pdf = await createArtworkCertificatePdf({
  artworkCode: "LW-ART-003",
  artworkTitle: "Legami Infernali",
  artworkYear: "2025",
  editionLabel: "Edizione Premium",
  holderName: "Mario Rossi",
  holderEmail: "mario.rossi@example.invalid",
  licenseId: "LW-LIC-003-0123456789ABCDEF",
  orderReference: "LW-2026-000123",
  issuedAt: "18/08/2026",
}, { logo, artworkPreview, seal });

await writeFile(output, pdf);
const document = mupdf.Document.openDocument(pdf, "application/pdf");
if (document.countPages() !== 1) throw new Error("Il certificato deve contenere esattamente una pagina.");
const page = document.loadPage(0);
const pixmap = page.toPixmap(mupdf.Matrix.scale(144 / 72, 144 / 72), mupdf.ColorSpace.DeviceRGB, false, true);
await writeFile(previewOutput, pixmap.asPNG());
console.log(JSON.stringify({ pdf: output, preview: previewOutput, pages: document.countPages() }, null, 2));
