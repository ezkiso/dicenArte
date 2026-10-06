"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { Trash2 } from "lucide-react";

export default function ProductImageUploader({
  productId,
  existingImages,
}: {
  productId: string;
  existingImages: { id: string; url?: string }[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("productId", productId);

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo subir la imagen.");
      return;
    }

    router.refresh();
  }

  async function handleDelete(imageId: string) {
    if (!confirm("¿Eliminar esta imagen del producto? Esta acción no se puede deshacer.")) return;

    setError(null);
    setDeletingImageId(imageId);
    try {
      const response = await fetch(`/api/products/${productId}/images/${imageId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error ?? "No se pudo eliminar la imagen.");
        return;
      }

      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor. Inténtalo nuevamente.");
    } finally {
      setDeletingImageId(null);
    }
  }

  return (
    <div>
      <div className="mb-4 grid grid-cols-3 gap-3">
        {existingImages
          .filter((img) => !!img.url)
          .map((img) => (
            <div key={img.id} className="relative aspect-square bg-base-gray-100">
              <Image src={img.url!} alt="" fill className="object-cover" />
              <button
                type="button"
                aria-label="Eliminar imagen"
                title="Eliminar imagen"
                onClick={() => handleDelete(img.id)}
                disabled={deletingImageId !== null || loading}
                className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center bg-base-black text-base-white shadow disabled:opacity-50"
              >
                <Trash2 size={17} aria-hidden="true" />
              </button>
            </div>
          ))}
      </div>

      <label className="inline-block cursor-pointer border border-base-gray-300 px-4 py-2 text-sm">
        {loading ? "Subiendo…" : "Subir imagen (JPG/PNG/WEBP, máx. 5MB)"}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleUpload}
          disabled={loading || deletingImageId !== null}
        />
      </label>

      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
