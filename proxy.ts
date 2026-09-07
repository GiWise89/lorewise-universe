import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { getSupabasePublicConfig } from "@/lib/supabase/config";

function requestHostname(request: NextRequest) {
  const rawHost = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? request.nextUrl.host).toLowerCase();
  return rawHost.startsWith("[") ? rawHost.slice(0, rawHost.indexOf("]") + 1) : rawHost.split(":")[0];
}

function isLocalPreviewHostname(hostname: string) {
  return hostname === "localhost"
    || hostname === "127.0.0.1"
    || hostname === "[::1]"
    || /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)
    || /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)
    || /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(hostname);
}

function applySecurityHeaders(response: NextResponse, request: NextRequest) {
  const isDevelopment = process.env.NODE_ENV === "development";
  const isHttpLocalPreview = request.nextUrl.protocol === "http:" && isLocalPreviewHostname(requestHostname(request));
  const scriptPolicy = process.env.NODE_ENV === "development"
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self' 'unsafe-inline'";
  const policy = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self' https://checkout.stripe.com",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    scriptPolicy,
    "script-src-attr 'none'",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com",
    "frame-src https://js.stripe.com https://hooks.stripe.com",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "media-src 'self' blob:",
    ...(isDevelopment || isHttpLocalPreview ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
  response.headers.set("Content-Security-Policy", policy);
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(self)");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  response.headers.set("Origin-Agent-Cluster", "?1");
  response.headers.set("X-Permitted-Cross-Domain-Policies", "none");
  if (["/account", "/admin", "/gestione-", "/notifiche", "/api/account", "/api/admin"].some((prefix) => request.nextUrl.pathname.startsWith(prefix))) {
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
  }
  if (request.nextUrl.protocol === "https:") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  return response;
}

export async function proxy(request: NextRequest) {
  const config = getSupabasePublicConfig();
  const authRoute = ["/account", "/auth", "/admin", "/gestione-", "/api/account", "/api/admin"].some((prefix) => request.nextUrl.pathname.startsWith(prefix));
  if (!config || !authRoute) return applySecurityHeaders(NextResponse.next({ request }), request);
  let response = NextResponse.next({ request });
  const client = createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  await client.auth.getClaims();
  return applySecurityHeaders(response, request);
}

export const config = { matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"] };
