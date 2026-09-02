import { z } from "zod";
import { fileTypeFromBuffer } from "file-type";

// RNF-06: límite estricto de tamaño en rutas API que reciben archivos.
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/**
 * RNF-05: valida los "magic numbers" reales del archivo (no solo la
 * extensión ni el `Content-Type` declarado por el navegador) para evitar que
 * se suban archivos maliciosos disfrazados de imagen.
 */
export async function validateImageFile(buffer: Buffer) {
  if (buffer.byteLength > MAX_UPLOAD_BYTES) {
    return { valid: false as const, reason: "El archivo supera el límite de 5MB." };
  }

  const type = await fileTypeFromBuffer(new Uint8Array(buffer));
  if (!type || !ALLOWED_MIME_TYPES.has(type.mime)) {
    return {
      valid: false as const,
      reason: "El archivo no es una imagen JPEG, PNG o WEBP válida.",
    };
  }

  return { valid: true as const, mime: type.mime, ext: type.ext };
}

// ---------- Esquemas de datos ----------

export const productSchema = z.object({
  name: z.string().min(2).max(150),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "El slug solo puede tener minúsculas, números y guiones"),
  description: z.string().min(10),
  priceClp: z.number().int().positive(),
  stock: z.number().int().min(0),
  isCustom: z.boolean(),
  categoryId: z.string().cuid(),
});

// RF-06/07: datos de checkout. Ya no hay registro previo, así que aquí se
// piden los datos de contacto del cliente (compra de invitado) y también
// el consentimiento de datos (RF-12).
export const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().cuid("Producto inválido"),
        quantity: z.number().int().positive().max(99),
      })
    )
    .min(1, "El carrito está vacío.")
    .max(50, "El carrito tiene demasiados productos."),
  customerName: z.string().min(2, "Ingresa tu nombre completo"),
  customerEmail: z.string().email("Correo inválido"),
  customerPhone: z.string().min(8).max(20).optional(),
  shippingAddress: z.string().min(10, "Ingresa una dirección de despacho completa"),
  // RF-07: aceptación explícita del aviso de derecho a retracto
  retractoAceptado: z.literal(true, {
    errorMap: () => ({ message: "Debes aceptar la política de derecho a retracto." }),
  }),
  // RF-12: consentimiento de datos, ahora en el checkout (aplica también a
  // compras de invitado, ya que no existe un paso de registro previo).
  dataConsent: z.literal(true, {
    errorMap: () => ({ message: "Debes aceptar el tratamiento de tus datos personales." }),
  }),
});

export const consentSchema = z.object({
  policyVersion: z.string(),
});