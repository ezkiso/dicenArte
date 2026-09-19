import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createTransaction } from "@/lib/webpay";

// RF-09: el checkout ahora admite compra de invitado, así que ya no se
// exige sesión. La orden se identifica por su `orderId` (un cuid
// impredecible de 25 caracteres), que actúa como token de acceso.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || !("orderId" in body) || typeof body.orderId !== "string") {
    return NextResponse.json({ error: "orderId requerido" }, { status: 400 });
  }
  const { orderId } = body;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
  }
  if (order.status !== "PENDIENTE") {
    return NextResponse.json({ error: "Esta orden ya fue procesada." }, { status: 409 });
  }

  const buyOrder = order.id.slice(-20);

  try {
    const { token, url } = await createTransaction({
      buyOrder,
      sessionId: order.id,
      amount: order.totalClp,
      returnUrl: `${new URL("/api/webpay/commit", req.url)}`,
    });

    await prisma.payment.upsert({
      where: { orderId: order.id },
      update: { tbkToken: token, tbkBuyOrder: buyOrder, tbkStatus: "INICIADA" },
      create: {
        orderId: order.id,
        tbkToken: token,
        tbkBuyOrder: buyOrder,
        tbkStatus: "INICIADA",
        amountClp: order.totalClp,
      },
    });

    return NextResponse.json({ token, url });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error iniciando el pago." },
      { status: 502 }
    );
  }
}