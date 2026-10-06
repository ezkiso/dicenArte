import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminProductForm from "@/components/AdminProductForm";
import ProductImageUploader from "@/components/ProductImageUploader";
import { getSignedImageUrl } from "@/lib/s3";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id: params.id }, include: { images: true } }),
    prisma.category.findMany({
      where: { parentId: null },
      orderBy: { name: "asc" },
      include: {
        children: {
          orderBy: { name: "asc" },
          include: { children: { orderBy: { name: "asc" } } },
        },
      },
    }),
  ]);

  if (!product) notFound();

  const images = await Promise.all(
    product.images.map(async (img) => ({
      id: img.id,
      url: await getSignedImageUrl(img.bucketKey),
    }))
  );

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl">Editar producto</h1>
      <AdminProductForm
        categories={categories.flatMap((root) => root.children)}
        initial={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          priceClp: product.priceClp,
          stock: product.stock,
          isCustom: product.isCustom,
          categoryId: product.categoryId,
        }}
      />

      <div className="mt-10 max-w-xl border-t border-base-gray-200 pt-6">
        <h2 className="mb-3 font-display text-lg">Imágenes</h2>
        <ProductImageUploader productId={product.id} existingImages={images} />
      </div>
    </div>
  );
}
