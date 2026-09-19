import { NextRequest, NextResponse } from "next/server";
import { commitTransaction } from "@/lib/webpay";
import { prisma } from "@/lib/prisma";
import { sendOrderConfirmationEmails } from "@/lib/orderEmail";

/**
 * Marca la orden como RECHAZADA y repone el stock reservado en el checkout.
 *
 * El `updateMany` con `status: "PENDIENTE"` en el where actúa como guardia
 * atómica: si la orden ya no está PENDIENTE (por ejemplo porque Transbank
 * redirige dos veces al mismo return_url, o el usuario refresca la página),
 * `count` da 0 y NO se repone stock de nuevo. Sin esto, un doble llamado
 * incrementaría el stock dos veces por la misma orden fallida.
 */
async function markRejectedAndRestock(orderId: string, note: string) {
  await prisma.$transaction(async (tx) => {
    const updated = await tx.order.updateMany({
      where: { id: orderId, status: "PENDIENTE" },
      data: { status: "RECHAZADA" },
    });

    if (updated.count === 0) {
      // La orden ya había sido procesada antes (pagada, rechazada o
      // reintento del return_url) — no se toca el stock de nuevo.
      return;
    }

    await tx.orderStatusLog.create({
      data: { orderId, status: "RECHAZADA", note },
    });

    const items = await tx.orderItem.findMany({ where: { orderId } });
    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }
  });
}

/**
 * `return_url` al que Transbank redirige (vía POST) tras el pago.
 *
 * RF-10: antes de marcar una orden como pagada, SIEMPRE se vuelve a
 * confirmar el resultado directamente contra la API de Transbank
 * (`commitTransaction`) usando el token recibido — nunca se confía
 * ciegamente en los parámetros de la redirección del navegador, que
 * podrían ser manipulados por el cliente.
 */
async function handleReturn(req: NextRequest) {
  const siteUrl = req.nextUrl.origin;
  const formData = await req.formData().catch(() => null);
  const params = formData ?? req.nextUrl.searchParams;

  const tokenWs = params.get("token_ws");
  const tbkTokenAborted = params.get("TBK_TOKEN"); // el usuario canceló el pago

  if (!tokenWs) {
    if (tbkTokenAborted) {
      const payment = await prisma.payment.findUnique({
        where: { tbkToken: String(tbkTokenAborted) },
      });
      if (payment) {
        await markRejectedAndRestock(payment.orderId, "Pago abortado por el usuario");
        return NextResponse.redirect(
          `${siteUrl}/checkout/success?orden=${payment.orderId}`
        );
      }
    }
    return NextResponse.redirect(`${siteUrl}/checkout`);
  }

  const tokenWsStr = String(tokenWs);
  const payment = await prisma.payment.findUnique({ where: { tbkToken: tokenWsStr } });
  if (!payment) {
    return NextResponse.redirect(`${siteUrl}/checkout`);
  }

  const order = await prisma.order.findUnique({ where: { id: payment.orderId } });
  if (!order || order.status !== "PENDIENTE") {
    return NextResponse.redirect(`${siteUrl}/checkout/success?orden=${payment.orderId}`);
  }

  try {
    // RF-10: confirmación server-to-server directa contra Transbank.
    const result = await commitTransaction(tokenWsStr);
    const matchesOrder =
      result.amount === payment.amountClp &&
      result.buy_order === payment.tbkBuyOrder &&
      result.session_id === payment.orderId;
    const approved =
      matchesOrder && result.status === "AUTHORIZED" && result.response_code === 0;
    const resultNote = matchesOrder
      ? `Transbank respondió: ${result.status} (código ${result.response_code})`
      : "Respuesta Webpay no coincide con la orden almacenada";

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        tbkStatus: result.status,
        authorizationCode: result.authorization_code,
        webhookVerifiedAt: new Date(),
      },
    });

    if (approved) {
      const markedAsPaid = await prisma.$transaction(async (tx) => {
        const updated = await tx.order.updateMany({
          where: { id: payment.orderId, status: "PENDIENTE" },
          data: { status: "PAGADA" },
        });

        if (updated.count !== 1) return false;

        await tx.orderStatusLog.create({
          data: { orderId: payment.orderId, status: "PAGADA", note: resultNote },
        });
        return true;
      });

      // RF-11: al confirmarse el pago, se dispara la emisión de boleta
      // electrónica. Se deja como stub — reemplazar por la llamada real al
      // proveedor autorizado por el SII que se contrate.
      await emitBoletaStub(payment.orderId, payment.amountClp);

      if (markedAsPaid) {
        try {
          await sendOrderConfirmationEmails(payment.orderId);
        } catch (error) {
          // El pago ya fue confirmado: un fallo del proveedor de correo no
          // debe cambiar el resultado mostrado al comprador.
          console.error("No se pudieron enviar los emails de la orden.", error);
        }
      }
    } else {
      // Pago rechazado por Transbank (o respuesta no coincide con la
      // orden): se repone el stock reservado en el checkout.
      await markRejectedAndRestock(payment.orderId, resultNote);
    }
  } catch {
    // Error de red/timeout consultando a Transbank: se trata igual que un
    // rechazo, reponiendo el stock reservado.
    await markRejectedAndRestock(payment.orderId, "Error confirmando con Transbank");
  }

  return NextResponse.redirect(`${siteUrl}/checkout/success?orden=${payment.orderId}`);
}

/**
 * RF-11: stub de emisión de boleta electrónica.
 * Reemplazar el cuerpo de esta función por la llamada real al proveedor
 * autorizado por el SII (ej. Facturación Simple, OpenFactura, Bsale, etc.),
 * usando `SII_PROVIDER_API_URL` y `SII_PROVIDER_API_KEY` desde el .env.
 */
async function emitBoletaStub(orderId: string, amountClp: number) {
  // --- INICIO STUB: reemplazar por integración real con el proveedor SII ---
  console.log(`[STUB] Emitiendo boleta electrónica para orden ${orderId} por $${amountClp}`);
  await prisma.boleta.upsert({
    where: { orderId },
    update: { status: "PENDIENTE" },
    create: { orderId, status: "PENDIENTE" },
  });
  // --- FIN STUB ---
}

export const POST = handleReturn;
export const GET = handleReturn;