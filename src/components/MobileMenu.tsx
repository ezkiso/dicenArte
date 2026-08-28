"use client";

import { useState } from "react";
import Link from "next/link";

export interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  children: CategoryNode[];
}

export default function MobileMenu({ categories }: { categories: CategoryNode[] }) {
  const [open, setOpen] = useState(false);

  // "Tienda" muestra directamente los TIPOS de producto (los hijos de cada
  // categoría raíz). La categoría raíz (ej. "Mascotas") ya no se muestra
  // como ítem clicable, solo agrupa.
  const productTypes = categories.flatMap((root) =>
    root.children.length > 0 ? root.children : [root]
  );

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="relative z-[60] flex h-10 w-10 flex-col items-center justify-center gap-1.5 border border-base-gray-300 bg-base-white"
      >
        <span
          className={`h-0.5 w-5 bg-base-black transition-transform ${
            open ? "translate-y-2 rotate-45" : ""
          }`}
        />
        <span className={`h-0.5 w-5 bg-base-black transition-opacity ${open ? "opacity-0" : ""}`} />
        <span
          className={`h-0.5 w-5 bg-base-black transition-transform ${
            open ? "-translate-y-2 -rotate-45" : ""
          }`}
        />
      </button>

      {open && (
        <nav className="fixed inset-x-0 top-[73px] z-50 max-h-[70vh] overflow-y-auto border-t border-base-gray-200 bg-base-white shadow-lg">
          <ul className="divide-y divide-base-gray-200">
            <li>
              <Link href="/tienda" className="block px-4 py-3 font-medium" onClick={() => setOpen(false)}>
                Ver toda la tienda
              </Link>
            </li>
            {productTypes.map((cat) => (
              <li key={cat.id}>
                <Link
                  href={`/tienda?categoria=${cat.slug}`}
                  className="block px-4 py-3"
                  onClick={() => setOpen(false)}
                >
                  {cat.name}
                </Link>
              </li>
            ))}
            <li>
              <a href="#footer" className="block px-4 py-3" onClick={() => setOpen(false)}>
                Contacto
              </a>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}