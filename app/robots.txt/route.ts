export function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const publicationApproved = process.env.LOREWISE_PUBLICATION_APPROVED?.trim().toLowerCase() === "true";
  const body = publicationApproved
    ? [
        "User-agent: *",
        "Allow: /",
        "Disallow: /account",
        "Disallow: /gestione-",
        "Disallow: /api/",
        "Disallow: /auth/",
        `Sitemap: ${origin}/sitemap.xml`,
        "",
      ].join("\n")
    : ["User-agent: *", "Disallow: /", ""].join("\n");
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
