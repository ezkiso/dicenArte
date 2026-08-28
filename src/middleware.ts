import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// RF-02 / RF-18: solo usuarios con rol ADMIN pueden acceder al panel /admin.
export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    if (req.nextUrl.pathname.startsWith("/admin") && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/admin/:path*"],
};
