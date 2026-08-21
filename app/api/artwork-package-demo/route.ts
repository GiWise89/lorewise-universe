import { catalogArtworks } from "@/lib/artCatalog";

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code") ?? "";
  const artwork = catalogArtworks.find((item) => item.code === code);
  if (!artwork || artwork.access !== "commercial-original" || !artwork.priceLabel) {
    return Response.json({ error: "Pacchetto non disponibile." }, { status: 404 });
  }
  const contents = [
    "LOREWISE UNIVERSE · PACCHETTO DIMOSTRATIVO",
    "============================================",
    "",
    `Opera: ${artwork.title}`,
    `Codice: ${artwork.code}`,
    `Edizione: ${artwork.priceTierLabel}`,
    `Prezzo indicativo: ${artwork.priceLabel}`,
    `Risoluzione dichiarata: ${artwork.nativeResolution}`,
    "",
    "CONSEGNA REALE DOPO IL PAGAMENTO VERIFICATO",
    "- Opera digitale in PNG appiattito senza filigrana",
    "- Profilo colore sRGB",
    "- Certificato digitale nominativo",
    "- Licenza personale non trasferibile",
    "- Collegamento privato con massimo 3 download",
    "",
    "QUESTO FILE È SOLO UNA SIMULAZIONE.",
    "Non contiene l'opera originale e non attribuisce alcuna licenza.",
    "© GiWise Studio · LoreWise Universe",
  ].join("\r\n");
  const filename = `LoreWise-${artwork.code}-pacchetto-dimostrativo.txt`;
  return new Response(contents, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
