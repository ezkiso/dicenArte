import type { Config } from "tailwindcss";

// RNF-11: paleta estricta blanco / negro / gris. No se agregan otros colores.
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        base: {
          white: "#FFFFFF",
          black: "#0A0A0A",
          gray: {
            50: "#FAFAFA",
            100: "#F2F2F2",
            200: "#E4E4E4",
            300: "#CFCFCF",
            400: "#9E9E9E",
            500: "#707070",
            600: "#4A4A4A",
            700: "#2E2E2E",
            800: "#1A1A1A",
          },
        },
      },
      fontFamily: {
        sans: ["var(--font-google-sans)", "sans-serif"],
        display: ["var(--font-google-sans)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
