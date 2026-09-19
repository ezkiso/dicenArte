"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { ShoppingCart } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useCartStore } from "@/lib/cartStore";
import { formatClp } from "@/lib/utils";

export default function HeaderAuthLinks() {
  const { data: session } = useSession();
  const items = useCartStore((s) => s.items);
  const itemCount = items.reduce((n, i) => n + i.quantity, 0);
  const total = useCartStore((s) => s.totalClp());
  const [previewOpen, setPreviewOpen] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!previewOpen) return;

    function handleOutsideClick(event: MouseEvent) {
      if (previewRef.current && !previewRef.current.contains(event.target as Node)) {
        setPreviewOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [previewOpen]);

  return (
    <div className="flex items-center gap-4 text-sm">
      <div ref={previewRef} className="relative">
        <button
          type="button"
          aria-label="Abrir vista previa del carrito"
          aria-expanded={previewOpen}
          onClick={() => setPreviewOpen((open) => !open)}
          className="relative flex items-center"
        >
          <ShoppingCart size={22} strokeWidth={1.5} />
          {itemCount > 0 && (
            <span className="absolute -right-2 -top-2 inline-flex h-4 w-4 items-center justify-center rounded-full bg-base-black text-[10px] text-base-white">
              {itemCount}
            </span>
          )}
        </button>

        {previewOpen && (
          <div className="absolute right-0 top-full z-50 mt-4 w-[min(22rem,calc(100vw-2rem))] border border-base-gray-200 bg-base-white p-4 shadow-[0_20px_40px_rgba(0,0,0,0.12)]">
            <div className="mb-4 flex items-center justify-between border-b border-base-gray-200 pb-3">
              <h2 className="font-display text-xl">Tu carrito</h2>
              <span className="text-xs text-base-gray-500">
                {itemCount} {itemCount === 1 ? "producto" : "productos"}
              </span>
            </div>

            {items.length === 0 ? (
              <p className="py-4 text-sm text-base-gray-500">Tu carrito está vacío.</p>
            ) : (
              <>
                <ul className="max-h-64 divide-y divide-base-gray-200 overflow-y-auto">
                  {items.map((item) => (
                    <li key={item.productId} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="h-14 w-14 shrink-0 overflow-hidden bg-base-gray-100">
                        {item.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[10px] text-base-gray-400">
                            Sin imagen
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/tienda/${item.slug}`}
                          onClick={() => setPreviewOpen(false)}
                          className="block truncate text-sm font-medium hover:underline"
                        >
                          {item.name}
                        </Link>
                        <p className="mt-1 text-xs text-base-gray-500">
                          {item.quantity} x {formatClp(item.priceClp)}
                        </p>
                      </div>
                      <p className="text-right text-sm font-medium">
                        {formatClp(item.priceClp * item.quantity)}
                      </p>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 border-t border-base-gray-200 pt-3">
                  <div className="mb-3 flex items-center justify-between font-semibold">
                    <span>Total</span>
                    <span>{formatClp(total)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center text-sm font-semibold">
                    <Link
                      href="/carrito"
                      onClick={() => setPreviewOpen(false)}
                      className="border border-base-black px-3 py-2"
                    >
                      Ver carrito
                    </Link>
                    <Link
                      href="/checkout"
                      onClick={() => setPreviewOpen(false)}
                      className="bg-base-black px-3 py-2 text-base-white"
                    >
                      Ir a pagar
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Botón "Ingresar" removido a propósito: el login solo se accede
          escribiendo /login directamente (solo lo usa el admin). */}
      {session?.user?.role === "ADMIN" && (
        <div className="flex items-center gap-3">
          <Link href="/admin" className="underline">
            Panel admin
          </Link>
          <button onClick={() => signOut({ callbackUrl: "/" })} className="underline">
            Salir
          </button>
        </div>
      )}
    </div>
  );
}