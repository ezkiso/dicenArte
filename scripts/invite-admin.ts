import { config } from "dotenv";
config({ path: ".env.local" });

import { prisma } from "@/lib/prisma";
import { generateSetupToken } from "@/lib/passwordSetup";
import { Resend } from "resend";

async function main() {
    const email = process.argv[2]?.toLowerCase().trim();
    if (!email) throw new Error("Uso: tsx scripts/invite-admin.ts correo@ejemplo.com");

    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!apiKey) throw new Error("Falta RESEND_API_KEY en .env.local.");
    if (!fromEmail) throw new Error("Falta RESEND_FROM_EMAIL en .env.local.");
    if (!siteUrl) throw new Error("Falta NEXT_PUBLIC_SITE_URL en .env.local.");

    const resend = new Resend(apiKey);

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

    const { error } = await resend.emails.send({
        from: `DicenArte <${fromEmail}>`,
        to: user.email,
        subject: "Crea tu contraseña de administradora",
        html: `<p>Haz clic para crear tu contraseña (válido 48h):</p>
        <a href="${siteUrl}/set-password?token=${raw}">Crear contraseña</a>`,
    });
    if (error) throw new Error(`Resend no pudo enviar la invitación: ${error.message}`);

    console.log(`Invitación enviada a ${user.email}`);
}

main()
    .catch((e) => {
        console.error(e.message);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());