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
    <li key={node.id} className={depth > 0 ? "ml-3 border-l border-base-gray-200 pl-3" : ""}>
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
            {categories.map((root) => renderMenuNode(root, 0, () => setOpen(false)))}
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