"use client";

import CookieConsent, { getCookieConsentValue, Cookies } from "react-cookie-consent";
import { useEffect, useState } from "react";
import Script from "next/script";

const CONSENT_COOKIE_NAME = "dicenarte-cookie-consent";

// RF-14: bloquea Google Analytics (y cualquier rastreador) hasta que el
// usuario dé consentimiento expreso. La librería persiste la elección en una
// cookie propia; el script de GA solo se inyecta si `granted === true`.
export default function CookieConsentBanner() {
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    setGranted(getCookieConsentValue(CONSENT_COOKIE_NAME) === "true");
  }, []);

  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <>
      {granted && gaId && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}', { anonymize_ip: true });
            `}
          </Script>
        </>
      )}

      <CookieConsent
        location="bottom"
        cookieName={CONSENT_COOKIE_NAME}
        buttonText="Aceptar"
        declineButtonText="Rechazar"
        enableDeclineButton
        onAccept={() => {
          Cookies.set(CONSENT_COOKIE_NAME, "true");
          setGranted(true);
        }}
        onDecline={() => setGranted(false)}
        style={{ background: "#0A0A0A", color: "#FFFFFF", alignItems: "center" }}
        buttonStyle={{ background: "#FFFFFF", color: "#0A0A0A", borderRadius: 0, fontWeight: 600 }}
        declineButtonStyle={{
          background: "transparent",
          color: "#FFFFFF",
          border: "1px solid #FFFFFF",
          borderRadius: 0,
        }}
        expires={180}
      >
        Usamos cookies propias y de terceros (como Google Analytics) para mejorar tu
        experiencia. Puedes aceptarlas o rechazarlas; los rastreadores solo se activan si
        aceptas.{" "}
        <a href="/legal" className="underline">
          Más información
        </a>
        .
      </CookieConsent>
    </>
  );
}
