/**
 * Script de datos iniciales.
 * Ejecutar con: npm run prisma:seed
 */
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("El seed destructivo está bloqueado en producción.");
  }

  if (process.env.SEED_ALLOW_DESTRUCTIVE !== "true") {
    throw new Error(
      "Define SEED_ALLOW_DESTRUCTIVE=true para permitir que el seed elimine datos demo."
    );
  }

  const demoProductSlugs = [
    "cojin-personalizado-perro",
    "bolso-personalizado-mascota",
  ];

  await prisma.product.deleteMany({
    where: {
      slug: { in: demoProductSlugs },
    },
  });

  const allowedSlugs = new Set([
    "mascotas",
    "cojines-de-mascotas",
    "bolsos-de-mascotas",
    "pintura-acrilica",
    "impresion-canva",
    "dibujo-por-cambiar",
    "acuarela",
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
    update: { name: "Cuadro de mascota a pedido", parentId: mascotas.id },
    create: {
      name: "Cuadro de mascota a pedido",
      slug: "cojines-de-mascotas",
      parentId: mascotas.id,
    },
  });

  await prisma.category.upsert({
    where: { slug: "pintura-acrilica" },
    update: { name: "Pintura Acrílica", parentId: cojines.id },
    create: {
      name: "Pintura Acrílica",
      slug: "pintura-acrilica",
      parentId: cojines.id,
    },
  });

  await prisma.category.upsert({
    where: { slug: "impresion-canva" },
    update: { name: "Impresión Canva", parentId: cojines.id },
    create: {
      name: "Impresión Canva",
      slug: "impresion-canva",
      parentId: cojines.id,
    },
  });

  await prisma.category.upsert({
    where: { slug: "dibujo-por-cambiar" },
    update: { name: "Dibujo (por cambiar)", parentId: cojines.id },
    create: {
      name: "Dibujo (por cambiar)",
      slug: "dibujo-por-cambiar",
      parentId: cojines.id,
    },
  });

  await prisma.category.upsert({
    where: { slug: "acuarela" },
    update: { name: "Acuarela", parentId: cojines.id },
    create: {
      name: "Acuarela",
      slug: "acuarela",
      parentId: cojines.id,
    },
  });

  const bolsos = await prisma.category.upsert({
    where: { slug: "bolsos-de-mascotas" },
    update: { name: "Artículos varios", parentId: mascotas.id },
    create: {
      name: "Artículos varios",
      slug: "bolsos-de-mascotas",
      parentId: mascotas.id,
    },
  });

  await prisma.category.updateMany({
    where: { slug: { in: ["cojines-de-mascotas", "bolsos-de-mascotas"] } },
    data: { parentId: mascotas.id },
  });

  const adminEmail = process.env.SEED_ADMIN_EMAIL?.toLowerCase().trim();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error(
      "Faltan SEED_ADMIN_EMAIL o SEED_ADMIN_PASSWORD en tu .env. Defínelas antes de correr el seed."
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