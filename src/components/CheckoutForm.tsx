"use client";

import { useState } from "react";
import { useCartStore } from "@/lib/cartStore";
import { formatClp } from "@/lib/utils";

// RF-07: derecho a retracto. RF-08: garantía legal y T&C.
// RF-12: consentimiento de datos, ahora aquí mismo porque ya no hay registro
// previo (compra de invitado). RF-09: el pago ocurre en Webpay.
export default function CheckoutForm() {
  const items = useCartStore((s) => s.items);
  const total = useCartStore((s) => s.totalClp());
  const clear = useCartStore((s) => s.clear);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [retracto, setRetracto] = useState(false);
  const [dataConsent, setDataConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!retracto || !dataConsent) {
      setError("Debes aceptar ambas condiciones para continuar.");
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
          customerName: name,
          customerEmail: email,
          customerPhone: phone || undefined,
          shippingAddress: address,
          retractoAceptado: retracto,
          dataConsent,
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium">
            Nombre completo
          </label>
          <input
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-base-gray-300 p-3 text-sm"
          />
        </div>
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            Correo
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-base-gray-300 p-3 text-sm"
          />
        </div>
      </div>

      <div>
        <label htmlFor="phone" className="mb-1 block text-sm font-medium">
          Teléfono (opcional)
        </label>
        <input
          id="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full border border-base-gray-300 p-3 text-sm"
        />
      </div>

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
          según la Ley del Consumidor, ya que se confeccionan según tus especificaciones.
        </p>
        <p className="mt-2 text-base-gray-700">
          Aplica <strong>Garantía Legal de 6 meses</strong>. Revisa los{" "}
          <a href="/legal" target="_blank" className="underline">
            Términos y Condiciones
          </a>
          .
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
            Acepto que este pedido, al ser personalizado, no tiene derecho a retracto, y he
            leído la Garantía Legal y los Términos y Condiciones.
          </span>
        </label>

        <label className="mt-3 flex items-start gap-2">
          <input
            type="checkbox"
            checked={dataConsent}
            onChange={(e) => setDataConsent(e.target.checked)}
            className="mt-1"
            required
          />
          <span>
            Autorizo el tratamiento de mis datos (nombre, correo, teléfono, dirección)
            exclusivamente para gestionar este pedido y su despacho.
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