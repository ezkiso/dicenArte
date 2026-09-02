import Link from "next/link";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import Logo from "@/components/Logo";
import MobileMenu, { type CategoryNode } from "@/components/MobileMenu";
import HeaderAuthLinks from "@/components/HeaderAuthLinks";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

const headingFont = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
});

const bodyFont = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});

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
  ["category-tree"],
  { revalidate: 300 }
);

function renderMenuNode(node: CategoryNode, depth = 0) {
  const isRoot = depth === 0;

  return (
    <div key={node.id} className={depth > 0 ? "ml-3 border-l border-base-gray-200 pl-3" : ""}>
      <Link
        href={`/tienda?categoria=${node.slug}`}
        className={
          isRoot
            ? "block font-display text-2xl leading-none text-base-black hover:text-base-gray-700"
            : "block py-1 text-sm font-medium text-base-gray-700 transition-colors hover:text-base-black"
        }
      >
        {node.name}
      </Link>

      {node.children.length > 0 && (
        <div className={isRoot ? "mt-3 space-y-2" : "mt-2 space-y-1"}>
          {node.children.map((child) => renderMenuNode(child, depth + 1))}
        </div>
      )}
    </div>
  );
}

export default async function Header() {
  const categories = await getCategoryTree();

  return (
    <header className={`relative border-b border-base-gray-200 bg-base-white ${headingFont.variable} ${bodyFont.variable}`}>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Logo />

        <nav className={`hidden items-center gap-6 text-sm md:flex ${bodyFont.className}`}>
          <div className="group relative">
            <Link href="/tienda" className="flex items-center gap-1 text-sm font-semibold tracking-[0.14em] text-base-black uppercase hover:text-base-gray-700">
              Tienda
            </Link>
            {categories.length > 0 && (
              <div className="invisible absolute left-0 top-full z-40 min-w-[22rem] border border-base-gray-200 bg-base-white p-4 opacity-0 shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-200 group-hover:visible group-hover:opacity-100">
                <div className="space-y-4">
                  {categories.map((root) => renderMenuNode(root))}
                </div>
              </div>
            )}
          </div>

          <a href="#footer" className="text-sm font-semibold tracking-[0.14em] text-base-black uppercase hover:text-base-gray-700">
            Contacto
          </a>
        </nav>

        <div className="flex items-center gap-4">
          <HeaderAuthLinks />
          <MobileMenu categories={categories} />
        </div>
      </div>
    </header>
  );
}