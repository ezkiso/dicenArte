# DicenArte — Plataforma e-commerce

Tienda online de arte y accesorios personalizados para mascotas. Next.js 14 (App
Router) + TypeScript + Tailwind CSS + Prisma/PostgreSQL + Auth.js + Webpay
(Transbank).

## 1. Requisitos previos

- Node.js 20+
- PostgreSQL 14+ (local, Supabase, Neon, Railway, etc.)
- Cuenta de Transbank (credenciales de integración/sandbox ya vienen en
  `.env.example`; para producción se solicitan al afiliarse a Webpay Plus)
- Un bucket S3 (o compatible: Cloudflare R2, MinIO) para las imágenes de
  productos
- Cuenta con un proveedor autorizado por el SII para boletas electrónicas
  (a integrar en el entregable 2, ver `src/app/api/webpay/commit/route.ts`)

## 2. Levantar el proyecto en desarrollo

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales reales (DB, S3, Webpay, etc.)

# 3. Crear las tablas en la base de datos
npx prisma migrate dev --name init

# 4. Cargar datos de ejemplo (categorías, productos, usuario admin)
npm run prisma:seed

# 5. Levantar el servidor de desarrollo
npm run dev
```

La app queda disponible en `http://localhost:3000`.


**Cambia esta contraseña de inmediato en cualquier ambiente que no sea tu
máquina local.**

## 3. Variables de entorno

Ver `.env.example` para el detalle completo. Resumen de las más importantes:

