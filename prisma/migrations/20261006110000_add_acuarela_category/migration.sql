INSERT INTO "Category" ("id", "name", "slug", "parentId")
SELECT 'category-acuarela', 'Acuarela', 'acuarela', parent.id
FROM "Category" AS parent
WHERE parent.slug = 'cojines-de-mascotas'
ON CONFLICT ("slug") DO UPDATE
SET name = EXCLUDED.name, "parentId" = EXCLUDED."parentId";
