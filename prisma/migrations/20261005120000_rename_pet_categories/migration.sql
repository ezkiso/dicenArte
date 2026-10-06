UPDATE "Product" AS product
SET "categoryId" = target.id
FROM "Category" AS duplicate
JOIN "Category" AS target ON target.slug = 'cojines-de-mascotas'
WHERE duplicate.slug = 'cuadro-de-mascotas'
  AND product."categoryId" = duplicate.id;

UPDATE "Product" AS product
SET "categoryId" = target.id
FROM "Category" AS duplicate
JOIN "Category" AS target ON target.slug = 'bolsos-de-mascotas'
WHERE duplicate.slug = 'articulos-varios'
  AND product."categoryId" = duplicate.id;

DELETE FROM "Category"
WHERE slug IN ('cuadro-de-mascotas', 'articulos-varios');

UPDATE "Category"
SET name = 'Cuadro de mascota a pedido'
WHERE slug = 'cojines-de-mascotas';

UPDATE "Category"
SET name = 'Artículos varios'
WHERE slug = 'bolsos-de-mascotas';