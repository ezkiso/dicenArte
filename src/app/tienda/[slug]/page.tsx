import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSignedImageUrl } from "@/lib/s3";
import { formatClp } from "@/lib/utils";
import AddToCartButton from "@/components/AddToCartButton";

export const revalidate = 60;

const getProduct = cache(async (slug: string) => {
  const product = await unstable_cache(
    () =>
      prisma.product.findUnique({
        where: { slug },
        include: { images: { orderBy: { order: "asc" } }, category: true },
      }),
    ["product-by-slug", slug],
    { revalidate: 60 }
  )();
  if (!product) return null;

  const images = await Promise.all(
    product.images.map((img) => getSignedImageUrl(img.bucketKey))
  );
  return { product, images };
});

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const data = await getProduct(params.slug);
  if (!data) return {};
  return {
    title: data.product.name,
    description: data.product.description.slice(0, 160),
    openGraph: {
      title: data.product.name,
      description: data.product.description.slice(0, 160),
      images: data.images[0] ? [{ url: data.images[0] }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const data = await getProduct(params.slug);
  if (!data) notFound();
  const { product, images } = data;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid gap-10 md:grid-cols-2">
        <div className="relative aspect-square w-full bg-base-gray-100">
          {images[0] ? (
            <Image
              src={images[0]}
              alt={product.name}
              fill
              priority
              unoptimized
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-base-gray-400">
              Sin imagen
            </div>
          )}
          {(product.stock <= 0 || product.priceClp === null) && (
            <span className="absolute left-3 top-3 bg-base-black px-2 py-1 text-xs font-semibold uppercase text-base-white">
              {product.stock <= 0 ? "Vendido" : "Precio por definir"}
            </span>
          )}
        </div>

        <div>
          <p className="text-sm uppercase tracking-wide text-base-gray-500">
            {product.category.name}
          </p>
          <h1 className="mt-1 font-display text-3xl">{product.name}</h1>
          <p className="mt-4 text-2xl font-semibold">
            {product.priceClp === null
              ? product.stock <= 0 ? "Vendido" : "Precio por definir"
              : formatClp(product.priceClp)}
          </p>
          <p className="mt-6 whitespace-pre-line text-base-gray-700">{product.description}</p>

          {product.isCustom && (
            <p className="mt-4 border border-base-gray-300 bg-base-gray-50 p-3 text-xs text-base-gray-600">
              Producto personalizado: no tiene derecho a retracto de 10 días según la Ley del
              Consumidor.
            </p>
          )}

          <div className="mt-6">
            <AddToCartButton
              product={{
                productId: product.id,
                name: product.name,
                slug: product.slug,
                priceClp: product.priceClp ?? 0,
                stock: product.stock,
                imageUrl: images[0],
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
