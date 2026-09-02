import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { validateImageFile, MAX_UPLOAD_BYTES } from "@/lib/validations";
import { generateBucketKey, uploadPrivateFile, deletePrivateFile } from "@/lib/s3";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// RF-02 / RNF-05 / RNF-06 / RNF-07: solo admin sube imágenes de productos;
// se valida el tamaño y los magic bytes reales del archivo antes de subirlo
// a un bucket privado.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (contentLength > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Archivo demasiado grande (máx. 5MB)" }, { status: 413 });
  }

  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Formulario inválido" }, { status: 400 });
  }
  const file = formData.get("file");
  const productId = formData.get("productId");

  if (!(file instanceof File) || typeof productId !== "string") {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  if (!z.string().cuid().safeParse(productId).success) {
    return NextResponse.json({ error: "Producto inválido" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
  if (!product) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const validation = await validateImageFile(buffer);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.reason }, { status: 415 });
  }

  const key = generateBucketKey(file.name);
  await uploadPrivateFile(key, buffer, validation.mime);

  let image;
  try {
    image = await prisma.productImage.create({ data: { productId, bucketKey: key } });
  } catch (error) {
    await deletePrivateFile(key).catch(() => undefined);
    throw error;
  }

  return NextResponse.json(image, { status: 201 });
}
