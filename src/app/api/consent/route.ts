import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { consentSchema } from "@/lib/validations";

/**
 * RF-12 / RF-13: permite registrar la aceptación explícita de una versión de
 * política distinta a la del registro inicial (por ejemplo, si se actualizan
 * los Términos y Condiciones y se le vuelve a pedir consentimiento a un
 * usuario ya existente). Guarda fecha/hora exacta e IP.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
  }

  const body = await req.json();
  const parsed = consentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const forwardedFor = req.headers.get("x-forwarded-for");
  const log = await prisma.consentLog.create({
    data: {
      userId: session.user.id,
      policyVersion: parsed.data.policyVersion,
      ipAddress: forwardedFor?.split(",")[0]?.trim() ?? null,
    },
  });

  return NextResponse.json(log, { status: 201 });
}
