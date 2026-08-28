import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { validateImageFile, MAX_UPLOAD_BYTES } from "@/lib/validations";
import { generateBucketKey, uploadPrivateFile } from "@/lib/s3";
import { prisma } from "@/lib/prisma";

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

  const formData = await req.formData();
  const file = formData.get("file");
  const productId = formData.get("productId");

  if (!(file instanceof File) || typeof productId !== "string") {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const validation = await validateImageFile(buffer);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.reason }, { status: 415 });
  }

  const key = generateBucketKey(file.name);
  await uploadPrivateFile(key, buffer, validation.mime);

  const image = await prisma.productImage.create({
    data: { productId, bucketKey: key },
  });

  return NextResponse.json(image, { status: 201 });
}
