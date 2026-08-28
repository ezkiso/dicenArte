import Link from "next/link";
import Image from "next/image";
import { formatClp } from "@/lib/utils";

export interface ProductCardData {
  id: string;
  name: string;
  slug: string;
  priceClp: number;
  stock: number;
  imageUrl?: string;
}

// RF-05: productos con stock 0 muestran la etiqueta "Agotado" y no permiten compra.
export default function ProductCard({ product }: { product: ProductCardData }) {
  const agotado = product.stock <= 0;

  return (
    <Link
      href={`/tienda/${product.slug}`}
      className="group block border border-base-gray-200 transition-colors hover:border-base-black"
    >
      <div className="relative aspect-square w-full bg-base-gray-100">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-base-gray-400">
            Sin imagen
          </div>
        )}
        {agotado && (
          <span className="absolute left-2 top-2 bg-base-black px-2 py-1 text-xs font-semibold uppercase tracking-wide text-base-white">
            Agotado
          </span>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-sm text-base-black group-hover:underline">{product.name}</h3>
        <p className="mt-1 text-sm font-medium text-base-gray-600">
          {formatClp(product.priceClp)}
        </p>
      </div>
    </Link>
  );
}
