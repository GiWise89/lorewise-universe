export function GET(request: Request) {
  const url = new URL(request.url);
  const host = (url.hostname || "").toLowerCase();
  const isProductionHost = host === "lorewisenexus.it" || host === "www.lorewisenexus.it";
  const publicationApproved = process.env.LOREWISE_PUBLICATION_APPROVED?.trim().toLowerCase() === "true";
  const allowIndexing = isProductionHost || publicationApproved;
  const origin = isProductionHost ? "https://lorewisenexus.it" : url.origin;

  const body = allowIndexing
    ? [
        "User-agent: *",
        "Allow: /",
        "Disallow: /account",
        "Disallow: /profilo",
        "Disallow: /notifiche",
        "Disallow: /gestione-",
        "Disallow: /api/",
        "Disallow: /auth/",
        `Sitemap: ${origin}/sitemap.xml`,
        "",
      ].join("\n")
    : ["User-agent: *", "Disallow: /", ""].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
