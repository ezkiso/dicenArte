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

  const type = await fileTypeFromBuffer(buffer);
  if (!type || !ALLOWED_MIME_TYPES.has(type.mime)) {
    return {
      valid: false as const,
      reason: "El archivo no es una imagen JPEG, PNG o WEBP válida.",
    };
  }

  return { valid: true as const, mime: type.mime, ext: type.ext };
}

// ---------- Esquemas de datos ----------

export const registerSchema = z.object({
  name: z.string().min(2, "El nombre es muy corto").max(100),
  email: z.string().email("Correo inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  phone: z.string().min(8).max(20).optional(),
  // RF-12: consentimiento de datos obligatorio para poder registrarse
  dataConsent: z.literal(true, {
    errorMap: () => ({ message: "Debes aceptar el tratamiento de datos personales." }),
  }),
});

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

export const checkoutSchema = z.object({
  shippingAddress: z.string().min(10, "Ingresa una dirección de despacho completa"),
  // RF-07: aceptación explícita del aviso de derecho a retracto
  retractoAceptado: z.literal(true, {
    errorMap: () => ({ message: "Debes aceptar la política de derecho a retracto." }),
  }),
});

export const consentSchema = z.object({
  policyVersion: z.string(),
});
