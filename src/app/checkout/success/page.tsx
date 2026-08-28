import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatClp } from "@/lib/utils";

// El commit del pago ya ocurrió en /api/webpay/commit (server-to-server /
// return_url); esta página solo muestra el resultado ya guardado en la orden.
export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { orden?: string };
}) {
  const order = searchParams.orden
    ? await prisma.order.findUnique({
        where: { id: searchParams.orden },
        include: { payment: true, boleta: true },
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

  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="font-display text-2xl">
        {pagada ? "¡Pago confirmado!" : "El pago no se pudo confirmar"}
      </h1>
      <p className="mt-2 text-base-gray-600">
        Orden #{order.id.slice(-8).toUpperCase()} — {formatClp(order.totalClp)}
      </p>
      <p className="mt-1 text-sm text-base-gray-500">Estado: {order.status}</p>

      {pagada && order.boleta && (
        <p className="mt-4 text-sm">
          {order.boleta.status === "EMITIDA"
            ? "Tu boleta electrónica fue emitida y llegará a tu correo."
            : "Tu boleta electrónica se está generando; te llegará por correo en breve."}
        </p>
      )}

      <Link href="/tienda" className="mt-8 inline-block bg-base-black px-6 py-3 text-sm font-semibold text-base-white">
        Seguir comprando
      </Link>
    </div>
  );
}
