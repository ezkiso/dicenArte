import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/passwordSetup";
import { z } from "zod";

const schema = z.object({
    token: z.string().min(1),
    password: z.string().min(8, "Mínimo 8 caracteres"),
});

export async function POST(req: NextRequest) {
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
        return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const tokenHash = hashToken(parsed.data.token);
    const user = await prisma.user.findFirst({
        where: { passwordSetupTokenHash: tokenHash, passwordSetupExpires: { gt: new Date() } },
    });
    if (!user) {
        return NextResponse.json({ error: "Link inválido o expirado" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash, passwordSetupTokenHash: null, passwordSetupExpires: null },
    });

    return NextResponse.json({ ok: true });
}