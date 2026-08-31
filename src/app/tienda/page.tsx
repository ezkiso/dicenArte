import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/ProductCard";
import { getSignedImageUrl } from "@/lib/s3";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tienda | Cojines y bolsas personalizados",
  description:
    "Descubre cojines personalizados y bolsas de género personalizadas en Chile, con estampados a pedido y diseños exclusivos para regalar.",
  keywords: [
    "cojines personalizados Chile",
    "bolsas personalizadas Chile",
    "regalos con fotos Santiago",
    "estampados a pedido",
    "cojines estampados 40x40",
    "bolsas de género personalizadas",
  ],
};

// RF-04: catálogo filtrable por categoría. RF-05: agotados se muestran igual.
export default async function TiendaPage({
  searchParams,
}: {
  searchParams: { categoria?: string };
}) {
  const category = searchParams.categoria
    ? await prisma.category.findUnique({ where: { slug: searchParams.categoria } })
    : null;

  const products = await prisma.product.findMany({
    where: category ? { categoryId: category.id } : undefined,
    orderBy: { createdAt: "desc" },
    include: { images: { take: 1, orderBy: { order: "asc" } } },
  });

  const productsWithUrls = await Promise.all(
    products.map(async (p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      priceClp: p.priceClp,
      stock: p.stock,
      imageUrl: p.images[0] ? await getSignedImageUrl(p.images[0].bucketKey) : undefined,
    }))
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-8 font-display text-3xl">
        {category ? category.name : "Toda la tienda"}
      </h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {productsWithUrls.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      {productsWithUrls.length === 0 && (
        <p className="text-base-gray-500">No hay productos en esta categoría todavía.</p>
      )}
    </div>
  );
}
