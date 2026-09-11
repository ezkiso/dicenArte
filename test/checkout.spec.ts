import { test, expect } from "@playwright/test";

const PRODUCTO_SLUG = process.env.TEST_PRODUCT_SLUG ?? "tu-slug-con-stock";

async function addProductAndGoToCheckout(page: import("@playwright/test").Page) {
  await page.goto(`/tienda/${PRODUCTO_SLUG}`);
  await page.getByRole("button", { name: /agregar al carrito/i }).click();
  await page.goto("/checkout");
}

test.describe("Checkout — avisos legales y validación (RF-07, RF-08, RF-12)", () => {
  test("3.1 - Aviso de derecho a retracto es visible", async ({ page }) => {
    await addProductAndGoToCheckout(page);
    await expect(page.locator("strong").filter({ hasText: /derecho a retracto/i })).toBeVisible();
    await expect(page.getByText(/10 días/i)).toBeVisible();
  });

  test("3.2 - Garantía legal y T&C visibles", async ({ page }) => {
    await addProductAndGoToCheckout(page);
    await expect(page.locator("strong").filter({ hasText: /garantía legal/i })).toBeVisible();
    await expect(page.getByText(/6 meses/i)).toBeVisible();
  });

  test("3.3 - No se puede continuar sin marcar los checkboxes obligatorios", async ({ page }) => {
    await addProductAndGoToCheckout(page);

    // Completa datos de envío pero deja los checkboxes sin marcar.
    await page.getByLabel(/nombre/i).first().fill("Cliente de Prueba");
    await page.getByLabel(/correo|email/i).first().fill("prueba@example.com");

    const submitButton = page.getByRole("button", { name: /pagar|continuar|finalizar compra/i });
    await submitButton.click();

    // El formulario no debe redirigir a Webpay: debe seguir en /checkout
    // mostrando algún error de validación.
    await expect(page).toHaveURL(/\/checkout/);
  });

  test("3.6 - Campos de envío vacíos bloquean el envío", async ({ page }) => {
    await addProductAndGoToCheckout(page);

    const submitButton = page.getByRole("button", { name: /pagar|continuar|finalizar compra/i });
    await submitButton.click();

    await expect(page).toHaveURL(/\/checkout/);
  });

  test("3.7 - Correo mal formado es rechazado", async ({ page }) => {
    await addProductAndGoToCheckout(page);

    const emailField = page.getByLabel(/correo|email/i).first();
    await emailField.fill("esto-no-es-un-correo");
    await emailField.blur();

    const validationMessage = await emailField.evaluate(
      (el: HTMLInputElement) => el.validationMessage
    );
    expect(validationMessage.length).toBeGreaterThan(0);
  });
});
