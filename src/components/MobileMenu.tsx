"use client";

import { useState } from "react";
import Link from "next/link";

export interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  children: CategoryNode[];
}

function renderMenuNode(node: CategoryNode, depth = 0, onNavigate: () => void) {
  const isRoot = depth === 0;

  return (
    <li key={node.id} className={depth > 0 ? "ml-3 pl-3" : ""}>
      <Link
        href={`/tienda?categoria=${node.slug}`}
        className={
          isRoot
            ? "block px-4 py-3 font-display text-2xl text-base-black"
            : "block px-4 py-2 text-sm font-medium text-base-gray-700"
        }
        onClick={onNavigate}
      >
        {node.name}
      </Link>

      {node.children.length > 0 && (
        <ul className={isRoot ? "mt-2 space-y-1" : "mt-1 space-y-1"}>
          {node.children.map((child) => renderMenuNode(child, depth + 1, onNavigate))}
        </ul>
      )}
    </li>
  );
}

export default function MobileMenu({ categories }: { categories: CategoryNode[] }) {
  const [open, setOpen] = useState(false);
  const [mascotasOpen, setMascotasOpen] = useState(false);

  // Separar categoría "Mascotas" del resto
  const mascotasCategory = categories.find(cat => cat.slug === "mascotas");
  const otherCategories = categories.filter(cat => cat.slug !== "mascotas");

  return (
    <div className="md:hidden">
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
            {otherCategories.map((root) => renderMenuNode(root, 0, () => setOpen(false)))}
            {mascotasCategory && (
              <li>
                <button
                  onClick={() => setMascotasOpen(!mascotasOpen)}
                  className="flex w-full items-center justify-between px-4 py-3 font-medium"
                >
                  {mascotasCategory.name}
                  <span className={`transform transition-transform ${mascotasOpen ? "rotate-180" : ""}`}>
                    ▼
                  </span>
                </button>
                {mascotasOpen && (
                  <ul className="divide-y divide-base-gray-200">
                    {mascotasCategory.children.map((child) => renderMenuNode(child, 1, () => setOpen(false)))}
                  </ul>
                )}
              </li>
            )}
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