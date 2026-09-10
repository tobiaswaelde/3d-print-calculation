PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Filament" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "manufacturerId" TEXT NOT NULL,
  "material" TEXT NOT NULL,
  "colorName" TEXT NOT NULL,
  "colorHex" TEXT NOT NULL DEFAULT '#FFFFFF',
  "purchasePrice" DECIMAL NOT NULL,
  "netWeightGrams" DECIMAL NOT NULL,
  "note" TEXT,
  "archivedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Filament_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "Manufacturer"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "new_Filament" (
  "id",
  "name",
  "manufacturerId",
  "material",
  "colorName",
  "colorHex",
  "purchasePrice",
  "netWeightGrams",
  "note",
  "archivedAt",
  "createdAt",
  "updatedAt"
)
SELECT
  "Filament"."id",
  "Manufacturer"."name" || ' ' || "Filament"."material" || ' - ' || COALESCE(NULLIF(trim("Filament"."color"), ''), 'Unknown'),
  "Filament"."manufacturerId",
  "Filament"."material",
  COALESCE(NULLIF(trim("Filament"."color"), ''), 'Unknown'),
  CASE
    WHEN length(trim("Filament"."color")) = 7 AND trim("Filament"."color") GLOB '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]'
      THEN upper(trim("Filament"."color"))
    ELSE '#FFFFFF'
  END,
  "Filament"."purchasePrice",
  "Filament"."netWeightGrams",
  "Filament"."note",
  "Filament"."archivedAt",
  "Filament"."createdAt",
  "Filament"."updatedAt"
FROM "Filament"
JOIN "Manufacturer" ON "Manufacturer"."id" = "Filament"."manufacturerId";

DROP TABLE "Filament";
ALTER TABLE "new_Filament" RENAME TO "Filament";
CREATE INDEX "Filament_name_idx" ON "Filament"("name");
CREATE INDEX "Filament_manufacturerId_idx" ON "Filament"("manufacturerId");
CREATE INDEX "Filament_material_idx" ON "Filament"("material");
CREATE INDEX "Filament_archivedAt_idx" ON "Filament"("archivedAt");

PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
