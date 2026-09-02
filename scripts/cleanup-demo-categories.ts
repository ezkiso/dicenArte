import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const categorySlugs = ["mascotas", "arneses", "cuadros-decorativos"];
const productSlugs = ["cojin-personalizado-perro", "bolso-personalizado-mascota"];

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("La limpieza de datos demo está bloqueada en producción.");
  }

  if (process.env.SEED_ALLOW_DESTRUCTIVE !== "true") {
    throw new Error(
      "Define SEED_ALLOW_DESTRUCTIVE=true para permitir la limpieza de datos demo."
    );
  }

  const existingCategories = await prisma.category.findMany({
    where: { slug: { in: categorySlugs } },
    select: { id: true, name: true, slug: true },
  });

  const existingProducts = await prisma.product.findMany({
    where: { slug: { in: productSlugs } },
    select: { id: true, name: true, slug: true },
  });

  if (existingCategories.length === 0 && existingProducts.length === 0) {
    console.log("No hay categorías ni productos demo para limpiar.");
    return;
  }

  console.log("Categorías encontradas:", existingCategories);
  console.log("Productos demo encontrados:", existingProducts);

  await prisma.product.deleteMany({
    where: { slug: { in: productSlugs } },
  });

  const deletedCategories = await prisma.category.deleteMany({
    where: { slug: { in: categorySlugs } },
  });

  console.log(`Se eliminaron ${deletedCategories.count} categorías.`);
  console.log(`Se eliminaron ${existingProducts.length} productos demo.`);
}

main()
  .catch((error) => {
    console.error("Error al limpiar categorías demo:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
