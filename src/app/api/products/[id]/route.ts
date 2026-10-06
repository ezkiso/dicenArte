import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";

async function getUniqueSlug(name: string, excludeId: string) {
  const base = slugify(name) || "producto";
  let candidate = base;
  let suffix = 2;

  while (
    await prisma.product.findFirst({
      where: { slug: candidate, NOT: { id: excludeId } },
    })
  ) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === "ADMIN";
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: { images: true, category: true },
  });
  if (!product) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(product);
}

// RF-02: actualizar producto (solo admin)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = productSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  if (parsed.data.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: parsed.data.categoryId },
      select: { id: true },
    });
    if (!category) {
      return NextResponse.json(
        { error: "La categoría seleccionada no es válida." },
        { status: 400 }
      );
    }
  }

  const existing = await prisma.product.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const data = { ...parsed.data };
  if (data.slug === "") {
    data.slug = await getUniqueSlug(data.name ?? existing.name, params.id);
  }

  const product = await prisma.product.update({ where: { id: params.id }, data });
  return NextResponse.json(product);
}

// RF-02: eliminar producto (solo admin)
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    await prisma.product.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003") {
        return NextResponse.json(
          {
            error:
              "No se puede eliminar porque este producto está asociado a pedidos. Puedes editarlo y dejar el stock en 0 para retirarlo de la tienda sin borrar su historial.",
          },
          { status: 409 }
        );
      }

      if (error.code === "P2025") {
        return NextResponse.json({ error: "El producto ya no existe." }, { status: 404 });
      }
    }

    console.error("No se pudo eliminar el producto.", error);
    return NextResponse.json({ error: "No se pudo eliminar el producto." }, { status: 500 });
  }
}
