import { prisma } from "@/lib/prisma";
import { formatClp } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import Link from "next/link";

// RF-18: listado de pedidos, solo lectura.
export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { payment: true },
    take: 100,
  });

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl">Pedidos</h1>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-base-gray-300 text-left">
            <th className="py-2">Orden</th>
            <th className="py-2">Cliente</th>
            <th className="py-2">Total</th>
            <th className="py-2">Estado</th>
            <th className="py-2">Fecha</th>
            <th className="py-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-b border-base-gray-200">
              <td className="py-2 font-mono text-xs">{o.id.slice(-8).toUpperCase()}</td>
              <td className="py-2">{o.customerEmail}</td>
              <td className="py-2">{formatClp(o.totalClp)}</td>
              <td className="py-2">
                <span
                  className={
                    o.status === "PAGADA"
                      ? "text-base-black"
                      : o.status === "RECHAZADA"
                      ? "text-base-gray-500 line-through"
                      : "text-base-gray-600"
                  }
                >
                  {ORDER_STATUS_LABELS[o.status]}
                </span>
              </td>
              <td className="py-2 text-base-gray-500">
                {o.createdAt.toLocaleDateString("es-CL")}
              </td>
              <td className="py-2">
                <Link href={`/admin/pedidos/${o.id}`} className="underline">
                  Ver detalles
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {orders.length === 0 && <p className="mt-6 text-base-gray-500">No hay pedidos aún.</p>}
    </div>
  );
}
