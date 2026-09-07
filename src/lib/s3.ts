import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

/**
 * RNF-07: las imágenes se suben a un bucket PRIVADO (sin acceso público) y
 * se sirven mediante URLs firmadas con expiración corta. Nunca se guarda una
 * URL pública fija en la base de datos, solo la `bucketKey`.
 */

const S3_REGION = process.env.S3_REGION || "auto";
const S3_BUCKET = process.env.S3_BUCKET_NAME || "";
let cachedS3Client: S3Client | null | undefined;

function getS3Client() {
  if (cachedS3Client !== undefined) {
    return cachedS3Client;
  }

  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  const bucket = process.env.S3_BUCKET_NAME;

  if (!bucket || !accessKeyId || !secretAccessKey) {
    cachedS3Client = null;
    return null;
  }

  cachedS3Client = new S3Client({
    region: S3_REGION,
    endpoint: process.env.S3_ENDPOINT || undefined,
    responseChecksumValidation: "WHEN_REQUIRED",
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return cachedS3Client;
}

export function generateBucketKey(originalName: string) {
  const ext = originalName.split(".").pop();
  return `productos/${crypto.randomUUID()}.${ext}`;
}

export async function uploadPrivateFile(key: string, body: Buffer, contentType: string) {
  const s3 = getS3Client();

  if (!s3 || !S3_BUCKET) {
    throw new Error("Configuración de S3 no disponible. Revisa las variables de entorno de Vercel.");
  }

  await s3.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      // Sin ACL pública: el bucket debe estar configurado como privado por defecto.
    })
  );
}

export async function deletePrivateFile(key: string) {
  const s3 = getS3Client();
  if (!s3 || !S3_BUCKET) return;
  await s3.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key }));
}

export async function getSignedImageUrl(key: string, expiresInSeconds = 60 * 15) {
  const s3 = getS3Client();

  if (!s3 || !S3_BUCKET || !key) {
    return undefined;
  }

  const command = new GetObjectCommand({ Bucket: S3_BUCKET, Key: key });
  return getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
}
