"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  children: { id: string; name: string; slug: string }[];
}

interface ProductFormValues {
  id?: string;
  name: string;
  slug: string;
  description: string;
  priceClp: number | "" | null;
  stock: number | "";
  isCustom: boolean;
  categoryId: string;
}

// RF-02: formulario único usado para crear y editar productos.
export default function AdminProductForm({
  categories,
  initial,
}: {
  categories: CategoryOption[];
  initial?: ProductFormValues;
}) {
  const router = useRouter();
  const [selectedMainCategoryId, setSelectedMainCategoryId] = useState(() => {
    const initialCategory = categories.find(
      (category) =>
        category.id === initial?.categoryId ||
        category.children.some((child) => child.id === initial?.categoryId)
    );
    return initialCategory?.id ?? "";
  });
  const initialMainCategory = categories.find(
    (category) =>
      category.id === initial?.categoryId ||
      category.children.some((child) => child.id === initial?.categoryId)
  );
  const [values, setValues] = useState<ProductFormValues>(() =>
    initial
      ? {
          ...initial,
          categoryId:
            initialMainCategory?.children.length &&
            initial.categoryId === initialMainCategory.id
              ? ""
              : initial.categoryId,
        }
      : {
      name: "",
      slug: "",
      description: "",
      priceClp: "",
      stock: 0,
      isCustom: true,
      categoryId: "",
        }
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [createdProductId, setCreatedProductId] = useState<string | null>(null);

  const isEdit = Boolean(initial?.id);
  const selectedMainCategory = categories.find(
    (category) => category.id === selectedMainCategoryId
  );
  const hasSubcategories = Boolean(selectedMainCategory?.children.length);
  const canSaveCategory = Boolean(values.categoryId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const productId = initial?.id ?? createdProductId;
      const res = await fetch(productId ? `/api/products/${productId}` : "/api/products", {
        method: productId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          priceClp: values.priceClp === "" || values.priceClp === null ? null : Number(values.priceClp),
          stock: Number(values.stock),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "No se pudo guardar el producto.");
        return;
      }

      const savedProduct = await res.json();
      const savedProductId = productId ?? savedProduct.id;
      if (!savedProductId) {
        setError("El producto se guardó, pero no se pudo confirmar su identificador.");
        return;
      }

      if (!productId && !isEdit) setCreatedProductId(savedProductId);

      if (selectedImage && !isEdit) {
        const imageData = new FormData();
        imageData.append("file", selectedImage);
        imageData.append("productId", savedProductId);

        const imageResponse = await fetch("/api/upload", {
          method: "POST",
          body: imageData,
        });
        if (!imageResponse.ok) {
          const imageError = await imageResponse.json().catch(() => ({}));
          setError(
            `El producto se guardó, pero no se pudo subir la imagen: ${imageError.error ?? "inténtalo nuevamente"}. Vuelve a pulsar para reintentar sin crear otro producto.`
          );
          return;
        }
        setSelectedImage(null);
      }

      router.push("/admin/productos");
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor. Inténtalo nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">Nombre</label>
        <input
          required
          placeholder="Ej.: Cojín personalizado de perro"
          value={values.name}
          onChange={(e) => setValues({ ...values, name: e.target.value })}
          className="w-full border border-base-gray-300 p-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Slug (URL, opcional)</label>
        <input
          pattern="(?:[a-z0-9]|-)+"
          placeholder="Se generará desde el nombre si lo dejas vacío"
          value={values.slug}
          onChange={(e) => setValues({ ...values, slug: e.target.value })}
          className="w-full border border-base-gray-300 p-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Descripción</label>
        <textarea
          required
          rows={4}
          placeholder="Describe materiales, tamaño, personalización y cuidados del producto."
          value={values.description}
          onChange={(e) => setValues({ ...values, description: e.target.value })}
          className="w-full border border-base-gray-300 p-2 text-sm"
        />
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium">Precio (CLP, opcional)</label>
          <input
            type="number"
            min={1}
            value={values.priceClp ?? ""}
            placeholder="Ej.: 19990"
            onChange={(e) =>
              setValues({
                ...values,
                priceClp: e.target.value === "" ? "" : Number(e.target.value),
              })
            }
            className="w-full border border-base-gray-300 p-2 text-sm"
          />
          <p className="mt-1 text-xs text-base-gray-600">
            El precio es independiente del stock. Sin precio no se podrá comprar; con stock 0 se mostrará como vendido.
          </p>
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium">Stock</label>
          <input
            type="number"
            required
            min={0}
            value={values.stock}
            placeholder="Ej.: 10"
            onFocus={() => values.stock === 0 && setValues({ ...values, stock: "" })}
            onBlur={() => values.stock === "" && setValues({ ...values, stock: 0 })}
            onChange={(e) =>
              setValues({
                ...values,
                stock: e.target.value === "" ? "" : Number(e.target.value),
              })
            }
            className="w-full border border-base-gray-300 p-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label htmlFor="main-category" className="mb-1 block text-sm font-medium">
          Categoría
        </label>
        <select
          id="main-category"
          required
          value={selectedMainCategoryId}
          onChange={(e) => {
            const category = categories.find((item) => item.id === e.target.value);
            setSelectedMainCategoryId(e.target.value);
            setValues({
              ...values,
              categoryId: category?.children.length ? "" : category?.id ?? "",
            });
          }}
          className="w-full border border-base-gray-300 p-2 text-sm"
        >
          <option value="" disabled>
            Selecciona una categoría
          </option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {hasSubcategories && selectedMainCategory && (
        <div>
          <label htmlFor="product-subcategory" className="mb-1 block text-sm font-medium">
            {selectedMainCategory.slug === "cojines-de-mascotas"
              ? "Tipo de pintura"
              : "Subcategoría"}
          </label>
          <select
            id="product-subcategory"
            required
            value={values.categoryId}
            onChange={(e) => setValues({ ...values, categoryId: e.target.value })}
            className="w-full border border-base-gray-300 p-2 text-sm"
          >
            <option value="" disabled>
              {selectedMainCategory.slug === "cojines-de-mascotas"
                ? "Selecciona un tipo de pintura"
                : "Selecciona una subcategoría"}
            </option>
            {selectedMainCategory.children.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={values.isCustom}
          onChange={(e) => setValues({ ...values, isCustom: e.target.checked })}
        />
        Producto personalizado (sin derecho a retracto)
      </label>

      {!isEdit && (
        <div>
          <label htmlFor="new-product-image" className="mb-1 block text-sm font-medium">
            Imagen del producto (opcional)
          </label>
          <input
            id="new-product-image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={loading}
            onChange={(event) => setSelectedImage(event.target.files?.[0] ?? null)}
            className="block w-full text-sm file:mr-3 file:border file:border-base-gray-300 file:bg-base-page file:px-3 file:py-2"
          />
          <p className="mt-1 text-xs text-base-gray-600">
            JPG, PNG o WEBP; máximo 5 MB.
            {selectedImage ? ` Seleccionada: ${selectedImage.name}` : ""}
          </p>
        </div>
      )}

      {error && <p className="text-sm text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={loading || !canSaveCategory}
        className="bg-base-black px-6 py-3 text-sm font-semibold text-base-white disabled:opacity-50"
      >
        {loading
          ? selectedImage ? "Guardando producto e imagen…" : "Guardando…"
          : isEdit
            ? "Guardar cambios"
            : createdProductId && selectedImage
              ? "Reintentar subida"
              : "Crear producto"}
      </button>
    </form>
  );
}
