import Link from "next/link";
import Logo from "@/components/Logo";
import MobileMenu, { type CategoryNode } from "@/components/MobileMenu";
import HeaderAuthLinks from "@/components/HeaderAuthLinks";
import { prisma } from "@/lib/prisma";

async function getCategoryTree(): Promise<CategoryNode[]> {
  const all = await prisma.category.findMany({ orderBy: { name: "asc" } });
  const byParent = new Map<string | null, CategoryNode[]>();

  for (const c of all) {
    const node: CategoryNode = { id: c.id, name: c.name, slug: c.slug, children: [] };
    const list = byParent.get(c.parentId) ?? [];
    list.push(node);
    byParent.set(c.parentId, list);
  }

  function attachChildren(node: CategoryNode) {
    node.children = byParent.get(node.id) ?? [];
    node.children.forEach(attachChildren);
  }

  const roots = byParent.get(null) ?? [];
  roots.forEach(attachChildren);
  return roots;
}

export default async function Header() {
  const categories = await getCategoryTree();

  // "Tienda" muestra directamente los TIPOS de producto (los hijos de cada
  // categoría raíz). La categoría raíz (ej. "Mascotas") ya no aparece como
  // ítem propio en el navbar, solo agrupa internamente.
  const productTypes = categories.flatMap((root) =>
    root.children.length > 0 ? root.children : [root]
  );

  return (
    <header className="relative border-b border-base-gray-200 bg-base-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Logo />

        <nav className="hidden items-center gap-6 text-sm md:flex">
          <div className="group relative">
            <Link href="/tienda" className="flex items-center gap-1">
              Tienda
            </Link>
            {productTypes.length > 0 && (
              <div className="invisible absolute left-0 top-full z-40 min-w-56 border border-base-gray-200 bg-base-white opacity-0 shadow-lg transition-opacity group-hover:visible group-hover:opacity-100">
                {productTypes.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/tienda?categoria=${cat.slug}`}
                    className="block px-4 py-2 hover:bg-base-gray-50"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <a href="#footer">Contacto</a>
        </nav>

        <div className="flex items-center gap-4">
          <HeaderAuthLinks />
          <MobileMenu categories={categories} />
        </div>
      </div>
    </header>
  );
}