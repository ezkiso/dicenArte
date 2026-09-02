/**
 * Script de datos iniciales.
 * Ejecutar con: npm run prisma:seed
 */
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const allowedSlugs = new Set([
    "mascotas",
    "cojines-de-mascotas",
    "bolsos-de-mascotas",
  ]);

  await prisma.category.deleteMany({
    where: {
      slug: { notIn: [...allowedSlugs] },
    },
  });

  const mascotas = await prisma.category.upsert({
    where: { slug: "mascotas" },
    update: { name: "Mascotas" },
    create: {
      name: "Mascotas",
      slug: "mascotas",
    },
  });

  const cojines = await prisma.category.upsert({
    where: { slug: "cojines-de-mascotas" },
    update: { name: "Cojines de mascotas", parentId: mascotas.id },
    create: {
      name: "Cojines de mascotas",
      slug: "cojines-de-mascotas",
      parentId: mascotas.id,
    },
  });

  const bolsos = await prisma.category.upsert({
    where: { slug: "bolsos-de-mascotas" },
    update: { name: "Bolsos de mascotas", parentId: mascotas.id },
    create: {
      name: "Bolsos de mascotas",
      slug: "bolsos-de-mascotas",
      parentId: mascotas.id,
    },
  });

  await prisma.category.updateMany({
    where: { slug: { in: ["cojines-de-mascotas", "bolsos-de-mascotas"] } },
    data: { parentId: mascotas.id },
  });

  const demoProductSlugs = [
    "cojin-personalizado-perro",
    "bolso-personalizado-mascota",
  ];

  await prisma.product.deleteMany({
    where: {
      slug: { in: demoProductSlugs },
    },
  });

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