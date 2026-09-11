import { test, expect } from "@playwright/test";

test.describe("Home y catálogo (RF-03, RF-04, RF-05)", () => {
  test("1.1 - Home muestra vitrina, logo y footer", async ({ page }) => {
    await page.goto("/");

    // Ajusta estos selectores si tu Header/Footer usan data-testid distinto.
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator("footer")).toBeVisible();
    await expect(page.getByRole("link", { name: /whatsapp/i })).toBeVisible();
  });

  test("1.2 - Se puede navegar a la tienda", async ({ page }) => {
    await page.goto("/");

    if (await page.getByRole("button", { name: /abrir menú|abrir menu/i }).count()) {
      await page.getByRole("button", { name: /abrir menú|abrir menu/i }).click();
    }

    await page.getByRole("link", { name: /tienda/i }).first().click();
    await expect(page).toHaveURL(/\/tienda/);
  });

  test("1.3 - Menú hamburguesa funciona en móvil", async ({ page, isMobile }) => {
    test.skip(!isMobile, "Solo aplica al proyecto mobile-chrome");
    await page.goto("/");
    const menuButton = page.getByRole("button", { name: /menú|menu/i });
    await expect(menuButton).toBeVisible();
    await menuButton.click();
    await expect(page.getByRole("navigation")).toBeVisible();
  });

  test("1.7 - Ninguna imagen de producto está rota (sin bloqueo de CSP)", async ({ page }) => {
    const cspViolations: string[] = [];
    page.on("console", (msg) => {
      if (msg.text().toLowerCase().includes("content security policy")) {
        cspViolations.push(msg.text());
      }
    });

    await page.goto("/tienda");
    await page.waitForLoadState("networkidle");

    const images = page.locator("img");
    const count = await images.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const naturalWidth = await images.nth(i).evaluate(
        (img: HTMLImageElement) => img.naturalWidth
      );
      expect(naturalWidth, `Imagen #${i} está rota (naturalWidth = 0)`).toBeGreaterThan(0);
    }

    expect(cspViolations, `Violaciones de CSP detectadas:\n${cspViolations.join("\n")}`).toHaveLength(0);
  });
});

test.describe("Producto agotado (RF-05)", () => {
  // Este test asume que existe un producto de prueba con slug conocido
  // y stock = 0. Reemplaza AGOTADO_SLUG por el slug real que dejaste en 0.
  const AGOTADO_SLUG = process.env.TEST_AGOTADO_SLUG ?? "tu-slug-agotado";

  test("1.4 y 1.5 - Producto agotado se muestra con etiqueta y botón bloqueado", async ({ page }) => {
    await page.goto(`/tienda/${AGOTADO_SLUG}`);

    const agotadoLabel = page.locator("span").filter({ hasText: /^Agotado$/i });
    await expect(agotadoLabel).toBeVisible();

    const addButton = page.getByRole("button", { name: /agregar al carrito/i });
    // El botón agotado dice "Agotado", no "Agregar al carrito" — si existe,
    // debe estar deshabilitado.
    const agotadoButton = page.getByRole("button", { name: /^agotado$/i });
    await expect(agotadoButton).toBeVisible();
    await expect(agotadoButton).toBeDisabled();
    await expect(addButton).toHaveCount(0);
  });
});
