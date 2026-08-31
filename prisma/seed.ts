/**
 * Script de datos iniciales.
 * Ejecutar con: npm run prisma:seed
 */
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Solo dos secciones principales para el catálogo
  const cojines = await prisma.category.upsert({
    where: { slug: "cojines-de-mascotas" },
    update: { name: "Cojines de mascotas" },
    create: {
      name: "Cojines de mascotas",
      slug: "cojines-de-mascotas",
    },
  });

  const bolsos = await prisma.category.upsert({
    where: { slug: "bolsos-de-mascotas" },
    update: { name: "Bolsos de mascotas" },
    create: {
      name: "Bolsos de mascotas",
      slug: "bolsos-de-mascotas",
    },
  });

  // Productos de ejemplo asociados a las dos secciones
  await prisma.product.upsert({
    where: { slug: "cojin-personalizado-perro" },
    update: {
      name: "Cojin personalizado para perro",
      description: "Cojin confeccionado a medida con el nombre de tu mascota bordado.",
      priceClp: 10990,
      stock: 12,
      isCustom: true,
      categoryId: cojines.id,
    },
    create: {
      name: "Cojin personalizado para perro",
      slug: "cojin-personalizado-perro",
      description: "Cojin confeccionado a medida con el nombre de tu mascota bordado.",
      priceClp: 10990,
      stock: 12,
      isCustom: true,
      categoryId: cojines.id,
    },
  });

  await prisma.product.upsert({
    where: { slug: "bolso-personalizado-mascota" },
    update: {
      name: "Bolso personalizado para mascota",
      description: "Bolso a medida para tu mascota con acabado personalizado.",
      priceClp: 9990,
      stock: 0,
      isCustom: true,
      categoryId: bolsos.id,
    },
    create: {
      name: "Bolso personalizado para mascota",
      slug: "bolso-personalizado-mascota",
      description: "Bolso a medida para tu mascota con acabado personalizado.",
      priceClp: 9990,
      stock: 0,
      isCustom: true,
      categoryId: bolsos.id,
    },
  });

  // hardcodeado: debe venir siempre desde las variables de entorno.
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "info@dicenarte.cl";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (!adminPassword) {
    throw new Error(
      "Falta SEED_ADMIN_PASSWORD en tu .env. Defínela antes de correr el seed."
    );
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Administrador DicenArte",
      passwordHash,
      role: Role.ADMIN,
    },
  });

  console.log("Seed completado. Admin:", adminEmail);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });