import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatClp } from "@/lib/utils";
import AdminOrderStatusControl from "@/components/AdminOrderStatusControl";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      payment: true,
      items: { include: { product: true } },
      statusLogs: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!order) notFound();

  return (
    <div className="min-w-0">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/pedidos" className="text-sm underline">
            Volver a pedidos
          </Link>
          <h1 className="mt-3 font-display text-2xl">
            Pedido #{order.id.slice(-8).toUpperCase()}
          </h1>
          <p className="mt-1 text-sm text-base-gray-500">
            Creado el {order.createdAt.toLocaleString("es-CL")}
          </p>
        </div>
        <span
          className={
            order.status === "PAGADA"
              ? "font-semibold text-green-700"
              : order.status === "RECHAZADA"
                ? "font-semibold text-red-700"
                : "font-semibold text-base-gray-600"
          }
        >
          {ORDER_STATUS_LABELS[order.status]}
        </span>
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-2">
        <section className="min-w-0 border border-base-gray-200 p-4">
          <h2 className="mb-3 font-display text-lg">Cliente</h2>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="font-semibold">Nombre</dt>
              <dd>{order.customerFirstName} {order.customerLastName}</dd>
            </div>
            <div>
              <dt className="font-semibold">Correo</dt>
              <dd className="break-all">{order.customerEmail}</dd>
            </div>
            {order.customerPhone && (
              <div>
                <dt className="font-semibold">Teléfono</dt>
                <dd>{order.customerPhone}</dd>
              </div>
            )}
          </dl>
        </section>

        <section className="min-w-0 border border-base-gray-200 p-4">
          <h2 className="mb-3 font-display text-lg">Destino de despacho</h2>
          <p className="break-words text-sm">{order.shippingAddress}</p>
          {(order.shippingLat !== null || order.shippingLng !== null) && (
            <p className="mt-3 text-xs text-base-gray-500">
              Coordenadas: {order.shippingLat ?? "-"}, {order.shippingLng ?? "-"}
            </p>
          )}
        </section>
      </div>

      <section className="mt-6 min-w-0 border border-base-gray-200 p-4">
        <h2 className="mb-3 font-display text-lg">Productos comprados</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[30rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-base-gray-300 text-left">
                <th className="py-2 pr-4">Producto</th>
                <th className="py-2 pr-4">Precio unitario</th>
                <th className="py-2 pr-4">Cantidad</th>
                <th className="py-2 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-b border-base-gray-200">
                  <td className="py-3 pr-4">{item.product.name}</td>
                  <td className="py-3 pr-4">{formatClp(item.unitPriceClp)}</td>
                  <td className="py-3 pr-4">{item.quantity}</td>
                  <td className="py-3 text-right font-medium">
                    {formatClp(item.unitPriceClp * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex flex-wrap justify-end gap-x-4 gap-y-1 border-t border-base-gray-200 pt-4">
          <p className="text-sm">Despacho: {formatClp(order.shippingCostClp)}</p>
          <p className="text-sm">Distancia: {order.shippingDistanceKm.toFixed(2)} km</p>
          <p className="text-lg font-semibold">Total: {formatClp(order.totalClp)}</p>
        </div>
      </section>

      <AdminOrderStatusControl orderId={order.id} status={order.status} />

      <section className="mt-6 grid min-w-0 gap-6 lg:grid-cols-2">
        <div className="min-w-0 border border-base-gray-200 p-4">
          <h2 className="mb-3 font-display text-lg">Pago</h2>
          {order.payment ? (
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="font-semibold">Estado Webpay</dt>
                <dd>{order.payment.tbkStatus}</dd>
              </div>
              <div>
                <dt className="font-semibold">Monto confirmado</dt>
                <dd>{formatClp(order.payment.amountClp)}</dd>
              </div>
              {order.payment.authorizationCode && (
                <div>
                  <dt className="font-semibold">Código de autorización</dt>
                  <dd>{order.payment.authorizationCode}</dd>
                </div>
              )}
            </dl>
          ) : (
            <p className="text-sm text-base-gray-500">Sin información de pago.</p>
          )}
        </div>

        <div className="min-w-0 border border-base-gray-200 p-4">
          <h2 className="mb-3 font-display text-lg">Historial</h2>
          <ul className="space-y-3 text-sm">
            {order.statusLogs.map((log) => (
              <li key={log.id}>
                <p className="font-semibold">{ORDER_STATUS_LABELS[log.status]}</p>
                <p className="text-xs text-base-gray-500">
                  {log.createdAt.toLocaleString("es-CL")}
                  {log.note ? ` - ${log.note}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
