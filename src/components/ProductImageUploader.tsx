"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";

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

  return (
    <div>
      <div className="mb-4 grid grid-cols-3 gap-3">
        {existingImages
          .filter((img) => !!img.url)
          .map((img) => (
            <div key={img.id} className="relative aspect-square bg-base-gray-100">
              <Image src={img.url!} alt="" fill className="object-cover" />
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
          disabled={loading}
        />
      </label>

      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
