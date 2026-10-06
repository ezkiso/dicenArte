import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";

async function getUniqueSlug(name: string) {
  const base = slugify(name) || "producto";
  let candidate = base;
  let suffix = 2;

  while (await prisma.product.findUnique({ where: { slug: candidate } })) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

// Lectura pública (usada por la tienda / admin listado)
export async function GET() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { category: true, images: true },
  });
  return NextResponse.json(products);
}

// RF-02: creación de productos solo accesible para administradores.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const { slug, ...productData } = parsed.data;
  const category = await prisma.category.findUnique({
    where: { id: productData.categoryId },
    select: { id: true },
  });
  if (!category) {
    return NextResponse.json({ error: "La categoría seleccionada no es válida." }, { status: 400 });
  }

  const product = await prisma.product.create({
    data: { ...productData, slug: slug || (await getUniqueSlug(parsed.data.name)) },
  });
  return NextResponse.json(product, { status: 201 });
}
