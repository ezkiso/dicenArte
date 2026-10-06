"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatClp } from "@/lib/utils";

export interface FeaturedProduct {
    id: string;
    name: string;
    slug: string;
    priceClp: number | null;
    stock: number;
    imageUrl?: string;
}

export default function FeaturedProductsCarousel({
    products,
}: {
    products: FeaturedProduct[];
}) {
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        if (products.length < 2) return;

        const timer = window.setInterval(() => {
        setActiveIndex((current) => (current + 1) % products.length);
        }, 3000);

        return () => window.clearInterval(timer);
    }, [products.length]);

    if (products.length === 0) {
        return <p className="text-base-gray-500">Aún no hay productos publicados.</p>;
    }

    const showPrevious = () => {
        setActiveIndex((current) => (current - 1 + products.length) % products.length);
    };

    const showNext = () => {
        setActiveIndex((current) => (current + 1) % products.length);
    };

    return (
        <div className="relative mx-auto w-full max-w-6xl">
        <div className="overflow-hidden border border-base-gray-200 bg-base-page">
            <div
            className="flex transition-transform duration-500 ease-out motion-reduce:transition-none"
            style={{ transform: `translateX(-${activeIndex * 100}%)` }}
            aria-live="polite"
            >
            {products.map((product, index) => (
                <div key={product.id} className="min-w-full">
                <Link
                    href={`/tienda/${product.slug}`}
                    className="group block focus-visible:outline-none"
                    tabIndex={index === activeIndex ? 0 : -1}
                >
                    <div className="relative aspect-[4/2] w-full bg-base-gray-350 sm:aspect-[16/4]">
                    {product.imageUrl ? (
                        <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        priority={index === 0}
                        unoptimized
                        sizes="100vw"
                        className="object-contain transition-transform duration-500 group-hover:scale-[1.02] motion-reduce:transition-none"
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center text-base-gray-400">
                        Sin imagen
                        </div>
                    )}
                    </div>
                    <div className="flex items-baseline justify-between gap-4 border-t border-base-gray-200 bg-base-page px-4 py-4 sm:px-6">
                    <h3 className="font-display text-xl text-base-black group-hover:underline sm:text-2xl">
                        {product.name}
                    </h3>
                    <p className="shrink-0 text-sm font-semibold text-base-gray-600 sm:text-base">
                        {product.priceClp === null
                            ? product.stock <= 0 ? "Vendido" : "Precio por definir"
                            : formatClp(product.priceClp)}
                    </p>
                    </div>
                </Link>
                </div>
            ))}
            </div>
        </div>

        {products.length > 1 && (
            <>
            <button
                type="button"
                onClick={showPrevious}
                aria-label="Producto destacado anterior"
                className="absolute left-3 top-[calc(50%-1.5rem)] flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-base-gray-300 bg-base-page/95 text-base-black shadow-sm transition-colors hover:bg-base-black hover:text-base-white"
            >
                <ChevronLeft size={20} aria-hidden="true" />
            </button>
            <button
                type="button"
                onClick={showNext}
                aria-label="Producto destacado siguiente"
                className="absolute right-3 top-[calc(50%-1.5rem)] flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-base-gray-300 bg-base-page/95 text-base-black shadow-sm transition-colors hover:bg-base-black hover:text-base-white"
            >
                <ChevronRight size={20} aria-hidden="true" />
            </button>
            <div className="mt-4 flex justify-center gap-2" aria-label="Seleccionar producto destacado">
                {products.map((product, index) => (
                <button
                    key={product.id}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    aria-label={`Ver ${product.name}`}
                    aria-current={index === activeIndex ? "true" : undefined}
                    className={`h-2 w-2 rounded-full border transition-colors ${
                    index === activeIndex
                        ? "border-base-black bg-base-black"
                        : "border-base-gray-400 bg-base-page hover:bg-base-gray-300"
                    }`}
                />
                ))}
            </div>
            </>
        )}
        </div>
    );
}