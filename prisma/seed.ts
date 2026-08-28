/**
 * Script de datos iniciales.
 * Ejecutar con: npm run prisma:seed
 */
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Categorías jerárquicas de ejemplo (RF-04)
  const mascotas = await prisma.category.upsert({
    where: { slug: "mascotas" },
    update: {},
    create: { name: "Mascotas", slug: "mascotas" },
  });

  const arneses = await prisma.category.upsert({
    where: { slug: "arneses" },
    update: {},
    create: { name: "Arneses", slug: "arneses", parentId: mascotas.id },
  });

  const cuadros = await prisma.category.upsert({
    where: { slug: "cuadros-decorativos" },
    update: {},
    create: { name: "Cuadros decorativos", slug: "cuadros-decorativos", parentId: mascotas.id },
  });

  // Producto de ejemplo
  await prisma.product.upsert({
    where: { slug: "arnes-personalizado-perro" },
    update: {},
    create: {
      name: "Arnés personalizado para perro",
      slug: "arnes-personalizado-perro",
      description: "Arnés confeccionado a medida con el nombre de tu mascota bordado.",
      priceClp: 19990,
      stock: 12,
      isCustom: true,
      categoryId: arneses.id,
    },
  });

  await prisma.product.upsert({
    where: { slug: "cuadro-retrato-mascota" },
    update: {},
    create: {
      name: "Cuadro retrato de mascota",
      slug: "cuadro-retrato-mascota",
      description: "Ilustración personalizada de tu mascota en formato cuadro decorativo.",
      priceClp: 24990,
      stock: 0, // producto agotado de ejemplo (RF-05)
      isCustom: true,
      categoryId: cuadros.id,
    },
  });

  // Usuario admin inicial. CAMBIAR la contraseña apenas se despliegue en producción.
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@dicenarte.cl";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "CambiarPassword123!";
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
