import { test, expect } from "@playwright/test";

test.describe("Headers de seguridad (RNF-02)", () => {
  test("8.1 - Headers de seguridad presentes en la Home", async ({ page }) => {
    const response = await page.goto("/");
    const headers = response?.headers() ?? {};

    expect(headers["content-security-policy"]).toBeTruthy();
    expect(headers["x-frame-options"]).toBeTruthy();
    expect(headers["strict-transport-security"]).toBeTruthy();
  });

  test("8.2 - frame-ancestors bloquea ser embebido", async ({ page }) => {
    const response = await page.goto("/");
    const csp = response?.headers()["content-security-policy"] ?? "";
    expect(csp).toContain("frame-ancestors");
  });
});

test.describe("Rate limiting (RNF-06)", () => {
  // Estos tests golpean el endpoint real repetidas veces — no los corras
  // seguidos uno tras otro sin esperar, o vas a seguir bloqueado por el
  // límite del test anterior. Usa siempre la base de desarrollo.

  test("8.4 - set-password se bloquea tras exceder el límite por hora", async ({ request }) => {
    let lastStatus = 0;

    for (let i = 0; i < 11; i++) {
      const response = await request.post("/api/set-password", {
        data: { token: `token-invalido-${i}`, password: "ContraseñaValida123" },
      });
      lastStatus = response.status();
      if (lastStatus === 429) break;
    }

    expect(lastStatus).toBe(429);
  });

  test("8.3 - checkout se bloquea tras exceder el límite por 10 minutos", async ({ request }) => {
    let lastStatus = 0;

    for (let i = 0; i < 11; i++) {
      const response = await request.post("/api/checkout", {
        data: {}, // payload vacío a propósito: solo nos interesa si pasa el rate limit
      });
      lastStatus = response.status();
      if (lastStatus === 429) break;
    }

    expect(lastStatus).toBe(429);
  });
});

test.describe("Rutas de API protegidas", () => {
  test("8.7 - Borrar producto sin sesión es rechazado", async ({ request }) => {
    const response = await request.delete("/api/products/id-cualquiera");
    expect([401, 403]).toContain(response.status());
  });

  test("Cambiar el estado de un pedido sin sesión es rechazado", async ({ request }) => {
    const response = await request.patch("/api/admin/orders/id-cualquiera/status", {
      data: { status: "EN_PREPARACION" },
    });
    expect(response.status()).toBe(403);
  });
});

test.describe("SEO (RNF-10)", () => {
  test("9.1 - Sitemap accesible y con el dominio correcto", async ({ request, baseURL }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.ok()).toBeTruthy();

    const body = await response.text();
    if (baseURL && !baseURL.includes("localhost")) {
      const domain = new URL(baseURL).hostname;
      expect(body).toContain(domain);
    }
  });

  test("9.2 - Robots.txt bloquea /admin y /api", async ({ request }) => {
    const response = await request.get("/robots.txt");
    expect(response.ok()).toBeTruthy();

    const body = await response.text();
    expect(body).toMatch(/disallow:\s*\/admin/i);
    expect(body).toMatch(/disallow:\s*\/api/i);
    expect(body).toMatch(/sitemap/i);
  });
});
