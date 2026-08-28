import { NextRequest, NextResponse } from "next/server";
import { commitTransaction } from "@/lib/webpay";
import { prisma } from "@/lib/prisma";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

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
        await prisma.order.update({
          where: { id: payment.orderId },
          data: {
            status: "RECHAZADA",
            statusLogs: { create: { status: "RECHAZADA", note: "Pago abortado por el usuario" } },
          },
        });
        return NextResponse.redirect(
          `${siteUrl}/checkout/success?orden=${payment.orderId}`
        );
      }
    }
    return NextResponse.redirect(`${siteUrl}/checkout`);
  }

  const payment = await prisma.payment.findUnique({ where: { tbkToken: tokenWs } });
  if (!payment) {
    return NextResponse.redirect(`${siteUrl}/checkout`);
  }

  try {
    // RF-10: confirmación server-to-server directa contra Transbank.
    const result = await commitTransaction(tokenWs);
    const approved = result.status === "AUTHORIZED" && result.response_code === 0;

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        tbkStatus: result.status,
        authorizationCode: result.authorization_code,
        webhookVerifiedAt: new Date(),
      },
    });

    await prisma.order.update({
      where: { id: payment.orderId },
      data: {
        status: approved ? "PAGADA" : "RECHAZADA",
        statusLogs: {
          create: {
            status: approved ? "PAGADA" : "RECHAZADA",
            note: `Transbank respondió: ${result.status}`,
          },
        },
      },
    });

    // RF-11: al confirmarse el pago, se dispara la emisión de boleta
    // electrónica. Se deja como stub — reemplazar por la llamada real al
    // proveedor autorizado por el SII que se contrate.
    if (approved) {
      await emitBoletaStub(payment.orderId, payment.amountClp);
    }
  } catch {
    await prisma.order.update({
      where: { id: payment.orderId },
      data: {
        status: "RECHAZADA",
        statusLogs: { create: { status: "RECHAZADA", note: "Error confirmando con Transbank" } },
      },
    });
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
