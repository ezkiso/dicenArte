# Plan de desarrollo — DicenArte

División sugerida en 4 hitos, alineada con las prioridades Alta/Media del SRS.

## Hito 1 — Base funcional (RF/RNF de prioridad Alta esenciales)
**Objetivo:** una tienda navegable, con login y checkout hasta el pago.

- RF-01 Autenticación (registro/login)
- RF-03 Home
- RF-04 Catálogo/menú
- RF-06 Carrito
- RF-07 Checkout / derecho a retracto
- RF-08 Garantía legal y T&C
- RF-12 / RF-13 Consentimiento de datos y su log
- RF-14 Banner de cookies
- RF-15 / RF-16 Footer y logo
- RF-17 Seguridad de sesión
- RNF-01, 02, 03, 04, 06, 10, 11, 12, 13, 16, 17

Este es el contenido ya generado en el código de este entregable.

## Hito 2 — Pagos y cumplimiento SII
**Objetivo:** cerrar el ciclo de compra de punta a punta.

- RF-09 Integración real con Webpay (credenciales de producción)
- RF-10 Webhooks / confirmación server-to-server (ya implementado el mecanismo,
  falta conectarlo a credenciales productivas)
- RF-11 Emisión de boleta electrónica con proveedor SII real
- RNF-05 Validación de imágenes (ya implementada, revisar en carga real)
- RNF-07 Almacenamiento en bucket privado (conectar credenciales reales de
  S3/R2)
- RNF-14 Trazabilidad de pedidos (vista de auditoría en el admin)

## Hito 3 — Panel de administración y catálogo completo
**Objetivo:** que el equipo de DicenArte pueda operar la tienda sin
depender de un desarrollador.

- RF-02 CRUD de productos (ya implementado; pulir UX de carga de imágenes
  múltiples y reordenamiento)
- RF-05 Productos agotados (ya implementado)
- RF-18 Panel de administración completo (pedidos con cambio de estado
  manual, ej. marcar "Enviado")
- Carga inicial real del catálogo de productos de DicenArte

## Hito 4 — Pulido, SEO y lanzamiento
**Objetivo:** quedar listo para tráfico real.

- RNF-09 Rendimiento (medición real en Lighthouse/PageSpeed, ajustar
  imágenes y SSR/SSG donde corresponda)
- RNF-10 SEO fino (imagen Open Graph definitiva, textos meta por producto)
- RNF-15 Revisión de código / limpieza final
- Pruebas de compatibilidad en Chrome, Firefox, Safari, Edge (RNF-17)
- Compra y configuración del dominio (RNF-13), despliegue final en Vercel
  (RNF-12)
- Capacitación breve al equipo de DicenArte para usar el panel admin

## Nota sobre alcance (RNF-16)

Este plan contempla hasta 2 rondas de cambios funcionales significativos
sobre lo ya construido, según lo acordado. Cambios adicionales de alcance
(nuevas funcionalidades no listadas en el SRS original) se cotizan aparte.
