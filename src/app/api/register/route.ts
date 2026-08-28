import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { CURRENT_POLICY_VERSION } from "@/lib/utils";

// RNF-06: límite de tamaño del body para evitar abuso.
export const config = { api: { bodyParser: { sizeLimit: "1mb" } } };

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const { name, email, password, phone } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json({ error: "Ese correo ya está registrado." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { name, email: normalizedEmail, phone, passwordHash },
  });

  // RF-13: log de consentimiento con fecha/hora exacta y versión de política.
  const forwardedFor = req.headers.get("x-forwarded-for");
  await prisma.consentLog.create({
    data: {
      userId: user.id,
      policyVersion: CURRENT_POLICY_VERSION,
      ipAddress: forwardedFor?.split(",")[0]?.trim() ?? null,
    },
  });

  return NextResponse.json({ id: user.id }, { status: 201 });
}
