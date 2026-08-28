import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

/**
 * RNF-07: las imágenes se suben a un bucket PRIVADO (sin acceso público) y
 * se sirven mediante URLs firmadas con expiración corta. Nunca se guarda una
 * URL pública fija en la base de datos, solo la `bucketKey`.
 */

const s3 = new S3Client({
  region: process.env.S3_REGION,
  endpoint: process.env.S3_ENDPOINT || undefined,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.S3_BUCKET_NAME!;

export function generateBucketKey(originalName: string) {
  const ext = originalName.split(".").pop();
  return `productos/${crypto.randomUUID()}.${ext}`;
}

export async function uploadPrivateFile(key: string, body: Buffer, contentType: string) {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      // Sin ACL pública: el bucket debe estar configurado como privado por defecto.
    })
  );
}

export async function getSignedImageUrl(key: string, expiresInSeconds = 60 * 15) {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
}
