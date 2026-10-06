import type { Metadata, Viewport } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Providers from "@/components/Providers";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import WhatsAppButton from "@/components/WhatsAppButton";
import { Analytics } from "@vercel/analytics/next"
import localFont from "next/font/local";

const googleSansFlex = localFont({
  src: "../../public/fonts/google-sans-flex-latin.woff2",
  variable: "--font-google-sans",
  display: "swap",
  weight: "100 1000",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://dicenarte.cl";
const brandTitle = "Dicen Arte | Arte Personalizado y servicios para mascotas";
const brandDescription =
  "Cuadros de mascotas personalizados y servicios para mascotas: Cat-Sister, hospedaje de mascotas y paseo de mascotas.";
const seoKeywords = [
  "cuadros de mascotas personalizados",
  "arte personalizado para mascotas",
  "servicios para mascotas",
  "Cat-Sister",
  "hospedaje de mascotas",
  "paseo de mascotas",
  "Dicen Arte",
];

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: brandTitle,
    template: "%s | Dicen Arte",
  },
  description: brandDescription,
  keywords: seoKeywords,
  applicationName: "Dicen Arte",
  authors: [{ name: "Dicen Arte" }],
  creator: "Dicen Arte",
  publisher: "Dicen Arte",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: brandTitle,
    description: brandDescription,
    url: siteUrl,
    siteName: "Dicen Arte",
    images: [{ url: "/og-image.jpeg", width: 1200, height: 630, alt: "Dicen Arte" }],
    locale: "es_CL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: brandTitle,
    description: brandDescription,
    images: ["/og-image.jpeg"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CL">
      <body className={`${googleSansFlex.variable} flex min-h-screen flex-col`}>
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