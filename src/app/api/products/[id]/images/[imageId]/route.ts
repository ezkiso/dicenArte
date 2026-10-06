import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deletePrivateFile } from "@/lib/s3";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; imageId: string } }
) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  if (!z.string().cuid().safeParse(params.id).success || !z.string().cuid().safeParse(params.imageId).success) {
    return NextResponse.json({ error: "Identificador inválido" }, { status: 400 });
  }

  const image = await prisma.productImage.findFirst({
    where: { id: params.imageId, productId: params.id },
    select: { id: true, bucketKey: true },
  });
  if (!image) {
    return NextResponse.json({ error: "Imagen no encontrada para este producto" }, { status: 404 });
  }

  try {
    await deletePrivateFile(image.bucketKey);
    await prisma.productImage.delete({ where: { id: image.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("No se pudo eliminar la imagen del producto.", error);
    return NextResponse.json({ error: "No se pudo eliminar la imagen." }, { status: 500 });
  }
}