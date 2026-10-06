import { prisma } from "@/lib/prisma";
import AdminProductForm from "@/components/AdminProductForm";

export default async function NewProductPage() {
  const categoryRoots = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { name: "asc" },
    include: {
      children: {
        orderBy: { name: "asc" },
        include: { children: { orderBy: { name: "asc" } } },
      },
    },
  });
  const categories = categoryRoots.flatMap((root) => root.children);

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl">Nuevo producto</h1>
      <AdminProductForm categories={categories} />
    </div>
  );
}
