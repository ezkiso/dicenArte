import { defineConfig, devices } from "@playwright/test";

// Apunta por defecto a tu entorno local (npm run dev).
// Para correr contra la base de desarrollo desplegada, exporta
// BASE_URL antes de correr los tests:
//   BASE_URL=https://dev.dicenarte.cl npx playwright test
// NUNCA apuntes estos tests a producción real (www.dicenarte.cl) —
// crean órdenes, agotan stock y disparan el rate limiting de verdad.
const baseURL = process.env.BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./test",
  fullyParallel: false, // el rate limiting comparte estado entre tests
  retries: 0,
  workers: 1,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 7"], channel: "chrome" },
    },
  ],
});
