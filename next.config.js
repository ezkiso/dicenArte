/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== "production";

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ""} https://webpay3g.transbank.cl https://webpay3gint.transbank.cl https://www.googletagmanager.com https://maps.googleapis.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https://*.r2.cloudflarestorage.com https://*.amazonaws.com https://*.s3.amazonaws.com https://maps.googleapis.com https://maps.gstatic.com;
  connect-src 'self' https://webpay3g.transbank.cl https://webpay3gint.transbank.cl https://www.google-analytics.com https://maps.googleapis.com;
  frame-src 'self' https://webpay3g.transbank.cl https://webpay3gint.transbank.cl;
  font-src 'self' https://fonts.gstatic.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self' https://webpay3g.transbank.cl https://webpay3gint.transbank.cl;
  frame-ancestors 'none';
  upgrade-insecure-requests;
`;

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
      { protocol: "https", hostname: "*.amazonaws.com" },
      { protocol: "https", hostname: "*.s3.amazonaws.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspHeader.replace(/\n/g, ""),
          },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;