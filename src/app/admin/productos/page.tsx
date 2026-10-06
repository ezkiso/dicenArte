import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatClp } from "@/lib/utils";
import DeleteProductButton from "@/components/DeleteProductButton";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { category: true },
  });

  return (
    <div>
      <div className="mb-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-2xl">Productos</h1>
        <Link
          href="/admin/productos/nuevo"
          className="w-full bg-base-black px-4 py-2 text-center text-sm font-semibold text-base-white sm:w-auto"
        >
          + Nuevo producto
        </Link>
      </div>

      <div className="hidden overflow-x-auto md:block">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-base-gray-300 text-left">
            <th className="py-2">Nombre</th>
            <th className="py-2">Categoría</th>
            <th className="py-2">Precio</th>
            <th className="py-2">Stock</th>
            <th className="py-2"></th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-b border-base-gray-200">
              <td className="py-2">{p.name}</td>
              <td className="py-2 text-base-gray-500">{p.category.name}</td>
              <td className="py-2">{p.priceClp === null ? "Sin precio" : formatClp(p.priceClp)}</td>
              <td className="py-2">
                {p.stock === 0 ? (
                  <span className="text-base-gray-500">Agotado</span>
                ) : (
                  p.stock
                )}
              </td>
              <td className="py-2 text-right">
                <div className="flex justify-end gap-3">
                  <Link href={`/admin/productos/${p.id}`} className="text-sm hover:underline">
                    Editar
                  </Link>
                  <DeleteProductButton id={p.id} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      <div className="space-y-3 md:hidden">
        {products.map((product) => (
          <article key={product.id} className="min-w-0 border border-base-gray-200 p-4">
            <h2 className="break-words font-medium">{product.name}</h2>
            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
              <dt className="text-base-gray-500">Categoría</dt>
              <dd className="break-words text-right">{product.category.name}</dd>
              <dt className="text-base-gray-500">Precio</dt>
              <dd className="text-right">
                {product.priceClp === null ? "Sin precio" : formatClp(product.priceClp)}
              </dd>
              <dt className="text-base-gray-500">Stock</dt>
              <dd className="text-right">
                {product.stock === 0 ? "Agotado" : product.stock}
              </dd>
            </dl>
            <div className="mt-4 flex flex-wrap items-center justify-end gap-x-4 gap-y-2 border-t border-base-gray-200 pt-3">
              <Link href={`/admin/productos/${product.id}`} className="text-sm underline">
                Editar
              </Link>
              <DeleteProductButton id={product.id} />
            </div>
          </article>
        ))}
      </div>

      {products.length === 0 && (
        <p className="mt-6 text-base-gray-500">Aún no hay productos creados.</p>
      )}
    </div>
  );
}
