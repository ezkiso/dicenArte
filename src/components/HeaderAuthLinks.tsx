"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/lib/cartStore";

export default function HeaderAuthLinks() {
  const { data: session } = useSession();
  const itemCount = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0));

  return (
    <div className="flex items-center gap-4 text-sm">
      <Link href="/carrito" aria-label="Carrito de compras" className="relative flex items-center">
        <ShoppingCart size={22} strokeWidth={1.5} />
        {itemCount > 0 && (
          <span className="absolute -right-2 -top-2 inline-flex h-4 w-4 items-center justify-center rounded-full bg-base-black text-[10px] text-base-white">
            {itemCount}
          </span>
        )}
      </Link>

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