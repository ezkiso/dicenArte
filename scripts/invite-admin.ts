import { config } from "dotenv";
config({ path: ".env", override: true });

import type { PrismaClient } from "@prisma/client";
import { generateSetupToken } from "@/lib/passwordSetup";
import { Resend } from "resend";

let prismaClient: PrismaClient | undefined;

async function main() {
    const email = process.argv[2]?.toLowerCase().trim();
    if (!email) throw new Error("Uso: tsx scripts/invite-admin.ts correo@ejemplo.com");

    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!apiKey) throw new Error("Falta RESEND_API_KEY en .env.");
    if (!fromEmail) throw new Error("Falta RESEND_FROM_EMAIL en .env.");
    if (!siteUrl) throw new Error("Falta NEXT_PUBLIC_SITE_URL en .env.");
    if (fromEmail.toLowerCase().endsWith("@resend.dev")) {
        throw new Error(
            "RESEND_FROM_EMAIL sigue usando el remitente de prueba. Verifica dicenarte.cl en Resend y configura un remitente de ese dominio antes de invitar a otra persona."
        );
    }

    const resend = new Resend(apiKey);
    const { prisma } = await import("@/lib/prisma");
    prismaClient = prisma;

    const previousUser = await prisma.user.findUnique({ where: { email } });

    const existingAdmin = await prisma.user.findFirst({
        where: { role: "ADMIN", email: { not: email } },
    });
    if (existingAdmin) {
        throw new Error(
        `Ya existe una administradora (${existingAdmin.email}). Solo puede haber una. ` +
        `Para transferir el acceso, cambia primero su rol a CLIENTE en la base correcta. ` +
        `No borres la cuenta si necesitas conservar su historial.`
        );
    }

    const { raw, hash } = generateSetupToken();
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 48); // 48h

    const user = await prisma.user.upsert({
        where: { email },
        update: { passwordSetupTokenHash: hash, passwordSetupExpires: expires, role: "ADMIN" },
        create: { email, role: "ADMIN", passwordSetupTokenHash: hash, passwordSetupExpires: expires },
    });

    try {
        const { error } = await resend.emails.send({
            from: `DicenArte <${fromEmail}>`,
            to: user.email,
            subject: "Crea tu contraseña de administradora",
            html: `<p>Haz clic para crear tu contraseña (válido 48h):</p>
            <a href="${siteUrl}/set-password?token=${raw}">Crear contraseña</a>`,
        });
        if (error) throw new Error(`Resend no pudo enviar la invitación: ${error.message}`);
    } catch (error) {
        try {
            if (previousUser) {
                await prisma.user.update({
                    where: { email },
                    data: {
                        role: previousUser.role,
                        passwordSetupTokenHash: previousUser.passwordSetupTokenHash,
                        passwordSetupExpires: previousUser.passwordSetupExpires,
                    },
                });
            } else {
                await prisma.user.delete({ where: { email } });
            }
        } catch (rollbackError) {
            console.error("No se pudo restaurar el usuario después del fallo del correo.", rollbackError);
        }
        throw error;
    }

    console.log(`Invitación enviada a ${user.email}`);
}

main()
    .catch((e) => {
        console.error(e.message);
        process.exit(1);
    })
    .finally(() => prismaClient?.$disconnect());