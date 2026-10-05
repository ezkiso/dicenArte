"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { OrderStatus } from "@prisma/client";
import { getNextAdminOrderStatus, ORDER_STATUS_LABELS } from "@/lib/order-status";

export default function AdminOrderStatusControl({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  const router = useRouter();
  const nextStatus = getNextAdminOrderStatus(status);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function advanceStatus() {
    if (!nextStatus) return;

    const currentLabel = ORDER_STATUS_LABELS[status];
    const nextLabel = ORDER_STATUS_LABELS[nextStatus];
    if (
      !window.confirm(
        `¿Confirmas avanzar el pedido de "${currentLabel}" a "${nextLabel}"? Este cambio no se puede revertir desde el panel.`
      )
    ) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, note }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.error ?? "No se pudo actualizar el estado del pedido.");
        return;
      }

      setNote("");
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor. Revisa la conexión e inténtalo nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-6 border border-base-gray-200 p-4">
      <h2 className="mb-2 font-display text-lg">Estado del pedido</h2>
      {nextStatus ? (
        <>
          <p className="mb-3 text-sm text-base-gray-600">
            Próximo paso: {ORDER_STATUS_LABELS[nextStatus]}. Los estados de pago se actualizan
            automáticamente con la confirmación de Webpay.
          </p>
          <label className="mb-3 block text-sm">
            Nota interna (opcional)
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={500}
              rows={2}
              className="mt-1 w-full border border-base-gray-300 p-2"
              placeholder="Por ejemplo: pedido preparado para despacho"
            />
          </label>
          {error && (
            <p role="alert" className="mb-3 text-sm text-red-700">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={advanceStatus}
            disabled={loading}
            className="bg-base-black px-4 py-2 text-sm font-semibold text-base-white disabled:opacity-50"
          >
            {loading ? "Actualizando…" : `Avanzar a ${ORDER_STATUS_LABELS[nextStatus]}`}
          </button>
          <p className="mt-3 text-xs text-base-gray-500">
            El avance es secuencial y no se puede revertir desde el panel.
          </p>
        </>
      ) : (
        <p className="text-sm text-base-gray-600">
          No hay más cambios de estado disponibles desde el panel para este pedido.
        </p>
      )}
    </section>
  );
}
