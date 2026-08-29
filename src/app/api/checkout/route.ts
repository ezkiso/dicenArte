import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkoutSchema } from "@/lib/validations";
import { CURRENT_POLICY_VERSION } from "@/lib/utils";

// RF-06/07: crea la orden a partir de los ítems del carrito.
// Ya no exige sesión iniciada: admite compra como invitado. Si por algún
// motivo hay una sesión activa (ej. el admin probando), igual se asocia.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  const body = await req.json();
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const items: { productId: string; quantity: number }[] = body.items ?? [];
  if (items.length === 0) {
    return NextResponse.json({ error: "El carrito está vacío." }, { status: 400 });
  }

  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });

  let total = 0;
  const orderItemsData = items.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    if (!product) throw new Error("Producto no encontrado");
    if (product.stock < item.quantity) {
      throw new Error(`Sin stock suficiente para "${product.name}".`);
    }
    total += product.priceClp * item.quantity;
    return {
      productId: product.id,
      quantity: item.quantity,
      unitPriceClp: product.priceClp,
    };
  });

  try {
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId: session?.user?.id ?? null,
          customerName: parsed.data.customerName,
          customerEmail: parsed.data.customerEmail,
          customerPhone: parsed.data.customerPhone,
          totalClp: total,
          shippingAddress: parsed.data.shippingAddress,
          retractoAceptado: parsed.data.retractoAceptado,
          items: { create: orderItemsData },
          statusLogs: { create: { status: "PENDIENTE", note: "Orden creada" } },
        },
      });

      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // RF-12/13: log de consentimiento con fecha/hora exacta, también para
      // compras de invitado (identificadas por su correo, no por userId).
      const forwardedFor = req.headers.get("x-forwarded-for");
      await tx.consentLog.create({
        data: {
          userId: session?.user?.id ?? null,
          guestEmail: session?.user?.id ? null : parsed.data.customerEmail,
          policyVersion: CURRENT_POLICY_VERSION,
          ipAddress: forwardedFor?.split(",")[0]?.trim() ?? null,
        },
      });

      return newOrder;
    });

    return NextResponse.json({ orderId: order.id }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "No se pudo crear la orden." },
      { status: 400 }
    );
  }
}