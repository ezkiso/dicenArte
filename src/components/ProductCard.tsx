import Link from "next/link";
import Image from "next/image";
import { formatClp } from "@/lib/utils";

export interface ProductCardData {
  id: string;
  name: string;
  slug: string;
  priceClp: number | null;
  stock: number;
  imageUrl?: string;
}

// RF-05: productos con stock 0 muestran la etiqueta "Agotado" y no permiten compra.
export default function ProductCard({ product }: { product: ProductCardData }) {
  const agotado = product.stock <= 0;
  const vendido = agotado && product.priceClp === null;

  return (
    <article className="group border border-base-gray-200 transition-colors hover:border-base-black">
      <div className="relative aspect-square w-full bg-base-gray-100">
        {product.imageUrl ? (
          <Link
            href={`/tienda/${product.slug}`}
            aria-label={`Ver producto: ${product.name}`}
            className="absolute inset-0 block h-full w-full"
          >
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              unoptimized
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          </Link>
        ) : (
          <div className="flex h-full items-center justify-center text-base-gray-400">
            Sin imagen
          </div>
        )}
        {agotado && (
          <span className="absolute left-2 top-2 bg-base-black px-2 py-1 text-xs font-semibold uppercase tracking-wide text-base-white">
            {vendido ? "Vendido" : "Agotado"}
          </span>
        )}
      </div>
      <div className="p-3">
        <Link href={`/tienda/${product.slug}`} className="text-sm text-base-black group-hover:underline">
          {product.name}
        </Link>
        <p className="mt-1 text-sm font-medium text-base-gray-600">
          {product.priceClp === null
            ? agotado ? "Vendido" : "Precio por definir"
            : formatClp(product.priceClp)}
        </p>
      </div>
    </article>
  );
}
