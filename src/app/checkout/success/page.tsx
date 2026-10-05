import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { getSignedImageUrl } from "@/lib/s3";
import { formatClp } from "@/lib/utils";

// El commit del pago ya ocurrió en /api/webpay/commit (server-to-server /
// return_url); esta página solo muestra el resultado ya guardado en la orden,
// junto con el detalle completo de lo comprado.
export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { orden?: string };
}) {
  const order = searchParams.orden
    ? await prisma.order.findUnique({
        where: { id: searchParams.orden },
        include: {
          payment: true,
          items: {
            include: {
              product: {
                include: { images: { take: 1, orderBy: { order: "asc" } } },
              },
            },
          },
        },
      })
    : null;

  if (!order) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="font-display text-2xl">No encontramos esa orden</h1>
        <Link href="/tienda" className="mt-4 inline-block underline">
          Volver a la tienda
        </Link>
      </div>
    );
  }

  const pagada = order.status === "PAGADA";
  const rechazada = order.status === "RECHAZADA";

  // Resuelve todas las URLs firmadas de una vez, en paralelo.
  const itemsWithImages = await Promise.all(
    order.items.map(async (item) => ({
      ...item,
      imageUrl: item.product.images[0]
        ? await getSignedImageUrl(item.product.images[0].bucketKey)
        : null,
    }))
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="text-center">
        <h1 className="font-display text-2xl">
          {pagada
            ? "¡Gracias por tu compra!"
            : rechazada
              ? "El pago no se pudo confirmar"
              : "Tu orden está pendiente"}
        </h1>
        <p className="mt-2 text-base-gray-600">
          Orden #{order.id.slice(-8).toUpperCase()}
        </p>
        <p className="mt-1 text-sm text-base-gray-500">Estado: {order.status}</p>
        {pagada && (
          <p className="mt-4 text-sm text-base-gray-600">
            Este recibo contiene el respaldo de tu compra.
          </p>
        )}

        {rechazada && (
          <p className="mt-4 text-sm text-base-gray-600">
            El pago no fue aprobado. Si el problema persiste, contáctanos por WhatsApp.
          </p>
        )}
      </div>

      <div className="mt-10 border-t border-base-gray-200 pt-8">
        <h2 className="mb-4 font-display text-lg">Detalle de tu compra</h2>

        <div className="space-y-4">
          {itemsWithImages.map((item) => (
            <div key={item.id} className="flex items-center gap-4">
              {item.imageUrl && (
                <div className="relative h-16 w-16 flex-shrink-0 bg-base-gray-100">
                  <Image
                    src={item.imageUrl}
                    alt={item.product.name}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm font-medium">{item.product.name}</p>
                <p className="text-xs text-base-gray-500">
                  {item.quantity} × {formatClp(item.unitPriceClp)}
                </p>
              </div>
              <p className="text-sm font-semibold">
                {formatClp(item.quantity * item.unitPriceClp)}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-base-gray-200 pt-4">
          <div>
            <p className="font-semibold">Despacho</p>
            <p className="text-xs text-base-gray-500">
              {order.shippingDistanceKm.toFixed(2)} km desde la bodega
            </p>
          </div>
          <p className="font-semibold">{formatClp(order.shippingCostClp)}</p>
        </div>

        <div className="flex items-center justify-between border-t border-base-gray-200 pt-4">
          <p className="font-semibold">Total</p>
          <p className="text-lg font-semibold">{formatClp(order.totalClp)}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 border-t border-base-gray-200 pt-8 sm:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-semibold">Datos de contacto</h3>
          <p className="text-sm text-base-gray-700">
            {order.customerFirstName} {order.customerLastName}
          </p>
          <p className="text-sm text-base-gray-700">{order.customerEmail}</p>
          {order.customerPhone && (
            <p className="text-sm text-base-gray-700">{order.customerPhone}</p>
          )}
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold">Dirección de despacho</h3>
          <p className="text-sm text-base-gray-700">{order.shippingAddress}</p>
        </div>
      </div>

      <div className="mt-10 text-center">
        <Link
          href="/tienda"
          className="inline-block bg-base-black px-6 py-3 text-sm font-semibold text-base-white"
        >
          Seguir comprando
        </Link>
      </div>
    </div>
  );
}