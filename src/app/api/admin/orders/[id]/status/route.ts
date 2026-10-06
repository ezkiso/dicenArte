import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ADMIN_ORDER_STATUS_OPTIONS,
  getNextAdminOrderStatus,
  getPreviousAdminOrderStatus,
} from "@/lib/order-status";

const updateStatusSchema = z
  .object({
    status: z.enum(ADMIN_ORDER_STATUS_OPTIONS),
    note: z.string().trim().max(500, "La nota no puede superar 500 caracteres.").optional(),
  })
  .strict();

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "El cuerpo de la solicitud no es válido." }, { status: 400 });
  }

  const parsed = updateStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: params.id },
      select: { status: true },
    });

    if (!order) return { kind: "not-found" as const };

    const isAdvance = getNextAdminOrderStatus(order.status) === parsed.data.status;
    const isRollback = getPreviousAdminOrderStatus(order.status) === parsed.data.status;

    if (!isAdvance && !isRollback) {
      return { kind: "invalid-transition" as const, currentStatus: order.status };
    }

    if (isRollback && !parsed.data.note) {
      return { kind: "missing-rollback-note" as const };
    }

    const updated = await tx.order.updateMany({
      where: { id: params.id, status: order.status },
      data: { status: parsed.data.status },
    });

    if (updated.count !== 1) return { kind: "conflict" as const };

    const actor = session.user.email ?? session.user.id ?? "administrador";
    const note = [
      isRollback
        ? `Retroceso desde el panel por ${actor}`
        : `Avance desde el panel por ${actor}`,
      parsed.data.note,
    ]
      .filter(Boolean)
      .join(" — ");

    await tx.orderStatusLog.create({
      data: {
        orderId: params.id,
        status: parsed.data.status,
        note,
      },
    });

    return { kind: "updated" as const, status: parsed.data.status };
  });

  if (result.kind === "not-found") {
    return NextResponse.json({ error: "No se encontró el pedido." }, { status: 404 });
  }

  if (result.kind === "invalid-transition") {
    return NextResponse.json(
      {
        error: "El pedido solo puede avanzar o retroceder un estado operativo a la vez, sin modificar el estado de pago.",
        currentStatus: result.currentStatus,
      },
      { status: 409 }
    );
  }

  if (result.kind === "missing-rollback-note") {
    return NextResponse.json(
      { error: "Indica el motivo para registrar el retroceso del pedido." },
      { status: 400 }
    );
  }

  if (result.kind === "conflict") {
    return NextResponse.json(
      { error: "El pedido cambió mientras se procesaba. Actualiza la página e inténtalo de nuevo." },
      { status: 409 }
    );
  }

  return NextResponse.json({ status: result.status });
}
