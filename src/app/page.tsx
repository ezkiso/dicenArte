import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
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
    include: { images: { take: 1, orderBy: { order: "asc" } } },
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
        <h2 className="mb-6 font-display text-2xl">Destacados</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {productsWithUrls.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        {productsWithUrls.length === 0 && (
          <p className="text-base-gray-500">Aún no hay productos publicados.</p>
        )}
      </section>
    </div>
  );
}
