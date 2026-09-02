import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/webpay";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const webhookSchema = z.object({
  orderId: z.string().cuid(),
  note: z.string().trim().min(1).max(500),
});

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

  let payload: z.infer<typeof webhookSchema>;
  try {
    payload = webhookSchema.parse(JSON.parse(rawBody));
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: payload.orderId },
    select: { id: true, status: true },
  });
  if (!order) {
    return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
  }

  await prisma.orderStatusLog.create({
    data: {
      orderId: payload.orderId,
      status: order.status,
      note: `Webhook reconciliación: ${payload.note}`,
    },
  });

  return NextResponse.json({ ok: true });
}
