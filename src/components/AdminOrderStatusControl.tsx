"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { OrderStatus } from "@prisma/client";
import {
  getNextAdminOrderStatus,
  getPreviousAdminOrderStatus,
  ORDER_STATUS_LABELS,
} from "@/lib/order-status";

export default function AdminOrderStatusControl({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  const router = useRouter();
  const nextStatus = getNextAdminOrderStatus(status);
  const previousStatus = getPreviousAdminOrderStatus(status);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function updateStatus(targetStatus: OrderStatus, isRollback: boolean) {
    if (isRollback && !note.trim()) {
      setError("Indica el motivo para retroceder el estado del pedido.");
      return;
    }

    const currentLabel = ORDER_STATUS_LABELS[status];
    const targetLabel = ORDER_STATUS_LABELS[targetStatus];
    if (
      !window.confirm(
        `¿Confirmas ${isRollback ? "retroceder" : "avanzar"} el pedido de "${currentLabel}" a "${targetLabel}"?`
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
        body: JSON.stringify({ status: targetStatus, note }),
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
            Puedes avanzar a {ORDER_STATUS_LABELS[nextStatus]} o corregir un error retrocediendo
            un estado operativo. Los estados de pago se actualizan automáticamente con la
            confirmación de Webpay.
          </p>
          <label className="mb-3 block text-sm">
            Nota interna {previousStatus ? "(obligatoria para retroceder)" : "(opcional)"}
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={500}
              rows={2}
              className="mt-1 w-full border border-base-gray-300 p-2"
              placeholder={previousStatus ? "Indica el motivo del cambio" : "Por ejemplo: pedido preparado para despacho"}
            />
          </label>
          {error && (
            <p role="alert" className="mb-3 text-sm text-red-700">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => updateStatus(nextStatus, false)}
              disabled={loading}
              className="max-w-full whitespace-normal break-words bg-base-black px-4 py-2 text-left text-sm font-semibold text-base-white disabled:opacity-50"
            >
              {loading ? "Actualizando…" : `Avanzar a ${ORDER_STATUS_LABELS[nextStatus]}`}
            </button>
            {previousStatus && (
              <button
                type="button"
                onClick={() => updateStatus(previousStatus, true)}
                disabled={loading}
                className="max-w-full whitespace-normal break-words border border-base-gray-400 px-4 py-2 text-left text-sm font-semibold disabled:opacity-50"
              >
                {loading ? "Actualizando…" : `Retroceder a ${ORDER_STATUS_LABELS[previousStatus]}`}
              </button>
            )}
          </div>
          <p className="mt-3 text-xs text-base-gray-500">
            Los cambios son secuenciales y quedan registrados en el historial. No modifican el
            estado ni la información del pago.
          </p>
        </>
      ) : previousStatus ? (
        <>
          <p className="mb-3 text-sm text-base-gray-600">
            Puedes retroceder un estado operativo para corregir un error.
          </p>
          <label className="mb-3 block text-sm">
            Motivo del retroceso (obligatorio)
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={500}
              rows={2}
              className="mt-1 w-full border border-base-gray-300 p-2"
              placeholder="Indica el motivo del cambio"
            />
          </label>
          {error && (
            <p role="alert" className="mb-3 text-sm text-red-700">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={() => updateStatus(previousStatus, true)}
            disabled={loading}
            className="max-w-full whitespace-normal break-words border border-base-gray-400 px-4 py-2 text-left text-sm font-semibold disabled:opacity-50"
          >
            {loading ? "Actualizando…" : `Retroceder a ${ORDER_STATUS_LABELS[previousStatus]}`}
          </button>
          <p className="mt-3 text-xs text-base-gray-500">
            El cambio queda registrado en el historial y no modifica el estado ni la información del pago.
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
