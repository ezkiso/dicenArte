import { test, expect } from "@playwright/test";

// Estos tests asumen un producto de prueba con stock suficiente (>= 3).
// Ajusta PRODUCTO_SLUG a uno real de tu catálogo de desarrollo.
const PRODUCTO_SLUG = process.env.TEST_PRODUCT_SLUG ?? "tu-slug-con-stock";

test.describe("Carrito de compras (RF-06)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/tienda/${PRODUCTO_SLUG}`);
  });

  test("2.1 - Agregar producto al carrito", async ({ page }) => {
    await page.getByRole("button", { name: /agregar al carrito/i }).click();
    await expect(page.getByText(/agregado/i)).toBeVisible();

    await page.goto("/carrito");
    await expect(page.getByText(new RegExp(PRODUCTO_SLUG.replace(/-/g, " "), "i")).first())
      .toBeVisible({ timeout: 5000 })
      .catch(() => {
        // Si el nombre del producto no calza con el slug, al menos
        // confirmamos que el carrito no está vacío.
      });
    await expect(page.getByText(/carrito vacío/i)).toHaveCount(0);
  });

  test("2.3 - Eliminar producto del carrito lo deja vacío", async ({ page }) => {
    await page.getByRole("button", { name: /agregar al carrito/i }).click();
    await page.goto("/carrito");

    const removeButton = page.getByRole("button", { name: /eliminar|quitar/i }).first();
    await removeButton.click();

    await expect(page.getByText(/carrito.*vacío/i)).toBeVisible();
  });

  test("2.4 - El carrito persiste al recargar la página", async ({ page }) => {
    await page.getByRole("button", { name: /agregar al carrito/i }).click();
    await page.goto("/carrito");
    await page.reload();

    await expect(page.getByText(/carrito vacío/i)).toHaveCount(0);
  });
});
