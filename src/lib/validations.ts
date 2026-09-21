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
  name: z
    .string({ required_error: "El nombre del producto es obligatorio." })
    .min(2, "El nombre del producto debe tener al menos 2 caracteres.")
    .max(150, "El nombre del producto no puede superar los 150 caracteres."),
  slug: z
    .union([
      z
        .string()
        .trim()
        .regex(
          /^[a-z0-9-]+$/,
          "El slug solo puede contener minúsculas, números y guiones."
        ),
      z.literal(""),
    ])
    .optional(),
  description: z
    .string({ required_error: "La descripción es obligatoria." })
    .min(10, "La descripción debe tener al menos 10 caracteres."),
  priceClp: z
    .number({ required_error: "El precio es obligatorio." })
    .int("El precio debe ser un número entero.")
    .positive("El precio debe ser mayor que 0."),
  stock: z
    .number({ required_error: "El stock es obligatorio." })
    .int("El stock debe ser un número entero.")
    .min(0, "El stock no puede ser negativo."),
  isCustom: z.boolean({ required_error: "Indica si el producto es personalizado." }),
  categoryId: z
    .string({ required_error: "Selecciona una categoría." })
    .cuid("La categoría seleccionada no es válida."),
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
  customerFirstName: z.string().min(2, "Ingresa tu nombre"),
  customerLastName: z.string().min(2, "Ingresa tu apellido"),
  // El .email() de Zod ya exige un "@" y un dominio con punto (ej. algo.cl).
  customerEmail: z.string().email("Correo inválido"),
  customerPhone: z.string().min(8).max(20).optional(),
  deliveryMethod: z.enum(["DELIVERY", "PICKUP"]),
  shippingAddress: z.string().optional(),
  // Solo se aceptan si vienen de una selección real en el mapa/autocompletar,
  // nunca de texto libre sin confirmar (ver CheckoutForm.tsx).
  shippingLat: z.number().nullable().optional(),
  shippingLng: z.number().nullable().optional(),
  retractoAceptado: z.literal(true, {
    errorMap: () => ({ message: "Debes aceptar la política de derecho a retracto." }),
  }),
  dataConsent: z.literal(true, {
    errorMap: () => ({ message: "Debes aceptar el tratamiento de tus datos personales." }),
  }),
}).superRefine((data, context) => {
  if (data.deliveryMethod === "DELIVERY") {
    if (!data.shippingAddress || data.shippingAddress.length < 10) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["shippingAddress"],
        message: "Ingresa una dirección de despacho completa",
      });
    }
    if (typeof data.shippingLat !== "number" || typeof data.shippingLng !== "number") {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["shippingLat"],
        message: "Confirma la dirección en el mapa",
      });
    }
  }
});

export const consentSchema = z.object({
  policyVersion: z.string(),
});