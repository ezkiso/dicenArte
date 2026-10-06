"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import CategoryTreeMenu, { type CategoryNode } from "@/components/CategoryTreeMenu";

export default function MobileMenu({ categories }: { categories: CategoryNode[] }) {
  const [open, setOpen] = useState(false);
  const [catalogoOpen, setCatalogoOpen] = useState(false);

  // Separar la categoría de mascotas del resto del catálogo.
  const mascotasCategory = categories.find(cat => cat.slug === "mascotas");
  const otherCategories = categories.filter(cat => cat.slug !== "mascotas");

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`flex h-10 w-10 flex-col items-center justify-center gap-1.5 border border-base-gray-300 bg-base-white ${
          open ? "fixed right-4 top-4 z-[60]" : "relative z-[60]"
        }`}
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
        <nav className="fixed inset-x-0 top-[85px] z-50 max-h-[70vh] overflow-y-auto border-t border-base-gray-200 bg-base-white shadow-lg">
          <ul className="divide-y divide-base-gray-200">
            <li>
              <Link href="/tienda" className="block px-4 py-3 font-medium" onClick={() => setOpen(false)}>
                Ver toda la tienda
              </Link>
            </li>
            <li className="px-4">
              <CategoryTreeMenu
                categories={otherCategories}
                mobile
                onNavigate={() => setOpen(false)}
              />
            </li>
            {mascotasCategory && (
              <li>
                <button
                  type="button"
                  aria-expanded={catalogoOpen}
                  onClick={() => setCatalogoOpen(!catalogoOpen)}
                  className="flex w-full items-center justify-between px-4 py-3 font-medium"
                >
                  Catálogo
                  <ChevronDown size={16} aria-hidden="true" className={`transition-transform ${catalogoOpen ? "rotate-180" : ""}`} />
                </button>
                {catalogoOpen && (
                  <div className="border-t border-base-gray-200 bg-base-gray-50 px-4">
                    <CategoryTreeMenu
                      categories={mascotasCategory.children}
                      mobile
                      onNavigate={() => setOpen(false)}
                    />
                  </div>
                )}
              </li>
            )}
            <li>
              <Link href="/servicios" className="block px-4 py-3" onClick={() => setOpen(false)}>
                Servicios
              </Link>
            </li>
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