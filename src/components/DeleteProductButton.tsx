"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteProductButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!confirm("¿Eliminar este producto? Esta acción no se puede deshacer.")) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        setError(result.error ?? "No se pudo eliminar el producto.");
        return;
      }

      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor. Inténtalo nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        onClick={handleDelete}
        disabled={loading}
        className="text-sm text-base-gray-600 hover:text-base-black hover:underline disabled:opacity-50"
      >
        {loading ? "Eliminando..." : "Eliminar"}
      </button>
      {error && (
        <span role="alert" className="max-w-64 text-left text-xs text-base-gray-700">
          {error}
        </span>
      )}
    </span>
  );
}
