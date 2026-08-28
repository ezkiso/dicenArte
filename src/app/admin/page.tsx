import { prisma } from "@/lib/prisma";
import { formatClp } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const [productCount, orderCount, userCount, revenue] = await Promise.all([
    prisma.product.count(),
    prisma.order.count(),
    prisma.user.count(),
    prisma.order.aggregate({ where: { status: "PAGADA" }, _sum: { totalClp: true } }),
  ]);

  const stats = [
    { label: "Productos", value: productCount },
    { label: "Pedidos totales", value: orderCount },
    { label: "Usuarios", value: userCount },
    { label: "Ventas confirmadas", value: formatClp(revenue._sum.totalClp ?? 0) },
  ];

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl">Resumen</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="border border-base-gray-200 p-4">
            <p className="text-xs uppercase tracking-wide text-base-gray-500">{s.label}</p>
            <p className="mt-2 text-2xl font-semibold">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
