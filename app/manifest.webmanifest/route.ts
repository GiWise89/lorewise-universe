export function GET() {
  return Response.json({
    name: "LoreWise Universe",
    short_name: "LoreWise",
    description: "Arte, giochi, personaggi e mondi di GiWise Studio.",
    lang: "it-IT",
    start_url: "/",
    display: "standalone",
    background_color: "#fff8ef",
    theme_color: "#db2777",
    icons: [{ src: "/brand/admin-control-favicon-v1.webp", sizes: "1254x1254", type: "image/webp", purpose: "any" }],
  }, { headers: { "Cache-Control": "public, max-age=86400" } });
}
