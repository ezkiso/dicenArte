import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import FeaturedProductsCarousel from "@/components/FeaturedProductsCarousel";
import ProductCard from "@/components/ProductCard";
import { getSignedImageUrl } from "@/lib/s3";
import { Pickaxe } from "lucide-react";

export const metadata: Metadata = {
  title: "Cojines personalizados y bolsas de género",
  description:
    "Cojines personalizados y bolsas de género en Chile. Regalos con fotos, estampados a pedido y envío nacional desde Dicen Arte.",
  keywords: [
    "cojines personalizados Chile",
    "bolsas personalizadas Chile",
    "regalos con fotos",
    "estampados a pedido",
    "cojines estampados 40x40",
  ],
};

export const revalidate = 60; // RNF-09: SSG con revalidación para rendimiento

// RF-03: home con vitrina de destacados y acceso directo a Tienda/Carrito/Login.
export default async function HomePage() {
  const featured = await prisma.product.findMany({
    take: 8,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      priceClp: true,
      stock: true,
      images: {
        take: 1,
        orderBy: { order: "asc" },
        select: { bucketKey: true },
      },
    },
  });

  const productsWithUrls = await Promise.all(
    featured.map(async (p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      priceClp: p.priceClp,
      stock: p.stock,
      imageUrl: p.images[0] ? await getSignedImageUrl(p.images[0].bucketKey) : undefined,
    }))
  );

  return (
    <div>
      <section className="border-b border-base-gray-200 bg-base-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-6 px-4 py-20">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-4xl leading-tight text-base-black sm:text-5xl">
              En construcción
            </h1>
            <Pickaxe size={48} strokeWidth={1.5} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-base-gray-500">
              Colección destacada
            </p>
            <h1 className="mt-2 font-display text-3xl text-base-black sm:text-4xl">Destacados</h1>
          </div>
        </div>
        <FeaturedProductsCarousel products={productsWithUrls} />
      </section>

      <section className="border-t border-base-gray-200 bg-base-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="mb-8 font-display text-3xl text-base-black sm:text-4xl">
            Últimos productos publicados
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {productsWithUrls.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {productsWithUrls.length === 0 && (
            <p className="text-base-gray-500">Aún no hay productos publicados.</p>
          )}
        </div>
      </section>
    </div>
  );
}
