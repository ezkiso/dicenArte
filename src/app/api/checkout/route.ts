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

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const items = parsed.data.items;

  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });

  const quantities = new Map<string, number>();
  for (const item of items) {
    const quantity = (quantities.get(item.productId) ?? 0) + item.quantity;
    if (quantity > 99) {
      return NextResponse.json(
        { error: "La cantidad máxima por producto es 99 unidades." },
        { status: 400 }
      );
    }
    quantities.set(item.productId, quantity);
  }

  let total = 0;
  const orderItemsData = [...quantities].map(([productId, quantity]) => {
    const item = { productId, quantity };
    const product = products.find((p) => p.id === item.productId);
    if (!product) return null;
    total += product.priceClp * item.quantity;
    return {
      productId: product.id,
      quantity: item.quantity,
      unitPriceClp: product.priceClp,
    };
  });

  if (orderItemsData.some((item) => item === null)) {
    return NextResponse.json({ error: "Uno o más productos no existen." }, { status: 400 });
  }

  const validOrderItems = orderItemsData as {
    productId: string;
    quantity: number;
    unitPriceClp: number;
  }[];

  try {
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
        userId: session?.user?.id ?? null,
        customerFirstName: parsed.data.customerFirstName,
        customerLastName: parsed.data.customerLastName,
        customerEmail: parsed.data.customerEmail,
        customerPhone: parsed.data.customerPhone,
        totalClp: total,
        shippingAddress: parsed.data.shippingAddress,
        shippingLat: parsed.data.shippingLat,
        shippingLng: parsed.data.shippingLng,
        retractoAceptado: parsed.data.retractoAceptado,
        items: { create: validOrderItems },
        statusLogs: { create: { status: "PENDIENTE", note: "Orden creada" } },
      },
      });

      for (const item of validOrderItems) {
        const updated = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (updated.count !== 1) {
          throw new Error("El stock cambió mientras procesábamos tu compra. Intenta nuevamente.");
        }
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