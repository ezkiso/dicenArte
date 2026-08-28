import crypto from "crypto";

/**
 * Integración con Webpay Plus (Transbank).
 *
 * RNF-04 / RF-09: en ningún momento este archivo recibe, procesa ni guarda
 * números de tarjeta. El flujo es:
 *  1. `createTransaction` pide a Transbank una URL + token de pago.
 *  2. El navegador del cliente es redirigido a esa URL (el formulario de
 *     tarjeta vive 100% en los servidores de Transbank).
 *  3. Transbank redirige de vuelta a nuestro `return_url` con un token.
 *  4. `commitTransaction` confirma el resultado contra la API de Transbank.
 *
 * Este archivo usa el SDK REST directo (fetch) en lugar de un paquete npm
 * para que quede explícito qué se envía y se recibe. En producción puedes
 * reemplazarlo por el SDK oficial `transbank-sdk`.
 *
 * NOTA: las credenciales de integration de abajo son las públicas de prueba
 * que Transbank documenta para el ambiente sandbox (Webpay Plus).
 */

const ENV = process.env.TBK_ENVIRONMENT === "production" ? "production" : "integration";

const BASE_URL =
  ENV === "production"
    ? "https://webpay3g.transbank.cl"
    : "https://webpay3gint.transbank.cl";

const COMMERCE_CODE = process.env.TBK_COMMERCE_CODE!;
const API_KEY = process.env.TBK_API_KEY!;

function tbkHeaders() {
  return {
    "Content-Type": "application/json",
    "Tbk-Api-Key-Id": COMMERCE_CODE,
    "Tbk-Api-Key-Secret": API_KEY,
  };
}

export interface CreateTransactionParams {
  buyOrder: string; // debe ser único, <=26 caracteres
  sessionId: string;
  amount: number; // en pesos chilenos, sin decimales
  returnUrl: string;
}

export async function createTransaction(params: CreateTransactionParams) {
  const res = await fetch(`${BASE_URL}/rswebpaytransaction/api/webpay/v1.2/transactions`, {
    method: "POST",
    headers: tbkHeaders(),
    body: JSON.stringify({
      buy_order: params.buyOrder,
      session_id: params.sessionId,
      amount: params.amount,
      return_url: params.returnUrl,
    }),
  });

  if (!res.ok) {
    throw new Error(`Error creando transacción Webpay: ${res.status}`);
  }

  return (await res.json()) as { token: string; url: string };
}

export async function commitTransaction(token: string) {
  const res = await fetch(
    `${BASE_URL}/rswebpaytransaction/api/webpay/v1.2/transactions/${token}`,
    {
      method: "PUT",
      headers: tbkHeaders(),
    }
  );

  if (!res.ok) {
    throw new Error(`Error confirmando transacción Webpay: ${res.status}`);
  }

  return (await res.json()) as {
    vci: string;
    amount: number;
    status: string; // "AUTHORIZED" | "FAILED" | ...
    buy_order: string;
    session_id: string;
    authorization_code: string;
    response_code: number;
  };
}

/**
 * RF-10: validación de la firma del webhook antes de marcar una orden como
 * pagada. Transbank no siempre firma con HMAC en Webpay Plus básico (el
 * `commitTransaction` de arriba ya es la fuente de verdad), pero si se usa un
 * secreto compartido propio para notificaciones asíncronas adicionales
 * (ej. un endpoint de reconciliación), validamos así:
 */
export function verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader) return false;

  const expected = crypto
    .createHmac("sha256", process.env.TBK_WEBHOOK_SECRET!)
    .update(rawBody)
    .digest("hex");

  const provided = Buffer.from(signatureHeader);
  const expectedBuf = Buffer.from(expected);

  if (provided.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(provided, expectedBuf);
}
