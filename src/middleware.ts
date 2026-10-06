import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  loginRateLimit,
  setPasswordRateLimit,
  checkoutRateLimit,
  shippingQuoteRateLimit,
} from "@/lib/rateLimit";

function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

function createCsp(nonce: string) {
  const isDev = process.env.NODE_ENV !== "production";
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${isDev ? "'unsafe-eval' " : ""}https://webpay3g.transbank.cl https://webpay3gint.transbank.cl https://www.googletagmanager.com https://maps.googleapis.com`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.r2.cloudflarestorage.com https://*.amazonaws.com https://*.s3.amazonaws.com https://maps.googleapis.com https://maps.gstatic.com",
    "connect-src 'self' https://webpay3g.transbank.cl https://webpay3gint.transbank.cl https://www.google-analytics.com https://maps.googleapis.com",
    "frame-src 'self' https://webpay3g.transbank.cl https://webpay3gint.transbank.cl",
    "font-src 'self' https://fonts.gstatic.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://webpay3g.transbank.cl https://webpay3gint.transbank.cl",
    "frame-ancestors 'none'",
    ...(!isDev ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const nonceBytes = crypto.getRandomValues(new Uint8Array(16));
  const nonce = btoa(String.fromCharCode(...nonceBytes));
  const csp = createCsp(nonce);
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  function withCsp(response: NextResponse) {
    response.headers.set("Content-Security-Policy", csp);
    return response;
  }

  // RF-02 / RF-18: solo usuarios con rol ADMIN pueden acceder al panel /admin.
  if (pathname.startsWith("/admin")) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || token.role !== "ADMIN") {
      return withCsp(NextResponse.redirect(new URL("/login", req.url)));
    }
    return withCsp(NextResponse.next({ request: { headers: requestHeaders } }));
  }

  const ip = getClientIp(req);

  // RNF-06: límite de intentos de login (fuerza bruta de contraseñas).
  if (pathname === "/api/auth/callback/credentials" && req.method === "POST") {
    const { success } = await loginRateLimit.limit(ip);
    if (!success) {
      return withCsp(NextResponse.json(
        { error: "Demasiados intentos. Intenta de nuevo en unos minutos." },
        { status: 429 }
      ));
    }
  }

  // RNF-06: límite de intentos en set-password.
  if (pathname === "/api/set-password" && req.method === "POST") {
    const { success } = await setPasswordRateLimit.limit(ip);
    if (!success) {
      return withCsp(NextResponse.json(
        { error: "Demasiados intentos. Intenta de nuevo más tarde." },
        { status: 429 }
      ));
    }
  }

  // RNF-06: límite de órdenes de checkout (protege el stock reservado).
  if (pathname === "/api/checkout" && req.method === "POST") {
    const { success } = await checkoutRateLimit.limit(ip);
    if (!success) {
      return withCsp(NextResponse.json(
        { error: "Demasiadas solicitudes. Intenta de nuevo en unos minutos." },
        { status: 429 }
      ));
    }
  }

  if (pathname === "/api/shipping/quote" && req.method === "POST") {
    const { success } = await shippingQuoteRateLimit.limit(ip);
    if (!success) {
      return withCsp(NextResponse.json(
        { error: "Demasiadas consultas de despacho. Intenta de nuevo en unos minutos." },
        { status: 429 }
      ));
    }
  }

  return withCsp(NextResponse.next({ request: { headers: requestHeaders } }));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};