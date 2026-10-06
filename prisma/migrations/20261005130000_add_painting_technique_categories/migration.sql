INSERT INTO "Category" ("id", "name", "slug", "parentId")
SELECT 'category-pintura-acrilica', 'Pintura Acrílica', 'pintura-acrilica', parent.id
FROM "Category" AS parent
WHERE parent.slug = 'cojines-de-mascotas'
ON CONFLICT ("slug") DO UPDATE
SET name = EXCLUDED.name, "parentId" = EXCLUDED."parentId";

INSERT INTO "Category" ("id", "name", "slug", "parentId")
SELECT 'category-impresion-canva', 'Impresión Canva', 'impresion-canva', parent.id
FROM "Category" AS parent
WHERE parent.slug = 'cojines-de-mascotas'
ON CONFLICT ("slug") DO UPDATE
SET name = EXCLUDED.name, "parentId" = EXCLUDED."parentId";

INSERT INTO "Category" ("id", "name", "slug", "parentId")
SELECT 'category-dibujo-por-cambiar', 'Dibujo (por cambiar)', 'dibujo-por-cambiar', parent.id
FROM "Category" AS parent
WHERE parent.slug = 'cojines-de-mascotas'
ON CONFLICT ("slug") DO UPDATE
SET name = EXCLUDED.name, "parentId" = EXCLUDED."parentId";