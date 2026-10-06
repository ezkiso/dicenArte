import Link from "next/link";
import Logo from "@/components/Logo";
import MobileMenu from "@/components/MobileMenu";
import CategoryTreeMenu, { type CategoryNode } from "@/components/CategoryTreeMenu";
import HeaderAuthLinks from "@/components/HeaderAuthLinks";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { ChevronDown } from "lucide-react";

async function getCategoryTree(): Promise<CategoryNode[]> {
  return getCachedCategoryTree();
}

const getCachedCategoryTree = unstable_cache(
  async (): Promise<CategoryNode[]> => {
  let all;
  try {
    all = await prisma.category.findMany({ orderBy: { name: "asc" } });
  } catch (error) {
    console.error("No se pudieron cargar las categorías del menú.", error);
    return [];
  }
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
  },
  ["category-tree-v2"],
  { revalidate: 300 }
);

export default async function Header() {
  const categories = await getCategoryTree();
  
  // Separar la categoría de mascotas del resto del catálogo.
  const mascotasCategory = categories.find(cat => cat.slug === "mascotas");
  const otherCategories = categories.filter(cat => cat.slug !== "mascotas");

  return (
    <header className="relative border-b border-base-gray-200 bg-base-page">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Logo />

        <nav className="hidden items-center gap-6 text-sm lg:flex">
          <div className="group relative">
            <Link href="/tienda" className="flex items-center gap-1 text-sm font-semibold tracking-[0.14em] text-base-black uppercase hover:text-base-gray-700">
              Tienda
            </Link>
            {otherCategories.length > 0 && (
              <div className="invisible absolute left-0 top-full z-40 min-w-[22rem] border border-base-gray-200 bg-base-white p-3 opacity-0 shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-200 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                <CategoryTreeMenu categories={otherCategories} />
              </div>
            )}
          </div>

          {mascotasCategory && (
            <div className="group relative">
              <Link 
                href={`/tienda?categoria=${mascotasCategory.slug}`} 
                className="flex items-center gap-1 text-sm font-semibold tracking-[0.14em] text-base-black uppercase hover:text-base-gray-700"
              >
                Catálogo
                <ChevronDown size={14} aria-hidden="true" className="transition-transform group-hover:rotate-180" />
              </Link>
              {mascotasCategory.children.length > 0 && (
                <div className="invisible absolute left-1/2 top-full z-40 min-w-[18rem] -translate-x-1/2 border border-base-gray-200 bg-base-white p-3 opacity-0 shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-200 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                  <CategoryTreeMenu categories={mascotasCategory.children} />
                </div>
              )}
            </div>
          )}

          <Link href="/servicios" className="text-sm font-semibold tracking-[0.14em] text-base-black uppercase hover:text-base-gray-700">
            Servicios
          </Link>

          <a href="#footer" className="text-sm font-semibold tracking-[0.14em] text-base-black uppercase hover:text-base-gray-700">
            Contacto
          </a>
        </nav>

        <div className="flex items-center gap-4">
          <HeaderAuthLinks />
          <div className="lg:hidden">
            <MobileMenu categories={categories} />
          </div>
        </div>
      </div>
    </header>
  );
}