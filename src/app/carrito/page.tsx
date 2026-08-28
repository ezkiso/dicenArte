"use client";

import Link from "next/link";
import { useCartStore } from "@/lib/cartStore";
import { formatClp } from "@/lib/utils";

// RF-06: ver, modificar cantidades y eliminar ítems del carrito.
export default function CarritoPage() {
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const total = useCartStore((s) => s.totalClp());

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="mb-4 font-display text-2xl">Tu carrito está vacío</h1>
        <Link href="/tienda" className="underline">
          Ir a la tienda
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 font-display text-2xl">Carrito</h1>

      <ul className="divide-y divide-base-gray-200 border-y border-base-gray-200">
        {items.map((item) => (
          <li key={item.productId} className="flex items-center gap-4 py-4">
            <div className="flex-1">
              <Link href={`/tienda/${item.slug}`} className="font-medium hover:underline">
                {item.name}
              </Link>
              <p className="text-sm text-base-gray-500">{formatClp(item.priceClp)}</p>
            </div>

            <label className="sr-only" htmlFor={`qty-${item.productId}`}>
              Cantidad
            </label>
            <input
              id={`qty-${item.productId}`}
              type="number"
              min={1}
              max={item.stock}
              value={item.quantity}
              onChange={(e) =>
                updateQuantity(item.productId, Math.max(1, Number(e.target.value)))
              }
              className="w-16 border border-base-gray-300 px-2 py-1 text-center"
            />

            <p className="w-24 text-right font-medium">
              {formatClp(item.priceClp * item.quantity)}
            </p>

            <button
              onClick={() => removeItem(item.productId)}
              aria-label={`Eliminar ${item.name}`}
              className="text-base-gray-500 hover:text-base-black"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-lg font-semibold">Total: {formatClp(total)}</p>
        <Link
          href="/checkout"
          className="bg-base-black px-6 py-3 text-sm font-semibold text-base-white"
        >
          Ir a pagar
        </Link>
      </div>
    </div>
  );
}
