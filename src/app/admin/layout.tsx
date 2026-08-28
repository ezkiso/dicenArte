import Link from "next/link";

// RF-18: layout compartido del panel de administración.
// El acceso ya está restringido a rol ADMIN por middleware.ts.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-6xl gap-8 px-4 py-10">
      <aside className="w-48 flex-shrink-0 border-r border-base-gray-200 pr-6">
        <h2 className="mb-4 font-display text-lg">Admin</h2>
        <nav className="flex flex-col gap-2 text-sm">
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
      <div className="flex-1">{children}</div>
    </div>
  );
}