import { config } from "dotenv";
config({ path: ".env.local" });

import { prisma } from "@/lib/prisma";
import { generateSetupToken } from "@/lib/passwordSetup";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;

async function main() {
    const email = process.argv[2]?.toLowerCase().trim();
    if (!email) throw new Error("Uso: tsx scripts/invite-admin.ts correo@ejemplo.com");

    const existingAdmin = await prisma.user.findFirst({
        where: { role: "ADMIN", email: { not: email } },
    });
    if (existingAdmin) {
        throw new Error(
        `Ya existe una administradora (${existingAdmin.email}). Solo puede haber una. ` +
        `Si quieres reemplazarla, bórrala primero desde Prisma Studio.`
        );
    }

    const { raw, hash } = generateSetupToken();
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 48); // 48h

    const user = await prisma.user.upsert({
        where: { email },
        update: { passwordSetupTokenHash: hash, passwordSetupExpires: expires, role: "ADMIN" },
        create: { email, role: "ADMIN", passwordSetupTokenHash: hash, passwordSetupExpires: expires },
    });

    await resend.emails.send({
        from: "DicenArte <no-reply@dicenarte.cl>",
        to: user.email,
        subject: "Crea tu contraseña de administradora",
        html: `<p>Haz clic para crear tu contraseña (válido 48h):</p>
        <a href="${siteUrl}/set-password?token=${raw}">Crear contraseña</a>`,
    });

    console.log(`Invitación enviada a ${user.email}`);
}

main()
    .catch((e) => {
        console.error(e.message);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());