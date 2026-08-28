import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Providers from "@/components/Providers";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import WhatsAppButton from "@/components/WhatsAppButton";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "DicenArte — Arte y accesorios personalizados para mascotas",
    template: "%s | DicenArte",
  },
  description:
    "Arneses, cuadros decorativos y accesorios personalizados para tu mascota, hechos a medida.",
  openGraph: {
    title: "DicenArte",
    description: "Arte y accesorios personalizados para mascotas.",
    url: siteUrl,
    siteName: "DicenArte",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "es_CL",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CL">
      <body className="flex min-h-screen flex-col">
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <CookieConsentBanner />
          <WhatsAppButton />
        </Providers>
      </body>
    </html>
  );
}