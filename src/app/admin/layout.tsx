import Link from "next/link";

// RF-18: layout compartido del panel de administración.
// El acceso ya está restringido a rol ADMIN por middleware.ts.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-6xl min-w-0 flex-col gap-6 px-4 py-6 sm:py-10 lg:flex-row lg:gap-8">
      <aside className="w-full min-w-0 border-b border-base-gray-200 pb-4 lg:w-48 lg:flex-shrink-0 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6">
        <h2 className="mb-4 font-display text-lg">Admin</h2>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm lg:flex-col lg:gap-2">
          <Link href="/admin" className="hover:underline">
            Resumen
          </Link>
          <Link href="/admin/productos" className="hover:underline">
            Productos
          </Link>
          <Link href="/admin/pedidos" className="hover:underline">
            Pedidos
          </Link>
        </nav>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}