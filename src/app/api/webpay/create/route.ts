import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createTransaction } from "@/lib/webpay";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// RF-09: crea la transacción en Webpay y devuelve la URL + token a la que el
// navegador del cliente debe ser redirigido. El servidor nunca ve datos de tarjeta.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
  }

  const { orderId } = await req.json();
  if (typeof orderId !== "string") {
    return NextResponse.json({ error: "orderId requerido" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.userId !== session.user.id) {
    return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
  }
  if (order.status !== "PENDIENTE") {
    return NextResponse.json({ error: "Esta orden ya fue procesada." }, { status: 409 });
  }

  // buy_order de Webpay: máx 26 caracteres, debe ser único por transacción.
  const buyOrder = order.id.slice(-20);

  try {
    const { token, url } = await createTransaction({
      buyOrder,
      sessionId: session.user.id,
      amount: order.totalClp,
      returnUrl: `${siteUrl}/api/webpay/commit`,
    });

    // Guardamos el token de inmediato para poder relacionarlo en el commit,
    // antes de saber si el pago fue exitoso (tbkStatus se actualiza después).
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
