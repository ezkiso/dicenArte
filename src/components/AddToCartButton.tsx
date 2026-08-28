"use client";

import { useState } from "react";
import { useCartStore } from "@/lib/cartStore";
import type { CartItem } from "@/lib/cartStore";

// RF-06: agregar productos al carrito. RF-05: deshabilitado si está agotado.
export default function AddToCartButton({ product }: { product: Omit<CartItem, "quantity"> }) {
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);
  const agotado = product.stock <= 0;

  if (agotado) {
    return (
      <button
        disabled
        className="w-full cursor-not-allowed border border-base-gray-300 bg-base-gray-100 px-6 py-3 text-sm font-semibold text-base-gray-400"
      >
        Agotado
      </button>
    );
  }

  return (
    <button
      onClick={() => {
        addItem(product, 1);
        setAdded(true);
        setTimeout(() => setAdded(false), 1500);
      }}
      className="w-full bg-base-black px-6 py-3 text-sm font-semibold text-base-white transition-colors hover:bg-base-gray-700"
    >
      {added ? "Agregado ✓" : "Agregar al carrito"}
    </button>
  );
}
