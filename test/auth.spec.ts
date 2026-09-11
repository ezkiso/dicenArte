import { test, expect } from "@playwright/test";

// Credenciales de una cuenta admin de PRUEBA en tu base de desarrollo.
// Nunca pongas aquí las credenciales reales de la clienta.
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL ?? "";
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD ?? "";

test.describe("Protección de /admin (RF-02, RF-18)", () => {
  test("5.1 - Sin sesión, /admin redirige a /login", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/);
  });

  test("5.8 - No existen rutas de registro público", async ({ page }) => {
    for (const path of ["/register", "/signup"]) {
      const response = await page.goto(path, { waitUntil: "domcontentloaded" });
      expect(response?.status(), `${path} no debería existir`).toBe(404);
    }

    // Auth.js captura /api/auth/* mediante su ruta catch-all y rechaza
    // acciones desconocidas con 400; no existe un endpoint de registro.
    const registerApiResponse = await page.goto("/api/auth/register", {
      waitUntil: "domcontentloaded",
    });
    expect(registerApiResponse?.status(), "/api/auth/register no debe permitir registro").toBe(
      400
    );
  });
});

test.describe("Login (RF-01, RF-17)", () => {
  test("5.3 - Contraseña incorrecta muestra error genérico", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/correo|email/i).fill("no-existe@dicenarte.cl");
    await page.getByLabel(/contraseña|password/i).fill("contraseña-incorrecta");
    await page.getByRole("button", { name: /iniciar sesión|entrar|login/i }).click();

    await expect(page.getByText(/incorrect|inválid|error/i)).toBeVisible();
    // No debe revelar si el correo existe o no en el sistema.
    await expect(page.getByText(/no existe una cuenta|usuario no encontrado/i)).toHaveCount(0);
  });

  test.skip(
    !ADMIN_EMAIL || !ADMIN_PASSWORD,
    "Configura TEST_ADMIN_EMAIL/TEST_ADMIN_PASSWORD para correr este test"
  );
  test("5.2 - Login con credenciales correctas entra al panel", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/correo|email/i).fill(ADMIN_EMAIL);
    await page.getByLabel(/contraseña|password/i).fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: /iniciar sesión|entrar|login/i }).click();

    await page.waitForURL(/\/admin/);
    await expect(page).toHaveURL(/\/admin/);
  });

  test.skip(
    !ADMIN_EMAIL || !ADMIN_PASSWORD,
    "Configura TEST_ADMIN_EMAIL/TEST_ADMIN_PASSWORD para correr este test"
  );
  test("5.5 - Cookie de sesión tiene flags de seguridad", async ({ page, context }) => {
    await page.goto("/login");
    await page.getByLabel(/correo|email/i).fill(ADMIN_EMAIL);
    await page.getByLabel(/contraseña|password/i).fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: /iniciar sesión|entrar|login/i }).click();
    await page.waitForURL(/\/admin/);

    const cookies = await context.cookies();
    const sessionCookie = cookies.find((c) => c.name.includes("session-token"));
    expect(sessionCookie, "No se encontró la cookie de sesión de next-auth").toBeTruthy();
    expect(sessionCookie?.httpOnly).toBe(true);
    expect(sessionCookie?.sameSite).toBe("Strict");
  });
});

test.describe("Set-password (flujo de invitación de admin)", () => {
  test("6.3 - Token inválido es rechazado", async ({ page }, testInfo) => {
    await page.setExtraHTTPHeaders({
      "x-forwarded-for": `test-${testInfo.testId}-${Date.now()}`,
    });
    await page.goto("/set-password?token=token-completamente-inventado-123");
    await page.getByLabel(/nueva contraseña/i).fill("ContraseñaValida123");
    await page.getByLabel(/confirmar contraseña/i).fill("ContraseñaValida123");
    await page.getByRole("button", { name: /crear contraseña/i }).click();

    await expect(page.getByText(/inválido|expirado|error/i)).toBeVisible();
  });

  test("Sin token en la URL muestra mensaje de link inválido", async ({ page }) => {
    await page.goto("/set-password");
    await expect(page.getByText(/no es válido|inválido/i)).toBeVisible();
  });
});
