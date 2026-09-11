# Tests automatizados con Playwright — DicenArte

## Instalación (una sola vez)

Copia la carpeta `test/` y el archivo `playwright.config.ts` a la raíz de tu
proyecto (`dicenarte-web/`), luego:

```bash
npm install -D @playwright/test
npx playwright install
```

El segundo comando descarga los navegadores que Playwright controla
(Chromium, y los que uses) — es aparte de tu Chrome normal.

## Antes de correr los tests

1. **Apunta tu `.env.local` a la base de DESARROLLO** (nunca a producción) —
   estos tests crean carritos, intentan checkouts y disparan el rate
   limiting a propósito.
2. Levanta el servidor en otra terminal: `npm run dev`
3. Deja al menos un producto de prueba con stock > 0 y anota su slug.
4. Deja (o crea) un producto de prueba con stock = 0 y anota su slug.
5. Exporta las variables que los tests usan (PowerShell):
   ```powershell
   $env:TEST_PRODUCT_SLUG="tu-slug-con-stock"
   $env:TEST_AGOTADO_SLUG="tu-slug-agotado"
   $env:TEST_ADMIN_EMAIL="admin.test@dicenarte.local"
   $env:TEST_ADMIN_PASSWORD="AdminTest12345!
   ```
   (en Mac/Linux sería `export TEST_PRODUCT_SLUG=...`)

## Correrlos

```bash
npx playwright test
```

Para ver un reporte visual con capturas de los fallos:
```bash
cccccc```

Para correr solo un archivo:
```bash
npx playwright test test/catalog.spec.ts
```

Para verlos correr en un navegador real (útil para depurar):
```bash
npx playwright test --headed
```

## Agrégalo a package.json

```json
"scripts": {
  "test:e2e": "playwright test"
}
```

## Qué SÍ cubren estos tests

- Home, catálogo, producto agotado (Sección 1 del plan de pruebas)
- Carrito: agregar, eliminar, persistencia (Sección 2)
- Checkout: avisos legales visibles, validaciones de formulario (Sección 3)
- Login, protección de `/admin`, cookies de sesión (Sección 5)
- Flujo de `set-password`: tokens inválidos, sin token (Sección 6, parcial)
- Headers de seguridad, CSP, rate limiting de `checkout` y `set-password`
  (Sección 8, parcial)
- Sitemap y robots.txt (Sección 9)

## Qué NO está cubierto aquí (queda manual, a propósito)

- **Pago real con Webpay** (Sección 4 completa): automatizar esto implicaría
  simular la redirección a la página de Transbank y rellenar campos de
  tarjeta en un dominio ajeno que puede cambiar su diseño sin avisar. Se
  puede hacer con Playwright, pero es frágil y de bajo retorno para un
  proyecto de este tamaño — sigue probándolo a mano con las tarjetas de
  prueba de Transbank, siguiendo la Sección 4 del plan de pruebas.
- **Subida de archivo malicioso disfrazado** (7.6): requiere generar un
  binario de prueba y no aporta tanto automatizado como verlo fallar en
  vivo una vez.
- **Revisión en dispositivos físicos reales** (10.3): un emulador nunca
  reemplaza probar en un iPhone/Android de verdad.
- **Auditoría de Lighthouse** (10.1): se corre aparte, no vive bien dentro
  de un test de Playwright — hazla desde Chrome DevTools directamente.
- **El envío real de invitación a la clienta** (6.8): es un paso que se
  hace una sola vez, no tiene sentido automatizarlo.

## Notas sobre selectores

Estos tests usan principalmente `getByRole` y `getByText` con expresiones
flexibles (`/agregar al carrito/i`) en vez de clases CSS, para que sobrevivan
cambios de estilo. Si algún selector no encuentra el elemento (por ejemplo
porque tu formulario de checkout usa un texto distinto al que asumí), el
test va a fallar con un mensaje claro señalando qué buscaba — ajusta el
texto o agrega un `data-testid` al componente real y usa
`page.getByTestId(...)` en su lugar, que es más robusto a largo plazo.
