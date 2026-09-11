import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  loginRateLimit,
  setPasswordRateLimit,
  checkoutRateLimit,
} from "@/lib/rateLimit";

function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // RF-02 / RF-18: solo usuarios con rol ADMIN pueden acceder al panel /admin.
  if (pathname.startsWith("/admin")) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  }

  const ip = getClientIp(req);

  // RNF-06: límite de intentos de login (fuerza bruta de contraseñas).
  if (pathname === "/api/auth/callback/credentials" && req.method === "POST") {
    const { success } = await loginRateLimit.limit(ip);
    if (!success) {
      return NextResponse.json(
        { error: "Demasiados intentos. Intenta de nuevo en unos minutos." },
        { status: 429 }
      );
    }
  }

  // RNF-06: límite de intentos en set-password.
  if (pathname === "/api/set-password" && req.method === "POST") {
    const { success } = await setPasswordRateLimit.limit(ip);
    if (!success) {
      return NextResponse.json(
        { error: "Demasiados intentos. Intenta de nuevo más tarde." },
        { status: 429 }
      );
    }
  }

  // RNF-06: límite de órdenes de checkout (protege el stock reservado).
  if (pathname === "/api/checkout" && req.method === "POST") {
    const { success } = await checkoutRateLimit.limit(ip);
    if (!success) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intenta de nuevo en unos minutos." },
        { status: 429 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/auth/callback/credentials",
    "/api/set-password",
    "/api/checkout",
  ],
};