import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import FeaturedProductsCarousel from "@/components/FeaturedProductsCarousel";
import ProductCard from "@/components/ProductCard";
import Image from "next/image";
import { getSignedImageUrl } from "@/lib/s3";

export const metadata: Metadata = {
  title: { absolute: "DicenArte" },
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  description:
    "Cuadros de mascotas personalizados y servicios para mascotas en Chile: Cat-Sister, hospedaje de mascotas y paseo de mascotas.",
  keywords: [
    "cuadros de mascotas personalizados",
    "arte personalizado para mascotas",
    "servicios para mascotas",
    "Cat-Sister",
    "hospedaje de mascotas",
    "paseo de mascotas",
  ],
  openGraph: {
    title: "DicenArte",
    description:
      "Cuadros de mascotas personalizados y servicios para mascotas: Cat-Sister, hospedaje de mascotas y paseo de mascotas.",
  },
  twitter: {
    title: "DicenArte",
    description:
      "Cuadros de mascotas personalizados y servicios para mascotas: Cat-Sister, hospedaje de mascotas y paseo de mascotas.",
  },
};

export const dynamic = "force-dynamic";

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
      <section className="border-b border-base-gray-200 bg-base-page">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <h1 className="flex justify-center">
            <Image
              src="/logo.jpeg"
              alt="DicenArte, arte y diseño"
              width={192}
              height={192}
              priority
              className="h-36 w-36 rounded-full object-cover sm:h-48 sm:w-48"
            />
          </h1>
          <div className="mx-auto mt-6 max-w-3xl space-y-4 text-center text-base leading-7 text-base-gray-700">
            <p>
              Somos un equipo de artistas y amantes de los animales apasionados por celebrar la vida
              de tus mascotas. Nos dedicamos a inmortalizar a esos compañeros incondicionales a través
              de productos personalizados únicos, llenos de arte y sentimiento.
            </p>
            <p>
              Además, entendemos lo importante que es su bienestar cuando no estás en casa. Por eso,
              ofrecemos servicios profesionales de visita, alimentación y compañía a domicilio,
              cuidando a tus mascotas con la misma dedicación, cariño y responsabilidad como si fueran
              nuestras.
            </p>
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

      <section className="border-t border-base-gray-200 bg-base-page">
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
