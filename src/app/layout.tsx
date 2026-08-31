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
    default: "Dicen Arte | Cojines y bolsas personalizados en Chile",
    template: "%s | Dicen Arte",
  },
  description:
    "Dicen Arte crea cojines personalizados y bolsas de género personalizadas en Chile con estampados a pedido, regalos con fotos y envío nacional.",
  keywords: [
    "cojines personalizados Chile",
    "bolsas personalizadas Chile",
    "regalos con fotos Santiago",
    "estampados a pedido",
    "cojines estampados 40x40",
    "regalos personalizados Chile",
    "bolsas de género personalizadas",
  ],
  applicationName: "Dicen Arte",
  authors: [{ name: "Dicen Arte" }],
  creator: "Dicen Arte",
  publisher: "Dicen Arte",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Dicen Arte | Cojines y bolsas personalizados en Chile",
    description:
      "Productos textiles personalizados con fotografías del cliente, diseñados a pedido y entregados en todo Chile.",
    url: siteUrl,
    siteName: "Dicen Arte",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Dicen Arte" }],
    locale: "es_CL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dicen Arte | Cojines y bolsas personalizados",
    description:
      "Cojines y bolsas personalizadas en Chile con estampados a pedido y regalos con fotos.",
    images: ["/og-image.png"],
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