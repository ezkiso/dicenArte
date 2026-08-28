"use client";

import { useRef, useState } from "react";
import { useCartStore } from "@/lib/cartStore";
import { formatClp } from "@/lib/utils";

// RF-07: aviso de derecho a retracto con checkbox obligatorio antes de pagar.
// RF-08: se muestra también la referencia a garantía legal y T&C.
// RF-09: el pago en sí ocurre en Webpay; aquí solo se crea la orden y se
// redirige — el formulario de tarjeta nunca toca este servidor.
export default function CheckoutForm() {
  const items = useCartStore((s) => s.items);
  const total = useCartStore((s) => s.totalClp());
  const clear = useCartStore((s) => s.clear);

  const [address, setAddress] = useState("");
  const [retracto, setRetracto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!retracto) {
      setError("Debes aceptar la política de derecho a retracto para continuar.");
      return;
    }
    if (address.trim().length < 10) {
      setError("Ingresa una dirección de despacho completa.");
      return;
    }

    setLoading(true);
    try {
      const orderRes = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingAddress: address,
          retractoAceptado: retracto,
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        }),
      });

      if (!orderRes.ok) {
        const data = await orderRes.json().catch(() => ({}));
        throw new Error(data.error ?? "No se pudo crear la orden.");
      }
      const { orderId } = await orderRes.json();

      const webpayRes = await fetch("/api/webpay/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      if (!webpayRes.ok) throw new Error("No se pudo iniciar el pago con Webpay.");

      const { url, token } = await webpayRes.json();
      clear();

      // Webpay espera un POST con el parámetro token_ws al `url` entregado.
      const form = document.createElement("form");
      form.method = "POST";
      form.action = url;
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = "token_ws";
      input.value = token;
      form.appendChild(input);
      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
      setLoading(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="address" className="mb-1 block text-sm font-medium">
          Dirección de despacho
        </label>
        <textarea
          id="address"
          required
          minLength={10}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full border border-base-gray-300 p-3 text-sm"
          rows={3}
        />
      </div>

      <div className="border border-base-gray-300 bg-base-gray-50 p-4 text-sm">
        <p className="font-semibold">Antes de continuar:</p>
        <p className="mt-1 text-base-gray-700">
          Los productos personalizados <strong>no tienen derecho a retracto de 10 días</strong>{" "}
          según lo dispuesto en la Ley N° 19.496 sobre Protección de los Derechos de los
          Consumidores, dado que son confeccionados especialmente según las especificaciones
          del comprador.
        </p>
        <p className="mt-2 text-base-gray-700">
          Aplica la <strong>Garantía Legal de 6 meses</strong> por defectos de fabricación. Revisa
          los{" "}
          <a href="/legal" target="_blank" className="underline">
            Términos y Condiciones completos
          </a>
          , incluyendo costos y plazos de envío.
        </p>
        <label className="mt-3 flex items-start gap-2">
          <input
            type="checkbox"
            checked={retracto}
            onChange={(e) => setRetracto(e.target.checked)}
            className="mt-1"
            required
          />
          <span>
            Acepto que este pedido, al ser personalizado, no tiene derecho a retracto de 10
            días, y he leído la Garantía Legal y los Términos y Condiciones.
          </span>
        </label>
      </div>

      {error && <p className="text-sm text-red-700">{error}</p>}

      <div className="flex items-center justify-between border-t border-base-gray-200 pt-4">
        <p className="text-lg font-semibold">Total: {formatClp(total)}</p>
        <button
          type="submit"
          disabled={loading || items.length === 0}
          className="bg-base-black px-6 py-3 text-sm font-semibold text-base-white disabled:opacity-50"
        >
          {loading ? "Redirigiendo a Webpay…" : "Pagar con Webpay"}
        </button>
      </div>
    </form>
  );
}
