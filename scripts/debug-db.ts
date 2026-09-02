import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      parentId: true,
      _count: { select: { products: true } },
    },
  });

  console.log("CATEGORÍAS:");
  console.log(JSON.stringify(categories, null, 2));

  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      categoryId: true,
      category: { select: { name: true, slug: true } },
      images: { select: { id: true, bucketKey: true, order: true } },
    },
  });

  console.log("\nPRODUCTOS:");
  console.log(JSON.stringify(products, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
