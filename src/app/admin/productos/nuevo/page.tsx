import { prisma } from "@/lib/prisma";
import AdminProductForm from "@/components/AdminProductForm";

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl">Nuevo producto</h1>
      <AdminProductForm categories={categories} />
    </div>
  );
}