| Variable | Uso |
|---|---|
| `DATABASE_URL` | Conexión a PostgreSQL |
| `NEXTAUTH_SECRET` | Firma de sesiones (generar con `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | URL pública del sitio (usada por Auth.js) |
| `TBK_COMMERCE_CODE` / `TBK_API_KEY` | Credenciales Webpay (sandbox por defecto) |
| `TBK_ENVIRONMENT` | `integration` o `production` |
| `RESEND_API_KEY` | API key del proveedor de correo |
| `RESEND_FROM_EMAIL` | Remitente verificado, por ejemplo `DicenArte <pedidos@tudominio.cl>` |
| `ADMIN_EMAIL` | Opcional; si falta, se usa el correo del usuario con rol `ADMIN` |
| `S3_*` | Credenciales del bucket privado de imágenes |
| `SII_PROVIDER_*` | Credenciales del proveedor de boletas electrónicas |
| `WAREHOUSE_LAT` / `WAREHOUSE_LNG` | Coordenadas de la bodega para calcular el despacho |
| `SHIPPING_MAX_DISTANCE_KM` | Distancia máxima de despacho; por defecto `25` |
| `GOOGLE_MAPS_SERVER_API_KEY` | Clave secreta del servidor para verificar el Place ID y calcular el despacho; debe tener habilitada Geocoding API |

## 4. Probar un pago de prueba (sandbox Webpay)

En ambiente `integration`, Transbank entrega tarjetas de prueba públicas
(buscar "tarjetas de prueba Webpay Plus integración" en la documentación
oficial de Transbank). El flujo completo (crear orden → redirigir a Webpay →
volver y confirmar) funciona igual que en producción, solo cambia
`TBK_ENVIRONMENT`.

## 5. Desplegar en Vercel

```bash
# 1. Subir el repositorio a GitHub/GitLab/Bitbucket
git init && git add . && git commit -m "Proyecto inicial DicenArte"
git remote add origin <URL_DE_TU_REPO>
git push -u origin main

# 2. En vercel.com: "Add New Project" -> importar el repositorio

# 3. Configurar todas las variables de entorno del .env.example
#    en Vercel > Project Settings > Environment Variables

# 4. Configurar la base de datos de producción (recomendado: Neon o Supabase,
#    ambos compatibles con el entorno serverless de Vercel)

# 5. Ejecutar la migración inicial contra la base de producción:
DATABASE_URL="<url-produccion>" npx prisma migrate deploy

# 6. Conectar el dominio propio en Vercel > Project Settings > Domains
#    y actualizar NEXT_PUBLIC_SITE_URL / NEXTAUTH_URL con el dominio final
```

Antes de salir a producción real con Webpay, cambia `TBK_ENVIRONMENT` a
`production` y solicita las credenciales productivas a Transbank.

## 6. Estructura del proyecto

```
dicenarte/
├── prisma/
│   ├── schema.prisma     # Modelo de datos completo
│   └── seed.ts           # Datos iniciales (categorías, productos, admin)
├── src/
│   ├── app/
│   │   ├── (público)     # Home, Tienda, Producto, Carrito, Checkout, Legal
│   │   ├── admin/        # Panel de administración (protegido por rol)
│   │   └── api/          # Rutas API: auth, registro, productos, upload,
│   │                     # checkout, Webpay (create/commit/webhook)
│   ├── components/       # Header, Footer, ProductCard, CookieConsent, etc.
│   ├── lib/               # prisma, auth, webpay, s3, validations, cartStore
│   └── types/            # Extensión de tipos de next-auth
├── middleware.ts         # Protección de /admin por rol
└── next.config.js        # CSP, X-Frame-Options y demás headers de seguridad
```

## 7. Cumplimiento normativo — dónde está implementado cada punto

- **Derecho a retracto (RF-07):** aviso + checkbox obligatorio en
  `src/components/CheckoutForm.tsx`.
- **Garantía legal y T&C (RF-08):** `src/app/legal/page.tsx`, enlazada desde
  el checkout.
- **Consentimiento y logs (RF-12/13):** `src/app/api/register/route.ts` y
  `src/app/api/consent/route.ts`, tabla `ConsentLog`.
- **PCI DSS / no almacenar tarjetas (RNF-04):** `src/lib/webpay.ts` — el
  servidor solo maneja tokens de Transbank, nunca números de tarjeta.
- **Validación de webhooks (RF-10):** `src/app/api/webpay/commit/route.ts`
  (confirmación server-to-server) y `src/app/api/webpay/webhook/route.ts`
  (firma HMAC).
- **Magic bytes / tamaño de archivos (RNF-05/06):** `src/lib/validations.ts`.
- **URLs firmadas (RNF-07):** `src/lib/s3.ts`.
- **Cabeceras de seguridad (RNF-02):** `next.config.js`.
- **Cookies de sesión seguras (RF-17):** `src/lib/auth.ts`.
- **Banner de cookies (RF-14):** `src/components/CookieConsentBanner.tsx`.
- **SEO (RNF-10):** `src/app/sitemap.ts`, `src/app/robots.ts`,
  metadatos en `src/app/layout.tsx` y en cada página.

## 8. Estado funcional y pendientes de entrega

### Funcionalidad disponible

- **Estados operativos de pedidos:** desde el detalle de un pedido pagado, una cuenta ADMIN puede avanzar secuencialmente `PAGADA` → `EN_PREPARACION` → `ENVIADA` → `ENTREGADA` y retroceder de a un estado operativo para corregir errores. Cada cambio queda en `OrderStatusLog` junto con el administrador; los retrocesos requieren registrar el motivo. Retroceder no modifica ni revierte el pago confirmado. El panel no modifica estados de pago ni permite anular pedidos.
- **Reposición de stock:** el flujo de confirmación de Webpay marca como rechazados los pagos fallidos y repone el stock reservado, protegido contra procesamiento duplicado (`src/app/api/webpay/commit/route.ts`).
- **Historial de pedido:** el detalle administrativo muestra los registros de cambio de estado disponibles.

### Pendientes y verificaciones

1. **Boleta electrónica real (RF-11):** emisión pausada/no implementada. El recibo de la página de confirmación no debe presentarse como boleta tributaria.
2. **Imagen Open Graph:** verificar que `public/og-image.jpeg` corresponda a la imagen final de marca y tenga las dimensiones esperadas (1200 × 630 px).
3. **Producción:** confirmar credenciales y pruebas autorizadas de Webpay, remitente de email, dominio, variables y permisos del entorno final antes de afirmar que está listo para vender.
