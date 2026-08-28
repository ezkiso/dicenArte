import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/webpay";
import { prisma } from "@/lib/prisma";

/**
 * RF-10: endpoint opcional para notificaciones asíncronas de reconciliación
 * (por ejemplo, un servicio de conciliación de Transbank o un proveedor de
 * boletas que avise por webhook). Valida la firma HMAC con el secreto
 * compartido `TBK_WEBHOOK_SECRET` ANTES de procesar cualquier cambio de
 * estado. El flujo principal de pago se confirma en `/api/webpay/commit`
 * contra la API de Transbank directamente; este webhook es una capa
 * adicional de trazabilidad/reconciliación.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-webhook-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody) as { orderId: string; note: string };

  await prisma.orderStatusLog.create({
    data: {
      orderId: payload.orderId,
      status: "PAGADA",
      note: `Webhook reconciliación: ${payload.note}`,
    },
  });

  return NextResponse.json({ ok: true });
}
